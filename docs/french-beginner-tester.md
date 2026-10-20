# Beginner French tester foundation

New French accounts start at A1 automatically. The course marker is assigned by the server and stored in the existing per-user progress JSON; no schema migration is needed. Existing French progress records retain the open advanced experience, including preferences, XP, and completions. Existing journey activity without a progress row also retains access. A shared appearance-only record from Swedish is not treated as prior French study.

## Content and unlocks

The requested pack has eight conversations and four announcements at each of A1 and A2: 24 authored scenes. It is a practical listening pack, not a complete CEFR syllabus or certification. Audio production status and the exact validated assets are recorded separately in the production report; human listening and in-app listening sign-off remain pending until actually performed.

New accounts use server-owned `beginner-v2` progression:

1. A1 → A2: complete all eight conversation loops: `fr-a1-bonjour`, `fr-a1-cafe`, `fr-a1-gare`, `fr-a1-repeter`, `fr-a1-boulangerie`, `fr-a1-direction`, `fr-a1-table`, `fr-a1-journee`.
2. A2 → B1: complete all eight conversation loops: `fr-a2-rendezvous`, `fr-a2-marche`, `fr-a2-hier`, `fr-a2-dejeuner`, `fr-a2-addition`, `fr-a2-petitdejeuner`, `fr-a2-retour`, `fr-a2-weekend`.
3. B1 → B2: complete `cafe`, `marche`, `voisin`, `train`. B1+ opens with B1; B2+ opens with B2. B1/B2 use the existing advanced library.

A loop requires an initial summary, Listen closer reflection, completed retell practice or rehearsal, and final retell. A1 accepts five trimmed characters for summary/retell; other French units require fifteen. This verifies participation under the existing rules, not mastery. Announcements are optional preparation with saved answer checks and activity; they do not unlock stages. Repeating one lesson cannot replace a missing required lesson.

Accounts already marked `beginner-v1` retain their original four-A1/three-A2 unlock rules, so expanding the pack does not relock an earned stage. They can still study all expanded content. Existing French learners with earlier saved progress/activity retain `legacy` advanced access. The server ignores client attempts to change the course marker or forge completion lists. Appearance-only Swedish records do not count as prior French study.

The authoritative evidence is authenticated journey loop/review events. Recommendations, lesson selection, resumed navigation, announcement access, checkpoint access and journey saves respect the assigned course version. Supplemental original-media/recording tools are independent practice. The advanced listening lab opens with B1.

Beginner conversations and all A1/A2 announcements use the slow-beginner narration style with a distinct cache identity. The generated manifest preserves explicit character/voice/turn assignments. Advanced recordings remain separate and unchanged. Review the [audio inventory](french-beginner-audio-inventory.md), [recording gates](french-audio-recording-checklist.md) and production report before deployment.

## Separate users and feedback

Reuse the existing platform-authenticated user ID, French/Swedish storage namespaces, journey events, usage sampling, private request center and owner learner selector. The navigation tour is saved with the learner's own progress and can be replayed. Feature requests include language, practice stage and current navigation location to help diagnose beginner friction. No new external messaging or invitations are sent.

## Invitation and release steps

1. Obtain the tester's actual ChatGPT sign-in email. Do not infer it from Nikki's account or enter a placeholder in deployment configuration.
2. Append that email to `ALLOWED_USER_EMAILS`, preserving Nikki and all currently authorized emails. Keep `OWNER_EMAIL` unchanged. The accounts must have distinct authenticated user IDs; a shared login shares progress.
3. Review this diff, validate the existing database/service bindings, and deploy only with authorization. No deployment or production configuration changes were made here.
4. In the tester account, verify A1-only starting choices, all four A1 announcements, slow audio, the first conversation, tour persistence after reload, and a feature request. Verify the owner's learner selector shows her separately after activity arrives.
5. Recheck Nikki's account, advanced French lessons, preferences, saved progress and Swedish switching. Exercise A1 → A2 using a disposable test account rather than resetting a real learner.

Validation includes production build, TypeScript, existing regression tests and a real SQLite API regression for two new learners, marker/completion tampering, gate rejection, all unlock transitions, private requests and an existing advanced learner. Production sign-in and audible speech still need the account-level checks above.

The recording inventory and proposed expansion scenes are outlined in [French beginner audio inventory](french-beginner-audio-inventory.md). This is planning only; no audio generation is included.

Recording validation uses the [pass/fail recording checklist](french-audio-recording-checklist.md), including separate human listening and in-app gates.

Current production evidence: [validated asset report](french-audio-production-report.json) and [24-scene listening review page](french-audio-review.html). All 97 prior recordings were verified unchanged against Git HEAD. New scene rates are approximately 95 WPM at A1 and 105 WPM at A2 after local pitch-preserving tempo adjustment; this does not establish perceived voice identity or pronunciation correctness.

## Optional lower-tier content for advanced learners

Advanced French learners (including legacy accounts such as Nikki and beginner-course accounts that reach B1/B2) see **Show A1–A2 content** on Today and Library. It is off by default and syncs in that learner's preferences. Off hides A1/A2 lessons from the library, lesson chooser, Today recommendations/review lessons, unfinished-session suggestions, practice pathways and announcements. On makes unlocked lower-tier content available alongside the higher levels. Toggling changes visibility only: it never deletes completed lessons, XP, feedback, saved words, or the original advanced access. New A1/A2 learners keep their required beginner material visible; toggling cannot unlock an unearned stage.
