import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
let moduleId=0;
const load=source=>import("data:text/javascript;base64,"+Buffer.from(compile(source+"\n// audit-module "+moduleId++).replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve("react/jsx-runtime")))).toString("base64"));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function hooks(){
 const cells=[],refs=[],effects=[];let cursor=0,refCursor=0;
 return {useState(value){const i=cursor++;if(!(i in cells))cells[i]=typeof value==="function"?value():value;return[cells[i],v=>cells[i]=typeof v==="function"?v(cells[i]):v]},useRef(value){return refs[refCursor++]??=( {current:value})},useCallback:fn=>fn,useEffect(fn){effects.push(fn)},render(fn){cursor=refCursor=0;effects.length=0;return fn()},effects};
}
const text=n=>Array.isArray(n)?n.map(text).join(""):n&&typeof n==="object"?text(n.props?.children):String(n??"");
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):n&&typeof n==="object"?[n,...nodes(n.props?.children)]:[];
test("access gate distinguishes service outages from sign-out and offers a retry",async()=>{
 const page=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");
 const source=page.slice(page.indexOf("function AccessGate("),page.indexOf("\nfunction Home("));
 const h=hooks(),oldFetch=globalThis.fetch;let status=503;
 globalThis.__accessAudit={...h,OwnerFeedbackLink:()=>null};globalThis.fetch=async()=>new Response(null,{status});
 try{
  const {AccessGate}=await load('const {useState,useEffect,OwnerFeedbackLink}=globalThis.__accessAudit;'+source+'export {AccessGate};');
  const render=()=>h.render(()=>AccessGate({children:"Learning content"}));
  render();h.effects[0]();await tick();let tree=render();
  assert.match(text(tree),/Retry connection/);assert.doesNotMatch(text(tree),/Continue with ChatGPT/);
  status=200;nodes(tree).find(n=>n.type==="button"&&text(n)==="Retry connection").props.onClick();render();h.effects[0]();await tick();assert.match(text(render()),/Learning content/);
 }finally{globalThis.fetch=oldFetch;delete globalThis.__accessAudit}
});
async function journeyHarness(){
 let source=await readFile(new URL("../app/use-journey.ts",import.meta.url),"utf8");
 source=source.replace(/^import .*;\r?\n/gm,"");
 const h=hooks();globalThis.__journeyAudit={...h,emptyJourney:{events:[],weeklyGoal:3,avatar:"default",frame:"default",background:"default"}};
 const {useJourney}=await load("const {useState,useRef,useCallback,useEffect,emptyJourney}=globalThis.__journeyAudit;"+source);
 return {render:()=>h.render(()=>useJourney("fr"))};
}
test("a successful refresh cannot hide an unsaved practice or discard its retry",async()=>{
 const old={fetch:globalThis.fetch,window:globalThis.window};globalThis.window=new EventTarget();const sent=[];let fail=true;
 globalThis.fetch=async(_url,init={})=>{if(init.method==="POST"){sent.push(JSON.parse(init.body));if(fail)return Response.json({error:"Practice not saved"},{status:503});return Response.json({awarded:10})}return Response.json({events:[],weeklyGoal:3})};
 try{
  const h=await journeyHarness();await h.render().record({kind:"rehearse",source:"library:cafe"});assert.match(h.render().error,/Practice not saved/);
  await h.render().refresh();assert.match(h.render().error,/Practice not saved/);
  fail=false;await h.render().record({kind:"equip",source:"default",category:"avatar"});assert.match(h.render().error,/Practice not saved/);
  await h.render().retry();assert.equal(sent.at(-1).kind,"rehearse");assert.equal(h.render().error,"");
 }finally{Object.assign(globalThis,old);delete globalThis.__journeyAudit}
});
test("a late journey response cannot replace the newer response",async()=>{
 const oldFetch=globalThis.fetch;const replies=[];globalThis.fetch=()=>new Promise(resolve=>replies.push(resolve));
 try{
  const h=await journeyHarness(),a=h.render().refresh(),b=h.render().refresh();
  replies[1](Response.json({events:[],weeklyGoal:5}));await b;replies[0](Response.json({events:[],weeklyGoal:2}));await a;
  assert.equal(h.render().journey.weeklyGoal,5);
 }finally{globalThis.fetch=oldFetch;delete globalThis.__journeyAudit}
});
