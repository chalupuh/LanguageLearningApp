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
    const [{ getDb }, { learnerProgress }] = await Promise.all([import("../../../db"), import("../../../db/schema")]);
    const records = await getDb().select({ email: learnerProgress.email, state: learnerProgress.state }).from(learnerProgress);
    return Response.json(collectFeedbackNotes(records), { headers });
  } catch {
    return Response.json({ error: "Feedback notes could not be loaded. Your notes have not been changed. Try Refresh again." }, { status: 503, headers });
  }
}
