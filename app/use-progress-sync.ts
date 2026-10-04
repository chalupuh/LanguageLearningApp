"use client";
import {useEffect,useRef} from "react";
import {mergeProgress,progressEqual} from "../lib/progress-sync";
type State=Record<string,any>;
type Callbacks={apply:(state:State)=>void;onReady:(ready:boolean)=>void;onStatus:(status:"local"|"syncing"|"synced")=>void;onError:(message:string)=>void};
export function useProgressSync(state:State,callbacks:Callbacks,language:string){
 const current=useRef(state),cb=useRef(callbacks),base=useRef<State>({}),revision=useRef<number|null>(null),ready=useRef(false),busy=useRef(false),alive=useRef(false),cache=useRef("");
 current.current=state;cb.current=callbacks;
 const endpoint="/api/progress"+(language==="sv"?"?language=sv":"");
 const cachePending=()=>{if(!cache.current)return;try{localStorage.setItem(cache.current,JSON.stringify({base:base.current,local:current.current}))}catch{}};
 const save=async()=>{
  if(!ready.current||busy.current)return;busy.current=true;
  try{
   // Re-read before merging, including on focus, so other-device work is visible.
   const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();
   const remote=await response.json();if(!alive.current)return;
   let snapshot=current.current;const merged=mergeProgress(base.current,snapshot,remote.state||{});
   base.current=remote.state||{};revision.current=remote.syncedAt;
   current.current=merged;cb.current.apply(merged);snapshot=merged;
   if(progressEqual(merged,base.current)){cb.current.onStatus("synced");cb.current.onError("");cachePending();return;}
   cb.current.onStatus("syncing");cachePending();
   const put=await fetch(endpoint,{method:"PUT",headers:{"Content-Type":"application/json","If-Match":String(revision.current??0)},body:JSON.stringify(snapshot),signal:AbortSignal.timeout(15000)});
   if(!put.ok||put.status===202)throw Error();const saved=await put.json();
   if(!alive.current)return;base.current=snapshot;revision.current=saved.syncedAt;
   cb.current.onStatus(progressEqual(current.current,snapshot)?"synced":"syncing");cb.current.onError("");cachePending();
  }catch{if(alive.current){cb.current.onStatus("local");cb.current.onError("Your changes are kept on this device. Sync will retry automatically when connected.");cachePending();}}
  finally{busy.current=false;}
 };
 useEffect(()=>{
  alive.current=true;
  const start=async()=>{if(busy.current||ready.current)return;busy.current=true;try{
   const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();const data=await response.json();if(!alive.current)return;
   cache.current=`a-loreille-pending-v2:${data.userId}`;let pending:any;try{pending=JSON.parse(localStorage.getItem(cache.current)||"null")}catch{}
   base.current=data.state||{};revision.current=data.syncedAt;
   const initial=pending?.base&&pending?.local?mergeProgress(pending.base,pending.local,base.current):base.current;
   current.current=initial;cb.current.apply(initial);ready.current=true;cb.current.onReady(true);cb.current.onStatus("synced");cb.current.onError("");
  }catch{if(alive.current)cb.current.onError("Could not load saved progress. Reconnecting automatically; your saved work has not been changed.");}finally{busy.current=false;}};
  void start();const retry=()=>{if(ready.current)void save();else void start();};
  const hide=()=>{cachePending();if(document.visibilityState==="hidden")void save();};
  const interval=window.setInterval(retry,10000);window.addEventListener("focus",retry);window.addEventListener("online",retry);document.addEventListener("visibilitychange",hide);window.addEventListener("pagehide",cachePending);
  return()=>{cachePending();alive.current=false;window.clearInterval(interval);window.removeEventListener("focus",retry);window.removeEventListener("online",retry);document.removeEventListener("visibilitychange",hide);window.removeEventListener("pagehide",cachePending);};
 },[language]);
 useEffect(()=>{if(!ready.current)return;cachePending();if(progressEqual(state,base.current))return;cb.current.onStatus("syncing");const timer=window.setTimeout(()=>void save(),700);return()=>clearTimeout(timer);},[JSON.stringify(state)]);
}
