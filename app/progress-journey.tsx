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

const PRACTICE_GOAL = 5000;
export function practiceMilestone(xp: number) {
  const total = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return { total, percent: Math.min(100, total / PRACTICE_GOAL * 100), remaining: Math.max(0, PRACTICE_GOAL - total) };
}
export default function ProgressJourney({ language="fr", xp, completed, saved, days, speaking, onPractice }: { language?:"fr"|"sv"; xp: number; completed: number; saved: number; days: number; speaking: number; onPractice: () => void }) {
  const swedish=language==="sv";
  const { total, percent, remaining } = practiceMilestone(xp);
  return <section className="progress-journey" aria-labelledby="journey-title">
    <div className="paris-confetti" aria-hidden="true">{(swedish?["🐟","☕","♡","🐟","♡","☕","🐟","☕","♡"]:["🥐", "☕", "🧸", "🥐", "🧸", "☕", "🥐", "☕", "🧸"]).map((motif, index) => <span key={index}>{motif}</span>)}</div>
    <header className="journey-heading"><p className="eyebrow">Nikki’s {swedish?"Swedish":"French"} journey</p><h1 id="journey-title">{swedish?"Lite i taget,":"Petit à petit,"}<br/><em>{swedish?"your fish takes color.":"Paris takes color."}</em></h1><p>Every attentive listen, every phrase you keep, every time you try again. This is what showing up looks like.</p></header>
    <div className="journey-main"><figure className="tower-postcard"><figcaption><span className="eyebrow">Your practice milestone</span><strong>{swedish?"A little Swedish fish":"A little more color in Paris"}</strong><small>French + Swedish XP · every practice counts.</small></figcaption><div className="tower-scene" role="progressbar" aria-label="Practice XP milestone" aria-valuemin={0} aria-valuemax={PRACTICE_GOAL} aria-valuenow={Math.min(total,PRACTICE_GOAL)} aria-valuetext={`${total} XP; ${Math.round(percent)} percent of the ${PRACTICE_GOAL} XP practice milestone, not a language-level assessment`}>{swedish?<SwedishFish percent={percent}/>:<div className="eiffel-tower" style={{ "--tower-fill": `${percent}%` } as CSSProperties}><div className="tower-color"/><div className="tower-lattice"/><i className="tower-deck upper"/><i className="tower-deck lower"/><i className="tower-arch"/></div>}<span className="tower-ground"/></div><div className="tower-caption"><strong>{Math.round(percent)}%</strong><span>of your practice milestone<br/>5000 XP · not a fluency estimate</span></div></figure>
    <div className="journey-details"><article className="journey-xp"><p className="eyebrow">Your practice across both languages</p><strong>{total.toLocaleString()} <small>XP</small></strong><p>{remaining ? `${remaining.toLocaleString()} XP to your 5,000-XP practice milestone.` : "Your first 5,000-XP milestone is complete. Keep exploring new speakers and topics."}</p><div className="journey-milestones">{rewards.map(reward=>reward.xp).map(target => <span key={target} className={total >= target ? "reached" : ""}>{total >= target ? "✓ " : ""}{target.toLocaleString()} XP</span>)}</div><small>5,000 XP celebrates consistent practice, not a language level. French and Swedish XP are recorded separately and added together for this display.</small></article>
    <div className="journey-stats"><article><span aria-hidden="true">🥐</span><strong>{completed}</strong><small>new loops completed</small></article><article><span aria-hidden="true">☕</span><strong>{days}</strong><small>practice days</small></article><article><span aria-hidden="true">🧸</span><strong>{saved}</strong><small>phrase reviews</small></article><article><span aria-hidden="true">♡</span><strong>{speaking}</strong><small>extra practices</small></article></div>
    <article className="b2-evidence"><p className="eyebrow">Beyond the numbers</p><h2>Progress beyond XP.</h2><p>XP celebrates the time and effort you put in. Notice the everyday changes too:</p><ul><li>Recognize more words and details without reading.</li><li>Need fewer replays to understand a familiar situation.</li><li>Find it easier to respond in your own words.</li></ul><button onClick={onPractice}>Back to today’s practice →</button></article></div></div>
  </section>;
}
