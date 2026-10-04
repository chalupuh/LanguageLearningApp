"use client";
import {details,type Activity} from "../lib/journey";
const capabilities=[
 {name:"Catch a time or price",match:/delay|closing|service|sv-butik|sv-tag|priset/,descriptor:"Understanding announcements and instructions"},
 {name:"Follow a place or platform change",match:/platform|gate|exit|sv-tag|vagen/,descriptor:"Understanding announcements and instructions"},
 {name:"Understand an unavailable item",match:/milk|slut|rupture/,descriptor:"Understanding an interlocutor"},
 {name:"Handle payment or a table change",match:/cash|table|checkouts|paiement|deplacer/,descriptor:"Obtaining goods and services"},
 {name:"Ask for clarification",match:/repeat|hjalp/,descriptor:"Asking for clarification"},
];
export default function SkillEvidence({events}:{events:Activity[]}){
 const attempts=events.filter(e=>e.kind==="announcement-attempt"||e.kind==="checkpoint"||(e.kind==="announcement"&&!events.some(a=>a.kind==="announcement-attempt"&&a.source===e.source)));
 return <section className="journey-card"><h2>What can I do with what I hear?</h2><p>Evidence from your practice, not a proficiency certificate. These activities are organized around CEFR listening and interaction areas.</p><div className="achievement-grid">{capabilities.map(c=>{const relevant=attempts.filter(e=>c.match.test(e.source)),correct=relevant.reduce((n,e)=>n+(details(e).skills||[]).filter((s:any)=>s.correct).length,0),total=relevant.reduce((n,e)=>n+(details(e).skills||[]).length,0);return <article key={c.name}><h3>{c.name}</h3><strong>{relevant.length?`${correct} / ${total} check answers correct` :"No check evidence yet"}</strong><p>{relevant.length} attempts · {c.descriptor}</p><small>Repeated and supported attempts count as practice, not mastery.</small></article>})}</div><a href="https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors" target="_blank" rel="noreferrer">About the CEFR descriptors</a></section>;
}
