import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {swedishWordClues} from "../content/swedish-word-help.ts";
import {speechVersion,speechInstructions} from "../lib/speech-policy.ts";
import {swedishPassages} from "../content/swedish-passages.ts";
import {validSwedishLabState,normalizeSwedish,evaluateSwedishDictation,sentenceAnswerIsCorrect,dailySwedishIndex} from "../lib/swedish-lab.ts";

const content=fs.readFileSync(new URL("../content/swedish-lab.ts",import.meta.url),"utf8");

test("Swedish word clues are bounded, accent-aware and match whole words",()=>{
 assert.deepEqual(swedishWordClues("TACK!"),[{word:"tack",meaning:"thank you / please"}]);
 assert.equal(swedishWordClues("A\u0308R")[0].word,"är");
 assert.deepEqual(swedishWordClues("stackars"),[]);
 assert.equal(swedishWordClues("Hej jag vill ha kaffe med lite mjölk tack").length,3);
});

test("Swedish pronunciation changes invalidate Swedish caches without changing French",()=>{
 assert.equal(speechVersion("fr"),"multilingual-v2");
 assert.notEqual(speechVersion("sv"),speechVersion("fr"));
 assert.match(speechInstructions("sv"),/t i tack/);
 assert.match(speechInstructions("sv"),/ä-vokal/);
});

test("all Swedish lessons use complete versioned mono PCM recordings",()=>{
 assert.equal(swedishPassages.length,12);
 for(const passage of swedishPassages){
  assert.ok(passage.audioFile.includes(speechVersion("sv")));
  const audio=fs.readFileSync(new URL('../public'+passage.audioFile,import.meta.url));
  assert.equal(audio.toString('ascii',0,4),'RIFF');
  assert.equal(audio.toString('ascii',8,12),'WAVE');
  assert.equal(audio.readUInt16LE(22),1);
  assert.equal(audio.readUInt32LE(24),24000);
  assert.equal(audio.readUInt16LE(34),16);
  assert.equal(audio.readUInt32LE(40),audio.length-44);
  assert.ok((audio.length-44)/48000>5,passage.id);
 }
});

test("the Swedish lab has a complete beginner pathway",()=>{
  assert.match(content,/number:"07"/);
  for(const lesson of ["sv-hej","sv-kaffe","sv-dagen","sv-frukost","sv-middag","sv-slut","sv-priset","sv-vagen","sv-bussen","sv-affaren","sv-oppet","sv-hjalp"])assert.match(content,new RegExp(`"${lesson}"`));
  assert.equal((content.match(/article:"(?:en|ett)"/g)||[]).length,12);
  assert.equal((content.match(/id:"minute-/g)||[]).length,8);
  assert.equal((content.match(/id:"dict-/g)||[]).length,6);
});

test("sentence builder accepts only the taught order",()=>{
  assert.equal(sentenceAnswerIsCorrect(["I dag","jobbar","jag"],[["I dag","jobbar","jag"]]),true);
  assert.equal(sentenceAnswerIsCorrect(["I dag","jag","jobbar"],[["I dag","jobbar","jag"]]),false);
});

test("dictation distinguishes Swedish marks from other listening errors",()=>{
  assert.equal(evaluateSwedishDictation("Affären är stängd!","Affären är stängd."),"correct");
  assert.equal(evaluateSwedishDictation("Affaren ar stangd","Affären är stängd."),"marks");
  assert.equal(evaluateSwedishDictation("Affären är öppen","Affären är stängd."),"retry");
});

test("saved Swedish lab state is bounded and validated",()=>{
  assert.deepEqual(validSwedishLabState({completedActivityIds:["one","one",3],masteredNounIds:["bord"],dailyMinuteDates:["2026-10-01","yesterday"],completedMissionIds:["cafe"]}),{completedActivityIds:["one"],masteredNounIds:["bord"],dailyMinuteDates:["2026-10-01"],completedMissionIds:["cafe"]});
  assert.equal(dailySwedishIndex("2026-10-01",8)>=0,true);
});
