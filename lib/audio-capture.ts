export function recordingError(error: unknown): string {
  const name=(error as {name?:string})?.name || "UnknownError";
  const messages:Record<string,string>={
    NotAllowedError:"Microphone access was blocked by the browser or operating system. Check both permissions. If this is an embedded preview, open the app directly in Chrome.",
    SecurityError:"This page is not allowed to use the microphone. Open the HTTPS app directly in Chrome, outside an embedded preview.",
    NotFoundError:"No microphone was found. Connect a microphone and select it in Chrome’s microphone settings, then retry.",
    NotReadableError:"The microphone could not be opened, even if permission is allowed. Close other recording apps/tabs and check Chrome’s selected input device, then retry.",
    AbortError:"The microphone connection was interrupted. Reconnect the microphone and retry.",
    NotSupportedError:"This browser could not start an audio recording. Update Chrome or try another supported browser.",
    OverconstrainedError:"The selected microphone is unavailable. Choose another input device and retry.",
    EmptyRecording:"No audio was captured. Check your microphone and record again before requesting feedback.",
  };
  return `${messages[name]||"Recording could not start. Reload the app and retry. Include this error code when reporting the problem."} (${name})`;
}

export function audioFilename(type:string){return type.includes("mp4")?"recording.m4a":type.includes("ogg")?"recording.ogg":"recording.webm"}

export function createAudioCapture(callbacks:{onState:(state:"idle"|"starting"|"recording")=>void;onAudio:(blob:Blob)=>void;onError:(message:string)=>void}){
  let version=0, busy=false, stream:MediaStream|null=null, recorder:MediaRecorder|null=null, timer:ReturnType<typeof setTimeout>|null=null;
  const release=()=>{if(timer)clearTimeout(timer);timer=null;stream?.getTracks().forEach(t=>t.stop());stream=null;recorder=null;busy=false};
  const cancel=()=>{version++;const old=recorder;if(old){old.onstop=null;old.onerror=null;old.ondataavailable=null;try{if(old.state!=="inactive")old.stop()}catch{}}release();callbacks.onState("idle")};
  const start=async(deviceId="")=>{
    if(busy)return;busy=true;const attempt=++version;callbacks.onState("starting");
    try{
      const policy=(document as Document & {permissionsPolicy?:{allowsFeature:(feature:string)=>boolean};featurePolicy?:{allowsFeature:(feature:string)=>boolean}});
      if(!window.isSecureContext||!(policy.permissionsPolicy||policy.featurePolicy)?.allowsFeature?.("microphone") && (policy.permissionsPolicy||policy.featurePolicy))throw new DOMException("Microphone blocked by page policy","SecurityError");
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw new DOMException("Recording unavailable","NotSupportedError");
      const acquired=await navigator.mediaDevices.getUserMedia({audio:deviceId?{deviceId:{exact:deviceId}}:true});
      if(attempt!==version){acquired.getTracks().forEach(t=>t.stop());return}stream=acquired;
      if(!acquired.getAudioTracks().some(t=>t.readyState==="live"))throw new DOMException("No live input","NotFoundError");
      const candidates=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"].filter(t=>MediaRecorder.isTypeSupported?.(t));
      // Retry format selection, never retry permission prompts automatically.
      for(const mimeType of [...candidates,""]){try{recorder=new MediaRecorder(acquired,mimeType?{mimeType}:undefined);break}catch(error){if((error as Error).name!=="NotSupportedError")throw error}}
      if(!recorder)throw new DOMException("No supported recording format","NotSupportedError");
      const current=recorder,chunks:Blob[]=[];
      current.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
      current.onerror=(event)=>{if(attempt!==version)return;const error=(event as Event & {error?:DOMException}).error;cancel();callbacks.onError(recordingError(error))};
      current.onstop=()=>{if(attempt!==version)return;const blob=new Blob(chunks,{type:current.mimeType||chunks[0]?.type||"audio/webm"});release();callbacks.onState("idle");if(blob.size)callbacks.onAudio(blob);else callbacks.onError(recordingError({name:"EmptyRecording"}))};
      current.start(250);callbacks.onState("recording");timer=setTimeout(()=>stop(),60000);
    }catch(error){if(attempt!==version)return;cancel();callbacks.onError(recordingError(error))}
  };
  const stop=()=>{if(recorder?.state!=="inactive"&&recorder){try{recorder.stop()}catch(error){cancel();callbacks.onError(recordingError(error))}}};
  return {start,stop,cancel};
}
