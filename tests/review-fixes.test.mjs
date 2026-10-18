import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {validSpeakingFeedback} from '../lib/speaking-feedback.ts';
import {localDay,achievements} from '../lib/journey.ts';
import {readLibraryRoute,libraryHash} from '../lib/library-route.ts';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const load=source=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const feedback={cefr_estimate:'Task feedback',score:70,summary:'A clear main idea',strengths:['A useful detail'],corrections:[],word_accuracy:'Clear meaning',rhythm:'Try linking words',pauses:'Natural pauses',liaison_practice:'Practise a link',replay_drill:'Listen and repeat',next_drill:'Retell once more',xp_earned:0};

test('speaking feedback rejects malformed arrays, scores, and unbounded text',()=>{
 assert.equal(validSpeakingFeedback(feedback),true);
 for(const invalid of [null,{...feedback,strengths:null},{...feedback,corrections:null},{...feedback,score:101},{...feedback,summary:'x'.repeat(3001)},{...feedback,xp_earned:100}])assert.equal(validSpeakingFeedback(invalid),false);
});

test('speaking endpoint validates before reserving quota and rejects malformed successful AI output',async()=>{
 const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='mock-only-no-network';
 let reservations=0,calls=0,value=feedback,transcript='Bonjour';
 globalThis.__reviewFeedback={validSpeakingFeedback,speakingTaskPolicy:()=>'',guardAiRequest:async(_request,reserve=true)=>{if(reserve)reservations++;return null},fetchAi:async(url)=>{calls++;return url.includes('transcriptions')?Response.json({text:transcript}):Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]})}};
 try{
  const source=(await read('app/api/feedback/route.ts')).replace(/^import .*;\r?\n/gm,'');
  const {POST}=await load('const {validSpeakingFeedback,speakingTaskPolicy,guardAiRequest,fetchAi}=globalThis.__reviewFeedback;'+source);
  const request=(size=5)=>{const form=new FormData();if(size)form.append('audio',new Blob(['x'.repeat(size)],{type:'audio/webm'}),'recording.webm');return new Request('https://app.test/api/feedback',{method:'POST',body:form})};
  assert.equal((await POST(request(0))).status,400);assert.equal(reservations,0);assert.equal(calls,0);
  value={...feedback,strengths:null};assert.equal((await POST(request())).status,502);
  value=feedback;const response=await POST(request());assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  transcript=null;assert.equal((await POST(request())).status,502);
  delete process.env.OPENAI_API_KEY;const before=reservations;assert.equal((await POST(request())).status,503);assert.equal(reservations,before);
 }finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;delete globalThis.__reviewFeedback}
});

test('completed lesson restoration clears previous answers and XP instead of restoring completion',async()=>{
 const source=await read('app/page.tsx'),tree=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let callback;
 const visit=node=>{if(ts.isCallExpression(node)&&node.expression.getText(tree)==='useSessionDraft'&&node.arguments[0].getText(tree).includes('passageId'))callback=node.arguments[2];ts.forEachChild(node,visit)};visit(tree);assert.ok(callback);
 const body=callback.getText(tree),setters=[...new Set(body.match(/\bset[A-Z]\w*/g))];const values={};globalThis.__restoredValues=values;
 const prelude='const values=globalThis.__restoredValues;const passage={text:"Bonjour"};const emptyFluencyDraft={plan:"",phase:0};const validCloserHighlights=x=>x||[];const restoreFluencyDraft=x=>x||emptyFluencyDraft;const resetLibrary=()=>{values.reset=true};'+setters.map(name=>`const ${name}=v=>values.${name}=v;`).join('');
 try{const {restore}=await load(prelude+'export const restore='+body+';');restore({done:true,step:3,text:'Old answer',retell:'Old retell',sessionXp:40});assert.equal(values.reset,true);assert.equal(values.setReviewOrigin,true);assert.equal(values.setSessionXp,0);assert.equal(values.setText,undefined);assert.equal(values.setRetell,undefined);assert.deepEqual(values.setCloserHighlights,[])}finally{delete globalThis.__restoredValues}
});

test('practice dates use Eastern midnight and weekly achievements agree across DST',()=>{
 assert.equal(localDay(new Date('2026-10-19T00:30:00Z')),'2026-10-18');
 assert.equal(localDay(new Date('2026-10-19T04:30:00Z')),'2026-10-19');
 assert.equal(localDay(new Date('2026-11-02T04:30:00Z')),'2026-11-01');
 const events=['2026-10-19T01:00:00Z','2026-10-19T13:00:00Z'].map((date,i)=>({id:String(i),kind:'loop',source:'library:cafe',xp:40,createdAt:Date.parse(date),details:JSON.stringify({weeklyGoal:2})}));
 assert.equal(achievements(events).find(a=>a.name==='A gentle rhythm').value,0);
 const sameWeek=['2026-10-20T01:00:00Z','2026-10-21T13:00:00Z'].map((date,i)=>({...events[i],createdAt:Date.parse(date)}));
 assert.equal(achievements(sameWeek).find(a=>a.name==='A gentle rhythm').value,1);
});

test('library areas and filters round-trip through URLs and reject unsupported values',()=>{
 const route={category:'poetry',status:'in-progress',sort:'title'};
 assert.deepEqual(readLibraryRoute(libraryHash(route),'fr'),route);
 assert.equal(readLibraryRoute(libraryHash(route),'sv').category,'all');
 assert.deepEqual(readLibraryRoute('#library/bad?status=wrong&sort=wrong','fr'),{category:'all',status:'all',sort:'recommended'});
});

test('progress distinguishes durable local saving from failed storage and warns before losing the tab',async()=>{
 const names=['window','document','localStorage','fetch','__progressHooks','__progressMerge'],prior=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 const {mergeProgress,progressEqual}=await import('../lib/progress-sync.ts');
 let cells=[],cursor=0,effects=[],state={},status='',message='',offline=false,storageBlocked=false;
 const intervals=new Set(),timeouts=new Map(),listeners=new Map();let timer=0;
 const target={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 globalThis.window={...target,setInterval:fn=>{intervals.add(fn);return fn},clearInterval:fn=>intervals.delete(fn),setTimeout:fn=>{timeouts.set(++timer,fn);return timer}};
 globalThis.document={...target,visibilityState:'visible'};
 globalThis.localStorage={getItem:()=>null,setItem:()=>{if(storageBlocked)throw Error('quota exceeded')}};
 globalThis.fetch=async(_url,options={})=>{if(options.method==='PUT'||offline)throw Error('offline');return Response.json({userId:'review-test',state:{},syncedAt:null})};
 globalThis.__progressMerge={mergeProgress,progressEqual};
 globalThis.__progressHooks={useRef:v=>{const i=cursor++;return cells[i]??={current:v}},useEffect:(fn,deps)=>{const i=cursor++,old=cells[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))effects.push(()=>{old?.cleanup?.();cells[i]={deps,cleanup:fn()}})}};
 const settle=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve))};
 try{
  const source=(await read('app/use-progress-sync.ts')).replace('import {useEffect,useRef} from "react";','const {useEffect,useRef}=globalThis.__progressHooks;').replace('import {mergeProgress,progressEqual} from "../lib/progress-sync";','const {mergeProgress,progressEqual}=globalThis.__progressMerge;');
  const {useProgressSync}=await load(source);
  const render=()=>{cursor=0;effects=[];useProgressSync(state,{apply:v=>{state=v},onReady:()=>{},onStatus:v=>{status=v},onError:v=>{message=v}},'fr');effects.forEach(fn=>fn())};
  render();await settle();state={savedPhrases:['bonjour']};render();offline=true;intervals.forEach(fn=>fn());await settle();assert.equal(status,'local');assert.match(message,/kept on this device/);
  storageBlocked=true;intervals.forEach(fn=>fn());await settle();assert.equal(status,'unsaved');assert.match(message,/only in this open tab/);
  let prevented=false;listeners.get('beforeunload')({preventDefault:()=>{prevented=true}});assert.equal(prevented,true);
 }finally{cells.forEach(c=>c?.cleanup?.());for(const k of names){if(prior[k]===undefined)delete globalThis[k];else globalThis[k]=prior[k]}}
});
