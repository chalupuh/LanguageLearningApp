import type {Passage} from "../content/passages";
import {speechTurns,recordingSignature} from "./passage-speech.ts";

type Recording={signature:string;file:string};
export async function passagePlayback(passage:Passage,excerpt:string|undefined,recordings:Record<string,Recording>,loadTurn:(text:string,voice:string,language:string)=>Promise<Blob>,assemble:(parts:Blob[])=>Promise<Blob>,fetchRecording:typeof fetch=fetch){
 const language=passage.language||"fr",turns=speechTurns(passage,excerpt);
 if(excerpt===undefined||excerpt===passage.text){
  const recording=recordings[passage.id];
  if(recording?.signature===recordingSignature(passage)){
   try{const response=await fetchRecording(recording.file);if(response.ok&&response.headers.get("Content-Type")?.startsWith("audio/")){const blob=await response.blob();if(blob.size)return blob;}}catch{}
  }
 }
 const parts:Blob[]=[];
 // Sequential on purpose: the speech service never assigns turns itself.
 for(const turn of turns)parts.push(await loadTurn(turn.text,turn.voice,language));
 return parts.length===1?parts[0]:assemble(parts);
}
