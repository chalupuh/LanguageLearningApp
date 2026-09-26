import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source=await readFile(new URL("../lib/phrase-context.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {sentenceForPhrase,validPhraseContexts}=await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

test("saved highlights keep their surrounding French sentence",()=>{
 assert.equal(sentenceForPhrase("Il pleut. Je prends le train demain matin. À bientôt !","le train"),"Je prends le train demain matin.");
 const caption=Array.from({length:90},(_,i)=>`mot${i}`).join(" ");
 const excerpt=sentenceForPhrase(caption,"mot45");
 assert.ok(excerpt.includes("mot45"));
 assert.ok(excerpt.length<360);
 assert.equal(sentenceForPhrase("","bonjour"),"bonjour");
});

test("older text-only phrase records load without context, while new context is bounded",()=>{
 assert.deepEqual(validPhraseContexts(undefined),{});
 assert.deepEqual(validPhraseContexts(["old phrase"]),{});
 assert.deepEqual(validPhraseContexts({bonjour:{sentence:"Bonjour, ça va ?",source:"library:cafe"},broken:{sentence:12,source:"studio"}}),{bonjour:{sentence:"Bonjour, ça va ?",source:"library:cafe"}});
 assert.equal(validPhraseContexts({long:{sentence:"x".repeat(500),source:"a".repeat(100)}}).long.sentence.length,400);
});
