import { authorizeAppRequest } from "./app-auth";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 60;
const usage = new Map<string, { count: number; resetsAt: number }>();

export function guardAiRequest(request: Request): Response | null {
  const auth = authorizeAppRequest(request);
  if (auth.status === 401) return Response.json({ error: "Sign in to use AI coaching." }, { status: 401 });
  if (auth.status === 403) return Response.json({ error: "This account is not invited to this app." }, { status: 403 });

  const key = auth.identity?.userId ?? "local-development";
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
