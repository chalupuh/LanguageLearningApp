import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {passages} from '../content/passages.ts';
import {speechTurns,recordingSignature,pcmWave} from '../lib/passage-speech.ts';
import {passagePlayback} from '../lib/passage-playback.ts';
import {audioRecordings} from '../content/audio-recordings.ts';
import {announcements} from '../content/announcements.ts';
import {situations} from '../content/situations.ts';
const croissant=passages.find(p=>p.id==='matin-croissants');

test('every dialogue matches its transcript and keeps a distinct stable voice for each speaker',()=>{
 for(const passage of passages){const turns=speechTurns(passage);assert.equal(turns.map(t=>t.text).join('\n'),passage.text);if(passage.dialogue){assert.equal(new Set(turns.map(t=>t.voice)).size,2);for(const turn of turns)assert.equal(speechTurns(passage,turn.text)[0].voice,turn.voice);}}
 assert.deepEqual(speechTurns(croissant).map(t=>t.voice),['cedar','marin','cedar','marin','cedar','marin']);
 assert.equal(speechTurns(passages.find(p=>p.id==='diner-deplacer'))[0].role,'Camille · Staff');
});
test('excerpts keep the original speaker, including an excerpt crossing a turn boundary',()=>{
 assert.equal(speechTurns(croissant,'Il ne m’en reste qu’un.')[0].voice,'marin');
 const text=croissant.dialogue[0].text+' '+croissant.dialogue[1].text;
 assert.deepEqual(speechTurns(croissant,text).map(t=>t.voice),['cedar','marin']);
 assert.throws(()=>speechTurns(croissant,'Words not present'));
 assert.throws(()=>speechTurns({...croissant,text:'Merci.\nMerci.',dialogue:[{role:'A',voice:'marin',text:'Merci.'},{role:'B',voice:'cedar',text:'Merci.'}]},'Merci.'),/multiple speakers/);
 assert.throws(()=>speechTurns({...croissant,dialogue:croissant.dialogue.map((t,i)=>i===2?{...t,voice:'marin'}:t)}),/changes voice/);
});
test('missing, stale, empty and HTML recordings fall back to ordered individual voices',async()=>{
 for(const response of [()=>Promise.reject(Error('offline')),()=>Promise.resolve(new Response('no',{status:404})),()=>Promise.resolve(new Response('<html>',{headers:{'Content-Type':'text/html'}})),()=>Promise.resolve(new Response('',{headers:{'Content-Type':'audio/wav'}}))]){
  const calls=[];let assembled=0;
  await passagePlayback(croissant,undefined,{[croissant.id]:{signature:recordingSignature(croissant),file:'/test.wav'}},async(text,voice,language)=>{calls.push({text,voice,language});return new Blob([text])},async parts=>{assembled=parts.length;return new Blob(parts)},response);
  assert.deepEqual(calls,croissant.dialogue.map(t=>({text:t.text,voice:t.voice,language:'fr'})));assert.equal(assembled,6);
 }
 let fetched=false,calls=[];
 await passagePlayback(croissant,undefined,{[croissant.id]:{signature:'old',file:'/old.wav'}},async(text,voice)=>{calls.push(voice);return new Blob([text])},async parts=>new Blob(parts),async()=>{fetched=true;throw Error()});
 assert.equal(fetched,false);assert.equal(calls.length,6);
});
test('matching recordings play without API requests; selected staff phrases retain their voice',async()=>{
 const recording={signature:recordingSignature(croissant),file:'/current.wav'};
 const blob=await passagePlayback(croissant,undefined,{[croissant.id]:recording},async()=>assert.fail('Unexpected API request'),async()=>assert.fail(),async()=>new Response('audio',{headers:{'Content-Type':'audio/wav'}}));assert.equal(await blob.text(),'audio');
 let voice;
 await passagePlayback(croissant,'Il ne m’en reste qu’un.',{},async(text,v)=>{voice=v;return new Blob([text])},async()=>assert.fail());assert.equal(voice,'marin');
});
test('PCM assembly retains all samples in one seekable WAV container',()=>{
 const a=Uint8Array.from([1,2,3,4]),b=Uint8Array.from([5,6]);const wave=pcmWave([a,b]);const view=new DataView(wave.buffer);
 assert.equal(new TextDecoder().decode(wave.slice(0,4)),'RIFF');assert.equal(view.getUint32(4,true),42);assert.equal(view.getUint32(40,true),6);assert.equal(view.getUint32(24,true),24000);assert.deepEqual(wave.slice(44),Uint8Array.from([1,2,3,4,5,6]));
});
test('all 74 catalog recordings contain every assigned turn in order, with valid audio samples and WAV lengths',async()=>{
 const catalog=[...passages,...[...announcements,...situations].map(p=>({...p,id:'announcement:'+p.id,speaker:{name:'Narrator',voice:'marin'}}))];
 assert.equal(catalog.length,74);
 for(const passage of catalog){
  const record=audioRecordings[passage.id];assert.ok(record,passage.id);assert.equal(record.signature,recordingSignature(passage),passage.id);
  const data=await readFile(new URL('../public'+record.file,import.meta.url));
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');assert.equal(data.readUInt32LE(4)+8,data.length);assert.equal(data.readUInt32LE(40)+44,data.length);
  assert.deepEqual(record.turns.map(({role,text,voice})=>({role,text,voice})),speechTurns(passage));
  let end=0;for(const turn of record.turns){assert.ok(turn.start>=end);assert.ok(turn.end>turn.start);const samples=data.subarray(44+Math.round(turn.start*48000),44+Math.round(turn.end*48000));assert.ok(samples.some(b=>b!==0),passage.id+' silent turn');end=turn.end;}
  assert.ok(Math.abs((data.length-44)/48000-end-.25)<.001,passage.id);
 }
});
