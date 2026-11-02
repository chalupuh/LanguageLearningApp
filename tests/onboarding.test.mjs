import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const root=new URL("../",import.meta.url);

test("Today greets learners in the selected language",async()=>{
 const page=await readFile(new URL("app/page.tsx",root),"utf8");
 assert.match(page,/language==="sv"\?"Hej!":language==="es"\?"¡Hola!":"Bonjour !"/);
});

test("first-time tutorial explains navigation, syncing, feedback and can be reopened",async()=>{
 const [tour,page,css,releases]=await Promise.all([
  readFile(new URL("app/first-time-tutorial.tsx",root),"utf8"),
  readFile(new URL("app/page.tsx",root),"utf8"),
  readFile(new URL("app/tutorial.css",root),"utf8"),
  readFile(new URL("content/releases.ts",root),"utf8"),
 ]);
 for(const label of ["Today","Library","Calendar and Progress","Progress synced","feature request or bug report"])assert.match(tour,new RegExp(label));
 assert.match(tour,/aria-modal="true"/);assert.match(tour,/event\.key==="Escape"/);assert.match(tour,/event\.key!=="Tab"/);
 assert.match(tour,/crypto\.subtle\.digest\("SHA-256"/);assert.match(tour,/localStorage\.setItem\(storageKey,"done"\)/);
 assert.match(page,/Show me around the app/);assert.match(page,/setTutorialRequest\(value=>value\+1\)/);
 assert.match(css,/@media\(max-width:580px\)/);assert.match(css,/focus-visible/);
 assert.match(releases,/2026-11-01-spanish-welcome/);assert.match(releases,/¡Hola! Spanish is ready/);
});
