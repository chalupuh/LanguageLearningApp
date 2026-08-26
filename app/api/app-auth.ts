export type AppIdentity = { userId: string; email: string | null };

export function authorizeAppRequest(request: Request): { identity: AppIdentity | null; status: 200 | 401 | 403 } {
  const url = new URL(request.url);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (local) return { identity: { userId: "local-development", email: null }, status: 200 };

  const userId = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() ?? null;
  if (!userId || !email) return { identity: null, status: 401 };

  const allowed = (process.env.ALLOWED_USER_EMAILS ?? "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(email)) return { identity: null, status: 403 };
  return { identity: { userId, email }, status: 200 };
}

