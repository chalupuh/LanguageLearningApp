import {frenchCourseContext} from "../french-course";
import {frenchAccess} from "../../../lib/french-progression";
import { authorizeLearningRequest as authorizeAppRequest } from "../learning-track";
import { announcements } from "../../../content/announcements";
import {situations} from "../../../content/situations";
import {challengeDetails,isListeningDifficulty,listeningQuestions,scoreListening} from "../../../content/listening-challenges";
import { getDb } from "../../../db";
import { journeyEvents } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 const auth=authorizeAppRequest(request);if(!auth.identity)return Response.json({error:"Sign in to practice."},{status:auth.status,headers});
 const difficulty=new URL(request.url).searchParams.get("difficulty")||"standard";
 if(!isListeningDifficulty(difficulty)||(auth.language==="sv"&&difficulty!=="standard"))return Response.json({error:"Choose a supported listening level."},{status:400,headers});
 try{const events=await getDb().select().from(journeyEvents).where(eq(journeyEvents.userId,auth.identity.userId));
 const course=auth.language==="fr"?await frenchCourseContext(auth.identity.userId):null;
 const catalog=new URL(request.url).searchParams.get("category")==="situations"?situations:announcements;
 return Response.json({items:catalog.filter(a=>(a.language||"fr")===auth.language&&(!course||frenchAccess(a.level,course.course,course.completed))&&(difficulty==="standard"||!!challengeDetails(a))).map(item=>({id:item.id,title:item.title,level:item.level,text:item.text,questions:listeningQuestions(item,difficulty).map(q=>({skill:q.skill,prompt:q.prompt,...(difficulty==="write"?{}:{options:q.options})}))})),completed:events.filter(e=>e.kind==="announcement").map(e=>e.source),attempts:events.filter(e=>e.kind==="announcement-attempt").sort((a,b)=>b.createdAt-a.createdAt).map(e=>({id:e.id,source:e.source,createdAt:e.createdAt,...JSON.parse(e.details)}))},{headers});
 }catch{return Response.json({error:"Could not load announcement practice."},{status:503,headers})}
}
export async function POST(request:Request){
 const auth=authorizeAppRequest(request);if(!auth.identity)return Response.json({error:"Sign in to save practice."},{status:auth.status,headers});
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403,headers});
 const body=await request.json().catch(()=>null),item=[...announcements,...situations].find(a=>a.id===body?.id&&(a.language||"fr")===auth.language);
 const difficulty=body?.difficulty||"standard";
 if(!item||!isListeningDifficulty(difficulty)||(auth.language==="sv"&&difficulty!=="standard")||!Array.isArray(body.answers)||!Number.isInteger(body.listens)||body.listens<1||body.listens>100)return Response.json({error:"Finish listening and answer every question."},{status:400,headers});
 let graded;try{graded=scoreListening(item,difficulty,body.answers)}catch{return Response.json({error:"Answer every question using the selected difficulty."},{status:400,headers})}
 const result={...graded,condition:body.listens===1?"first":"replay",level:item.level,difficulty};
 if(body.attemptId!==undefined&&(typeof body.attemptId!=="string"||!/^[-\w]{16,80}$/.test(body.attemptId)))return Response.json({error:"Invalid attempt."},{status:400,headers});
 try{const db=getDb(),createdAt=Date.now();
 if(auth.language==="fr"){const course=await frenchCourseContext(auth.identity.userId);if(!frenchAccess(item.level,course.course,course.completed))return Response.json({error:"Complete the previous course stage first."},{status:403,headers});}
 const prior=await db.select().from(journeyEvents).where(and(eq(journeyEvents.userId,auth.identity.userId),eq(journeyEvents.id,"announcement:"+item.id)));
 if(prior.length)result.condition="familiar";
 const rows=await db.insert(journeyEvents).values({userId:auth.identity.userId,id:"announcement:"+item.id,kind:"announcement",source:item.id,xp:25,createdAt,details:JSON.stringify(result)}).onConflictDoNothing().returning();
 if(!rows.length)result.condition="familiar";
 await db.insert(journeyEvents).values({userId:auth.identity.userId,id:`announcement-attempt:${item.id}:${body.attemptId||"legacy"}`,kind:"announcement-attempt",source:item.id,xp:0,createdAt,details:JSON.stringify({...result,reply:typeof body.reply==="string"?body.reply.slice(0,600):""})}).onConflictDoNothing();
 const saved=await db.select().from(journeyEvents).where(and(eq(journeyEvents.userId,auth.identity.userId),eq(journeyEvents.id,`announcement-attempt:${item.id}:${body.attemptId||"legacy"}`)));
 return Response.json({result:saved.length?JSON.parse(saved[0].details):result,awarded:rows.length?25:0},{headers})}
 catch{return Response.json({error:"Your result could not be saved. Retry safely; XP cannot be duplicated."},{status:503,headers})}
}
