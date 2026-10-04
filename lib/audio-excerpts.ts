export type AudioExcerpt={id:string;label:string;start:number;end:number};
export function validExcerpts(value:unknown):Record<string,AudioExcerpt[]>{
 if(!value||typeof value!=="object"||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).slice(0,100).map(([source,items])=>[source,Array.isArray(items)?items.filter(e=>e&&typeof e.id==="string"&&typeof e.label==="string"&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end>e.start+.5&&e.end<=7200).slice(0,20).map(e=>({...e,label:e.label.slice(0,100)})):[]]));
}
