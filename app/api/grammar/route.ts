import {authorizeLearningRequest} from "../learning-track";
import {getDb} from "../../../db";
import {grammarCompletions} from "../../../db/schema";
import {eq} from "drizzle-orm";
import {checkGrammarAnswer} from "../../../lib/french-grammar";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 const auth=authorizeLearningRequest(request);if(!auth.identity)return Response.json({error:"Sign in to open grammar practice."},{status:auth.status,headers});
 if(auth.language!=="fr")return Response.json({error:"These exercises are for French."},{status:400,headers});
 try{const rows=await getDb().select({id:grammarCompletions.exerciseId}).from(grammarCompletions).where(eq(grammarCompletions.userId,auth.identity.userId));return Response.json({completed:rows.map(r=>r.id)},{headers});}catch{return Response.json({error:"Could not load grammar progress. Please retry."},{status:503,headers});}
}
export async function POST(request:Request){
 const auth=authorizeLearningRequest(request);if(!auth.identity)return Response.json({error:"Sign in to save grammar practice."},{status:auth.status,headers});
 if(auth.language!=="fr")return Response.json({error:"These exercises are for French."},{status:400,headers});
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403,headers});
 const raw=await request.text();if(raw.length>2000)return Response.json({error:"Answer is too long."},{status:413,headers});
 let body;try{body=JSON.parse(raw);}catch{return Response.json({error:"Invalid answer."},{status:400,headers});}
 if(typeof body?.id!=="string"||typeof body?.answer!=="string"||checkGrammarAnswer(body.id,body.answer)!=="correct")return Response.json({error:"Check the answer and its accents before saving."},{status:400,headers});
 try{await getDb().insert(grammarCompletions).values({userId:auth.identity.userId,exerciseId:body.id,completedAt:Date.now()}).onConflictDoNothing();return Response.json({id:body.id,saved:true},{headers});}catch{return Response.json({error:"Correct answer, but progress was not saved. Please retry saving."},{status:503,headers});}
}
