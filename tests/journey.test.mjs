import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import ts from "typescript";
import {drizzle} from "drizzle-orm/d1";
const root=new URL("../",import.meta.url);

test("recording journal enforces consent, ownership, language isolation, idempotency, limits and deletion",async()=>{
 const sqlite=new DatabaseSync(":memory:");sqlite.exec(await readFile(new URL("drizzle/0006_handy_black_bird.sql",root),"utf8"));globalThis.__journeyTestDb=drizzle(d1Adapter(sqlite));
 const objects=new Map();globalThis.__recordingEnv={BUCKET:{async put(key,stream){objects.set(key,await new Response(stream).arrayBuffer())},async get(key){const value=objects.get(key);return value?{body:value,size:value.byteLength}:null},async delete(key){objects.delete(key)}}};
 const old=process.env.ALLOWED_USER_EMAILS;process.env.ALLOWED_USER_EMAILS="nikki@example.com,owner@example.com";
 const headers=user=>({"oai-authenticated-user-id":user,"oai-authenticated-user-email":user+"@example.com",origin:"https://example.com"});
 const upload=(id,consent="save",language="fr")=>{const form=new FormData();form.append("id",id);form.append("audio",new Blob(["test audio"],{type:"audio/webm"}),"test.webm");form.append("source","library:cafe");form.append("task","Retell");form.append("consent",consent);return new Request("https://example.com/api/recordings?language="+language,{method:"POST",headers:headers("nikki"),body:form})};
 try{
 const route=await import(await moduleUrl("app/api/recordings/route.ts")),id=crypto.randomUUID();
 assert.equal((await route.GET(new Request("https://example.com/api/recordings"))).status,401);
 assert.equal((await route.POST(upload(id,""))).status,400);assert.equal(objects.size,0);
 assert.equal((await route.POST(upload(id))).status,200);assert.equal((await route.POST(upload(id))).status,200);assert.equal(objects.size,1);
 const get=(suffix="",user="nikki")=>route.GET(new Request("https://example.com/api/recordings"+suffix,{headers:headers(user)}));
 assert.equal((await(await get()).json()).recordings.length,1);
 assert.equal((await(await get("?language=sv")).json()).recordings.length,0);
 assert.equal((await get("?id="+id,"owner")).status,404);assert.equal(await(await get("?id="+id)).text(),"test audio");
 for(let i=1;i<20;i++)assert.equal((await route.POST(upload(crypto.randomUUID()))).status,200);
 assert.equal((await route.POST(upload(crypto.randomUUID()))).status,409);assert.equal(objects.size,20);
 assert.equal((await route.POST(upload(crypto.randomUUID(),"save","sv"))).status,200);
 assert.equal((await route.DELETE(new Request("https://example.com/api/recordings?id="+id,{method:"DELETE",headers:headers("owner")}))).status,200);assert.equal(objects.size,21);
 assert.equal((await route.DELETE(new Request("https://example.com/api/recordings?id="+id,{method:"DELETE",headers:headers("nikki")}))).status,200);assert.equal(objects.size,20);
 assert.equal((await get("?id="+id)).status,404);
 }finally{if(old===undefined)delete process.env.ALLOWED_USER_EMAILS;else process.env.ALLOWED_USER_EMAILS=old;delete globalThis.__journeyTestDb;delete globalThis.__recordingEnv;sqlite.close()}
});

test("progress merges preserve independent edits, intentional removals and cumulative reflections",async()=>{
 const {mergeProgress}=await import(await moduleUrl("lib/progress-sync.ts"));
 const base={completed:["cafe"],savedPhrases:["bonjour"],reviews:{cafe:"old"},listeningPatterns:{Numbers:1}};
 const local={...base,completed:["cafe","train"],savedPhrases:[],listeningPatterns:{Numbers:2}};
 const remote={...base,completed:["cafe","marche"],savedPhrases:["bonjour","merci"],reviews:{cafe:"new"},listeningPatterns:{Numbers:3}};
 const merged=mergeProgress(base,local,remote);
 assert.deepEqual(new Set(merged.completed),new Set(["cafe","train","marche"]));assert.deepEqual(merged.savedPhrases,["merci"]);
 assert.equal(merged.reviews.cafe,"new");assert.equal(merged.listeningPatterns.Numbers,4);
 assert.deepEqual(mergeProgress(base,base,remote),remote);
});

test("new persistent APIs protect revisions, quotas, request ownership, release acknowledgements and retry history",async()=>{
 const sqlite=new DatabaseSync(":memory:");const {readdir}=await import("node:fs/promises");
 for(const name of (await readdir(new URL("drizzle/",root))).filter(n=>n.endsWith(".sql")).sort())sqlite.exec(await readFile(new URL("drizzle/"+name,root),"utf8"));
 globalThis.__journeyTestDb=drizzle(d1Adapter(sqlite));
 const oldAllowed=process.env.ALLOWED_USER_EMAILS,oldOwner=process.env.OWNER_EMAIL;process.env.ALLOWED_USER_EMAILS="nikki@example.com,owner@example.com";process.env.OWNER_EMAIL="owner@example.com";
 const req=(path,method="GET",body,user="nikki",revision)=>new Request("https://example.com/api/"+path,{method,headers:{"oai-authenticated-user-id":user,"oai-authenticated-user-email":user+"@example.com",origin:"https://example.com","Content-Type":"application/json",...(revision!==undefined?{"If-Match":String(revision)}:{})},...(body?{body:JSON.stringify(body)}:{})});
 try{
  const progress=await import(await moduleUrl("app/api/progress/route.ts"));
  assert.equal((await progress.PUT(req("progress","PUT",{completed:["cafe"]}))).status,428);
  const saved=await progress.PUT(req("progress","PUT",{completed:["cafe"]},"nikki",0));assert.equal(saved.status,200);const rev=(await saved.json()).syncedAt;
  assert.equal((await progress.PUT(req("progress","PUT",{completed:[]},"nikki",0))).status,409);
  assert.equal((await progress.PUT(req("progress","PUT",{completed:["cafe","train"]},"nikki",rev))).status,200);
  assert.equal((await progress.PUT(req("progress","PUT",{completed:[]},"nikki",rev))).status,409);
  assert.deepEqual((await(await progress.GET(req("progress"))).json()).state.completed,["cafe","train"]);
  const guard=await import(await moduleUrl("app/api/ai-guard.ts"));
  for(let i=0;i<60;i++)assert.equal(await guard.guardAiRequest(req("speech","POST",{})),null);
  assert.equal((await guard.guardAiRequest(req("speech?language=sv","POST",{}))).status,429);
  assert.equal(await guard.guardAiRequest(req("speech","POST",{},"owner")),null);
  const requests=await import(await moduleUrl("app/api/requests/route.ts"));
  const note={id:"request-test-000000001",text:"More café surprises",kind:"idea",language:"both"};
  assert.equal((await requests.POST(req("requests","POST",note))).status,200);
  assert.equal((await requests.POST(req("requests","POST",note))).status,200);
  assert.equal((await(await requests.GET(req("requests?language=sv"))).json()).requests.length,1);
  assert.equal((await requests.GET(req("requests?owner=1"))).status,403);
  const update={id:note.id,userId:"nikki",status:"planned",message:"Next up"};
  assert.equal((await requests.PATCH(req("requests","PATCH",update))).status,403);
  assert.equal((await requests.PATCH(req("requests","PATCH",update,"owner"))).status,200);
  const releaseId="2026-09-30-two-languages";
  assert.equal((await requests.PATCH(req("requests","PATCH",{...update,status:"shipped",releaseId,message:"Ready in Library"},"owner"))).status,200);
  const updates=await import(await moduleUrl("app/api/feedback-updates/route.ts"));
  const notice=(await(await updates.GET(req("feedback-updates?language=sv"))).json()).updates[0];assert.equal(notice.handled,true);
  await updates.PATCH(req("feedback-updates?language=sv","PATCH",{noteId:notice.noteId,updatedAt:notice.updatedAt}));
  assert.ok((await(await updates.GET(req("feedback-updates"))).json()).updates[0].seenAt);
  const journey=await import(await moduleUrl("app/api/journey/route.ts"));
  await journey.POST(req("journey?language=sv","POST",{kind:"release-seen",source:releaseId}));
  assert.ok(!(await(await journey.GET(req("journey"))).json()).releases.some(r=>r.id===releaseId));
  const ann=await import(await moduleUrl("app/api/announcements/route.ts"));
  const answer={id:"mall-closing",answers:[1,0,2],listens:1,attemptId:"attempt-00000000001"};
  assert.equal((await(await ann.POST(req("announcements","POST",answer))).json()).awarded,25);
  const duplicate=(await(await ann.POST(req("announcements","POST",answer))).json());assert.equal(duplicate.awarded,0);assert.equal(duplicate.result.condition,"first");
  await ann.POST(req("announcements","POST",{...answer,listens:2,answers:[0,0,0],attemptId:"attempt-00000000002"}));
  const history=(await(await ann.GET(req("announcements"))).json()).attempts;assert.equal(history.length,2);assert.equal(history.find(a=>a.score===33).condition,"familiar");assert.deepEqual(new Set(history.map(a=>a.score)),new Set([100,33]));
  assert.equal((await(await ann.GET(req("announcements?category=situations"))).json()).items.length,8);
  assert.equal((await(await ann.GET(req("announcements?language=sv&category=situations"))).json()).items.length,6);
 }finally{for(const [key,value]of [["ALLOWED_USER_EMAILS",oldAllowed],["OWNER_EMAIL",oldOwner]])if(value===undefined)delete process.env[key];else process.env[key]=value;delete globalThis.__journeyTestDb;sqlite.close();}
});

test("daily mix prioritizes due reviews and selects within the active language",async()=>{
 const {dailyPractice}=await import(await moduleUrl("lib/daily-practice.ts")),{passages}=await import(await moduleUrl("content/passages.ts"));
 const catalog=passages.filter(p=>p.language==="sv"),plan=dailyPractice(catalog,["sv-hej"],{"sv-hej":"2020-01-01"},{},Date.parse("2026-09-30"));
 assert.equal(plan.review.id,"sv-hej");assert.equal(plan.lesson.language,"sv");assert.notEqual(plan.lesson.id,"sv-hej");
 assert.ok(["announcements","situations"].includes(plan.quick));
});

test("new library content, filters and recorded audio are complete",async()=>{
 const {passages}=await import(await moduleUrl("content/passages.ts"));
 const {selectLessons,lessonStatus}=await import(await moduleUrl("lib/library.ts"));
 const french=passages.filter(p=>(p.language||"fr")==="fr"),swedish=passages.filter(p=>p.language==="sv");
 assert.equal(new Set(passages.map(p=>p.id)).size,passages.length);
 assert.equal(swedish.length,12);assert.ok(swedish.every(p=>p.level==="A1"));
 assert.equal(french.filter(p=>p.category==="poetry").length,6);
 const options={category:"poetry",status:"all",sort:"title",completed:[],started:[],reviews:{}};
 assert.equal(selectLessons(french,options).length,6);
 assert.equal(selectLessons(french,{...options,status:"completed",completed:["poeme-demain"]})[0].id,"poeme-demain");
 assert.equal(lessonStatus("cafe",["cafe"],["cafe"]),"completed");
 assert.equal(lessonStatus("cafe",[],["cafe"]),"in-progress");
 for(const p of passages.filter(p=>p.releasedAt==="2026-09-30")){
  assert.ok(p.text.length>40);assert.ok(p.phrase);assert.ok(p.audioFile);
  assert.ok((await readFile(new URL("public"+p.audioFile,root))).length>1000,p.id);
 }
});

test("language progress is isolated, appearance shared, and announcement XP is idempotent",async()=>{
 const sqlite=new DatabaseSync(":memory:");
 for(const migration of ["0000_greedy_darkstar.sql","0001_secret_human_cannonball.sql","0002_smart_marrow.sql"])sqlite.exec(await readFile(new URL("drizzle/"+migration,root),"utf8"));
 globalThis.__journeyTestDb=drizzle(d1Adapter(sqlite));
 const previous=process.env.ALLOWED_USER_EMAILS;process.env.ALLOWED_USER_EMAILS="nikki@example.com";
 const req=(path,method="GET",body)=>new Request("https://example.com/api/"+path,{method,headers:{"oai-authenticated-user-id":"nikki","oai-authenticated-user-email":"nikki@example.com",origin:"https://example.com","Content-Type":"application/json","If-Match":"0"},...(body?{body:JSON.stringify(body)}:{})});
 try{
  const progress=await import(await moduleUrl("app/api/progress/route.ts")),ann=await import(await moduleUrl("app/api/announcements/route.ts"));
  assert.equal((await progress.PUT(req("progress","PUT",{completed:["cafe"],holidayTheme:"classic"}))).status,200);
  assert.equal((await progress.PUT(req("progress?language=sv","PUT",{completed:["sv-hej"],holidayTheme:"winter"}))).status,200);
  const fr=await(await progress.GET(req("progress"))).json(),sv=await(await progress.GET(req("progress?language=sv"))).json();
  assert.deepEqual(fr.state.completed,["cafe"]);assert.deepEqual(sv.state.completed,["sv-hej"]);assert.equal(fr.state.holidayTheme,"winter");
  assert.equal((await ann.GET(new Request("https://example.com/api/announcements"))).status,401);
  const catalog=await(await ann.GET(req("announcements"))).json();assert.equal(catalog.items.length,12);assert.ok(catalog.items.every(a=>a.questions.every(q=>!("answer"in q))));
  assert.equal((await(await ann.GET(req("announcements?language=sv"))).json()).items.length,3);
  const body={id:"mall-closing",answers:[1,0,2],listens:1};
  assert.equal((await(await ann.POST(req("announcements","POST",body))).json()).awarded,25);
  assert.equal((await(await ann.POST(req("announcements","POST",{...body,answers:[0,0,0],listens:2}))).json()).awarded,0);
  assert.equal((await ann.POST(req("announcements?language=sv","POST",body))).status,400);
  const event=sqlite.prepare("select details from journey_events where user_id='nikki' and kind='announcement'").get();
  assert.equal(JSON.parse(event.details).score,100);assert.equal(JSON.parse(event.details).condition,"first");
  assert.deepEqual((await(await ann.GET(req("announcements?language=sv"))).json()).completed,[]);
  await ann.POST(req("announcements?language=sv","POST",{id:"sv-butik",answers:[0,1,2],listens:1}));
  const journey=await import(await moduleUrl("app/api/journey/route.ts"));
  const frenchJourney=await(await journey.GET(req("journey"))).json(),swedishJourney=await(await journey.GET(req("journey?language=sv"))).json();
  assert.equal(frenchJourney.collectionXp,50);assert.equal(swedishJourney.collectionXp,50);
  assert.equal(frenchJourney.events.reduce((sum,e)=>sum+e.xp,0),25);
  assert.equal(swedishJourney.events.reduce((sum,e)=>sum+e.xp,0),25);
  assert.equal(frenchJourney.events[0].source,"mall-closing");assert.equal(swedishJourney.events[0].source,"sv-butik");
 }finally{if(previous===undefined)delete process.env.ALLOWED_USER_EMAILS;else process.env.ALLOWED_USER_EMAILS=previous;delete globalThis.__journeyTestDb;sqlite.close()}
});

test("usage timing excludes idle, hidden, unfocused and suspended tabs; overlaps count once",async()=>{
 const {activeSlice,unionMs,summarizeUsage,usageDay,weekStartDay}=await import(await moduleUrl("lib/usage.ts"));
 assert.equal(activeSlice(1000,6000,1000,true,true,false),5000);
 assert.equal(activeSlice(59000,64000,0,true,true,false),1000);
 assert.equal(activeSlice(65000,70000,0,true,true,false),0);
 assert.equal(activeSlice(65000,70000,0,true,true,true),5000);
 assert.equal(activeSlice(65000,70000,0,false,true,true),0);
 assert.equal(activeSlice(65000,70000,0,true,false,true),0);
 assert.equal(activeSlice(0,3600000,0,true,true,true),0);
 assert.equal(unionMs([{start:0,end:10},{start:5,end:15},{start:5,end:15}],2,12),10);
 const now=Date.parse("2026-08-27T16:00:00Z"),start=now-600000;
 assert.equal(weekStartDay(now),"2026-08-24");
 assert.equal(usageDay(Date.parse("2026-08-24T02:00:00Z")),"2026-08-23");
 const session=(id,source,stage,completedAt=null)=>({id,source,stage,startedAt:start,lastActiveAt:start+5000,completedAt});
 const sessions=[session("a","library:cafe",1),session("b","studio:Zpcrn1b6baQ:0:60",3,start+5000),session("c","app",0)];
 const samples=sessions.map(s=>({sessionId:s.id,start,end:start+5000}));
 const report=summarizeUsage(sessions,samples,now,7);
 assert.equal(report.activeMs,5000);assert.equal(report.practiceDaysThisWeek,1);
 assert.equal(report.sources[0].completed,0);assert.equal(report.sources[1].completed,1);
 assert.equal(report.stops[1].library,1);assert.equal(report.stops[3].studio,0);
 assert.equal(report.recent.length,2);assert.equal(report.lastActive,start+5000);
});

test("owner usage API denies learners, saves idempotent intervals, and confirms zero-XP loops",async()=>{
 const sqlite=new DatabaseSync(":memory:");
 for(const migration of ["0000_greedy_darkstar.sql","0001_secret_human_cannonball.sql","0002_smart_marrow.sql","0003_white_moon_knight.sql"])sqlite.exec(await readFile(new URL("drizzle/"+migration,root),"utf8"));
 const allowed=process.env.ALLOWED_USER_EMAILS,owner=process.env.OWNER_EMAIL,realNow=Date.now;let clock=Date.parse("2026-08-27T16:00:00Z");
 process.env.ALLOWED_USER_EMAILS="nikki@example.com,owner@example.com";process.env.OWNER_EMAIL="owner@example.com";Date.now=()=>clock;
 globalThis.__journeyTestDb=drizzle(d1Adapter(sqlite));
 try{
  const telemetry=await import(await moduleUrl("app/api/usage/route.ts")),dashboard=await import(await moduleUrl("app/api/owner-usage/route.ts")),journey=await import(await moduleUrl("app/api/journey/route.ts"));
  const req=(path,user="nikki",body,origin="https://example.com")=>new Request("https://example.com/api/"+path,{method:body?"POST":"GET",headers:{"oai-authenticated-user-id":user,"oai-authenticated-user-email":user+"@example.com",origin,"Content-Type":"application/json","If-Match":"0"},...(body?{body:JSON.stringify(body)}:{})});
  assert.equal((await dashboard.GET(new Request("https://example.com/api/owner-usage"))).status,401);
  assert.equal((await dashboard.GET(req("owner-usage"))).status,403);
  assert.equal((await dashboard.GET(req("owner-usage","outsider"))).status,403);
  assert.equal((await dashboard.GET(req("owner-usage?learner=outsider@example.com","owner"))).status,400);
  assert.equal((await dashboard.GET(req("owner-usage?days=200","owner"))).status,400);
  const id="11111111-1111-4111-8111-111111111111",id2="22222222-2222-4222-8222-222222222222";
  const body={id,source:"library:cafe",stage:1,samples:[{seq:0,start:clock-5000,end:clock}]};
  assert.equal((await telemetry.POST(new Request("https://example.com/api/usage",{method:"POST",body:JSON.stringify(body)}))).status,401);
  assert.equal((await telemetry.POST(req("usage","nikki",body,"https://evil.example"))).status,403);
  for(let i=0;i<2;i++)assert.equal((await telemetry.POST(req("usage","nikki",body))).status,200);
  assert.equal(sqlite.prepare("select count(*) as n from usage_samples").get().n,1);
  assert.equal((await telemetry.POST(req("usage","nikki",{...body,source:"studio:Zpcrn1b6baQ:0:60"}))).status,409);
  assert.equal((await telemetry.POST(req("usage","nikki",{...body,samples:[{seq:1,start:clock-3600000,end:clock}]}))).status,400);
  assert.equal((await telemetry.POST(req("usage","nikki",{...body,id:id2}))).status,200);
  // Owner activity must not contaminate Nikki's dashboard, even with a matching session id.
  assert.equal((await telemetry.POST(req("usage","owner",body))).status,200);
  const loop={kind:"loop",source:"library:cafe",usageSessionId:id,summary:"The speaker ordered a coffee.",retell:"Elle commande un café à emporter.",decoded:true,shadowed:true};
  let r=await journey.POST(req("journey","nikki",loop));assert.equal((await r.json()).awarded,40);
  r=await journey.POST(req("journey","nikki",{...loop,usageSessionId:id2}));assert.equal((await r.json()).awarded,0);
  await journey.POST(req("journey","nikki",{...loop,usageSessionId:id2}));
  await telemetry.POST(req("usage","nikki",{...body,stage:0}));
  assert.equal(sqlite.prepare("select stage from usage_sessions where user_id='nikki' and id=?").get(id).stage,3);
  let response=await dashboard.GET(req("owner-usage","owner"));assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"private, no-store");
  const report=await response.json();assert.equal(report.usage.sources[0].completed,2);assert.equal(report.usage.activeMs,5000);assert.equal(report.usage.recent.length,2);
  assert.equal(report.usage.practiceDaysThisWeek,1);assert.equal(report.learning.checkpoints.length,0);
  assert.equal(JSON.stringify(report).includes("The speaker ordered"),false);
  // Invalid learning loops cannot mark a usage session complete.
  const id3="33333333-3333-4333-8333-333333333333";
  await telemetry.POST(req("usage","nikki",{...body,id:id3}));
  assert.equal((await journey.POST(req("journey","nikki",{...loop,usageSessionId:id3,retell:""}))).status,400);
  assert.equal(sqlite.prepare("select completed_at from usage_sessions where user_id='nikki' and id=?").get(id3).completed_at,null);
  delete process.env.OWNER_EMAIL;assert.equal((await dashboard.GET(req("owner-usage","owner"))).status,403);
 }finally{Date.now=realNow;for(const [key,value]of [["ALLOWED_USER_EMAILS",allowed],["OWNER_EMAIL",owner]])if(value===undefined)delete process.env[key];else process.env[key]=value;delete globalThis.__journeyTestDb;sqlite.close()}
});

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
test("usage client stops on blur/hidden transitions and never retroactively counts an idle gap",async()=>{
 const previous={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,now:Date.now};
 const performanceDescriptor=Object.getOwnPropertyDescriptor(globalThis,"performance");
 let time=0,visible=true,focused=true,interval;const effects=[],sent=[],listeners=new Map(),base=Date.parse("2026-08-27T16:00:00Z");
 const add=(name,fn)=>listeners.set(name,fn),remove=(name)=>listeners.delete(name);
 globalThis.__usageHooks={useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)};
 globalThis.window={setInterval:fn=>{interval=fn;return 1},clearInterval:()=>{},addEventListener:add,removeEventListener:remove};
 globalThis.document={get visibilityState(){return visible?"visible":"hidden"},hasFocus:()=>focused,querySelectorAll:()=>[],addEventListener:add,removeEventListener:remove};
 globalThis.fetch=async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok:true}};
 Date.now=()=>base+time;Object.defineProperty(globalThis,"performance",{configurable:true,value:{now:()=>time}});
 try{
  let source=await readFile(new URL("app/use-usage.ts",root),"utf8");
  source=source.replace('"react"',JSON.stringify(dataUrl("export const {useRef,useEffect}=globalThis.__usageHooks"))).replace('"../lib/usage"',JSON.stringify(await moduleUrl("lib/usage.ts")));
  const {useUsage}=await import(dataUrl(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText));
  const tracker=useUsage("library:cafe",0,false);const cleanups=effects.map(fn=>fn());
  const tick=async t=>{time=t;interval();await Promise.resolve()};
  await tick(5000);assert.equal(sent[0].samples[0].end-sent[0].samples[0].start,5000);
  time=6000;visible=false;listeners.get("visibilitychange")();await Promise.resolve();
  await tick(10000);assert.equal(sent.length,1);
  time=12000;visible=true;listeners.get("visibilitychange")();await tick(15000);
  assert.equal(sent.at(-1).samples[0].start,base+12000);
  time=16000;focused=false;listeners.get("blur")();await tick(20000);
  time=22000;focused=true;listeners.get("focus")();await tick(25000);
  assert.equal(sent.at(-1).samples[0].start,base+22000);
  for(let t=30000;t<=90000;t+=5000)await tick(t);
  const count=sent.length;await tick(95000);assert.equal(sent.length,count);
  time=97000;listeners.get("keydown")();await tick(100000);
  assert.equal(sent.at(-1).samples[0].start,base+97000);
  assert.ok(tracker.sessionId());
  for(const cleanup of cleanups)cleanup?.();
  assert.equal(listeners.size,0);
 }finally{for(const key of ["window","document","fetch"])if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key];Date.now=previous.now;Object.defineProperty(globalThis,"performance",performanceDescriptor);delete globalThis.__usageHooks}
});
async function moduleUrl(path){
 if(moduleUrls.has(path))return moduleUrls.get(path);
 let source=await readFile(new URL(path,root),"utf8");
 const replacements={
  "./service-passages.ts":"content/service-passages.ts", "./poetry-passages.ts":"content/poetry-passages.ts", "./swedish-passages.ts":"content/swedish-passages.ts", "../learning-track":"app/api/learning-track.ts", "./app-auth":"app/api/app-auth.ts",
  "../app-auth":"app/api/app-auth.ts","../../../lib/journey":"lib/journey.ts","../../../lib/usage":"lib/usage.ts",
  "../../../content/passages":"content/passages.ts","../../../content/checkpoints":"content/checkpoints.ts",
  "../../../content/releases":"content/releases.ts",
  "../../../content/announcements":"content/announcements.ts", "../../../content/situations":"content/situations.ts", "../../../lib/feedback-notes":"lib/feedback-notes.ts", "../../db/schema":"db/schema.ts",
  "../../../db/schema":"db/schema.ts",
 };
 for(const [specifier,target]of Object.entries(replacements))if(source.includes('"'+specifier+'"'))source=source.replaceAll('"'+specifier+'"',JSON.stringify(await moduleUrl(target)));
 source=source.replaceAll('"../../db"',JSON.stringify(dataUrl("export const getDb=()=>globalThis.__journeyTestDb")));
 source=source.replaceAll('"../../../db"',JSON.stringify(dataUrl("export const getDb=()=>globalThis.__journeyTestDb")));
 source=source.replaceAll('"cloudflare:workers"',JSON.stringify(dataUrl("export const env=globalThis.__recordingEnv")));
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
  const request=(body,user="nikki",origin="https://example.com")=>new Request("https://example.com/api/journey",{method:body?"POST":"GET",headers:{"oai-authenticated-user-id":user,"oai-authenticated-user-email":user+"@example.com",origin,"Content-Type":"application/json","If-Match":"0"},...(body?{body:JSON.stringify(body)}:{})});
  const post=async(body,user)=>{const response=await POST(request(body,user));return {status:response.status,...await response.json()}};
  assert.equal((await GET(new Request("https://example.com/api/journey"))).status,401);
  assert.equal((await POST(request({kind:"goal",source:"weekly",goal:3},"nikki","https://evil.example"))).status,403);
  sqlite.prepare("INSERT INTO learner_progress VALUES(?,?,?,?)").run("nikki","nikki@example.com",JSON.stringify({xp:825,savedPhrases:["bonjour","merci"],completed:[],reviews:{},phraseReviews:{}}),clock);
  let state=await (await GET(request())).json();
  assert.equal(state.releases.length,9);
  assert.equal((await post({kind:"release-seen",source:"unknown"})).status,400);
  assert.equal((await post({kind:"release-seen",source:"2026-10-06-studio-paused"})).status,200);
  assert.equal((await post({kind:"release-seen",source:"2026-10-06-studio-paused"})).status,200);
  state=await (await GET(request())).json();
  assert.equal(state.releases.length,0);
  assert.equal(state.historicalXp,825);assert.equal(state.events.filter(e=>e.xp>0).length,0);
  assert.equal(state.checkpoint.questions[0].answer,undefined);
  assert.equal((await post({kind:"equip",source:"croissant",category:"avatar"})).status,403);
  assert.equal((await post({kind:"loop",source:"library:cafe"})).status,400);
  const loop={kind:"loop",source:"library:cafe",summary:"The speaker ordered a coffee.",retell:"Elle commande un café à emporter.",decoded:true,shadowed:true};
  const parallel=await Promise.all([post(loop),post(loop)]);
  assert.equal(parallel.reduce((sum,r)=>sum+r.awarded,0),40);
  assert.equal((await post(loop)).awarded,0);
  assert.equal((await post({kind:"shadow",source:"library:cafe",repeated:true})).awarded,10);
  assert.equal((await post({kind:"shadow",source:"library:cafe",repeated:true})).awarded,0);
  assert.equal((await post({kind:"rehearse",source:"library:cafe",repeated:true})).awarded,0,"renaming cannot double the daily reward");
  assert.equal((await post({...loop,rehearsed:false})).status,400,"explicit incomplete rehearsal cannot fall back to legacy completion");
  assert.equal((await post({...loop,shadowed:undefined,rehearsed:true})).status,200,"no microphone or shadowing required");
  assert.equal((await post({...loop,shadowed:undefined,rehearsed:false})).status,400);
  const phrases=await Promise.all([post({kind:"phrase",source:"bonjour",rating:"Good"}),post({kind:"phrase",source:"merci",rating:"Again"})]);
  assert.equal(phrases.reduce((sum,r)=>sum+r.awarded,0),10);
  assert.equal((await post({kind:"phrase",source:"bonjour",rating:"Good"})).awarded,0);
  assert.equal((await post({kind:"checkpoint",source:"town-transport",answers:[1,2,0],listens:1})).status,409);
  const checkpoint=await post({kind:"checkpoint",source:"library-hours",answers:[0,1,2],listens:1});
  assert.equal(checkpoint.awarded,25);assert.equal(checkpoint.result.score,100);
  assert.equal((await post({kind:"checkpoint",source:"library-hours",answers:[1,0,0],listens:1})).result.score,100);
  assert.equal((await post({kind:"checkpoint",source:"town-transport",answers:[1,2,0],listens:1})).status,409);
  assert.equal((await post({...loop,source:"studio:Zpcrn1b6baQ:0:60",shadowed:undefined,rehearsed:true})).awarded,40);
  assert.equal((await post({kind:"rehearse",source:"studio:Zpcrn1b6baQ:0:60",repeated:false})).status,400);
  assert.equal((await post({kind:"equip",source:"croissant",category:"avatar"})).status,200);
  assert.equal((await post({kind:"equip",source:"bear",category:"avatar"})).status,403);
  assert.equal((await post({kind:"goal",source:"weekly",goal:8})).status,400);
  assert.equal((await post({kind:"goal",source:"weekly",goal:4})).status,200);
  // A stale progress save cannot change ledger XP or historical credit.
  sqlite.prepare("UPDATE learner_progress SET state=? WHERE user_id=?").run(JSON.stringify({xp:0,completed:["cafe"],reviews:{cafe:new Date(clock-1000).toISOString()},savedPhrases:["bonjour"],phraseReviews:{}}),"nikki");
  state=await (await GET(request())).json();assert.equal(state.historicalXp,825);assert.equal(state.avatar,"croissant");assert.equal(state.weeklyGoal,4);
  assert.equal(state.releases.length,0,"stale progress must not resurrect dismissed updates");
  assert.equal((await (await GET(request(undefined,"owner"))).json()).events.length,0);
  clock+=2*86400000;
  // A shadow reward must not block the separately earned due review reward.
  assert.equal((await post({kind:"shadow",source:"library:cafe",repeated:true})).awarded,10);
  assert.equal((await post({...loop,kind:"review"})).awarded,20);
  assert.equal((await post({...loop,kind:"review"})).awarded,0);
  assert.equal((await post({kind:"rehearse",source:"studio:Zpcrn1b6baQ:0:60",repeated:true})).awarded,10);
  assert.equal((await post({kind:"shadow",source:"studio:Zpcrn1b6baQ:0:60",repeated:true})).awarded,0);
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
test("release history shows only unseen updates and tolerates unknown legacy IDs",async()=>{
 const {releases,unseenReleases}=await import(await moduleUrl("content/releases.ts"));
 assert.equal(unseenReleases([]).length,releases.length);
 assert.deepEqual(unseenReleases([],releases[0].id).map(r=>r.id),releases.slice(1).map(r=>r.id));
 assert.equal(unseenReleases([],"unrecognized-old-version").length,releases.length);
 assert.equal(unseenReleases(releases.map(r=>({kind:"release-seen",source:r.id}))).length,0);
});
test("loop drafts and review saves remain independent",async()=>{
 const page=await readFile(new URL("app/page.tsx",root),"utf8");
 assert.match(page,/summary:firstSummary,retell,/);
 assert.match(page,/summary:studioFirst,retell:studioRetell/);
 assert.match(page,/text=\{retell\} setText=\{setRetell\}/);
 assert.match(page,/text=\{studioRetell\} setText=\{setStudioRetell\}/);
 assert.match(page,/if\(await onRate\(phrase,rating\)\)/);
 const sync=await readFile(new URL("app/use-progress-sync.ts",root),"utf8");
 assert.match(sync,/put.status===202/);assert.match(sync,/If-Match/);
 assert.doesNotMatch(page,/localStorage.getItem\(PROGRESS_KEY\)/);
});
