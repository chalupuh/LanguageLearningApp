"use client";
import {useState} from "react";
type Feedback={score:number;understood:string[];missed:string[];listening_target:string;hint?:string};
export default function HintFeedback({feedback,condition,onReplay}:{feedback:Feedback;condition:string;onReplay:()=>void}){
 const [level,setLevel]=useState(0);
 return <div className="comprehension-result"><div><strong>{feedback.score}%</strong><span>{condition} · AI coaching estimate, not a test grade</span></div><section><h3>You caught</h3><ul>{feedback.understood.map(item=><li key={item}>{item}</li>)}</ul><p>{feedback.missed.length?`${feedback.missed.length} ${feedback.missed.length===1?"detail":"details"} to explore. Try a clue before revealing the explanation.`:"You caught the key ideas. You can still practise a detail."}</p>
 {level===0&&<button onClick={()=>setLevel(1)}>Give me a small hint</button>}{level>=1&&<p role="status"><b>Hint:</b> {feedback.hint||"Listen for what changes between the beginning and the end, and what the speaker needs next."}</p>}
 <button onClick={onReplay}>Listen again before revealing</button>{level<2&&<button onClick={()=>setLevel(2)}>Reveal the explanation</button>}
 {level===2&&<><h3>Listen for next</h3><ul>{feedback.missed.map(item=><li key={item}>{item}</li>)}</ul><p><b>Second-listen target:</b> {feedback.listening_target}</p><small>Edit your summary and check it again if you like. That is supported practice, not a new first-listen result.</small></>}
 </section></div>;
}
