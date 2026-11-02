import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHandsFreeCommand,normalizeHandsFreeUtterance,handsFreeConfirmation} from '../lib/hands-free-commands.ts';
import {createHandsFreeSession,beginHandsFreeSession,markHandsFreePlaying,applyHandsFreeCommand,recordHandsFreeRecognitionFailure,recordHandsFreePosition,restoreHandsFreeSession,trimHandsFreeQueue,buildHandsFreeQueue,validHandsFreeSession} from '../lib/hands-free-session.ts';
const queue=[{id:'one',title:'At the café',audioUrl:'/audio/one.mp3',language:'es',durationSeconds:300,offline:true},{id:'two',title:'At the station',audioUrl:'/audio/two.mp3',language:'es',durationSeconds:420,offline:true}];

test('bounded command parser accepts explicit commands and rejects conversation or answers',()=>{
 assert.equal(normalizeHandsFreeUtterance('  Normal speed! '),'normal speed');
 for(const [spoken,command] of [['repeat that','repeat'],['slow down','slower'],['resume','continue'],['end session','stop-session'],['previous','back']])assert.equal(parseHandsFreeCommand(spoken),command);
 for(const spoken of ['I would like coffee','maybe go to the station next','this answer says pause',''])assert.equal(parseHandsFreeCommand(spoken),null);
 assert.equal(parseHandsFreeCommand('submit'),null);assert.equal(parseHandsFreeCommand('submit','answer'),'submit');assert.match(handsFreeConfirmation('help'),/repeat/);
});

test('session begins only through parked setup and never awards progress',()=>{
 let state=createHandsFreeSession(queue,1);assert.equal(state.status,'parked-setup');assert.equal('xp' in state,false);assert.equal('completed' in state,false);
 state=beginHandsFreeSession(state,2);assert.equal(state.status,'countdown');state=markHandsFreePlaying(state,3);assert.equal(state.status,'playing');
 state=recordHandsFreePosition(state,31,4);assert.equal(state.positionSeconds,31);state=applyHandsFreeCommand(state,'slower',5);assert.equal(state.rate,.75);
 state=applyHandsFreeCommand(state,'next',6);assert.equal(state.index,1);assert.equal(state.status,'countdown');assert.equal(state.positionSeconds,0);
 state=applyHandsFreeCommand(state,'next',7);assert.equal(state.status,'review');assert.equal(state.index,1);
});

test('two failed recognitions pause safely and a valid command clears failures',()=>{
 let state=markHandsFreePlaying(beginHandsFreeSession(createHandsFreeSession(queue,1),2),3);state=recordHandsFreeRecognitionFailure(state,4);assert.equal(state.status,'playing');assert.equal(state.recognitionFailures,1);
 state=recordHandsFreeRecognitionFailure(state,5);assert.equal(state.status,'paused');assert.equal(state.recognitionFailures,2);
 state=applyHandsFreeCommand(state,'continue',6);assert.equal(state.status,'countdown');assert.equal(state.recognitionFailures,0);
});

test('recovery validates data, pauses active capture, and preserves queue position',()=>{
 let state=markHandsFreePlaying(beginHandsFreeSession(createHandsFreeSession(queue,1),2),3);state=recordHandsFreePosition(state,44,4);assert.equal(validHandsFreeSession(state),true);
 const restored=restoreHandsFreeSession(JSON.stringify(state),10);assert.equal(restored.status,'paused');assert.equal(restored.positionSeconds,44);assert.equal(restored.index,0);
 assert.equal(restoreHandsFreeSession('{bad'),null);assert.equal(restoreHandsFreeSession(JSON.stringify({...state,rate:4})),null);
});

test('session length trims at item boundaries while always retaining the first item',()=>{
 assert.deepEqual(trimHandsFreeQueue(queue,5).map(item=>item.id),['one']);assert.deepEqual(trimHandsFreeQueue(queue,15).map(item=>item.id),['one','two']);
});

test('short bundled clips repeat into the requested session duration without another download',()=>{
 const clips=[{...queue[0],durationSeconds:20},{...queue[1],durationSeconds:25}],planned=buildHandsFreeQueue(clips,5);
 assert.ok(planned.length>clips.length);assert.ok(planned.reduce((sum,item)=>sum+(item.durationSeconds||0),0)>=270);
 assert.deepEqual(planned.slice(0,4).map(item=>item.id),['one','two','one','two']);
 assert.equal(buildHandsFreeQueue([],15).length,0);
});

test('the app exposes a parked, preflighted hands-free mode without progress awards',async()=>{
 const [page,view]=await Promise.all([readFile(new URL('../app/page.tsx',import.meta.url),'utf8'),readFile(new URL('../app/hands-free-session.tsx',import.meta.url),'utf8')]);
 assert.match(page,/"handsfree"/);assert.match(page,/HandsFreeSession/);
 assert.match(view,/Set up while parked/);assert.match(view,/for\(const item of items\.slice\(0,uniqueCount\)\).*await loadAudio\(item\)/s);
 assert.match(view,/mediaSession\.setActionHandler/);assert.match(view,/parseHandsFreeCommand/);
 assert.match(view,/setPositionState/);assert.match(view,/positionSeconds/);assert.match(view,/buildHandsFreeQueue/);
 assert.match(view,/No lesson completion or XP was awarded/);assert.doesNotMatch(view,/record\(|onComplete=/);
});

test('spoken recall is explicitly bounded, transcript-only, and deferred to parked review',async()=>{
 const view=await readFile(new URL('../app/hands-free-session.tsx',import.meta.url),'utf8');
 assert.match(view,/Spoken recall between recordings/);assert.match(view,/20000/);
 assert.match(view,/Say submit, try again, or skip/);assert.match(view,/,"answer"\)/);
 assert.match(view,/Review when parked/);assert.match(view,/raw cabin audio is never saved/);
 assert.match(view,/\.filter\(validAttempt\)\.slice\(-30\)/);assert.doesNotMatch(view,/MediaRecorder|getUserMedia|audioBlob/);
});
