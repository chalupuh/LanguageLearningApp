"use client";
import {capabilities,evidenceFor} from "../lib/learning-evidence";
import type {Activity} from "../lib/journey";
export default function SkillEvidence({events}:{events:Activity[]}){
 return <section className="journey-card"><h2>What can I do with what I hear?</h2><p>Question-level practice evidence. Recognizing a response is different from saying it spontaneously.</p><div className="achievement-grid">{capabilities.map(c=>{const result=evidenceFor(events,c.id);return <article key={c.id}><h3>{c.name}</h3><strong>{result.independent} unfamiliar recordings answered correctly on first listen</strong><p>{result.correct} / {result.total} relevant answers across all attempts</p><small>Repeats count as practice. This is not a CEFR assessment.</small></article>})}</div><a href="https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors" target="_blank" rel="noreferrer">About CEFR descriptors</a></section>;
}
