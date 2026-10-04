import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {validSwedishLabState,normalizeSwedish,evaluateSwedishDictation,sentenceAnswerIsCorrect,dailySwedishIndex} from "../lib/swedish-lab.ts";

const content=fs.readFileSync(new URL("../content/swedish-lab.ts",import.meta.url),"utf8");

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
