import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import ts from "typescript";
import {drizzle} from "drizzle-orm/d1";
const root=new URL("../",import.meta.url);

test("cosmetics are reachable from profile, header, and Progress collection",async()=>{
 const page=await readFile(new URL("app/page.tsx",root),"utf8"),hub=await readFile(new URL("app/journey-hub.tsx",root),"utf8");
 assert.match(page,/My cosmetics →/);
 assert.match(page,/onCosmetics=\{openCollection\}/);
 assert.match(page,/onClick=\{openCollection\}>My collection/);
 assert.match(page,/setCollectionVisit\(n=>n\+1\)/);
 assert.match(page,/setOpen\(false\);onCosmetics\(\)/);
 assert.match(hub,/"journey","growth","collection"/);
 assert.match(hub,/Equipped/);assert.match(hub,/Reset \{category\}/);
});
const dataUrl=js=>"data:text/javascript;base64,"+Buffer.from(js).toString("base64");
const moduleUrls=new Map();
async function moduleUrl(path){
 if(moduleUrls.has(path))return moduleUrls.get(path);
 let source=await readFile(new URL(path,root),"utf8");
 const replacements={
  "../app-auth":"app/api/app-auth.ts","../../../lib/journey":"lib/journey.ts",
  "../../../content/passages":"content/passages.ts","../../../content/checkpoints":"content/checkpoints.ts",
  "../../../db/schema":"db/schema.ts",
 };
 for(const [specifier,target]of Object.entries(replacements))if(source.includes('"'+specifier+'"'))source=source.replaceAll('"'+specifier+'"',JSON.stringify(await moduleUrl(target)));
 source=source.replaceAll('"../../../db"',JSON.stringify(dataUrl("export const getDb=()=>globalThis.__journeyTestDb")));
 for(const specifier of ["drizzle-orm","drizzle-orm/sqlite-core"])source=source.replaceAll('"'+specifier+'"',JSON.stringify(import.meta.resolve(specifier)));
 const url=dataUrl(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 moduleUrls.set(path,url);return url;
}
function d1Adapter(sqlite){
 return {prepare(sql){
  let bindings=[];
  const statement={
   bind(...values){bindings=values;return statement},
   async raw(){const stmt=sqlite.prepare(sql);stmt.setReturnArrays(true);return stmt.all(...bindings)},
   async all(){return {success:true,results:sqlite.prepare(sql).all(...bindings)}},
   async run(){const result=sqlite.prepare(sql).run(...bindings);return {success:true,meta:{changes:result.changes}}},
  };return statement;
 }};
}
test("journey API: real SQLite awards, privacy, migration, retries, reviews, and fixed-key checks",async()=>{
 const sqlite=new DatabaseSync(":memory:");
 for(const migration of ["0000_greedy_darkstar.sql","0001_secret_human_cannonball.sql","0002_smart_marrow.sql"])sqlite.exec(await readFile(new URL("drizzle/"+migration,root),"utf8"));
 const previous=process.env.ALLOWED_USER_EMAILS,realNow=Date.now;let clock=realNow();
 process.env.ALLOWED_USER_EMAILS="nikki@example.com,owner@example.com";Date.now=()=>clock;
 globalThis.__journeyTestDb=drizzle(d1Adapter(sqlite));
 try{
  const {GET,POST}=await import(await moduleUrl("app/api/journey/route.ts"));
  const request=(body,user="nikki",origin="https://example.com")=>new Request("https://example.com/api/journey",{method:body?"POST":"GET",headers:{"oai-authenticated-user-id":user,"oai-authenticated-user-email":user+"@example.com",origin,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
  const post=async(body,user)=>{const response=await POST(request(body,user));return {status:response.status,...await response.json()}};
  assert.equal((await GET(new Request("https://example.com/api/journey"))).status,401);
  assert.equal((await POST(request({kind:"goal",source:"weekly",goal:3},"nikki","https://evil.example"))).status,403);
  sqlite.prepare("INSERT INTO learner_progress VALUES(?,?,?,?)").run("nikki","nikki@example.com",JSON.stringify({xp:825,savedPhrases:["bonjour","merci"],completed:[],reviews:{},phraseReviews:{}}),clock);
  let state=await (await GET(request())).json();
  assert.equal(state.historicalXp,825);assert.equal(state.events.length,0);
  assert.equal(state.checkpoint.questions[0].answer,undefined);
  assert.equal((await post({kind:"equip",source:"croissant",category:"avatar"})).status,403);
  assert.equal((await post({kind:"loop",source:"library:cafe"})).status,400);
  const loop={kind:"loop",source:"library:cafe",summary:"The speaker ordered a coffee.",retell:"Elle commande un café à emporter.",decoded:true,shadowed:true};
  const parallel=await Promise.all([post(loop),post(loop)]);
  assert.equal(parallel.reduce((sum,r)=>sum+r.awarded,0),40);
  assert.equal((await post(loop)).awarded,0);
  assert.equal((await post({kind:"shadow",source:"library:cafe",repeated:true})).awarded,10);
  assert.equal((await post({kind:"shadow",source:"library:cafe",repeated:true})).awarded,0);
  const phrases=await Promise.all([post({kind:"phrase",source:"bonjour",rating:"Good"}),post({kind:"phrase",source:"merci",rating:"Again"})]);
  assert.equal(phrases.reduce((sum,r)=>sum+r.awarded,0),10);
  assert.equal((await post({kind:"phrase",source:"bonjour",rating:"Good"})).awarded,0);
  assert.equal((await post({kind:"checkpoint",source:"town-transport",answers:[1,2,0],listens:1})).status,409);
  const checkpoint=await post({kind:"checkpoint",source:"library-hours",answers:[0,1,2],listens:1});
  assert.equal(checkpoint.awarded,25);assert.equal(checkpoint.result.score,100);
  assert.equal((await post({kind:"checkpoint",source:"library-hours",answers:[1,0,0],listens:1})).result.score,100);
  assert.equal((await post({kind:"checkpoint",source:"town-transport",answers:[1,2,0],listens:1})).status,409);
  await post({...loop,source:"studio:Zpcrn1b6baQ:0:60"});
  assert.equal((await post({kind:"equip",source:"croissant",category:"avatar"})).status,200);
  assert.equal((await post({kind:"equip",source:"bear",category:"avatar"})).status,403);
  assert.equal((await post({kind:"goal",source:"weekly",goal:8})).status,400);
  assert.equal((await post({kind:"goal",source:"weekly",goal:4})).status,200);
  // A stale progress save cannot change ledger XP or historical credit.
  sqlite.prepare("UPDATE learner_progress SET state=? WHERE user_id=?").run(JSON.stringify({xp:0,completed:["cafe"],reviews:{cafe:new Date(clock-1000).toISOString()},savedPhrases:["bonjour"],phraseReviews:{}}),"nikki");
  state=await (await GET(request())).json();assert.equal(state.historicalXp,825);assert.equal(state.avatar,"croissant");assert.equal(state.weeklyGoal,4);
  assert.equal((await (await GET(request(undefined,"owner"))).json()).events.length,0);
  clock+=2*86400000;
  // A shadow reward must not block the separately earned due review reward.
  assert.equal((await post({kind:"shadow",source:"library:cafe",repeated:true})).awarded,10);
  assert.equal((await post({...loop,kind:"review"})).awarded,20);
  assert.equal((await post({...loop,kind:"review"})).awarded,0);
  clock+=6*86400000;
  const later=await post({kind:"checkpoint",source:"town-transport",answers:[0,0,0],listens:2});
  assert.equal(later.awarded,25);assert.equal(later.result.condition,"replay");assert.equal(later.result.score,33);
 }finally{
  Date.now=realNow;if(previous===undefined)delete process.env.ALLOWED_USER_EMAILS;else process.env.ALLOWED_USER_EMAILS=previous;
  delete globalThis.__journeyTestDb;sqlite.close();
 }
});
test("reward ladder and achievements use earned activity, not historical XP",async()=>{
 const {earnedXp,rewards,achievements}=await import(await moduleUrl("lib/journey.ts"));
 assert.deepEqual(rewards.map(r=>r.xp),[100,250,500,1000,1750,2750,4000,5000]);
 const events=[{id:"a",kind:"loop",source:"studio:video:0:60",xp:40,createdAt:1,details:"{}"},{id:"b",kind:"review",source:"library:cafe",xp:20,createdAt:2,details:"{}"}];
 assert.equal(earnedXp(events),60);
 assert.equal(achievements(events).find(a=>a.name==="Out in the world").value,1);
 assert.equal(achievements(events).find(a=>a.name==="Back for more").value,1);
});
test("listening comparisons separate conditions and require evidence",async()=>{
 const {listeningSummary}=await import(await moduleUrl("lib/journey.ts"));
 const observation=(id,score,condition="first")=>({id,kind:"observation",source:"library:"+id,xp:0,createdAt:Number(id),details:JSON.stringify({score,condition,level:"B1"})});
 assert.equal(listeningSummary([observation("1",50)]).trends[0].recent,null);
 const result=listeningSummary([observation("1",40),observation("2",60),observation("3",70),observation("4",90),observation("5",100,"familiar"),observation("6",100,"replay")]);
 assert.equal(result.trends[0].count,4);assert.equal(result.trends[0].earlier,50);assert.equal(result.trends[0].recent,80);
});
