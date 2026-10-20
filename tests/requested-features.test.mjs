import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {passages} from '../content/passages.ts';
import {announcements} from '../content/announcements.ts';
import {situations} from '../content/situations.ts';
import {parisianVariant} from '../content/parisian-french.ts';
import {audioRecordings} from '../content/audio-recordings.ts';
import {speechTurns,recordingSignature} from '../lib/passage-speech.ts';
import {speechVersion,speechInstructions} from '../lib/speech-policy.ts';
import {listeningQuestions,scoreListening,normalizeListeningAnswer,challengeDetails} from '../content/listening-challenges.ts';
import {listeningSummary,validWritingFeedback} from '../lib/writing-feedback.ts';

test('all six poems have a new male recording; every everyday French passage has a separate Parisian adaptation with matching roles',()=>{
 const poems=passages.filter(p=>p.poem);assert.equal(poems.length,6);
 for(const p of poems){assert.equal(p.speaker.name,'Julien');assert.equal(p.speaker.voice,'cedar');assert.equal(audioRecordings[p.id].signature,recordingSignature(p));assert.equal(parisianVariant(p),null);}
 let count=0;for(const p of passages){const v=parisianVariant(p);if(p.language==='sv'||p.poem||p.speechStyle==='beginner'){assert.equal(v,null);continue;}count++;assert.ok(v,p.id);assert.notEqual(v.text,p.text);assert.equal(v.speechStyle,'parisian');assert.deepEqual(speechTurns(v).map(t=>[t.role,t.voice]),speechTurns(p).map(t=>[t.role,t.voice]));assert.equal(audioRecordings[v.id].signature,recordingSignature(v));}
 assert.equal(count,23);assert.notEqual(speechVersion('fr','parisian'),speechVersion('fr'));assert.equal(speechVersion('sv','parisian'),speechVersion('sv'));assert.match(speechInstructions('fr','parisian'),/faster|Brisk/);
});
test('all 24 French checks have close distractors and independently authored written-answer prompts',()=>{
 const catalog=[...announcements,...situations].filter(p=>p.language!=='sv'&&!['A1','A2'].includes(p.level));assert.equal(catalog.length,24);
 for(const item of catalog){
  const hard=listeningQuestions(item,'close'),written=listeningQuestions(item,'write');assert.equal(hard.length,3);assert.equal(written.length,3);assert.ok(challengeDetails(item));
  assert.equal(scoreListening(item,'close',hard.map(q=>q.answer)).score,100);assert.equal(scoreListening(item,'close',hard.map(q=>(q.answer+1)%3)).score,0);
  assert.equal(scoreListening(item,'write',written.map(q=>q.accepted[0])).score,100);
  assert.equal(scoreListening(item,'write',written.map(()=>"completely wrong answer")).score,0);
  hard.forEach((q,i)=>{assert.equal(new Set(q.options).size,3,item.id);assert.equal(q.options[q.answer],item.questions[i].options[item.questions[i].answer]);});
  assert.throws(()=>scoreListening(item,'write',['','','']));assert.throws(()=>scoreListening(item,'close',["0","1","2"]));
 }
 assert.equal(normalizeListeningAnswer('CÔRRIGÉE!'),'corrigee');
 const mall=announcements.find(p=>p.id==='mall-closing');assert.equal(scoreListening(mall,'write',['in five minutes','the checkouts','exit']).score,100);
 assert.throws(()=>listeningQuestions(announcements.find(p=>p.language==='sv'),'close'));
});
test('English and French summaries remain separate and writing feedback is bounded',()=>{
 assert.equal(listeningSummary('A woman orders coffee.','Une femme commande un café.'),'English: A woman orders coffee.\nFrench: Une femme commande un café.');
 assert.equal(listeningSummary('','Une femme commande.'),'French: Une femme commande.');assert.equal(listeningSummary('  ',''),'');
 const valid={score:80,summary:'Check agreement.',corrections:[{original:'un café chaud',improved:'un café chaud',explanation:'Already correct.'}],improvedVersion:'Elle commande un café chaud.'};
 assert.equal(validWritingFeedback(valid),true);for(const score of [-1,101,NaN,'90'])assert.equal(validWritingFeedback({...valid,score}),false);
 assert.equal(validWritingFeedback({...valid,corrections:Array(6).fill(valid.corrections[0])}),false);
});
test('writing endpoint validates before paid requests, separates grammar from story accuracy, and handles denied/invalid responses',async()=>{
 let code=await readFile(new URL('../app/api/writing/route.ts',import.meta.url),'utf8');
 code=code.replace('import {guardAiRequest,fetchAi} from "../ai-guard";','const {guardAiRequest,fetchAi}=globalThis.__writingTest;').replace('import {validWritingFeedback} from "../../../lib/writing-feedback";','const {validWritingFeedback}=globalThis.__writingTest;');
 let calls=0,payload,denied=false,refusal=false;const oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-placeholder';
 globalThis.__writingTest={validWritingFeedback,guardAiRequest:async()=>denied?Response.json({error:'Sign in'},{status:401}):null,fetchAi:async(_url,options)=>{calls++;payload=JSON.parse(options.body);return Response.json({output:[{content:refusal?[{type:'refusal'}]:[{type:'output_text',text:JSON.stringify({score:65,summary:'Check the verb.',corrections:[{original:'je suis aller',improved:'je suis allé',explanation:'Use the past participle.'}],improvedVersion:'Hier, je suis allé au café.'})}]}]})}};
 const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,{POST}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 const request=text=>new Request('https://example.com/api/writing',{method:'POST',body:JSON.stringify({text})});
 try{assert.equal((await POST(request(''))).status,400);assert.equal(calls,0);denied=true;assert.equal((await POST(request('Hier je suis aller au café.'))).status,401);assert.equal(calls,0);denied=false;
  const r=await POST(request('Hier je suis aller au café.'));assert.equal(r.status,200);assert.equal((await r.json()).score,65);assert.match(payload.instructions,/Do not judge story accuracy/);assert.equal(JSON.parse(payload.input).french,'Hier je suis aller au café.');assert.equal(payload.text.format.strict,true);
  refusal=true;assert.equal((await POST(request('Hier je suis aller au café.'))).status,502);
 }finally{if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;delete globalThis.__writingTest;}
});
