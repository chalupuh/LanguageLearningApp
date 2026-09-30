import type { Passage } from "../content/passages";
export type LibraryStatus = "all" | "not-started" | "in-progress" | "completed";
export type LibrarySort = "recommended" | "newest" | "difficulty" | "title";
export function lessonStatus(id:string,completed:string[],started:string[]) {
 return completed.includes(id)?"completed":started.includes(id)?"in-progress":"not-started";
}
export function isNewRelease(p:Passage,now=Date.now()) {
 const date=Date.parse(p.releasedAt||"");return Number.isFinite(date)&&now>=date&&now-date<30*86400000;
}
export function selectLessons(catalog:Passage[],options:{category:string;status:LibraryStatus;sort:LibrarySort;completed:string[];started:string[];reviews:Record<string,string>},now=Date.now()) {
 const rank:Record<string,number>={A1:0,B1:1,"B1+":2,B2:3,"B2+":4};
 const result=catalog.filter(p=>(options.category==="all"||(p.category||"everyday")===options.category)&&(options.status==="all"||lessonStatus(p.id,options.completed,options.started)===options.status));
 return result.sort((a,b)=>{
  if(options.sort==="title")return a.title.localeCompare(b.title,"fr");
  if(options.sort==="newest")return (b.releasedAt||"").localeCompare(a.releasedAt||"")||a.title.localeCompare(b.title,"fr");
  if(options.sort==="difficulty")return rank[a.level]-rank[b.level]||a.title.localeCompare(b.title,"fr");
  const priority=(p:Passage)=>!options.completed.includes(p.id)?0:Date.parse(options.reviews[p.id]||"")<=now?1:2;
  return priority(a)-priority(b)||rank[a.level]-rank[b.level]||(b.releasedAt||"").localeCompare(a.releasedAt||"");
 });
}
