import type {Passage} from "../content/passages";
import {speechTurns,recordingSignature,type SpeechTurn} from "./passage-speech.ts";
export type AlignedRecording={signature:string;file:string;turns:(SpeechTurn&{start:number;end:number;pcmSha256?:string})[]};
export function validateAudioCatalog(catalog:Passage[]){
 const scenes=new Set<string>(),turnIds=new Set<string>(),characters=new Map<string,string>();
 for(const passage of catalog){
  if(scenes.has(passage.id))throw Error("Duplicate audio scene id");scenes.add(passage.id);
  if(passage.cast&&(!passage.decode?.trim()||!passage.phrase?.trim()||!passage.text.includes(passage.decode)||!passage.text.includes(passage.phrase)||!passage.comprehensionPoints?.length||passage.comprehensionPoints.some(point=>!point.trim())))throw Error("Dialogue learning content disagrees with its transcript");
  for(const turn of speechTurns(passage)){
   if(turn.id){if(turnIds.has(turn.id))throw Error("Duplicate catalog turn id");turnIds.add(turn.id);}
   if(turn.character){const key=(passage.language||"fr")+":"+turn.character,identity=turn.role+":"+turn.voice;if(characters.has(key)&&characters.get(key)!==identity)throw Error("Character identity changes across scenes");characters.set(key,identity);}
  }
 }
}
export type TurnReceipt={signature:string;index:number;turn:SpeechTurn;pcmSha256:string};
export function validateTurnReceipt(passage:Passage,index:number,receipt:TurnReceipt,pcm:Uint8Array,actualHash:string){
 validatePcmTurn(pcm);const expected=speechTurns(passage)[index];
 if(!expected||receipt.signature!==recordingSignature(passage)||receipt.index!==index||receipt.pcmSha256!==actualHash||!/^[a-f0-9]{64}$/.test(actualHash)||JSON.stringify(receipt.turn)!==JSON.stringify(expected))throw Error("Turn cache does not match expected speaker, text or bytes");
}
export function validatePcmTurn(pcm:Uint8Array){
 if(pcm.byteLength<2400||pcm.byteLength%2||!pcm.some(byte=>byte!==0))throw Error("Empty, silent, truncated or too-short PCM turn");
}
// Tests byte/metadata alignment, not whether a listener perceives the right voice.
export function validateRecordingAssembly(passage:Passage,record:AlignedRecording,wave:Uint8Array,expectedPcm?:Uint8Array[]){
 const turns=speechTurns(passage);
 if(record.signature!==recordingSignature(passage)||!record.file?.startsWith("/audio/")||record.turns.length!==turns.length)throw Error("Stale or incomplete recording manifest");
 if(wave.length<44)throw Error("Truncated WAV");
 const view=new DataView(wave.buffer,wave.byteOffset,wave.byteLength),tag=(a:number,b:number)=>String.fromCharCode(...wave.slice(a,b));
 if(tag(0,4)!=="RIFF"||tag(8,12)!=="WAVE"||tag(12,16)!=="fmt "||tag(36,40)!=="data"||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint32(24,true)!==24000||view.getUint32(28,true)!==48000||view.getUint16(32,true)!==2||view.getUint16(34,true)!==16||view.getUint32(4,true)+8!==wave.length||view.getUint32(40,true)+44!==wave.length)throw Error("Invalid mono 24kHz PCM WAV");
 if(expectedPcm&&expectedPcm.length!==turns.length)throw Error("Missing or duplicate PCM parts");
 let cursor=0;const clips:Uint8Array[]=[];
 for(const [i,turn] of turns.entries()){
  const timed=record.turns[i];
  if(["id","character","role","voice","text"].some(key=>timed[key as keyof SpeechTurn]!==turn[key as keyof SpeechTurn]))throw Error("Manifest turn order or speaker mismatch");
  if(!Number.isFinite(timed.start)||!Number.isFinite(timed.end)||timed.end<=timed.start||Math.abs(timed.start*48000-cursor)>1)throw Error("Invalid turn timing or join");
  const start=Math.round(timed.start*48000),end=Math.round(timed.end*48000);
  if(start%2||end%2||end+12000>wave.length-44)throw Error("Turn exceeds WAV or splits a sample");
  const pcm=wave.slice(44+start,44+end);validatePcmTurn(pcm);
  if(expectedPcm&&(pcm.length!==expectedPcm[i].length||pcm.some((byte,n)=>byte!==expectedPcm[i][n])))throw Error("Assembly reordered, duplicated or altered PCM");
  if(wave.slice(44+end,44+end+12000).some(byte=>byte!==0))throw Error("Non-silent or missing join padding");
  clips.push(pcm);cursor=end+12000;
 }
 if(cursor!==wave.length-44)throw Error("Missing or extra final audio");
 return clips;
}
