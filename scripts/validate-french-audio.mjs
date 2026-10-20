import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import ts from "typescript";
import {frenchBeginnerPassages} from "../content/french-beginner.ts";
import {announcements} from "../content/announcements.ts";
import {audioRecordings} from "../content/audio-recordings.ts";
import {validateRecordingAssembly} from "../lib/audio-recording-validation.ts";
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const catalog=[...frenchBeginnerPassages,...announcements.filter(p=>p.language==="fr"&&["A1","A2"].includes(p.level)).map(p=>({...p,id:"announcement:"+p.id,speechStyle:"beginner",speaker:{name:"Narrator",voice:"marin"}}))];
const rows=[];
for(const passage of catalog){
 const record=audioRecordings[passage.id];if(!record)throw Error("Missing recording: "+passage.id);
 const wave=await readFile(new URL("../public"+record.file,import.meta.url));
 const clips=validateRecordingAssembly(passage,record,wave);
 let clippedSamples=0,peak=0;
 for(const [index,pcm] of clips.entries()){
  if(hash(pcm)!==record.turns[index].pcmSha256)throw Error("Turn checksum mismatch: "+passage.id);
  const samples=new DataView(pcm.buffer,pcm.byteOffset,pcm.byteLength);
  for(let i=0;i<pcm.length;i+=2){const amplitude=Math.abs(samples.getInt16(i,true));peak=Math.max(peak,amplitude);if(amplitude>=32767)clippedSamples++;}
 }
 const spokenSeconds=clips.reduce((n,pcm)=>n+pcm.length/48000,0),words=passage.text.trim().split(/\s+/u).length;
 const rate=words/spokenSeconds*60,range=passage.level==="A1"?[85,100]:[95,110];
 if(!record.processing||rate<range[0]||rate>range[1])throw Error("Beginner pace target not met: "+passage.id);
 rows.push({id:passage.id,title:passage.title,level:passage.level,format:passage.dialogue?"conversation":"announcement",wordCount:words,processing:record.processing,cast:passage.cast||{narrator:{name:"Narrator",role:"Announcement narrator",voice:"marin"}},file:record.file,signature:record.signature,bytes:wave.length,sha256:hash(wave),turnCount:clips.length,durationSeconds:Number(((wave.length-44)/48000).toFixed(3)),approximateWordsPerMinute:Number((words/spokenSeconds*60).toFixed(1)),peakSample:peak,clippedSamples,automatedValidation:"pass",perceivedVoiceReview:"pending",pronunciationReview:"pending",paceIntelligibilityReview:"pending",inAppListeningReview:"pending",turns:record.turns.map(turn=>({...turn,listeningReview:"pending"}))});
}
// Prove both metadata and audio bytes from the existing catalog are preserved.
const source=execFileSync("git",["show","HEAD:content/audio-recordings.ts"],{encoding:"utf8"});
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {audioRecordings:baseline}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
for(const [id,record] of Object.entries(baseline)){
 if(JSON.stringify(record)!==JSON.stringify(audioRecordings[id]))throw Error("Existing recording metadata changed: "+id);
 const relative="public"+record.file,previous=execFileSync("git",["show","HEAD:"+relative],{maxBuffer:30*1024*1024}),current=await readFile(new URL("../"+relative,import.meta.url));
 if(hash(previous)!==hash(current))throw Error("Existing recording bytes changed: "+id);
}
const report={generatedAt:new Date().toISOString(),scope:"Full requested French A1/A2 pack: eight conversations and four announcements per level",byLevel:Object.fromEntries(["A1","A2"].map(level=>[level,{authoredConversations:catalog.filter(p=>p.level===level&&p.dialogue).length,authoredAnnouncements:catalog.filter(p=>p.level===level&&!p.dialogue).length,generated:rows.filter(p=>p.level===level).length,structurallyVerified:rows.filter(p=>p.level===level).length,listeningReviewPending:rows.filter(p=>p.level===level).length}])),recordings:rows.length,turns:rows.reduce((n,r)=>n+r.turnCount,0),existingRecordingsPreserved:Object.keys(baseline).length,automatedValidation:"pass",humanListeningReview:"pending — no listening inspection tool is available in this session",deployment:"not performed",scenes:rows};
if(process.argv.includes("--report"))await writeFile(new URL("../docs/french-audio-production-report.json",import.meta.url),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({recordings:report.recordings,turns:report.turns,existingRecordingsPreserved:report.existingRecordingsPreserved,automatedValidation:"pass",humanListeningReview:"pending",scenes:rows.map(({id,durationSeconds,approximateWordsPerMinute,clippedSamples})=>({id,durationSeconds,approximateWordsPerMinute,clippedSamples}))},null,2));
