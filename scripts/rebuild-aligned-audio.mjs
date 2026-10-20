import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {audioRecordings as existingRecordings} from '../content/audio-recordings.ts';
import {passages} from '../content/passages.ts';
import {parisianVariant} from '../content/parisian-french.ts';
import {announcements} from '../content/announcements.ts';
import {situations} from '../content/situations.ts';
import {speechTurns,recordingSignature,pcmWave,RECORDING_VERSION} from '../lib/passage-speech.ts';
import {validateAudioCatalog,validatePcmTurn,validateTurnReceipt,validateRecordingAssembly} from '../lib/audio-recording-validation.ts';
import {speechInstructions} from '../lib/speech-policy.ts';
const catalog=[...passages,...passages.flatMap(p=>{const v=parisianVariant(p);return v?[v]:[]}),...[...announcements,...situations].map(p=>({...p,id:'announcement:'+p.id,speechStyle:p.language==='fr'&&['A1','A2'].includes(p.level)?'beginner':undefined,speaker:{name:'Narrator',voice:'marin'}}))];
// Preflight the entire batch before reading credentials or making any paid call.
validateAudioCatalog(catalog);
if(process.argv.includes('--check')){
 console.log(`PASS: ${catalog.length} authored audio scenes; speaker mappings, transcripts and turn identifiers validated. No audible correctness or listening review is established by this check.`);
 process.exit(0);
}
const env=await readFile(new URL('../.env.local',import.meta.url),'utf8').catch(()=> '');
const key=process.env.OPENAI_API_KEY||env.split(/\r?\n/).find(x=>/^\s*OPENAI_API_KEY\s*=/.test(x))?.replace(/^\s*OPENAI_API_KEY\s*=\s*/,'').trim().replace(/^(["'])(.*)\1$/,'$2');
if(!key)throw Error('Speech credentials missing');
const root=new URL(`../public/audio/passages/${RECORDING_VERSION}/`,import.meta.url),scratch=new URL('../work/aligned-audio/',import.meta.url);
await mkdir(root,{recursive:true});await mkdir(scratch,{recursive:true});
const selection=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7).split(',');
const repairs=process.argv.find(arg=>arg.startsWith('--repair-turns='))?.slice(15).split(',')||[];
for(const repair of repairs){const [id,index]=repair.split('@');const p=catalog.find(p=>p.id===id);if(!p||!/^\d+$/.test(index)||Number(index)>=speechTurns(p).length||!selection?.includes(id))throw Error('Repair must name a selected scene and valid zero-based turn');}
if(selection?.some(id=>!catalog.some(p=>p.id===id)))throw Error('Unknown scene in --only selection');
const records={...existingRecordings},queue=catalog.filter(p=>!selection||selection.includes(p.id));
async function worker(){while(queue.length){
 const p=queue.shift(),turns=speechTurns(p),signature=recordingSignature(p),language=p.language||'fr';
 const instructions=speechInstructions(language,p.speechStyle)+(p.poem?' Recite the poem thoughtfully, preserving its rhythm without singing.':' Read only the supplied words, as one speaker. Do not invent another voice or add words.');
 // Do not replace an accepted paced candidate with an older raw cache on resume.
 const registered=existingRecordings[p.id];
 const repairScene=repairs.some(r=>r.startsWith(p.id+'@'));
 if(!repairScene&&!process.argv.includes('--restore-raw-cache')&&p.speechStyle==='beginner'&&registered?.processing?.kind==='pitch-preserving-atempo-v1'&&registered.signature===signature){
  const wave=await readFile(new URL('../public'+registered.file,import.meta.url)),clips=validateRecordingAssembly(p,registered,wave);
  if(clips.some((pcm,index)=>registered.turns[index].pcmSha256!==createHash('sha256').update(pcm).digest('hex')))throw Error('Paced recording checksum mismatch');
  records[p.id]=registered;console.log('Preserved validated paced candidate '+p.id);continue;
 }
 const hash=createHash('sha256').update(signature+instructions).digest('hex').slice(0,24),filename=hash+'.wav',target=new URL(filename,root),meta=new URL(hash+'.json',scratch);
 try{
  if(repairScene)throw Error('Explicit repair');
  const saved=JSON.parse(await readFile(meta,'utf8')),wave=await readFile(target),clips=validateRecordingAssembly(p,saved,wave);
  if(clips.some((pcm,index)=>saved.turns[index].pcmSha256!==createHash('sha256').update(pcm).digest('hex')))throw Error('Cached turn checksum mismatch');
  records[p.id]=saved;console.log('Validated cached bytes '+p.id+' (listening review still required)');continue;
 }catch{}
 const parts=[],timings=[];let seconds=0;
 for(const [index,turn] of turns.entries()){
  const clip=new URL(hash+'-'+index+'.pcm',scratch),receiptFile=new URL(hash+'-'+index+'.turn.json',scratch);let pcm;
  try{
   if(repairs.includes(p.id+'@'+index))throw Error('Explicit turn repair');
   pcm=await readFile(clip);const receipt=JSON.parse(await readFile(receiptFile,'utf8'));
   validateTurnReceipt(p,index,receipt,pcm,createHash('sha256').update(pcm).digest('hex'));
  }catch{
   const targetedRepair=repairs.includes(p.id+'@'+index);
   const requestInstructions=targetedRepair&&process.argv.includes('--repair-clear-diction')?'Lis intégralement et exactement le texte français fourni, sans omettre aucun mot. Une seule voix française de France, calme et naturelle. Articule clairement les nombres et les formules de politesse. Ne reformule pas, ne raccourcis pas et n’ajoute rien.':instructions;
   const started=Date.now();console.log(`Requesting ${p.id} turn ${index+1} · ${turn.voice}`);
   const speed=targetedRepair&&process.argv.includes('--repair-clear-diction') ? 0.8 : 1;
   const r=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini-tts',voice:turn.voice,input:turn.text.normalize('NFC'),instructions:requestInstructions,speed,response_format:'pcm'}),signal:AbortSignal.timeout(targetedRepair?180000:90000)});
   if(!r.ok)throw Error(`Speech failed: ${p.id} turn ${index+1} (${r.status})`);
   pcm=Buffer.from(await r.arrayBuffer());console.log(`Received ${p.id} turn ${index+1} · ${pcm.length} bytes · ${Date.now()-started}ms`);validatePcmTurn(pcm);const receipt={signature,index,turn,pcmSha256:createHash('sha256').update(pcm).digest('hex'),instructions:requestInstructions,speed};
   validateTurnReceipt(p,index,receipt,pcm,receipt.pcmSha256);
   await writeFile(clip,pcm);await writeFile(receiptFile,JSON.stringify({...receipt,listeningReview:"pending"}));
  }
  validatePcmTurn(pcm); // Also check reused individual-turn cache files.
  timings.push({...turn,pcmSha256:createHash('sha256').update(pcm).digest('hex'),start:seconds,end:seconds+pcm.length/48000});seconds+=pcm.length/48000+.25;
  parts.push(pcm,Buffer.alloc(12000));console.log(`${p.id} ${index+1}/${turns.length} · ${turn.role} · ${turn.voice}`);
 }
 const wave=pcmWave(parts);
 const recording={signature,file:`/audio/passages/${RECORDING_VERSION}/${filename}`,turns:timings};
 validateRecordingAssembly(p,recording,wave,parts.filter((_,i)=>i%2===0));
 await writeFile(target,wave);records[p.id]=recording;
 await writeFile(meta,JSON.stringify(records[p.id]));console.log('Assembled candidate '+p.id+'; manual turn and scene listening reviews required before release');
}}
await Promise.all([worker(),worker(),worker()]);
await writeFile(new URL('../content/audio-recordings.ts',import.meta.url),'// Generated by scripts/rebuild-aligned-audio.mjs. Each line is synthesized separately.\nexport const audioRecordings:Record<string,{signature:string;file:string;turns:{id?:string;character?:string;role:string;voice:string;text:string;start:number;end:number;pcmSha256?:string;sourcePcmSha256?:string}[];processing?:{kind:string;targetWordsPerMinute:number;tempo:number;sourceFile:string;sourceSha256:string;humanListeningReview:string}}>= '+JSON.stringify(records,null,2)+';\n');
console.log(`Completed ${Object.keys(records).length} recordings.`);
