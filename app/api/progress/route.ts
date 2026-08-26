import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { learnerProgress } from "../../../db/schema";

function identity(request: Request) {
  const url = new URL(request.url);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const userId = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email");
  if (!userId && !local) return null;
  return { userId: userId ?? "local-development", email };
}

export async function GET(request: Request) {
  const user = identity(request);
  if (!user) return Response.json({ error: "Sign in to sync progress." }, { status: 401 });
  try {
    const [record] = await getDb().select().from(learnerProgress).where(eq(learnerProgress.userId, user.userId)).limit(1);
    return Response.json({ state: record ? JSON.parse(record.state) : null, syncedAt: record?.updatedAt ?? null });
  } catch {
    return Response.json({ state: null, syncUnavailable: true });
  }
}

export async function PUT(request: Request) {
  const user = identity(request);
  if (!user) return Response.json({ error: "Sign in to sync progress." }, { status: 401 });
  const state = await request.json().catch(() => null);
  if (!state || typeof state !== "object") return Response.json({ error: "Invalid progress data." }, { status: 400 });
  const serialized = JSON.stringify(state);
  if (serialized.length > 250_000) return Response.json({ error: "Progress data is too large." }, { status: 413 });
  try {
    const updatedAt = Date.now();
    await getDb().insert(learnerProgress).values({ userId: user.userId, email: user.email, state: serialized, updatedAt })
      .onConflictDoUpdate({ target: learnerProgress.userId, set: { email: user.email, state: serialized, updatedAt } });
    return Response.json({ syncedAt: updatedAt });
  } catch {
    return Response.json({ savedLocally: true, syncUnavailable: true }, { status: 202 });
  }
}
