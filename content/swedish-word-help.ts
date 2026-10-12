// Small authored clues, not generated translations or whole-answer reveals.
const glossary:Record<string,string>={
 "hej":"hello","heter":"am/is called","jag":"I","du":"you","vi":"we","ni":"you (plural or polite)",
 "tack":"thank you / please","är":"am / is / are","kaffe":"coffee","mjölk":"milk","lite":"a little","med":"with","en":"a/an (en-word)","ett":"a/an (ett-word)",
 "fika":"a coffee break, often with something to eat","efter":"after","jobbet":"work / the job","jobbar":"work / works","dricker":"drink / drinks","i dag":"today","i morgon":"tomorrow",
 "vad":"what","heter du":"are you called","kostar":"costs","bullen":"the bun","trettio":"thirty","sextio":"sixty","kronor":"Swedish kronor","två":"two","kort":"card","betala":"pay",
 "när":"when","kommer":"comes / arrives","bussen":"the bus","tio":"ten","minuter":"minutes","om":"in (a period of time)","klockan":"at (a clock time)",
 "gå":"go / walk","rakt fram":"straight ahead","sväng":"turn","vänster":"left","höger":"right","stationen":"the station","ligger":"is located","där borta":"over there",
 "öppnar":"open / opens","stänger":"close / closes","söndag":"Sunday","stängt":"closed","stängd":"closed","affären":"the shop","på":"on / at",
 "förlåt":"sorry / excuse me","förstår":"understand / understands","inte":"not","säga":"say","igen":"again","hjälp":"help","hjälpen":"the help","behöver":"need / needs",
 "kan":"can","få":"get / have","vatten":"water","vill":"want / would like","ha":"have","sitta":"sit","här":"here","ta med":"take away / bring along",
 "rum":"room","femton":"fifteen","fem":"five","inga problem":"no problem","vackert":"beautiful","väder":"weather","sil":"sieve / strainer","syl":"awl","ful":"ugly","folk":"people","tak":"roof","herre":"gentleman","glas":"glass (a drinking vessel)","glass":"ice cream","sju":"seven","tu":"two (older expression)","kyrka":"church","gurka":"cucumber","banan":"banana","bananen":"the banana"
};
export function swedishWordClues(text:string){
 const words=text.normalize("NFC").toLocaleLowerCase("sv").match(/[\p{L}]+/gu)||[],sentence=" "+words.join(" ")+" ";
 return Object.entries(glossary).filter(([word])=>sentence.includes(" "+word+" ")).sort(([a],[b])=>b.length-a.length||a.localeCompare(b,"sv")).slice(0,3).map(([word,meaning])=>({word,meaning}));
}
