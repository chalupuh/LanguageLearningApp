# French A1/A2 audio inventory

The full requested pack is authored: **eight conversations and four announcements per level**. This replaces the earlier intermediate 4+3 A1 and 3+0 A2 draft count. All 24 scenes are now generated, locally paced, registered in the app manifest and structurally verified. The existing credential was reused in process memory; no secret was copied to this worktree. The [production report](french-audio-production-report.json) records exact generated and structurally verified counts; all perceived-identity, pronunciation, pace/intelligibility and in-app listening reviews remain PENDING until performed. No deployment is included.

| Level | Authored conversations | Authored announcements | Planned individual clips |
| --- | ---: | ---: | ---: |
| A1 | 8 | 4 | 46 |
| A2 | 8 | 4 | 51 |

Conversation source: `content/french-beginner.ts`. Announcement source and fixed-answer questions: `content/announcements.ts`. Explicit character IDs and unique turn IDs replace alternating-position speaker assignment. Léa always uses `marin`; Paul uses `cedar`; announcement narration uses `marin`. Scene roles are stored in the source cast.

## Authored recording inventory

Estimates include short joins. Final measured durations and approximate rates belong in the production report; an estimate is not a completed recording or listening approval.

| Scene / source ID | Level | Format / speakers | Intended comprehension skill | Estimated duration |
| --- | --- | --- | --- | --- |
| Bonjour ! — `fr-a1-bonjour` | A1 | 4 turns; Léa / Paul | Léa lives in Paris; Paul lives in Lyon | 17–19 sec |
| Un café, s’il vous plaît — `fr-a1-cafe` | A1 | 5 turns; Léa / Paul | The customer wants a small coffee; It costs two euros | 16–18 sec |
| À la gare — `fr-a1-gare` | A1 | 5 turns; Léa / Paul | The train goes to Lyon; It leaves at ten from platform three | 19–22 sec |
| Plus lentement, s’il vous plaît — `fr-a1-repeter` | A1 | 5 turns; Léa / Paul | The room number is twelve; The guest asks for repetition | 19–22 sec |
| Changer de rendez-vous — `fr-a2-rendezvous` | A2 | 5 turns; Léa / Paul | The original meeting was at three; They now meet at four thirty outside the café near the station | 24–27 sec |
| Au marché — `fr-a2-marche` | A2 | 6 turns; Léa / Paul | The shopper buys a kilo of apples for a tart; They leave the pears and can pay by card | 29–33 sec |
| Le bus d’hier — `fr-a2-hier` | A2 | 6 turns; Léa / Paul | The bus wait was twenty minutes and the metro station was closed; He walked and arrived at nine fifteen | 29–33 sec |
| À la boulangerie — `fr-a1-boulangerie` | A1 | 5 turns; Léa / Paul | The customer wants one baguette and two croissants; The total is four euros fifty | 17–20 sec |
| Où est le supermarché ? — `fr-a1-direction` | A1 | 6 turns; Léa / Paul | Go straight then turn left; The supermarket is beside the pharmacy, two minutes away on foot | 21–25 sec |
| Une table pour deux — `fr-a1-table` | A1 | 6 turns; Léa / Paul | Two people want a table inside; They ask for still water | 24–28 sec |
| On se voit à trois heures ? — `fr-a1-journee` | A1 | 6 turns; Léa / Paul | Paul works in the morning; They will meet at three at the café near the park | 23–27 sec |
| Il n’y a plus de soupe — `fr-a2-dejeuner` | A2 | 6 turns; Léa / Paul | The soup is unavailable; The diner chooses an omelette with tomatoes, bread and water | 33–38 sec |
| Un café en trop — `fr-a2-addition` | A2 | 6 turns; Léa / Paul | The bill charges two coffees instead of one; The corrected total is nine euros and card payment is possible | 33–38 sec |
| Le petit-déjeuner est terminé — `fr-a2-petitdejeuner` | A2 | 6 turns; Léa / Paul | The breakfast deal ended at ten but toast is still available; The guest orders buttered toast and tea; the café closes at noon | 35–40 sec |
| Échanger un pull — `fr-a2-retour` | A2 | 6 turns; Léa / Paul | The jumper bought yesterday is too small; A medium in the same colour is available; fitting rooms are at the back on the right | 33–38 sec |
| Un dimanche différent — `fr-a2-weekend` | A2 | 6 turns; Léa / Paul | Rain changed the plan from a park visit to a nearby museum; They had hot chocolate afterwards and will try the park next weekend | 35–41 sec |
| The library closes at six — `fr-a1-library` | A1 | Announcement; marin narrator | When does the library close?; Where should you return the books?; Where is the exit? | 12–14 sec |
| The café opens later today — `fr-a2-opening` | A2 | Announcement; marin narrator | When does the café open today?; Why is opening later today?; When do normal hours return? | 16–18 sec |
| A different train platform — `fr-a2-platform` | A2 | Announcement; marin narrator | Which platform should you use now?; Has the departure time changed?; What should you keep with you? | 19–22 sec |
| Collect your takeaway by the door — `fr-a2-collection` | A2 | Announcement; marin narrator | Which order is ready?; Where do you collect takeaway food?; Where do you collect hot drinks? | 19–22 sec |
| The bus is ten minutes late — `fr-a2-bus` | A2 | Announcement; marin narrator | How long is the delay?; Where should passengers wait?; When does the following bus arrive? | 22–25 sec |
| The shop closes soon — `fr-a1-shop` | A1 | Announcement; marin narrator | When does the shop close?; Where should you go?; Where is the exit? | 11–13 sec |
| A train platform — `fr-a1-platform` | A1 | Announcement; marin narrator | Which platform?; When does it leave?; What should be ready? | 12–14 sec |
| Your coffee is ready — `fr-a1-order` | A1 | Announcement; marin narrator | Which number is called?; Where is the coffee?; What is on the table? | 12–14 sec |

## Pace and voice direction

A1: calm native French, approximately 85–100 words/minute, short clauses and clear numbers/amounts. A2: approximately 95–110 words/minute, longer turns with one change, contrast or short past event. Preserve natural pronunciation and liaison; avoid syllable-by-syllable speech. These are planning targets; the initial qualitative slow-beginner instruction produced takes above the targets, so the generated PCM was adjusted locally with pitch-preserving FFmpeg atempo. Measured rates are now about 95 words/minute for A1 and 105 for A2. Human intelligibility review remains pending.

Keep clean audio with no competing station/café background. Each voice reads only its assigned words. Use the same character reference sample when checking perceived identity. The current assembler inserts 0.25-second silent joins; reject them in listening QA if a particular scene sounds rushed or awkward.

## Completion and expansion limits

New learners require all eight A1 conversation loops to unlock A2 and all eight A2 loops to unlock B1. Four named existing B1 loops unlock B2. Announcements remain optional detail/action practice. Earlier starter-course unlocks and existing advanced access are preserved. Eight conversations/four announcements is the requested pack scope, not a complete CEFR curriculum. Further regional accents, less-supported takes, longer stories, and additional situation variants are future expansion ideas, not part of this delivery.

Use the [pass/fail recording checklist](french-audio-recording-checklist.md) for technical preflight, per-turn listening, final assembly and in-app gates. Candidate generation does not grant human listening approval or permission to deploy.

Current production evidence: [validated asset report](french-audio-production-report.json) and [24-scene listening review page](french-audio-review.html). All 97 prior recordings were verified unchanged against Git HEAD. New scene rates are approximately 95 WPM at A1 and 105 WPM at A2 after local pitch-preserving tempo adjustment; this does not establish perceived voice identity or pronunciation correctness.
