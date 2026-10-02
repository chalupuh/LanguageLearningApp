export type SwedishLabState={
  completedActivityIds:string[];
  masteredNounIds:string[];
  dailyMinuteDates:string[];
  completedMissionIds:string[];
};

export const emptySwedishLabState:SwedishLabState={completedActivityIds:[],masteredNounIds:[],dailyMinuteDates:[],completedMissionIds:[]};

const strings=(value:unknown,limit=120)=>Array.isArray(value)?[...new Set(value.filter((item):item is string=>typeof item==="string"&&item.length>0&&item.length<=120))].slice(0,limit):[];

export function validSwedishLabState(value:unknown):SwedishLabState{
  const state=value&&typeof value==="object"?value as Partial<SwedishLabState>:{};
  return {
    completedActivityIds:strings(state.completedActivityIds),
    masteredNounIds:strings(state.masteredNounIds,40),
    dailyMinuteDates:strings(state.dailyMinuteDates,400).filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)),
    completedMissionIds:strings(state.completedMissionIds,20),
  };
}

export function normalizeSwedish(value:string,stripMarks=false){
  const base=value.toLocaleLowerCase("sv-SE").normalize("NFC").replace(/[.,!?;:”“"'’]/g,"").replace(/\s+/g," ").trim();
  return stripMarks?base.normalize("NFD").replace(/[\u0300-\u036f]/g,""):base;
}

export function evaluateSwedishDictation(input:string,answer:string):"correct"|"marks"|"retry"{
  if(normalizeSwedish(input)===normalizeSwedish(answer))return "correct";
  if(normalizeSwedish(input,true)===normalizeSwedish(answer,true))return "marks";
  return "retry";
}

export function sentenceAnswerIsCorrect(tokens:string[],answers:readonly (readonly string[])[]){
  const candidate=normalizeSwedish(tokens.join(" "));
  return answers.some(answer=>normalizeSwedish(answer.join(" "))===candidate);
}

export function dailySwedishIndex(date:string,count:number){
  const parts=date.split("-").map(Number);const serial=(parts[0]||0)*372+(parts[1]||0)*31+(parts[2]||0);
  return count?serial%count:0;
}
