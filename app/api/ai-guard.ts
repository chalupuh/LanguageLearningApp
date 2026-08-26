const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 60;
const usage = new Map<string, { count: number; resetsAt: number }>();

export function guardAiRequest(request: Request): Response | null {
  const url = new URL(request.url);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const userId = request.headers.get("oai-authenticated-user-id");

  if (!local && !userId) {
    return Response.json({ error: "Sign in to use AI coaching." }, { status: 401 });
  }

  const key = userId ?? "local-development";
  const now = Date.now();
  const current = usage.get(key);
  const bucket = !current || current.resetsAt <= now
    ? { count: 0, resetsAt: now + WINDOW_MS }
    : current;

  if (bucket.count >= MAX_REQUESTS) {
    return Response.json(
      { error: "You’ve reached the hourly coaching limit. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.resetsAt - now) / 1000)) } },
    );
  }

  bucket.count += 1;
  usage.set(key, bucket);
  return null;
}
