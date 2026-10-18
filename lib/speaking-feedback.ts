export type SpeakingFeedback = {
  cefr_estimate:string; score:number; summary:string; strengths:string[]; corrections:string[];
  word_accuracy:string; rhythm:string; pauses:string; liaison_practice:string;
  replay_drill:string; next_drill:string; xp_earned:number;
};
export function validSpeakingFeedback(value:unknown):value is SpeakingFeedback {
  if(!value||typeof value!=="object")return false;
  const v=value as Record<string,unknown>;
  const text=(s:unknown)=>typeof s==="string"&&s.trim().length>0&&s.length<=3000;
  return ["cefr_estimate","summary","word_accuracy","rhythm","pauses","liaison_practice","replay_drill","next_drill"].every(k=>text(v[k]))&&
    Number.isInteger(v.score)&&Number(v.score)>=0&&Number(v.score)<=100&&
    Number.isInteger(v.xp_earned)&&Number(v.xp_earned)>=0&&Number(v.xp_earned)<=50&&
    Array.isArray(v.strengths)&&v.strengths.length>=1&&v.strengths.length<=3&&v.strengths.every(text)&&
    Array.isArray(v.corrections)&&v.corrections.length<=3&&v.corrections.every(text);
}
