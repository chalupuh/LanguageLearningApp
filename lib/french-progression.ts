export type FrenchCourse = "beginner-v1" | "beginner-v2" | "legacy";
export const starterRequirements = {
 A1: ["fr-a1-bonjour","fr-a1-cafe","fr-a1-gare","fr-a1-repeter"],
 A2: ["fr-a2-rendezvous","fr-a2-marche","fr-a2-hier"],
 B1: ["cafe","marche","voisin","train"],
};
export const requirements={
 A1:[...starterRequirements.A1,"fr-a1-boulangerie","fr-a1-direction","fr-a1-table","fr-a1-journee"],
 A2:[...starterRequirements.A2,"fr-a2-dejeuner","fr-a2-addition","fr-a2-petitdejeuner","fr-a2-retour","fr-a2-weekend"],
 B1:starterRequirements.B1,
};
export const courseRequirements=(course:FrenchCourse)=>course==="beginner-v1"?starterRequirements:requirements;
export const readFrenchCourse=(value:unknown):FrenchCourse=>value==="beginner-v1"||value==="beginner-v2"?value:"legacy";
export function frenchStage(course:FrenchCourse, completed:readonly string[]) {
 if(course==="legacy")return "B2";
 const done=new Set(completed),required=courseRequirements(course);
 for(const level of ["A1","A2","B1"] as const)if(!required[level].every(id=>done.has(id)))return level;
 return "B2";
}
export function frenchAccess(level:string,course:FrenchCourse,completed:readonly string[]) {
 if(course==="legacy")return true;
 const rank:Record<string,number>={A1:0,A2:1,B1:2,"B1+":2,B2:3,"B2+":3};
 return level in rank && rank[level]<=rank[frenchStage(course,completed)];
}
export function verifiedCourseCompletions(events:{kind:string;source:string}[]) {
 return [...new Set(events.filter(e=>e.kind==="loop"||e.kind==="review").map(e=>e.source).filter(s=>s.startsWith("library:")).map(s=>s.slice(8)))];
}
export function courseForState(state:Record<string,unknown>|null):FrenchCourse {
 if(state&&Object.keys(state).every(key=>key==="holidayTheme"))return "beginner-v2";
 return state?.frenchCourse==="beginner-v1"||state?.frenchCourse==="beginner-v2"?state.frenchCourse:state?"legacy":"beginner-v2";
}

// Visibility is a personal preference, separate from course access and completion.
export function canHideBeginnerContent(course:FrenchCourse,completed:readonly string[]){
 return course==="legacy"||["B1","B2"].includes(frenchStage(course,completed));
}
export function frenchContentVisible(level:string,course:FrenchCourse,completed:readonly string[],showBeginnerContent=false){
 return frenchAccess(level,course,completed)&&(!["A1","A2"].includes(level)||!canHideBeginnerContent(course,completed)||showBeginnerContent===true);
}
