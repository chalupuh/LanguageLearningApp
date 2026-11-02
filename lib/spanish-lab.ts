export type SpanishLabState={completedActivityIds:string[];masteredNounIds:string[];dailyMinuteDates:string[];completedMissionIds:string[]};
export const emptySpanishLabState:SpanishLabState={completedActivityIds:[],masteredNounIds:[],dailyMinuteDates:[],completedMissionIds:[]};
const strings=(value:unknown,limit=120)=>Array.isArray(value)?[...new Set(value.filter((item):item is string=>typeof item==="string"&&item.length>0&&item.length<=120))].slice(0,limit):[];
export function validSpanishLabState(value:unknown):SpanishLabState{const state=value&&typeof value==="object"?value as Partial<SpanishLabState>:{};return{completedActivityIds:strings(state.completedActivityIds),masteredNounIds:strings(state.masteredNounIds,40),dailyMinuteDates:strings(state.dailyMinuteDates,400).filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)),completedMissionIds:strings(state.completedMissionIds,20)}}
export const normalizeSpanish=(value:string)=>value.toLocaleLowerCase("es-419").normalize("NFC").replace(/[¿¡.,!?;:“”"'’]/g,"").replace(/\s+/g," ").trim();
export const evaluateSpanishDictation=(input:string,answer:string)=>normalizeSpanish(input)===normalizeSpanish(answer)?"correct":"retry";

export type SpanishPracticeEvidence={lessons:number;vocabulary:number;soundContrasts:number;dictations:number;missions:number;total:number};
export function spanishPracticeEvidence(completedLessons:string[],state:SpanishLabState):SpanishPracticeEvidence{
 const lessons=new Set(completedLessons.filter(id=>id.startsWith("es-"))).size;
 const vocabulary=new Set(state.masteredNounIds).size;
 const soundContrasts=new Set(state.completedActivityIds.filter(id=>!id.startsWith("dictation-"))).size;
 const dictations=new Set(state.completedActivityIds.filter(id=>id.startsWith("dictation-"))).size;
 const missions=new Set(state.completedMissionIds).size;
 return {lessons,vocabulary,soundContrasts,dictations,missions,total:lessons+vocabulary+soundContrasts+dictations+missions};
}

export function recommendSpanishNext(completedLessons:string[],state:SpanishLabState,lessonOrder:string[]){
 const evidence=spanishPracticeEvidence(completedLessons,state),nextLesson=lessonOrder.find(id=>!completedLessons.includes(id));
 if(nextLesson)return {area:"lesson" as const,id:nextLesson,message:"Continue your guided path with the next conversation."};
 if(evidence.vocabulary<6)return {area:"words" as const,message:"Strengthen everyday nouns together with their articles."};
 if(evidence.soundContrasts<3)return {area:"sounds" as const,message:"Practice a sound contrast before your next review."};
 if(evidence.dictations<4)return {area:"sounds" as const,message:"Try a short dictation and check the exact words you heard."};
 if(evidence.missions<3)return {area:"missions" as const,message:"Use the language in a practical multi-step mission."};
 return {area:"review" as const,message:"Your foundation set is complete. Review the lesson that felt least automatic."};
}
