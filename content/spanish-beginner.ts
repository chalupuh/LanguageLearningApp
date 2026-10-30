import type {Passage} from "./passages";
import {SPANISH_SPEECH_VERSION} from "../lib/speech-policy.ts";

const characters={sofia:{name:"Sofía",voice:"coral",role:"Learner's conversation partner"},mateo:{name:"Mateo",voice:"cedar",role:"Learner's conversation partner"}} as const;
const lessons=[
 ["hola","A1","¡Hola! Mucho gusto","Introductions",["¡Hola! Me llamo Sofía. ¿Cómo te llamas?","Me llamo Mateo. Mucho gusto.","¿De dónde eres?","Soy de Colombia. ¿Y tú?","Soy de México."],"¿Cómo te llamas?","What is your name?"],
 ["cafe","A1","Un café, por favor","Coffee",["Buenos días. Un café, por favor.","¿Con leche o sin leche?","Con un poco de leche, gracias.","¿Para aquí o para llevar?","Para llevar, por favor."],"¿Para aquí o para llevar?","For here or to go?"],
 ["desayuno","A1","El desayuno del hotel","Breakfast",["Buenos días. ¿Dónde está el desayuno?","Está en el primer piso.","¿A qué hora termina?","Termina a las diez.","Perfecto. Muchas gracias."],"¿A qué hora termina?","What time does it end?"],
 ["precio","A1","¿Cuánto cuesta?","Shopping",["Disculpe, ¿cuánto cuesta esta camisa?","Cuesta veinte dólares.","¿Tiene una talla más grande?","Sí, aquí tiene.","Me la llevo, gracias."],"¿Tiene una talla más grande?","Do you have a larger size?"],
 ["direccion","A1","¿Dónde está la estación?","Directions",["Disculpe, ¿dónde está la estación?","Siga derecho y doble a la izquierda.","¿Está lejos?","No, está a cinco minutos a pie.","Muchas gracias por su ayuda."],"Siga derecho y doble a la izquierda.","Go straight and turn left."],
 ["restaurante","A1","Una mesa para dos","Restaurant",["Buenas noches. ¿Tiene una mesa para dos?","Sí. ¿Adentro o afuera?","Adentro, por favor.","Aquí tienen el menú.","Gracias. ¿Nos trae agua, por favor?"],"¿Tiene una mesa para dos?","Do you have a table for two?"],
 ["planes","A2","Cambiar los planes","Daily plans",["¿Nos vemos en el café a las tres?","Lo siento, trabajo hasta las cuatro.","Entonces, ¿a las cuatro y media?","Sí, perfecto. Nos vemos frente a la estación.","De acuerdo. Hasta luego."],"Lo siento, trabajo hasta las cuatro.","I’m sorry, I work until four."],
 ["mercado","A2","En el mercado","Shopping",["Quisiera un kilo de manzanas, por favor.","Claro. ¿Quiere algo más?","¿Tiene peras maduras?","Todavía no. Estarán listas mañana.","Entonces, solo las manzanas. ¿Puedo pagar con tarjeta?","Sí, por supuesto."],"¿Puedo pagar con tarjeta?","Can I pay by card?"],
 ["ayer","A2","Lo que pasó ayer","Past events",["¿Llegaste tarde ayer?","Sí. Esperé el autobús durante veinte minutos.","¿Por qué no tomaste el metro?","La estación estaba cerrada, así que caminé.","¿A qué hora llegaste?","A las nueve y cuarto."],"La estación estaba cerrada, así que caminé.","The station was closed, so I walked."],
 ["farmacia","A2","En la farmacia","Health",["Buenos días. Me duele la garganta.","¿Tiene fiebre?","No, pero tengo tos desde ayer.","Puede tomar estas pastillas y descansar.","¿Cuántas debo tomar?","Una cada ocho horas, después de comer."],"No, pero tengo tos desde ayer.","No, but I have had a cough since yesterday."],
 ["devolucion","A2","Cambiar una camisa","Shopping",["Compré esta camisa ayer, pero me queda pequeña.","¿Tiene el recibo?","Sí. Quisiera cambiarla por una talla más grande.","Tenemos la misma camisa en talla mediana.","Perfecto. ¿Puedo probármela?","Claro. Los probadores están al fondo."],"Compré esta camisa ayer, pero me queda pequeña.","I bought this shirt yesterday, but it is too small for me."],
 ["finsemana","A2","Un fin de semana diferente","Story",["¿Qué hiciste el fin de semana?","Queríamos ir al parque, pero llovió mucho.","¿Qué hicieron entonces?","Visitamos un museo cerca de casa.","Después tomamos chocolate caliente.","El próximo sábado vamos a intentar ir al parque otra vez."],"Queríamos ir al parque, pero llovió mucho.","We wanted to go to the park, but it rained a lot."],
] as const;

export const spanishBeginnerPassages:Passage[]=lessons.map(([id,level,title,topic,lines,decode,translation])=>({
 id:`es-${id}`,language:"es",level,title,topic,xp:40,category:"everyday",releasedAt:"2026-10-30",speechStyle:"beginner",
 text:lines.join("\n"),decode,translation,phrase:decode,meaning:translation,
 challenges:level==="A1"?["Core everyday vocabulary","Spanish vowels","Question rhythm"]:["Past and future time","Object pronouns","Connected speech"],
 comprehensionPoints:[`Understand the ${topic.toLowerCase()} situation`,"Identify the key detail","Follow how the exchange ends"],
 speaker:{name:"Sofía y Mateo",age:30,location:"Latin America",voice:"coral",initials:"SM"},
 cast:characters,
 dialogue:lines.map((text,index)=>{const character=index%2?"mateo":"sofia";const actor=characters[character];return{id:`es-${id}:t${String(index+1).padStart(2,"0")}`,character,role:actor.name,text,voice:actor.voice}}),
 audioFile:`/audio/passages/${SPANISH_SPEECH_VERSION}/es-${id}.wav`,
}));
