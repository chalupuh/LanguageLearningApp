import type { Passage } from "./passages";
// Original public-domain French texts; notes and translations authored for this app.
const poems = [
 {id:"poeme-demain",title:"Demain, dès l’aube",author:"Victor Hugo",year:1856,level:"B1+",source:"https://fr.wikisource.org/wiki/Les_Contemplations/«_Demain,_dès_l’aube,_à_l’heure_où_blanchit_la_campagne_»",text:`Demain, dès l’aube, à l’heure où blanchit la campagne,
Je partirai. Vois-tu, je sais que tu m’attends.
J’irai par la forêt, j’irai par la montagne.
Je ne puis demeurer loin de toi plus longtemps.

Je marcherai les yeux fixés sur mes pensées,
Sans rien voir au dehors, sans entendre aucun bruit,
Seul, inconnu, le dos courbé, les mains croisées,
Triste, et le jour pour moi sera comme la nuit.

Je ne regarderai ni l’or du soir qui tombe,
Ni les voiles au loin descendant vers Harfleur,
Et quand j’arriverai, je mettrai sur ta tombe
Un bouquet de houx vert et de bruyère en fleur.`,decode:"Je ne puis demeurer loin de toi plus longtemps.",translation:"I cannot remain far from you any longer.",phrase:"dès l’aube",meaning:"from daybreak / as soon as dawn comes",notes:"The destination is revealed only at the end: a grave. Notice how the future tense describes a planned journey while the images convey grief. The addressed ‘you’ does not have to be named to understand the poem.",vocabulary:[{word:"demeurer",meaning:"to remain; literary here"},{word:"houx",meaning:"holly"},{word:"bruyère",meaning:"heather"}],points:["A journey begins at dawn","The speaker is absorbed in grief","The destination is a grave","Flowers will be left there"]},
 {id:"poeme-automne",title:"Chanson d’automne",author:"Paul Verlaine",year:1866,level:"B1+",source:"https://fr.wikisource.org/wiki/Poèmes_saturniens_(1902)/Chanson_d’automne",text:`Les sanglots longs
Des violons
De l’automne
Blessent mon cœur
D’une langueur
Monotone.

Tout suffocant
Et blême, quand
Sonne l’heure,
Je me souviens
Des jours anciens
Et je pleure ;

Et je m’en vais
Au vent mauvais
Qui m’emporte
Deçà, delà,
Pareil à la
Feuille morte.`,decode:"Je me souviens des jours anciens et je pleure.",translation:"I remember former days and I weep.",phrase:"je me souviens",meaning:"I remember",notes:"Autumn is given a musical, sorrowful voice. The final comparison makes the speaker like a dead leaf carried by wind. Listen to the repeated sounds without assuming every image is a literal event.",vocabulary:[{word:"sanglots",meaning:"sobs"},{word:"langueur",meaning:"listlessness or languor"},{word:"blême",meaning:"very pale"},{word:"deçà, delà",meaning:"here and there; literary"}],points:["Autumn evokes sorrow","The speaker remembers earlier days","The wind carries the speaker like a dead leaf"]},
 {id:"poeme-dormeur",title:"Le Dormeur du val",author:"Arthur Rimbaud",year:1870,level:"B2",source:"https://fr.wikisource.org/wiki/Œuvres_complètes_(Rimbaud)/Le_dormeur_du_val",text:`C’est un trou de verdure où chante une rivière
Accrochant follement aux herbes des haillons
D’argent, où le soleil, de la montagne fière,
Luit ; c’est un petit val qui mousse de rayons.

Un soldat jeune, bouche ouverte, tête nue
Et la nuque baignant dans le frais cresson bleu,
Dort : il est étendu dans l’herbe, sous la nue,
Pâle dans son lit vert où la lumière pleut.

Les pieds dans les glaïeuls, il dort. Souriant comme
Sourirait un enfant malade, il fait un somme.
Nature, berce-le chaudement : il a froid !

Les parfums ne font pas frissonner sa narine ;
Il dort dans le soleil, la main sur sa poitrine,
Tranquille. Il a deux trous rouges au côté droit.`,decode:"Nature, berce-le chaudement : il a froid !",translation:"Nature, cradle him warmly: he is cold!",phrase:"il fait un somme",meaning:"he is taking a nap",notes:"Content note: death and war. The lush landscape contrasts with the young soldier’s stillness. The last line changes how we understand the repeated ‘il dort’. Distinguish the scene’s details from your interpretation of its effect.",vocabulary:[{word:"val",meaning:"small valley"},{word:"haillons",meaning:"rags; a metaphor for reflected light"},{word:"la nue",meaning:"the sky or clouds; poetic"},{word:"bercer",meaning:"to cradle or rock gently"}],points:["A soldier lies in a green valley","The landscape is bright and alive","The ending reveals wounds and implies death rather than sleep"]},
 {id:"poeme-albatros",title:"L’Albatros",author:"Charles Baudelaire",year:1861,level:"B2+",source:"https://fr.wikisource.org/wiki/Les_Fleurs_du_mal_(1861)/L’Albatros",text:`Souvent, pour s’amuser, les hommes d’équipage
Prennent des albatros, vastes oiseaux des mers,
Qui suivent, indolents compagnons de voyage,
Le navire glissant sur les gouffres amers.

À peine les ont-ils déposés sur les planches,
Que ces rois de l’azur, maladroits et honteux,
Laissent piteusement leurs grandes ailes blanches
Comme des avirons traîner à côté d’eux.

Ce voyageur ailé, comme il est gauche et veule !
Lui, naguère si beau, qu’il est comique et laid !
L’un agace son bec avec un brûle-gueule,
L’autre mime, en boitant, l’infirme qui volait !

Le Poëte est semblable au prince des nuées
Qui hante la tempête et se rit de l’archer ;
Exilé sur le sol au milieu des huées,
Ses ailes de géant l’empêchent de marcher.`,decode:"Ses ailes de géant l’empêchent de marcher.",translation:"His giant wings prevent him from walking.",phrase:"l’empêchent de marcher",meaning:"prevent him from walking",notes:"The bird is powerful in the air but awkward on deck. The final stanza explicitly compares it with the poet. Explore how a strength in one setting can become a difficulty in another; other text-supported readings are welcome.",vocabulary:[{word:"avirons",meaning:"oars"},{word:"naguère",meaning:"formerly / not long ago"},{word:"huées",meaning:"jeers"},{word:"nuées",meaning:"clouds"}],points:["Sailors catch and mock albatrosses","The birds are graceful in flight but awkward on deck","The poet is compared with the bird"]},
 {id:"poeme-cigale",title:"La Cigale et la Fourmi",author:"Jean de La Fontaine",year:1668,level:"B2",source:"https://fr.wikisource.org/wiki/Fables_de_La_Fontaine_(éd._1874)/La_Cigale_et_la_Fourmi",text:`La cigale, ayant chanté
Tout l’été,
Se trouva fort dépourvue
Quand la bise fut venue :
Pas un seul petit morceau
De mouche ou de vermisseau.

Elle alla crier famine
Chez la fourmi, sa voisine,
La priant de lui prêter
Quelque grain pour subsister
Jusqu’à la saison nouvelle.
Je vous paierai, lui dit-elle,
Avant l’oût, foi d’animal,
Intérêt et principal.
La fourmi n’est pas prêteuse :
C’est là son moindre défaut.
Que faisiez-vous au temps chaud ?
Dit-elle à cette emprunteuse. —
Nuit et jour à tout venant
Je chantais, ne vous déplaise. —
Vous chantiez, j’en suis fort aise !
Eh bien ! dansez maintenant.`,decode:"La fourmi n’est pas prêteuse.",translation:"The ant is not inclined to lend.",phrase:"se trouva fort dépourvue",meaning:"found herself very short of supplies",notes:"The cicada asks for a loan after a summer of singing; the ant refuses. You can discuss preparation, generosity, or the value of art. The narrator’s ‘moindre défaut’ leaves room to question the ant rather than accepting a single moral.",vocabulary:[{word:"bise",meaning:"cold north wind"},{word:"subsister",meaning:"to survive"},{word:"l’oût",meaning:"the harvest; an old word"},{word:"principal",meaning:"the original amount of a loan"}],points:["The cicada has no food when cold weather arrives","She asks the ant for a loan","She promises repayment","The ant refuses after hearing she sang all summer"]},
 {id:"poeme-sensation",title:"Sensation",author:"Arthur Rimbaud",year:1870,level:"B1+",source:"https://fr.wikisource.org/wiki/Poésies_(Rimbaud)/éd._Vanier,_1895/Sensation",text:`Par les soirs bleus d’été, j’irai dans les sentiers,
Picoté par les blés, fouler l’herbe menue :
Rêveur, j’en sentirai la fraîcheur à mes pieds.
Je laisserai le vent baigner ma tête nue !

Je ne parlerai pas, je ne penserai rien :
Mais l’amour infini me montera dans l’âme,
Et j’irai loin, bien loin, comme un bohémien
Par la Nature, — heureux comme avec une femme.`,decode:"Je laisserai le vent baigner ma tête nue !",translation:"I will let the wind bathe my bare head!",phrase:"j’irai loin",meaning:"I will go far",notes:"A future walk is imagined through touch, coolness, and wind. The speaker chooses sensation and freedom over speech or thought. ‘Bohémien’ is historical wording here; it is not presented as a contemporary label to use for people.",vocabulary:[{word:"sentiers",meaning:"paths or trails"},{word:"fouler",meaning:"to tread on"},{word:"menue",meaning:"fine or small"}],points:["The speaker imagines walking on summer evenings","Grass and wind are felt physically","Silence and wandering bring happiness"]},
] as const;
export const poetryPassages:Passage[]=poems.map(p=>({id:p.id,title:p.title,level:p.level,topic:"Poetry",category:"poetry",releasedAt:"2026-09-30",xp:40,text:p.text,decode:p.decode,translation:p.translation,phrase:p.phrase,meaning:p.meaning,challenges:["Poetic imagery","Literary vocabulary","Rhythm"],comprehensionPoints:[...p.points],speaker:{name:"Léa",age:29,location:"Paris",voice:"marin",initials:"L"},audioFile:`/audio/passages/${p.id}.mp3`,poem:{author:p.author,year:p.year,source:p.source,notes:p.notes,vocabulary:[...p.vocabulary]}}));
