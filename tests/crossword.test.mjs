import test from "node:test";
import assert from "node:assert/strict";
import {crosswordLevels,crosswordTopics,entriesForLevel} from "../content/french-crosswords.ts";
import {generateCrossword,normalizeCrosswordAnswer} from "../lib/crossword.ts";

test("normalizes French accents and punctuation for a crossword grid",()=>{
 assert.equal(normalizeCrosswordAnswer("l'été"),"LETE");
 assert.equal(normalizeCrosswordAnswer("ambiguïté"),"AMBIGUITE");
});

test("generates a connected, reproducible puzzle for every CEFR band",()=>{
 for(const level of crosswordLevels){
  const first=generateCrossword(entriesForLevel(level),{level,seed:`test-${level}`,size:15,wordCount:8});
  const second=generateCrossword(entriesForLevel(level),{level,seed:`test-${level}`,size:15,wordCount:8});
  assert.deepEqual(first,second);
  assert.ok(first.words.length>=5,`${level} should place at least five words`);
  const occupied=new Map();
  for(const word of first.words)for(let i=0;i<word.answerKey.length;i++){
   const key=`${word.row+(word.direction==="down"?i:0)},${word.col+(word.direction==="across"?i:0)}`;
   const previous=occupied.get(key);if(previous)assert.equal(previous,word.answerKey[i]);else occupied.set(key,word.answerKey[i]);
  }
  for(const word of first.words.slice(1))assert.ok([...word.answerKey].some((letter,i)=>{
   const key=`${word.row+(word.direction==="down"?i:0)},${word.col+(word.direction==="across"?i:0)}`;
   return first.words.some(other=>other.id!==word.id&&[...other.answerKey].some((otherLetter,j)=>otherLetter===letter&&`${other.row+(other.direction==="down"?j:0)},${other.col+(other.direction==="across"?j:0)}`===key));
  }),`${level} words should connect`);
 }
});

test("supports quick, standard and challenge board sizes at every level",()=>{
 const sizes=[{size:13,wordCount:7,minimum:6},{size:15,wordCount:9,minimum:8},{size:17,wordCount:11,minimum:9}];
 for(const level of crosswordLevels)for(const option of sizes){
  const puzzle=generateCrossword(entriesForLevel(level),{level,seed:`size-${level}-${option.size}`,size:option.size,wordCount:option.wordCount});
  assert.equal(puzzle.width,option.size);
  assert.equal(puzzle.height,option.size);
  assert.ok(puzzle.words.length>=option.minimum,`${level} on ${option.size} should place enough words`);
 }
});

test("every level includes travel, food, grammar and listening vocabulary",()=>{
 for(const level of crosswordLevels){
  const entries=entriesForLevel(level);
  assert.ok(entries.length>=20,`${level} should have an expanded bank`);
  for(const topic of crosswordTopics.filter(topic=>topic!=="mixed"))assert.ok(entries.filter(entry=>entry.focus===topic).length>=2,`${level} needs ${topic} words`);
 }
});
