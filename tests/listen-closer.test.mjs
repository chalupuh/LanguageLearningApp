import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";
import {validCloserHighlights,highlightedParts} from "../lib/closer-highlights.ts";
test("missed highlights are bounded, preserve Swedish/French text and merge overlapping selections",()=>{
 assert.deepEqual(validCloserHighlights(["à","café","café","missing",4],"Un café à emporter."),["à","café"]);
 const parts=highlightedParts("Un café à emporter.",["café","café à"]);
 assert.equal(parts.map(p=>p.text).join(""),"Un café à emporter.");
 assert.deepEqual(parts.filter(p=>p.marked).map(p=>p.text),["café à"]);
 assert.deepEqual(validCloserHighlights(["a".repeat(221)],"a".repeat(221)),[]);
 assert.equal(highlightedParts("är är",["är"]).filter(p=>p.marked).length,2);
});
test("Listen closer hides the complete transcript, keeps highlights, and requires no extra drill or marked word",async()=>{
 const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const data=s=>"data:text/javascript;base64,"+Buffer.from(compile(s)).toString("base64");
 let code=await readFile(new URL("../app/listen-closer.tsx",import.meta.url),"utf8");
 code=code.replace('import {useState,type ReactNode} from "react";',"const {useState}=globalThis.__closerHooks;").replace('import "./listen-closer.css";','').replace('"../lib/closer-highlights"',JSON.stringify(data(await readFile(new URL("../lib/closer-highlights.ts",import.meta.url),"utf8"))));
 const compiled=compile(code).replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve("react/jsx-runtime")));
 const previous=globalThis.__closerHooks;let open=false,results=[],saves=[],tree;
 globalThis.__closerHooks={useState:()=>[open,value=>open=value]};
 const props={text:"Bonjour Nikki. Je voudrais un café.",language:"fr",completed:false,highlights:[],saved:[],onComplete:r=>results.push(r),onSave:p=>saves.push(p),onRemove:p=>props.highlights=props.highlights.filter(x=>x!==p)};
 const Component=(await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"))).default;
 const render=()=>tree=Component(props);
 const nodes=(n=tree)=>Array.isArray(n)?n.flatMap(x=>nodes(x??null)):n&&typeof n==="object"?[n,...nodes(n.props?.children??null)]:[];
 const text=n=>Array.isArray(n)?n.map(text).join(""):n&&typeof n==="object"?text(n.props?.children):String(n??"");
 const button=label=>nodes().find(n=>n.type==="button"&&text(n)===label);
 try{
  render();assert.ok(!text(tree).includes(props.text));assert.equal(button("Continue to Retell practice →").props.disabled,undefined);
  button("Show transcript").props.onClick();render();assert.ok(text(tree).includes(props.text));assert.equal(button("Continue to Retell practice →").props.disabled,undefined);
  button("Continue to Retell practice →").props.onClick();assert.deepEqual(results,["I understood it"]);
  props.highlights=["café"];render();assert.equal(nodes().filter(n=>n.type==="mark").length,1);
  button("Save phrase").props.onClick();assert.deepEqual(saves,["café"]);props.saved=["café"];render();assert.equal(button("Saved ✓").props.disabled,true);
  const remove=nodes().find(n=>n.props?.["aria-label"]==="Remove highlight: café");remove.props.onClick();render();assert.equal(nodes().filter(n=>n.type==="mark").length,0);
  button("Hide transcript").props.onClick();render();assert.ok(!text(tree).includes(props.text));
  props.completed=true;props.highlights=["café"];props.revealed=true;render();assert.equal(nodes().filter(n=>n.type==="mark").length,1);assert.equal(results.length,1,"Restoring a completed review never awards completion");
  assert.equal(nodes().some(n=>n.type==="select"),false);
 }finally{if(previous===undefined)delete globalThis.__closerHooks;else globalThis.__closerHooks=previous}
});
