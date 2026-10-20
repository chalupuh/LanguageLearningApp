// Disposable localhost learner only. Synthetic complete loops, not proof of human mastery.
import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {requirements,frenchStage} from '../lib/french-progression.ts';
const base='http://localhost:3000',stage=process.argv[2];
if(!['A1','A2','B1'].includes(stage))throw Error('Choose A1, A2 or B1');
async function call(path,body){const r=await fetch(base+'/api/'+path,{...(body?{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body)}:{})});const data=await r.json();return {status:r.status,data};}
const before=(await call('progress')).data;assert.equal(before.userId,'local-development');
const results=[];
for(const id of requirements[stage]){
 if(before.state.courseCompleted.includes(id))continue;
 const result=await call('journey',{kind:'loop',source:'library:'+id,summary:'Synthetic QA loop: the people discuss their everyday plans.',retell:'Ils discutent de leurs projets et confirment les détails.',decoded:true,rehearsed:true});
 assert.equal(result.status,200,id);results.push({id,...result});
}
const after=(await call('progress')).data,expected={A1:'A2',A2:'B1',B1:'B2'}[stage];
assert.equal(frenchStage(after.state.frenchCourse,after.state.courseCompleted),expected);
await mkdir('work/predeployment-qa',{recursive:true});
const path='work/predeployment-qa/live-unlocks.json';let evidence=[];try{evidence=JSON.parse(await readFile(path,'utf8'));}catch{/* First local QA run has no report yet. */}
evidence.push({checkedAt:new Date().toISOString(),stage,expected,courseCompleted:after.state.courseCompleted,results});await writeFile(path,JSON.stringify(evidence,null,2));console.log(`${stage} -> ${expected}: PASS (${after.state.courseCompleted.length} verified saved sources)`);
