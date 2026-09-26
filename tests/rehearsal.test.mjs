import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../lib/rehearsal.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {rehearsalPhrases,phraseChunks,suggestedRehearsal,correctlyBuilt,rehearsalComplete}=await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

test("phrases preserve French accents, apostrophes, and unpunctuated caption words",()=>{
  assert.deepEqual(rehearsalPhrases("  Bonjour !\nJ’aimerais un café.  "),["Bonjour !","J’aimerais un café."]);
  assert.deepEqual(rehearsalPhrases("  "),[]);
  const caption=Array.from({length:45},(_,i)=>`mot${i}`).join(" ");
  const phrases=rehearsalPhrases(caption);
  assert.equal(phrases.length,4);assert.equal(phrases.join(" "),caption);
  assert.ok(phrases.every(p=>p.split(" ").length<=14));
  assert.deepEqual(phraseChunks("Je voudrais un café, s’il vous plaît."),["Je voudrais un","café,","s’il vous plaît."]);
});
test("rebuilding requires every chunk in order and safely handles repeated chunks",()=>{
  assert.equal(correctlyBuilt(["un","deux"],[1,0]),false);
  assert.equal(correctlyBuilt(["un","deux"],[0]),false);
  assert.equal(correctlyBuilt(["un","un"],[0,0]),false);
  assert.equal(correctlyBuilt(["un","un"],[1,0]),true);
  assert.equal(correctlyBuilt(["bonjour"],[0]),true);
  assert.equal(correctlyBuilt([],[]),false);
  assert.equal(correctlyBuilt(["bonjour"],[10]),false);
});
test("each mode gates completion on its own work, never on microphone use",()=>{
  assert.equal(rehearsalComplete("echo",false,true,false,false),false);
  assert.equal(rehearsalComplete("echo",true,false,false,false),false);
  assert.equal(rehearsalComplete("echo",true,true,false,false),true);
  assert.equal(rehearsalComplete("build",false,false,true,false),true);
  assert.equal(rehearsalComplete("rhythm",true,true,false,false),false);
  assert.equal(rehearsalComplete("rhythm",true,true,false,true),true);
});
test("suggested activities vary across sources without hiding any choice",()=>{
  assert.equal(suggestedRehearsal("cafe"),suggestedRehearsal("cafe"));
  assert.equal(new Set(["a","b","c"].map(suggestedRehearsal)).size,3);
});

test("Rehearse interactions: echo, silent rhythm, rebuilding, retries, failures and cleanup",async()=>{
  // Drive the real component handlers with controlled React hooks and media.
  // No microphone, paid speech calls, or learner records are used by these tests.
  const url=code=>`data:text/javascript;base64,${Buffer.from(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText).toString("base64")}`;
  const audioCode=await readFile(new URL("../lib/audio-capture.ts",import.meta.url),"utf8");
  let code=await readFile(new URL("../app/rehearse.tsx",import.meta.url),"utf8");
  code=code.replace(/import \{useEffect[^\n]+from "react";/,'const {useEffect,useRef,useState}=globalThis.__rehearseHooks;');
  code=code.replace('"../lib/audio-capture"',JSON.stringify(url(audioCode))).replace('"../lib/rehearsal"',JSON.stringify(url(source))).replace('import "./rehearse.css";','');
  const compiled=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve("react/jsx-runtime")));
  let cells=[],cursor=0,effects=[],tree,Component,completed=0,awards=0,media=[],loads=0,fail=false,pending=null,pauses=0;
  const saved=Object.fromEntries(["__rehearseHooks","window","document","Audio"].map(k=>[k,globalThis[k]]));
  globalThis.__rehearseHooks={
    useState(initial){const id=cursor++;if(!(id in cells))cells[id]=typeof initial==="function"?initial():initial;return[cells[id],value=>{cells[id]=typeof value==="function"?value(cells[id]):value}]},
    useRef(initial){const id=cursor++;return cells[id]??=( {current:initial} )},
    useEffect(fn,deps){const id=cursor++;if(!cells[id]){cells[id]={deps};effects.push(()=>{cells[id].cleanup=fn()})}},
  };
  globalThis.window=new EventTarget();
  globalThis.document=Object.assign(new EventTarget(),{querySelectorAll:()=>[{pause:()=>pauses++}]});
  globalThis.Audio=class{constructor(){media.push(this)}async play(){this.played=true}pause(){this.paused=true}};
  const props={text:"Je voudrais prendre un café à emporter. Merci beaucoup.",source:"library:cafe",completed:false,onComplete:()=>{completed++;props.completed=true},loadAudio:async()=>{loads++;if(fail)throw Error("offline");return pending||new Blob(["sound"])},recorder:()=>"Optional recorder",onRetry:async()=>{awards++;return {awarded:10}}};
  const render=()=>{cursor=0;tree=Component(props);const tasks=effects;effects=[];tasks.forEach(fn=>fn())};
  const nodes=(n=tree)=>Array.isArray(n)?n.flatMap(x=>nodes(x??null)):n&&typeof n==="object"?[n,...nodes(n.props?.children??null)]:[];
  const text=n=>Array.isArray(n)?n.map(text).join(""):n&&typeof n==="object"?text(n.props?.children):String(n??"");
  const find=(type,label)=>nodes().find(n=>n.type===type&&text(n)===label);
  const click=async(label)=>{const button=find("button",label);assert.ok(button,`button ${label} exists`);assert.ok(!button.props.disabled,`button ${label} enabled`);await button.props.onClick();await new Promise(resolve=>setImmediate(resolve));render()};
  const check=()=>{const input=nodes().find(n=>n.type==="input"&&n.props.disabled!==undefined);assert.ok(!input.props.disabled);input.props.onChange({target:{checked:true}});render()};
  const choose=async(name)=>click(name);
  try{
    Component=(await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)).default;render();
    await choose("Listen, then echo");assert.equal(find("button","Complete this activity").props.disabled,true);
    await click("Listen slowly");assert.equal(media.at(-1).playbackRate,.8);assert.equal(pauses,1);
    assert.equal(nodes().find(n=>n.type==="input"&&n.props.disabled!==undefined).props.disabled,true);
    media.at(-1).onended();render();check();await click("Complete this activity");assert.equal(completed,1);
    assert.ok(find("button","Activity complete ✓").props.disabled);
    await choose("Notice the rhythm");
    nodes().find(n=>n.type==="input"&&n.props.disabled===undefined).props.onChange({target:{checked:true}});render();
    assert.ok(!find("button","Record myself (optional)"));
    await click("Listen");media.at(-1).onended();render();await click("voudrais");check();await click("Complete this activity");
    assert.equal(completed,2);await click("Save extra practice · up to 10 XP today");assert.equal(awards,1);assert.ok(find("button","Extra practice recorded ✓").props.disabled);
    await choose("Build the phrase");const pieces=phraseChunks(props.text.split(". ")[0]+".");
    // A wrong order cannot complete; undo remains usable with repeated tokens.
    for(const p of [...pieces].reverse())await click(p);await click("Check phrase");assert.ok(find("button","Complete this activity").props.disabled);
    await click("Start again");for(const p of pieces)await click(p);
    assert.ok(find("button","Complete this activity").props.disabled);await click("Check phrase");await click("Complete this activity");assert.equal(completed,3);
    await choose("Listen, then echo");fail=true;await click("Listen");assert.match(text(tree),/Audio is unavailable/);assert.ok(!find("button","Listen").props.disabled);fail=false;
    let resolve;pending=new Promise(r=>resolve=r);await click("Listen");await choose("Build the phrase");const count=media.length;resolve(new Blob(["late"]));await new Promise(r=>setImmediate(r));render();assert.equal(media.length,count,"changing modes cancels late playback");pending=null;
    await choose("Notice the rhythm");await click("Listen");const playing=media.at(-1);window.dispatchEvent(new Event("a-loreille-capture-playback"));render();assert.equal(playing.paused,true,"recording pauses rehearsal audio");
    await click("Listen");const last=media.at(-1);cells.forEach(c=>c?.cleanup?.());assert.equal(last.paused,true,"unmount stops audio");assert.ok(loads>=5);
  }finally{cells.forEach(c=>c?.cleanup?.());for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v}}
});
