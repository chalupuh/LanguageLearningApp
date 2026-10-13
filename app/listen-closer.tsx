"use client";
import {useState,type ReactNode} from "react";
import {highlightedParts} from "../lib/closer-highlights";
import "./listen-closer.css";
type Props={text:string;language:"fr"|"sv";completed:boolean;onComplete:(reflection:string)=>void;player?:ReactNode;source?:string;roles?:string[];revealed?:boolean;onReveal?:(value:boolean)=>void;highlights?:string[];onRemove?:(phrase:string)=>void;onSave?:(phrase:string)=>void;saved?:string[];audioUnavailable?:boolean};
export default function ListenCloser({text,language,completed,onComplete,player,source,roles,revealed,onReveal,highlights=[],onRemove,onSave,saved=[],audioUnavailable=false}:Props){
 const [localReveal,setLocalReveal]=useState(false),open=revealed??localReveal;
 const reveal=(value:boolean)=>{setLocalReveal(value);onReveal?.(value)};
 return <section className="listen-closer closer-simple" aria-label="Listen closer" data-phrase-source={source}>
  <p className="closer-purpose">Listen to the passage without the words. Then show the transcript and highlight anything you missed or still find confusing.</p>
  {player}
  <button className="closer-reveal" aria-expanded={open} aria-controls="closer-transcript" onClick={()=>reveal(!open)}>{open?"Hide transcript":"Show transcript"}</button>
  {open&&<div id="closer-transcript" className="full-transcript" lang={language}>{text.split("\n").filter(Boolean).map((line,index)=><p className={roles?.[index]?"closer-line has-role":"closer-line"} key={index}>{roles?.[index]&&<span>{roles[index]}</span>}<span className="closer-line-text">{highlightedParts(line,highlights).map((part,i)=>part.marked?<mark key={i} data-study-text>{part.text}</mark>:part.text)}</span></p>)}</div>}
  {open&&<p className="closer-selection-help">Select words in the transcript, then choose “Mark for next time” or “Save phrase.” If nothing was confusing, you can simply continue.</p>}
  {open&&highlights.length>0&&<section className="closer-kept" aria-label="Words marked for next time"><h2>For next time</h2><p>These highlights stay with this lesson. Save a phrase to add it to your review notebook.</p>{highlights.map(phrase=><div key={phrase}><span lang={language} data-study-text>{phrase}</span>{onSave&&<button disabled={saved.includes(phrase)} onClick={()=>onSave(phrase)}>{saved.includes(phrase)?"Saved ✓":"Save phrase"}</button>}{onRemove&&<button aria-label={`Remove highlight: ${phrase}`} onClick={()=>onRemove(phrase)}>×</button>}</div>)}</section>}
  {audioUnavailable&&<p role="status">Audio is unavailable. You can review the transcript now and try listening later.</p>}
  <button className="closer-finish-simple" disabled={!open&&!completed} onClick={()=>onComplete(audioUnavailable||highlights.length?"New expression":"I understood it")}>Continue to Retell practice →</button>
  {completed&&<p className="closer-complete" role="status">Your earlier review is complete ✓ Your highlights are kept.</p>}
 </section>;
}
