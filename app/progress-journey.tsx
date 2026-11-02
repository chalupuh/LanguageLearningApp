"use client";
import type { CSSProperties } from "react";
import "./progress-journey.css";
import {rewards} from "../lib/journey";

// A fish-shaped progress gauge, filled bottom-to-top using the same XP scale
// as the tower. The parent supplies the accessible progressbar semantics.
function SwedishFish({percent}:{percent:number}) {
  const silhouette="M76 116 C115 60 212 50 272 93 L325 61 Q332 59 330 68 L314 128 L330 188 Q332 197 325 195 L272 163 C212 206 115 196 76 140 L57 133 Q48 128 57 123 Z";
  return <svg className="swedish-fish" viewBox="35 35 310 190" aria-hidden="true" focusable="false" style={{"--tower-fill":`${percent}%`} as CSSProperties}>
    <path d={silhouette} fill="#eae2ec"/>
    <path className="fish-color" d={silhouette} fill="#df678b"/>
    <path d={silhouette} fill="none" stroke="#a95f85" strokeWidth="3"/>
    <path d="M125 92 Q146 128 125 164 M190 94 Q207 82 223 94 M190 162 Q207 174 223 162 M283 111 L311 81 M283 145 L311 175" fill="none" stroke="#a95f85" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="102" cy="116" r="5" fill="#74485e"/>
    <path d="M78 142 Q91 150 101 143" fill="none" stroke="#74485e" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}

function SpanishBubble({percent}:{percent:number}) {
  const bubble="M56 55 C56 29 82 15 121 15 H272 C311 15 334 34 334 67 V145 C334 176 308 193 271 193 H145 L77 229 C69 233 62 225 66 217 L81 187 C65 178 56 164 56 145 Z";
  return <svg className="spanish-bubble" viewBox="35 0 320 245" aria-hidden="true" focusable="false" style={{"--tower-fill":`${percent}%`} as CSSProperties}>
    <path d={bubble} className="bubble-base"/>
    <path d={bubble} className="bubble-color"/>
    <path d={bubble} className="bubble-outline"/>
    <text x="195" y="126" textAnchor="middle" className="bubble-word">Hola</text>
    <path d="M289 45 Q306 54 307 72" className="bubble-shine"/>
  </svg>;
}

const PRACTICE_GOAL = 5000;
export function practiceMilestone(xp: number) {
  const total = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return { total, percent: Math.min(100, total / PRACTICE_GOAL * 100), remaining: Math.max(0, PRACTICE_GOAL - total) };
}
export default function ProgressJourney({ language="fr", xp, frenchXp=0, swedishXp=0, spanishXp=0, completed, saved, days, speaking, onPractice }: { language?:"fr"|"sv"|"es"; xp: number; frenchXp?:number; swedishXp?:number; spanishXp?:number; completed: number; saved: number; days: number; speaking: number; onPractice: () => void }) {
  const swedish=language==="sv",spanish=language==="es";
  const languageName=swedish?"Swedish":spanish?"Spanish":"French";
  const motifs=swedish?["🐟","☕","♡","🐟","♡","☕","🐟","☕","♡"]:spanish?["💬","☀️","♡","💬","♡","☀️","💬","☀️","♡"]:["🥐", "☕", "🧸", "🥐", "🧸", "☕", "🥐", "☕", "🧸"];
  const heading=swedish?["Lite i taget,","your fish takes color."]:spanish?["Poco a poco,","your Spanish finds its voice."]:["Petit à petit,","Paris takes color."];
  const stats=spanish?["💬","☀️","📖","♡"]:["🥐","☕","🧸","♡"];
  const { total, percent, remaining } = practiceMilestone(xp);
  return <section className={`progress-journey journey-${language}`} aria-labelledby="journey-title">
    <div className="paris-confetti" aria-hidden="true">{motifs.map((motif, index) => <span key={index}>{motif}</span>)}</div>
    <header className="journey-heading"><p className="eyebrow">Your {languageName} journey</p><h1 id="journey-title">{heading[0]}<br/><em>{heading[1]}</em></h1><p>Every attentive listen, every phrase you keep, every time you try again. This is what showing up looks like.</p></header>
    <div className="journey-main"><figure className="tower-postcard"><figcaption><span className="eyebrow">Your practice milestone</span><strong>{swedish?"A little Swedish fish":spanish?"A growing Hola":"A little more color in Paris"}</strong><small>French + Swedish + Spanish XP · every practice counts.</small></figcaption><div className="tower-scene" role="progressbar" aria-label="Practice XP milestone" aria-valuemin={0} aria-valuemax={PRACTICE_GOAL} aria-valuenow={Math.min(total,PRACTICE_GOAL)} aria-valuetext={`${total} XP; ${Math.round(percent)} percent of the ${PRACTICE_GOAL} XP practice milestone, not a language-level assessment`}>{swedish?<SwedishFish percent={percent}/>:spanish?<SpanishBubble percent={percent}/>:<div className="eiffel-tower" style={{ "--tower-fill": `${percent}%` } as CSSProperties}><div className="tower-color"/><div className="tower-lattice"/><i className="tower-deck upper"/><i className="tower-deck lower"/><i className="tower-arch"/></div>}<span className="tower-ground"/></div><div className="tower-caption"><strong>{Math.round(percent)}%</strong><span>of your practice milestone<br/>5000 XP · not a fluency estimate</span></div></figure>
    <div className="journey-details"><article className="journey-xp"><p className="eyebrow">Your practice across three languages</p><strong>{total.toLocaleString()} <small>XP</small></strong><p className="xp-breakdown"><span>French <b>{frenchXp.toLocaleString()} XP</b></span><span>Swedish <b>{swedishXp.toLocaleString()} XP</b></span><span>Spanish <b>{spanishXp.toLocaleString()} XP</b></span></p><p>{remaining ? `${remaining.toLocaleString()} XP to your 5,000-XP practice milestone.` : "Your first 5,000-XP milestone is complete. Keep exploring new speakers and topics."}</p><div className="journey-milestones">{rewards.map(reward=>reward.xp).map(target => <span key={target} className={total >= target ? "reached" : ""}>{total >= target ? "✓ " : ""}{target.toLocaleString()} XP</span>)}</div><small>5,000 XP celebrates consistent practice, not a language level. French, Swedish, and Spanish XP are recorded separately and added together for this display.</small></article>
    <div className="journey-stats"><article><span aria-hidden="true">{stats[0]}</span><strong>{completed}</strong><small>new loops completed</small></article><article><span aria-hidden="true">{stats[1]}</span><strong>{days}</strong><small>practice days</small></article><article><span aria-hidden="true">{stats[2]}</span><strong>{saved}</strong><small>phrase reviews</small></article><article><span aria-hidden="true">{stats[3]}</span><strong>{speaking}</strong><small>extra practices</small></article></div>
    <article className="b2-evidence"><p className="eyebrow">Beyond the numbers</p><h2>Progress beyond XP.</h2><p>XP celebrates the time and effort you put in. Notice the everyday changes too:</p><ul><li>Recognize more words and details without reading.</li><li>Need fewer replays to understand a familiar situation.</li><li>Find it easier to respond in your own words.</li></ul><button onClick={onPractice}>Back to today’s practice →</button></article></div></div>
  </section>;
}
