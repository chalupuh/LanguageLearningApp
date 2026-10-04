import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { learnerProgress } from "../../../db/schema";
import { authorizeLearningRequest as authorizeAppRequest } from "../learning-track";

export async function GET(request: Request) {
  const auth = authorizeAppRequest(request);
  const user = auth.identity;
  if (!user) return Response.json({ error: auth.status === 403 ? "This account is not invited." : "Sign in to sync progress." }, { status: auth.status });
  try {
    const [record] = await getDb().select().from(learnerProgress).where(eq(learnerProgress.userId, user.userId)).limit(1);
    let state=record?JSON.parse(record.state):null;
    if(auth.language==="sv"){
      const [base]=await getDb().select().from(learnerProgress).where(eq(learnerProgress.userId,auth.accountUserId!)).limit(1);
      const theme=base?JSON.parse(base.state).holidayTheme:undefined;
      if(theme)state={...(state||{}),holidayTheme:theme};
    }
    return Response.json({ state, userId:user.userId, syncedAt: record?.updatedAt ?? null }, {headers:{"Cache-Control":"private, no-store"}});
  } catch {
    return Response.json({ state: null, syncUnavailable: true }, {status:503,headers:{"Cache-Control":"private, no-store"}});
  }
}

export async function PUT(request: Request) {
  const auth = authorizeAppRequest(request);
  const user = auth.identity;
  if (!user) return Response.json({ error: auth.status === 403 ? "This account is not invited." : "Sign in to sync progress." }, { status: auth.status });
  if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403});
  const state = await request.json().catch(() => null);
  if (!state || typeof state !== "object") return Response.json({ error: "Invalid progress data." }, { status: 400 });
  const match=request.headers.get("If-Match");
  if(match===null)return Response.json({error:"Refresh the app before saving. This version protects newer progress on your other devices."},{status:428});
  const expected=Number(match);if(!Number.isSafeInteger(expected)||expected<0)return Response.json({error:"Invalid progress revision."},{status:400});
  const serialized = JSON.stringify(state);
  if (serialized.length > 250_000) return Response.json({ error: "Progress data is too large." }, { status: 413 });
  try {
    const updatedAt = Math.max(Date.now(),expected+1);
    const db=getDb();
    const written=expected===0?await db.insert(learnerProgress).values({userId:user.userId,email:user.email,state:serialized,updatedAt}).onConflictDoNothing().returning():await db.update(learnerProgress).set({email:user.email,state:serialized,updatedAt}).where(and(eq(learnerProgress.userId,user.userId),eq(learnerProgress.updatedAt,expected))).returning();
    if(!written.length)return Response.json({error:"Progress changed on another device. Merge and retry."},{status:409});
    if(auth.language==="sv"&&["auto","classic","autumn","halloween","winter","valentine","spring","summer"].includes(state.holidayTheme)){
      // Update only the shared appearance preference, never the French lessons.
      await getDb().insert(learnerProgress).values({userId:auth.accountUserId!,email:user.email,state:JSON.stringify({holidayTheme:state.holidayTheme}),updatedAt}).onConflictDoUpdate({target:learnerProgress.userId,set:{state:sql`json_set(${learnerProgress.state}, '$.holidayTheme', ${state.holidayTheme})`,updatedAt}});
    }
    return Response.json({ syncedAt: updatedAt });
  } catch {
    return Response.json({ savedLocally: true, syncUnavailable: true }, { status: 202 });
  }
}
