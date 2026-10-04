type State=Record<string,any>;
export function progressEqual(a:unknown,b:unknown):boolean {
 const normalize=(v:any):any=>Array.isArray(v)?v.map(normalize):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;
 return JSON.stringify(normalize(a))===JSON.stringify(normalize(b));
}
const same=progressEqual;
const object=(v:any)=>v&&typeof v==="object"&&!Array.isArray(v);
// Three-way merge: only changes since the local baseline override the server.
// Deletions are explicit, so stale tabs cannot resurrect removed vocabulary.
export function mergeProgress(base:State,local:State,remote:State):State {
 const merge=(b:any,l:any,r:any,key:string):any=>{
  const history=key==="speakingAttempts"||key==="feedbackNotes"||key==="reflectionHistory";
  const ordered=(v:any)=>history&&Array.isArray(v)?[...v].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||String(a.id).localeCompare(String(b.id))):v;
  if(same(b,l))return ordered(r);if(same(b,r))return ordered(l);
  if(object(l)&&object(r)&&typeof l.reviewedAt==="string"&&typeof r.reviewedAt==="string")return Date.parse(l.reviewedAt)>Date.parse(r.reviewedAt)?l:r;
  if(Array.isArray(l)&&Array.isArray(r)){
   const identity=(v:any)=>object(v)&&v.id?String(v.id):JSON.stringify(v);
   const before=new Map((Array.isArray(b)?b:[]).map((v:any)=>[identity(v),v]));
   const current=new Map(l.map(v=>[identity(v),v]));
   const result=new Map(r.map(v=>[identity(v),v]));
   for(const id of before.keys())if(!current.has(id)&&key!=="completed"&&key!=="practiceDates")result.delete(id);
   for(const [id,v]of current)if(!before.has(id)||!same(before.get(id),v))result.set(id,v);
   const values=[...result.values()];
   if(key==="speakingAttempts"||key==="feedbackNotes"||key==="reflectionHistory")values.sort((a:any,b:any)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||String(a.id).localeCompare(String(b.id)));
   return values;
  }
  if(object(l)&&object(r)){
   const result={...r};for(const k of new Set([...Object.keys(b||{}),...Object.keys(l)])){
    if(!(k in l)&&k in (b||{}))delete result[k];
    else if(k in l)result[k]=key==="listeningPatterns"?Math.max(0,(Number(r[k])||0)+(Number(l[k])||0)-(Number(b?.[k])||0)):merge(b?.[k],l[k],r[k],k);
   }return result;
  }
  return l;
 };
 return merge(base,local,remote,"");
}
