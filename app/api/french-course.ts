import {releases} from "../../content/releases";
import {eq} from "drizzle-orm";
import {getDb} from "../../db";
import {learnerProgress,journeyEvents} from "../../db/schema";
import {courseForState,verifiedCourseCompletions} from "../../lib/french-progression";
export async function frenchCourseContext(userId:string,initialize=true) {
 const db=getDb();
 const [record]=await db.select().from(learnerProgress).where(eq(learnerProgress.userId,userId)).limit(1);
 const state=record?JSON.parse(record.state):null;
 const events=await db.select().from(journeyEvents).where(eq(journeyEvents.userId,userId));
 const assigned=state?.frenchCourse==="beginner-v1"||state?.frenchCourse==="beginner-v2";
 // Existing activity also protects a learner whose only progress field is a shared theme.
 const course=assigned?courseForState(state):events.some(e=>e.kind!=="release-seen")?"legacy":courseForState(state);
 if(!record&&initialize){
  await db.insert(learnerProgress).values({userId,state:JSON.stringify({frenchCourse:course,...(course!=="legacy"?{lastSeenUpdateId:releases.at(-1)?.id||""}:{}),preferences:{minutes:10,level:course!=="legacy"?"A1":"B1",interest:"any",goal:"everyday"}}),updatedAt:Date.now()}).onConflictDoNothing();
  const [saved]=await db.select().from(learnerProgress).where(eq(learnerProgress.userId,userId)).limit(1);
  return {course:courseForState(JSON.parse(saved.state)),completed:verifiedCourseCompletions(events),state:JSON.parse(saved.state)};
 }
 return {course,completed:verifiedCourseCompletions(events),state};
}
