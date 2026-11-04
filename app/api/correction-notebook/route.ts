import { authorizeLearningRequest } from "../learning-track";
import { getDb } from "../../../db";
import { correctionNotebooks } from "../../../db/schema";
import { emptyNotebook, validNotebook } from "../../../lib/correction-notebook";
import { eq, and } from "drizzle-orm";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
 const auth=authorizeLearningRequest(request);
 if(!auth.identity)return Response.json({error:"Sign in to open your correction notebook."},{status:auth.status,headers});
 try {
  const [row]=await getDb().select().from(correctionNotebooks).where(eq(correctionNotebooks.userId,auth.identity.userId));
  return Response.json({userId:auth.identity.userId,state:row?JSON.parse(row.state):emptyNotebook(),revision:row?.revision||0},{headers});
 }catch{return Response.json({error:"Your notebook could not load. Please retry."},{status:503,headers});}
}
export async function PUT(request: Request) {
 const auth=authorizeLearningRequest(request);
 if(!auth.identity)return Response.json({error:"Sign in to save your correction notebook."},{status:auth.status,headers});
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403,headers});
 const raw=await request.text();
 if(new TextEncoder().encode(raw).length>2000000)return Response.json({error:"Your notebook is too large. Shorten an entry before saving."},{status:413,headers});
 let body;try{body=JSON.parse(raw);}catch{return Response.json({error:"Invalid notebook."},{status:400,headers});}
 if(!validNotebook(body?.state)||!Number.isSafeInteger(body?.revision)||body.revision<0||body.revision>=Number.MAX_SAFE_INTEGER)return Response.json({error:"Check your entry. Your notebook can hold up to 100 entries."},{status:400,headers});
 try {
  const db=getDb(),revision=body.revision+1,values={state:JSON.stringify(body.state),revision,updatedAt:Date.now()};
  const rows=body.revision===0?await db.insert(correctionNotebooks).values({userId:auth.identity.userId,...values}).onConflictDoNothing().returning({revision:correctionNotebooks.revision}):await db.update(correctionNotebooks).set(values).where(and(eq(correctionNotebooks.userId,auth.identity.userId),eq(correctionNotebooks.revision,body.revision))).returning({revision:correctionNotebooks.revision});
  if(!rows.length)return Response.json({error:"Your notebook changed on another device. Refresh saved entries before trying again."},{status:409,headers});
  return Response.json({revision},{headers});
 }catch{return Response.json({error:"Not saved yet. Keep your draft open and retry."},{status:503,headers});}
}
