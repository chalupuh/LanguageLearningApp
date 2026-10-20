// Paid, opt-in audit. Reuses checksum-addressed results; never sends the expected script.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {audioRecordings} from '../content/audio-recordings.ts';
const model=process.argv.find(a=>a.startsWith('--model='))?.slice(8)||'gpt-4o-mini-transcribe', cache='work/predeployment-qa/asr';
if(!['gpt-4o-mini-transcribe','whisper-1'].includes(model))throw Error('Unsupported audit model');
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const report=JSON.parse(await readFile('docs/french-audio-production-report.json','utf8'));
if(only?.some(id=>!report.scenes.some(scene=>scene.id===id)))throw Error('Unknown transcription audit scene');
for(const scene of report.scenes){if(audioRecordings[scene.id]?.file!==scene.file||audioRecordings[scene.id]?.signature!==scene.signature)throw Error('Refresh the production report before auditing changed audio: '+scene.id);}
await mkdir(cache,{recursive:true});
const normalize=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’']/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/);
function distance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];}
const scenes=[];
for(const scene of report.scenes){
 if(only&&!only.includes(scene.id))continue;
 const bytes=await readFile('public'+scene.file),sha=createHash('sha256').update(bytes).digest('hex');
 if(sha!==scene.sha256)throw Error('Asset changed: '+scene.id);
 const path=`${cache}/${sha}-${model}.json`;let result;
 try{result=JSON.parse(await readFile(path,'utf8'));}catch{
  if(!process.env.OPENAI_API_KEY)throw Error('Missing authorized API credential');
  const form=new FormData();form.set('file',new Blob([bytes],{type:'audio/wav'}),scene.id+'.wav');form.set('model',model);form.set('language','fr');form.set('response_format','json');
  const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form,signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('Transcription HTTP '+response.status+' for '+scene.id);
  result=await response.json();if(typeof result.text!=='string')throw Error('Invalid transcription result');
  await writeFile(path,JSON.stringify({text:result.text,model,sha256:sha,checkedAt:new Date().toISOString()},null,2));
 }
 const expected=scene.turns.map(t=>t.text).join(' '),a=normalize(expected),b=normalize(result.text),edits=distance(a,b);
 scenes.push({id:scene.id,sha256:sha,expected,transcribed:result.text,wordEdits:edits,expectedWords:a.length,wordErrorRate:edits/a.length,status:edits?'REVIEW DIFFERENCES':'EXACT NORMALIZED MATCH'});
 console.log(scene.id+': '+edits+' token edits');
}
await writeFile(`docs/french-transcription-qa${model==='whisper-1'?'-crosscheck':''}.json`,JSON.stringify({generatedAt:new Date().toISOString(),model,method:'Unprompted whole-scene French ASR, case/accent/punctuation normalized; token edit distance. Numeric spelling differences require manual comparison. ASR is not human pronunciation or voice-identity review.',documentation:'https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create',scenes},null,2)+'\n');
