import type {Passage} from "../content/passages";

export const RECORDING_VERSION="aligned-turns-v1";
export type SpeechTurn={role:string;text:string;voice:string};
export function speechTurns(passage:Passage,excerpt?:string):SpeechTurn[]{
 const turns=passage.dialogue||[{role:passage.speaker.name,text:passage.text,voice:passage.speaker.voice}];
 if(turns.map(t=>t.text).join("\n")!==passage.text)throw Error(`Transcript and dialogue disagree: ${passage.id}`);
 const voices=new Map<string,string>();
 for(const turn of turns){if(!turn.role||!turn.text.trim()||!turn.voice)throw Error(`Incomplete speaker: ${passage.id}`);if(voices.has(turn.role)&&voices.get(turn.role)!==turn.voice)throw Error(`Speaker changes voice: ${passage.id}`);voices.set(turn.role,turn.voice);}
 if(passage.dialogue&&new Set(voices.values()).size!==voices.size)throw Error(`Different speakers share a voice: ${passage.id}`);
 if(excerpt===undefined||excerpt===passage.text)return turns;
 // Selection/rehearsal tools normalize whitespace, so locate in that same text.
 const normalize=(s:string)=>s.replace(/\s+/gu," ").trim();
 const full=turns.map(t=>normalize(t.text)).join(" "),needle=normalize(excerpt),start=full.indexOf(needle);
 if(!needle||start<0)throw Error("This phrase could not be matched to its speaker.");
 // A repeated short phrase may belong to either speaker. Do not silently
 // choose the first voice when the source selection cannot distinguish them.
 const matches:string[]=[];
 for(let at=start;at>=0;at=full.indexOf(needle,at+1)){
  let position=0;const roles:string[]=[];
  for(const turn of turns){const length=normalize(turn.text).length;if(Math.min(at+needle.length,position+length)>Math.max(at,position))roles.push(turn.voice);position+=length+1;}
  matches.push(roles.join(","));
 }
 if(new Set(matches).size>1)throw Error("This phrase has multiple speakers. Replay the original conversation.");
 const end=start+needle.length;let offset=0;
 return turns.flatMap(turn=>{const text=normalize(turn.text),base=offset,left=Math.max(start,base),right=Math.min(end,base+text.length);offset+=text.length+1;return right>left?[{...turn,text:text.slice(left-base,right-base)}]:[]});
}
export function recordingSignature(passage:Passage){const signature:unknown[]=[RECORDING_VERSION,passage.language||"fr",speechTurns(passage)];if(passage.speechStyle)signature.push(passage.speechStyle);return JSON.stringify(signature);}

// PCM from speech is mono signed 16-bit at 24 kHz. One container avoids the
// competing MP3 headers that can truncate/skip turns when concatenated.
export function pcmWave(parts:Uint8Array[],sampleRate=24000){
 const length=parts.reduce((n,p)=>n+p.byteLength,0);
 if(!length||length%2)throw Error("Invalid PCM audio");
 const bytes=new Uint8Array(44+length),view=new DataView(bytes.buffer);
 const tag=(at:number,s:string)=>[...s].forEach((c,i)=>bytes[at+i]=c.charCodeAt(0));
 tag(0,"RIFF");view.setUint32(4,36+length,true);tag(8,"WAVE");tag(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);tag(36,"data");view.setUint32(40,length,true);
 let offset=44;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes;
}
