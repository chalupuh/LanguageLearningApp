import type {Passage} from "../content/passages";
export function dailyPractice(catalog:Passage[],completed:string[],reviews:Record<string,string>,patterns:Record<string,number>,now=Date.now()){
 const due=catalog.filter(p=>Date.parse(reviews[p.id]||"")<=now).sort((a,b)=>Date.parse(reviews[a.id])-Date.parse(reviews[b.id]));
 const focus=Object.entries(patterns).sort((a,b)=>b[1]-a[1])[0]?.[0];
 const unseen=catalog.filter(p=>!completed.includes(p.id));
 const tags:Record<string,RegExp>={"Speech too fast":/rhythm|connected|speed|liaison|spoken/i,"Sounded different":/sound|liaison|rhythm|connected/i,"New expression":/expression|everyday|idiom|coffee|dinner/i,"Missed a detail":/number|detail|transport|shopping|breakfast/i};
 const matching=focus&&tags[focus]?unseen.filter(p=>tags[focus].test(p.challenges.join(" ")+" "+p.topic)):[];
 const pool=matching.length?matching:unseen.length?unseen:catalog;
 const lesson=pool[Math.floor(now/86400000)%Math.max(1,pool.length)];
 return {review:due[0],lesson,reason:matching.length?`Chosen to work on “${focus}” using this lesson’s topic and listening features.`:unseen.length?"An unseen passage to broaden your listening.":"A familiar passage for another natural-speed listen.",quick:Math.floor(now/86400000)%2?"situations":"announcements"};
}
