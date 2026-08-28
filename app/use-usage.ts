"use client";
import { useEffect, useRef } from "react";
import { activeSlice } from "../lib/usage";

// Only timestamps and four-step position leave this hook. Never text, keys or media.
export function useUsage(source:string|null,stage:number,media=false){
  const state=useRef({stage,media});
  useEffect(()=>{state.current={stage,media}},[stage,media]);
  const current=useRef<{id:string;flush:()=>void}|null>(null);
  useEffect(()=>{
    if(!source){current.current=null;return}
    let id=crypto.randomUUID(),seq=0,last=performance.now(),lastInput=last,lastActive=last;
    let wasVisible=document.visibilityState==="visible",wasFocused=document.hasFocus();
    let pending:{seq:number;start:number;end:number}[]=[],sending=false,closed=false;
    const epoch=Date.now()-performance.now();
    const flush=async()=>{
      if(sending||!pending.length)return;
      pending=pending.filter(s=>s.start>Date.now()-110000).slice(-16);if(!pending.length)return;
      const batch=pending.slice(),batchId=id;sending=true;
      try{const r=await fetch("/api/usage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:batchId,source,stage:state.current.stage,samples:batch}),keepalive:true});if(r.ok&&id===batchId){const sent=new Set(batch.map(s=>s.seq));pending=pending.filter(s=>!sent.has(s.seq))}}catch{}finally{sending=false;if(closed&&pending.length&&pending.length!==batch.length){void flush()}}
    };
    const tick=()=>{
      const now=performance.now(),nativeMedia=Array.from(document.querySelectorAll<HTMLMediaElement>("audio,video")).some(el=>!el.paused&&!el.ended);
      const visible=document.visibilityState==="visible",focused=document.hasFocus();
      const amount=activeSlice(last,now,lastInput,wasVisible&&visible,wasFocused&&focused,state.current.media||nativeMedia);
      wasVisible=visible;wasFocused=focused;
      if(amount>0){
        // A new session after a long absence, without counting that absence.
        if(now-lastActive>30*60000&&!sending){pending=[];id=crypto.randomUUID();seq=0;if(current.current)current.current.id=id}
        const start=Math.round(epoch+last),end=Math.round(epoch+last+amount);
        if(end>start)pending.push({seq:seq++,start,end});lastActive=now;
      }
      last=now;
    };
    const input=()=>{const now=performance.now();if(now-lastInput>=60000)tick();lastInput=now};
    const visibility=()=>{tick();void flush();last=performance.now()};
    const focus=()=>{tick();lastInput=performance.now()};
    const leave=()=>{tick();void flush()};
    current.current={id,flush:()=>{tick();void flush()}};
    const timer=window.setInterval(()=>{tick();void flush()},5000);
    for(const event of ["pointerdown","keydown","scroll","touchstart"])window.addEventListener(event,input,{passive:true});
    document.addEventListener("visibilitychange",visibility);window.addEventListener("pagehide",leave);window.addEventListener("blur",visibility);window.addEventListener("focus",focus);
    return()=>{tick();closed=true;void flush();window.clearInterval(timer);for(const event of ["pointerdown","keydown","scroll","touchstart"])window.removeEventListener(event,input);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("pagehide",leave);window.removeEventListener("blur",visibility);window.removeEventListener("focus",focus)};
  },[source]);
  useEffect(()=>{current.current?.flush()},[stage]);
  return {sessionId:()=>current.current?.id};
}
