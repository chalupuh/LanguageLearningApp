import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {frenchGrammar} from '../content/french-grammar.ts';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const url=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const content=url(await read('content/french-grammar.ts'));
const logic=url((await read('lib/french-grammar.ts')).replace('"../content/french-grammar"',JSON.stringify(content)));
const {checkGrammarAnswer,grammarTopicForCategory}=await import(logic);
test('grammar content has 24 unique exercises, one blank each, explanations and accepted answers',()=>{
 assert.equal(frenchGrammar.length,24);assert.equal(new Set(frenchGrammar.map(e=>e.id)).size,24);
 for(const e of frenchGrammar){assert.equal(e.sentence.split('___').length,2);assert.ok(e.prompt.length>10);assert.ok(e.explanation.length>30);assert.ok(e.answers.length);for(const a of e.answers)assert.equal(checkGrammarAnswer(e.id,a),'correct');}
 assert.deepEqual([...new Set(frenchGrammar.map(e=>e.topic))].sort(),['agreement','articles','plurals']);
});
test('answer checking accepts typography and variants without forgiving agreement errors',()=>{
 for(const a of ['la',' LA ','La'])assert.equal(checkGrammarAnswer('article-maison',a),'correct');
 assert.equal(checkGrammarAnswer('article-amie',' L’ '),'correct');assert.equal(checkGrammarAnswer('article-eau','de  l’'),'correct');
 for(const a of ['clés','clefs','cle\u0301s'])assert.equal(checkGrammarAnswer('pluriel-clefs',a),'correct');
 assert.equal(checkGrammarAnswer('pluriel-clefs','cles'),'accent');assert.equal(checkGrammarAnswer('accord-chere','chere'),'accent');
 for(const [id,a] of [['article-maison','le'],['accord-petite','petit'],['pluriel-grandes','grande'],['article-des','de les'],['pluriel-orange','oranges'],['pluriel-clefs','clé'],['article-amie','la'],['missing','la']])assert.equal(checkGrammarAnswer(id,a),'incorrect');
 assert.equal(checkGrammarAnswer('article-maison',''),'incorrect');assert.equal(checkGrammarAnswer('article-maison','a'.repeat(101)),'incorrect');
 assert.equal(grammarTopicForCategory('Articles'),'articles');assert.equal(grammarTopicForCategory('Gender and agreement'),'agreement');assert.equal(grammarTopicForCategory('Vocabulary'),null);
});
test('grammar routes are available for French only',async()=>{
 const {readLibraryRoute}=await import(url(await read('lib/library-route.ts')));
 assert.equal(readLibraryRoute('#library/grammar','fr').category,'grammar');for(const language of ['es','sv'])assert.equal(readLibraryRoute('#library/grammar',language).category,'all');
});
test('grammar progress is authenticated, verified server-side, isolated, and idempotent',async()=>{
 const {DatabaseSync}=await import('node:sqlite'),{drizzle}=await import('drizzle-orm/d1'),sqlite=new DatabaseSync(':memory:');sqlite.exec(await read('drizzle/0010_dark_banshee.sql'));
 globalThis.__grammarDb=drizzle({prepare(sql){let args=[];const s={bind(...values){args=values;return s},async raw(){const st=sqlite.prepare(sql);st.setReturnArrays(true);return st.all(...args)},async all(){return {success:true,results:sqlite.prepare(sql).all(...args)}},async run(){return {success:true,meta:{changes:sqlite.prepare(sql).run(...args).changes}}}};return s}});
 const before=process.env.ALLOWED_USER_EMAILS;process.env.ALLOWED_USER_EMAILS='alice@example.com,bob@example.com';
 try{
 const auth=url((await read('app/api/learning-track.ts')).replace('"./app-auth"',JSON.stringify(url(await read('app/api/app-auth.ts'))))),schema=url((await read('db/schema.ts')).replace('"drizzle-orm/sqlite-core"',JSON.stringify(import.meta.resolve('drizzle-orm/sqlite-core'))));
 let source=await read('app/api/grammar/route.ts');for(const [from,to] of Object.entries({'../learning-track':auth,'../../../db':url('export const getDb=()=>globalThis.__grammarDb;'),'../../../db/schema':schema,'../../../lib/french-grammar':logic,'drizzle-orm':import.meta.resolve('drizzle-orm')}))source=source.replaceAll(JSON.stringify(from),JSON.stringify(to));
 const {GET,POST}=await import(url(source)),request=(body,user='alice',language='fr',origin='https://app.test')=>new Request('https://app.test/api/grammar?language='+language,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.com',origin},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await GET(new Request('https://app.test/api/grammar'))).status,401);assert.equal((await POST(new Request('https://app.test/api/grammar',{method:'POST',body:'{}'}))).status,401);assert.equal((await GET(request(null,'outsider'))).status,403);
 const correct={id:'article-maison',answer:'la',userId:'bob'};
 assert.equal((await POST(request(correct,'alice','fr','https://evil.test'))).status,403);
 assert.equal((await POST(request(correct,'alice','es'))).status,400);assert.equal((await GET(request(null,'alice','sv'))).status,400);
 for(const body of [{id:'article-maison',answer:'le'},{id:'missing',answer:'la'},{id:'accord-chere',answer:'chere'},{id:'article-maison',answer:null}])assert.equal((await POST(request(body))).status,400);
 assert.equal((await POST(request(correct))).status,200);assert.equal((await POST(request(correct))).status,200);
 const result=await GET(request());assert.equal(result.headers.get('cache-control'),'private, no-store');assert.deepEqual((await result.json()).completed,['article-maison']);assert.deepEqual((await (await GET(request(null,'bob'))).json()).completed,[]);
 assert.equal((await POST(request({id:'accord-chere',answer:'chère'}))).status,200);assert.equal((await (await GET(request())).json()).completed.length,2);
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM grammar_completions').get().count,2);
 }finally{if(before===undefined)delete process.env.ALLOWED_USER_EMAILS;else process.env.ALLOWED_USER_EMAILS=before;delete globalThis.__grammarDb;sqlite.close();}
});
