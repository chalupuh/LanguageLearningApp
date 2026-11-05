import {frenchGrammar,type GrammarTopic} from "../content/french-grammar";
export function normalizeGrammarAnswer(answer:string){return answer.normalize("NFC").trim().toLocaleLowerCase("fr").replace(/[’‘ʼ]/g,"'").replace(/\s+/g," ").replace(/\s*'\s*/g,"'");}
export function checkGrammarAnswer(id:string,answer:string):"correct"|"accent"|"incorrect" {
 const exercise=frenchGrammar.find(e=>e.id===id);if(!exercise||!answer.trim()||answer.length>100)return "incorrect";
 const normalized=normalizeGrammarAnswer(answer),answers=exercise.answers.map(normalizeGrammarAnswer);
 if(answers.includes(normalized))return "correct";
 const bare=(text:string)=>text.normalize("NFD").replace(/\p{M}/gu,"");
 return answers.some(a=>bare(a)===bare(normalized))?"accent":"incorrect";
}
export function grammarTopicForCategory(category:string):GrammarTopic|null {return category==="Articles"?"articles":category==="Gender and agreement"?"agreement":null;}
