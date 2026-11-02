"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {LearningLanguage} from "./learning-language";
import {languageName} from "./learning-language";

type Destination="today"|"library"|"calendar"|"progress"|"swedish"|"spanish";
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
  {eyebrow:`${greeting(language)} · welcome`,title:`Your ${languageName(language)} listening room`,body:"À l’Oreille is built around short listening sessions. You can write, speak, or practise silently; recording is always optional.",destination:"today",action:"See Today"},
  {eyebrow:"01 · Today",title:"Start with one useful next step",body:"Today recommends a new lesson or a review. It also shows saved phrases, your week, and what your ear is learning to notice.",destination:"today",action:"Open Today"},
  {eyebrow:`02 · ${lab}`,title:language==="fr"?"Follow the level that fits you":"Build a beginner foundation",body:language==="fr"?"Your pathway and preferences shape the lessons you see.":`The ${lab} groups lessons, words, sounds, and practical missions into a clear path.`,destination:labDestination,action:`Open ${lab}`},
  {eyebrow:"03 · Library",title:"Choose your own listening",body:"Browse the full lesson catalog and return to completed lessons. The four-step loop moves from a first listen to a retell in your own words.",destination:"library",action:"Explore Library"},
  {eyebrow:"04 · Calendar and Progress",title:"Plan gently and notice what changes",body:"Calendar holds your own practice intentions. Progress records completed loops and XP as evidence of practice—not as a fluency score.",destination:"progress",action:"View Progress"},
  {eyebrow:"05 · Saving and help",title:"Your work follows your invited account",body:"Wait for “Progress synced” before switching languages or devices. Open your profile avatar to change language, adjust the seasonal look, or send a feature request or bug report."},
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
  <div className="tutorial-actions">{index>0&&<button className="tutorial-secondary" onClick={()=>setIndex(value=>value-1)}>← Back</button>}{step.destination&&<button className="tutorial-secondary" onClick={()=>{onNavigate(step.destination!);if(!last)setIndex(value=>value+1)}}>{step.action} ↗</button>}<button className="tutorial-primary" onClick={()=>last?finish():setIndex(value=>value+1)}>{last?"Start learning":"Next"} <span>→</span></button></div>
  <small>{index+1} of {steps.length} · You can reopen this guide from About.</small>
 </section></div>;
}

