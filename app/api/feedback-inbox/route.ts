import { authorizeAppRequest } from "../app-auth";
import { collectFeedbackNotes } from "../../../lib/feedback-notes";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const auth = authorizeAppRequest(request);
  if (!auth.identity) return Response.json({ error: "Sign in with your invited owner account to read feedback." }, { status: auth.status, headers });
  const ownerEmail = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
  if (!ownerEmail || auth.identity.email?.toLowerCase() !== ownerEmail) {
    return Response.json({ error: "Owner access is required. Switch to the app owner’s ChatGPT account." }, { status: 403, headers });
  }
  try {
    const [{ getDb }, { learnerProgress, feedbackResolutions }] = await Promise.all([import("../../../db"), import("../../../db/schema")]);
    const db = getDb();
    const records = await db.select({ userId: learnerProgress.userId, email: learnerProgress.email, state: learnerProgress.state }).from(learnerProgress);
    const result = collectFeedbackNotes(records);
    const resolutions = await db.select().from(feedbackResolutions);
    for (const note of result.notes) {
      const resolution = resolutions.find(item => item.userId === note.userId && item.noteId === note.id);
      if (resolution) { note.resolved = resolution.handled; note.implementationMessage = resolution.message; }
    }
    return Response.json(result, { headers });
  } catch {
    return Response.json({ error: "Feedback notes could not be loaded. Your notes have not been changed. Try Refresh again." }, { status: 503, headers });
  }
}

export async function PATCH(request: Request) {
  const auth = authorizeAppRequest(request);
  if (!auth.identity) return Response.json({ error: "Sign in to manage feedback." }, { status: auth.status, headers });
  const ownerEmail = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
  if (!ownerEmail || auth.identity.email !== ownerEmail) return Response.json({ error: "Owner access is required." }, { status: 403, headers });
  if (request.headers.get("Origin") && request.headers.get("Origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin." }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.userId !== "string" || !body.userId || body.userId.length > 200 || typeof body.noteId !== "string" || !body.noteId || body.noteId.length > 200 || typeof body.handled !== "boolean" || typeof body.message !== "string" || body.message.length > 600 || (body.handled && !body.message.trim())) return Response.json({ error: "Choose a request and include a short implementation message (up to 600 characters)." }, { status: 400, headers });
  try {
    const [{ getDb }, { learnerProgress, feedbackResolutions }, { eq, ne }] = await Promise.all([import("../../../db"), import("../../../db/schema"), import("drizzle-orm")]);
    const db = getDb();
    const records = await db.select().from(learnerProgress).where(eq(learnerProgress.userId, body.userId));
    const note = collectFeedbackNotes(records).notes.find(item => item.id === body.noteId);
    if (!note) return Response.json({ error: "This request no longer exists. Refresh the inbox." }, { status: 404, headers });
    const update = { handled: body.handled, noteText: note.text, message: body.message.trim(), updatedAt: Date.now(), seenAt: null };
    // Repeated clicks/retries on the same status must not create new unread notices.
    await db.insert(feedbackResolutions).values({ userId: body.userId, noteId: body.noteId, ...update }).onConflictDoUpdate({ target: [feedbackResolutions.userId, feedbackResolutions.noteId], set: update, setWhere: ne(feedbackResolutions.handled, body.handled) });
    return Response.json({ handled: body.handled }, { headers });
  } catch { return Response.json({ error: "Could not update this request. Please retry." }, { status: 503, headers }); }
}
