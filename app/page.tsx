"use client";
import { useEffect, useRef, useState } from "react";

const waves=[18,28,15,36,22,44,29,53,34,23,48,31,56,38,26,46,32,52,40,24,35,47,30,42,20,34,25,45,29,38,19,28,16,24,13];
const labels=[{name:"First listen",sub:"Catch the big picture"},{name:"Decode",sub:"Find what you missed"},{name:"Shadow",sub:"Match the speaker"},{name:"Retell",sub:"Make it your own"}];
const sampleFrench="Ce matin, j’étais tellement à la bourre que j’ai même pas eu le temps de prendre un café chez moi. Du coup, je me suis arrêtée dans ce petit café près du métro. Il y avait un monde fou, mais le serveur était super sympa. Il m’a préparé mon café en deux minutes, et finalement, je suis arrivée juste à temps.";

function getYouTubeId(value:string){
 try{
  const url=new URL(value.trim());
  if(url.hostname==="youtu.be")return url.pathname.slice(1).split("/")[0];
  if(url.hostname.endsWith("youtube.com")){
   if(url.pathname==="/watch")return url.searchParams.get("v");
   const match=url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
   return match?.[1]||null;
  }
 }catch{return null}
 return null;
}

function Player({playing,onToggle,progress,setProgress}:{playing:boolean;onToggle:()=>void;progress:number;setProgress:(v:number)=>void}){
  return <div className="audio-card"><div className="audio-topline"><div className="speaker"><span className="speaker-photo">L</span><div><strong>Léa, 29</strong><small>Conversation · Paris · voiced sample</small></div></div><span className="speed">French audio</span></div><div className="player"><button className="play" onClick={onToggle} aria-label={playing?"Pause audio":"Play audio"}>{playing?"Ⅱ":"▶"}</button><div className="wave-wrap"><div className="wave" aria-label="Audio progress">{waves.map((h,i)=><i key={i} style={{height:h,background:i/waves.length*100<=progress?"var(--ink)":"var(--line-strong)"}}/>)}</div><div className="time"><span>0:{String(Math.round(47*progress/100)).padStart(2,"0")}</span><span>0:47</span></div></div><button className="replay" onClick={()=>{window.speechSynthesis.cancel();setProgress(0);setTimeout(onToggle,50)}} aria-label="Replay audio">↶<small>all</small></button></div></div>
}

export default function Home(){
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[progress,setProgress]=useState(12),[text,setText]=useState(""),[recording,setRecording]=useState(false),[done,setDone]=useState(false);
 const [youtubeUrl,setYoutubeUrl]=useState(""),[videoId,setVideoId]=useState<string|null>(null),[urlError,setUrlError]=useState("");
 useEffect(()=>{if(!playing)return;const t=window.setInterval(()=>setProgress(v=>{if(v>=100){setPlaying(false);return 0}return v+.35}),120);return()=>clearInterval(t)},[playing]);
 useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);
 const toggleSample=()=>{if(playing){window.speechSynthesis.pause();setPlaying(false);return}if(window.speechSynthesis.paused){window.speechSynthesis.resume();setPlaying(true);return}const utterance=new SpeechSynthesisUtterance(sampleFrench);utterance.lang="fr-FR";utterance.rate=.92;utterance.onend=()=>{setPlaying(false);setProgress(100)};utterance.onerror=()=>setPlaying(false);window.speechSynthesis.speak(utterance);setProgress(0);setPlaying(true)};
 const advance=()=>{window.speechSynthesis.cancel();setPlaying(false);setText("");if(step<3)setStep(step+1);else setDone(true)};
 const loadVideo=()=>{const id=getYouTubeId(youtubeUrl);if(!id){setUrlError("Paste a valid YouTube video, Short, or youtu.be link.");return}setVideoId(id);setUrlError("")};
 return <main className="app-shell"><header className="topbar"><a className="brand" href="#"><span className="brand-mark">à</span><span>À l’Oreille</span></a><nav><a className="active" href="#practice">Practice</a><a href="#library">Library</a><a href="#progress">Progress</a></nav><div className="header-actions"><div className="streak"><span>◆</span> 12 day streak</div><button className="avatar">N</button></div></header>
 <div className="workspace"><aside className="session-rail"><p className="eyebrow">Today’s session</p><h2>Un café<br/>à emporter</h2><div className="meta"><span>B1–B2</span><span>Parisian French</span></div><ol className="steps">{labels.map((l,i)=><li key={l.name} className={i===step?"current":i<step?"complete":""}><span className="step-icon">{i<step?"✓":i+1}</span><div><strong>{l.name}</strong><small>{l.sub}</small></div></li>)}</ol><div className="session-stats"><div><strong>8</strong><span>min</span></div><div><strong>0:47</strong><span>clip</span></div><div><strong>{step+1}/4</strong><span>steps</span></div></div></aside>
 <section className="practice" id="practice">{done?<div className="completion"><div className="completion-mark">✓</div><p className="stage-label">Session complete</p><h1>Bien joué, Nikki.</h1><p className="intro">You moved this clip from passive recognition into language you can use. It’ll return in three days for a subtitle-free check.</p><div className="score-grid"><div><strong>78%</strong><span>first-listen comprehension</span></div><div><strong>3</strong><span>phrases activated</span></div><div><strong>0:42</strong><span>spoken retell</span></div></div><button className="primary restart" onClick={()=>{setDone(false);setStep(0);setProgress(0)}}>Return to practice <span>→</span></button></div>:<>
 <div className="stage-label"><span>0{step+1}</span> {labels[step].name}</div>
 <h1>{["What did you catch?","Let’s close the gaps.","Find Léa’s rhythm.","Now make it yours."][step]}</h1>
 <p className="intro">{["Listen at full speed. Don’t worry about every word—focus on the situation and the speaker’s main point.","Compare what you heard with the real phrasing. Mark why anything slipped past your ear.","Speak along with Léa. Aim for her timing and melody—not a perfect accent.","Retell the situation naturally in French, without copying the transcript."][step]}</p>
 {step===0&&<div className="youtube-import"><div className="import-heading"><div><strong>Bring your own French</strong><span>Paste any public YouTube video</span></div>{videoId&&<button onClick={()=>{setVideoId(null);setYoutubeUrl("")}}>Change video</button>}</div>{!videoId&&<><div className="url-row"><span className="youtube-badge">▶</span><input type="url" value={youtubeUrl} onChange={e=>{setYoutubeUrl(e.target.value);setUrlError("")}} onKeyDown={e=>e.key==="Enter"&&loadVideo()} placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube URL"/><button onClick={loadVideo}>Load video</button></div>{urlError&&<p className="url-error" role="alert">{urlError}</p>}<p className="import-help">Choose a short segment you can replay. Captions stay off during your first listen.</p></>}</div>}
 {step===0&&videoId?<YouTubePlayer videoId={videoId}/>:<Player playing={playing} onToggle={toggleSample} progress={progress} setProgress={setProgress}/>} 
 {step===0&&<><div className="no-transcript standalone"><span>◉</span> Transcript hidden for your first listen</div><Response label="Summarize what you understood" hint="English or French is fine" text={text} setText={setText} placeholder="I think they’re talking about…"/></>}
 {step>0&&(videoId?<><div className="source-reminder"><span>Imported video</span> Replay the same source as you work through this step.</div><YouTubePlayer videoId={videoId}/></>:<Player playing={playing} onToggle={toggleSample} progress={progress} setProgress={setProgress}/>)} 
 {step===1&&<div className="decode-card"><p><button className="line-play">▶</button> « Ce matin, j’étais tellement à la bourre que j’ai même pas eu le temps de prendre un café chez moi. »</p><div className="translation">This morning, I was running so late that I didn’t even have time to make coffee at home.</div><div className="diagnosis"><span>What made this difficult?</span>{["New expression","Speech too fast","Sounded different","I understood it"].map(x=><button key={x} onClick={(e)=>e.currentTarget.classList.toggle("selected")}>{x}</button>)}</div><div className="phrase-note"><strong>à la bourre</strong><span>informal · to be running late</span><button>＋ Save phrase</button></div></div>}
 {step===2&&<div className="shadow-card"><div className="shadow-row"><span>Original</span><div className="mini-wave">{waves.slice(0,20).map((h,i)=><i key={i} style={{height:h/2}}/>)}</div></div><div className="shadow-row"><span>Your voice</span><div className="empty-wave">Record, listen back, then try once more.</div></div><VoiceRecorder label="Start shadowing" recording={recording} setRecording={setRecording}/></div>}
 {step===3&&<Response label="Retell the story in French" hint="Write it or record 30–60 seconds" text={text} setText={setText} placeholder="Ce matin, Léa était…" allowVoice/>}
 <div className="bottom-actions"><button className="secondary" onClick={()=>step>0&&setStep(step-1)}>{step?"← Back":"Skip for now"}</button><button className="primary" disabled={step===0&&!text.trim()} onClick={advance}>{["Check my understanding","Continue to shadowing","Continue to retell","Finish session"][step]} <span>→</span></button></div></>}
 </section></div></main>
}

function YouTubePlayer({videoId}:{videoId:string}){return <div className="youtube-player"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?cc_load_policy=0&rel=0`} title="Imported YouTube video for French listening practice" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div>}

function Response({label,hint,text,setText,placeholder,allowVoice=false}:{label:string;hint:string;text:string;setText:(v:string)=>void;placeholder:string;allowVoice?:boolean}){const [recording,setRecording]=useState(false);return <div className="response-block"><label><strong>{label}</strong><span>{hint}</span></label><textarea value={text} onChange={e=>setText(e.target.value)} placeholder={placeholder} maxLength={500}/><div className="response-footer"><span>{text.length} / 500</span>{allowVoice&&<span className="voice-hint">or use the recorder below</span>}</div>{allowVoice&&<VoiceRecorder label="Record my retell" recording={recording} setRecording={setRecording}/>}</div>}

function VoiceRecorder({label,recording,setRecording}:{label:string;recording:boolean;setRecording:(v:boolean)=>void}){
 const recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]);const [audioUrl,setAudioUrl]=useState(""),[error,setError]=useState("");
 const toggle=async()=>{if(recording){recorder.current?.stop();return}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks.current=[];const next=new MediaRecorder(stream);recorder.current=next;next.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};next.onstop=()=>{setAudioUrl(URL.createObjectURL(new Blob(chunks.current,{type:next.mimeType})));stream.getTracks().forEach(t=>t.stop());setRecording(false)};next.start();setError("");setRecording(true)}catch{setError("Microphone access is needed to record your voice.")}};
 return <div className="recorder"><button className={recording?"record active":"record"} onClick={toggle}>{recording?"■ Stop recording":`● ${label}`}</button>{audioUrl&&<audio controls src={audioUrl} aria-label="Your recorded French"/>}{error&&<p className="record-error">{error}</p>}</div>
}
