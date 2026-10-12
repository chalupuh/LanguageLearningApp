// Synthetic release checks against the same comprehension route/prompt.
// Uses the existing local key; never writes or prints credentials or learner data.
import {readFile} from "node:fs/promises";
import ts from "typescript";
const env=await readFile(new URL("../.env.local",import.meta.url),"utf8");
process.env.OPENAI_API_KEY ||= env.split(/\r?\n/).find(s=>/^OPENAI_API_KEY=/.test(s))?.replace(/^OPENAI_API_KEY=/,"").trim().replace(/^(["'])(.*)\1$/,"$2");
if(!process.env.OPENAI_API_KEY)throw Error("Existing key unavailable");
const url=source=>"data:text/javascript;base64,"+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString("base64");
let source=await readFile(new URL("../app/api/comprehension/route.ts",import.meta.url),"utf8");
source=source.replace('"../ai-guard"',JSON.stringify(url("export const guardAiRequest=async()=>null;export const fetchAi=fetch;"))).replace('"../../../lib/retell-policy"',JSON.stringify(url(await readFile(new URL("../lib/retell-policy.ts",import.meta.url),"utf8"))));
const {POST}=await import(url(source));
const cases=[
 {name:"Swedish observer",language:"sv",level:"A1",passage:"En kvinna säger: Jag vill ha en kaffe, tack. Hon betalar med kort.",summary:"En kvinna beställde kaffe och betalade med kort.",valid:true},
 {name:"Swedish contradiction",language:"sv",level:"A1",passage:"En kvinna säger: Jag vill ha en kaffe, tack. Hon betalar med kort.",summary:"En man köpte ett tåg och betalade med kontanter.",valid:false},
 {name:"French observer",language:"fr",level:"B1",passage:"Je voudrais un café. Le serveur explique que la machine ne marche pas. La cliente choisit un thé.",summary:"Une cliente voulait un café mais la machine était en panne, donc elle a pris un thé.",valid:true},
];
for(const item of cases){const r=await POST(new Request("http://localhost/api/comprehension",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(item)}));if(!r.ok)throw Error("Coaching evaluation failed: "+r.status);const result=await r.json();const passed=item.valid?result.score>=90&&result.misconception===null:result.score<40&&!!result.misconception;console.log(JSON.stringify({case:item.name,score:result.score,passed}));if(!passed)process.exitCode=1;}
