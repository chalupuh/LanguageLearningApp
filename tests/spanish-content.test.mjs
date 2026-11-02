import test from "node:test";
import assert from "node:assert/strict";
import {announcements} from "../content/announcements.ts";
import {situations} from "../content/situations.ts";
import {challengeDetails,listeningQuestions,scoreListening} from "../content/listening-challenges.ts";

test("Spanish real-life listening has authored announcements and service situations",()=>{
 const notices=announcements.filter(item=>item.language==="es");
 const service=situations.filter(item=>item.language==="es");
 assert.equal(notices.length,6);
 assert.equal(service.length,8);
 assert.ok(notices.some(item=>item.level==="A1")&&notices.some(item=>item.level==="A2"));
 assert.ok(service.every(item=>item.category==="situations"));
 for(const item of [...notices,...service]){
  assert.equal(item.questions.length,3,item.id);
  assert.equal(challengeDetails(item)?.length,3,item.id);
  const close=listeningQuestions(item,"close"),written=listeningQuestions(item,"write");
  assert.equal(close.length,3);assert.equal(written.length,3);
  assert.equal(scoreListening(item,"write",written.map(question=>question.accepted[0])).score,100,item.id);
 }
});

