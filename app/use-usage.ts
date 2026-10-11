"use client";
import {useEffect,useRef} from "react";
import {activeSlice} from "../lib/usage";
type Sample={seq:number;start:number;end:number;stage:number;feature:string;language:"fr"|"sv"};
// Memory survives route changes when storage is disabled; it remains account-scoped.
const memoryQueues=new Map<string,any[]>();
const memoryOnly=new Set<string>();
function readQueue(key:string){if(memoryOnly.has(key))return memoryQueues.get(key)||[];try{const raw=localStorage.getItem(key);if(raw){const value=JSON.parse(raw);if(Array.isArray(value)){memoryQueues.set(key,value);return value}}}catch{memoryOnly.add(key)}return memoryQueues.get(key)||[]}
function writeQueue(key:string,queue:any[]){memoryQueues.set(key,queue);try{localStorage.setItem(key,JSON.stringify(queue))}catch{memoryOnly.add(key)}}
// Account-scoped, timestamp-only retry queue. Never phrases or recordings.
export function useUsage(source:string|null,stage:number,media=false,feature="practice",language:"fr"|"sv"="fr"){
 const state=useRef({stage,media,feature,language}),current=useRef<{id:string;flush:()=>void}|null>(null);
 useEffect(()=>{current.current?.flush();state.current={stage,media,feature,language}},[stage,media,feature,language]);
 useEffect(()=>{
  if(!source){current.current=null;return}
  let id=crypto.randomUUID(),seq=0,last=performance.now(),lastInput=last,lastActive=last,epoch=0,user="",ready=false,closed=false,sending=false;
  let visible=document.visibilityState==="visible",focused=document.hasFocus(),pending:Sample[]=[];
  const cache=()=>{if(!user)return;const key="a-loreille-usage-v3:"+user,queue=readQueue(key).filter((r:any)=>r.id!==id&&r.samples?.some((s:Sample)=>s.end>epoch+performance.now()-86400000));if(pending.length)queue.push({id,source,stage:state.current.stage,samples:pending.slice(-160)});writeQueue(key,queue.slice(-20))};
  const flush=async()=>{cache();if(!ready||sending)return;sending=true;
   try{const key="a-loreille-usage-v3:"+user,queue=readQueue(key);
    for(const item of queue){const batch=item.samples.slice(0,16);if(!batch.length)continue;
     const response=await fetch("/api/usage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...item,samples:batch}),keepalive:true,signal:AbortSignal.timeout(10000)});
     if(!response.ok)throw Error("Usage not saved");const sent=new Set(batch.map((s:Sample)=>s.seq));if(item.id===id)pending=pending.filter(s=>!sent.has(s.seq));
     const latest=readQueue(key).map((r:any)=>r.id===item.id?{...r,samples:r.samples.filter((s:Sample)=>!sent.has(s.seq))}:r).filter((r:any)=>r.samples.length);writeQueue(key,latest);
    }
    window.dispatchEvent(new CustomEvent("practice-tracking-status",{detail:"saved"}));
   }catch{window.dispatchEvent(new CustomEvent("practice-tracking-status",{detail:"pending"}))}finally{sending=false;if(closed)cache()}
  };
  const tick=()=>{const now=performance.now(),v=document.visibilityState==="visible",f=document.hasFocus(),native=Array.from(document.querySelectorAll<HTMLMediaElement>("audio,video")).some(e=>!e.paused&&!e.ended);
   const amount=ready?activeSlice(last,now,lastInput,visible&&v,focused&&f,state.current.media||native):0;visible=v;focused=f;
   if(amount>0){if(now-lastActive>30*60000&&!sending){cache();id=crypto.randomUUID();seq=0;pending=[];if(current.current)current.current.id=id}const focusedFeature=document.activeElement?.closest<HTMLElement>("[data-usage-feature]")?.dataset.usageFeature;pending.push({seq:seq++,start:Math.round(epoch+last),end:Math.round(epoch+last+amount),stage:state.current.stage,feature:focusedFeature||state.current.feature,language:state.current.language});lastActive=now;cache()}last=now;
  };
  const calibrate=async()=>{if(ready||closed)return;try{const begin=performance.now(),response=await fetch("/api/usage",{cache:"no-store",signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error();const data=await response.json();if(closed||typeof data.userId!=="string"||!Number.isFinite(data.serverTime))return;user=data.userId;epoch=data.serverTime-(begin+performance.now())/2;last=performance.now();lastInput=last;ready=true;void flush()}catch{window.dispatchEvent(new CustomEvent("practice-tracking-status",{detail:"pending"}))}};
  const input=()=>{tick();lastInput=performance.now()},change=()=>{tick();void flush()},focus=()=>{tick();lastInput=performance.now();void calibrate();void flush()};
  current.current={id,flush:()=>{tick();void flush()}};void calibrate();const timer=window.setInterval(()=>{tick();void calibrate();void flush()},5000);
  for(const name of ["pointerdown","keydown","scroll","touchstart"])window.addEventListener(name,input,{passive:true});document.addEventListener("visibilitychange",change);window.addEventListener("pagehide",change);window.addEventListener("blur",change);window.addEventListener("focus",focus);window.addEventListener("online",focus);
  return()=>{tick();closed=true;cache();void flush();clearInterval(timer);for(const name of ["pointerdown","keydown","scroll","touchstart"])window.removeEventListener(name,input);document.removeEventListener("visibilitychange",change);window.removeEventListener("pagehide",change);window.removeEventListener("blur",change);window.removeEventListener("focus",focus);window.removeEventListener("online",focus)};
 },[source]);
 return {sessionId:()=>current.current?.id};
}
