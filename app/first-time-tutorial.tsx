"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {LearningLanguage} from "./learning-language";
import {languageName} from "./learning-language";

type Destination="today"|"practice"|"library"|"calendar"|"progress"|"swedish"|"spanish";
type Step={eyebrow:string;title:string;body:string;destination?:Destination;action?:string};
const TOUR_VERSION="welcome-v1";
const greeting=(language:LearningLanguage)=>language==="sv"?"Hej":language==="es"?"Hola":"Bonjour";

async function accountKey(language:LearningLanguage){
 try{
  const response=await fetch("/api/session",{cache:"no-store"});if(!response.ok)throw Error();
  const {email}=await response.json();if(typeof email!=="string")throw Error();
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(email.trim().toLowerCase()));
  const digest=Array.from(new Uint8Array(bytes).slice(0,8),byte=>byte.toString(16).padStart(2,"0")).join("");
  return `a-loreille:${TOUR_VERSION}:${digest}:${language}`;
 }catch{return `a-loreille:${TOUR_VERSION}:device:${language}`}
}

export default function FirstTimeTutorial({language,request,onNavigate}:{language:LearningLanguage;request:number;onNavigate:(destination:Destination)=>void}){
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0),[storageKey,setStorageKey]=useState("");
 const card=useRef<HTMLElement|null>(null),heading=useRef<HTMLHeadingElement|null>(null),opener=useRef<HTMLElement|null>(null);
 const lab=language==="sv"?"A1 Lab":language==="es"?"A1–A2 Lab":"your learning path";
 const labDestination=language==="sv"?"swedish":language==="es"?"spanish":"today";
 const steps=useMemo<Step[]>(()=>[
  {eyebrow:`${greeting(language)} · welcome`,title:`Your ${languageName(language)} listening room`,body:"Short sessions train your ear before asking you to speak. Writing and recording are always optional."},
  {eyebrow:"01 · One session",title:"Listen, notice, then retell",body:"First catch the meaning. Then open the transcript, rehearse a useful phrase, and retell what you understood in your own words."},
  {eyebrow:`02 · ${lab}`,title:"Follow one clear next step",body:language==="fr"?"Today recommends a lesson or review that fits your path. The Library is always there when you want to choose.":`Today recommends a lesson or review. ${lab} keeps words, sounds, and practical missions together.`,destination:labDestination,action:`Preview ${lab}`},
  {eyebrow:"03 · Ready",title:"Begin with a real conversation",body:"Your work saves to your invited account. On a phone, use the listening dock below to move between Today, lessons, Hands-free, and Progress.",destination:"practice",action:"Start first lesson"},
 ],[lab,labDestination,language]);
 const finish=useCallback(()=>{if(storageKey)try{localStorage.setItem(storageKey,"done")}catch{void 0}setOpen(false);opener.current?.focus()},[storageKey]);
 /* The tutorial intentionally opens after account-scoped browser storage is resolved. */
 /* eslint-disable react-hooks/set-state-in-effect */
 useEffect(()=>{let active=true;void accountKey(language).then(key=>{if(!active)return;setStorageKey(key);try{if(localStorage.getItem(key)!=="done"){opener.current=document.activeElement as HTMLElement;setOpen(true)}}catch{setOpen(true)}});return()=>{active=false}},[language]);
 useEffect(()=>{if(request<=0)return;opener.current=document.activeElement as HTMLElement;setIndex(0);setOpen(true)},[request]);
 /* eslint-enable react-hooks/set-state-in-effect */
 useEffect(()=>{if(!open)return;heading.current?.focus();const keys=(event:KeyboardEvent)=>{if(event.key==="Escape"){finish();return}if(event.key!=="Tab"||!card.current)return;const items=[...card.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')].filter(item=>!item.hasAttribute("disabled"));if(!items.length)return;const first=items[0],last=items.at(-1)!;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};document.addEventListener("keydown",keys);return()=>document.removeEventListener("keydown",keys)},[finish,open]);
 if(!open)return null;
 const step=steps[index],last=index===steps.length-1;
 return <div className="tutorial-backdrop" role="presentation"><section ref={card} className="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" aria-describedby="tutorial-copy">
  <button className="tutorial-close" onClick={finish} aria-label="Close welcome tutorial">×</button>
  <div className="tutorial-progress" aria-label={`Tutorial step ${index+1} of ${steps.length}`}>{steps.map((_,stepIndex)=><span key={stepIndex} className={stepIndex<=index?"complete":""}/>)}</div>
  <p className="eyebrow">{step.eyebrow}</p><h1 ref={heading} tabIndex={-1} id="tutorial-title">{step.title}</h1><p id="tutorial-copy">{step.body}</p>
  <div className="tutorial-actions">{index>0&&<button className="tutorial-secondary" onClick={()=>setIndex(value=>value-1)}>← Back</button>}{step.destination&&<button className="tutorial-secondary" onClick={()=>{onNavigate(step.destination!);if(last)finish();else setIndex(value=>value+1)}}>{step.action} ↗</button>}<button className="tutorial-primary" onClick={()=>last?finish():setIndex(value=>value+1)}>{last?"Stay on Today":"Next"} <span>→</span></button></div>
  <small>{index+1} of {steps.length} · Reopen this guide from About at any time.</small>
 </section></div>;
}

