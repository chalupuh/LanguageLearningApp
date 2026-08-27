"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {emptyJourney,type Journey} from "../lib/journey";
export type JourneyState=Journey & {checkpoint?:{id:string;title:string;level:string;text:string;questions:{skill:string;prompt:string;options:string[]}[]}|null;checkpointAvailableAt?:number};
export function useJourney(){
 const [journey,setJourney]=useState<JourneyState>(emptyJourney),[notice,setNotice]=useState(""),[error,setError]=useState(""),[loaded,setLoaded]=useState(false),[pending,setPending]=useState(false);
 const failed=useRef<Record<string,unknown>|null>(null);
 const refresh=useCallback(async()=>{try{const response=await fetch("/api/journey",{cache:"no-store"});const data=await response.json();if(!response.ok)throw Error(data.error);setJourney(data);setLoaded(true);setError("")}catch(e){setError(e instanceof Error?e.message:"Could not load your journey.")}},[]);
 useEffect(()=>{void refresh();const focus=()=>{void refresh()};window.addEventListener("focus",focus);return()=>window.removeEventListener("focus",focus)},[refresh]);
 const record=useCallback(async(body:Record<string,unknown>)=>{setPending(true);try{const response=await fetch("/api/journey",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error);failed.current=null;setNotice(data.awarded>0?`+${data.awarded} XP · practice recorded`:data.message||"Saved");await refresh();return data}catch(e){failed.current=body;setError(e instanceof Error?e.message:"Could not record practice.");return null}finally{setPending(false)}},[refresh]);
 const retry=()=>failed.current?record(failed.current):refresh();
 return {journey,notice,error,loaded,pending,record,refresh,retry};
}
