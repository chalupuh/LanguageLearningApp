"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {parseHandsFreeCommand} from "../lib/hands-free-commands";
import "./hands-free-session.css";

export type HandsFreeItem={id:string;title:string;text:string;language:"fr"|"sv"|"es";offline?:boolean};
type Props={items:HandsFreeItem[];loadAudio:(item:HandsFreeItem)=>Promise<Blob>;onExit:()=>void;storageKey?:string};
type Phase="setup"|"playing"|"paused"|"finished";
type SavedSession={index:number;rate:number;minutes:number}|null;
type SpeechResultEvent={results?:{[key:number]:{[key:number]:{transcript?:string}}}};
type SpeechRecognizer={lang:string;continuous:boolean;interimResults:boolean;onresult?:(event:SpeechResultEvent)=>void;onerror?:()=>void;onend?:()=>void;start:()=>void;stop:()=>void};
type SpeechRecognizerConstructor=new()=>SpeechRecognizer;

const commandWords=["repeat","slower","normal speed","next","back","pause","continue","help","stop session"];
const languageName={fr:"French",sv:"Swedish",es:"Spanish"};

function say(message:string){
 if(typeof window==="undefined"||!("speechSynthesis" in window))return;
 window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(message);voice.lang="en-US";window.speechSynthesis.speak(voice);
}

function savedSession(storageKey:string,maximum:number):SavedSession{
 if(typeof window==="undefined")return null;
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||"null");return saved&&Number.isInteger(saved.index)?{index:Math.min(saved.index,Math.max(0,maximum-1)),rate:saved.rate===.8?.8:1,minutes:[5,10,15].includes(saved.minutes)?saved.minutes:15}:null}catch{return null}
}

export default function HandsFreeSession({items,loadAudio,onExit,storageKey="hands-free-session-v1"}:Props){
 const restored=useRef(savedSession(storageKey,items.length)).current;
 const [phase,setPhase]=useState<Phase>("setup"),[minutes,setMinutes]=useState(restored?.minutes||15),[rate,setRate]=useState(restored?.rate||1),[index,setIndex]=useState(restored?.index||0),[status,setStatus]=useState(restored?"A parked session is ready to resume.":"Set up while parked."),[error,setError]=useState(""),[commandOpen,setCommandOpen]=useState(false),[preparing,setPreparing]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null),url=useRef(""),timer=useRef<ReturnType<typeof setTimeout>|null>(null),generation=useRef(0);
 const prepared=useRef(new Map<string,Blob>());
 const commandRecognition=useRef<SpeechRecognizer|null>(null);
 const queue=useMemo(()=>items.slice(0,minutes===5?2:minutes===10?4:6),[items,minutes]);
 const current=queue[index];
 const cleanupAudio=useCallback(()=>{generation.current++;if(timer.current)clearTimeout(timer.current);timer.current=null;audio.current?.pause();audio.current=null;if(url.current)URL.revokeObjectURL(url.current);url.current=""},[]);

 const pause=useCallback((announce=true)=>{audio.current?.pause();setPhase("paused");setStatus("Paused. Use Continue when you are ready.");if(announce)say("Paused.")},[]);
 const finish=useCallback(()=>{cleanupAudio();setPhase("finished");setStatus("Session stopped. Review while parked.");say("Session stopped. Review when parked.")},[cleanupAudio]);
 // The end-of-track callback intentionally re-enters this function for auto-advance.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 async function playIndex(next:number,announce=true){
  const item=queue[next];if(!item){finish();return}
  cleanupAudio();const attempt=generation.current;setIndex(next);setError("");setStatus(`Preparing ${item.title}…`);
  try{const blob=prepared.current.get(item.id)||await loadAudio(item);if(attempt!==generation.current)return;if(!blob.size||!blob.type.startsWith("audio/"))throw Error("invalid audio");
   url.current=URL.createObjectURL(blob);const player=new Audio(url.current);audio.current=player;player.preload="auto";player.playbackRate=rate;player.preservesPitch=true;
   player.onended=()=>{setStatus("Next item in three seconds.");say("Next item in three seconds.");timer.current=setTimeout(()=>void playIndex(next+1),3000)};
   player.onerror=()=>{setError("This item could not play. The session is paused.");pause(false)};
   if(announce)say(`${item.title}.`);await player.play();setPhase("playing");setStatus(`Playing ${item.title}`);
  }catch{if(attempt===generation.current){setError("Audio is unavailable. Continue in listening-only mode when the item is available.");pause(false)}}
 }
 const resume=useCallback(async()=>{if(audio.current){audio.current.playbackRate=rate;try{await audio.current.play();setPhase("playing");setStatus(`Playing ${current?.title||"session"}`);say("Continuing.")}catch{setError("Playback could not resume.")}}else void playIndex(index)},[current,index,playIndex,rate]);
 const next=useCallback(()=>void playIndex(index+1),[index,playIndex]);
 const back=useCallback(()=>void playIndex(Math.max(0,index-1)),[index,playIndex]);
 const repeat=useCallback(()=>{if(audio.current){audio.current.currentTime=0;void audio.current.play();setPhase("playing");say("Repeating.")}else void playIndex(index)},[index,playIndex]);
 const changeRate=useCallback((nextRate:number)=>{setRate(nextRate);if(audio.current)audio.current.playbackRate=nextRate;say(nextRate<1?"Slower speed.":"Normal speed.")},[]);
 const handleCommand=useCallback((raw:string)=>{const command=parseHandsFreeCommand(raw);setCommandOpen(false);
  if(command==="stop-session"){finish();return}if(command==="repeat"){repeat();return}if(command==="slower"){changeRate(.8);return}if(command==="normal-speed"){changeRate(1);return}if(command==="next"){next();return}if(command==="back"){back();return}if(command==="pause"){pause();return}if(command==="continue"){void resume();return}if(command==="help"){pause(false);say(`Say ${commandWords.join(", ")}.`);return}pause(false);setError("Command not recognized. The session was paused for safety.");say("I did not understand. The session is paused.")},[back,changeRate,finish,next,pause,repeat,resume]);
 const start=useCallback(async()=>{if(preparing)return;setPreparing(true);setError("");setStatus("Checking the whole queue before departure…");prepared.current.clear();try{for(const item of queue){const blob=await loadAudio(item);if(!blob.size||!blob.type.startsWith("audio/"))throw Error("invalid audio");prepared.current.set(item.id,blob)}setStatus("Queue ready without another network request.");await playIndex(Math.min(index,queue.length-1))}catch{prepared.current.clear();setError("The full queue could not be prepared. Stay parked, check the connection, and try again.");setStatus("The session has not started.")}finally{setPreparing(false)}},[index,loadAudio,playIndex,preparing,queue]);
 const listenForCommand=useCallback(()=>{setError("");const speechWindow=window as unknown as {SpeechRecognition?:SpeechRecognizerConstructor;webkitSpeechRecognition?:SpeechRecognizerConstructor};const Recognition=speechWindow.SpeechRecognition||speechWindow.webkitSpeechRecognition;
  if(!Recognition){setError("Voice commands are not available in this browser. Use headset or lock-screen media controls.");return}
  const recognition=new Recognition();commandRecognition.current=recognition;recognition.lang="en-US";recognition.continuous=false;recognition.interimResults=false;setCommandOpen(true);say("Listening for one command.");
  recognition.onresult=(event:SpeechResultEvent)=>handleCommand(String(event.results?.[0]?.[0]?.transcript||""));recognition.onerror=()=>{setCommandOpen(false);pause(false);setError("Command listening failed. The session is paused.")};recognition.onend=()=>setCommandOpen(false);recognition.start();
 },[handleCommand,pause]);

 useEffect(()=>()=>{commandRecognition.current?.stop();cleanupAudio()},[cleanupAudio]);
 useEffect(()=>{if(phase!=="setup")localStorage.setItem(storageKey,JSON.stringify({index,rate,minutes,updatedAt:Date.now()}))},[index,minutes,phase,rate,storageKey]);
 useEffect(()=>{if(!("mediaSession" in navigator))return;const handlers:{[key:string]:()=>void}={play:()=>void resume(),pause:()=>pause(),nexttrack:next,previoustrack:back,stop:finish};for(const [action,handler] of Object.entries(handlers)){try{navigator.mediaSession.setActionHandler(action as MediaSessionAction,handler)}catch{/* unsupported media action */}}return()=>{for(const action of Object.keys(handlers)){try{navigator.mediaSession.setActionHandler(action as MediaSessionAction,null)}catch{/* unsupported media action */}}}},[back,finish,next,pause,resume]);
 useEffect(()=>{if("mediaSession" in navigator&&current)navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:`À l’Oreille · ${languageName[current.language]}`,album:"Hands-free session"})},[current]);

 if(!items.length)return <section className="hands-free-shell"><h1>Hands-free session</h1><p>No bundled listening activities are available yet.</p><button onClick={onExit}>Back to Today</button></section>;
 return <section className={`hands-free-shell ${phase!=="setup"?"hands-free-active":""}`} aria-labelledby="hands-free-title">
  {phase==="setup"?<><p className="eyebrow">Set up while parked</p><h1 id="hands-free-title">Hands-free listening</h1><p className="hands-free-lead">Choose the session before moving. Once started, use your headset, lock-screen, or car media controls. Stop whenever this becomes distracting.</p>
   <div className="hands-free-warning" role="note"><strong>Safety first</strong><p>This is a learning mode, not a driving aid. Follow local laws. Do not read or operate the screen while moving.</p></div>
   <fieldset><legend>Session length</legend><div className="hands-free-options">{[5,10,15].map(value=><button key={value} aria-pressed={minutes===value} onClick={()=>setMinutes(value)}>{value} minutes</button>)}</div></fieldset>
   <fieldset><legend>Playback speed</legend><div className="hands-free-options"><button aria-pressed={rate===.8} onClick={()=>setRate(.8)}>Slower</button><button aria-pressed={rate===1} onClick={()=>setRate(1)}>Normal</button></div></fieldset>
   <p>{queue.length} bundled activities queued · the complete queue will be prepared before playback starts</p>{error&&<p className="hands-free-error" role="alert">{error}</p>}<button className="hands-free-start" disabled={preparing} onClick={()=>void start()}>{preparing?"Preparing the full queue…":"Prepare and start session"}</button><button className="hands-free-exit" disabled={preparing} onClick={onExit}>Cancel</button></>:
   <><p className="eyebrow">Minimal-attention mode</p><h1 id="hands-free-title">{phase==="finished"?"Session complete":current?.title}</h1><p className="hands-free-status" role="status">{status}</p>{error&&<p className="hands-free-error" role="alert">{error}</p>}
    {phase!=="finished"&&<><div className="hands-free-progress" aria-label={`Item ${index+1} of ${queue.length}`}><span style={{width:`${((index+1)/queue.length)*100}%`}}/></div><p>{index+1} of {queue.length} · {rate===.8?"slower":"normal"} speed</p>
     <div className="hands-free-primary-controls"><button onClick={phase==="playing"?()=>pause():()=>void resume()}>{phase==="playing"?"Pause":"Continue"}</button><button onClick={repeat}>Repeat</button></div><div className="hands-free-secondary-controls"><button onClick={back}>Back</button><button onClick={next}>Next</button><button onClick={finish}>Stop session</button></div>
     <button className="hands-free-command" disabled={commandOpen} onClick={listenForCommand}>{commandOpen?"Listening for one command…":"Say one command"}</button><p className="hands-free-command-help">repeat · slower · normal speed · next · back · pause · continue · help · stop session</p></>}
    {phase==="finished"&&<><p>No lesson completion or XP was awarded from playback. Review detailed practice when parked.</p><button className="hands-free-start" onClick={()=>{setIndex(0);setPhase("setup");setStatus("Set up while parked.")}}>Set up another session</button></>}<button className="hands-free-exit" onClick={onExit}>Back to Today</button></>}
 </section>;
}
