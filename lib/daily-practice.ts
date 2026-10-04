import type {Passage} from "../content/passages";
export type LearningPreferences={minutes:5|10|15;level:string;interest:string;goal:string};
export const defaultPreferences:LearningPreferences={minutes:10,level:"B1",interest:"any",goal:"everyday"};
type Options={preferences?:LearningPreferences;observations?:{source:string;createdAt:number;details:string}[];reflections?:{createdAt:string;patterns:string[]}[]};
export function dailyPractice(catalog:Passage[],completed:string[],reviews:Record<string,string>,patterns:Record<string,number>,now=Date.now(),options:Options={}){
 const due=catalog.filter(p=>Date.parse(reviews[p.id]||"")<=now).sort((a,b)=>Date.parse(reviews[a.id])-Date.parse(reviews[b.id]));
 const recent:Record<string,number>={};
 for(const r of options.reflections||[])if(now-Date.parse(r.createdAt)<30*86400000)for(const p of r.patterns)recent[p]=(recent[p]||0)+1;
 const focus=Object.entries(options.reflections?.length?recent:patterns).sort((a,b)=>b[1]-a[1])[0]?.[0];
 const tags:Record<string,RegExp>={"Speech too fast":/rhythm|connected|speed|liaison|spoken|link/i,"Sounded different":/sound|liaison|rhythm|connected|link/i,"New expression":/expression|everyday|idiom|coffee|dinner|informal/i,"Missed a detail":/number|detail|transport|shopping|breakfast/i};
 const observations=(options.observations||[]).filter(o=>now-o.createdAt<30*86400000).sort((a,b)=>b.createdAt-a.createdAt);
 const evidence=new Map<string,any>();for(const o of observations)if(!evidence.has(o.source)){try{evidence.set(o.source,JSON.parse(o.details));}catch{}}
 const unseen=catalog.filter(p=>!completed.includes(p.id)),pool=unseen.length?unseen:catalog;
 const pref=options.preferences,rank:Record<string,number>={A1:0,B1:1,"B1+":2,B2:3,"B2+":4};
 const ranked=pool.map(p=>{
  const matches=Boolean(focus&&tags[focus]?.test(p.challenges.join(" ")+" "+p.topic));
  const interest=Boolean(pref&&pref.interest!=="any"&&(p.category===pref.interest||p.topic.toLowerCase().includes(pref.interest)));
  const score=(matches?4:0)+(interest?3:0)-(pref?Math.abs((rank[p.level]??1)-(rank[pref.level]??1))*2:0);
  return {p,matches,interest,score};
 }).sort((a,b)=>b.score-a.score||a.p.id.localeCompare(b.p.id));
 const top=ranked.filter(r=>r.score===ranked[0]?.score),choice=top[Math.floor(now/86400000)%Math.max(1,top.length)];
 const difficult=due.find(p=>{const d=evidence.get("library:"+p.id);return d&&(d.score<70||["replay","slowed","transcript"].includes(d.condition));});
 return {review:difficult||due[0],lesson:choice?.p,reason:choice?.matches?`Targets your recent “${focus}” reflections.`:choice?.interest?"Matches your selected interest and starting difficulty.":unseen.length?"An unseen passage near your selected starting difficulty.":"A familiar passage for another listen.",quick:pref?.goal==="travel"?"situations":Math.floor(now/86400000)%2?"situations":"announcements"};
}
