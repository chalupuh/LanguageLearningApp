import { authorizeLearningRequest as authorizeAppRequest } from "../learning-track";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const auth = authorizeAppRequest(request);
  if (!auth.identity) return Response.json({ error: "Sign in to see your updates." }, { status: auth.status, headers });
  try {
    const [{ getDb }, { feedbackResolutions,featureRequests }, { inArray }] = await Promise.all([import("../../../db"), import("../../../db/schema"), import("drizzle-orm")]);
    const ids=[auth.accountUserId!,`track:sv:${auth.accountUserId}`];
    const rows = await getDb().select().from(feedbackResolutions).where(inArray(feedbackResolutions.userId,ids));
    const requests=await getDb().select().from(featureRequests).where(inArray(featureRequests.userId,ids));
    const legacy=rows.filter(r=>!requests.some(n=>n.id===r.noteId&&n.userId===r.userId));
    return Response.json({ updates: [...legacy,...requests.map(n=>({noteId:"request:"+n.id,userId:n.userId,handled:n.status==="shipped",noteText:n.text,message:n.message+(n.releaseId?" · Release: "+n.releaseId:""),updatedAt:n.updatedAt,seenAt:n.seenAt}))].sort((a,b)=>b.updatedAt-a.updatedAt).map(({userId,...row})=>row) }, { headers });
  } catch { return Response.json({ error: "Request updates are temporarily unavailable." }, { status: 503, headers }); }
}

export async function PATCH(request: Request) {
  const auth = authorizeAppRequest(request);
  if (!auth.identity) return Response.json({ error: "Sign in to acknowledge updates." }, { status: auth.status, headers });
  if (request.headers.get("Origin") && request.headers.get("Origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin." }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.noteId !== "string" || !body.noteId || !Number.isSafeInteger(body.updatedAt)) return Response.json({ error: "Invalid update." }, { status: 400, headers });
  try {
    const [{ getDb }, { feedbackResolutions,featureRequests }, { eq, and,inArray }] = await Promise.all([import("../../../db"), import("../../../db/schema"), import("drizzle-orm")]);
    const ids=[auth.accountUserId!,`track:sv:${auth.accountUserId}`];
    if(body.noteId.startsWith("request:"))await getDb().update(featureRequests).set({seenAt:Date.now()}).where(and(inArray(featureRequests.userId,ids),eq(featureRequests.id,body.noteId.slice(8)),eq(featureRequests.updatedAt,body.updatedAt)));
    else await getDb().update(feedbackResolutions).set({ seenAt: Date.now() }).where(and(inArray(feedbackResolutions.userId,ids), eq(feedbackResolutions.noteId, body.noteId), eq(feedbackResolutions.updatedAt, body.updatedAt)));
    return Response.json({ acknowledged: true }, { headers });
  } catch { return Response.json({ error: "Could not acknowledge this update. Please retry." }, { status: 503, headers }); }
}
