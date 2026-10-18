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
  const read=async()=>{const r=await fetch(endpoint,{cache:"no-store",signal:controller.signal});if(!r.ok)throw Error("Your calendar could not load. Please retry.");const d=await r.json();if(!validCalendar(d.state)||!Number.isSafeInteger(d.revision)||typeof d.userId!=="string")throw Error("Your calendar could not be read. Please retry.");return d};
  void read().then(d=>{if(cancelled)return;let latest=d.state,blocked=false;try{const local=JSON.parse(localStorage.getItem(key(d.userId))||"null");if(local&&validCalendar(local.state)&&validCalendar(local.base)){const merged=mergeCalendar(local.base,local.state,d.state);latest=merged.plan;blocked=merged.conflict}}catch{}
   const e:Entry={user:d.userId,revision:d.revision,base:d.state,latest,closed:false,busy:false,blocked,flush:async()=>{}};
   e.flush=async()=>{if(e.busy||e.blocked||JSON.stringify(e.latest)===JSON.stringify(e.base))return;e.busy=true;const snapshot=e.latest;let again=false;
    if(!e.closed){setStatus("Saving…");setError("")}
    try{const body=JSON.stringify({state:snapshot,revision:e.revision}),r=await fetch(endpoint,{method:"PUT",headers:{"Content-Type":"application/json"},body,keepalive:new TextEncoder().encode(body).length<60000});
     if(r.status===409){const remote=await read(),merged=mergeCalendar(e.base,e.latest,remote.state);if(merged.conflict){e.blocked=true;if(!e.closed){setConflict(true);setError("This goal was also changed on another device. Your edits are kept here. Download them before loading the saved calendar.")}}else{e.base=remote.state;e.revision=remote.revision;e.latest=merged.plan;if(!e.closed)setPlan(e.latest)}cache(e);if(!e.closed)setStatus(e.blocked?"Changes need review":"Combining changes from your devices…");return}
     const result=await r.json();if(!r.ok||!Number.isSafeInteger(result.revision))throw Error(result.error||"Calendar could not save.");e.base=snapshot;e.revision=result.revision;cache(e);again=JSON.stringify(e.latest)!==JSON.stringify(snapshot);if(!e.closed)setStatus(again?"Saving…":"Saved · available on your other devices");
    }catch{if(!e.closed)setStatus(cache(e)?"Saved on this device · waiting to sync":"Not saved. Keep this page open and retry.")}finally{e.busy=false;if(again)void e.flush()}
   };
   current.current=e;setPlan(latest);setUser(e.user);setConflict(blocked);setReady(true);setStatus(blocked?"Changes need review":"Saved · available on your other devices");if(blocked)setError("This calendar also changed on another device. Your unsynced edits are kept here. Download them before loading the saved calendar.");cache(e);void e.flush();
  }).catch(()=>{if(!cancelled){setError("Your calendar could not load. Check your connection and retry. Saved work has not been replaced.");setStatus("Calendar unavailable")}}).finally(()=>clearTimeout(timeout));
  const flush=()=>{void current.current?.flush()};const timer=setInterval(flush,3000);window.addEventListener("online",flush);window.addEventListener("pagehide",flush);document.addEventListener("visibilitychange",flush);
  return()=>{cancelled=true;clearTimeout(timeout);controller.abort();clearInterval(timer);window.removeEventListener("online",flush);window.removeEventListener("pagehide",flush);document.removeEventListener("visibilitychange",flush);const e=current.current;if(e){e.closed=true;void e.flush();current.current=null}};
 },[language,reload]);
 const change=(update:(p:CalendarPlan)=>CalendarPlan)=>{const e=current.current;if(!e||e.blocked)return false;const next=update(e.latest);if(!validCalendar(next)){setError("This calendar is full. Shorten a goal or remove an older item before adding more.");return false}e.latest=next;setPlan(next);try{localStorage.setItem(key(e.user),JSON.stringify({revision:e.revision,base:e.base,state:next}))}catch{}void e.flush();return true};
 const loadSaved=()=>{const e=current.current;if(e){if(!window.confirm("Load the saved calendar? Your unsynced edits will be kept as a backup on this device."))return;try{localStorage.setItem(key(e.user)+":backup",JSON.stringify(e.latest));localStorage.removeItem(key(e.user))}catch{setError("Backup could not be saved. Download your edits first.");return}}setReload(n=>n+1)};
 return {plan,ready,status,error,conflict,user,change,retry:()=>{if(current.current)void current.current.flush();else setReload(n=>n+1)},loadSaved};
}
