import {authorizeLearningRequest} from "../learning-track";
import {getDb} from "../../../db";
import {calendarPlans} from "../../../db/schema";
import {emptyCalendar,validCalendar} from "../../../lib/calendar";
import {eq,and} from "drizzle-orm";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 const auth=authorizeLearningRequest(request);if(!auth.identity)return Response.json({error:"Sign in to open your calendar."},{status:auth.status,headers});
 try{const rows=await getDb().select().from(calendarPlans).where(eq(calendarPlans.userId,auth.identity.userId));const row=rows[0];return Response.json({userId:auth.identity.userId,state:row?JSON.parse(row.state):emptyCalendar(),revision:row?.revision||0},{headers})}catch{return Response.json({error:"Your calendar could not load. Please retry."},{status:503,headers})}
}
export async function PUT(request:Request){
 const auth=authorizeLearningRequest(request);if(!auth.identity)return Response.json({error:"Sign in to save your calendar."},{status:auth.status,headers});
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403,headers});
 const raw=await request.text();if(new TextEncoder().encode(raw).length>500000)return Response.json({error:"Calendar is too large to save."},{status:413,headers});
 let body;try{body=JSON.parse(raw)}catch{return Response.json({error:"Invalid calendar."},{status:400,headers})}
 if(!validCalendar(body?.state)||!Number.isSafeInteger(body?.revision)||body.revision<0)return Response.json({error:"Check your checklist text and date."},{status:400,headers});
 try{const db=getDb(),revision=body.revision+1,values={state:JSON.stringify(body.state),revision,updatedAt:Date.now()};const rows=body.revision===0?await db.insert(calendarPlans).values({userId:auth.identity.userId,...values}).onConflictDoNothing().returning({revision:calendarPlans.revision}):await db.update(calendarPlans).set(values).where(and(eq(calendarPlans.userId,auth.identity.userId),eq(calendarPlans.revision,body.revision))).returning({revision:calendarPlans.revision});
 if(!rows.length)return Response.json({error:"Your calendar changed on another device."},{status:409,headers});return Response.json({revision},{headers});
 }catch{return Response.json({error:"Your calendar is waiting to sync. Your changes stay on this device."},{status:503,headers})}
}
