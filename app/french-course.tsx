"use client";
import {createContext,useContext} from "react";
import {frenchContentVisible,canHideBeginnerContent,frenchStage,courseRequirements,type FrenchCourse} from "../lib/french-progression";
import {passages} from "../content/passages";
export const FrenchCourseContext=createContext<{course:FrenchCourse;completed:string[];showBeginnerContent?:boolean;onShowBeginnerContent?:(show:boolean)=>void}>({course:"legacy",completed:[],showBeginnerContent:false});
export const useFrenchCourse=()=>useContext(FrenchCourseContext);
export function useCourseCatalog(language:string){const {course,completed,showBeginnerContent}=useFrenchCourse();return passages.filter(p=>(p.language||"fr")===language&&(language!=="fr"||frenchContentVisible(p.level,course,completed,showBeginnerContent)));}
export function FrenchCourseGuide({tutorial,onTutorial,onLesson,onAnnouncements}:{tutorial:number;onTutorial:(n:number)=>void;onLesson:()=>void;onAnnouncements:()=>void}){
 const {course,completed,showBeginnerContent}=useFrenchCourse();if(course==="legacy"||(canHideBeginnerContent(course,completed)&&!showBeginnerContent))return null;
 const stage=frenchStage(course,completed),requirements=courseRequirements(course);
 const steps=[
  ["Welcome to your own French notebook","Today suggests a short session. Your progress and activity belong to your signed-in account. Start at A1; there is no placement choice."],
  ["Find your first listen","Library → Announcements has four short A1 checks. Listen to the end, choose your answers, and check them. Replay as often as you need."],
  ["Try a conversation","Listen for the situation; a few English words are enough. Listen closer reveals the text. Then practise a short phrase or retell, and finish with a simple French sentence."],
  ["Find your progress and ask for help","Progress shows your activity. The profile button opens My feature requests: report confusing navigation, fast audio, or an idea. Requests stay attached to your account."],
 ];
 return <section className="journey-card" data-usage-feature="beginner-onboarding" aria-label="French starter path"><p className="eyebrow">Your French starter path · {stage}</p><h2>A1 → A2 → B1 → B2</h2><p>These are practice stages, not CEFR certificates. This practice pack contains eight conversations and four announcements at each of A1 and A2. It is not a complete CEFR syllabus.</p><ol>{(["A1","A2","B1"] as const).map(level=><li key={level}>{level}: {requirements[level].filter(id=>completed.includes(id)).length}/{requirements[level].length} required conversation loops saved → unlock {level==="A1"?"A2":level==="A2"?"B1":"B2"}</li>)}</ol><p>A loop requires an initial summary, a Listen closer reflection, completed retell practice or rehearsal, and a final retell. Announcements are optional preparation and do not unlock stages. B1 and B2 use the existing library.</p><div className="tool-row"><button onClick={onAnnouncements}>Start with beginner announcements</button><button onClick={onLesson}>Open first A1 conversation</button></div>{tutorial<steps.length?<div aria-live="polite"><p>Navigation tour · {tutorial+1} of {steps.length}</p><h3>{steps[tutorial][0]}</h3><p>{steps[tutorial][1]}</p><button onClick={()=>onTutorial(tutorial+1)}>{tutorial===steps.length-1?"Finish tour":"Next tip"}</button></div>:<button onClick={()=>onTutorial(0)}>Replay navigation tour</button>}</section>;
}

export function BeginnerVisibilityToggle(){
 const {course,completed,showBeginnerContent,onShowBeginnerContent}=useFrenchCourse();
 if(!canHideBeginnerContent(course,completed))return null;
 return <section className="journey-card" aria-label="Beginner content visibility"><label><input type="checkbox" checked={showBeginnerContent===true} onChange={event=>onShowBeginnerContent?.(event.target.checked)}/> Show A1–A2 content</label><p>{showBeginnerContent?"Beginner lessons and announcements are included. Turn this off to focus on B1–B2.":"Your lessons, announcements and recommendations stay focused on B1–B2. Turn this on whenever you want to revisit the basics."}</p><small>This preference syncs with your account. Your saved progress stays intact.</small></section>;
}
