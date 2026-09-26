import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";
const source=await readFile(new URL("../lib/seasonal-theme.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {resolveTheme}=await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
test("automatic follows local seasonal and holiday boundaries; manual choices remain fixed",()=>{
  for(const [month,day,expected] of [[1,1,"winter"],[2,1,"valentine"],[2,14,"valentine"],[2,15,"winter"],[3,1,"spring"],[5,31,"spring"],[6,1,"summer"],[8,31,"summer"],[9,1,"autumn"],[9,30,"autumn"],[10,1,"halloween"],[10,31,"halloween"],[11,1,"autumn"],[12,1,"winter"]]){
    const date=new Date(2026,month-1,day,12);
    assert.equal(resolveTheme("auto",date),expected,`${month}/${day}`);
    for(const manual of ["classic","autumn","halloween","winter","valentine","spring","summer"])assert.equal(resolveTheme(manual,date),manual);
  }
});
