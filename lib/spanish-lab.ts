export type SpanishLabState={completedActivityIds:string[];masteredNounIds:string[];dailyMinuteDates:string[];completedMissionIds:string[]};
export const emptySpanishLabState:SpanishLabState={completedActivityIds:[],masteredNounIds:[],dailyMinuteDates:[],completedMissionIds:[]};
const strings=(value:unknown,limit=120)=>Array.isArray(value)?[...new Set(value.filter((item):item is string=>typeof item==="string"&&item.length>0&&item.length<=120))].slice(0,limit):[];
export function validSpanishLabState(value:unknown):SpanishLabState{const state=value&&typeof value==="object"?value as Partial<SpanishLabState>:{};return{completedActivityIds:strings(state.completedActivityIds),masteredNounIds:strings(state.masteredNounIds,40),dailyMinuteDates:strings(state.dailyMinuteDates,400).filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)),completedMissionIds:strings(state.completedMissionIds,20)}}
export const normalizeSpanish=(value:string)=>value.toLocaleLowerCase("es-419").normalize("NFC").replace(/[¿¡.,!?;:“”"'’]/g,"").replace(/\s+/g," ").trim();
export const evaluateSpanishDictation=(input:string,answer:string)=>normalizeSpanish(input)===normalizeSpanish(answer)?"correct":"retry";
