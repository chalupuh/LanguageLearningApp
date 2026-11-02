"use client";
import {useEffect,useRef,useState} from "react";

export type MobileDestination="today"|"swedish"|"spanish"|"library"|"handsfree"|"calendar"|"progress"|"about";

const icons:Record<MobileDestination,string>={today:"⌂",swedish:"Å",spanish:"Ñ",library:"◫",handsfree:"◖",calendar:"□",progress:"↗",about:"i"};
const labels:Record<MobileDestination,string>={today:"Today",swedish:"Learn",spanish:"Learn",library:"Library",handsfree:"Hands-free",calendar:"Calendar",progress:"Progress",about:"About"};

export default function MobileNavigation({language,view,onNavigate}:{language:"fr"|"sv"|"es";view:string;onNavigate:(destination:MobileDestination)=>void}){
 const [moreOpen,setMoreOpen]=useState(false);const moreButton=useRef<HTMLButtonElement|null>(null),sheet=useRef<HTMLDivElement|null>(null);
 const lab:MobileDestination|null=language==="sv"?"swedish":language==="es"?"spanish":null;
 const primary=["today",...(lab?[lab]:[]),"library","handsfree","progress"] as MobileDestination[];
 useEffect(()=>{if(!moreOpen)return;sheet.current?.querySelector<HTMLButtonElement>("button")?.focus();const close=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMoreOpen(false);moreButton.current?.focus();return}if(event.key!=="Tab"||!sheet.current)return;const items=[...sheet.current.querySelectorAll<HTMLButtonElement>("button")];const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[moreOpen]);
 const go=(destination:MobileDestination)=>{setMoreOpen(false);onNavigate(destination)};
 return <>
  {moreOpen&&<button className="mobile-more-scrim" aria-label="Close navigation menu" onClick={()=>setMoreOpen(false)}/>} 
  {moreOpen&&<div ref={sheet} className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="More destinations">
   <div><p>More places</p><button onClick={()=>setMoreOpen(false)} aria-label="Close more destinations">×</button></div>
   <button onClick={()=>go("calendar")}><span aria-hidden="true">{icons.calendar}</span><strong>My Calendar</strong><small>Plan a gentle practice rhythm</small></button>
   <button onClick={()=>go("about")}><span aria-hidden="true">{icons.about}</span><strong>About and guide</strong><small>How the listening loop works</small></button>
  </div>}
  <nav className="mobile-nav" aria-label="Mobile navigation">
   {primary.map(destination=>{const active=view===destination||(destination==="today"&&view==="practice");return <button key={destination} className={(active?"active ":"")+(destination==="handsfree"?"hands-free-destination":"")} aria-current={active?"page":undefined} onClick={()=>go(destination)}><span aria-hidden="true">{icons[destination]}</span><small>{labels[destination]}</small></button>})}
   <button ref={moreButton} aria-expanded={moreOpen} aria-haspopup="dialog" onClick={()=>setMoreOpen(value=>!value)}><span aria-hidden="true">•••</span><small>More</small></button>
  </nav>
 </>;
}
