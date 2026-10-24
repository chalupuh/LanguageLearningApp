"use client";
import {useId,useState} from "react";

type Feedback={score:number;understood:string[];missed:string[];listening_target:string;hint?:string};

export default function HintFeedback({feedback,condition,onReplay}:{feedback:Feedback;condition:string;onReplay:()=>void}){
 const [hintOpen,setHintOpen]=useState(false);
 const [explanationOpen,setExplanationOpen]=useState(false);
 const id=useId();
 return <div className="comprehension-result coaching-feedback">
  <div className="coaching-score"><strong>{feedback.score}%</strong><span>{condition}<br/>AI coaching estimate, not a test grade</span></div>
  <section className="coaching-content" aria-label="Listening feedback">
   <div className="coaching-caught"><h3>You caught</h3><ul>{feedback.understood.map(item=><li key={item}>{item}</li>)}</ul></div>
   <div className="coaching-practice">
    <h4>{feedback.missed.length?`${feedback.missed.length} ${feedback.missed.length===1?"detail":"details"} to explore`:"Keep listening"}</h4>
    <p className="coaching-guidance">{feedback.missed.length?"Start with a hint, then listen again. Reveal the explanation whenever you’re ready.":"You caught the key ideas. Try another listen to notice a little more."}</p>
    <div className="coaching-actions">
     <button type="button" className="coaching-button coaching-hint-button" aria-expanded={hintOpen} aria-controls={`${id}-hint`} onClick={()=>setHintOpen(!hintOpen)}><span aria-hidden="true">✧</span>{hintOpen?"Hide hint":"Show hint"}</button>
     <button type="button" className="coaching-button coaching-replay-button" onClick={onReplay}><span aria-hidden="true">↻</span>Listen again</button>
    </div>
    <div id={`${id}-hint`} hidden={!hintOpen} className="coaching-hint"><h3>A small hint</h3><p>{feedback.hint||"Listen for what changes between the beginning and the end, and what the speaker needs next."}</p></div>
    <div className="coaching-reveal-row">
     <button type="button" className="coaching-button coaching-reveal-button" aria-expanded={explanationOpen} aria-controls={`${id}-explanation`} onClick={()=>setExplanationOpen(!explanationOpen)}>{explanationOpen?"Hide explanation":"Reveal explanation"}<span aria-hidden="true">{explanationOpen?"−":"+"}</span></button>
    </div>
    <div id={`${id}-explanation`} hidden={!explanationOpen} className="coaching-explanation">
     {feedback.missed.length>0&&<><h3>Listen for next</h3><ul>{feedback.missed.map(item=><li key={item}>{item}</li>)}</ul></>}
     <div className="coaching-target"><h3>Your next listen</h3><p>{feedback.listening_target}</p></div>
     <p className="coaching-note">Edit your summary and check it again when you’re ready. This is supported practice, not a new first-listen result.</p>
    </div>
   </div>
  </section>
 </div>;
}
