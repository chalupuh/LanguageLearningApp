import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {validComprehension,listeningCondition,conditionLabel} from '../lib/comprehension.ts';
import {restoreParisianDraft} from '../lib/parisian-draft.ts';
import {parisianVariant} from '../content/parisian-french.ts';
import {passages} from '../content/passages.ts';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const load=s=>import('data:text/javascript;base64,'+Buffer.from(compile(s).replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))).toString('base64'));
const good={score:78,understood:['The café is out of filter coffee.'],missed:['He waits ten minutes.'],misconception:null,listening_target:'Notice the wait.',hint:'How long?'};
const tick=()=>new Promise(r=>setImmediate(r));
test('comprehension API rejects malformed successful model replies and never caches learner feedback',async()=>{
 let source=await readFile(new URL('../app/api/comprehension/route.ts',import.meta.url),'utf8');source=source.replace(/^import .*;\r?\n/gm,'');source='const {validComprehension,guardAiRequest,fetchAi,retellMeaningPolicy}=globalThis.__comprehensionApi;'+source;
 const oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-placeholder';let response=good;
 globalThis.__comprehensionApi={validComprehension,guardAiRequest:async()=>null,retellMeaningPolicy:'Judge meaning.',fetchAi:async()=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(response)}]}]})};
 try{const {POST}=await load(source),request=()=>new Request('http://localhost/api/comprehension',{method:'POST',body:JSON.stringify({summary:'A customer orders coffee.',passage:'Un client commande un café.'})});
 const valid=await POST(request());assert.equal(valid.status,200);assert.equal(valid.headers.get('Cache-Control'),'private, no-store');assert.deepEqual(await valid.json(),good);
 response={score:80,understood:null};assert.equal((await POST(request())).status,502);
 }finally{if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;delete globalThis.__comprehensionApi;}
});
test('coaching accepts bounded structured results and preserves honest listening conditions',()=>{
 assert.equal(validComprehension(good),true);
 for(const bad of [null,{}, {...good,score:101},{...good,understood:'not an array'},{...good,missed:[null]},{...good,listening_target:null}])assert.equal(validComprehension(bad),false);
 assert.equal(listeningCondition({listens:0}),'unknown');assert.equal(listeningCondition({listens:1}),'first');assert.equal(listeningCondition({listens:2}),'replay');assert.equal(listeningCondition({listens:1,slowed:true}),'slowed');assert.equal(listeningCondition({slowed:true,transcript:true}),'transcript');assert.equal(listeningCondition({familiar:true,transcript:true}),'familiar');
 const d=restoreParisianDraft({mode:'parisian',rate:.85,summary:'My saved answer',feedback:good,condition:'slowed',heard:true,listens:2,slowed:true});assert.equal(d.summary,'My saved answer');assert.deepEqual(d.feedback,good);assert.equal(d.slowed,true);assert.equal(restoreParisianDraft({rate:99,summary:'x'.repeat(1000),feedback:{},listens:-3}).summary.length,500);assert.equal(restoreParisianDraft({feedback:{}}).feedback,null);
});
test('a delayed main-lesson assessment cannot replace another lesson or save an observation after cancellation',async()=>{
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 const body=page.slice(page.indexOf(' const assessUnderstanding='),page.indexOf('\n const handlePrimary='));
 let resolve,writes=0,records=0;const oldFetch=globalThis.fetch;globalThis.fetch=()=>new Promise(r=>resolve=r);
 const assessmentRequest={current:null};globalThis.__assessment={assessmentRequest,assessing:false,listeningCondition,completed:[],passage:passages[0],listeningSupport:{current:{slowed:false,transcript:false}},playCount:{current:1},language:'fr',activeSummary:'A customer asks for coffee.',setAssessing(){},setAssessmentError(){writes++},setAssessment(){writes++},setAssessmentCondition(){writes++},setFirstSummary(){writes++},record:async()=>records++,validComprehension};
 try{const {assessUnderstanding}=await load('const {assessmentRequest,assessing,listeningCondition,completed,passage,listeningSupport,playCount,language,activeSummary,setAssessing,setAssessmentError,setAssessment,setAssessmentCondition,setFirstSummary,record,validComprehension}=globalThis.__assessment;'+body+'export {assessUnderstanding};');
 const pending=assessUnderstanding();writes=0;assessmentRequest.current.abort();resolve(Response.json(good));await pending;assert.equal(writes,0);assert.equal(records,0);
 }finally{globalThis.fetch=oldFetch;delete globalThis.__assessment;}
});
test('main lesson playback pauses competing media without pausing itself',async()=>{
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');const code=page.slice(page.indexOf(' const toggleSample='),page.indexOf('\n const replaySample='));let played=0,paused=0,competingPaused=0;
 const mainPlaybackClaiming={current:false},audioRef={current:null};const noop=()=>{};
 const old={Audio:globalThis.Audio,URL:globalThis.URL};globalThis.Audio=class{play(){played++;this.onplay?.();return Promise.resolve()}pause(){paused++}};globalThis.URL={createObjectURL:()=> 'blob:test'};
 globalThis.__mainAudio={captureActive:()=>false,playing:false,audioRef,clearAudio:noop,setPlaying:noop,setVoiceError:noop,audioGeneration:{current:0},loadPassageSpeech:async()=>new Blob(['audio']),passage:passages[0],playCount:{current:0},audioUrlRef:{current:''},playbackRate:1,mainPlaybackClaiming,holdAppPlayback:()=>{competingPaused++;if(!mainPlaybackClaiming.current)audioRef.current?.pause();return noop},listeningSupport:{current:{slowed:false}},setDuration:noop,pendingSeek:{current:null},audioPosition:0,seekTime:()=>0,setProgress:noop,setAudioPosition:noop,playbackInterrupted:()=>false};
 try{const {toggleSample}=await load('const {'+Object.keys(globalThis.__mainAudio).join(',')+'}=globalThis.__mainAudio;'+code+'export {toggleSample};');await toggleSample();assert.equal(played,1);assert.equal(paused,0);assert.equal(competingPaused,1);assert.equal(mainPlaybackClaiming.current,false);
 }finally{Object.assign(globalThis,old);delete globalThis.__mainAudio;}
});
test('phrase audio survives its own pause broadcast and still ignores a later explicit stop',async()=>{
 const page=await readFile(new URL('../app/phrase-tools.tsx',import.meta.url),'utf8');const body=page.slice(page.indexOf(' const listen='),page.indexOf('\n if(!capture)'));
 const generation={current:0},audio={current:null},url={current:''};let played=0,resolve;const old={Audio:globalThis.Audio,URL:globalThis.URL};
 globalThis.Audio=class{play(){played++;return Promise.resolve()}};globalThis.URL={createObjectURL:()=> 'blob:test'};
 const stop=()=>generation.current++;
 globalThis.__phraseAudio={capture:{text:'Merci',context:{source:'library:cafe'}},captureActive:()=>false,stop,generation,holdAppPlayback:()=>{stop();return()=>{}},loadAudio:()=>new Promise(r=>resolve=r),url,audio,setError(){}};
 try{const {listen}=await load('const {'+Object.keys(globalThis.__phraseAudio).join(',')+'}=globalThis.__phraseAudio;'+body+'export {listen};');const first=listen();resolve(new Blob(['audio']));await first;assert.equal(played,1);const second=listen();stop();resolve(new Blob(['audio']));await second;assert.equal(played,1);
 }finally{Object.assign(globalThis,old);delete globalThis.__phraseAudio;}
});
test('Parisian feedback snapshots slowed conditions, keeps the result label after revealing, and saves the answer',async()=>{
 let source=await readFile(new URL('../app/parisian-listening.tsx',import.meta.url),'utf8');source=source.replace(/^import .*;\r?\n/gm,'');source='const {useState,useRef,useEffect,parisianVariant,captureActive,holdAppPlayback,CAPTURE_PLAYBACK_EVENT,validComprehension,listeningCondition,conditionLabel,restoreParisianDraft,HintFeedback}=globalThis.__parisian;'+source;
 let cells=[],refs=[],cursor=0,refCursor=0,tree,saved;const effects=[];const windowBefore=globalThis.window,documentBefore=globalThis.document,fetchBefore=globalThis.fetch;
 globalThis.window=new EventTarget();globalThis.document={querySelectorAll:()=>[]};globalThis.fetch=async()=>Response.json(good);
 globalThis.__parisian={useState(v){const i=cursor++;if(!(i in cells))cells[i]=v;return[cells[i],v=>cells[i]=typeof v==='function'?v(cells[i]):v]},useRef(v){const i=refCursor++;return refs[i]??=( {current:v})},useEffect(fn){effects.push(fn)},parisianVariant,captureActive:()=>false,holdAppPlayback:()=>()=>{},CAPTURE_PLAYBACK_EVENT:'pause-other',validComprehension,listeningCondition,conditionLabel,restoreParisianDraft,HintFeedback:'HintFeedback'};
 try{const Component=(await load(source)).default,props={passage:passages[0],loadAudio:async()=>new Blob(['audio'],{type:'audio/wav'}),draft:restoreParisianDraft({mode:'parisian',rate:.85,summary:'The customer waits for filter coffee.',listens:1,heard:true,slowed:true}),onDraft:d=>saved=d};
 const render=()=>{cursor=0;refCursor=0;effects.length=0;tree=Component(props)};
 const nodes=(n=tree)=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==='object'?[n,...nodes(n.props?.children??null)]:[];
 const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):text(n?.props?.children||'');
 render();nodes().find(n=>n.type==='button'&&text(n)==='Check my Parisian French understanding').props.onClick();await tick();render();assert.equal(nodes().find(n=>n.type==='HintFeedback').props.condition,'Parisian French · Slowed listening');
 nodes().find(n=>n.type==='details').props.onToggle({currentTarget:{open:true}});render();assert.equal(nodes().find(n=>n.type==='HintFeedback').props.condition,'Parisian French · Slowed listening');effects.at(-1)();assert.equal(saved.summary,props.draft.summary);assert.equal(saved.revealed,true);assert.deepEqual(saved.feedback,good);
 assert.equal(tree.props['data-phrase-source'],'library:'+passages[0].id+'-parisian');
 }finally{globalThis.window=windowBefore;globalThis.document=documentBefore;globalThis.fetch=fetchBefore;delete globalThis.__parisian;}
});
