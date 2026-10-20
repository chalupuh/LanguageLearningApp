// Local, pitch-preserving tempo adjustment. No API calls or credentials.
import {readFile,writeFile,mkdir,readdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {audioRecordings} from "../content/audio-recordings.ts";
import {frenchBeginnerPassages} from "../content/french-beginner.ts";
import {announcements} from "../content/announcements.ts";
import {speechTurns,pcmWave,RECORDING_VERSION} from "../lib/passage-speech.ts";
import {validateRecordingAssembly,validatePcmTurn} from "../lib/audio-recording-validation.ts";
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const binRoot=new URL("../work/audio-tools/imageio_ffmpeg/binaries/",import.meta.url);
const local=await readdir(binRoot).catch(()=>[]);
const ffmpeg=process.env.FFMPEG_PATH||(local.find(name=>name.startsWith("ffmpeg")&&(name.endsWith(".exe")||!name.includes(".")))?fileURLToPath(new URL(local.find(name=>name.startsWith("ffmpeg")&&(name.endsWith(".exe")||!name.includes("."))),binRoot)):"ffmpeg");
execFileSync(ffmpeg,["-v","error","-version"],{stdio:"ignore"});
const scratch=new URL("../work/french-paced/",import.meta.url);await mkdir(scratch,{recursive:true});
const catalog=[...frenchBeginnerPassages,...announcements.filter(p=>p.language==="fr"&&["A1","A2"].includes(p.level)).map(p=>({...p,id:"announcement:"+p.id,speechStyle:"beginner",speaker:{name:"Narrator",voice:"marin"}}))];
const records={...audioRecordings};
for(const p of catalog){
 const record=records[p.id];if(!record)throw Error("Missing source recording: "+p.id);
 const source=await readFile(new URL("../public"+record.file,import.meta.url)),clips=validateRecordingAssembly(p,record,source),target=p.level==="A1"?95:105;
 if(record.processing?.kind==="pitch-preserving-atempo-v1"&&record.processing.targetWordsPerMinute===target){console.log("Already paced "+p.id);continue;}
 const words=p.text.trim().split(/\s+/u).length,seconds=clips.reduce((n,pcm)=>n+pcm.length/48000,0),nativeRate=words/seconds*60,tempo=Math.min(1,target/nativeRate);
 if(tempo<.5)throw Error("Tempo adjustment needs individual review: "+p.id);
 const sourceHash=hash(source),recipe=hash(record.signature+sourceHash+target+"atempo-v1"),processed=[],timings=[];let elapsed=0;
 await writeFile(new URL(recipe+".master.json",scratch),JSON.stringify(record));await writeFile(new URL(recipe+".master.wav",scratch),source);
 for(const [i,pcm] of clips.entries()){
  const input=new URL(recipe+"-"+i+".input.pcm",scratch),output=new URL(recipe+"-"+i+".paced.pcm",scratch);
  await writeFile(input,pcm);
  execFileSync(ffmpeg,["-v","error","-y","-f","s16le","-ar","24000","-ac","1","-i",fileURLToPath(input),"-af","atempo="+tempo.toFixed(8),"-f","s16le","-ar","24000","-ac","1",fileURLToPath(output)],{stdio:"pipe"});
  const slow=await readFile(output);validatePcmTurn(slow);processed.push(slow);
  const turn=speechTurns(p)[i];timings.push({...turn,start:elapsed,end:elapsed+slow.length/48000,pcmSha256:hash(slow),sourcePcmSha256:hash(pcm)});elapsed+=slow.length/48000+.25;
 }
 const wave=pcmWave(processed.flatMap(pcm=>[pcm,new Uint8Array(12000)])),file=`/audio/passages/${RECORDING_VERSION}/${recipe.slice(0,24)}.wav`;
 const paced={signature:record.signature,file,turns:timings,processing:{kind:"pitch-preserving-atempo-v1",targetWordsPerMinute:target,tempo,sourceFile:record.file,sourceSha256:sourceHash,humanListeningReview:"pending"}};
 validateRecordingAssembly(p,paced,wave,processed);await writeFile(new URL("../public"+file,import.meta.url),wave);records[p.id]=paced;
 console.log(`${p.id}: ${nativeRate.toFixed(1)} → ${(words/(elapsed-processed.length*.25)*60).toFixed(1)} words/min; pitch-preserving tempo ${tempo.toFixed(3)}`);
}
const type="Record<string,{signature:string;file:string;turns:{id?:string;character?:string;role:string;voice:string;text:string;start:number;end:number;pcmSha256?:string;sourcePcmSha256?:string}[];processing?:{kind:string;targetWordsPerMinute:number;tempo:number;sourceFile:string;sourceSha256:string;humanListeningReview:string}}>";
await writeFile(new URL("../content/audio-recordings.ts",import.meta.url),"// Generated speech with validated turns; beginner tempo adjusted locally without changing pitch.\nexport const audioRecordings:"+type+"= "+JSON.stringify(records,null,2)+";\n");
console.log("Paced "+catalog.length+" beginner scenes; original recordings preserved; human listening review pending.");
