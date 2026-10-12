import test from "node:test";
import assert from "node:assert/strict";
import {pruneUsageQueue,validUsageSample} from "../lib/usage.ts";
const now=Date.parse("2026-10-12T16:00:00Z"),id="11111111-1111-4111-8111-111111111111";
test("a mixed retry queue drops expired intervals without losing current practice",()=>{
 const recent={seq:2,start:now-5000,end:now,stage:2,feature:"fluency",language:"sv"};
 const queue=[{id,source:"library:sv-kaffe",stage:2,samples:[{...recent,seq:0,start:now-2*86400000,end:now-2*86400000+5000},{...recent,seq:1,feature:"obsolete-feature"},recent]}];
 assert.deepEqual(pruneUsageQueue(queue,now)[0].samples,[recent]);
 assert.equal(validUsageSample({...recent,end:recent.start},now),false);
 assert.equal(validUsageSample({...recent,end:now+10001},now),false);
});
