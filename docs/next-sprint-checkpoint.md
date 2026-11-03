# French practice sprint — November 3, 2026

## Authorized outcome

Complete at least one requested feature end to end. Start with new B1+/B2 listening content, followed by a correction notebook and article/agreement drills. Stop at a recoverable checkpoint if usage becomes tight. Do not mark a request shipped until its published behavior is verified.

## Current checkpoint

- GitHub fetched; clean main and origin/main match at 5624e75.
- No application changes, audio generation, or deployment performed yet.
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

Open the existing Sites source using the Sites skill workflow, reconcile it with GitHub, inspect recording-generation scripts and their credential requirements, then author and integrate the first advanced collection. No feature is completed at this checkpoint.
