export const releases = [
 {id:"2026-08-26-shadow-coaching",date:"August 26, 2026",title:"Shadowing just got much easier",summary:"More support while you speak, and clearer guidance afterward.",items:[
  {mark:"01",title:"French text while you shadow",body:"Follow the transcript in built-in lessons and Studio clips."},
  {mark:"02",title:"A focused replay drill",body:"Speaking coaching suggests a short phrase to listen to and repeat."},
 ]},
 {id:"2026-08-27-progress-collection",date:"August 27, 2026",title:"Your French journey, in color",summary:"A clearer practice journey, rewards to collect, and a place to see what you are learning.",items:[
  {mark:"01",title:"XP for useful practice",body:"Library and Studio loops, due reviews, and shadow retries now earn recorded XP. Historical XP is preserved separately."},
  {mark:"02",title:"Your Paris collection",body:"Unlock avatars, frames, and backgrounds. Open N → My cosmetics or Progress → Collection to use them."},
  {mark:"03",title:"Listening growth, not a fluency score",body:"See your listening history and try three practice checks with fixed answer keys. XP and these checks do not certify B2."},
  {mark:"04",title:"Your feedback comes back to you",body:"When a request is marked implemented, its update appears in your app."},
 ]},
 {id:"2026-09-26-rehearsal-seasons",date:"September 26, 2026",title:"A new way to rehearse — and a room for every season",summary:"Practice one French phrase at a time, then make the app feel like the season you’re in.",items:[
  {mark:"01",title:"Rehearse your way",body:"Choose Listen then echo, Build the phrase, or Notice the rhythm. Speaking and recording are always optional."},
  {mark:"02",title:"Seasonal themes",body:"Open N → Seasonal look. Automatic follows the seasons, or choose a favorite look to keep year-round."},
  {mark:"03",title:"Extra practice can earn XP",body:"Finish two rehearsal activities to record extra practice, with the same fair daily XP limit as before."},
 ]},
];
export type Release = typeof releases[number];
export function unseenReleases(events:{kind:string;source:string}[],legacyId?:string){
 const legacyIndex=releases.findIndex(r=>r.id===legacyId);
 const seen=new Set(events.filter(e=>e.kind==="release-seen").map(e=>e.source));
 return releases.filter((r,i)=>i>legacyIndex&&!seen.has(r.id));
}
