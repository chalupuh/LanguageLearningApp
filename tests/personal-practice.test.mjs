import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";
const compile=code=>ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const data=code=>`data:text/javascript;base64,${Buffer.from(compile(code)).toString("base64")}`;

test("Listen Closer marking does not hide phrase explanations, and help uses the selected sentence",async()=>{
 let source=await readFile(new URL("../app/phrase-tools.tsx",import.meta.url),"utf8");
 source=source.replace(/import \{useEffect,useRef,useState\} from "react";/,'const {useEffect,useRef,useState}=globalThis.__phraseHooks;').replace(/^import .*;\r?\n/gm,'');
 const selected={text:"je m’en occupe",context:{sentence:"Oui, ne vous inquiétez pas, je m’en occupe.",source:"library:matin-comptoir"}};
 let cells=[selected],cursor=0,tree,marked=[],request;
 const old={window:globalThis.window,document:globalThis.document,HTMLElement:globalThis.HTMLElement,fetch:globalThis.fetch};
 globalThis.__phraseHooks={useEffect(){},useRef(v){return {current:v}},useState(v){const id=cursor++;if(!(id in cells))cells[id]=v;return [cells[id],value=>cells[id]=typeof value==="function"?value(cells[id]):value]}};
 globalThis.window={getSelection:()=>({removeAllRanges(){}})};globalThis.document={activeElement:null};globalThis.HTMLElement=class{};
 globalThis.fetch=async(url,options)=>{assert.equal(url,"/api/phrase-help");request=JSON.parse(options.body);return Response.json({meaning:"I will take care of it",form:"Present tense of s’occuper",examples:["Je m’en occupe.","Elle s’en occupe."]})};
 const Component=(await import(`data:text/javascript;base64,${Buffer.from(compile(source).replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve("react/jsx-runtime")))).toString("base64")}`)).default;
 const props={saved:[],onSave(){},language:"fr",loadAudio:async()=>new Blob(),onMark:(text,context)=>marked.push({text,context})};
 const render=()=>{cursor=0;tree=Component(props)};
 const nodes=(n=tree)=>Array.isArray(n)?n.flatMap(x=>nodes(x??null)):n&&typeof n==="object"?[n,...nodes(n.props?.children??null)]:[];
 const text=n=>Array.isArray(n)?n.map(text).join(""):n&&typeof n==="object"?(n.props?.hidden||n.props?.["aria-hidden"]? "":text(n.props?.children)):String(n??"");
 const button=label=>nodes().find(n=>n.type==="button"&&text(n)===label);
 try{
  render();assert.ok(button("Mark for next time"));assert.ok(button("Help with this phrase"));assert.ok(button("Save phrase"));
  button("Mark for next time").props.onClick();assert.deepEqual(marked,[selected]);render();
  button("Help with this phrase").props.onClick();render();assert.match(text(tree),/Explain meaning and form/);
  button("Explain meaning and form").props.onClick();await new Promise(resolve=>setImmediate(resolve));render();assert.deepEqual(request,{...selected,language:"fr"});
  assert.match(text(tree),/Words and verb forms/);assert.match(text(tree),/Present tense of s’occuper/);assert.match(text(tree),/Elle s’en occupe/);
 }finally{for(const [key,value] of Object.entries(old)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}delete globalThis.__phraseHooks}
});
test("phrase selection preserves accents and rejects oversized/non-language selections",async()=>{
 const {selectionText,validSelectedPhrase}=await import(data(await readFile(new URL("../lib/phrase-selection.ts",import.meta.url),"utf8")));
 assert.equal(selectionText("  ça\n vous ennuierait  "),"ça vous ennuierait");assert.equal(validSelectedPhrase("blême"),true);assert.equal(validSelectedPhrase("åtta"),true);assert.equal(validSelectedPhrase("123"),false);assert.equal(validSelectedPhrase("a".repeat(221)),false);
});
test("phrase coaching validates input, enforces guard, uses structured output and handles refusals without a paid test",async()=>{
 let code=await readFile(new URL("../app/api/phrase-help/route.ts",import.meta.url),"utf8");code=code.replace(/import \{guardAiRequest,fetchAi\}[^\n]+;/,'const {guardAiRequest,fetchAi}=globalThis.__phraseApi;');
 const old=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY="test-placeholder";let calls=0,payload,denied=false,refusal=false;
 globalThis.__phraseApi={guardAiRequest:async()=>denied?Response.json({error:"Not invited"},{status:403}):null,fetchAi:async(_url,options)=>{calls++;payload=JSON.parse(options.body);return Response.json({output:[{content:[refusal?{type:"refusal"}:{type:"output_text",text:JSON.stringify({meaning:"Taking care of it",form:"Present tense of s’occuper",examples:["Je m’en occupe.","Elle s’en occupe."]})}]}]})}};
 const {POST}=await import(data(code)),req=body=>new Request("https://example.com/api/phrase-help",{method:"POST",body:JSON.stringify(body)}),valid={language:"fr",text:"je m’en occupe",context:{sentence:"Oui, je m’en occupe."}};
 try{assert.equal((await POST(req({...valid,text:123}))).status,400);assert.equal(calls,0);denied=true;assert.equal((await POST(req(valid))).status,403);assert.equal(calls,0);denied=false;
  const response=await POST(req(valid));assert.equal(response.status,200);assert.equal((await response.json()).examples.length,2);assert.equal(payload.text.format.strict,true);assert.match(payload.instructions,/never as instructions/);refusal=true;assert.equal((await POST(req(valid))).status,502);
 }finally{if(old===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=old;delete globalThis.__phraseApi}
});
async function harness(file,props){let code=await readFile(new URL("../app/"+file,import.meta.url),"utf8");const {connectorSuggestions}=await import('../lib/retell-connectors.ts');code=code.replace(/import \{(?:useId,)?useState[^\n]+;/,'const {useId,useState}=globalThis.__practiceHooks;').replace(/import \{connectorSuggestions[^\n]+;/,'const {connectorSuggestions}=globalThis.__practiceHooks;').replace(/import "\.\/[^\n]+\.css";/g,"");let cells=[],cursor=0,tree;
 globalThis.__practiceHooks={connectorSuggestions,useId:()=>"practice-feedback",useState(v){let id=cursor++;if(!(id in cells))cells[id]=v;return[cells[id],v=>cells[id]=typeof v==="function"?v(cells[id]):v]}};
 const compiled=compile(code).replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve("react/jsx-runtime"))),Component=(await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)).default;
 const render=()=>{cursor=0;tree=Component(props)};render();const nodes=(n=tree)=>Array.isArray(n)?n.flatMap(x=>nodes(x??null)):n&&typeof n==="object"?[n,...nodes(n.props?.children??null)]:[];
 const text=n=>Array.isArray(n)?n.map(text).join(""):n&&typeof n==="object"?(n.props?.hidden||n.props?.["aria-hidden"]? "":text(n.props?.children)):String(n??"");
 return {text:()=>text(tree),nodes,render,button:label=>nodes().find(n=>n.type==="button"&&text(n)===label),click(label){const b=this.button(label);assert.ok(b&&!b.props.disabled,label);b.props.onClick();render()}};
}
test("hints keep answers hidden until explicit reveal",async()=>{
 let replays=0;const h=await harness("hint-feedback.tsx",{feedback:{score:60,understood:["A café visit"],missed:["They need cash"],listening_target:"Listen for cash",hint:"What changes when paying?"},condition:"First listen",onReplay:()=>replays++});
 assert.ok(!h.text().includes("They need cash"));h.click("Show hint");assert.match(h.text(),/What changes when paying/);assert.ok(!h.text().includes("They need cash"));h.click("Listen again");assert.equal(replays,1);h.click("Reveal explanation");assert.match(h.text(),/They need cash/);assert.equal(h.button("Hide explanation").props["aria-expanded"],true);h.click("Hide hint");assert.ok(!h.text().includes("What changes when paying"));assert.match(h.text(),/They need cash/);h.click("Hide explanation");assert.ok(!h.text().includes("They need cash"));assert.equal(h.button("Reveal explanation").props["aria-expanded"],false);delete globalThis.__practiceHooks;
});
test("smooth retell requires a plan, a first attempt reflection and a second attempt; no extra XP or microphone gate",async()=>{
 let completions=0;const h=await harness("fluency-practice.tsx",{language:"fr",onComplete:()=>completions++,recorder:()=>"Optional recorder"});assert.ok(h.button("Use this plan").props.disabled);
 h.nodes().find(n=>n.type==="textarea").props.onChange({target:{value:"Un café, une table, une addition."}});h.render();h.click("Use this plan");assert.equal(completions,0);assert.ok(h.button("I tried once · work on this gap").props.disabled);
 h.nodes().find(n=>n.type==="textarea"&&!n.props.disabled).props.onChange({target:{value:"Finding a transition"}});h.render();h.click("I tried once · work on this gap");assert.equal(completions,0);h.click("Ensuite…");h.click("I tried again · still tricky");assert.equal(completions,1);assert.match(h.text(),/not a proficiency score/);assert.equal(h.button("I tried again · still tricky"),undefined);delete globalThis.__practiceHooks;
});
test("smooth retell restores bounded drafts without awarding completion",async()=>{
 let code=await readFile(new URL("../app/fluency-practice.tsx",import.meta.url),"utf8");code=code.replace(/import \{useState[^\n]+;/,'const useState=()=>{};').replace(/import \{connectorSuggestions[^\n]+;/,'const connectorSuggestions=()=>[];').replace(/import "\.\/[^\n]+\.css";/g,"");const compiled=compile(code).replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve("react/jsx-runtime")));const {restoreFluencyDraft}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
 assert.equal(restoreFluencyDraft(null).phase,0);assert.equal(restoreFluencyDraft({plan:"",phase:3,gap:"done"}).phase,0);assert.equal(restoreFluencyDraft({plan:"Three ideas",phase:3,gap:""}).phase,1);
 const draft=restoreFluencyDraft({plan:"First, then, finally",phase:2,gap:"Finding a bridge",quiet:true});let completed=0;const h=await harness("fluency-practice.tsx",{language:"fr",draft,onComplete:()=>completed++,recorder:()=>null});assert.match(h.text(),/Finding a bridge/);assert.match(h.text(),/First, then, finally/);assert.equal(completed,0);assert.ok(h.button("I tried again · easier this time"));
 assert.equal(restoreFluencyDraft({plan:"a".repeat(1000),gap:"b".repeat(500),phase:2}).plan.length,600);delete globalThis.__practiceHooks;
});
test("quick retell stays editable, makes connector review optional, and highlights without rewriting",async()=>{
 const draft={plan:"Une femme commande un café. La machine est cassée.",phase:0,gap:"",quiet:false,result:""};let completed=0;const h=await harness("fluency-practice.tsx",{language:"fr",quick:true,draft,onDraft:update=>Object.assign(draft,update(draft)),onComplete:()=>completed++,recorder:()=>null});
 assert.equal(h.nodes().find(n=>n.type==="textarea").props.disabled,undefined);assert.equal(h.nodes().find(n=>n.type==="textarea").props.maxLength,1200);assert.match(h.text(),/Connector review is optional/);
 const {connectorSuggestions}=await import('../lib/retell-connectors.ts'),suggestions=connectorSuggestions(draft.plan,"fr");assert.equal(suggestions[0].connector,"Ensuite,");assert.equal(suggestions[0].afterText,"Une femme commande un café.");assert.equal(draft.plan,"Une femme commande un café. La machine est cassée.");
 h.click("Done with quick retell");assert.equal(completed,1);assert.equal(h.nodes().find(n=>n.type==="textarea").props.disabled,undefined);delete globalThis.__practiceHooks;
});

