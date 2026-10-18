import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
mkdirSync(".wrangler",{recursive:true});
writeFileSync(".wrangler/types.config.json",JSON.stringify({name:"a-loreille-types",compatibility_date:"2026-10-18",compatibility_flags:["nodejs_compat"]}));
const result=spawnSync(process.execPath,[require.resolve("wrangler/bin/wrangler.js"),"types","worker-configuration.d.ts","--config",".wrangler/types.config.json","--include-env","false"],{stdio:"inherit",env:{...process.env,WRANGLER_WRITE_LOGS:"false",WRANGLER_LOG_PATH:".wrangler/logs"}});
if(result.status===0){
  // Scope generated Worker globals so they do not replace browser DOM types.
  // Our ambient cloudflare:workers declaration supplies only this app's bindings.
  const runtime=readFileSync("worker-configuration.d.ts","utf8").replace(/declare module 'cloudflare:workers' \{\r?\n    export = CloudflareWorkersModule;\r?\n\}/,"");
  writeFileSync("worker-configuration.d.ts",runtime+"\nexport type { D1Database, R2Bucket };\n");
}
process.exit(result.status??1);
