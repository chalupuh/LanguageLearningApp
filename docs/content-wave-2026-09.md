# September content wave

The original French lesson IDs and account storage keys are unchanged. French is the default track; `?language=sv` selects Swedish. Authenticated Swedish learning records use the internal `track:sv:<account id>` namespace, never a caller-supplied identity. Drafts, vocabulary, reviews, XP and listening evidence are track-specific. Appearance and collection unlocks are shared. No production schema migration is required.

## Content

- 12 authored French service dialogues: coffee substitutions, takeaway, cash-only machines, breakfast hours and availability, formulas, payment, moving tables, reservations and dinner substitutions.
- 6 public-domain poems by Hugo, Verlaine, Rimbaud, Baudelaire and La Fontaine. Each lesson retains its exact edition link in `poem.source`, original text, new explanatory notes, vocabulary and interpretation-aware coaching. Difficulty is a pedagogical guide, not a validated CEFR assessment.
- 12 French announcement checks and 3 Swedish checks. Answer keys stay server-side. The first stored result is retained; repeat practice does not award XP again. Listening conditions are self-reported browser evidence, not proctored exam results.
- 12 Swedish A1 lessons using the same listening, decoding, rehearsal and retelling workflow. English scaffolding and A1 coaching replace intermediate French expectations.

All 30 new lesson recordings are AI-generated with the existing speech provider. Dialogue turns alternate consistent voices; poems use recitation instructions. Announcement and short phrase audio is generated on demand. These are not recordings of the named historical authors or real speakers. Audio files were decoded with ffmpeg to check structural validity; pronunciation has not had native-speaker editorial review.

## Verification

Tests cover library filters, unique content IDs, audio existence, language-separated progress, shared appearance, announcement key omission, authentication, cross-language rejection, duplicate XP prevention and preservation of first-attempt evidence. Existing journey, draft recovery, rehearsal and phrase-context regressions remain in the test suite.

No existing learner notes were automatically marked handled. No existing French completion records were reset.
