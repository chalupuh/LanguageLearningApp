import {ESLint} from "eslint";
import {readFile} from "node:fs/promises";
import path from "node:path";
const baseline=JSON.parse(await readFile(new URL("../docs/lint-baseline.json",import.meta.url),"utf8"));
const counts=new Map();
const results=await new ESLint().lintFiles(["."]);
for(const result of results)for(const message of result.messages){
 const key=JSON.stringify([path.relative(process.cwd(),result.filePath).replaceAll("\\","/"),message.ruleId,message.severity,message.message.split("\n")[0]]);
 counts.set(key,(counts.get(key)||0)+1);
}
const added=[...counts].filter(([key,count])=>count>(baseline.diagnostics[key]||0));
for(const [key,count] of added)console.error(`${key}: ${count-(baseline.diagnostics[key]||0)} additional finding(s)`);
const total=[...counts.values()].reduce((a,b)=>a+b,0);
console.log(`Lint debt: ${total} existing findings; ${added.length} new diagnostic groups. Run npm run lint for the strict report.`);
if(added.length)process.exitCode=1;
