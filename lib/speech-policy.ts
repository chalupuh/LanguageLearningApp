export const SWEDISH_SPEECH_VERSION="sv-native-v3";
export function speechVersion(language:string){return language==="sv"?SWEDISH_SPEECH_VERSION:"multilingual-v2"}
export function speechInstructions(language:string){
 return language==="sv"
  ? "Läs endast den angivna svenska texten på tydlig, naturlig standardsvenska från Sverige. Behåll svenska vokaler, ordaccent, betoning och skillnaden mellan lång vokal och lång konsonant. Tala lugnt men sammanhängande för en nybörjare. Uttala inledande konsonanter tydligt, särskilt t i tack. Tack har ett tydligt t, kort a och långt k. Är uttalas med svensk ä-vokal och ett lätt naturligt r i tydligt tal. Bevara skillnaderna mellan i, y, u, o, å, ä och ö. Läs hela ord, inte bokstavsnamn. Lägg inte till förklaringar eller andra ord."
  : "Speak natural contemporary French with a native French accent. Warm, realistic conversational pacing. No English accent or theatrical delivery.";
}
