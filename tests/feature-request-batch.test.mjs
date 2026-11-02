import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('lesson explanations allow the full server-supported 1,200 characters',async()=>{
 const page=await read('app/page.tsx');
 assert.match(page,/maxLength=\{1200\}/);
 assert.match(page,/\{text\.length\} \/ 1,200/);
});

test('completed announcements offer an explicit return to Today',async()=>{
 const [page,announcements]=await Promise.all([read('app/page.tsx'),read('app/announcements.tsx')]);
 assert.match(announcements,/Done · back to Today/);
 assert.match(announcements,/onClick=\{onDone\}/);
 assert.match(page,/onDone=\{\(\)=>setView\("today"\)\}/);
 assert.match(page,/onSaved=\{onAnnouncementSaved\} onDone=\{onDone\}/);
});

test('Calendar exposes prior synced checklist text as reusable choices',async()=>{
 const calendar=await read('app/my-calendar.tsx');
 assert.match(calendar,/recentGoalSuggestions\(calendar\.plan\)/);
 assert.match(calendar,/Use a previous item/);
 assert.match(calendar,/suggestions=\{priorItems/);
});
