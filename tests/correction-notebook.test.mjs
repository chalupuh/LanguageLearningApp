import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {correctionDiff,validNotebook,validCorrectionDraft,recurringCategories} from '../lib/correction-notebook.ts';
const entry=(id='correction-00000001')=>({id,title:'A small correction',original:'Le maison est grand.',corrected:'La maison est grande.',notes:'Maison is feminine.',categories:['Articles','Gender and agreement'],archived:false,createdAt:1,updatedAt:1});
const url=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('notebook validates bounded text, unique entries, categories and incomplete recoverable drafts',()=>{
 assert.equal(validNotebook({entries:[entry()]}),true);
 assert.equal(validCorrectionDraft({...entry(),title:'',original:'unfinished',corrected:''}),true);
 for(const patch of [{title:''},{original:' '},{corrected:'x'.repeat(6001)},{notes:'x'.repeat(3001)},{categories:['unknown']},{categories:['Articles','Articles']},{archived:'yes'},{createdAt:-1},{updatedAt:0}])assert.equal(validNotebook({entries:[{...entry(),...patch}]}),false);
 assert.equal(validNotebook({entries:[entry(),entry()]}),false);
 assert.equal(validNotebook({entries:Array.from({length:101},(_,i)=>entry('correction-'+String(i).padStart(12,'0')))}),false);
});
test('word differences preserve both texts including accents, punctuation, repeated words and long excerpts',()=>{
 for(const [a,b] of [['Le maison est grand.','La maison est grande.'],['J’ai  vu\nle chat.','J’ai vu\nles chats !'],['a a b','a b a'],['','Bonjour'],['été','ete'],['same','same'],['x '.repeat(1500),'y '.repeat(1500)],['prefix '+ 'x '.repeat(600)+'end','prefix '+'y '.repeat(600)+'end']]){
  const parts=correctionDiff(a,b);assert.equal(parts.filter(p=>p.kind!=='added').map(p=>p.text).join(''),a);assert.equal(parts.filter(p=>p.kind!=='removed').map(p=>p.text).join(''),b);
 }
 assert.deepEqual(correctionDiff('Le chat','La chatte').filter(p=>p.kind==='added').map(p=>p.text),['La','chatte']);
});
test('recurring categories count active entries once and exclude archived corrections',()=>{
 const patterns=recurringCategories([entry(),{...entry('correction-00000002'),categories:['Articles']},{...entry('correction-00000003'),archived:true}]);
 assert.deepEqual(patterns,[{category:'Articles',count:2},{category:'Gender and agreement',count:1}]);
});
test('correction notebook category survives direct links for all three languages',async()=>{
 const {readLibraryRoute}=await import(url(await read('lib/library-route.ts')));
 for(const language of ['fr','sv','es'])assert.equal(readLibraryRoute('#library/corrections',language).category,'corrections');
});
test('notebook API isolates accounts and languages and rejects stale writes, invalid payloads and hostile origins',async()=>{
 const {DatabaseSync}=await import('node:sqlite'),{drizzle}=await import('drizzle-orm/d1'),sqlite=new DatabaseSync(':memory:');
 sqlite.exec(await read('drizzle/0009_slimy_union_jack.sql'));
 globalThis.__notebookDb=drizzle({prepare(sql){let args=[];const statement={bind(...values){args=values;return statement},async raw(){const s=sqlite.prepare(sql);s.setReturnArrays(true);return s.all(...args)},async all(){return {success:true,results:sqlite.prepare(sql).all(...args)}},async run(){return {success:true,meta:{changes:sqlite.prepare(sql).run(...args).changes}}}};return statement}});
 const before=process.env.ALLOWED_USER_EMAILS;process.env.ALLOWED_USER_EMAILS='alice@example.com,bob@example.com';
 try{
  const auth=url((await read('app/api/learning-track.ts')).replace('"./app-auth"',JSON.stringify(url(await read('app/api/app-auth.ts'))))),schema=url((await read('db/schema.ts')).replace('"drizzle-orm/sqlite-core"',JSON.stringify(import.meta.resolve('drizzle-orm/sqlite-core'))));
  let source=await read('app/api/correction-notebook/route.ts');
  for(const [from,to] of Object.entries({'../learning-track':auth,'../../../db':url('export const getDb=()=>globalThis.__notebookDb;'),'../../../db/schema':schema,'../../../lib/correction-notebook':url(await read('lib/correction-notebook.ts')),'drizzle-orm':import.meta.resolve('drizzle-orm')}))source=source.replaceAll(JSON.stringify(from),JSON.stringify(to));
  const {GET,PUT}=await import(url(source)),request=(body,user='alice',language='fr',origin='https://app.test')=>new Request('https://app.test/api/correction-notebook?language='+language,{method:body?'PUT':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.com',origin},...(body?{body:JSON.stringify(body)}:{})});
  assert.equal((await GET(new Request('https://app.test/api/correction-notebook'))).status,401);
  assert.equal((await PUT(new Request('https://app.test/api/correction-notebook',{method:'PUT',body:'{}'}))).status,401);
  assert.equal((await GET(request(null,'outsider'))).status,403);
  const state={entries:[entry()]},body={state,revision:0,userId:'bob'};
  assert.equal((await PUT(request(body,'alice','fr','https://evil.test'))).status,403);
  assert.equal((await PUT(request({...body,state:{entries:[{...entry(),corrected:''}]}}))).status,400);
  assert.equal((await PUT(request({...body,revision:-1}))).status,400);
  assert.equal((await PUT(request({...body,state:{entries:[],notes:'x'.repeat(2000001)}}))).status,413);
  assert.equal((await PUT(request(body))).status,200);
  assert.equal((await PUT(request(body))).status,409);
  const response=await GET(request());assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual((await response.json()).state,state);
  for(const [who,language] of [['bob','fr'],['alice','sv'],['alice','es']])assert.deepEqual((await (await GET(request(null,who,language))).json()).state,{entries:[]});
  const edited={entries:[{...entry(),corrected:'La petite maison est grande.',updatedAt:2}]};
  assert.equal((await PUT(request({state:edited,revision:1}))).status,200);
  assert.equal((await PUT(request({state,revision:1}))).status,409);
  assert.deepEqual((await (await GET(request())).json()).state,edited);
  assert.equal((await PUT(request({state:{entries:[{...edited.entries[0],archived:true}]},revision:2}))).status,200);
  assert.equal((await (await GET(request())).json()).state.entries[0].archived,true);
  assert.equal((await PUT(request({state:edited,revision:3}))).status,200);
  assert.equal((await (await GET(request())).json()).state.entries[0].archived,false);
 }finally{if(before===undefined)delete process.env.ALLOWED_USER_EMAILS;else process.env.ALLOWED_USER_EMAILS=before;delete globalThis.__notebookDb;sqlite.close();}
});
