export const correctionCategories = ["Articles", "Gender and agreement", "Verb tense", "Prepositions", "Word order", "Vocabulary", "Accents and spelling", "Other"] as const;
export type CorrectionCategory = typeof correctionCategories[number];
export type CorrectionEntry = { id: string; title: string; original: string; corrected: string; notes: string; categories: CorrectionCategory[]; archived: boolean; createdAt: number; updatedAt: number };
export type CorrectionNotebook = { entries: CorrectionEntry[] };
export const emptyNotebook = (): CorrectionNotebook => ({ entries: [] });
export function validCorrectionDraft(value: unknown): value is CorrectionEntry {
 const e=value as CorrectionEntry|null;
 return !!e && typeof e.title==="string" && typeof e.original==="string" && typeof e.corrected==="string"
  && validCorrectionEntry({...e,title:e.title||"Untitled",original:e.original||" · ",corrected:e.corrected||" · "});
}
export function validCorrectionEntry(value: unknown): value is CorrectionEntry {
 const e = value as CorrectionEntry | null;
 return !!e && typeof e.id === "string" && /^[a-zA-Z0-9-]{12,80}$/.test(e.id)
  && typeof e.title === "string" && e.title.trim().length > 0 && e.title.length <= 120
  && [e.original, e.corrected].every(s => typeof s === "string" && s.trim().length > 0 && s.length <= 6000)
  && typeof e.notes === "string" && e.notes.length <= 3000 && typeof e.archived === "boolean"
  && Array.isArray(e.categories) && e.categories.length <= correctionCategories.length && new Set(e.categories).size === e.categories.length
  && e.categories.every(c => correctionCategories.includes(c))
  && Number.isSafeInteger(e.createdAt) && e.createdAt > 0 && Number.isSafeInteger(e.updatedAt) && e.updatedAt >= e.createdAt;
}
export function validNotebook(value: unknown): value is CorrectionNotebook {
 const n = value as CorrectionNotebook | null;
 return !!n && Array.isArray(n.entries) && n.entries.length <= 100 && n.entries.every(validCorrectionEntry)
  && new Set(n.entries.map(e => e.id)).size === n.entries.length;
}
export function recurringCategories(entries: CorrectionEntry[]) {
 return correctionCategories.map(category => ({ category, count: entries.filter(e => !e.archived && e.categories.includes(category)).length })).filter(item => item.count > 0).sort((a,b) => b.count-a.count);
}
export type CorrectionDiff = { text: string; kind: "same" | "removed" | "added" }[];
// Keep whitespace and punctuation intact so either side can be reconstructed exactly.
export function correctionDiff(original: string, corrected: string): CorrectionDiff {
 const tokenize = (s: string) => s.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
 const a = tokenize(original), b = tokenize(corrected), result: CorrectionDiff = [];
 const add = (text: string, kind: CorrectionDiff[number]["kind"]) => { if (!text) return; const last = result[result.length-1]; if(last?.kind===kind) last.text+=text; else result.push({text,kind}); };
 if(a.length*b.length > 250000) {
  let start=0,end=0;while(start<a.length&&start<b.length&&a[start]===b[start])start++;
  while(end<a.length-start&&end<b.length-start&&a[a.length-1-end]===b[b.length-1-end])end++;
  add(a.slice(0,start).join(""),"same");add(a.slice(start,a.length-end).join(""),"removed");add(b.slice(start,b.length-end).join(""),"added");add(a.slice(a.length-end).join(""),"same");return result;
 }
 const width=b.length+1, lengths=new Uint16Array((a.length+1)*width);
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)lengths[i*width+j]=a[i]===b[j]?1+lengths[(i+1)*width+j+1]:Math.max(lengths[(i+1)*width+j],lengths[i*width+j+1]);
 let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){add(a[i++],"same");j++;}else if(i<a.length&&(j===b.length||lengths[(i+1)*width+j]>=lengths[i*width+j+1]))add(a[i++],"removed");else add(b[j++],"added");}
 return result;
}
