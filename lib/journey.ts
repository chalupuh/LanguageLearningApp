export type Activity = { id: string; kind: string; source: string; xp: number; createdAt: number; details: string };
export type Journey = { events: Activity[]; historicalXp: number; avatar: string; background: string; frame: string; weeklyGoal: number };
export const rewards = [
  { xp: 100, name: "Première écoute", id: "croissant", kind: "avatar", icon: "🥐" },
  { xp: 250, name: "Café régulier", id: "coffee", kind: "avatar", icon: "☕" },
  { xp: 500, name: "Petit explorateur", id: "bear", kind: "avatar", icon: "🧸" },
  { xp: 1000, name: "Promenade parisienne", id: "rose", kind: "frame", icon: "🌸" },
  { xp: 1750, name: "Collectionneur", id: "postcard", kind: "background", icon: "💌" },
  { xp: 2750, name: "Belle habitude", id: "lavender", kind: "background", icon: "🪻" },
  { xp: 4000, name: "Grande aventure", id: "paris", kind: "background", icon: "🌃" },
  { xp: 5000, name: "Paris en couleurs", id: "gold", kind: "frame", icon: "✨" },
] as const;
export const emptyJourney: Journey = { events: [], historicalXp: 0, avatar: "default", background: "default", frame: "default", weeklyGoal: 3 };
export function earnedXp(events: Activity[]) { return events.reduce((sum, event) => sum + event.xp, 0); }
export function details(event: Activity): Record<string, any> { try { return JSON.parse(event.details); } catch { return {}; } }
export function achievements(events: Activity[]) {
  const count = (kind: string) => events.filter(e => e.kind === kind).length;
  const speakers = new Set(events.filter(e => e.kind === "loop").map(e => details(e).speaker).filter(Boolean)).size;
  const retained = new Set(events.filter(e => e.kind === "phrase" && details(e).rating !== "Again").filter(e => events.some(other => other.source === e.source && other.id !== e.id && other.createdAt < e.createdAt - 86400000 && details(other).rating !== "Again")).map(e => e.source)).size;
  const weeks=new Map<string,Set<string>>(), achievedWeeks=new Set<string>();
  for(const event of [...events].filter(e=>e.xp>0).sort((a,b)=>a.createdAt-b.createdAt)){
    const date=new Date(event.createdAt),day=localDay(date);
    date.setDate(date.getDate()-((date.getDay()+6)%7));
    const week=localDay(date),days=weeks.get(week)||new Set<string>();days.add(day);weeks.set(week,days);
    if(days.size>=(details(event).weeklyGoal||3))achievedWeeks.add(week);
  }
  return [
    { name: "Back for more", description: "Complete 5 scheduled passage reviews", value: count("review"), target: 5, icon: "↶" },
    { name: "Different voices", description: "Finish lessons with 4 library speakers", value: speakers, target: 4, icon: "♫" },
    { name: "Out in the world", description: "Finish a Studio learning loop", value: events.some(e => e.kind === "loop" && e.source.startsWith("studio:")) ? 1 : 0, target: 1, icon: "▶" },
    { name: "Making it stick", description: "Recall 10 phrases on separate review dates (self-rated)", value: retained, target: 10, icon: "✎" },
    { name: "A gentle rhythm", description: "Meet your weekly practice goal once", value: achievedWeeks.size, target: 1, icon: "♡" },
  ];
}
export function listeningSummary(events: Activity[]){
  const checks=events.filter(e=>e.kind==="checkpoint");
  const skills=new Map<string,{correct:number;total:number}>();
  checks.forEach(e=>(details(e).skills||[]).forEach((s:{skill:string;correct:boolean})=>{const old=skills.get(s.skill)||{correct:0,total:0};skills.set(s.skill,{correct:old.correct+Number(s.correct),total:old.total+1})}));
  const groups=new Map<string,Activity[]>();
  for(const e of events.filter(e=>e.kind==="observation")){
    const d=details(e);if(d.condition!=="first"||d.level==="Uncalibrated Studio")continue;
    const list=groups.get(d.level)||[];list.push(e);groups.set(d.level,list);
  }
  return {skills:[...skills].map(([skill,values])=>({skill,...values})),trends:[...groups].map(([level,items])=>{
    const sorted=items.sort((a,b)=>b.createdAt-a.createdAt),count=sorted.length;
    return {level,count,recent:count>=4?(details(sorted[0]).score+details(sorted[1]).score)/2:null,earlier:count>=4?(details(sorted[2]).score+details(sorted[3]).score)/2:null};
  })};
}
export function localDay(date = new Date()) { return [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-"); }
