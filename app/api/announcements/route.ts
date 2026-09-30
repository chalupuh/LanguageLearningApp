import { authorizeLearningRequest as authorizeAppRequest } from "../learning-track";
import { announcements } from "../../../content/announcements";
import { getDb } from "../../../db";
import { journeyEvents } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 const auth=authorizeAppRequest(request);if(!auth.identity)return Response.json({error:"Sign in to practice."},{status:auth.status,headers});
 try{const events=await getDb().select().from(journeyEvents).where(and(eq(journeyEvents.userId,auth.identity.userId),eq(journeyEvents.kind,"announcement")));
 return Response.json({items:announcements.filter(a=>(a.language||"fr")===auth.language).map(({questions,...item})=>({...item,questions:questions.map(({answer,...question})=>question)})),completed:events.map(e=>e.source)},{headers});
 }catch{return Response.json({error:"Could not load announcement practice."},{status:503,headers})}
}
export async function POST(request:Request){
 const auth=authorizeAppRequest(request);if(!auth.identity)return Response.json({error:"Sign in to save practice."},{status:auth.status,headers});
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403,headers});
 const body=await request.json().catch(()=>null),item=announcements.find(a=>a.id===body?.id&&(a.language||"fr")===auth.language);
 if(!item||!Array.isArray(body.answers)||body.answers.length!==item.questions.length||body.answers.some((a:unknown)=>!Number.isInteger(a)||Number(a)<0||Number(a)>2)||!Number.isInteger(body.listens)||body.listens<1||body.listens>100)return Response.json({error:"Finish listening and answer every question."},{status:400,headers});
 const result={score:Math.round(item.questions.filter((q,i)=>q.answer===body.answers[i]).length/item.questions.length*100),skills:item.questions.map((q,i)=>({skill:q.skill,correct:q.answer===body.answers[i],answer:q.options[q.answer]})),condition:body.listens===1?"first":"replay",level:item.level};
 try{const rows=await getDb().insert(journeyEvents).values({userId:auth.identity.userId,id:"announcement:"+item.id,kind:"announcement",source:item.id,xp:25,createdAt:Date.now(),details:JSON.stringify(result)}).onConflictDoNothing().returning();return Response.json({result,awarded:rows.length?25:0},{headers})}
 catch{return Response.json({error:"Your result could not be saved. Retry safely; XP cannot be duplicated."},{status:503,headers})}
}
