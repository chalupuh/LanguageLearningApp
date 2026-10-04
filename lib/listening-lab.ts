export function compareDictation(input:string,target:string):"correct"|"marks"|"retry"{
 const normalize=(s:string)=>s.toLocaleLowerCase().normalize("NFC").replace(/[’']/g," ").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
 const actual=normalize(input),expected=normalize(target);
 if(actual===expected)return "correct";
 const plain=(s:string)=>s.normalize("NFD").replace(/\p{M}/gu,"");
 return plain(actual)===plain(expected)?"marks":"retry";
}
