# French A1/A2 recording checklist and pass/fail gates

**Current status: 24/24 scenes generated and structurally verified (12 per level); all human listening reviews remain PENDING.** Static checks cannot establish the perceived speaker, spoken words, native pronunciation or beginner intelligibility. No scene is release-ready until every gate below is PASS, including listening review. PENDING is not PASS.

## Scope and inventory

The requested scope is **8 conversations + 4 announcements at each of A1 and A2**. All 24 scripts are now authored. The production report distinguishes generated assets and structural verification from listening approval; missing counts must never be reported as complete. The pack contains **89 conversation turns + 8 announcement utterances = 97 individual clips**. See the [full inventory](french-beginner-audio-inventory.md).

The user has authorized generating these candidates with the existing configured key. No secret is copied into this worktree. Generation authorization is not editorial, listening or deployment approval. Automated preflight must pass before candidate generation; named human editorial/listening sign-offs remain separate release gates and are PENDING until performed.

Fixed cast: **Léa → `marin`; Paul → `cedar`; announcement narrator → `marin`**. Roles change by scene; character identity does not. Beginner source turns have explicit character IDs and unique turn IDs. Never infer who is speaking from odd/even position. An inserted second line by Léa must still use Léa’s voice.

## Gate 1 — before generation

**Automated PASS requires all of the following, with zero errors:**

- Every scene ID is unique. Language and level are supported; new starter scenes are French A1/A2 with beginner narration.
- Every cast member has a name, scene role and allowed voice; every dialogue turn identifies a known character and uses that character’s fixed name and voice. Character identity remains stable across scenes; distinct speakers retain distinct voices.
- All expected turns are present, nonempty, uniquely identified and in the approved order. Joining turn text reproduces the full displayed transcript exactly. Repeated phrases by different speakers are allowed; duplicate turn IDs or omitted turns are not.
- Decode/phrase snippets match the beginner transcript, comprehension points are nonempty, and the planned turn count matches the inventory above. Automated checks cover structural consistency; a French reviewer must check meaning, level and answer correctness.
- `npm run audio:check` exits 0; run the unit suite after script/cast changes. This preflight performs no speech calls and reads no speech credentials.

**Editorial PASS additionally requires:** a named French reviewer approves the exact script, translation, speaker roles, intended comprehension answers and beginner suitability. Record the source revision and approval date. **FAIL** means any automated error, incorrect fact/answer, ambiguous role, or unresolved wording issue. **PENDING** means editorial approval is missing even if automated checks pass.

## Gate 2 — after every generated turn

Treat each turn as an independent item. Review it before accepting it into the approved batch.

**Automated PASS requires:**

- The request uses the expected scene/turn ID, exact text, assigned voice, language and narration style. The cache receipt matches the full recording signature, turn index, speaker/text metadata and SHA-256 of the returned PCM. Mismatched or missing cache receipts must not be silently trusted.
- PCM is mono 24 kHz signed 16-bit, nonempty, contains nonzero samples, has an even byte count and lasts at least 50 ms. The format is fixed by the speech PCM contract; basic byte checks do not independently infer sample rate or prove all audible content is present.
- A generation failure stops the candidate; a missing turn must never be replaced by an empty clip or skipped.

**Listening PASS requires all five checks, with zero unresolved defects:**

1. A reviewer compares the clip to the approved text: every word is audible once, with **no omitted or extra speech**, invented speaker, translation, commentary or clipped initial/final word.
2. The perceived speaker matches the approved character reference sample and remains consistent with that character’s earlier clips. The other character remains distinguishable. A correct voice ID alone does not establish this.
3. Pronunciation, liaison, names, amounts and numbers are correct and understandable; the French reviewer accepts them. Pay particular attention to *deux/douze*, platform numbers and times.
4. Pace is within the planned range: A1 approximately 85–100 words/minute; A2 bridge approximately 95–110. Record measured duration and approximate rate. Any exception needs an explicit intelligibility approval and reason; an unreviewed exception fails the gate.
5. No audible truncation, clipping/distortion, unexplained silence, abrupt loudness change or background contamination remains.

**FAIL** means any mismatch or unresolved listening defect; regenerate/re-record only that failed turn and rerun its checks. **PENDING** means the clip has not received a named listening sign-off. Store status separately from the automated cache receipt (`listeningReview: pending` is the generation default); never label the receipt itself as human approval.

## Gate 3 — after final assembly

**Automated PASS requires:**

- The manifest signature matches the source revision, language, style and assigned turns. There are exactly the expected number of entries, each expected ID/character/text/voice appears **once, in source order**, and all timestamps are finite and increasing.
- Every PCM part appears once in the same order and its assembled byte span matches its validated input bytes. Per-turn checksums match when reusing a finalized cache. Duplicate, reordered, missing or modified parts fail.
- The WAV header, mono channel count, 24 kHz sample rate, 16-bit format, RIFF/data lengths and final length agree. No turn overlaps or extends beyond the file, and no extra unlisted audio remains.
- The current assembler inserts exactly **0.25 seconds of silent padding after each turn**, including the final turn. Timing/byte validation rejects missing padding, accidental extra gaps and overlaps. Change that policy deliberately in code/tests if a different reviewed rhythm is needed.

**Whole-scene listening PASS requires:** the reviewer listens from start to end, follows the transcript without skipped/repeated turns, hears the right character in every role, and finds each response coherent. Joins have no cut words, unwanted overlap, clicks or accidental long silence. The fixed 0.25-second joins must sound comfortable; a structurally correct but rushed join fails listening QA. Overall pace, pronunciation and scene meaning must work for a beginner. **FAIL** means any structural or audible defect. **PENDING** means the final take has not been heard and signed off.

## Gate 4 — in the app before release

**PASS requires every check below on the exact candidate asset and source revision:**

- The intended scene loads the intended asset/signature and beginner style; it does not play stale advanced audio or a different scene. The title, level and transcript match the recording.
- Play/pause, replay, seek, end-of-file and available speed controls work without truncation or skipped turns. Returning to a scene does not swap speakers.
- Test the first, a middle and the last turn; any highlighting or timestamp-based selection stays with the audible turn. Select one Léa phrase and one Paul phrase and verify the correct voice; a cross-turn excerpt preserves both speakers in order. Ambiguous repeated phrases should request the original conversation rather than silently choosing a speaker.
- Listen on a phone as well as the review setup. Answer every fixed-answer announcement check from the audio and confirm its key is correct. A beginner reviewer can identify the situation and intended details with replay/support.
- Verify transcript reveal, comprehension prompts, completion saving, per-user activity, and existing Nikki/advanced-French regression checks. A new recording must not change course unlock evidence or another learner’s progress.

**FAIL** means any broken control, stale/wrong asset, incorrect alignment, answer mismatch or unresolved beginner-intelligibility problem. **PENDING** means any device/account/listening check remains unperformed. All four gates must pass before deployment; generated files or a registry entry alone do not grant approval.

## Review record to copy for each turn and each scene

| Field | Required entry |
| --- | --- |
| Source revision / scene / turn ID | Exact immutable revision and identifiers |
| Expected character, scene role, voice, text | Copy from approved script |
| Candidate file / signature / PCM checksum | Exact reviewed candidate |
| Automated checks | PASS / FAIL; command and date; failure detail |
| Duration / approximate words per minute | Measured values; approved exception if applicable |
| Turn listening | PASS / FAIL / PENDING; reviewer, date and notes |
| Assembly listening | PASS / FAIL / PENDING; reviewer, date and join/identity notes |
| In-app verification | PASS / FAIL / PENDING; device/browser/account and asset revision |
| Final disposition | Approved candidate or blocked; unresolved issues |

## Available automated checks and limits

- `npm run audio:check`: no-cost full-catalog script/cast preflight.
- `node --experimental-strip-types --test tests/audio-validation.test.mjs tests/passage-speech.test.mjs`: speaker mapping, consecutive turns by one character, negative structural cases, turn receipts, PCM/order/timing/WAV checks, runtime voice dispatch and validation of the existing 97 recorded assets.
- `npm run audio:validate-french -- --report`: checks all 24 delivered assets, approximate pace targets and per-turn checksums, and proves the prior 97 recordings and metadata are unchanged against Git HEAD.
- `npm run audio:pace-french`: local pitch-preserving tempo adjustment; no paid requests. Requires FFmpeg (`FFMPEG_PATH`, PATH, or the ignored local helper installation). Preserve the raw cached masters for reproducibility.
- `npm test`, TypeScript and lint-baseline checks: full implementation regression before release. Final run: production build and 115 tests PASS; TypeScript PASS; no new lint diagnostic groups.

The production generator validates the batch before reading credentials, validates generated and cached turns, stores per-turn receipts/checksums, and validates final assembly before writing a candidate. `--only=<scene-id,...>` can constrain a later authorized generation batch while preserving existing manifest entries. **Generation still writes candidate assets/manifest entries automatically; human listening sign-off is a separate manual release gate, not an enforced approval system in that script.** Do not deploy a candidate until the review record passes. The user subsequently authorized candidate generation using the existing key; exact generated counts and checks are recorded in the production report.

Current production evidence: [validated asset report](french-audio-production-report.json) and [24-scene listening review page](french-audio-review.html). All 97 prior recordings were verified unchanged against Git HEAD. New scene rates are approximately 95 WPM at A1 and 105 WPM at A2 after local pitch-preserving tempo adjustment; this does not establish perceived voice identity or pronunciation correctness.
