export const USAGE_IDLE_MS = 60_000;
export const USAGE_TIMEZONE = "America/New_York";
export const usageStages = ["First listen", "Listen closer", "Retell practice / Rehearse", "Retell"];
export type UsageSession = { id: string; source: string; startedAt: number; lastActiveAt: number; stage: number; completedAt: number | null };
export type UsageSample = { sessionId: string; start: number; end: number; stage?:number|null;feature?:string|null;language?:string|null };
export const usageFeatures=["today","library","phrase-review","phrase-help","fluency","listening-lab","announcements","situations","recordings","original-voices","swedish-lab","spanish-lab","progress","collection","about","studio","practice"] as const;

// Prune individual expired/invalid samples, rather than keeping an entire
// poisoned queue because one newer sample remains. Matches the API contract.
export function validUsageSample(s:any,now:number){
return !!s&&Number.isSafeInteger(s.seq)&&s.seq>=0&&s.seq<=1000000&&Number.isSafeInteger(s.start)&&Number.isSafeInteger(s.end)&&s.end>s.start&&s.end-s.start<=10000&&s.start>=now-86400000&&s.start<now&&s.end<=now+5000&&(s.stage===undefined||Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=3)&&(s.feature===undefined||usageFeatures.includes(s.feature))&&(s.language===undefined||["fr","sv","es"].includes(s.language));
}
export function pruneUsageQueue(queue:any[],now:number){
 return queue.filter(r=>r&&typeof r.id==="string"&&/^[\w-]{36}$/.test(r.id)&&typeof r.source==="string"&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=3&&Array.isArray(r.samples)).map(r=>({...r,samples:r.samples.filter((s:any)=>validUsageSample(s,now))})).filter(r=>r.samples.length).slice(-20);
}

// Discard suspended/throttled timer gaps, and never count a hidden or unfocused tab.
export function activeSlice(previous: number, now: number, lastInput: number, visible: boolean, focused: boolean, media: boolean) {
  if (!visible || !focused || now <= previous || now - previous > 10_000) return 0;
  return Math.max(0, Math.min(now, media ? now : lastInput + USAGE_IDLE_MS) - previous);
}
export function unionMs(samples: { start: number; end: number }[], from = 0, to = Infinity) {
  const intervals = samples.map(s => ({ start: Math.max(from, s.start), end: Math.min(to, s.end) })).filter(s => s.end > s.start).sort((a,b) => a.start-b.start);
  let sum=0, end=-Infinity;
  for (const s of intervals) { sum += Math.max(0,s.end-Math.max(end,s.start)); end=Math.max(end,s.end); }
  return sum;
}
export function usageDay(time: number) { return new Intl.DateTimeFormat("en-CA", { timeZone: USAGE_TIMEZONE, year:"numeric", month:"2-digit", day:"2-digit" }).format(time); }
export function weekStartDay(now: number) {
  const date=new Date(usageDay(now)+"T12:00:00Z"); date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
  return date.toISOString().slice(0,10);
}
export function summarizeUsage(sessions: UsageSession[], samples: UsageSample[], now: number, days: number) {
  const from=now-days*86400000, byId=new Map(sessions.map(s=>[s.id,s]));
  const practice=samples.filter(s=>byId.get(s.sessionId)?.source !== "app" && byId.has(s.sessionId));
  const week=weekStartDay(now), practiceDays=new Set<string>();
  for(const sample of practice){
    // A short interval can cross midnight; include both dates.
    for(const day of [usageDay(sample.start),usageDay(sample.end-1)]) if(day>=week&&day<=usageDay(now))practiceDays.add(day);
  }
  for(const session of sessions)if(session.completedAt&&usageDay(session.completedAt)>=week)practiceDays.add(usageDay(session.completedAt));
  const rows=sessions.filter(s=>s.source!=="app" && s.lastActiveAt>=from).map(s=>({
    ...s, activeMs:unionMs(samples.filter(p=>p.sessionId===s.id),from,now),
    status:s.completedAt?"Completed":now-s.lastActiveAt<5*60000?"Recent / possibly in progress":"Unfinished",
  })).filter(s=>s.activeMs>=1000||s.completedAt).sort((a,b)=>b.lastActiveAt-a.lastActiveAt);
  const sources=["library:","studio:"].map(prefix=>({name:prefix==="library:"?"Library":"Studio", completed:sessions.filter(s=>s.source.startsWith(prefix)&&s.completedAt&&s.completedAt>=from).length, activeMs:unionMs(practice.filter(p=>byId.get(p.sessionId)?.source.startsWith(prefix)),from,now)}));
  return { days, from, timezone:USAGE_TIMEZONE, lastActive:sessions.length?Math.max(...sessions.map(s=>s.lastActiveAt)):null,
    trackingSince:sessions.length?Math.min(...sessions.map(s=>s.startedAt)):null, practiceDaysThisWeek:practiceDays.size,
    activeMs:unionMs(practice,from,now), sources,
    stops:usageStages.map((name,stage)=>({name, library:rows.filter(s=>s.stage===stage&&s.status==="Unfinished"&&s.source.startsWith("library:")).length, studio:rows.filter(s=>s.stage===stage&&s.status==="Unfinished"&&s.source.startsWith("studio:")).length})),
    features:usageFeatures.map(name=>({name,activeMs:unionMs(samples.filter(p=>p.feature===name&&byId.has(p.sessionId)),from,now)})).filter(r=>r.activeMs>0),
    stageTimes:usageStages.map((name,stage)=>({name,activeMs:unionMs(practice.filter(p=>p.stage===stage),from,now)})),
    assignedStepMs:unionMs(practice.filter(p=>p.stage!==null&&p.stage!==undefined),from,now),
    recent:rows.slice(0,50), recentTotal:rows.length,
  };
}
