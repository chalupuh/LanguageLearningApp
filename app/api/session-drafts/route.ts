import { authorizeAppRequest } from "../app-auth";
import { validDraft, validDraftSource } from "../../../lib/session-drafts";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const auth = authorizeAppRequest(request);
  if (!auth.identity) return Response.json({ error: "Sign in to restore practice." }, { status: auth.status, headers });
  const source = new URL(request.url).searchParams.get("source");
  if (source && !validDraftSource(source)) return Response.json({ error: "Invalid passage." }, { status: 400, headers });
  try {
    const [{ getDb }, { sessionDrafts }, { eq, and, desc }] = await Promise.all([import("../../../db"), import("../../../db/schema"), import("drizzle-orm")]);
    const rows = await getDb().select().from(sessionDrafts).where(source ? and(eq(sessionDrafts.userId, auth.identity.userId), eq(sessionDrafts.source, source)) : eq(sessionDrafts.userId, auth.identity.userId)).orderBy(desc(sessionDrafts.updatedAt)).limit(source ? 1 : 100);
    return Response.json({ userId: auth.identity.userId, drafts: rows.map(row => ({ source: row.source, state: JSON.parse(row.state), revision: row.revision, updatedAt: row.updatedAt })) }, { headers });
  } catch { return Response.json({ error: "Practice recovery is unavailable. Please retry." }, { status: 503, headers }); }
}
export async function PUT(request: Request) {
  const auth = authorizeAppRequest(request);
  if (!auth.identity) return Response.json({ error: "Sign in to save practice." }, { status: auth.status, headers });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin." }, { status: 403, headers });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 260000) return Response.json({ error: "This transcript is too large to save. Use a shorter excerpt." }, { status: 413, headers });
  let body;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "Invalid draft." }, { status: 400, headers }); }
  if (!validDraftSource(body?.source) || !validDraft(body?.state) || !Number.isSafeInteger(body?.revision) || body.revision < 0) return Response.json({ error: "Invalid practice draft." }, { status: 400, headers });
  try {
    const [{ getDb }, { sessionDrafts }, { eq, and }] = await Promise.all([import("../../../db"), import("../../../db/schema"), import("drizzle-orm")]);
    const db = getDb(), revision = body.revision + 1, updatedAt = Date.now();
    const values = { state: JSON.stringify(body.state), revision, updatedAt };
    // Compare-and-swap: stale tabs cannot overwrite a newer device's draft.
    const rows = body.revision === 0
      ? await db.insert(sessionDrafts).values({ userId: auth.identity.userId, source: body.source, ...values }).onConflictDoNothing().returning({ revision: sessionDrafts.revision })
      : await db.update(sessionDrafts).set(values).where(and(eq(sessionDrafts.userId, auth.identity.userId), eq(sessionDrafts.source, body.source), eq(sessionDrafts.revision, body.revision))).returning({ revision: sessionDrafts.revision });
    if (!rows.length) return Response.json({ error: "A newer saved session exists. Reload its saved version before continuing." }, { status: 409, headers });
    return Response.json({ revision, updatedAt }, { headers });
  } catch { return Response.json({ error: "Not synced yet. Your draft remains on this device." }, { status: 503, headers }); }
}
