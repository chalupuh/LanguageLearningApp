import test from "node:test";
import assert from "node:assert/strict";
import {crosswordLevels,entriesForLevel} from "../content/french-crosswords.ts";
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
