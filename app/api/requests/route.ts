import {authorizeAppRequest} from "../app-auth";
import {getDb} from "../../../db";
import {featureRequests,learnerProgress,feedbackResolutions} from "../../../db/schema";
import {and,eq,inArray} from "drizzle-orm";
import {collectFeedbackNotes} from "../../../lib/feedback-notes";
import {releases} from "../../../content/releases";
const headers={"Cache-Control":"private, no-store"};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
const owner=(email:string|null)=>(process.env.OWNER_EMAIL||"").trim().toLowerCase()===email&&!!email;
export async function GET(request:Request){
 const auth=authorizeAppRequest(request);if(!auth.identity)return reply({error:"Sign in to read your requests."},auth.status);
 const all=new URL(request.url).searchParams.get("owner")==="1";if(all&&!owner(auth.identity.email))return reply({error:"Owner access required."},403);
 try{
  const db=getDb(),ids=[auth.identity.userId,`track:sv:${auth.identity.userId}`];
  const records=await db.select().from(learnerProgress).where(all?undefined:inArray(learnerProgress.userId,ids));
  const stored=await db.select().from(featureRequests).where(all?undefined:inArray(featureRequests.userId,ids));
  const resolutions=await db.select().from(feedbackResolutions).where(all?undefined:inArray(feedbackResolutions.userId,ids));
  const legacy=collectFeedbackNotes(records).notes.map(n=>{const r=resolutions.find(r=>r.userId===n.userId&&r.noteId===n.id);return {id:n.id,userId:n.userId,email:n.submittedBy,text:n.text,kind:n.kind,language:n.userId?.startsWith("track:sv:")?"sv":"fr",status:(r?.handled??n.resolved)?"shipped":"submitted",message:r?.message||"",releaseId:null,createdAt:Date.parse(n.createdAt),updatedAt:r?.updatedAt||Date.parse(n.createdAt),seenAt:r?.seenAt??null};});
  const rows=new Map(legacy.map(n=>[n.userId+":"+n.id,n]));for(const n of stored)rows.set(n.userId+":"+n.id,n as any);
  return reply({requests:[...rows.values()].sort((a,b)=>b.createdAt-a.createdAt),owner:all,releases:releases.map(r=>({id:r.id,title:r.title,items:r.items}))});
 }catch{return reply({error:"Requests could not load. Your notes are unchanged; please retry."},503);}
}
export async function POST(request:Request){
 const auth=authorizeAppRequest(request);if(!auth.identity)return reply({error:"Sign in to submit a request."},auth.status);
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Invalid origin."},403);
 const b=await request.json().catch(()=>null);
 if(!b||typeof b.id!=="string"||!/^[-\w]{16,80}$/.test(b.id)||typeof b.text!=="string"||!b.text.trim()||b.text.length>600||!["fr","sv","both"].includes(b.language)||!["idea","bug"].includes(b.kind))return reply({error:"Add a note of up to 600 characters and choose its language."},400);
 try{const now=Date.now();await getDb().insert(featureRequests).values({userId:auth.identity.userId,email:auth.identity.email,id:b.id,text:b.text.trim(),kind:b.kind,language:b.language,status:"submitted",createdAt:now,updatedAt:now}).onConflictDoNothing();return reply({saved:true});}catch{return reply({error:"Could not save. Your text is kept; retry safely."},503);}
}
export async function PATCH(request:Request){
 const auth=authorizeAppRequest(request);if(!auth.identity)return reply({error:"Sign in to update requests."},auth.status);
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Invalid origin."},403);
 const b=await request.json().catch(()=>null);if(!b||typeof b.id!=="string"||typeof b.userId!=="string")return reply({error:"Invalid request."},400);
 const own=[auth.identity.userId,`track:sv:${auth.identity.userId}`].includes(b.userId);
 if(b.acknowledge===true){if(!own)return reply({error:"Not your request."},403);try{await getDb().update(featureRequests).set({seenAt:Date.now()}).where(and(eq(featureRequests.userId,b.userId),eq(featureRequests.id,b.id),eq(featureRequests.updatedAt,Number(b.updatedAt))));return reply({saved:true});}catch{return reply({error:"Could not acknowledge. Retry."},503);}}
 if(!owner(auth.identity.email))return reply({error:"Owner access required."},403);
 if(!["submitted","planned","in-progress","shipped"].includes(b.status)||typeof b.message!=="string"||b.message.length>600||(b.status==="shipped"&&!b.message.trim())||(b.releaseId&&!releases.some(r=>r.id===b.releaseId)))return reply({error:"Choose a status and add an explanation when shipping. Select a valid release."},400);
 try{
  const db=getDb();let [note]=await db.select().from(featureRequests).where(and(eq(featureRequests.userId,b.userId),eq(featureRequests.id,b.id)));
  if(!note){const records=await db.select().from(learnerProgress).where(eq(learnerProgress.userId,b.userId));const legacy=collectFeedbackNotes(records).notes.find(n=>n.id===b.id);if(!legacy)return reply({error:"Request not found."},404);note={userId:b.userId,id:b.id,email:legacy.submittedBy,kind:legacy.kind,text:legacy.text,language:b.userId.startsWith("track:sv:")?"sv":"fr",status:"submitted",message:"",releaseId:null,createdAt:Date.parse(legacy.createdAt),updatedAt:0,seenAt:null};}
  const unchanged=note.status===b.status&&note.message===b.message.trim()&&note.releaseId===(b.releaseId||null);
  const update={status:b.status,message:b.message.trim(),releaseId:b.releaseId||null,updatedAt:unchanged?note.updatedAt:Math.max(Date.now(),note.updatedAt+1),seenAt:unchanged?note.seenAt:null};
  await db.insert(featureRequests).values({...note,...update}).onConflictDoUpdate({target:[featureRequests.userId,featureRequests.id],set:update});return reply({saved:true});
 }catch{return reply({error:"Could not update request. Retry safely."},503);}
}
