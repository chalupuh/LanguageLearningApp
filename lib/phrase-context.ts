export type PhraseContext = {sentence:string;source:string};

export function sentenceForPhrase(surface:string,phrase:string):string {
 const text=surface.replace(/\s+/gu," ").trim();
 const selected=phrase.replace(/\s+/gu," ").trim();
 if(!text||!selected)return selected;
 const sentence=text.split(/(?<=[.!?…])\s+/u).find(part=>part.toLocaleLowerCase().includes(selected.toLocaleLowerCase()))||text;
 if(sentence.length<=360)return sentence;
 const index=sentence.toLocaleLowerCase().indexOf(selected.toLocaleLowerCase());
 if(index<0)return sentence.slice(0,357)+"…";
 let start=Math.max(0,index-110),end=Math.min(sentence.length,index+selected.length+140);
 if(start>0){const space=sentence.indexOf(" ",start);if(space>=0&&space<index)start=space+1}
 if(end<sentence.length){const space=sentence.lastIndexOf(" ",end);if(space>index+selected.length)end=space}
 return `${start?"… ":""}${sentence.slice(start,end).trim()}${end<sentence.length?" …":""}`;
}

export function validPhraseContexts(value:unknown):Record<string,PhraseContext> {
 if(!value||typeof value!=="object"||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).slice(0,500).filter(([key,item])=>key.length<=220&&item&&typeof item==="object"&&typeof (item as PhraseContext).sentence==="string"&&typeof (item as PhraseContext).source==="string").map(([key,item])=>[key,{sentence:(item as PhraseContext).sentence.slice(0,400),source:(item as PhraseContext).source.slice(0,90)}]));
}
