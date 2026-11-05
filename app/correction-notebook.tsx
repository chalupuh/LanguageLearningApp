"use client";
import { useEffect, useRef, useState } from "react";
import { correctionCategories, correctionDiff, emptyNotebook, recurringCategories, validCorrectionDraft, validCorrectionEntry, validNotebook, type CorrectionEntry, type CorrectionNotebook as Notebook } from "../lib/correction-notebook";
import "./correction-notebook.css";
import {grammarTopicForCategory} from "../lib/french-grammar";
import type {GrammarTopic} from "../content/french-grammar";

type Editor = { entry: CorrectionEntry; base: CorrectionEntry | null };
export default function CorrectionNotebook({language,onPractice}:{language:"fr"|"sv"|"es";onPractice?:(topic:GrammarTopic)=>void}) {
 const [notebook,setNotebook]=useState<Notebook>(emptyNotebook),[revision,setRevision]=useState(0),[user,setUser]=useState("");
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("Opening your notebook…");
 const [editor,setEditor]=useState<Editor|null>(null),[query,setQuery]=useState(""),[category,setCategory]=useState(""),[archived,setArchived]=useState(false);
 const [reload,setReload]=useState(0);const saving=useRef(false),loaded=useRef(false),titleInput=useRef<HTMLInputElement|null>(null);
 const editorId=editor?.entry.id;
 useEffect(()=>{if(editorId)titleInput.current?.focus();},[editorId]);
 const endpoint="/api/correction-notebook?language="+language;
 const draftKey="a-loreille-correction-draft:"+user;
 useEffect(()=>{
  const controller=new AbortController();let active=true;const timeout=setTimeout(()=>controller.abort(),12000);
  void (async()=>{try{
   const r=await fetch(endpoint,{cache:"no-store",signal:controller.signal}),data=await r.json();
   if(!r.ok)throw Error(data.error||"Your notebook could not load.");
   if(!validNotebook(data.state)||!Number.isSafeInteger(data.revision)||typeof data.userId!=="string")throw Error("Your notebook could not be read.");
   if(!active)return;
   setNotebook(data.state);setRevision(data.revision);setUser(data.userId);setReady(true);setError("");setStatus("Saved entries are up to date.");
   if(!loaded.current){try{const saved=JSON.parse(localStorage.getItem("a-loreille-correction-draft:"+data.userId)||"null");if(saved&&validCorrectionDraft(saved.entry)&&(saved.base===null||validCorrectionEntry(saved.base))){setEditor(saved);setStatus("Recovered your unfinished draft. Review it before saving.");}}catch{/* A missing or corrupt device backup never replaces server entries. */}loaded.current=true;}
  }catch(e){if(active){setError(e instanceof Error?e.message:"Your notebook could not load.");setStatus("Could not refresh saved entries.");}}finally{clearTimeout(timeout);}})();
  return()=>{active=false;clearTimeout(timeout);controller.abort();};
 },[endpoint,reload]);
 const keepEditor=(next:Editor|null)=>{setEditor(next);if(!user)return;try{if(next)localStorage.setItem(draftKey,JSON.stringify(next));else localStorage.removeItem(draftKey);}catch{if(next)setStatus("Draft backup unavailable. Keep this page open until you save.");}};
 useEffect(()=>{if(!editor)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[editor]);
 const save=async(entry:CorrectionEntry,base:CorrectionEntry|null)=>{
  if(saving.current||!ready)return;
  const saved=notebook.entries.find(e=>e.id===entry.id);
  if(base&&JSON.stringify(saved)!==JSON.stringify(base)){setError("This entry changed on another device. Keep your draft as a new entry, or open the latest saved entry below.");return;}
  if(!base&&saved){setError("An entry with this ID already exists. Keep this draft as a new entry.");return;}
  const updated={...entry,updatedAt:Math.max(Date.now(),entry.createdAt)},state={entries:saved?notebook.entries.map(e=>e.id===entry.id?updated:e):[updated,...notebook.entries]};
  if(!validNotebook(state)){setError("Add a title and both texts. Each text can contain up to 6,000 characters; the notebook holds 100 entries including archived entries.");return;}
  saving.current=true;setBusy(true);setError("");setStatus("Saving…");
  try{const r=await fetch(endpoint,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({state,revision}),signal:AbortSignal.timeout(15000)}),data=await r.json();
   if(!r.ok)throw Error(data.error||"Not saved yet. Keep your draft open and retry.");
   if(!Number.isSafeInteger(data.revision))throw Error("Save could not be confirmed. Refresh saved entries before retrying.");
   setNotebook(state);setRevision(data.revision);keepEditor(null);setStatus("Saved · available on your other devices.");
  }catch(e){setError(e instanceof Error?e.message:"Not saved yet. Keep your draft open and retry.");setStatus("Save not confirmed. Your draft has been kept.");}
  finally{saving.current=false;setBusy(false);}
 };
 const fresh=()=>{const now=Date.now();keepEditor({entry:{id:crypto.randomUUID(),title:"",original:"",corrected:"",notes:"",categories:[],archived:false,createdAt:now,updatedAt:now},base:null});setError("");};
 const update=(patch:Partial<CorrectionEntry>)=>{if(editor)keepEditor({...editor,entry:{...editor.entry,...patch}});};
 const patterns=recurringCategories(notebook.entries),filtered=notebook.entries.filter(e=>e.archived===archived&&(!category||e.categories.includes(category as typeof correctionCategories[number]))&&[e.title,e.original,e.corrected,e.notes].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const changedElsewhere=!!editor?.base&&JSON.stringify(notebook.entries.find(e=>e.id===editor.entry.id))!==JSON.stringify(editor.base);
 return <section className="correction-notebook" aria-labelledby="correction-title">
  <header><div><p className="eyebrow">Your writing, revisited</p><h2 id="correction-title">Correction notebook</h2><p>Keep your original writing beside your tutor’s correction. Tag what changed to see which patterns deserve another look. Entries are private to your account and this language.</p></div><button disabled={!ready||busy||!!editor||notebook.entries.length>=100} onClick={fresh}>Add correction</button></header>
  <p role="status">{status}</p>{error&&<p role="alert" className="notebook-error">{error}</p>}<button disabled={busy} onClick={()=>{setReady(false);setReload(n=>n+1);}}>Refresh saved entries</button>
  {editor&&<form onSubmit={event=>{event.preventDefault();void save(editor.entry,editor.base);}}>
   <h3>{editor.base?"Edit correction":"New correction"}</h3><p>Drafts are backed up on this device. Choose Save correction to make this entry available on your other devices.</p>
   {changedElsewhere&&<p role="alert">This entry changed on another device. Your draft is still here. Keep it as a new entry or replace it with the latest saved entry.</p>}
   <fieldset disabled={busy||!ready}><legend>Correction details</legend>
    <label>Title<input ref={titleInput} required maxLength={120} value={editor.entry.title} onChange={e=>update({title:e.target.value})}/></label>
    <div className="correction-columns"><label>My original text<textarea required lang={language} maxLength={6000} value={editor.entry.original} onChange={e=>update({original:e.target.value})}/><small>{editor.entry.original.length}/6,000</small></label><label>Tutor’s corrected text<textarea required lang={language} maxLength={6000} value={editor.entry.corrected} onChange={e=>update({corrected:e.target.value})}/><small>{editor.entry.corrected.length}/6,000</small></label></div>
    <fieldset className="correction-tags"><legend>What changed? Choose the patterns to track.</legend>{correctionCategories.map(c=><label key={c}><input type="checkbox" checked={editor.entry.categories.includes(c)} onChange={e=>update({categories:e.target.checked?[...editor.entry.categories,c]:editor.entry.categories.filter(v=>v!==c)})}/>{c}</label>)}</fieldset>
    <label>Tutor explanation or my notes<textarea maxLength={3000} value={editor.entry.notes} onChange={e=>update({notes:e.target.value})}/></label>
    {editor.entry.original&&editor.entry.corrected&&<Difference original={editor.entry.original} corrected={editor.entry.corrected} language={language}/>}
    <div className="correction-actions"><button type="submit" disabled={changedElsewhere}>{busy?"Saving…":"Save correction"}</button><button type="button" onClick={()=>{keepEditor(null);setError("");setStatus("Draft closed.");}}>Discard draft</button>{editor.base&&<button type="button" onClick={()=>{const now=Date.now();keepEditor({base:null,entry:{...editor.entry,id:crypto.randomUUID(),createdAt:now,updatedAt:now}});setError("");}}>Keep draft as a new entry</button>}{changedElsewhere&&<button type="button" onClick={()=>{const latest=notebook.entries.find(e=>e.id===editor.entry.id);if(latest){keepEditor({entry:latest,base:latest});setError("");}}}>Replace draft with latest saved entry</button>}</div>
   </fieldset>
  </form>}
  {ready&&<><section className="correction-patterns" aria-label="Recurring correction patterns"><h3>Patterns in your corrections</h3><p>Counts reflect the tags you chose on active entries.</p>{patterns.length?<div>{patterns.map(p=><span key={p.category}><button aria-pressed={category===p.category} onClick={()=>setCategory(category===p.category?"":p.category)}>{p.category} · {p.count} {p.count===1?"entry":"entries"}</button>{onPractice&&grammarTopicForCategory(p.category)&&<button onClick={()=>onPractice(grammarTopicForCategory(p.category)!)}>Practise {p.category.toLowerCase()} →</button>}</span>)}</div>:<p>Add and tag a correction to start seeing your patterns.</p>}</section>
   <div className="correction-filters"><label>Search corrections<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Pattern<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All patterns</option>{correctionCategories.map(c=><option key={c}>{c}</option>)}</select></label><label><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> Show archived entries</label></div>
   <p>{filtered.length} {filtered.length===1?"entry":"entries"} · {notebook.entries.length}/100 saved</p>
   {!filtered.length&&<p>{notebook.entries.length?"No entries match these filters.":"Your first correction can come from a tutor session, a lesson, or a piece of writing you revised."}</p>}
   {filtered.map(entry=><article key={entry.id}><header><div><h3>{entry.title}</h3><small>Updated {new Date(entry.updatedAt).toLocaleDateString()}</small></div><div className="correction-actions"><button disabled={busy||!!editor} onClick={()=>{keepEditor({entry,base:entry});setError("");}}>Edit {entry.title}</button><button disabled={busy||!!editor} onClick={()=>void save({...entry,archived:!entry.archived},entry)}>{entry.archived?"Restore":"Archive"}</button></div></header>
    <div className="correction-columns"><div><h4>My original</h4><p lang={language}>{entry.original}</p></div><div><h4>Tutor’s correction</h4><p lang={language}>{entry.corrected}</p></div></div><Difference original={entry.original} corrected={entry.corrected} language={language}/>{entry.categories.length>0&&<p>Patterns: {entry.categories.join(" · ")}</p>}{entry.notes&&<div><h4>Notes</h4><p>{entry.notes}</p></div>}
   </article>)}
  </>}
 </section>;
}

function Difference({original,corrected,language}:{original:string;corrected:string;language:string}) {
 const diff=correctionDiff(original,corrected);
 return <details className="correction-diff"><summary>See what changed</summary><p>Strikethrough = removed; underline = added. These are text changes, not automatic grammar judgments.</p><p lang={language}>{diff.map((part,i)=>part.kind==="removed"?<del key={i}>{part.text}</del>:part.kind==="added"?<ins key={i}>{part.text}</ins>:<span key={i}>{part.text}</span>)}</p></details>;
}
