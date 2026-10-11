/** Seek fractions are independent of metadata, so a cold player can load first. */
export function seekTime(fraction:number,duration:number):number{
 if(!Number.isFinite(fraction)||!Number.isFinite(duration)||duration<=0)return 0;
 return Math.min(Math.max(0,duration-.05),Math.max(0,Math.min(1,fraction))*duration);
}
/** pause(), replacement playback, and capture locks may intentionally abort play(). */
export function playbackInterrupted(error:unknown):boolean{
 return typeof error==="object"&&error!==null&&"name" in error&&error.name==="AbortError";
}
