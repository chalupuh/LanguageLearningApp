"use client";
import type {Passage} from "../content/passages";
export default function LearningPathway({catalog,completed,onPractice}:{catalog:Passage[];completed:string[];onPractice:(id:string)=>void}){
 const groups=[
  {title:"Follow everyday stories",canDo:"Catch the situation, sequence, and useful details.",items:catalog.filter(p=>!p.dialogue&&p.category!=="poetry"&&p.level==="B1")},
  {title:"Handle service surprises",canDo:"Understand a changed table, unavailable item, or payment restriction.",items:catalog.filter(p=>!!p.dialogue)},
  {title:"Follow nuance and imagery",canDo:"Explain an opinion or image in my own words.",items:catalog.filter(p=>p.category==="poetry"||p.level==="B2"||p.level==="B2+")},
 ];
 return <details className="journey-card"><summary>Your French practice pathways</summary><p>These are practice goals, not proficiency gates. You can explore any pathway; completion and XP do not establish your CEFR level.</p><div className="library-grid">{groups.filter(g=>g.items.length).map(g=>{const count=g.items.filter(p=>completed.includes(p.id)).length,next=g.items.find(p=>!completed.includes(p.id))||g.items[0];return <article key={g.title}><h3>{g.title}</h3><p><b>I’m practising:</b> {g.canDo}</p><p>{count}/{g.items.length} loops completed</p><button onClick={()=>onPractice(next.id)}>{count===g.items.length?"Revisit a lesson":"Continue pathway"}</button></article>})}</div><p>Try a fresh announcement or an original-media excerpt to check transfer beyond familiar lessons.</p></details>;
}
