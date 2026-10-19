export type CalendarGoal={id:string;week:string;date?:string;text:string;done:boolean;createdAt:number};
export type CalendarPlan={version:1;goals:CalendarGoal[];mainGoals:{month:string;text:string}[]};
export const emptyCalendar=():CalendarPlan=>({version:1,goals:[],mainGoals:[]});
export function validMonth(v:unknown):v is string{return typeof v==="string"&&/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(v)}
export function dateFromKey(key:string){return new Date(key+"T12:00:00Z")}
export const dateKey=(d:Date)=>d.toISOString().slice(0,10);
export function addDays(key:string,n:number){const d=dateFromKey(key);d.setUTCDate(d.getUTCDate()+n);return dateKey(d)}
export function weekStart(key:string){const d=dateFromKey(key);return addDays(key,-((d.getUTCDay()+6)%7))}
export function validDate(v:unknown):v is string{return typeof v==="string"&&validMonth(v.slice(0,7))&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(dateFromKey(v).getTime())&&dateKey(dateFromKey(v))===v}
// Calendar rows start on Sunday. UTC noon keeps date-only arithmetic stable
// through daylight-saving changes and in every browser timezone.
export function monthDays(month:string,startsOn:0|1=0){
 if(!validMonth(month))return [];
 const first=month+"-01",start=addDays(first,-((dateFromKey(first).getUTCDay()-startsOn+7)%7)),next=monthShift(month,1)+"-01";
 const count=Math.ceil((dateFromKey(next).getTime()-dateFromKey(start).getTime())/86400000/7)*7;
 return Array.from({length:count},(_,index)=>addDays(start,index));
}
export const fullDateLabel=(date:string)=>dateFromKey(date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric",timeZone:"UTC"});
export function goalsOnDate(plan:CalendarPlan,date:string){return plan.goals.filter(goal=>goal.date===date).sort((a,b)=>Number(a.done)-Number(b.done)||a.createdAt-b.createdAt||a.id.localeCompare(b.id))}
export function validWeek(v:unknown):v is string{return typeof v==="string"&&validMonth(v.slice(0,7))&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(dateFromKey(v).getTime())&&dateKey(dateFromKey(v))===v&&dateFromKey(v).getUTCDay()===1}
export function monthShift(month:string,n:number){const d=dateFromKey(month+"-01");d.setUTCMonth(d.getUTCMonth()+n);return dateKey(d).slice(0,7)}
export function monthWeeks(month:string){const next=monthShift(month,1)+"-01",out:string[]=[];for(let w=weekStart(month+"-01");w<next;w=addDays(w,7))out.push(w);return out}
export const monthLabel=(month:string)=>dateFromKey(month+"-01").toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"});
export function weekLabel(week:string){const opts:Intl.DateTimeFormatOptions={month:"short",day:"numeric",timeZone:"UTC"};return dateFromKey(week).toLocaleDateString("en-US",opts)+" – "+dateFromKey(addDays(week,6)).toLocaleDateString("en-US",opts)}
export function mainGoalFor(plan:CalendarPlan,month:string){return [...plan.mainGoals].filter(g=>g.month<=month).sort((a,b)=>b.month.localeCompare(a.month))[0]?.text||""}
export function setMainGoal(plan:CalendarPlan,month:string,text:string):CalendarPlan{return {...plan,mainGoals:[...plan.mainGoals.filter(g=>g.month!==month),{month,text:text.trim()}]}}
export function validCalendar(value:unknown):value is CalendarPlan{
 if(!value||typeof value!=="object")return false;const d=value as CalendarPlan;
 return new TextEncoder().encode(JSON.stringify(value)).length<=450000&&d.version===1&&Array.isArray(d.goals)&&d.goals.length<=2000&&d.goals.every(g=>g&&typeof g.id==="string"&&/^[-\w]{16,80}$/.test(g.id)&&validWeek(g.week)&&(g.date===undefined||validDate(g.date)&&weekStart(g.date)===g.week)&&typeof g.text==="string"&&g.text.trim().length>0&&g.text.length<=180&&typeof g.done==="boolean"&&Number.isSafeInteger(g.createdAt)&&g.createdAt>=0)&&new Set(d.goals.map(g=>g.id)).size===d.goals.length&&Array.isArray(d.mainGoals)&&d.mainGoals.length<=1200&&d.mainGoals.every(g=>g&&validMonth(g.month)&&typeof g.text==="string"&&g.text.length<=1000)&&new Set(d.mainGoals.map(g=>g.month)).size===d.mainGoals.length;
}
// Merge independent edits from two devices. Conflicting edits never silently replace a goal.
export function mergeCalendar(base:CalendarPlan,local:CalendarPlan,remote:CalendarPlan){
 let conflict=false;const merge=<T,>(a:T[],b:T[],c:T[],key:(v:T)=>string)=>{const maps=[a,b,c].map(list=>new Map(list.map(v=>[key(v),v])));return [...new Set([...maps[0].keys(),...maps[1].keys(),...maps[2].keys()])].flatMap(id=>{const [old,mine,theirs]=maps.map(m=>m.get(id)),s=(v:unknown)=>JSON.stringify(v);let value;if(s(mine)===s(old))value=theirs;else if(s(theirs)===s(old)||s(mine)===s(theirs))value=mine;else{conflict=true;value=mine}return value?[value]:[]})};
 const plan:CalendarPlan={version:1,goals:merge(base.goals,local.goals,remote.goals,g=>g.id),mainGoals:merge(base.mainGoals,local.mainGoals,remote.mainGoals,g=>g.month)};return {plan,conflict:conflict||!validCalendar(plan)};
}
