import { authorizeAppRequest } from "../app-auth";

export async function GET(request: Request) {
  const auth = authorizeAppRequest(request);
  if (auth.status === 401) return Response.json({ authenticated: false }, { status: 401 });
  if (auth.status === 403) return Response.json({ authenticated: true, authorized: false }, { status: 403 });
  return Response.json({ authenticated: true, authorized: true, email: auth.identity?.email });
}

