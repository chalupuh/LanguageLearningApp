"use client";
import {useEffect, useRef, useState, type ReactNode} from "react";
import {captureActive, CAPTURE_PLAYBACK_EVENT, holdAppPlayback} from "../lib/audio-capture";
import {rehearsalPhrases, phraseChunks, suggestedRehearsal, correctlyBuilt, rehearsalComplete, type RehearsalMode} from "../lib/rehearsal";
import "./rehearse.css";

const names = {echo:"Listen, then echo",build:"Build the phrase",rhythm:"Notice the rhythm"};
type Props = {language?:"fr"|"sv";text:string; source:string; completed:boolean; onComplete:()=>void; loadAudio:(text:string)=>Promise<Blob>; recorder:(phrase:string)=>ReactNode; onRetry:()=>Promise<unknown>};

// The parent keys this component by passage/transcript so changing a Studio
// selection cannot carry a completed exercise over to different material.
export default function Rehearse({language="fr",text,source,completed,onComplete,loadAudio,recorder,onRetry}:Props) {
  const phrases=rehearsalPhrases(text);
  const [mode,setMode]=useState<RehearsalMode>(()=>suggestedRehearsal(source));
  const [index,setIndex]=useState(0),[quiet,setQuiet]=useState(false),[heard,setHeard]=useState(false),[confirmed,setConfirmed]=useState(false);
  const [order,setOrder]=useState<number[]>([]),[checked,setChecked]=useState(false),[noticed,setNoticed]=useState<number|null>(null);
  const [status,setStatus]=useState<"idle"|"loading"|"playing">("idle"),[error,setError]=useState(""),[showRecorder,setShowRecorder]=useState(false);
  const [finished,setFinished]=useState<string[]>([]),[rewarded,setRewarded]=useState(false),[saving,setSaving]=useState(false);
  const audio=useRef<HTMLAudioElement|null>(null),url=useRef(""),generation=useRef(0),mounted=useRef(false);
  const phrase=phrases[index]||"",chunks=phraseChunks(phrase),words=phrase.split(/\s+/u);
  const key=`${mode}:${index}`,built=correctlyBuilt(chunks,order);
  const ready=rehearsalComplete(mode,heard,confirmed,built,noticed!==null);
  const stop=()=>{generation.current++;audio.current?.pause();audio.current=null;if(url.current)URL.revokeObjectURL(url.current);url.current="";};
  useEffect(()=>{
    mounted.current=true;
    const pause=()=>{stop();setStatus("idle")};
    window.addEventListener(CAPTURE_PLAYBACK_EVENT,pause);
    return()=>{mounted.current=false;stop();window.removeEventListener(CAPTURE_PLAYBACK_EVENT,pause)};
  },[]);
  const reset=()=>{stop();setStatus("idle");setHeard(false);setConfirmed(false);setOrder([]);setChecked(false);setNoticed(null);setError("");setShowRecorder(false)};
  const listen=async(rate:number)=>{
    if(captureActive()) {setError("Finish your recording before listening.");return}
    // Pause Library/YouTube playback before this short, separate model phrase.
    const release=holdAppPlayback();release();
    stop();const attempt=++generation.current;setStatus("loading");setError("");
    let timeout:ReturnType<typeof setTimeout>|undefined;
    try{
      const blob=await Promise.race([loadAudio(phrase),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(new Error("Audio timeout")),20000)})]);
      if(!mounted.current||generation.current!==attempt||captureActive())return;
      url.current=URL.createObjectURL(blob);const player=new Audio(url.current);audio.current=player;player.playbackRate=rate;
      player.onended=()=>{if(generation.current!==attempt)return;setHeard(true);setStatus("idle");stop()};
      player.onerror=()=>{if(generation.current!==attempt)return;stop();setStatus("idle");setError("Audio could not play. Retry, or choose Build the phrase.")};
      await player.play();if(mounted.current&&generation.current===attempt)setStatus("playing");
    }catch{if(mounted.current&&generation.current===attempt){stop();setStatus("idle");setError("Audio is unavailable. Retry, or choose Build the phrase.")}}finally{if(timeout)clearTimeout(timeout)}
  };
  const finish=()=>{if(!ready||finished.includes(key))return;setFinished(items=>[...items,key]);onComplete()};
  const retry=async()=>{if(saving||rewarded)return;setSaving(true);try{if(await onRetry())setRewarded(true)}finally{if(mounted.current)setSaving(false)}};
  if(!phrases.length)return <div className="rehearse-card"><p>Add a transcript in Decode to begin rehearsal.</p></div>;
  return <section className="rehearse-card" aria-label={language==="sv"?"Rehearse Swedish":"Rehearse French"}>
    <p>Choose one short activity. Take your time; the voice always finishes before your turn.</p>
    <div className="rehearse-modes" role="group" aria-label="Rehearsal activity">{(Object.keys(names) as RehearsalMode[]).map(value=><button key={value} aria-pressed={mode===value} onClick={()=>{reset();setMode(value)}}>{names[value]}</button>)}</div>
    <label className="rehearse-quiet"><input type="checkbox" checked={quiet} onChange={e=>{setQuiet(e.target.checked);setShowRecorder(false);setConfirmed(false)}}/>Not speaking today</label>
    <p className="rehearse-credit">Every activity counts equally toward your session. Recording is optional.</p>
    <label>Phrase <select aria-label="Phrase to rehearse" value={index} onChange={e=>{reset();setIndex(Number(e.target.value))}}>{phrases.map((p,i)=><option key={i} value={i}>{i+1}. {p.length>65?p.slice(0,65)+"…":p}</option>)}</select></label>
    {mode!=="build"&&<p className="rehearse-french" lang={language}>{phrase}</p>}
    <div className="rehearse-audio"><button disabled={status!=="idle"} onClick={()=>void listen(1)}>Listen</button><button disabled={status!=="idle"} onClick={()=>void listen(.8)}>Listen slowly</button>{status!=="idle"&&<button onClick={()=>{stop();setStatus("idle")}}>Stop</button>}</div>
    <p role="status">{status==="loading"?"Preparing this phrase…":status==="playing"?"Listening…":heard?(quiet?"Now notice what you heard.":"Your turn. The audio has stopped."):"AI model voice · one phrase at a time"}</p>
    {error&&<p role="alert">{error}</p>}
    {mode==="echo"&&<label className="effort-check"><input type="checkbox" disabled={!heard||status!=="idle"} checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{quiet?"I listened and followed the phrase silently.":"After the voice stopped, I repeated the phrase at my own pace."}</label>}
    {mode==="build"&&<div className="rehearse-build"><p>Tap the pieces in the order you heard. You can listen again or reveal the phrase.</p><details><summary>Show the phrase</summary><p lang={language}>{phrase}</p></details><div className="rehearse-answer" aria-label="Your phrase" lang={language}>{order.map((id,i)=><button key={id} aria-label={`Remove ${chunks[id]}`} onClick={()=>{setOrder(items=>items.filter((_,n)=>n!==i));setChecked(false)}}>{chunks[id]}</button>)}{!order.length&&<span>Your phrase will appear here.</span>}</div><div className="rehearse-pieces" aria-label="Phrase pieces" lang={language}>{chunks.map((_,i)=>chunks.length-1-i).map(id=><button key={id} disabled={order.includes(id)} onClick={()=>{setOrder(items=>[...items,id]);setChecked(false)}}>{chunks[id]}</button>)}</div><button disabled={order.length!==chunks.length} onClick={()=>setChecked(true)}>Check phrase</button><button onClick={()=>{setOrder([]);setChecked(false)}}>Start again</button>{checked&&<p role="status">{built?"That’s the phrase. Nicely reconstructed.":"Not quite yet. Tap a piece above to move it, or listen again."}</p>}</div>}
    {mode==="rhythm"&&<div><p>Listen for a pause, a word that stands out, or words that seem to run together. Tap a word near the part you noticed.</p><div className="rehearse-pieces" lang={language}>{words.map((word,i)=><button key={i} aria-pressed={noticed===i} disabled={!heard} onClick={()=>setNoticed(i)}>{word}</button>)}</div><label className="effort-check"><input type="checkbox" disabled={!heard||noticed===null||status!=="idle"} checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{quiet?"I noticed how this part sounded and followed its rhythm silently.":"I tried that short part after the voice stopped."}</label><small>This records what you noticed; it is not a pronunciation score.</small></div>}
    <div className="rehearse-finish"><button className="primary" disabled={!ready||(mode==="build"&&!checked)||status!=="idle"||finished.includes(key)} onClick={finish}>{finished.includes(key)?"Activity complete ✓":"Complete this activity"}</button>{completed&&<p role="status">Rehearsal complete. You can continue to Retell, or try another activity.</p>}</div>
    {!quiet&&<><button onClick={()=>{stop();setStatus("idle");setShowRecorder(value=>!value)}}>{showRecorder?"Close optional recording":"Record myself (optional)"}</button>{showRecorder&&recorder(phrase)}</>}
    {finished.length>=2&&<button disabled={saving||rewarded} onClick={()=>void retry()}>{rewarded?"Extra practice recorded ✓":saving?"Saving…":"Save extra practice · up to 10 XP today"}</button>}
  </section>;
}
