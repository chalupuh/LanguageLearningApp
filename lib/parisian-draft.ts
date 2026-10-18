import {validComprehension,type ComprehensionFeedback} from "./comprehension.ts";
export type ParisianDraft={mode:string;rate:number;summary:string;feedback:ComprehensionFeedback|null;condition:string;heard:boolean;revealed:boolean;listens:number;slowed:boolean};
export function restoreParisianDraft(value:unknown):ParisianDraft{
 const d=(value&&typeof value==="object"?value:{}) as Partial<ParisianDraft>;
 return {mode:d.mode==="parisian"?"parisian":"natural",rate:[1.2,1,.85].includes(Number(d.rate))?Number(d.rate):1.2,summary:typeof d.summary==="string"?d.summary.slice(0,500):"",feedback:validComprehension(d.feedback)?d.feedback:null,condition:typeof d.condition==="string"?d.condition.slice(0,30):"unknown",heard:d.heard===true,revealed:d.revealed===true,listens:Number.isInteger(d.listens)?Math.max(0,Math.min(100,Number(d.listens))):0,slowed:d.slowed===true};
}
