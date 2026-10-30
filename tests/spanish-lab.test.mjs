import test from "node:test";
import assert from "node:assert/strict";
import {spanishBeginnerPassages} from "../content/spanish-beginner.ts";
import {evaluateSpanishDictation,normalizeSpanish,validSpanishLabState} from "../lib/spanish-lab.ts";
import {speechInstructions,speechVersion,SPANISH_SPEECH_VERSION} from "../lib/speech-policy.ts";
import {speechTurns} from "../lib/passage-speech.ts";

test("Spanish beginner track contains balanced A1 and A2 lessons",()=>{
 assert.equal(spanishBeginnerPassages.length,12);
 assert.equal(spanishBeginnerPassages.filter(item=>item.level==="A1").length,6);
 assert.equal(spanishBeginnerPassages.filter(item=>item.level==="A2").length,6);
 assert.ok(spanishBeginnerPassages.every(item=>item.language==="es"&&item.dialogue?.length&&item.cast));
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
