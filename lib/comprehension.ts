export type ComprehensionFeedback={score:number;understood:string[];missed:string[];misconception?:string|null;listening_target:string;hint?:string};
export function validComprehension(value:unknown):value is ComprehensionFeedback{
 if(!value||typeof value!=="object")return false;
 const v=value as ComprehensionFeedback;
 const lines=(a:unknown)=>Array.isArray(a)&&a.length<=3&&a.every(s=>typeof s==="string"&&s.length<=2000);
 return Number.isInteger(v.score)&&v.score>=0&&v.score<=100&&lines(v.understood)&&v.understood.length>0&&lines(v.missed)&&typeof v.listening_target==="string"&&v.listening_target.length<=2000&&(v.hint===undefined||typeof v.hint==="string"&&v.hint.length<=2000)&&(v.misconception==null||typeof v.misconception==="string"&&v.misconception.length<=2000);
}
export function listeningCondition({familiar=false,transcript=false,slowed=false,listens=0}:{familiar?:boolean;transcript?:boolean;slowed?:boolean;listens?:number}){
 return familiar?"familiar":transcript?"transcript":slowed?"slowed":listens>1?"replay":listens===1?"first":"unknown";
}
export function conditionLabel(condition:string){return ({familiar:"Familiar passage",transcript:"Transcript-assisted",slowed:"Slowed listening",replay:"Replay-assisted",first:"First listen",unknown:"Listening conditions not recorded"} as Record<string,string>)[condition]||"Listening conditions not recorded";}
