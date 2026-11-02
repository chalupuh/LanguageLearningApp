"use client";
import {useEffect,useRef,useState} from "react";
import type {SpanishLabState} from "../lib/spanish-lab";
import {evaluateSpanishDictation,recommendSpanishNext,spanishPracticeEvidence} from "../lib/spanish-lab";

const lessons=[
 {level:"A1",title:"Start speaking",description:"Greetings, introductions, coffee and breakfast.",ids:["es-hola","es-cafe","es-desayuno"]},
 {level:"A1",title:"Get around",description:"Prices, directions and a table for two.",ids:["es-precio","es-direccion","es-restaurante"]},
 {level:"A1",title:"Travel basics",description:"Check into a hotel and take a taxi to the airport.",ids:["es-hotel","es-taxi"]},
 {level:"A2",title:"Make plans",description:"Reschedule, shop at a market and talk about yesterday.",ids:["es-planes","es-mercado","es-ayer"]},
 {level:"A2",title:"Handle real life",description:"A pharmacy visit, an exchange and a weekend story.",ids:["es-farmacia","es-devolucion","es-finsemana"]},
 {level:"A2",title:"Solve travel problems",description:"Handle the airport, a hotel problem, an appointment and a bill.",ids:["es-aeropuerto","es-habitacion","es-cita","es-cuenta"]},
];
const lessonIds=lessons.flatMap(unit=>unit.ids);
const words=[
 {word:"la estación",meaning:"station",plural:"las estaciones",example:"¿Dónde está la estación?"},
 {word:"el recibo",meaning:"receipt",plural:"los recibos",example:"¿Me da el recibo, por favor?"},
 {word:"la garganta",meaning:"throat",plural:"las gargantas",example:"Me duele la garganta."},
 {word:"el desayuno",meaning:"breakfast",plural:"los desayunos",example:"¿A qué hora termina el desayuno?"},
 {word:"la talla",meaning:"size",plural:"las tallas",example:"Necesito una talla más grande."},
 {word:"el fin de semana",meaning:"weekend",plural:"los fines de semana",example:"¿Qué hiciste el fin de semana?"},
] as const;
const sounds=[
 {id:"r-rr",title:"r / rr",a:"pero",b:"perro",tip:"Use one quick tap in pero and a trill in perro."},
 {id:"n-nye",title:"n / ñ",a:"pena",b:"peña",tip:"For ñ, let the middle of the tongue rise toward the palate."},
 {id:"stress",title:"Word stress",a:"público",b:"publicó",tip:"The written accent marks the stressed syllable."},
] as const;
const dictations=[
 {id:"dictation-station",text:"¿Dónde está la estación?",hint:"Listen for dónde, está, and estación."},
 {id:"dictation-cafe",text:"Un café pequeño con leche para llevar, por favor.",hint:"Listen for the size, milk, and para llevar."},
 {id:"dictation-directions",text:"¿Dónde está la estación? ¿Está lejos?",hint:"This has two short questions."},
 {id:"dictation-plans",text:"Trabajo hasta las cuatro. ¿Nos vemos a las cuatro y media?",hint:"Listen for the difference between cuatro and cuatro y media."},
] as const;
const missions=[
 {id:"cafe",title:"A morning out",steps:[
  {prompt:"Order a small coffee with milk to go.",answer:"Un café pequeño con leche para llevar, por favor.",audio:true},
  {prompt:"Ask for the receipt.",answer:"¿Me da el recibo, por favor?"},
  {prompt:"Thank the server and say goodbye.",answer:"Muchas gracias. Que tenga un buen día."},
 ]},
 {id:"directions",title:"Reach the station",steps:[
  {prompt:"Ask where the station is and whether it is far.",answer:"¿Dónde está la estación? ¿Está lejos?",audio:true},
  {prompt:"Ask the person to repeat more slowly.",answer:"¿Puede repetir más despacio, por favor?"},
  {prompt:"Confirm that you should turn left.",answer:"Entonces, ¿doblo a la izquierda?"},
 ]},
 {id:"plans",title:"Change an appointment",steps:[
  {prompt:"Say you work until four and suggest four thirty.",answer:"Trabajo hasta las cuatro. ¿Nos vemos a las cuatro y media?",audio:true},
  {prompt:"Ask whether tomorrow works instead.",answer:"¿Te queda bien mañana?"},
  {prompt:"Confirm the new time.",answer:"Perfecto, nos vemos mañana a las cuatro y media."},
 ]},
] as const;
const add=(items:string[],id:string)=>items.includes(id)?items:[...items,id];

function useAudio(loadAudio:(text:string)=>Promise<Blob>){const ref=useRef<HTMLAudioElement|null>(null),url=useRef(""),[busy,setBusy]=useState("");useEffect(()=>()=>{ref.current?.pause();if(url.current)URL.revokeObjectURL(url.current)},[]);return{busy,play:async(text:string)=>{setBusy(text);try{const blob=await loadAudio(text);if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);ref.current?.pause();ref.current=new Audio(url.current);await ref.current.play()}finally{setBusy("")}}}}

export default function SpanishLab({completedLessons,state,onChange,onLesson,loadAudio,syncState}:{completedLessons:string[];state:SpanishLabState;onChange:(state:SpanishLabState)=>void;onLesson:(id:string)=>void;loadAudio:(text:string)=>Promise<Blob>;syncState:"local"|"syncing"|"synced"|"unsaved"}){
 const [section,setSection]=useState<"path"|"words"|"sounds"|"missions">("path"),[dictation,setDictation]=useState(""),[dictationIndex,setDictationIndex]=useState(0),[result,setResult]=useState("");const audio=useAudio(loadAudio);
 const done=completedLessons.filter(id=>id.startsWith("es-")).length;
 const evidence=spanishPracticeEvidence(completedLessons,state),recommendation=recommendSpanishNext(completedLessons,state,lessonIds),activeDictation=dictations[dictationIndex];
 return <section className="swedish-lab spanish-lab" aria-labelledby="spanish-lab-title">
  <header className="swedish-lab-hero"><div><p className="eyebrow">Spanish · Latin America</p><h1 id="spanish-lab-title">Beginner lab · A1–A2</h1><p>Build a neutral, broadly understood foundation through short conversations, sound practice and practical missions.</p><span className="lab-sync">{syncState==="synced"?"Progress saved":syncState==="syncing"?"Saving progress…":"Progress kept on this device"}</span></div><div className="lab-hero-mark"><span>{done}/{lessonIds.length}</span><small>lessons complete</small></div></header>
  <nav className="lab-nav" aria-label="Spanish beginner lab sections">{([['path','Path'],['words','Words'],['sounds','Sounds'],['missions','Missions']] as const).map(([id,label])=><button key={id} className={section===id?"active":""} onClick={()=>setSection(id)}>{label}</button>)}</nav>
  {section==="path"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Guided path</p><h2>Move from first words to everyday independence.</h2></div></div><article className="grammar-note"><span>→</span><p className="eyebrow">Recommended next</p><h3>{recommendation.message}</h3><p>{evidence.lessons} lessons · {evidence.vocabulary} words · {evidence.soundContrasts} sound contrasts · {evidence.dictations} dictations · {evidence.missions} missions recorded as practice evidence.</p>{recommendation.area!=="review"&&recommendation.area!=="lesson"&&<button className="lab-primary" onClick={()=>setSection(recommendation.area)}>Open {recommendation.area} →</button>}{recommendation.area==="lesson"&&<button className="lab-primary" onClick={()=>onLesson(recommendation.id)}>Open next conversation →</button>}</article><div className="foundation-path">{lessons.map((unit,index)=>{const completed=unit.ids.filter(id=>completedLessons.includes(id)).length;return <article key={unit.title}><span className="foundation-line"/><div className="foundation-title"><p className="eyebrow">{unit.level} · Unit {index+1} · {completed}/{unit.ids.length}</p><h3>{unit.title}</h3><p>{unit.description}</p></div><div className="choice-row">{unit.ids.map(id=><button className="lab-primary" key={id} onClick={()=>onLesson(id)}>{completedLessons.includes(id)?"Review":"Start"} {id.replace("es-","")} →</button>)}</div></article>})}</div></div>}
  {section==="words"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Words with their articles</p><h2>Learn the noun and gender together.</h2></div></div><div className="noun-layout">{words.map(item=><article key={item.word} className="sentence-builder"><button className="lab-listen" disabled={audio.busy===item.word} onClick={()=>void audio.play(item.word)}>▶ {item.word}</button><p>{item.meaning}</p><details className="swedish-word-help"><summary>Help with this word</summary><dl><div><dt>Plural</dt><dd lang="es-419">{item.plural}</dd></div><div><dt>In a sentence</dt><dd lang="es-419">{item.example}</dd></div></dl></details><button className="lab-primary" onClick={()=>onChange({...state,masteredNounIds:add(state.masteredNounIds,item.word)})}>{state.masteredNounIds.includes(item.word)?"Mastered ✓":"Mark mastered"}</button></article>)}</div></div>}
  {section==="sounds"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Sound contrasts</p><h2>Hear distinctions that change meaning.</h2></div></div><div className="sound-practice">{sounds.map(item=><article key={item.id}><h3>{item.title}</h3><div className="sound-buttons"><button onClick={()=>void audio.play(item.a)}>▶ {item.a}</button><button onClick={()=>void audio.play(item.b)}>▶ {item.b}</button></div><p className="sound-tip">{item.tip}</p><button className="lab-primary" onClick={()=>onChange({...state,completedActivityIds:add(state.completedActivityIds,item.id)})}>{state.completedActivityIds.includes(item.id)?"Practiced ✓":"Mark practiced"}</button></article>)}</div><div className="dictation-practice"><header><span>Dictation {dictationIndex+1} of {dictations.length}</span><small>{state.completedActivityIds.includes(activeDictation.id)?"✓ practised":"Replay as needed"}</small></header><h3>Type what you hear.</h3><button className="lab-listen" onClick={()=>void audio.play(activeDictation.text)}>▶ Hear sentence</button><label htmlFor="spanish-dictation">Your Spanish</label><textarea id="spanish-dictation" value={dictation} onChange={e=>{setDictation(e.target.value);setResult("")}} placeholder="Escribe lo que escuchas"/><p className="sound-tip">{activeDictation.hint}</p><button className="lab-primary" disabled={!dictation.trim()} onClick={()=>{const correct=evaluateSpanishDictation(dictation,activeDictation.text)==="correct";setResult(correct?"Correct — accents and punctuation count in this careful-writing check. ✓":"Try once more and compare the word boundaries.");if(correct)onChange({...state,completedActivityIds:add(state.completedActivityIds,activeDictation.id)})}}>Check</button>{result&&<p role="status">{result}</p>}<button disabled={!result.startsWith("Correct")} onClick={()=>{setDictationIndex(value=>(value+1)%dictations.length);setDictation("");setResult("")}}>Next dictation →</button></div></div>}
  {section==="missions"&&<div className="lab-section"><div className="lab-section-heading"><div><p className="eyebrow">Practical missions</p><h2>Handle a situation across several turns.</h2></div><p>Say your answer before opening the model. Different natural wording is welcome.</p></div><div className="mission-grid">{missions.map(item=><article key={item.id}><p className="eyebrow">Three-turn mission</p><h3>{item.title}</h3><ol>{item.steps.map((step,index)=><li key={step.prompt}><strong>Turn {index+1}</strong><p>{step.prompt}</p><details><summary>Show one strong answer</summary><p lang="es-419">{step.answer}</p>{"audio" in step&&step.audio&&<button className="lab-listen" onClick={()=>void audio.play(step.answer)}>▶ Hear answer</button>}</details></li>)}</ol><button className="lab-primary" onClick={()=>onChange({...state,completedMissionIds:add(state.completedMissionIds,item.id)})}>{state.completedMissionIds.includes(item.id)?"Completed ✓":"Complete mission"}</button></article>)}</div></div>}
 </section>
}
