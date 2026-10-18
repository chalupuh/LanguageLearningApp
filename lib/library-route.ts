import type {LibrarySort,LibraryStatus} from "./library";
export type LibraryRoute={category:string;status:LibraryStatus;sort:LibrarySort};
export const defaultLibraryRoute:LibraryRoute={category:"all",status:"all",sort:"recommended"};
export function readLibraryRoute(hash:string,language:string):LibraryRoute {
 const [path,query=""]=hash.replace(/^#/,"").split("?");const params=new URLSearchParams(query),area=path.split("/")[1];
 const areas=language==="sv"?["all","everyday","announcements","situations","native","recordings"]:["all","everyday","announcements","situations","lab","native","recordings","poetry"];
 const status=params.get("status") as LibraryStatus,sort=params.get("sort") as LibrarySort;
 return {category:areas.includes(area)?area:"all",status:["all","not-started","in-progress","completed"].includes(status)?status:"all",sort:["recommended","newest","difficulty","title"].includes(sort)?sort:"recommended"};
}
export function libraryHash(route:LibraryRoute){return "#library/"+route.category+"?"+new URLSearchParams({status:route.status,sort:route.sort});}
