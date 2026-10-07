import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
async function load(path){const source=await readFile(new URL('../'+path,import.meta.url),'utf8');return import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));}
const {nextReview}=await load('lib/review-schedule.ts');
const {mergeProgress}=await load('lib/progress-sync.ts');
const {dailyPractice}=await load('lib/daily-practice.ts');
const {evidenceFor}=await load('lib/learning-evidence.ts');
const {compareDictation}=await load('lib/listening-lab.ts');
const {validExcerpts}=await load('lib/audio-excerpts.ts');
const {frenchDictations,frenchMissions}=await load('content/french-lab.ts');
test('paused Studio blocks imports without upstream requests and keeps authentication',async()=>{
 const url=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
 const auth=await readFile(new URL('../app/api/app-auth.ts',import.meta.url),'utf8');
 const availability=await readFile(new URL('../lib/studio-availability.ts',import.meta.url),'utf8');
 let source=await readFile(new URL('../app/api/youtube-transcript/route.ts',import.meta.url),'utf8');
 source=source.replace('"../app-auth"',JSON.stringify(url(auth))).replace('"../../../lib/studio-availability"',JSON.stringify(url(availability)));
 const {POST}=await import(url(source));const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('Unexpected upstream request')};
 try{
  assert.equal((await POST(new Request('https://example.com/api/youtube-transcript',{method:'POST'}))).status,401);
  for(const language of ['fr','sv']){
   const response=await POST(new Request('http://localhost/api/youtube-transcript',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoId:'MBK7K1Xw3Lc',language})}));
   assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');
   const body=await response.json();assert.equal(body.code,'STUDIO_PAUSED');assert.equal(body.transcript,null);assert.match(body.reason,/temporarily unavailable/);
  }
  assert.equal(calls,0);
 }finally{globalThis.fetch=previous}
});
test('Studio pause removes entry points and protects legacy deep links without deleting drafts',async()=>{
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 const nav=page.split('\n').find(line=>line.includes('const navigation='));
 assert.doesNotMatch(nav.split(' as readonly')[0],/"studio"/);
 assert.match(page,/view==="studio"&&!STUDIO_ENABLED\?<StudioUnavailable/);
 assert.doesNotMatch(page,/Open Studio →/);
 const native=await readFile(new URL('../app/native-listening.tsx',import.meta.url),'utf8');assert.doesNotMatch(native,/href="#studio"/);
 const recovery=await readFile(new URL('../app/session-recovery.tsx',import.meta.url),'utf8');assert.match(recovery,/!r.source.startsWith\("studio:"\)/);
 const availability=await load('lib/studio-availability.ts');assert.equal(availability.STUDIO_ENABLED,false);
});
test('French practice separates accents and preserves meaningful task structure',()=>{
 assert.equal(compareDictation('Ca coute douze euros.','Ça coûte douze euros.'),'marks');
 assert.equal(compareDictation('Ça coûte douze euros !','Ça coûte douze euros.'),'correct');
 assert.equal(compareDictation('Ça coûte deux euros.','Ça coûte douze euros.'),'retry');
 assert.equal(frenchDictations.length,8);assert.ok(frenchMissions.every(m=>m.steps.length===3&&m.steps.every(s=>s.choices.some(c=>c.correct)&&s.choices.some(c=>!c.correct))));
});
test('saved audio excerpts reject invalid bounds and cap per-lesson storage',()=>{
 const good={id:'clip',label:'Words I missed',start:1,end:4};
 assert.deepEqual(validExcerpts({cafe:[good,{...good,end:0},{...good,start:-1}]}),{cafe:[good]});
 assert.equal(validExcerpts({cafe:Array(30).fill(good)}).cafe.length,20);
});
test('Swedish audio ignores a request resolved after stopping',async()=>{
 const source=await readFile(new URL('../app/swedish-lab.tsx',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function useLabAudio('),source.indexOf('export default function SwedishLab'));
 const cleanups=[];let created=0,resolve;
 const AudioBefore=globalThis.Audio;globalThis.Audio=class{constructor(){created++}};
 globalThis.__labHooks={useState:v=>[v,()=>{}],useRef:v=>({current:v}),useEffect:fn=>{const cleanup=fn();if(cleanup)cleanups.push(cleanup)}};
 try{const js=ts.transpileModule('const {useState,useRef,useEffect}=globalThis.__labHooks;'+body+'export {useLabAudio};',{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const {useLabAudio}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 const hook=useLabAudio(()=>new Promise(r=>resolve=r));const pending=hook.play('Hej');hook.stop();resolve(new Blob(['audio']));await pending;assert.equal(created,0);
 }finally{cleanups.forEach(fn=>fn());globalThis.Audio=AudioBefore;delete globalThis.__labHooks}
});
test('cached speech remains authenticated but does not consume paid generation quota',async()=>{
 const oldKey=process.env.OPENAI_API_KEY,oldCaches=globalThis.caches;process.env.OPENAI_API_KEY='test-key-not-a-secret';let charged=0;
 globalThis.caches={default:{match:async()=>new Response('cached',{headers:{'Content-Type':'audio/mpeg'}})}};
 globalThis.__testSpeechGuard={guardAiRequest:async()=>{charged++;return null},fetchAi:async()=>{throw Error('must not generate')}};
 const authSource=await readFile(new URL('../app/api/app-auth.ts',import.meta.url),'utf8');
 const url=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
 let source=await readFile(new URL('../app/api/speech/route.ts',import.meta.url),'utf8');source=source.replace('"../app-auth"',JSON.stringify(url(authSource))).replace('"../ai-guard"',JSON.stringify(url('export const {guardAiRequest,fetchAi}=globalThis.__testSpeechGuard;')));
 try{const {POST}=await import(url(source));const req=host=>new Request(host+'/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Bonjour'})});assert.equal((await POST(req('https://example.com'))).status,401);const response=await POST(req('http://localhost'));assert.equal(response.headers.get('X-Voice-Cache'),'HIT');assert.equal(await response.text(),'cached');assert.equal(charged,0)}finally{if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;globalThis.caches=oldCaches;delete globalThis.__testSpeechGuard}
});
test('review intervals expand, reset on failure, and stay bounded',()=>{
 const now=Date.parse('2026-10-03T12:00:00Z');
 const first=nextReview(undefined,'Good',now),second=nextReview(first.memory,'Good',now);
 assert.equal(first.memory.interval,3);assert.equal(second.memory.interval,6);
 const again=nextReview(second.memory,'Again',now);
 assert.equal(Date.parse(again.due)-now,600000);assert.equal(again.memory.successes,0);assert.equal(again.memory.lapses,1);
 assert.equal(nextReview({...second.memory,interval:120},'Easy',now).memory.interval,120);
});
test('newest speaking attempts survive a two-device merge and display cap',()=>{
 const old=Array.from({length:30},(_,i)=>({id:'old-'+i,createdAt:new Date(Date.UTC(2026,8,1+i)).toISOString()}));
 const local={id:'local',createdAt:'2026-10-03T12:00:00Z'},remote={id:'remote',createdAt:'2026-10-03T11:00:00Z'};
 const merged=mergeProgress({speakingAttempts:old},{speakingAttempts:[local,...old]},{speakingAttempts:[remote,...old]});
 assert.deepEqual(merged.speakingAttempts.slice(0,2),[local,remote]);assert.equal(merged.speakingAttempts.slice(0,30).length,30);
});
test('skill evidence excludes unrelated questions and familiar transfer claims',()=>{
 const make=(source,condition)=>({kind:'announcement-attempt',source,createdAt:0,details:JSON.stringify({condition,skills:[{correct:true},{correct:false},{correct:false}]})});
 assert.deepEqual(evidenceFor([make('train-platform','first')],'time'),{correct:0,total:1,independent:0});
 assert.deepEqual(evidenceFor([make('train-platform','first'),make('train-platform','familiar')],'place'),{correct:2,total:2,independent:1});
 assert.equal(evidenceFor([make('restaurant-number','first')],'time').total,0);
});
test('recommendations use recent reflections, preferences and latest listening evidence',()=>{
 const now=Date.parse('2026-10-03');
 const catalog=[{id:'a',level:'B1',topic:'Travel',category:'everyday',challenges:['numbers']},{id:'b',level:'B2',topic:'Poetry',category:'poetry',challenges:['rhythm']}];
 const plan=dailyPractice(catalog,[],{}, {'Missed a detail':99},now,{preferences:{minutes:10,level:'B2',interest:'poetry',goal:'travel'},reflections:[{createdAt:'2026-10-02',patterns:['Speech too fast']}]});
 assert.equal(plan.lesson.id,'b');assert.equal(plan.quick,'situations');
 const review=dailyPractice(catalog,[],{a:'2026-09-01',b:'2026-09-02'},{},now,{observations:[{source:'library:b',createdAt:now,details:JSON.stringify({score:40,condition:'first'})}]});
 assert.equal(review.review.id,'b');
});
