"use client";
import {useEffect,useRef,useState} from "react";
import type {SpanishLabState} from "../lib/spanish-lab";
import {evaluateSpanishDictation} from "../lib/spanish-lab";

const lessons=[
 {level:"A1",title:"Start speaking",description:"Greetings, introductions, coffee and breakfast.",ids:["es-hola","es-cafe","es-desayuno"]},
 {level:"A1",title:"Get around",description:"Prices, directions and a table for two.",ids:["es-precio","es-direccion","es-restaurante"]},
 {level:"A2",title:"Make plans",description:"Reschedule, shop at a market and talk about yesterday.",ids:["es-planes","es-mercado","es-ayer"]},
 {level:"A2",title:"Handle real life",description:"A pharmacy visit, an exchange and a weekend story.",ids:["es-farmacia","es-devolucion","es-finsemana"]},
];
const words=[
 ["la estación","station"],["el recibo","receipt"],["la garganta","throat"],["el desayuno","breakfast"],["la talla","size"],["el fin de semana","weekend"],
] as const;
const sounds=[
 {id:"r-rr",title:"r / rr",a:"pero",b:"perro",tip:"Use one quick tap in pero and a trill in perro."},
 {id:"n-nye",title:"n / ñ",a:"pena",b:"peña",tip:"For ñ, let the middle of the tongue rise toward the palate."},
 {id:"stress",title:"Word stress",a:"público",b:"publicó",tip:"The written accent marks the stressed syllable."},
] as const;
const missions=[
 {id:"cafe",title:"Order coffee",prompt:"Ask for a small coffee with milk to go.",answer:"Un café pequeño con leche para llevar, por favor."},
 {id:"directions",title:"Find the station",prompt:"Ask where the station is and whether it is far.",answer:"¿Dónde está la estación? ¿Está lejos?"},
 {id:"plans",title:"Change a plan",prompt:"Say you work until four and suggest four thirty.",answer:"Trabajo hasta las cuatro. ¿Nos vemos a las cuatro y media?"},
] as const;
const add=(items:string[],id:string)=>items.includes(id)?items:[...items,id];

function useAudio(loadAudio:(text:string)=>Promise<Blob>){const ref=useRef<HTMLAudioElement|null>(null),url=useRef(""),[busy,setBusy]=useState("");useEffect(()=>()=>{ref.current?.pause();if(url.current)URL.revokeObjectURL(url.current)},[]);return{busy,play:async(text:string)=>{setBusy(text);try{const blob=await loadAudio(text);if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);ref.current?.pause();ref.current=new Audio(url.current);await ref.current.play()}finally{setBusy("")}}}}

export default function SpanishLab({completedLessons,state,onChange,onLesson,loadAudio,syncState}:{completedLessons:string[];state:SpanishLabState;onChange:(state:SpanishLabState)=>void;onLesson:(id:string)=>void;loadAudio:(text:string)=>Promise<Blob>;syncState:"local"|"syncing"|"synced"|"unsaved"}){
 const [section,setSection]=useState<"path"|"words"|"sounds"|"missions">("path"),[dictation,setDictation]=useState(""),[result,setResult]=useState("");const audio=useAudio(loadAudio);
 const done=completedLessons.filter(id=>id.startsWith("es-")).length;
 return <section className="swedish-lab spanish-lab" aria-labelledby="spanish-lab-title">
  <header className="swedish-lab-hero"><div><p className="eyebrow">Spanish · Latin America</p><h1 id="spanish-lab-title">Beginner lab · A1–A2</h1><p>Build a neutral, broadly understood foundation through short conversations, sound practice and practical missions.</p><span className="lab-sync">{syncState==="synced"?"Progress saved":syncState==="syncing"?"Saving progress…":"Progress kept on this device"}</span></div><div className="lab-hero-mark"><span>{done}/12</span><small>lessons complete</small></div></header>
  <nav className="lab-nav" aria-label="Spanish beginner lab sections">{([['path','Path'],['words','Words'],['sounds','Sounds'],['missions','Missions']] as const).map(([id,label])=><button key={id} className={section===id?"active":""} onClick={()=>setSection(id)}>{label}</button>)}</nav>
  {section==="path"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Guided path</p><h2>Move from first words to everyday independence.</h2></div></div><div className="foundation-path">{lessons.map((unit,index)=><article key={unit.title}><span className="foundation-line"/><div className="foundation-title"><p className="eyebrow">{unit.level} · Unit {index+1}</p><h3>{unit.title}</h3><p>{unit.description}</p></div><div className="choice-row">{unit.ids.map(id=><button className="lab-primary" key={id} onClick={()=>onLesson(id)}>{completedLessons.includes(id)?"Review":"Start"} {id.replace("es-","")} →</button>)}</div></article>)}</div></div>}
  {section==="words"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Words with their articles</p><h2>Learn the noun and gender together.</h2></div></div><div className="noun-layout">{words.map(([word,meaning])=><article key={word} className="sentence-builder"><button className="lab-listen" disabled={audio.busy===word} onClick={()=>void audio.play(word)}>▶ {word}</button><p>{meaning}</p><button className="lab-primary" onClick={()=>onChange({...state,masteredNounIds:add(state.masteredNounIds,word)})}>{state.masteredNounIds.includes(word)?"Mastered ✓":"Mark mastered"}</button></article>)}</div></div>}
  {section==="sounds"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Sound contrasts</p><h2>Hear distinctions that change meaning.</h2></div></div><div className="sound-practice">{sounds.map(item=><article key={item.id}><h3>{item.title}</h3><div className="sound-buttons"><button onClick={()=>void audio.play(item.a)}>▶ {item.a}</button><button onClick={()=>void audio.play(item.b)}>▶ {item.b}</button></div><p className="sound-tip">{item.tip}</p><button className="lab-primary" onClick={()=>onChange({...state,completedActivityIds:add(state.completedActivityIds,item.id)})}>{state.completedActivityIds.includes(item.id)?"Practiced ✓":"Mark practiced"}</button></article>)}</div><div className="dictation-practice"><p className="eyebrow">Quick dictation</p><button className="lab-listen" onClick={()=>void audio.play("¿Dónde está la estación?")}>▶ Hear sentence</button><input aria-label="Type what you hear" value={dictation} onChange={e=>setDictation(e.target.value)} placeholder="Escribe lo que escuchas"/><button className="lab-primary" onClick={()=>setResult(evaluateSpanishDictation(dictation,"¿Dónde está la estación?")==="correct"?"Correct — accents and punctuation may vary. ✓":"Try once more and listen for estación.")}>Check</button>{result&&<p role="status">{result}</p>}</div></div>}
  {section==="missions"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Practical missions</p><h2>Say what you need in a real situation.</h2></div></div><div className="mission-grid">{missions.map(item=><article key={item.id}><p className="eyebrow">Mission</p><h3>{item.title}</h3><p>{item.prompt}</p><details><summary>Show a strong answer</summary><p lang="es-419">{item.answer}</p><button className="lab-listen" onClick={()=>void audio.play(item.answer)}>▶ Hear answer</button></details><button className="lab-primary" onClick={()=>onChange({...state,completedMissionIds:add(state.completedMissionIds,item.id)})}>{state.completedMissionIds.includes(item.id)?"Completed ✓":"Complete mission"}</button></article>)}</div></div>}
 </section>
}
