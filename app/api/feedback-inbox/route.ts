import { getDb } from "../../../db";
import { learnerProgress } from "../../../db/schema";
import { authorizeAppRequest } from "../app-auth";

type StoredNote = { id?: unknown; createdAt?: unknown; kind?: unknown; text?: unknown; resolved?: unknown };

export async function GET(request: Request) {
  const auth = authorizeAppRequest(request);
  if (!auth.identity) return Response.json({ error: "Access denied." }, { status: auth.status });
  const ownerEmail = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
  if (!ownerEmail || auth.identity.email?.toLowerCase() !== ownerEmail) {
    return Response.json({ error: "Owner access is required." }, { status: 403 });
  }
  try {
    const records = await getDb().select({ email: learnerProgress.email, state: learnerProgress.state }).from(learnerProgress);
    const notes = records.flatMap(record => {
      let state: { feedbackNotes?: StoredNote[] } = {};
      try { state = JSON.parse(record.state); } catch { return []; }
      if (!Array.isArray(state.feedbackNotes)) return [];
      return state.feedbackNotes.flatMap(note => typeof note.text === "string" ? [{
        id: String(note.id ?? ""), createdAt: String(note.createdAt ?? ""), kind: note.kind === "bug" ? "bug" : "idea",
        text: note.text, resolved: Boolean(note.resolved), submittedBy: record.email,
      }] : []);
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Response.json({ notes });
  } catch {
    return Response.json({ error: "Feedback notes are temporarily unavailable." }, { status: 503 });
  }
}

