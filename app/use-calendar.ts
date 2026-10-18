"use client";
import {useEffect,useRef,useState} from "react";
import {emptyCalendar,validCalendar,mergeCalendar,type CalendarPlan} from "../lib/calendar";

type Entry={user:string;revision:number;base:CalendarPlan;latest:CalendarPlan;closed:boolean;busy:boolean;blocked:boolean;flush:()=>Promise<void>};
export function useCalendar(language:"fr"|"sv"){
 const [plan,setPlan]=useState<CalendarPlan>(emptyCalendar),[ready,setReady]=useState(false),[status,setStatus]=useState("Opening your calendar…"),[error,setError]=useState(""),[conflict,setConflict]=useState(false),[user,setUser]=useState(""),[reload,setReload]=useState(0);const current=useRef<Entry|null>(null);
 const endpoint="/api/calendar?language="+language,key=(u:string)=>"a-loreille-calendar:"+u;
 useEffect(()=>{
  let cancelled=false;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);setReady(false);setError("");setConflict(false);
  const cache=(e:Entry)=>{if(e.closed)return true;try{localStorage.setItem(key(e.user),JSON.stringify({revision:e.revision,base:e.base,state:e.latest}));return true}catch{return false}};
  const read=async(signal=AbortSignal.timeout(12000))=>{const r=await fetch(endpoint,{cache:"no-store",signal});if(!r.ok)throw Error("Your calendar could not load. Please retry.");const d=await r.json();if(!validCalendar(d.state)||!Number.isSafeInteger(d.revision)||typeof d.userId!=="string")throw Error("Your calendar could not be read. Please retry.");return d};
  void read(controller.signal).then(d=>{if(cancelled)return;let latest=d.state,blocked=false;try{const local=JSON.parse(localStorage.getItem(key(d.userId))||"null");if(local&&validCalendar(local.state)&&validCalendar(local.base)){const merged=mergeCalendar(local.base,local.state,d.state);latest=merged.plan;blocked=merged.conflict}}catch{}
   const e:Entry={user:d.userId,revision:d.revision,base:d.state,latest,closed:false,busy:false,blocked,flush:async()=>{}};
   e.flush=async()=>{
    if(e.busy||e.blocked)return;e.busy=true;
    try{
     const remote=await read();if(remote.userId!==e.user)throw Error("Account changed");
     const merged=mergeCalendar(e.base,e.latest,remote.state);
     if(merged.conflict){e.blocked=true;cache(e);if(!e.closed){setConflict(true);setStatus("Changes need review");setError("This goal also changed on another device. Download your edits before loading the saved calendar.");}return;}
     e.base=remote.state;e.revision=remote.revision;e.latest=merged.plan;
     if(!e.closed)setPlan(e.latest);
     if(JSON.stringify(e.latest)===JSON.stringify(e.base)){cache(e);if(!e.closed){setStatus("Saved · checked "+new Date().toLocaleTimeString());setError("");}return;}
     const snapshot=e.latest,body=JSON.stringify({state:snapshot,revision:e.revision});
     if(!e.closed)setStatus("Saving…");cache(e);
     const response=await fetch(endpoint,{method:"PUT",headers:{"Content-Type":"application/json"},body,signal:AbortSignal.timeout(15000),keepalive:new TextEncoder().encode(body).length<60000});
     if(response.status===409){if(!e.closed)setStatus("Calendar changed on another device · checking again…");return;}
     const result=await response.json();if(!response.ok||!Number.isSafeInteger(result.revision))throw Error();
     e.base=snapshot;e.revision=result.revision;cache(e);
     if(!e.closed){setStatus(JSON.stringify(e.latest)===JSON.stringify(snapshot)?"Saved · available on your other devices":"Saving…");setError("");}
    }catch{const stored=cache(e);if(!e.closed)setStatus(stored?"Saved on this device · waiting to sync":"Not saved. Keep this page open and download your edits.");}
    finally{e.busy=false;}
   };
   current.current=e;setPlan(latest);setUser(e.user);setConflict(blocked);setReady(true);setStatus(blocked?"Changes need review":"Saved · available on your other devices");if(blocked)setError("This calendar also changed on another device. Download your edits before loading the saved calendar.");cache(e);void e.flush();
  }).catch(()=>{if(!cancelled){setError("Your calendar could not load. Check your connection and retry. Saved work has not been replaced.");setStatus("Calendar unavailable")}}).finally(()=>clearTimeout(timeout));
  const flush=()=>{void current.current?.flush()};let ticks=0;
  const timer=setInterval(()=>{const e=current.current;if(e&&(JSON.stringify(e.latest)!==JSON.stringify(e.base)||++ticks%10===0))flush()},3000);
  window.addEventListener("focus",flush);window.addEventListener("online",flush);window.addEventListener("pagehide",flush);document.addEventListener("visibilitychange",flush);
  return()=>{cancelled=true;clearTimeout(timeout);controller.abort();clearInterval(timer);window.removeEventListener("focus",flush);window.removeEventListener("online",flush);window.removeEventListener("pagehide",flush);document.removeEventListener("visibilitychange",flush);const e=current.current;if(e){e.closed=true;if(JSON.stringify(e.latest)!==JSON.stringify(e.base))void e.flush();current.current=null}};
 },[language,reload]);
 const change=(update:(p:CalendarPlan)=>CalendarPlan)=>{const e=current.current;if(!e||e.blocked)return false;const next=update(e.latest);if(!validCalendar(next)){setError("This calendar is full. Shorten a goal or remove an older item before adding more.");return false}e.latest=next;setPlan(next);try{localStorage.setItem(key(e.user),JSON.stringify({revision:e.revision,base:e.base,state:next}))}catch{setStatus("Not saved. Keep this page open and download your edits.")}void e.flush();return true};
 const loadSaved=()=>{const e=current.current;if(e){if(!window.confirm("Load the saved calendar? Your unsynced edits will be kept as a backup on this device."))return;try{localStorage.setItem(key(e.user)+":backup",JSON.stringify(e.latest));localStorage.removeItem(key(e.user))}catch{setError("Backup could not be saved. Download your edits first.");return}}setReload(n=>n+1)};
 return {plan,ready,status,error,conflict,user,change,retry:()=>{if(current.current)void current.current.flush();else setReload(n=>n+1)},loadSaved};
}
