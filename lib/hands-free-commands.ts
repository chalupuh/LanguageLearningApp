export const handsFreeCommands=["repeat","slower","normal-speed","next","back","pause","continue","help","stop-session","submit","try-again","skip"] as const;
export type HandsFreeCommand=typeof handsFreeCommands[number];

const phrases:Record<HandsFreeCommand,readonly string[]>={
 repeat:["repeat","repeat that","again","play that again"],
 slower:["slower","slow down","play slower"],
 "normal-speed":["normal speed","regular speed","play normally"],
 next:["next","next one","next lesson"],
 back:["back","go back","previous","previous one"],
 pause:["pause","pause session","hold on"],
 continue:["continue","resume","keep going"],
 help:["help","what can i say","commands"],
 "stop-session":["stop session","end session","finish session"],
 submit:["submit","submit answer","send answer"],
 "try-again":["try again","record again","redo answer"],
 skip:["skip","skip this","skip answer"],
};

export function normalizeHandsFreeUtterance(value:string){return value.toLocaleLowerCase("en-US").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s'-]/g," ").replace(/\s+/g," ").trim()}

export function parseHandsFreeCommand(value:string,mode:"session"|"answer"="session"):HandsFreeCommand|null{
 const normalized=normalizeHandsFreeUtterance(value);if(!normalized)return null;
 const allowed=mode==="answer"?handsFreeCommands:handsFreeCommands.filter(command=>!["submit","try-again","skip"].includes(command));
 for(const command of allowed)if(phrases[command].includes(normalized))return command;
 return null;
}

export function handsFreeConfirmation(command:HandsFreeCommand){
 return ({repeat:"Repeating.",slower:"Slower speed.","normal-speed":"Normal speed.",next:"Next item.",back:"Going back.",pause:"Session paused.",continue:"Continuing.",help:"You can say repeat, slower, normal speed, next, back, pause, continue, help, or stop session.","stop-session":"Session stopped.",submit:"Answer submitted.","try-again":"Let's try that answer again.",skip:"Answer skipped."} satisfies Record<HandsFreeCommand,string>)[command];
}
