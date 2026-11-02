import test from "node:test";
import assert from "node:assert/strict";
import {spanishBeginnerPassages} from "../content/spanish-beginner.ts";
import {evaluateSpanishDictation,normalizeSpanish,recommendSpanishNext,spanishPracticeEvidence,validSpanishLabState} from "../lib/spanish-lab.ts";
import {speechInstructions,speechVersion,SPANISH_SPEECH_VERSION} from "../lib/speech-policy.ts";
import {speechTurns} from "../lib/passage-speech.ts";

test("Spanish beginner track contains balanced A1 and A2 lessons",()=>{
 assert.equal(spanishBeginnerPassages.length,18);
 assert.equal(spanishBeginnerPassages.filter(item=>item.level==="A1").length,8);
 assert.equal(spanishBeginnerPassages.filter(item=>item.level==="A2").length,10);
 assert.ok(spanishBeginnerPassages.every(item=>item.language==="es"&&item.dialogue?.length&&item.cast));
 assert.equal(spanishBeginnerPassages.filter(item=>item.audioFile).length,18,"Every published Spanish lesson must have bundled audio");
 for(const passage of spanishBeginnerPassages)assert.equal(speechTurns(passage).map(turn=>turn.text).join("\n"),passage.text);
});

test("Spanish text and progress validation preserve accents and isolate safe values",()=>{
 assert.equal(normalizeSpanish("¡Dónde está, la estación!"),"dónde está la estación");
 assert.equal(evaluateSpanishDictation("¿Dónde está la estación?","¿Dónde está la estación?"),"correct");
 assert.equal(evaluateSpanishDictation("Donde esta la estacion","¿Dónde está la estación?"),"retry");
 assert.deepEqual(validSpanishLabState({completedActivityIds:["r-rr","r-rr",4],masteredNounIds:["la estación"],dailyMinuteDates:["2026-10-30","today"],completedMissionIds:["cafe"]}),{completedActivityIds:["r-rr"],masteredNounIds:["la estación"],dailyMinuteDates:["2026-10-30"],completedMissionIds:["cafe"]});
});

test("Spanish speech policy is explicitly neutral Latin American Spanish",()=>{
 assert.equal(speechVersion("es","beginner"),SPANISH_SPEECH_VERSION);
 assert.match(speechInstructions("es"),/español latinoamericano neutro/i);
 assert.match(speechInstructions("es"),/seseo/i);
});

test("Spanish Lab reports practice evidence and recommends the next unfinished area",()=>{
 const state=validSpanishLabState({completedActivityIds:["r-rr","dictation-station"],masteredNounIds:["la estación"],completedMissionIds:["cafe"]});
 assert.deepEqual(spanishPracticeEvidence(["es-hola","es-cafe"],state),{lessons:2,vocabulary:1,soundContrasts:1,dictations:1,missions:1,total:6});
 assert.deepEqual(recommendSpanishNext(["es-hola"],state,["es-hola","es-cafe"]),{area:"lesson",id:"es-cafe",message:"Continue your guided path with the next conversation."});
 const allLessons=["es-hola","es-cafe"];
 assert.equal(recommendSpanishNext(allLessons,state,allLessons).area,"words");
 const complete=validSpanishLabState({completedActivityIds:["r-rr","n-nye","stress","dictation-station","dictation-cafe","dictation-directions","dictation-plans"],masteredNounIds:["a","b","c","d","e","f"],completedMissionIds:["cafe","directions","plans"]});
 assert.equal(recommendSpanishNext(allLessons,complete,allLessons).area,"review");
});
