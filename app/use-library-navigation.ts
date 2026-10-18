"use client";
import {useEffect,useState} from "react";
import {defaultLibraryRoute,libraryHash,readLibraryRoute} from "../lib/library-route";
import type {LibrarySort,LibraryStatus} from "../lib/library";
export function useLibraryNavigation(language:string){
 const key="a-loreille-library-view:"+language;
 const [route,setRoute]=useState(()=>{
  if(typeof window==="undefined")return defaultLibraryRoute;
  let hash=window.location.hash;
  if(!hash.startsWith("#library/"))try{hash=sessionStorage.getItem(key)||hash}catch{}
  return readLibraryRoute(hash,language);
 });
 useEffect(()=>{const restore=()=>{if(window.location.hash.startsWith("#library"))setRoute(readLibraryRoute(window.location.hash,language))};window.addEventListener("popstate",restore);window.addEventListener("hashchange",restore);return()=>{window.removeEventListener("popstate",restore);window.removeEventListener("hashchange",restore)}},[language]);
 useEffect(()=>{const hash=libraryHash(route);try{sessionStorage.setItem(key,hash)}catch{}if(window.location.hash!==hash)window.history.pushState(null,"",hash)},[route,key]);
 return {...route,setCategory:(category:string)=>setRoute(v=>({...v,category})),setStatus:(status:LibraryStatus)=>setRoute(v=>({...v,status})),setSort:(sort:LibrarySort)=>setRoute(v=>({...v,sort}))};
}
