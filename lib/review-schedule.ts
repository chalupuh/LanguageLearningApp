export type Rating="Again"|"Hard"|"Good"|"Easy";
export type ReviewMemory={interval:number;successes:number;lapses:number;reviewedAt:string;rating:Rating};
// A transparent expanding schedule. This is a practice aid, not a retention prediction.
export function nextReview(previous:ReviewMemory|undefined,rating:Rating,now=Date.now()){
 const last=Number.isFinite(previous?.interval)?Math.max(0,previous!.interval):0;
 const interval=rating==="Again"?10/1440:rating==="Hard"?Math.max(1,Math.min(90,last*1.2)):rating==="Good"?Math.max(3,Math.min(90,last*2)):Math.max(7,Math.min(120,last*2.5));
 return {due:new Date(now+interval*86400000).toISOString(),memory:{interval,successes:rating==="Again"?0:(previous?.successes||0)+1,lapses:(previous?.lapses||0)+Number(rating==="Again"),reviewedAt:new Date(now).toISOString(),rating}};
}
export function intervalLabel(days:number){return days<1?`${Math.round(days*1440)} minutes`:`${Math.round(days)} days`;}
