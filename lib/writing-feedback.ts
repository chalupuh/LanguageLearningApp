export type WritingFeedback={score:number;summary:string;corrections:{original:string;improved:string;explanation:string}[];improvedVersion:string};
export function validWritingFeedback(value:unknown):value is WritingFeedback{
 const v=value as WritingFeedback|null;
 return !!v&&Number.isInteger(v.score)&&v.score>=0&&v.score<=100&&typeof v.summary==="string"&&v.summary.length<=2000&&typeof v.improvedVersion==="string"&&v.improvedVersion.length<=2000&&Array.isArray(v.corrections)&&v.corrections.length<=5&&v.corrections.every(c=>c&&[c.original,c.improved,c.explanation].every(s=>typeof s==="string"&&s.length<=1000));
}
export function listeningSummary(english:string,french:string){return [english.trim()?`English: ${english.trim()}`:"",french.trim()?`French: ${french.trim()}`:""].filter(Boolean).join("\n");}
