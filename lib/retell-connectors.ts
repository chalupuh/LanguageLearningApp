export type ConnectorSuggestion={afterText:string;connector:string;reason:string};

const existing=/\b(d'abord|ensuite|puis|donc|mais|en fait|par exemple|finalement|pour finir|först|sedan|därefter|så|men|till exempel|till sist)\b/i;

export function connectorSuggestions(text:string,language:"fr"|"sv"):ConnectorSuggestion[]{
 const matches=[...text.matchAll(/[^.!?\n]+[.!?]+(?=\s|$)/g)];
 const links=language==="fr"?["Ensuite,","Donc,","Pour finir,"]:["Sedan,","Så,","Till sist,"];
 return matches.slice(0,3).flatMap((match,index)=>{
  const following=text.slice((match.index||0)+match[0].length).trimStart();
  if(!following||existing.test(following.slice(0,40)))return [];
  return [{afterText:match[0],connector:links[Math.min(index,links.length-1)],reason:index===matches.length-1?"Signal the final idea or outcome.":"Make the next step easier to follow."}];
 });
}
