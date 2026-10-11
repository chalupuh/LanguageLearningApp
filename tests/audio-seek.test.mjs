import test from 'node:test';
import assert from 'node:assert/strict';
import {seekTime,playbackInterrupted} from '../lib/audio-seek.ts';
test('seeking uses actual media duration, including cold-load intent',()=>{
 assert.equal(seekTime(.5,90),45);
 assert.equal(seekTime(.25,240),60);
 assert.equal(seekTime(-1,90),0);
 assert.equal(seekTime(1,90),89.95);
 assert.equal(seekTime(2,90),89.95);
});
test('unknown and invalid media values never produce an invalid currentTime',()=>{
 for(const duration of [0,-1,NaN,Infinity])assert.equal(seekTime(.5,duration),0);
 for(const fraction of [NaN,Infinity,-Infinity])assert.equal(seekTime(fraction,90),0);
 assert.equal(seekTime(1,.01),0);
});
test('intentional play aborts are pauses, not unavailable audio',()=>{
 assert.equal(playbackInterrupted(new DOMException('play interrupted by pause','AbortError')),true);
 assert.equal(playbackInterrupted({name:'AbortError'}),true);
 for(const error of [new Error('offline'),{name:'NotSupportedError'},null,undefined,'AbortError'])assert.equal(playbackInterrupted(error),false);
});
