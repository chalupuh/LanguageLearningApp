import {readFile,writeFile,mkdir,stat} from "node:fs/promises";
import {swedishPassages} from "../content/swedish-passages.ts";
import {speechInstructions,SWEDISH_SPEECH_VERSION} from "../lib/speech-policy.ts";
const env=await readFile(new URL("../.env.local",import.meta.url),"utf8");
const key=process.env.OPENAI_API_KEY||env.split(/\r?\n/).find(x=>/^\s*OPENAI_API_KEY\s*=/.test(x))?.replace(/^\s*OPENAI_API_KEY\s*=\s*/,"").trim().replace(/^(["'])(.*)\1$/,"$2");
if(!key)throw Error("Speech credentials are missing");
const dir=new URL(`../public/audio/passages/${SWEDISH_SPEECH_VERSION}/`,import.meta.url);await mkdir(dir,{recursive:true});
const queue=[...swedishPassages];
async function generate(){while(queue.length){const p=queue.shift(),target=new URL(p.id+".wav",dir);try{if((await stat(target)).size>1000){console.log("Already generated: "+p.id);continue}}catch{}
 const clips=[Buffer.alloc(2400)];
 for(const turn of p.dialogue||[{text:p.text,voice:p.speaker.voice}]){
  const r=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini-tts",voice:turn.voice,input:turn.text.normalize("NFC"),instructions:speechInstructions("sv"),response_format:"pcm"}),signal:AbortSignal.timeout(90000)});
  if(!r.ok)throw Error(`Speech failed for ${p.id} (${r.status})`);clips.push(Buffer.from(await r.arrayBuffer()),Buffer.alloc(12000));
 }
 const pcm=Buffer.concat(clips),header=Buffer.alloc(44);header.write("RIFF");header.writeUInt32LE(36+pcm.length,4);header.write("WAVEfmt ",8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(24000,24);header.writeUInt32LE(48000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write("data",36);header.writeUInt32LE(pcm.length,40);await writeFile(target,Buffer.concat([header,pcm]));console.log("Refreshed: "+p.id);
}}
await Promise.all([generate(),generate()]);
