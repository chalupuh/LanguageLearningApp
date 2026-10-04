export const swedishFoundations = [
  {id:"start",number:"01",title:"Meet someone",canDo:"Say hello, give your name, and ask where someone is from.",lessonIds:["sv-hej"],accent:"Hej!"},
  {id:"fika",number:"02",title:"Order and make plans",canDo:"Order a drink and arrange a simple fika.",lessonIds:["sv-kaffe","sv-dagen"],accent:"En kaffe, tack."},
  {id:"table",number:"03",title:"Eat out",canDo:"Ask about breakfast, request a table, and handle an unavailable item.",lessonIds:["sv-frukost","sv-middag","sv-slut"],accent:"Kan vi få vatten?"},
  {id:"pay",number:"04",title:"Prices and payment",canDo:"Ask a price, understand a total, and pay by card.",lessonIds:["sv-priset"],accent:"Vad kostar det?"},
  {id:"move",number:"05",title:"Find your way",canDo:"Ask for a place and understand a short route or bus instruction.",lessonIds:["sv-vagen","sv-bussen"],accent:"Var ligger stationen?"},
  {id:"errands",number:"06",title:"Everyday errands",canDo:"Find an item and ask when a place opens or closes.",lessonIds:["sv-affaren","sv-oppet"],accent:"När öppnar ni?"},
  {id:"repair",number:"07",title:"Keep the conversation going",canDo:"Say you do not understand and ask someone to repeat.",lessonIds:["sv-hjalp"],accent:"Kan du säga det igen?"},
] as const;

export const swedishSentences = [
  {id:"v2-idag",prompt:"I work today.",tokens:["I dag","jobbar","jag"],answers:[["I dag","jobbar","jag"]],note:"When time comes first, the verb still stays second."},
  {id:"v2-imorgon",prompt:"Tomorrow I drink coffee.",tokens:["I morgon","dricker","jag","kaffe"],answers:[["I morgon","dricker","jag","kaffe"]],note:"Swedish main clauses usually keep the verb in position two."},
  {id:"question-name",prompt:"What is your name?",tokens:["Vad","heter","du"],answers:[["Vad","heter","du"]],note:"Question word + verb + person."},
  {id:"question-cost",prompt:"How much does it cost?",tokens:["Vad","kostar","det"],answers:[["Vad","kostar","det"]],note:"The present-tense verb comes before the subject in this question."},
  {id:"negation",prompt:"I do not understand.",tokens:["Jag","förstår","inte"],answers:[["Jag","förstår","inte"]],note:"In a simple main clause, inte normally follows the verb."},
  {id:"location",prompt:"The station is over there.",tokens:["Stationen","ligger","där","borta"],answers:[["Stationen","ligger","där","borta"]],note:"ligger is often used for where a place is located."},
  {id:"request",prompt:"Can we have water?",tokens:["Kan","vi","få","vatten"],answers:[["Kan","vi","få","vatten"]],note:"Kan vi få…? is a useful polite request frame."},
  {id:"fika-plan",prompt:"Would you like to have a fika after work?",tokens:["Vill","du","ta","en","fika","efter","jobbet"],answers:[["Vill","du","ta","en","fika","efter","jobbet"]],note:"Vill du…? makes an invitation or asks what someone wants."},
] as const;

export const swedishNouns = [
  {id:"kaffe",article:"ett",noun:"kaffe",definite:"kaffet",plural:"kaffen",meaning:"coffee",group:"Café"},
  {id:"bord",article:"ett",noun:"bord",definite:"bordet",plural:"bord",meaning:"table",group:"Café"},
  {id:"bulle",article:"en",noun:"bulle",definite:"bullen",plural:"bullar",meaning:"bun",group:"Café"},
  {id:"meny",article:"en",noun:"meny",definite:"menyn",plural:"menyer",meaning:"menu",group:"Café"},
  {id:"station",article:"en",noun:"station",definite:"stationen",plural:"stationer",meaning:"station",group:"Travel"},
  {id:"buss",article:"en",noun:"buss",definite:"bussen",plural:"bussar",meaning:"bus",group:"Travel"},
  {id:"rum",article:"ett",noun:"rum",definite:"rummet",plural:"rum",meaning:"room",group:"Travel"},
  {id:"gata",article:"en",noun:"gata",definite:"gatan",plural:"gator",meaning:"street",group:"Travel"},
  {id:"äpple",article:"ett",noun:"äpple",definite:"äpplet",plural:"äpplen",meaning:"apple",group:"Everyday"},
  {id:"påse",article:"en",noun:"påse",definite:"påsen",plural:"påsar",meaning:"bag",group:"Everyday"},
  {id:"kort",article:"ett",noun:"kort",definite:"kortet",plural:"kort",meaning:"card",group:"Everyday"},
  {id:"affär",article:"en",noun:"affär",definite:"affären",plural:"affärer",meaning:"shop",group:"Everyday"},
] as const;

export const swedishSounds = [
  {id:"i-y",focus:"i / y",left:"sil",right:"syl",prompt:"Which word means awl?",answer:"syl",tip:"For y, keep the tongue forward like i while rounding the lips."},
  {id:"u-o",focus:"u / o",left:"ful",right:"folk",prompt:"Which word means ugly?",answer:"ful",tip:"Swedish u is a tight rounded sound; it is not the English oo."},
  {id:"a-a",focus:"a / å",left:"tak",right:"tåk",prompt:"Which real word means roof?",answer:"tak",tip:"å is usually rounder and closer to the vowel in English ‘more’."},
  {id:"a-e",focus:"ä / e",left:"här",right:"herre",prompt:"Which word means here?",answer:"här",tip:"ä is an open front vowel. Let the jaw drop a little more than for e."},
  {id:"long-short",focus:"long / short vowel",left:"glas",right:"glass",prompt:"Which word means ice cream?",answer:"glass",tip:"A doubled consonant usually signals a shorter vowel before it."},
  {id:"sj",focus:"sj sound",left:"sju",right:"tu",prompt:"Which word is seven?",answer:"sju",tip:"The sj sound varies by speaker. First learn to recognize it as one sound family."},
  {id:"tj",focus:"tj sound",left:"kyrka",right:"gurka",prompt:"Which word means church?",answer:"kyrka",tip:"The soft k before y is light and hissy, with the tongue near the front."},
  {id:"stress",focus:"word stress",left:"banan",right:"bananen",prompt:"Which form means the banana?",answer:"bananen",tip:"Listen for the stressed syllable and the smaller rise-fall that follows it."},
] as const;

export const swedishListeningLadders = [
  {id:"ladder-kaffe",audio:"Jag tar en kaffe med lite mjölk.",hint:"Jag t___ en k___ med l___ mjölk.",translation:"I’ll have a coffee with a little milk."},
  {id:"ladder-buss",audio:"Bussen kommer om tio minuter.",hint:"B___ kommer om t___ minuter.",translation:"The bus comes in ten minutes."},
  {id:"ladder-oppet",audio:"På söndag har vi stängt.",hint:"På s___ har vi s___.",translation:"On Sunday we are closed."},
  {id:"ladder-vagen",audio:"Gå rakt fram och sväng vänster.",hint:"Gå r___ fram och s___ vänster.",translation:"Go straight ahead and turn left."},
] as const;

export const swedishDictations = [
  {id:"dict-hej",text:"Hej, jag heter Nikki.",meaning:"Hi, my name is Nikki."},
  {id:"dict-kaffe",text:"En kaffe med mjölk, tack.",meaning:"A coffee with milk, please."},
  {id:"dict-buss",text:"När kommer bussen?",meaning:"When does the bus arrive?"},
  {id:"dict-stangt",text:"Affären är stängd.",meaning:"The shop is closed."},
  {id:"dict-forstar",text:"Förlåt, jag förstår inte.",meaning:"Sorry, I do not understand."},
  {id:"dict-vader",text:"Det är vackert väder i dag.",meaning:"The weather is beautiful today."},
] as const;

export const swedishMissions = [
  {id:"cafe",icon:"☕",title:"The fika order",setting:"A café in Stockholm",goal:"Order coffee, respond about milk, and choose takeaway.",steps:[
    {line:"Hej! Vad får det lov att vara?",meaning:"Hello! What would you like?",choices:["En kaffe, tack.","Var ligger stationen?","Jag heter Nikki."],answer:0,reply:"Absolut. Vill du ha mjölk?"},
    {line:"Vill du ha mjölk?",meaning:"Would you like milk?",choices:["Ja, lite mjölk, tack.","Klockan tio.","Nej, jag är stationen."],answer:0,reply:"Sitta här eller ta med?"},
    {line:"Sitta här eller ta med?",meaning:"Stay here or take away?",choices:["Jag tar med.","Jag går vänster.","Jag betalar i morgon."],answer:0,reply:"Toppen. Det blir fyrtio kronor."},
  ]},
  {id:"station",icon:"🚉",title:"Find the station",setting:"A street near the center",goal:"Ask for the station and confirm the direction.",steps:[
    {line:"Hej! Behöver du hjälp?",meaning:"Hi! Do you need help?",choices:["Ja, var ligger stationen?","Ett bord för två.","En påse, tack."],answer:0,reply:"Gå rakt fram och sväng vänster."},
    {line:"Gå rakt fram och sväng vänster.",meaning:"Go straight and turn left.",choices:["Är det långt?","Vad kostar bullen?","När öppnar frukosten?"],answer:0,reply:"Nej, ungefär fem minuter."},
    {line:"Nej, ungefär fem minuter.",meaning:"No, about five minutes.",choices:["Tack för hjälpen!","Jag tar en kaffe.","Jag förstår mjölk."],answer:0,reply:"Varsågod!"},
  ]},
  {id:"shop",icon:"🛍",title:"Pay at the shop",setting:"A neighborhood bakery",goal:"Ask a price, choose a quantity, and pay by card.",steps:[
    {line:"Kan jag hjälpa dig?",meaning:"Can I help you?",choices:["Vad kostar den här bullen?","Var är bussen?","När är söndag?"],answer:0,reply:"Den kostar trettio kronor."},
    {line:"Den kostar trettio kronor.",meaning:"It costs thirty kronor.",choices:["Jag tar två, tack.","Jag heter två.","Jag svänger två."],answer:0,reply:"Det blir sextio kronor."},
    {line:"Det blir sextio kronor.",meaning:"That comes to sixty kronor.",choices:["Kan jag betala med kort?","Kan jag säga stationen?","Kan jag öppna mjölk?"],answer:0,reply:"Ja, det går bra."},
  ]},
  {id:"repair",icon:"↻",title:"Ask for help",setting:"A hotel corridor",goal:"Repair the conversation when a number is unclear.",steps:[
    {line:"Du ska gå till rum femton.",meaning:"You should go to room fifteen.",choices:["Förlåt, jag förstår inte.","Jag tar rum kaffe.","Det kostar vänster."],answer:0,reply:"Inga problem."},
    {line:"Inga problem.",meaning:"No problem.",choices:["Kan du säga det igen?","Vill du ha mjölk?","När stänger bussen?"],answer:0,reply:"Rum femton. Ett, fem."},
    {line:"Rum femton. Ett, fem.",meaning:"Room fifteen. One, five.",choices:["Femton?","Femtio?","Fem?"],answer:0,reply:"Ja, precis. På andra våningen."},
  ]},
] as const;

export const swedishDailyMinutes = [
  {id:"minute-hej",text:"Hej! Jag heter Nikki. Vad heter du?",meaning:"Hi! My name is Nikki. What is your name?",prompt:"Say it once, then replace Nikki with another name."},
  {id:"minute-kaffe",text:"En kaffe med lite mjölk, tack.",meaning:"A coffee with a little milk, please.",prompt:"Say the order, then change the drink or milk."},
  {id:"minute-fika",text:"Vill du ta en fika efter jobbet?",meaning:"Would you like to have a fika after work?",prompt:"Change efter jobbet to a time that suits you."},
  {id:"minute-pris",text:"Vad kostar den här bullen?",meaning:"How much does this bun cost?",prompt:"Point to an imaginary item and ask the question."},
  {id:"minute-buss",text:"När kommer bussen?",meaning:"When does the bus arrive?",prompt:"Swap bussen for tåget, the train."},
  {id:"minute-vag",text:"Gå rakt fram och sväng vänster.",meaning:"Go straight ahead and turn left.",prompt:"Say it again with höger, right."},
  {id:"minute-oppet",text:"När öppnar ni i morgon?",meaning:"When do you open tomorrow?",prompt:"Ask again using stänger, close."},
  {id:"minute-repair",text:"Förlåt, kan du säga det igen?",meaning:"Sorry, can you say that again?",prompt:"Say it slowly enough that you could use it under pressure."},
] as const;
