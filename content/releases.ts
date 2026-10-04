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
 {id:"2026-09-26-phrase-context",date:"September 26, 2026",title:"Your saved French now comes with its story",summary:"A saved phrase brings its sentence and source back when you review it.",items:[
  {mark:"01",title:"Keep the surrounding sentence",body:"Highlights from lessons and Studio now remember the sentence they came from."},
  {mark:"02",title:"Hear it in context",body:"Reveal a saved phrase to replay its sentence and return to its lesson or video."},
 ]},
 {id:"2026-09-30-two-languages",date:"September 30, 2026",title:"New stories, poetry, and a Swedish beginning",summary:"More to hear, with the same four-step learning loop.",items:[
  {mark:"01",title:"French for real situations",body:"Twelve new café, breakfast, and dinner exchanges cover substitutions, changing tables, and payment surprises."},
  {mark:"02",title:"Poetry and announcements",body:"Explore six classic poems, save their vocabulary, and try twelve everyday announcement checks in Library → Category."},
  {mark:"03",title:"Find your next lesson",body:"Filter by category and completion status, or sort by newest, difficulty, and title."},
  {mark:"04",title:"Switch to Swedish A1",body:"Open your profile to choose Swedish: twelve beginner lessons and three announcements, with separate progress and shared appearance."},
 ]},
 {id:"2026-10-03-practice-that-fits",date:"October 3, 2026",title:"Practice that fits your day",summary:"Safer syncing, useful replay tools, and more ways to handle real situations.",items:[
  {mark:"01",title:"Your progress travels safely",body:"Changes from different devices are merged, with automatic retries when a connection returns. Collection rewards consistently use combined French and Swedish XP."},
  {mark:"02",title:"Hear the difficult part again",body:"Decode now has phrase replay, a five-second rewind, and A–B looping. Listening history distinguishes slowed and transcript-assisted work."},
  {mark:"03",title:"A daily mix and real-world practice",body:"Today combines due reviews, unseen passages, and quick listening practice. Library → Server situations adds alternative phrasings for everyday surprises; announcement attempts now keep a history."},
  {mark:"04",title:"More support, clearer evidence",body:"Swedish has optional beginner prompts. Progress → Listening growth shows practice evidence for useful everyday abilities, without turning XP into language levels."},
  {mark:"05",title:"One feature-request notebook",body:"Your profile now shows French and Swedish requests together: Submitted, Planned, In progress, or Shipped, with release links. Update acknowledgements work across languages."},
 ]},
];
export type Release = typeof releases[number];
export function unseenReleases(events:{kind:string;source:string}[],legacyId?:string){
 const legacyIndex=releases.findIndex(r=>r.id===legacyId);
 const seen=new Set(events.filter(e=>e.kind==="release-seen").map(e=>e.source));
 return releases.filter((r,i)=>i>legacyIndex&&!seen.has(r.id));
}
