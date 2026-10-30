import {authorizeAppRequest} from "./app-auth";
// French keeps its original storage key. Swedish gets an internal namespace;
// the authenticated user id is always determined by the existing auth boundary.
export function authorizeLearningRequest(request:Request){
 const auth=authorizeAppRequest(request);
 const requested=new URL(request.url).searchParams.get("language");
 const language=requested==="sv"||requested==="es"?requested:"fr";
 return {...auth,language,accountUserId:auth.identity?.userId,identity:auth.identity?{...auth.identity,userId:language==="fr"?auth.identity.userId:`track:${language}:${auth.identity.userId}`}:null};
}
