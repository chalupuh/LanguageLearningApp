import test from "node:test";
import assert from "node:assert/strict";
import {courseForState,frenchAccess,frenchStage,requirements,starterRequirements,canHideBeginnerContent,frenchContentVisible,verifiedCourseCompletions} from "../lib/french-progression.ts";
import {frenchBeginnerPassages} from "../content/french-beginner.ts";
import {announcements} from "../content/announcements.ts";
import {speechTurns} from "../lib/passage-speech.ts";
import {speechInstructions,speechVersion} from "../lib/speech-policy.ts";
import {scoreListening} from "../content/listening-challenges.ts";
test("French stages require every distinct saved loop in order and preserve legacy learners",()=>{
 assert.equal(courseForState(null),"beginner-v2");assert.equal(courseForState({holidayTheme:"winter"}),"beginner-v2");
 for(const old of [{xp:825},{completed:["cafe"]},{preferences:{level:"B2"}}])assert.equal(courseForState(old),"legacy");
 assert.equal(courseForState({frenchCourse:"beginner-v2",completed:["cafe"]}),"beginner-v2");
 let done=[];assert.equal(frenchStage("beginner-v2",done),"A1");
 for(const [current,next] of [["A1","A2"],["A2","B1"],["B1","B2"]]){
  const ids=requirements[current];done.push(...ids.slice(0,-1));
  assert.equal(frenchStage("beginner-v2",done),current);assert.equal(frenchAccess(next,"beginner-v2",done),false);
  done.push(ids.at(-1));assert.equal(frenchStage("beginner-v2",done),next);assert.equal(frenchAccess(next,"beginner-v2",done),true);
 }
 assert.equal(frenchStage("beginner-v2",[...requirements.A2,...requirements.B1]),"A1");
 assert.equal(frenchStage("beginner-v2",Array(20).fill(requirements.A1[0])),"A1");
 assert.equal(frenchAccess("B2+","legacy",[]),true);assert.equal(frenchAccess("invalid","beginner-v2",[]),false);
 assert.equal(courseForState({frenchCourse:"beginner-v1"}),"beginner-v1");
 assert.equal(frenchStage("beginner-v1",starterRequirements.A1),"A2");
 assert.equal(frenchStage("beginner-v2",starterRequirements.A1),"A1");
 assert.equal(frenchStage("beginner-v1",[...starterRequirements.A1,...starterRequirements.A2]),"B1");
 assert.deepEqual(verifiedCourseCompletions([{kind:"announcement",source:"fr-a1-shop"},{kind:"observation",source:"library:cafe"},{kind:"loop",source:"library:fr-a1-cafe"},{kind:"review",source:"library:fr-a1-cafe"}]),["fr-a1-cafe"]);
});
test("French starter units are short, aligned and narrated slowly; A1 checks have fixed answers",()=>{
 assert.equal(frenchBeginnerPassages.filter(p=>p.level==="A1").length,8);assert.equal(frenchBeginnerPassages.filter(p=>p.level==="A2").length,8);
 for(const p of frenchBeginnerPassages){assert.equal(p.speechStyle,"beginner");assert.equal(speechTurns(p).map(t=>t.text).join("\n"),p.text);assert.ok(p.comprehensionPoints.length>=2);assert.ok(p.text.split(/\s+/).length<100);}
 assert.notEqual(speechVersion("fr","beginner"),speechVersion("fr"));assert.match(speechInstructions("fr","beginner"),/slow beginner pace/);
 const checks=announcements.filter(p=>p.language==="fr"&&p.level==="A1");assert.equal(checks.length,4);
 for(const item of checks)assert.equal(scoreListening(item,"standard",item.questions.map(q=>q.answer)).score,100);
});

test("advanced learners opt into lower tiers without changing access or beginner progression",async()=>{
 const {passages}=await import("../content/passages.ts"),{dailyPractice,defaultPreferences}=await import("../lib/daily-practice.ts");
 assert.equal(defaultPreferences.showBeginnerContent,false);
 const french=passages.filter(p=>(p.language||"fr")==="fr");
 const visible=show=>french.filter(p=>frenchContentVisible(p.level,"legacy",[],show));
 assert.ok(visible().length>0);assert.ok(visible().every(p=>!["A1","A2"].includes(p.level)));
 assert.equal(visible(true).filter(p=>["A1","A2"].includes(p.level)).length,16);
 assert.deepEqual(visible(false).map(p=>p.id),visible().map(p=>p.id));
 const plan=dailyPractice(visible(false),[],{"fr-a1-cafe":"2020-01-01"},{},Date.now(),{preferences:defaultPreferences});
 assert.ok(!["A1","A2"].includes(plan.lesson.level));assert.equal(plan.review,undefined);
 assert.equal(frenchAccess("A1","legacy",[]),true,"Visibility must never lock advanced accounts out");
 assert.equal(canHideBeginnerContent("beginner-v2",[]),false);assert.equal(frenchContentVisible("A1","beginner-v2",[],false),true);
 assert.equal(frenchContentVisible("A2","beginner-v2",[],true),false,"Visibility must not bypass unlocks");
 assert.equal(frenchContentVisible("A2","beginner-v2",requirements.A1,false),true);
 const progressed=[...requirements.A1,...requirements.A2];
 assert.equal(canHideBeginnerContent("beginner-v2",progressed),true);
 assert.equal(frenchContentVisible("A1","beginner-v2",progressed,false),false);
 assert.equal(frenchContentVisible("A1","beginner-v2",progressed,true),true);
});
