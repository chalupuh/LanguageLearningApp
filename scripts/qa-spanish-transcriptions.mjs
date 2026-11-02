// Paid, opt-in audit. Reuses checksum-addressed results and never sends the expected script.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {audioRecordings} from '../content/audio-recordings.ts';
import {spanishBeginnerPassages} from '../content/spanish-beginner.ts';
import {announcements} from '../content/announcements.ts';
import {situations} from '../content/situations.ts';

const model='gpt-4o-mini-transcribe',cache='work/predeployment-qa/asr';
const requested=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7).split(',');
const catalog=[...spanishBeginnerPassages.map(item=>({...item,audioId:item.id})),...announcements.filter(item=>item.language==='es').map(item=>({...item,audioId:'announcement:'+item.id})),...situations.filter(item=>item.language==='es').map(item=>({...item,audioId:'announcement:'+item.id}))];
const selected=requested?catalog.filter(item=>requested.includes(item.id)):catalog;
if(requested&&selected.length!==new Set(requested).size)throw Error('Unknown Spanish transcription audit scene');
const env=await readFile(new URL('../.env.local',import.meta.url),'utf8').catch(()=>'');
const key=process.env.OPENAI_API_KEY||env.split(/\r?\n/).find(line=>/^\s*OPENAI_API_KEY\s*=/.test(line))?.replace(/^\s*OPENAI_API_KEY\s*=\s*/,'').trim().replace(/^(["'])(.*)\1$/,'$2');
if(!key)throw Error('Missing authorized API credential');
await mkdir(cache,{recursive:true});
const normalize=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’']/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/).filter(Boolean);
function distance(a,b){let row=Array.from({length:b.length+1},(_,index)=>index);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next}return row[b.length]}
const scenes=[];
for(const scene of selected){
 const recording=audioRecordings[scene.audioId];if(!recording)throw Error('Missing bundled recording: '+scene.audioId);
 const bytes=await readFile(new URL('../public'+recording.file,import.meta.url)),sha=createHash('sha256').update(bytes).digest('hex'),path=`${cache}/${sha}-${model}-es.json`;let result;
 try{result=JSON.parse(await readFile(path,'utf8'))}catch{
  const form=new FormData();form.set('file',new Blob([bytes],{type:'audio/wav'}),scene.id+'.wav');form.set('model',model);form.set('language','es');form.set('response_format','json');
  const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form,signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('Transcription HTTP '+response.status+' for '+scene.id);
  result=await response.json();if(typeof result.text!=='string')throw Error('Invalid transcription result');
  await writeFile(path,JSON.stringify({text:result.text,model,sha256:sha,checkedAt:new Date().toISOString()},null,2));
 }
 const expected=scene.text.replace(/\n/g,' '),a=normalize(expected),b=normalize(result.text),edits=distance(a,b);
 scenes.push({id:scene.id,sha256:sha,expected,transcribed:result.text,wordEdits:edits,expectedWords:a.length,wordErrorRate:edits/Math.max(1,a.length),status:edits?'REVIEW DIFFERENCES':'EXACT NORMALIZED MATCH'});
 console.log(`${scene.id}: ${edits} token edits`);
}
await writeFile(new URL('../docs/spanish-transcription-qa.json',import.meta.url),JSON.stringify({generatedAt:new Date().toISOString(),model,method:'Unprompted whole-scene Spanish ASR with case, accent, and punctuation normalization. Token differences require review; ASR is not a native-speaker pronunciation or voice-identity review.',scenes},null,2)+'\n');
