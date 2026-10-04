export const capabilities=[
 {id:"time",name:"Catch a time or price"},
 {id:"place",name:"Follow a place or platform change"},
 {id:"substitution",name:"Understand an unavailable item"},
 {id:"service",name:"Handle payment or a table change"},
 {id:"response",name:"Recognize an appropriate clarification"},
] as const;
// Explicit question indices: only the actual target question contributes evidence.
const questions:Record<string,Record<number,string>>={
 "sv-butik":{0:"time",2:"place"},"sv-tag":{0:"place",1:"time"},"sv-bestallning":{1:"place"},
 "mall-closing":{0:"time"},"mall-evacuation":{2:"place"},"shop-checkouts":{1:"service",2:"service"},
 "train-delay":{0:"time"},"train-platform":{0:"place",2:"time"},"train-cancelled":{1:"time"},
 "airport-gate":{0:"place",1:"time"},"museum-closing":{0:"time"},"museum-exit":{2:"place"},
 "restaurant-number":{1:"place"},"restaurant-service":{0:"time"},
};
export function questionCapability(source:string,index:number){
 if(source.startsWith("situation-")){
  if(index===2)return "response";
  if(source.includes("milk"))return "substitution";
  if(source.includes("cash")||source.includes("table"))return "service";
  if(source.includes("breakfast"))return "time";
  if(source.includes("repeat"))return "place";
 }
 return questions[source]?.[index];
}
export function evidenceFor(events:{kind:string;source:string;details:string;createdAt:number}[],capability:string){
 const attempts=events.filter(e=>e.kind==="announcement-attempt"||(e.kind==="announcement"&&!events.some(a=>a.kind==="announcement-attempt"&&a.source===e.source)));
 let correct=0,total=0;const independent=new Set<string>();
 for(const event of attempts){let data:any;try{data=JSON.parse(event.details)}catch{continue}
  (data.skills||[]).forEach((skill:any,index:number)=>{if(questionCapability(event.source,index)!==capability)return;total++;correct+=Number(skill.correct===true);if(data.condition==="first"&&skill.correct)independent.add(event.source);});
 }
 return {correct,total,independent:independent.size};
}
