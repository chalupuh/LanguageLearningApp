import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const root=new URL("../",import.meta.url);

test("mobile navigation keeps primary learning destinations reachable without horizontal scrolling",async()=>{
 const [nav,css,page,layout]=await Promise.all([
  readFile(new URL("app/mobile-navigation.tsx",root),"utf8"),
  readFile(new URL("app/mobile-navigation.css",root),"utf8"),
  readFile(new URL("app/page.tsx",root),"utf8"),
  readFile(new URL("app/layout.tsx",root),"utf8"),
 ]);
 for(const destination of ["today","library","handsfree","progress"])assert.match(nav,new RegExp(`"${destination}"`));
 assert.match(nav,/aria-label="Mobile navigation"/);assert.match(nav,/aria-current=\{active\?"page":undefined\}/);
 assert.match(nav,/aria-haspopup="dialog"/);assert.match(nav,/event\.key==="Escape"/);assert.match(nav,/event\.key!=="Tab"/);
 assert.match(css,/@media\(max-width:850px\)/);assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/min-height:50px/);assert.match(css,/grid-auto-columns:1fr/);assert.match(css,/display:grid;height:auto;gap:0/);
 assert.match(css,/\.topbar nav\{display:none!important\}/);assert.doesNotMatch(css,/overflow-x:auto/);
 assert.match(page,/<MobileNavigation language=\{language\}/);assert.match(layout,/mobile-navigation\.css/);
});

test("mobile lessons remain usable around the keyboard, dock, motion settings and loading failures",async()=>{
 const [css,page,guide]=await Promise.all([
  readFile(new URL("app/mobile-navigation.css",root),"utf8"),
  readFile(new URL("app/page.tsx",root),"utf8"),
  readFile(new URL("app/first-time-tutorial.tsx",root),"utf8"),
 ]);
 assert.match(css,/\.practice textarea,.practice input,.practice select\{font-size:16px\}/);
 assert.match(css,/\.practice \.bottom-actions\{position:sticky/);assert.match(css,/min-height:48px/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(page,/Retry connection/);assert.match(page,/lesson drafts remain on this device/);
 assert.match(page,/document\.title=/);assert.match(page,/heading\.focus\(\{preventScroll:true\}\)/);assert.match(page,/item=>item\.offsetParent!==null/);
 assert.match(page,/\(view==="today"\|\|view==="library"\)&&<FrenchCourseGuide/);
 assert.match(guide,/const TOUR_VERSION/);assert.match(guide,/steps\.length/);
});
