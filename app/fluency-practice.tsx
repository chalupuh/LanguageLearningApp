"use client";
import {useState,type ReactNode} from "react";
import "./fluency-practice.css";
export type FluencyDraft={plan:string;phase:number;gap:string;quiet:boolean;result:string};
export const emptyFluencyDraft:FluencyDraft={plan:"",phase:0,gap:"",quiet:false,result:""};
export function restoreFluencyDraft(value:unknown):FluencyDraft{
 const v=value as Partial<FluencyDraft>|null;if(!v||typeof v!=="object")return {...emptyFluencyDraft};
 const plan=typeof v.plan==="string"?v.plan.slice(0,600):"",gap=typeof v.gap==="string"?v.gap.slice(0,220):"";
 const phase=Number.isInteger(v.phase)&&Number(v.phase)>=0&&Number(v.phase)<=3?Number(v.phase):0;
 return {plan,gap,phase:plan.trim().length<5?0:!gap.trim()&&phase>1?1:phase,quiet:v.quiet===true,result:typeof v.result==="string"?v.result.slice(0,100):""};
}
export default function FluencyPractice({language,onComplete,recorder,draft,onDraft,quick=false}:{language:"fr"|"sv";onComplete:()=>void;recorder:(plan:string)=>ReactNode;draft?:FluencyDraft;onDraft?:(update:(previous:FluencyDraft)=>FluencyDraft)=>void;quick?:boolean}){
 const [local,setLocal]=useState<FluencyDraft>(emptyFluencyDraft),[record,setRecord]=useState(false);
 const state=draft||local,{plan,phase,gap,quiet,result}=state;
 const setField=<K extends keyof FluencyDraft,>(key:K,value:FluencyDraft[K]|((previous:FluencyDraft[K])=>FluencyDraft[K]))=>{const update=(previous:FluencyDraft)=>({...previous,[key]:typeof value==="function"?(value as (p:FluencyDraft[K])=>FluencyDraft[K])(previous[key]):value});if(onDraft)onDraft(update);else setLocal(update)};
 const setPlan=(v:string|((p:string)=>string))=>setField("plan",v),setPhase=(v:number)=>setField("phase",v),setGap=(v:string)=>setField("gap",v),setQuiet=(v:boolean)=>setField("quiet",v),setResult=(v:string)=>setField("result",v);
 const links=language==="fr"?["D’abord…","Ensuite…","Donc…","Mais…","En fait…","Par exemple…","Ce que je veux dire, c’est…","Pour finir…"]:["Först…","Sedan…","Så…","Men…","Till exempel…","Jag menar…","Till sist…"];
 const Container=quick?"section":"details";
 return <Container data-usage-feature="fluency" className="fluency-practice">{quick?<><h2>A quick retell for your husband</h2><p>Your husband asks, “What was it about?” Explain the situation, outcome, or poem’s meaning in one or two sentences. Describe the people as “she,” “he,” or “they”—you do not have to be a character.</p></>:<summary>Say it more smoothly · a short retell rehearsal</summary>}<p>Try it once, notice where you searched for words, then try a linking phrase. Natural pauses are useful. There is no speed grade.</p><label><input type="checkbox" checked={quiet} onChange={e=>{setQuiet(e.target.checked);setRecord(false)}}/>Practise silently today</label>
 <ol><li className={phase>0?"complete":""}>{quick?"Catch the situation":"Plan three ideas"}</li><li className={phase>1?"complete":""}>Try once and notice a gap</li><li className={phase>2?"complete":""}>Bridge the gap and try again</li></ol>
 <label>{quick?"My one- or two-sentence retell":"My three ideas"}<textarea maxLength={600} value={plan} disabled={phase>0} onChange={e=>setPlan(e.target.value)} placeholder={language==="fr"?"Une femme demande… Finalement…":"En kvinna frågar… Sedan…"}/></label>
 {phase===0&&<button disabled={plan.trim().length<5} onClick={()=>setPhase(1)}>{quick?"Try this quick retell":"Use this plan"}</button>}
 {phase===1&&<><p>{quiet?"Follow your summary silently once.":"Say your summary once, at your own pace."}</p><label>Where did I search for words?<textarea value={gap} onChange={e=>setGap(e.target.value)} maxLength={220} placeholder="A word, a transition, or ‘no difficult spot today’"/></label><button disabled={!gap.trim()} onClick={()=>setPhase(2)}>I tried once · work on this gap</button></>}
 {phase>=2&&<><p><b>My focus:</b> {gap}</p><p>Pick a bridge you can use naturally. Practise the difficult short part, then {quiet?"follow":"say"} the whole retell again.</p><div className="fluency-links">{links.map(link=><button key={link} onClick={()=>setPlan(p=>(p+"\n"+link).slice(0,600))} lang={language}>{link}</button>)}</div><p lang={language}>{plan}</p>{phase===2&&<><button onClick={()=>{setResult("That transition felt easier");setPhase(3);onComplete()}}>I tried again · easier this time</button><button onClick={()=>{setResult("Still searching for words");setPhase(3);onComplete()}}>I tried again · still tricky</button></>}{phase===3&&<p role="status">Rehearsal complete ✓ {result}. This self-reflection is not a proficiency score.</p>}</>}
 {!quiet&&phase>0&&<><button onClick={()=>setRecord(v=>!v)}>{record?"Close recording":"Record this attempt (optional)"}</button>{record&&<div key={phase}>{recorder(plan)}</div>}</>}
 {phase>0&&<button onClick={()=>{setPhase(0);setGap("");setResult("");setRecord(false)}}>Start a new practice</button>}
 </Container>;
}
