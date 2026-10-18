import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {emptyCalendar,validCalendar,validWeek,weekStart,monthWeeks,monthShift,mainGoalFor,setMainGoal,mergeCalendar} from '../lib/calendar.ts';
const url=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
const goal=(id='goal-000000000001',text='Listen to a poem',week='2026-10-26')=>({id,text,week,done:false,createdAt:1});
test('calendar weeks cross months and years once, including leap days and daylight-saving boundaries',()=>{
 assert.equal(weekStart('2026-11-01'),'2026-10-26');assert.ok(monthWeeks('2026-10').includes('2026-10-26'));assert.ok(monthWeeks('2026-11').includes('2026-10-26'));
 assert.equal(weekStart('2024-02-29'),'2024-02-26');assert.equal(weekStart('2026-03-08'),'2026-03-02');assert.equal(weekStart('2027-01-01'),'2026-12-28');assert.equal(monthShift('2026-12',1),'2027-01');
 for(const date of ['2026-02-30','2026-10-27','bad',null])assert.equal(validWeek(date),false);
});
test('main goals preserve earlier months and completed goals remain the same across a month boundary',()=>{
 let plan=setMainGoal(emptyCalendar(),'2026-10','Understand servers in Paris');plan={...plan,goals:[goal()]};plan=setMainGoal(plan,'2026-11','Understand a short film');assert.equal(mainGoalFor(plan,'2026-10'),'Understand servers in Paris');assert.equal(mainGoalFor(plan,'2026-12'),'Understand a short film');assert.equal(mainGoalFor(plan,'2026-09'),'');
 const completed={...plan,goals:[{...plan.goals[0],done:true}]};for(const month of ['2026-10','2026-11'])assert.equal(completed.goals.filter(g=>monthWeeks(month).includes(g.week))[0].done,true);
 assert.equal(validCalendar(completed),true);assert.equal(validCalendar({...plan,goals:[goal(),goal()]}),false);assert.equal(validCalendar({...plan,goals:[{...goal(),text:' '}]}),false);assert.equal(validCalendar({...plan,goals:[{...goal(),week:'2026-02-30'}]}),false);
});
test('cross-device merging preserves unrelated edits and detects conflicting edits or deletion',()=>{
 const base={...emptyCalendar(),goals:[goal()]},local={...base,goals:[{...goal(),done:true}]},remote={...base,goals:[goal(),goal('goal-000000000002','Review phrases')]};assert.equal(mergeCalendar(base,local,remote).conflict,false);assert.equal(mergeCalendar(base,local,remote).plan.goals.length,2);assert.equal(mergeCalendar(base,local,remote).plan.goals[0].done,true);
 assert.equal(mergeCalendar(base,local,{...base,goals:[]}).conflict,true);assert.equal(mergeCalendar(base,local,{...base,goals:[{...goal(),text:'A different goal'}]}).conflict,true);assert.equal(mergeCalendar(base,local,local).conflict,false);
});
test('goal editor uses a chosen day to move to the correct week, keeps the existing text, and supports cancel',async()=>{
 const page=await read('app/my-calendar.tsx');let source=page.slice(page.indexOf('function GoalEditor('),page.indexOf('export default function MyCalendar'));
 source='const {useState,useRef,useEffect,weekStart,weekLabel}=globalThis.__calendarEditor;'+source+'export {GoalEditor};';let cells=[],cursor=0,saved,closed=0;
 const {weekLabel}=await import('../lib/calendar.ts');globalThis.__calendarEditor={useState(v){const i=cursor++;if(!(i in cells))cells[i]=v;return[cells[i],v=>cells[i]=v]},useRef:()=>({current:null}),useEffect(){},weekStart,weekLabel};
 try{const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))),{GoalEditor}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));let tree;const render=()=>{cursor=0;tree=GoalEditor({goal:goal(),week:goal().week,onSave:(text,week)=>{saved={text,week};return true},onClose:()=>closed++})},nodes=(n=tree)=>Array.isArray(n)?n.flatMap(x=>nodes(x??null)):n&&typeof n==='object'?[n,...nodes(n.props?.children??null)]:[];
 render();nodes().find(n=>n.type==='input'&&n.props.type==='date').props.onInput({currentTarget:{value:'2026-11-04'}});render();nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.deepEqual(saved,{text:goal().text,week:'2026-11-02'});assert.equal(closed,1);nodes().find(n=>n.type==='button'&&n.props.type==='button').props.onClick();assert.equal(closed,2);
 }finally{delete globalThis.__calendarEditor}
});
test('calendar API uses real SQLite, isolates accounts and languages, and rejects stale writes and invalid origins',async()=>{
 const {DatabaseSync}=await import('node:sqlite'),{drizzle}=await import('drizzle-orm/d1'),sqlite=new DatabaseSync(':memory:');sqlite.exec(await read('drizzle/0008_sloppy_stephen_strange.sql'));
 globalThis.__calendarDb=drizzle({prepare(sql){let args=[];const statement={bind(...values){args=values;return statement},async raw(){const s=sqlite.prepare(sql);s.setReturnArrays(true);return s.all(...args)},async all(){return {success:true,results:sqlite.prepare(sql).all(...args)}},async run(){return {success:true,meta:{changes:sqlite.prepare(sql).run(...args).changes}}}};return statement}});
 const before=process.env.ALLOWED_USER_EMAILS;process.env.ALLOWED_USER_EMAILS='nikki@example.com,owner@example.com';
 try{const auth=url((await read('app/api/learning-track.ts')).replace('"./app-auth"',JSON.stringify(url(await read('app/api/app-auth.ts'))))),schema=url((await read('db/schema.ts')).replace('"drizzle-orm/sqlite-core"',JSON.stringify(import.meta.resolve('drizzle-orm/sqlite-core'))));let source=await read('app/api/calendar/route.ts');
 for(const [from,to] of Object.entries({'../learning-track':auth,'../../../db':url('export const getDb=()=>globalThis.__calendarDb;'),'../../../db/schema':schema,'../../../lib/calendar':url(await read('lib/calendar.ts')),'drizzle-orm':import.meta.resolve('drizzle-orm')}))source=source.replaceAll(JSON.stringify(from),JSON.stringify(to));
 const {GET,PUT}=await import(url(source)),request=(body,user='nikki',language='fr',origin='https://app.test')=>new Request('https://app.test/api/calendar?language='+language,{method:body?'PUT':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.com',origin},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await GET(new Request('https://app.test/api/calendar'))).status,401);assert.equal((await GET(request(null,'outsider'))).status,403);
 const state={...emptyCalendar(),goals:[goal()]},body={state,revision:0};assert.equal((await PUT(request(body,'nikki','fr','https://evil.test'))).status,403);assert.equal((await PUT(request({...body,state:{}}))).status,400);assert.equal((await PUT(request(body))).status,200);assert.equal((await PUT(request(body))).status,409);
 let r=await GET(request());assert.equal(r.headers.get('cache-control'),'private, no-store');assert.deepEqual((await r.json()).state,state);
 assert.equal((await (await GET(request(null,'owner'))).json()).state.goals.length,0);assert.equal((await (await GET(request(null,'nikki','sv'))).json()).state.goals.length,0);
 assert.equal((await PUT(request({...body,state:{...state,goals:[{...goal(),done:true}]},revision:1}))).status,200);assert.equal((await PUT(request(body,'nikki','sv'))).status,200);assert.equal((await (await GET(request(null,'nikki','sv'))).json()).state.goals[0].done,false);assert.equal((await (await GET(request())).json()).state.goals[0].done,true);
 }finally{if(before===undefined)delete process.env.ALLOWED_USER_EMAILS;else process.env.ALLOWED_USER_EMAILS=before;delete globalThis.__calendarDb;sqlite.close()}
});
test('calendar sync keeps offline changes, recovers after remount, combines another device and blocks conflicting edits',async()=>{
 const globals=Object.fromEntries(['window','document','localStorage','fetch','__calendarHooks'].map(k=>[k,globalThis[k]])),store=new Map(),intervals=new Map();let cells=[],cursor=0,effects=[],mounted=false,queued=false,result,offline=false,remote={state:emptyCalendar(),revision:0},timer=0;
 const settle=async()=>{for(let n=0;n<12;n++)await new Promise(r=>setImmediate(r))};
 const enqueue=()=>{if(mounted&&!queued){queued=true;queueMicrotask(()=>{queued=false;if(mounted)render()})}};
 globalThis.__calendarHooks={useState(initial){const i=cursor++;if(!cells[i])cells[i]={value:typeof initial==='function'?initial():initial};return[cells[i].value,v=>{cells[i].value=typeof v==='function'?v(cells[i].value):v;enqueue()}]},useRef(v){const i=cursor++;return cells[i]??={current:v}},useEffect(fn,deps){const i=cursor++,old=cells[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))effects.push(()=>{old?.cleanup?.();cells[i]={deps,cleanup:fn()}})}};
 const eventTarget=()=>({addEventListener(){},removeEventListener(){}});globalThis.window={...eventTarget(),confirm:()=>true};globalThis.document=eventTarget();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const oldSetInterval=globalThis.setInterval,oldClearInterval=globalThis.clearInterval;globalThis.setInterval=fn=>{intervals.set(++timer,fn);return timer};globalThis.clearInterval=id=>intervals.delete(id);
 globalThis.fetch=async(_url,options={})=>{if(options.method==='PUT'){if(offline)throw Error('offline');const b=JSON.parse(options.body);if(b.revision!==remote.revision)return Response.json({error:'Conflict'},{status:409});remote={state:b.state,revision:remote.revision+1};return Response.json({revision:remote.revision})}return Response.json({userId:'nikki',...remote})};
 let source=await read('app/use-calendar.ts');source=source.replace('import {useEffect,useRef,useState} from "react";','const {useEffect,useRef,useState}=globalThis.__calendarHooks;').replace('"../lib/calendar"',JSON.stringify(url(await read('lib/calendar.ts'))));const {useCalendar}=await import(url(source));
 const render=()=>{cursor=0;effects=[];result=useCalendar('fr');effects.forEach(fn=>fn())},mount=()=>{cells=[];mounted=true;render()},unmount=()=>{mounted=false;cells.forEach(c=>c?.cleanup?.())};
 try{mount();await settle();assert.equal(result.ready,true);
 remote={state:{...emptyCalendar(),goals:[goal()]},revision:1};
 for(let i=0;i<10;i++){intervals.forEach(fn=>fn());await settle()}
 assert.equal(result.plan.goals.length,1);
 remote={state:emptyCalendar(),revision:2};for(let i=0;i<10;i++){intervals.forEach(fn=>fn());await settle()}
 assert.equal(result.plan.goals.length,0);
 offline=true;result.change(p=>({...p,goals:[goal()]}));await settle();assert.match(result.status,/waiting to sync/);assert.equal(remote.state.goals.length,0);unmount();offline=false;mount();await settle();assert.equal(remote.state.goals.length,1);assert.equal(result.plan.goals.length,1);
 remote={state:{...remote.state,goals:[...remote.state.goals,goal('goal-000000000002','From the other device')]},revision:remote.revision+1};result.change(p=>({...p,goals:p.goals.map(g=>({...g,done:true}))}));await settle();intervals.forEach(fn=>fn());await settle();assert.equal(remote.state.goals.length,2);assert.equal(remote.state.goals[0].done,true);
 remote={state:{...remote.state,goals:remote.state.goals.map(g=>g.id===goal().id?{...g,text:'Remote change'}:g)},revision:remote.revision+1};result.change(p=>({...p,goals:p.goals.map(g=>g.id===goal().id?{...g,text:'My conflicting change'}:g)}));await settle();assert.equal(result.conflict,true);assert.equal(result.plan.goals[0].text,'My conflicting change');assert.equal(remote.state.goals[0].text,'Remote change');assert.equal(result.change(p=>p),false);
 }finally{unmount();globalThis.setInterval=oldSetInterval;globalThis.clearInterval=oldClearInterval;for(const [k,v] of Object.entries(globals))if(v===undefined)delete globalThis[k];else globalThis[k]=v}
});
