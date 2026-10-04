import {env} from "cloudflare:workers";
import {and,eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {savedRecordings} from "../../../db/schema";
import {authorizeLearningRequest} from "../learning-track";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const validId=(id:string)=>/^[a-f0-9-]{36}$/i.test(id);
const json=(value:unknown,status=200)=>Response.json(value,{status,headers});
function authorize(request:Request){const auth=authorizeLearningRequest(request);if(!auth.identity)return {error:json({error:"Sign in to use your recording journal."},auth.status)};if(request.method!=="GET"&&request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return {error:json({error:"Invalid origin."},403)};return {userId:auth.identity.userId};}
export async function GET(request:Request){
 const auth=authorize(request);if(auth.error)return auth.error;
 try{const db=getDb(),id=new URL(request.url).searchParams.get("id");
 if(id){if(!validId(id))return json({error:"Invalid recording."},400);const rows=await db.select().from(savedRecordings).where(and(eq(savedRecordings.userId,auth.userId!),eq(savedRecordings.id,id),eq(savedRecordings.ready,1)));if(!rows.length)return json({error:"Recording not found."},404);const object=await env.BUCKET?.get(rows[0].objectKey);if(!object)return json({error:"Recording unavailable."},404);return new Response(object.body,{headers:{...headers,"Content-Type":rows[0].mime,"Content-Length":String(object.size)}});}
 const rows=await db.select().from(savedRecordings).where(eq(savedRecordings.userId,auth.userId!));
 return json({recordings:rows.sort((a,b)=>b.createdAt-a.createdAt).map(({id,source,task,transcript,createdAt,ready})=>({id,source,task,transcript,createdAt,ready}))});
 }catch{return json({error:"Could not load the recording journal."},503)}
}
export async function POST(request:Request){
 const auth=authorize(request);if(auth.error)return auth.error;if(!env.BUCKET)return json({error:"Recording storage is unavailable."},503);
 // Bound the multipart body even when Content-Length is absent or untrusted.
 const reader=request.body?.getReader();if(!reader)return json({error:"No recording supplied."},400);
 const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>9*1024*1024){await reader.cancel();return json({error:"Recording is too large (8 MB maximum)."},413)}chunks.push(part.value)}}catch{return json({error:"Upload interrupted."},400)}
 let form:FormData;try{form=await new Response(new Blob(chunks as BlobPart[]),{headers:{"Content-Type":request.headers.get("content-type")||""}}).formData()}catch{return json({error:"Invalid recording upload."},400)}
 const file=form.get("audio"),id=String(form.get("id")||""),source=String(form.get("source")||"").slice(0,400),task=String(form.get("task")||"").slice(0,100),transcript=String(form.get("transcript")||"").slice(0,6000);
 if(!(file instanceof File)||!file.size||file.size>8*1024*1024||!validId(id)||!source||!task||form.get("consent")!=="save")return json({error:"Choose a recording and explicitly save it."},400);
 const mime=file.type.split(";")[0];if(!["audio/webm","video/webm","audio/ogg","audio/mp4","audio/mpeg","audio/wav","audio/x-wav"].includes(mime))return json({error:"Unsupported audio format."},400);
 const db=getDb(),where=and(eq(savedRecordings.userId,auth.userId!),eq(savedRecordings.id,id));let objectKey="",reserved=false;
 try{
 const existing=await db.select().from(savedRecordings).where(where);if(existing.length)return existing[0].ready?json({saved:true,id}):json({error:"This upload is still pending. Reload the journal before retrying."},409);
 const ownerHash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(auth.userId!))),n=>n.toString(16).padStart(2,"0")).join("");objectKey=`recordings/${ownerHash}/${id}`;
 for(let slot=0;slot<20;slot++){const rows=await db.insert(savedRecordings).values({userId:auth.userId!,id,slot,source,task,transcript,objectKey,mime,createdAt:Date.now(),ready:0}).onConflictDoNothing().returning();if(rows.length){reserved=true;break}}
 if(!reserved)return json({error:"Your journal holds 20 recordings per language. Remove one before saving another."},409);
 await env.BUCKET.put(objectKey,file.stream(),{httpMetadata:{contentType:mime}});
 await db.update(savedRecordings).set({ready:1}).where(where);return json({saved:true,id});
 }catch{if(reserved){try{await env.BUCKET.delete(objectKey);await db.delete(savedRecordings).where(where)}catch{}}return json({error:"Could not save the recording. Please retry."},503)}
}
export async function DELETE(request:Request){
 const auth=authorize(request);if(auth.error)return auth.error;const id=new URL(request.url).searchParams.get("id")||"";if(!validId(id))return json({error:"Invalid recording."},400);
 try{const db=getDb(),where=and(eq(savedRecordings.userId,auth.userId!),eq(savedRecordings.id,id));const rows=await db.select().from(savedRecordings).where(where);if(rows.length){if(!env.BUCKET)return json({error:"Storage is unavailable."},503);await env.BUCKET.delete(rows[0].objectKey);await db.delete(savedRecordings).where(where)}return json({deleted:true})}catch{return json({error:"Could not delete the recording."},503)}
}
