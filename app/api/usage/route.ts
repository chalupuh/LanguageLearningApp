import { authorizeAppRequest } from "../app-auth";
import { passages } from "../../../content/passages";
const headers = { "Cache-Control":"private, no-store" };
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
export async function POST(request:Request){
  const auth=authorizeAppRequest(request);if(!auth.identity)return reply({error:"Sign in required."},auth.status);
  if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Invalid origin."},403);
  if(Number(request.headers.get("content-length"))>12000)return reply({error:"Payload too large."},413);
  const text=await request.text();if(text.length>12000)return reply({error:"Payload too large."},413);
  let body:any;try{body=JSON.parse(text)}catch{return reply({error:"Invalid request."},400)}
  const now=Date.now(), validSource=body?.source==="app"||passages.some(p=>"library:"+p.id===body?.source)||/^studio:[\w-]{11}:\d{1,6}:\d{1,6}$/.test(body?.source);
  if(!body||typeof body.id!=="string"||!/^[\w-]{36}$/.test(body.id)||!validSource||!Number.isInteger(body.stage)||body.stage<0||body.stage>3||!Array.isArray(body.samples)||!body.samples.length||body.samples.length>16)return reply({error:"Invalid usage data."},400);
  for(const s of body.samples)if(!s||!Number.isSafeInteger(s.seq)||s.seq<0||s.seq>1000000||!Number.isSafeInteger(s.start)||!Number.isSafeInteger(s.end)||s.end<=s.start||s.end-s.start>10000||s.start<now-120000||s.start>=now||s.end>now+5000)return reply({error:"Invalid activity interval."},400);
  try{
    const [{getDb},schema,{sql}]=await Promise.all([import("../../../db"),import("../../../db/schema"),import("drizzle-orm")]);
    const db=getDb(),userId=auth.identity.userId,start=Math.min(...body.samples.map((s:any)=>s.start)),end=Math.min(now,Math.max(...body.samples.map((s:any)=>s.end)));
    await db.insert(schema.usageSessions).values({userId,id:body.id,email:auth.identity.email,source:body.source,startedAt:start,lastActiveAt:end,stage:body.stage}).onConflictDoUpdate({target:[schema.usageSessions.userId,schema.usageSessions.id],set:{startedAt:sql`min(started_at, ${start})`,lastActiveAt:sql`max(last_active_at, ${end})`,stage:sql`case when completed_at is null and last_active_at <= ${end} then ${body.stage} else stage end`},setWhere:sql`source = ${body.source}`});
    // Check source ownership on retries; client never supplies another user's identity.
    const {eq,and}=await import("drizzle-orm");
    const [session]=await db.select().from(schema.usageSessions).where(and(eq(schema.usageSessions.userId,userId),eq(schema.usageSessions.id,body.id)));
    if(session.source!==body.source)return reply({error:"Session source cannot change."},409);
    await db.insert(schema.usageSamples).values(body.samples.map((s:any)=>({userId,sessionId:body.id,seq:s.seq,start:s.start,end:Math.min(s.end,now)}))).onConflictDoNothing();
    // Fine-grained timing is needed only for the dashboard's 90-day window.
    if(body.samples.some((s:any)=>s.seq===0)){const {lt}=await import("drizzle-orm");await db.delete(schema.usageSamples).where(and(eq(schema.usageSamples.userId,userId),lt(schema.usageSamples.end,now-90*86400000)))}
    return reply({saved:true});
  }catch{return reply({error:"Usage could not be recorded."},503)}
}
