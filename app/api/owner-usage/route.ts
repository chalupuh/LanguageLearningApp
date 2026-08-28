import { authorizeAppRequest } from "../app-auth";
import { summarizeUsage } from "../../../lib/usage";
import { listeningSummary, details } from "../../../lib/journey";
const headers={"Cache-Control":"private, no-store","Vary":"Cookie"};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
export async function GET(request:Request){
  const auth=authorizeAppRequest(request);if(!auth.identity)return reply({error:"Sign in with your invited owner account."},auth.status);
  const owner=(process.env.OWNER_EMAIL||"").trim().toLowerCase();
  if(!owner||auth.identity.email!==owner)return reply({error:"This dashboard is only available to the app owner."},403);
  const url=new URL(request.url),days=Number(url.searchParams.get("days")||30);
  if(![7,30,90].includes(days))return reply({error:"Choose 7, 30 or 90 days."},400);
  try{
    const [{getDb},s,{eq,inArray,gte,and}]=await Promise.all([import("../../../db"),import("../../../db/schema"),import("drizzle-orm")]);
    const db=getDb(),now=Date.now();
    const allowed=(process.env.ALLOWED_USER_EMAILS||"").split(",").map(e=>e.trim().toLowerCase()).filter(e=>e&&e!==owner);
    const email=url.searchParams.get("learner")||allowed[0];
    if(email&&!allowed.includes(email))return reply({error:"Choose an invited learner."},400);
    if(!email)return reply({learners:[],learner:null,usage:summarizeUsage([],[],now,days),learning:{skills:[],trends:[],checkpoints:[],phraseReviews:0},asOf:now});
    const sessions=await db.select().from(s.usageSessions).where(eq(s.usageSessions.email,email));
    const records=await db.select({userId:s.learnerProgress.userId}).from(s.learnerProgress).where(eq(s.learnerProgress.email,email));
    const userIds=[...new Set([...records.map(r=>r.userId),...sessions.map(r=>r.userId)])];
    const samples=userIds.length?await db.select().from(s.usageSamples).where(and(inArray(s.usageSamples.userId,userIds),gte(s.usageSamples.end,now-90*86400000))):[];
    const events=userIds.length?await db.select().from(s.journeyEvents).where(and(inArray(s.journeyEvents.userId,userIds),gte(s.journeyEvents.createdAt,now-days*86400000))):[];
    // Namespace ids across identities; do not send emails, summaries, phrases or recordings from the ledger.
    const usage=summarizeUsage(sessions.map(r=>({...r,id:r.userId+":"+r.id})),samples.map(r=>({...r,sessionId:r.userId+":"+r.sessionId})),now,days);
    return reply({learners:allowed,learner:email,asOf:now,usage,
      learning:{...listeningSummary(events),checkpoints:events.filter(e=>e.kind==="checkpoint").map(e=>({date:e.createdAt,level:details(e).level,score:details(e).score,condition:details(e).condition})).sort((a,b)=>a.date-b.date),phraseReviews:events.filter(e=>e.kind==="phrase").length},
    });
  }catch{return reply({error:"Usage could not be loaded. No records have been changed. Please retry."},503)}
}
