import {authorizeAppRequest} from "./app-auth";
import {getDb} from "../../db";
import {aiQuota} from "../../db/schema";
import {sql} from "drizzle-orm";
const WINDOW_MS=3600000,MAX_REQUESTS=60;
export async function guardAiRequest(request:Request):Promise<Response|null>{
 const auth=authorizeAppRequest(request);
 if(!auth.identity)return Response.json({error:auth.status===401?"Sign in to use AI coaching.":"This account is not invited."},{status:auth.status});
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403});
 const now=Date.now(),start=Math.floor(now/WINDOW_MS)*WINDOW_MS;
 try{
  // An atomic database counter is shared by every Worker and both languages.
  const rows=await getDb().insert(aiQuota).values({userId:auth.identity.userId,windowStart:start,count:1}).onConflictDoUpdate({target:aiQuota.userId,set:{windowStart:start,count:sql`CASE WHEN ${aiQuota.windowStart} = ${start} THEN ${aiQuota.count} + 1 ELSE 1 END`},setWhere:sql`${aiQuota.windowStart} <> ${start} OR ${aiQuota.count} < ${MAX_REQUESTS}`}).returning();
  if(!rows.length)return Response.json({error:"Your hourly AI allowance is used. Saved lesson audio and non-AI rehearsal still work; try coaching again after the hour."},{status:429,headers:{"Retry-After":String(Math.ceil((start+WINDOW_MS-now)/1000))}});
  return null;
 }catch{return Response.json({error:"AI usage checking is temporarily unavailable. Your work is safe; please retry shortly."},{status:503});}
}
// Never automatically retry a paid request: a timeout may occur after processing.
export async function fetchAi(url:string,init:RequestInit):Promise<Response>{
 try{return await fetch(url,{...init,signal:AbortSignal.timeout(45000)});}
 catch{return Response.json({error:"The AI service timed out. Your input is kept; please retry."},{status:504});}
}
