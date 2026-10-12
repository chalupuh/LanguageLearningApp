"use client";
import {useEffect,useRef,useState} from "react";
import {rehearsalPhrases} from "../lib/rehearsal";
import {captureActive,CAPTURE_PLAYBACK_EVENT,holdAppPlayback} from "../lib/audio-capture";
import "./listen-closer.css";

type Props={text:string;focus?:string;meaning?:string;language:"fr"|"sv";completed:boolean;loadAudio:(text:string)=>Promise<Blob>;onComplete:(reflection:string)=>void};
export default function ListenCloser({text,focus,meaning,language,completed,loadAudio,onComplete}:Props){
 const phrases=rehearsalPhrases(text),options=focus?[focus,...phrases.filter(p=>p!==focus)]:phrases;
 const [index,setIndex]=useState(0),[heard,setHeard]=useState(false),[revealed,setRevealed]=useState(false),[reheard,setReheard]=useState(false),[noticed,setNoticed]=useState<number|null>(null),[reading,setReading]=useState(false);
 const [status,setStatus]=useState<"idle"|"loading"|"playing">("idle"),[error,setError]=useState("");
 const audio=useRef<HTMLAudioElement|null>(null),url=useRef(""),generation=useRef(0),mounted=useRef(false);
 const phrase=options[index]||"",words=phrase.split(/\s+/u);
 const stop=()=>{generation.current++;audio.current?.pause();audio.current=null;if(url.current)URL.revokeObjectURL(url.current);url.current=""};
 useEffect(()=>{mounted.current=true;const pause=()=>{stop();setStatus("idle")};window.addEventListener(CAPTURE_PLAYBACK_EVENT,pause);return()=>{mounted.current=false;stop();window.removeEventListener(CAPTURE_PLAYBACK_EVENT,pause)}},[]);
 const listen=async(rate:number)=>{
  if(captureActive()){setError("Finish recording before listening.");return}
  const release=holdAppPlayback();release();stop();const attempt=generation.current,comparison=revealed;setStatus("loading");setError("");
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{const blob=await Promise.race([loadAudio(phrase),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error("timeout")),20000)})]);
   if(!mounted.current||attempt!==generation.current||captureActive())return;
   url.current=URL.createObjectURL(blob);const player=new Audio(url.current);audio.current=player;player.playbackRate=rate;
   player.onended=()=>{if(attempt!==generation.current)return;setHeard(true);if(comparison)setReheard(true);stop();setStatus("idle")};
   player.onerror=()=>{if(attempt!==generation.current)return;stop();setStatus("idle");setError("Audio could not play. Retry, or use the reading alternative below.")};
   await player.play();if(mounted.current&&attempt===generation.current)setStatus("playing");
  }catch{if(mounted.current&&attempt===generation.current){stop();setStatus("idle");setError("Audio is unavailable. Retry, or use the reading alternative below.")}}finally{if(timer)clearTimeout(timer)}
 };
 const ready=revealed&&noticed!==null&&(reheard||reading)&&status==="idle";
 const [practiseAgain,setPractiseAgain]=useState(false);
 if(completed&&!practiseAgain)return <section className="listen-closer"><p className="closer-complete" role="status">Listen closer complete ✓ Your earlier practice is saved.</p><p>Continue to your retell practice, or hear one detail again.</p><button onClick={()=>setPractiseAgain(true)}>Practise another detail</button></section>;
 if(!phrase)return <p>Add a transcript to begin Listen closer.</p>;
 return <section className="listen-closer" aria-label="Listen closer">
  <p className="closer-purpose">Turn one blurry phrase into something familiar. No transcription test, no score: just hear it, uncover it, then hear it again.</p>
  <label>Focus phrase <select value={index} onChange={e=>{stop();setIndex(Number(e.target.value));setHeard(false);setRevealed(false);setReheard(false);setNoticed(null);setReading(false);setError("");setStatus("idle")}}>{options.map((_,i)=><option key={i} value={i}>{i===0&&focus?"Suggested phrase":`Phrase ${i+1}`}</option>)}</select></label>
  <ol className="closer-guide"><li className={heard?"finished":""}>Hear it without text</li><li className={revealed?"finished":""}>Uncover one detail</li><li className={reheard?"finished":""}>Listen again</li></ol>
  <div className="closer-actions"><button disabled={status!=="idle"} onClick={()=>void listen(1)}>{revealed?"Listen again":"Hear this phrase"}</button><button disabled={status!=="idle"} onClick={()=>void listen(.8)}>Hear slowly</button>{status!=="idle"&&<button onClick={()=>{stop();setStatus("idle")}}>Stop</button>}</div>
  <p role="status">{status==="loading"?"Preparing phrase…":status==="playing"?"Listening…":revealed&&!reheard&&!reading?"Now listen again and follow the detail you picked.":heard&&!revealed?"What did you catch? Uncover the words to compare.":"AI practice voice · a short phrase, not the original speaker"}</p>
  {!revealed&&<button disabled={!heard&&!reading||status!=="idle"} onClick={()=>setRevealed(true)}>Uncover the words</button>}
  {revealed&&<div className="closer-comparison"><p className="listen-closer-text" lang={language}>{phrase}</p>{index===0&&meaning&&<p className="closer-meaning">{meaning}</p>}<p>Tap a word you missed, or one you want to hear more clearly. Listen for that small detail, not the whole passage.</p><div className="closer-words" lang={language}>{words.map((word,i)=><button key={i} aria-pressed={noticed===i} onClick={()=>setNoticed(i)}>{word}</button>)}</div></div>}
  {error&&<p role="alert">{error}</p>}
  {error&&!reading&&<button onClick={()=>{stop();setStatus("idle");setReading(true);setRevealed(true)}}>Use text comparison instead (audio unavailable)</button>}
  {reading&&<p role="status">Reading alternative: compare this phrase with your first-listen summary and pick a useful word. This is not evidence of improved hearing.</p>}
  <div className="closer-finish"><p>{reading?"What did you notice in the text?":"After that second listen, how did it feel?"}</p><button disabled={!ready} onClick={()=>onComplete(reading?"New expression":"I understood it")}>{reading?"I found a useful word":"I can hear that detail now"}</button><button disabled={!ready} onClick={()=>onComplete("Sounded different")}>Still tricky — keep practising</button></div>
  {completed&&<p className="closer-complete" role="status">Listen closer complete ✓ Continue to Rehearse. “Still tricky” counts too; this is practice, not a test.</p>}
 </section>;
}
