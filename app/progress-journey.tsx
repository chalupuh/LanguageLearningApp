"use client";
import type { CSSProperties } from "react";
import "./progress-journey.css";
import {rewards} from "../lib/journey";

const PRACTICE_GOAL = 5000;
export function practiceMilestone(xp: number) {
  const total = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return { total, percent: Math.min(100, total / PRACTICE_GOAL * 100), remaining: Math.max(0, PRACTICE_GOAL - total) };
}
export default function ProgressJourney({ xp, completed, saved, days, speaking, onPractice }: { xp: number; completed: number; saved: number; days: number; speaking: number; onPractice: () => void }) {
  const { total, percent, remaining } = practiceMilestone(xp);
  return <section className="progress-journey" aria-labelledby="journey-title">
    <div className="paris-confetti" aria-hidden="true">{["🥐", "☕", "🧸", "🥐", "🧸", "☕", "🥐", "☕", "🧸"].map((motif, index) => <span key={index}>{motif}</span>)}</div>
    <header className="journey-heading"><p className="eyebrow">Nikki’s French journey</p><h1 id="journey-title">Petit à petit,<br/><em>Paris takes color.</em></h1><p>Every attentive listen, every phrase you keep, every time you try again. This is what showing up looks like.</p></header>
    <div className="journey-main"><figure className="tower-postcard"><figcaption><span className="eyebrow">Long-term goal</span><strong>B2 listening independence</strong><small>The destination, not a score earned with XP.</small></figcaption><div className="tower-scene" role="progressbar" aria-label="Practice XP milestone" aria-valuemin={0} aria-valuemax={PRACTICE_GOAL} aria-valuenow={Math.min(total,PRACTICE_GOAL)} aria-valuetext={`${total} XP; ${Math.round(percent)} percent of the ${PRACTICE_GOAL} XP practice milestone, not a measure of B2 proficiency`}><div className="eiffel-tower" style={{ "--tower-fill": `${percent}%` } as CSSProperties}><div className="tower-color"/><div className="tower-lattice"/><i className="tower-deck upper"/><i className="tower-deck lower"/><i className="tower-arch"/></div><span className="tower-ground"/></div><div className="tower-caption"><strong>{Math.round(percent)}%</strong><span>of your practice milestone<br/>5000 XP · not a fluency estimate</span></div></figure>
    <div className="journey-details"><article className="journey-xp"><p className="eyebrow">Your practice adds up</p><strong>{total.toLocaleString()} <small>XP</small></strong><p>{remaining ? `${remaining.toLocaleString()} XP to your 5,000-XP practice milestone.` : "Your first 5,000-XP milestone is complete. Keep exploring new speakers and topics."}</p><div className="journey-milestones">{rewards.map(reward=>reward.xp).map(target => <span key={target} className={total >= target ? "reached" : ""}>{total >= target ? "✓ " : ""}{target.toLocaleString()} XP</span>)}</div><small>5,000 XP is a motivational app target, not an estimate of the XP required to reach B2. There is no validated XP-to-CEFR conversion.</small></article>
    <div className="journey-stats"><article><span aria-hidden="true">🥐</span><strong>{completed}</strong><small>new loops completed</small></article><article><span aria-hidden="true">☕</span><strong>{days}</strong><small>practice days</small></article><article><span aria-hidden="true">🧸</span><strong>{saved}</strong><small>phrase reviews</small></article><article><span aria-hidden="true">♡</span><strong>{speaking}</strong><small>extra practices</small></article></div>
    <article className="b2-evidence"><p className="eyebrow">Beyond the numbers</p><h2>What B2 listening would feel like.</h2><p>Your B2 listening readiness has not been assessed here. XP records practice; these are abilities to build and check with a teacher or listening assessment:</p><ul><li>Follow the main ideas and key details in unfamiliar French.</li><li>Follow longer explanations and viewpoints without a transcript.</li><li>Handle different speakers and explain what you understood.</li></ul><button onClick={onPractice}>Back to today’s practice →</button></article></div></div>
  </section>;
}
