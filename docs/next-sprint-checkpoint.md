# French practice sprint — November 3, 2026

## Authorized outcome

Complete at least one requested feature end to end. Start with new B1+/B2 listening content, followed by a correction notebook and article/agreement drills. Stop at a recoverable checkpoint if usage becomes tight. Do not mark a request shipped until its published behavior is verified.

## Current checkpoint

- The first deliverable shipped as Sites version 63 from GitHub `main` commit `b9ce316cd8d938ed3a51f8e5f5928e8ba7890dbe`.
- Twelve new advanced French lessons are integrated: six B1+ practical situations and six B2 inference/viewpoint pieces.
- All twelve have bundled aligned audio, appear as new in the French Library, and use the existing four-step learning loop and durable progress model.
- Automated verification is green: `npm run audio:check` (181 scenes), `npm run typecheck`, `npm test` (154 tests), and `npm run lint:baseline` (zero new diagnostic groups).
- Browser verification confirms all twelve lessons, level/topic labels, and the lesson player are rendered correctly.
- Request d9d5d2e1-ab3a-49a8-9854-c0131cb77ebf asks for new French B1+/B2 active listening modules after exhausting the catalog. Submitted October 24, 2026, 23:34 EDT.
- Existing advanced French material predates that request; later additions were Spanish.

## First deliverable: advanced French collection

Proposed scope: twelve new modules, six B1+ and six B2. Use the existing lesson loop and durable progress. These are practice difficulty labels, not certified assessments.

1. B1+: missed connection and alternative route; apartment repair appointment; returning a faulty purchase; rescheduling a medical appointment without clinical advice; collecting a parcel for someone else; restaurant reservation misunderstanding.
2. B2: neighborhood pedestrianization debate; remote-work policy disagreement; interview about repairing rather than replacing goods; conflicting accounts of a delayed event; museum funding discussion; a nuanced recommendation with conditions and reservations.
3. Author complete French text, comprehension points, phrase explanation, and speaker assignments for every module. Make B2 difficulty depend on inference, viewpoints, and qualifications, not just speed.
4. Inspect catalog, Parisian-variant assumptions, playback manifests, recommendation logic, and tests before integration. Existing tests expect variants for everyday French passages, so explicitly resolve how the new collection participates.
5. Generate bundled audio using the previously authorized existing key without printing credentials. Reuse the aligned recording workflow. Validate transcript/voice alignment and audio coverage.
6. Verify new modules appear as unseen, play, accept and save answers, resume correctly, and award completion once. Check mobile and seasonal contrast.
7. Run npm run typecheck, npm test, npm run lint:baseline. Commit, fetch, push, verify GitHub SHA. Follow Sites workflow separately for publication and preserve project appgprj_6a8e6f57d2188191a0313a144050cac0 and storage bindings.
8. Only after release verification, mark the advanced-content request shipped with the exact number and location of new modules.

## Subsequent deliverables

Correction notebook: paired original/tutor-corrected text, editable entries, visible differences, recurring error categories, private per-user storage. The supplied tutor example is acceptance data for this feature, not a separate feature.

Grammar: authored article and agreement exercises with explanations and retries; then connect recurring notebook patterns to relevant exercises. Accept valid alternatives and distinguish accent issues from grammatical errors.

## Immediate next action

The correction notebook is implemented on November 4, 2026. Open Library → Correction notebook (`?language=fr#library/corrections`, also available for Spanish and Swedish).

- Paired original and tutor-corrected text, title, notes, editable tags, search/filter, word-level differences, recurring category counts, and reversible archive/restore.
- Private D1 storage by authenticated user and learning language. Revision checks reject stale saves. Unfinished editor drafts are backed up per account on the device; conflicting edits can be preserved as a new entry.
- Added schema-only migration `0009_slimy_union_jack.sql`; local preview migration applied. Sites applies the hosted migration during publication.
- Automated tests cover validation, exact diff reconstruction (including accents and long input), pattern counts, direct routes, authenticated database operations, account/language isolation, hostile origins, stale writes, edit/archive/restore.
- Browser QA passed: create/save, edit, navigate away and recover an unfinished draft, archive/restore, compare highlighted changes, and 390px mobile layout without horizontal overflow. A simulated other-device update rejected the older save, preserved its draft, and allowed loading the latest saved entry.
- Shipped as Sites version 64 on November 4, 2026 from commit `4a454f523429cf4f715ff8cc1d0190b59faa07d9`, synchronized to GitHub `main`. Deployment `appgdep_6aeb8a929ca481919f363dfba6fef52f` succeeded. Final checks passed: 159 tests, production build, typecheck, and lint baseline with zero new diagnostic groups.
- The live feedback inbox lost its signed-in session during this work, so no request status was changed. Reconcile the notebook request and the advanced-content request after restoring inbox access; never assume their statuses were updated. Signed-in production save/reload verification remains outstanding; the full save/recovery workflow passed locally and deployment succeeded.

Next development: authored article and agreement exercises with explanations and retries, then links from notebook patterns to the matching exercises. Category counts are user-applied tags; the notebook does not automatically diagnose grammar or generate corrections. Preserve that distinction in future UI and release notes.
