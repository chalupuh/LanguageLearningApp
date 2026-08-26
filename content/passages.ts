export type Speaker = {
  name: string;
  age: number;
  location: string;
  voice: string;
  initials: string;
};

export type Passage = {
  id: string;
  level: "B1" | "B1+" | "B2" | "B2+";
  title: string;
  topic: string;
  xp: number;
  text: string;
  decode: string;
  translation: string;
  phrase: string;
  meaning: string;
  speaker: Speaker;
  audioFile?: string;
  challenges: string[];
  comprehensionPoints: string[];
};

const lea: Speaker = { name: "Léa", age: 29, location: "Paris", voice: "marin", initials: "L" };
const thomas: Speaker = { name: "Thomas", age: 34, location: "Lyon", voice: "cedar", initials: "T" };
const ines: Speaker = { name: "Inès", age: 26, location: "Lille", voice: "coral", initials: "I" };
const malik: Speaker = { name: "Malik", age: 38, location: "Nantes", voice: "onyx", initials: "M" };

export const passages: Passage[] = [
  {
    id: "cafe", level: "B1", title: "Un café à emporter", topic: "Daily life", xp: 30, speaker: lea,
    audioFile: "/audio/passages/cafe.mp3",
    text: "Ce matin, j’étais tellement à la bourre que j’ai même pas eu le temps de prendre un café chez moi. Du coup, je me suis arrêtée dans ce petit café près du métro. Il y avait un monde fou, mais le serveur était super sympa. Il m’a préparé mon café en deux minutes, et finalement, je suis arrivée juste à temps.",
    decode: "Ce matin, j’étais tellement à la bourre que j’ai même pas eu le temps de prendre un café chez moi.",
    translation: "This morning, I was running so late that I didn’t even have time to make coffee at home.",
    phrase: "être à la bourre", meaning: "informal · to be running late",
    challenges: ["informal negation", "du coup", "fast linking"],
    comprehensionPoints: ["She was late", "She stopped near the metro", "The server was quick", "She arrived on time"],
  },
  {
    id: "marche", level: "B1", title: "Le marché du dimanche", topic: "Food", xp: 30, speaker: thomas,
    audioFile: "/audio/passages/marche.mp3",
    text: "Le dimanche matin, je vais presque toujours au marché de mon quartier. J’y achète des légumes, du fromage et parfois un poulet rôti. La semaine dernière, mon marchand habituel n’était pas là, alors j’ai essayé un autre stand. Les tomates étaient un peu plus chères, mais elles avaient beaucoup plus de goût. Depuis, j’hésite à changer mes habitudes.",
    decode: "Mon marchand habituel n’était pas là, alors j’ai essayé un autre stand.",
    translation: "My usual vendor wasn’t there, so I tried another stall.",
    phrase: "changer ses habitudes", meaning: "to change one’s habits",
    challenges: ["the pronoun y", "partitive articles", "imperfect versus past"],
    comprehensionPoints: ["He goes on Sundays", "His usual vendor was absent", "He tried another stall", "The tomatoes tasted better"],
  },
  {
    id: "voisin", level: "B1", title: "Le nouveau voisin", topic: "Community", xp: 30, speaker: ines,
    audioFile: "/audio/passages/voisin.mp3",
    text: "Un nouveau voisin s’est installé juste au-dessus de chez moi. Au début, je ne le voyais jamais, mais samedi, on s’est croisés dans l’escalier. Il venait de casser une étagère et cherchait une perceuse pour la réparer. Je lui ai prêté la mienne, et le soir, il est redescendu avec un gâteau au chocolat pour me remercier. Plutôt sympa comme première rencontre.",
    decode: "Samedi, on s’est croisés dans l’escalier.",
    translation: "On Saturday, we ran into each other on the stairs.",
    phrase: "se croiser", meaning: "to run into one another",
    challenges: ["reflexive past tense", "venir de", "casual on"],
    comprehensionPoints: ["A neighbor moved upstairs", "He needed a drill", "She lent hers", "He brought cake"],
  },
  {
    id: "train", level: "B1", title: "Le mauvais train", topic: "Travel", xp: 35, speaker: malik,
    audioFile: "/audio/passages/train.mp3",
    text: "Hier, je devais aller à Rennes pour une réunion. À la gare, j’étais au téléphone et je ne faisais pas vraiment attention aux panneaux. Je suis monté dans un train qui partait à la même heure, mais dans la direction opposée. Je m’en suis rendu compte après vingt minutes. Heureusement, le contrôleur m’a aidé à trouver un autre trajet et je ne suis arrivé qu’avec une heure de retard.",
    decode: "Je m’en suis rendu compte après vingt minutes.",
    translation: "I realized it after twenty minutes.",
    phrase: "se rendre compte", meaning: "to realize",
    challenges: ["imperfect background", "en pronoun", "relative clause"],
    comprehensionPoints: ["He was traveling to Rennes", "He boarded the wrong train", "He noticed after twenty minutes", "The conductor helped"],
  },
  {
    id: "anniversaire", level: "B1", title: "Une surprise ratée", topic: "Relationships", xp: 35, speaker: lea,
    audioFile: "/audio/passages/anniversaire.mp3",
    text: "Pour l’anniversaire de ma sœur, on voulait lui organiser une fête surprise. Tout le monde devait arriver avant huit heures et se cacher dans le salon. Le problème, c’est que mon cousin lui a envoyé un message destiné au groupe. Il lui demandait d’apporter les bougies pour le gâteau. Elle a tout compris, évidemment, mais elle a fait semblant d’être surprise pour nous faire plaisir.",
    decode: "Mon cousin lui a envoyé un message destiné au groupe.",
    translation: "My cousin sent her a message intended for the group.",
    phrase: "faire semblant", meaning: "to pretend",
    challenges: ["indirect object pronouns", "intended recipient", "faire semblant"],
    comprehensionPoints: ["They planned a surprise", "A cousin sent the wrong message", "The sister understood", "She pretended to be surprised"],
  },
  {
    id: "medecin", level: "B1", title: "Un rendez-vous déplacé", topic: "Health", xp: 35, speaker: thomas,
    audioFile: "/audio/passages/medecin.mp3",
    text: "J’avais rendez-vous chez le médecin mardi après-midi, mais le cabinet m’a appelé le matin même. Le médecin avait une urgence et ne pouvait pas me recevoir. On m’a proposé jeudi à neuf heures, sauf que je commence le travail à huit heures et demie. Finalement, j’ai accepté un rendez-vous vendredi pendant ma pause déjeuner. Ce n’est pas idéal, mais au moins je n’aurai pas à attendre deux semaines.",
    decode: "Le cabinet m’a appelé le matin même.",
    translation: "The doctor’s office called me that very morning.",
    phrase: "le matin même", meaning: "that very morning",
    challenges: ["medical-office vocabulary", "time negotiation", "future tense"],
    comprehensionPoints: ["Tuesday was cancelled", "The doctor had an emergency", "Thursday conflicted with work", "Friday lunch was accepted"],
  },
  {
    id: "pluie", level: "B1", title: "Pris sous la pluie", topic: "Story", xp: 35, speaker: ines,
    audioFile: "/audio/passages/pluie.mp3",
    text: "Quand je suis sortie du bureau, il faisait encore beau. J’ai donc décidé de rentrer à pied au lieu de prendre le bus. Dix minutes plus tard, un énorme orage a commencé. Je n’avais ni parapluie ni veste, alors je me suis abritée sous l’entrée d’une boulangerie. La boulangère m’a offert un thé chaud pendant que j’attendais. Je suis rentrée trempée, mais de très bonne humeur.",
    decode: "Je me suis abritée sous l’entrée d’une boulangerie.",
    translation: "I took shelter under the entrance of a bakery.",
    phrase: "être trempé", meaning: "to be soaked",
    challenges: ["weather background", "neither nor", "while clause"],
    comprehensionPoints: ["She chose to walk", "A storm began", "She sheltered at a bakery", "The baker offered tea"],
  },
  {
    id: "cuisine", level: "B1", title: "Le dîner improvisé", topic: "Home", xp: 35, speaker: malik,
    audioFile: "/audio/passages/cuisine.mp3",
    text: "Des amis sont passés chez moi sans prévenir hier soir. Je n’avais presque rien dans le frigo, juste quelques œufs, des champignons et un reste de fromage. On a décidé de préparer une grande omelette tous ensemble. Chacun a trouvé quelque chose à ajouter, même un peu de salade sur le balcon. Ce n’était pas le dîner le plus élégant du monde, mais on a passé une excellente soirée.",
    decode: "Des amis sont passés chez moi sans prévenir.",
    translation: "Some friends stopped by my place without warning.",
    phrase: "sans prévenir", meaning: "without warning or letting someone know",
    challenges: ["passer chez", "food quantities", "imperfect evaluation"],
    comprehensionPoints: ["Friends arrived unexpectedly", "The fridge was nearly empty", "They made an omelet together", "They enjoyed the evening"],
  },
  {
    id: "coloc", level: "B1+", title: "La vie en colocation", topic: "Conversation", xp: 40, speaker: ines,
    text: "Au début, vivre en colocation me faisait un peu peur. Mais on a rapidement trouvé notre rythme. Chacun prépare le dîner une fois par semaine et, le dimanche, on prend le temps de discuter de ce qui a bien marché ou non.", decode: "Mais on a rapidement trouvé notre rythme.", translation: "But we quickly found a routine that worked for us.", phrase: "trouver son rythme", meaning: "to settle into a routine", challenges: ["rhythm", "relative clause"], comprehensionPoints: ["She was worried", "They created a routine"],
  },
  {
    id: "remote", level: "B2", title: "Le travail à distance", topic: "Society", xp: 45, speaker: thomas,
    text: "Le télétravail offre une liberté appréciable, mais il brouille parfois la frontière entre la vie professionnelle et la vie privée. Pour que cela fonctionne, il faut savoir organiser son temps, communiquer clairement et surtout apprendre à déconnecter.", decode: "Il brouille parfois la frontière entre la vie professionnelle et la vie privée.", translation: "It sometimes blurs the boundary between professional and private life.", phrase: "brouiller la frontière", meaning: "to blur the boundary", challenges: ["abstract vocabulary", "subjunctive trigger"], comprehensionPoints: ["Remote work offers freedom", "It can blur boundaries", "Organization matters"],
  },
  {
    id: "nuance", level: "B2+", title: "Changer de perspective", topic: "Ideas", xp: 55, speaker: malik,
    text: "On présente souvent le changement comme une rupture soudaine. Pourtant, les transformations les plus profondes viennent parfois d’une série de décisions presque imperceptibles qui finissent par modifier notre manière de voir le monde.", decode: "Les transformations les plus profondes viennent parfois d’une série de décisions presque imperceptibles.", translation: "The deepest transformations sometimes come from a series of almost imperceptible decisions.", phrase: "presque imperceptible", meaning: "almost too subtle to notice", challenges: ["abstract reasoning", "relative clauses"], comprehensionPoints: ["Change is often portrayed as sudden", "Deep change can be gradual"],
  },
];
