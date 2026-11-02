import type {Passage} from "./passages";

const clips=[
 ["estacion","la estación"],
 ["recibo","el recibo"],
 ["garganta","la garganta"],
 ["desayuno","el desayuno"],
 ["talla","la talla"],
 ["fin-semana","el fin de semana"],
 ["pero","pero"],
 ["perro","perro"],
 ["pena","pena"],
 ["pena-nye","peña"],
 ["publico","público"],
 ["publico-past","publicó"],
 ["dictado-estacion","¿Dónde está la estación?"],
 ["mision-cafe","Un café pequeño con leche para llevar, por favor."],
 ["mision-direcciones","¿Dónde está la estación? ¿Está lejos?"],
 ["mision-planes","Trabajo hasta las cuatro. ¿Nos vemos a las cuatro y media?"],
] as const;

export const spanishLabAudioPassages:Passage[]=clips.map(([id,text])=>({
 id:`es-lab-${id}`,language:"es",level:"A1",title:"Spanish lab audio",topic:"Pronunciation",xp:0,category:"everyday",releasedAt:"2026-11-01",speechStyle:"beginner",
 text,decode:text,translation:"",phrase:text,meaning:"",challenges:["Clear Latin American Spanish"],comprehensionPoints:["Hear the complete phrase"],
 speaker:{name:"Sofía",age:30,location:"Latin America",voice:"coral",initials:"S"},
}));

export const spanishLabAudioByText=new Map(spanishLabAudioPassages.map(p=>[p.text,p]));
