"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {emptyJourney,type Journey} from "../lib/journey";
import type {Release} from "../content/releases";
export type JourneyState=Journey & {collectionXp?:number;frenchXp?:number;swedishXp?:number;releases?:Release[];checkpoint?:{id:string;title:string;level:string;text:string;questions:{skill:string;prompt:string;options:string[]}[]}|null;checkpointAvailableAt?:number};
type Activity=Record<string,unknown>;
export function useJourney(language:"fr"|"sv"="fr"){
 const [journey,setJourney]=useState<JourneyState>(emptyJourney),[notice,setNotice]=useState(""),[loadError,setLoadError]=useState(""),[saveError,setSaveError]=useState(""),[loaded,setLoaded]=useState(false),[pending,setPending]=useState(false);
 const failed=useRef<{body:Activity;message:string}[]>([]),reads=useRef(0),writes=useRef(0);
 const endpoint="/api/journey"+(language==="sv"?"?language=sv":"");
 const refresh=useCallback(async()=>{
  const request=++reads.current;
  try{
   const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(15000)});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Could not load your journey.");
   if(request!==reads.current)return;
   setJourney(data);setLoaded(true);setLoadError("");
  }catch(e){if(request===reads.current)setLoadError(e instanceof Error?e.message:"Could not load your journey.")}
 },[endpoint]);
 useEffect(()=>{void refresh();const focus=()=>{void refresh()};window.addEventListener("focus",focus);return()=>{reads.current++;window.removeEventListener("focus",focus)}},[refresh]);
 const record=useCallback(async(body:Activity)=>{
  writes.current++;reads.current++;setPending(true);
  try{
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Could not record practice.");
   // An unrelated successful action must not discard a failed practice.
   failed.current=failed.current.filter(item=>item.body!==body);setSaveError(failed.current[0]?.message||"");
   setNotice(data.awarded>0?`+${data.awarded} XP · practice recorded`:data.message||"Saved");
   await refresh();return data;
  }catch(e){
   const message=e instanceof Error?e.message:"Could not record practice.";
   if(!failed.current.some(item=>item.body===body))failed.current.push({body,message});
   setSaveError(failed.current[0].message);return null;
  }finally{writes.current--;setPending(writes.current>0)}
 },[endpoint,refresh]);
 const retry=()=>failed.current.length?record(failed.current[0].body):refresh();
 return {journey,notice,error:saveError||loadError,loaded,pending,record,refresh,retry};
}
