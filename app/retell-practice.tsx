"use client";
import {useState,type ReactNode} from "react";
import FluencyPractice,{type FluencyDraft} from "./fluency-practice";
export default function RetellPractice({language,draft,onDraft,onComplete,completed,recorder,rehearsal}:{language:"fr"|"sv";draft:FluencyDraft;onDraft:(update:(previous:FluencyDraft)=>FluencyDraft)=>void;onComplete:()=>void;completed:boolean;recorder:(plan:string)=>ReactNode;rehearsal:ReactNode}){
 const [mode,setMode]=useState("quick");
 return <section className="retell-practice"><div className="retell-choice" aria-label="Choose your retell practice"><button aria-pressed={mode==="quick"} onClick={()=>setMode("quick")}>Quick retell</button><button aria-pressed={mode==="phrase"} onClick={()=>setMode("phrase")}>Phrase rehearsal</button></div>{completed&&<p role="status">This step is complete ✓ Continue to your fuller retell, or practise again.</p>}{mode==="quick"?<FluencyPractice quick language={language} draft={draft} onDraft={onDraft} onComplete={onComplete} recorder={recorder}/>:rehearsal}</section>;
}
