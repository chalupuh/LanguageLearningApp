import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {frenchBeginnerPassages,frenchBeginnerCharacters} from "../content/french-beginner.ts";
import {speechTurns,recordingSignature,pcmWave} from "../lib/passage-speech.ts";
import {validateAudioCatalog,validatePcmTurn,validateTurnReceipt,validateRecordingAssembly} from "../lib/audio-recording-validation.ts";
import {passagePlayback} from "../lib/passage-playback.ts";
const scene=frenchBeginnerPassages[0],clone=v=>structuredClone(v),hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const pcm=n=>new Uint8Array(4800).fill(n),parts=speechTurns(scene).map((_,i)=>pcm(i+1));
function fixture(){let seconds=0;const turns=speechTurns(scene).map((turn,i)=>{const start=seconds,end=start+parts[i].length/48000;seconds=end+.25;return {...turn,start,end,pcmSha256:hash(parts[i])};});return {record:{signature:recordingSignature(scene),file:"/audio/test.wav",turns},wave:pcmWave(parts.flatMap(part=>[part,new Uint8Array(12000)]))};}
test("French cast identity and scene roles are explicit; adjacent turns keep their assigned character",()=>{
 assert.deepEqual(frenchBeginnerCharacters,{lea:{name:"Léa",voice:"marin"},paul:{name:"Paul",voice:"cedar"}});
 validateAudioCatalog(frenchBeginnerPassages);
 const expectedCounts={"fr-a1-bonjour":4,"fr-a1-cafe":5,"fr-a1-gare":5,"fr-a1-repeter":5,"fr-a2-rendezvous":5,"fr-a2-marche":6,"fr-a2-hier":6,"fr-a1-boulangerie":5,"fr-a1-direction":6,"fr-a1-table":6,"fr-a1-journee":6,"fr-a2-dejeuner":6,"fr-a2-addition":6,"fr-a2-petitdejeuner":6,"fr-a2-retour":6,"fr-a2-weekend":6};
 for(const p of frenchBeginnerPassages)assert.equal(p.dialogue.length,expectedCounts[p.id],p.id);
 for(const p of frenchBeginnerPassages){assert.equal(p.language,"fr");assert.ok(["A1","A2"].includes(p.level));assert.ok(p.text.includes(p.decode));assert.ok(p.text.includes(p.phrase));assert.ok(p.comprehensionPoints.every(s=>s.trim()));assert.ok(Object.values(p.cast).every(actor=>actor.role.trim()));}
 const roles={"fr-a1-bonjour":["New acquaintance","New acquaintance"],"fr-a1-cafe":["Customer","Server"],"fr-a1-gare":["Traveller","Station staff"],"fr-a1-repeter":["Receptionist","Guest"],"fr-a2-rendezvous":["Friend proposing a meeting","Friend rescheduling"],"fr-a2-marche":["Shopper","Seller"],"fr-a2-hier":["Friend asking about yesterday","Traveller explaining a delay"],"fr-a1-boulangerie":["Customer","Baker"],"fr-a1-direction":["Visitor","Local"],"fr-a1-table":["Customer","Server"],"fr-a1-journee":["Friend proposing a plan","Friend accepting"],"fr-a2-dejeuner":["Diner","Server"],"fr-a2-addition":["Customer","Server"],"fr-a2-petitdejeuner":["Guest","Café staff"],"fr-a2-retour":["Customer","Shop assistant"],"fr-a2-weekend":["Friend asking about the weekend","Friend telling a short story"]};
 for(const p of frenchBeginnerPassages)assert.deepEqual([p.cast.lea.role,p.cast.paul.role],roles[p.id]);
 const adjacent=clone(scene);adjacent.dialogue.splice(1,0,{...adjacent.dialogue[0],id:"extra-lea-line",text:"J’habite ici."});adjacent.text=adjacent.dialogue.map(t=>t.text).join("\n");
 assert.deepEqual(speechTurns(adjacent).slice(0,3).map(t=>t.voice),["marin","marin","cedar"]);
 assert.equal(speechTurns(adjacent,"J’habite ici.")[0].character,"lea");
});
test("preflight rejects omissions, repeated ids, blank turns, swapped voices, invalid characters and metadata",()=>{
 for(const mutate of [p=>p.dialogue.pop(),p=>p.dialogue[1].id=p.dialogue[0].id,p=>p.dialogue[0].id="",p=>p.dialogue[0].text=" ",p=>p.dialogue[0].voice="cedar",p=>p.dialogue[0].character="unknown",p=>p.dialogue[0].role="Server",p=>p.cast.lea.voice="unknown",p=>p.language="de",p=>p.level="C9",p=>p.dialogue.reverse()]){const bad=clone(scene);mutate(bad);assert.throws(()=>speechTurns(bad));}
 assert.throws(()=>validateAudioCatalog([scene,scene]),/Duplicate/);
 const changed=clone(frenchBeginnerPassages[1]);changed.cast.lea.voice="coral";for(const t of changed.dialogue)if(t.character==="lea")t.voice="coral";
 assert.throws(()=>validateAudioCatalog([scene,changed]),/identity changes/);
});
test("per-turn receipts reject wrong speaker/text/index/signature and changed, silent or truncated PCM",()=>{
 const turn=speechTurns(scene)[0],bytes=parts[0],receipt={signature:recordingSignature(scene),index:0,turn,pcmSha256:hash(bytes)};
 validateTurnReceipt(scene,0,receipt,bytes,hash(bytes));
 for(const patch of [{index:1},{signature:"old"},{turn:{...turn,voice:"cedar"}},{turn:{...turn,text:"Different words"}},{pcmSha256:hash(parts[1])}])assert.throws(()=>validateTurnReceipt(scene,0,{...receipt,...patch},bytes,hash(bytes)));
 for(const bad of [new Uint8Array(),new Uint8Array(4800),new Uint8Array(2401).fill(1),new Uint8Array(100).fill(1)])assert.throws(()=>validatePcmTurn(bad));
});
test("assembly requires every expected turn once in order, exact PCM and valid mono WAV joins",()=>{
 const {record,wave}=fixture();assert.equal(validateRecordingAssembly(scene,record,wave,parts).length,4);
 for(const mutate of [r=>r.signature="old",r=>r.turns.pop(),r=>r.turns.push(r.turns[0]),r=>r.turns.reverse(),r=>r.turns[1].start=0,r=>r.turns[1].start+=1,r=>r.turns[0].end=Infinity,r=>r.turns[1].voice="marin",r=>r.turns[0].text="extra words"]){const bad=clone(record);mutate(bad);assert.throws(()=>validateRecordingAssembly(scene,bad,wave,parts));}
 assert.throws(()=>validateRecordingAssembly(scene,record,wave,[parts[1],parts[0],...parts.slice(2)]),/reordered/);
 const gap=wave.slice();gap[44+parts[0].length]=1;assert.throws(()=>validateRecordingAssembly(scene,record,gap),/padding/);
 const stereo=wave.slice();new DataView(stereo.buffer).setUint16(22,2,true);assert.throws(()=>validateRecordingAssembly(scene,record,stereo),/WAV/);
 assert.throws(()=>validateRecordingAssembly(scene,record,wave.slice(0,-2)),/WAV/);
});
test("runtime sends the right voices sequentially and rejects missing turn or assembled audio",async()=>{
 const calls=[];await passagePlayback(scene,undefined,{},async(text,voice)=>{calls.push({text,voice});return new Blob([text]);},async blobs=>new Blob(blobs));
 assert.deepEqual(calls,speechTurns(scene).map(({text,voice})=>({text,voice})));
 await assert.rejects(passagePlayback(scene,undefined,{},async()=>new Blob([]),async()=>assert.fail()),/empty audio/);
 await assert.rejects(passagePlayback(scene,undefined,{},async()=>new Blob(["turn"]),async()=>new Blob([])),/empty audio/);
});

test("the production preflight runs successfully with all network requests forbidden",async()=>{
 const {execFileSync}=await import("node:child_process");const {fileURLToPath}=await import("node:url");
 const output=execFileSync(process.execPath,["--experimental-strip-types","--import","data:text/javascript,globalThis.fetch=()=>{throw Error('Network forbidden in preflight')}",fileURLToPath(new URL("../scripts/rebuild-aligned-audio.mjs",import.meta.url)),"--check"],{encoding:"utf8",env:{...process.env,OPENAI_API_KEY:""}});
 assert.match(output,/PASS: 121 authored audio scenes/);assert.match(output,/No audible correctness/);
});

test("all twenty-four generated French starter recordings have exact turns, checksums and usable local playback",async()=>{
 const {readFile}=await import("node:fs/promises"),{announcements}=await import("../content/announcements.ts"),{audioRecordings}=await import("../content/audio-recordings.ts");
 const catalog=[...frenchBeginnerPassages,...announcements.filter(p=>p.language==="fr"&&["A1","A2"].includes(p.level)).map(p=>({...p,id:"announcement:"+p.id,speechStyle:"beginner",speaker:{name:"Narrator",voice:"marin"}}))];
 assert.equal(catalog.length,24);let count=0;
 for(const p of catalog){
  const recording=audioRecordings[p.id];assert.ok(recording,p.id);
  const wave=await readFile(new URL("../public"+recording.file,import.meta.url)),clips=validateRecordingAssembly(p,recording,wave);
  for(const [i,pcm] of clips.entries())assert.equal(hash(pcm),recording.turns[i].pcmSha256,p.id+" turn "+i);
  const played=await passagePlayback(p,undefined,audioRecordings,async()=>assert.fail("Unexpected API call"),async()=>assert.fail("Unexpected reassembly"),async()=>new Response(wave,{headers:{"Content-Type":"audio/wav"}}));
  assert.equal(played.size,wave.length);
  assert.equal(recording.processing.kind,"pitch-preserving-atempo-v1");
  const rate=p.text.trim().split(/\s+/u).length/clips.reduce((n,pcm)=>n+pcm.length/48000,0)*60;
  assert.ok(rate>=(p.level==="A1"?85:95)&&rate<=(p.level==="A1"?100:110),p.id+" pace "+rate);
  count+=clips.length;
 }
 assert.equal(count,97);
});
