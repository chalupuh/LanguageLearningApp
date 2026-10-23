"use client";
import {useEffect,useRef,useState} from "react";
import {validWritingFeedback,type WritingFeedback} from "../lib/writing-feedback";
import "./listening-challenge.css";
export default function FrenchSummary({english,french,onEnglish,onFrench,feedback,onFeedback,disabled=false}:{english:string;french:string;onEnglish:(s:string)=>void;onFrench:(s:string)=>void;feedback:WritingFeedback|null;onFeedback:(f:WritingFeedback|null)=>void;disabled?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");const request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 const review=async()=>{if(busy)return;request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError("");try{
  const r=await fetch("/api/writing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:french}),signal:controller.signal}),data=await r.json();
  if(!r.ok)throw Error(data.error||"Writing feedback is unavailable.");if(!validWritingFeedback(data))throw Error("Writing feedback was incomplete. Please retry.");if(!controller.signal.aborted)onFeedback(data);
 }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Writing feedback is unavailable.")}finally{if(!controller.signal.aborted)setBusy(false)}};
 return <section className="dual-summary"><p>Write what you understood in English, French, or both. Only your French text is used for writing feedback.</p><div className="dual-summary-fields">
 <label htmlFor="summary-english">My English summary <small>Optional · what I understood · {english.length}/1,200</small><textarea id="summary-english" value={english} disabled={disabled} maxLength={1200} onChange={e=>onEnglish(e.target.value)} placeholder="The customer is asking…"/></label>
 <label htmlFor="summary-french">Mon résumé en français <small>Optional · practise writing it in French · {french.length}/1,200</small><textarea id="summary-french" lang="fr" value={french} disabled={disabled||busy} maxLength={1200} onChange={e=>{onFrench(e.target.value);onFeedback(null);setError("")}} placeholder="Une cliente demande…"/></label></div>
 <button disabled={disabled||busy||french.trim().length<5} onClick={()=>void review()}>{busy?"Reviewing your French…":"Review my French writing"}</button><small className="challenge-note">Writing feedback is separate from your listening score. Your words stay in the box so you can compare and revise.</small>
 {error&&<p role="alert">{error}</p>}{feedback&&<section className="writing-review" aria-label="French writing feedback"><h3>{feedback.score}/100 · French writing estimate</h3><p>{feedback.summary}</p>{feedback.corrections.map((c,i)=><article key={i}><p><span lang="fr">{c.original}</span> → <strong lang="fr">{c.improved}</strong></p><p>{c.explanation}</p></article>)}<h4>A more natural version</h4><p lang="fr">{feedback.improvedVersion}</p><small>AI writing feedback · not a proficiency assessment</small></section>}
 </section>;
}
