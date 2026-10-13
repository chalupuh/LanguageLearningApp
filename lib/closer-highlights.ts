export function validCloserHighlights(value:unknown,text:string):string[]{
 if(!Array.isArray(value))return [];
 const source=text.normalize("NFC").replace(/\s+/gu," ").toLocaleLowerCase();
 return [...new Set(value.filter((p):p is string=>typeof p==="string").map(p=>p.normalize("NFC").replace(/\s+/gu," ").trim()).filter(p=>p.length>=1&&p.length<=220&&/\p{L}/u.test(p)&&source.includes(p.toLocaleLowerCase())))].slice(0,50);
}
export function highlightedParts(text:string,phrases:string[]){
 const ranges:{start:number;end:number}[]=[],lower=text.toLocaleLowerCase();
 for(const phrase of phrases){if(!phrase)continue;let from=0,index;while((index=lower.indexOf(phrase.toLocaleLowerCase(),from))>=0){ranges.push({start:index,end:index+phrase.length});from=index+phrase.length}}
 ranges.sort((a,b)=>a.start-b.start);const merged:{start:number;end:number}[]=[];
 for(const r of ranges){const last=merged.at(-1);if(last&&r.start<=last.end)last.end=Math.max(last.end,r.end);else merged.push({...r})}
 const parts:{text:string;marked:boolean}[]=[];let cursor=0;
 for(const r of merged){if(r.start>cursor)parts.push({text:text.slice(cursor,r.start),marked:false});parts.push({text:text.slice(r.start,r.end),marked:true});cursor=r.end}
 if(cursor<text.length)parts.push({text:text.slice(cursor),marked:false});return parts;
}
