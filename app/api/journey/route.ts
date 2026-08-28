import { authorizeAppRequest } from "../app-auth";
import { earnedXp, rewards } from "../../../lib/journey";
import { passages } from "../../../content/passages";
import { checkpoints } from "../../../content/checkpoints";
import { releases, unseenReleases } from "../../../content/releases";
const headers = { "Cache-Control": "private, no-store" };
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });
async function context(userId: string) {
  const [{ getDb }, schema, ops] = await Promise.all([import("../../../db"), import("../../../db/schema"), import("drizzle-orm")]);
  const db = getDb();
  const [old] = await db.select().from(schema.learnerProgress).where(ops.eq(schema.learnerProgress.userId,userId));
  let legacy: any = {}; try { legacy = JSON.parse(old?.state || "{}"); } catch {}
  await db.insert(schema.journeyProfiles).values({userId,historicalXp:Math.max(0,Number.isFinite(legacy.xp)?legacy.xp:0)}).onConflictDoNothing();
  const events = await db.select().from(schema.journeyEvents).where(ops.eq(schema.journeyEvents.userId,userId));
  const [profile] = await db.select().from(schema.journeyProfiles).where(ops.eq(schema.journeyProfiles.userId,userId));
  return {db,schema,ops,events,profile,legacy};
}
export async function GET(request: Request) {
  const auth = authorizeAppRequest(request); if (!auth.identity) return reply({error:"Sign in to see your journey."},auth.status);
  try {
    const {events,profile,legacy} = await context(auth.identity.userId);
    const used = new Set(events.filter(e=>e.kind==="checkpoint").map(e=>e.source));
    const next = checkpoints.find(c=>!used.has(c.id));
    const last = Math.max(0,...events.filter(e=>e.kind==="checkpoint").map(e=>e.createdAt));
    return reply({...profile,userId:undefined,releases:unseenReleases(events,legacy.lastSeenUpdateId),events:events.map(({userId,...e})=>e).sort((a,b)=>b.createdAt-a.createdAt),checkpoint:next?{...next,questions:next.questions.map(({answer,...q})=>q)}:null,checkpointAvailableAt:last?last+7*86400000:0});
  } catch { return reply({error:"Your journey could not be loaded. Please retry."},503); }
}
export async function POST(request: Request) {
  const auth = authorizeAppRequest(request); if (!auth.identity) return reply({error:"Sign in to record practice."},auth.status);
  if (request.headers.get("origin") && request.headers.get("origin")!==new URL(request.url).origin) return reply({error:"Invalid origin."},403);
  const body = await request.json().catch(()=>null);
  if (!body || typeof body.kind!=="string" || typeof body.source!=="string" || !body.source || body.source.length>240) return reply({error:"Invalid activity."},400);
  try {
    const userId=auth.identity.userId, c=await context(userId), now=Date.now(), day=new Date(now).toISOString().slice(0,10);
    let kind=body.kind, xp=0, id="", data:Record<string,unknown>={};
    const confirmUsage=async()=>{
      if(typeof body.usageSessionId!=="string"||!/^[-\w]{36}$/.test(body.usageSessionId))return;
      // Analytics must not prevent saving the learning loop if its storage is unavailable.
      try{await c.db.insert(c.schema.usageSessions).values({userId,id:body.usageSessionId,email:auth.identity!.email,source:body.source,startedAt:now,lastActiveAt:now,stage:3,completedAt:now}).onConflictDoUpdate({target:[c.schema.usageSessions.userId,c.schema.usageSessions.id],set:{completedAt:now,lastActiveAt:now,stage:3},setWhere:c.ops.and(c.ops.eq(c.schema.usageSessions.source,body.source),c.ops.isNull(c.schema.usageSessions.completedAt))})}catch{}
    };
    if(kind==="release-seen"){
      const index=releases.findIndex(r=>r.id===body.source);
      if(index<0)return reply({error:"Unknown update."},400);
      await c.db.insert(c.schema.journeyEvents).values(releases.slice(0,index+1).map(r=>({userId,id:"release-seen:"+r.id,kind,source:r.id,xp:0,createdAt:now,details:"{}"}))).onConflictDoNothing();
      return reply({saved:true});
    }
    if (kind==="equip") {
      const category=body.category;
      if (!["avatar","background","frame"].includes(category)) return reply({error:"Unknown cosmetic type."},400);
      const reward=rewards.find(r=>r.id===body.source&&r.kind===category);
      if (body.source!=="default" && (!reward || earnedXp(c.events)<reward.xp)) return reply({error:"This item has not been unlocked yet."},403);
      await c.db.update(c.schema.journeyProfiles).set({[category]:body.source}).where(c.ops.eq(c.schema.journeyProfiles.userId,userId));
      return reply({saved:true});
    }
    if (body.kind==="goal") {
      if (![2,3,4,5,6,7].includes(body.goal)) return reply({error:"Choose 2–7 practice days."},400);
      await c.db.update(c.schema.journeyProfiles).set({weeklyGoal:body.goal}).where(c.ops.eq(c.schema.journeyProfiles.userId,userId));
      return reply({saved:true});
    }
    const passage=passages.find(p=>"library:"+p.id===body.source);
    const studio=/^studio:[\w-]{11}:\d+:\d+$/.test(body.source);
    if (kind==="loop" || kind==="review") {
      if ((!passage&&!studio) || typeof body.summary!=="string" || body.summary.trim().length<15 || body.summary.length>1000 || typeof body.retell!=="string" || body.retell.trim().length<15 || body.retell.length>10000 || body.decoded!==true || body.shadowed!==true) return reply({error:"Complete your summary, decode reflection, shadowing, and retell first."},400);
      const prior=c.events.find(e=>e.source===body.source&&(e.kind==="loop"||e.kind==="review"));
      const legacyDone=passage&&c.legacy.completed?.includes(passage.id);
      if (prior || legacyDone || kind==="review") {
        kind="review";
        const due=passage?Date.parse(c.legacy.reviews?.[passage.id]||""):prior?prior.createdAt+86400000:NaN;
        if (!Number.isFinite(due)||due>now || c.events.some(e=>e.source===body.source&&(e.kind==="loop"||e.kind==="review")&&e.createdAt>now-86400000)) { await confirmUsage(); return reply({awarded:0,message:"Practice saved in your lesson. XP returns when this passage is due for review."}); }
        xp=20; id="review:"+body.source+":"+day;
      } else { xp=40; id="loop:"+body.source; }
      data={speaker:passage?.speaker.name||"Studio",topic:passage?.topic||"Personal video",level:passage?.level||"Uncalibrated Studio",day};
    } else if (kind==="phrase") {
      if (!c.legacy.savedPhrases?.includes(body.source) || !["Again","Hard","Good","Easy"].includes(body.rating)) return reply({error:"Review a saved phrase first."},400);
      const due=c.legacy.phraseReviews?.[body.source];
      if (due&&Date.parse(due)>now) return reply({awarded:0});
      id="phrase:"+body.source+":"+day; data={rating:body.rating,day};
      // One review-set award per UTC day, independent of how many phrases it contains.
      xp=0;
    } else if (kind==="shadow") {
      if ((!passage&&!studio)||body.repeated!==true) return reply({error:"Complete a listen-and-repeat retry first."},400);
      id="shadow:"+body.source+":"+day; xp=10; data={day};
    } else if (kind==="observation") {
      if ((!passage&&!studio)||!Number.isFinite(body.score)||body.score<0||body.score>100||!["first","replay","familiar","unknown"].includes(body.condition)) return reply({error:"Invalid listening observation."},400);
      const familiar=c.events.some(e=>e.source===body.source&&(e.kind==="observation"||e.kind==="loop"||e.kind==="review"))||(passage&&c.legacy.completed?.includes(passage.id));
      id="observation:"+body.source+":"+day; data={score:body.score,condition:familiar?"familiar":body.condition,level:passage?.level||"Uncalibrated Studio",topic:passage?.topic||"Personal video",day};
    } else if (kind==="checkpoint") {
      const check=checkpoints.find(c=>c.id===body.source);
      if (!check||!Array.isArray(body.answers)||body.answers.length!==check.questions.length||body.answers.some((a:unknown)=>!Number.isInteger(a)||Number(a)<0||Number(a)>2)||!Number.isInteger(body.listens)||body.listens<1||body.listens>100) return reply({error:"Listen and answer all checkpoint questions."},400);
      const previous=c.events.find(e=>e.kind==="checkpoint"&&e.source===check.id);
      if(previous)return reply({awarded:0,result:JSON.parse(previous.details),message:"Already recorded — no duplicate XP."});
      const next=checkpoints.find(check=>!c.events.some(e=>e.kind==="checkpoint"&&e.source===check.id));
      if(next?.id!==check.id)return reply({error:"Complete the next available checkpoint in order."},409);
      if (c.events.some(e=>e.kind==="checkpoint"&&e.source!==check.id&&e.createdAt>now-7*86400000)) return reply({error:"Your next checkpoint opens seven days after the last one."},409);
      id="checkpoint:"+check.id; xp=25;
      data={score:Math.round(check.questions.filter((q,i)=>q.answer===body.answers[i]).length/check.questions.length*100),skills:check.questions.map((q,i)=>({skill:q.skill,correct:q.answer===body.answers[i],answer:q.options[q.answer]})),condition:body.listens===1?"first":"replay",level:check.level,day};
    } else return reply({error:"Unknown activity."},400);
    data.weeklyGoal=c.profile.weeklyGoal;
    const inserted=await c.db.insert(c.schema.journeyEvents).values({userId,id,kind,source:body.source,xp,createdAt:now,details:JSON.stringify(data)}).onConflictDoNothing().returning();
    let awarded=inserted.length?xp:0;
    if(kind==="loop"||kind==="review")await confirmUsage();
    if(kind==="phrase"){
      const bonus=await c.db.insert(c.schema.journeyEvents).values({userId,id:"phrase-set:"+day,kind:"phrase-set",source:day,xp:10,createdAt:now,details:JSON.stringify({day,weeklyGoal:c.profile.weeklyGoal})}).onConflictDoNothing().returning();
      awarded=bonus.length?10:0;
    }
    return reply({awarded,result:inserted.length?data:undefined,message:inserted.length?"Practice recorded.":"Already recorded — no duplicate XP."});
  } catch { return reply({error:"Practice could not be saved. Retry to record it safely without duplicate XP."},503); }
}
