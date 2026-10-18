# App review — October 18, 2026

This is a source and automated-test review of the current checkout. No application fixes were made. Findings below distinguish deterministic code paths from failure scenarios requiring browser/network testing. This is not a completed visual, mobile, screen-reader, production-hosting, or real-microphone certification. No paid AI requests were made and no remote user data was changed.

## Overall assessment

The learning experience has considerable substance: language-specific progress, authored lessons, aligned dialogue audio, contextual phrase saving, scheduled practice, private recordings, and server-controlled XP. Existing tests cover many important regressions. The greatest remaining risk is trust in saved work: recovery, review entry, storage failure messaging, and parallel devices are not yet consistent across features.

Prioritize reliable review entry and recovery before adding more learning modes. The app already offers enough activities that discoverability and continuity will likely produce more benefit than another feature area.

Priority definitions: P1 = potential work loss, broken core flow, or crash; P2 = significant reliability/behavior defect; P3 = maintenance or polish. These are review judgments, not claims of production incident frequency.

## Bugs and reliability findings

### 1. P1 — Review entry restores the previous completion instead of starting a review

Evidence: `app/page.tsx:216`, `app/page.tsx:252`, `app/page.tsx:253`, `app/page.tsx:352`; `app/session-recovery.tsx:37`.

The Today review action sets `reviewOrigin`, passage ID, and view. Library's “Review lesson”/“Practice again” similarly selects the passage. Recovery then restores the existing draft, including `done`, `reviewOrigin`, and `sessionXp`. A completed draft therefore immediately renders the previous completion screen, previous XP, and previous answers. The restored reviewOrigin can also erase the intent of entering from a review card.

Reproduce: complete a lesson, allow the draft to save, leave it, then open it from the library or a due-review card. The persisted completed session takes precedence over the new action.

Fix: make entry intent explicit (`resume`, `review`, `new attempt`). Resume unfinished drafts, but create a fresh attempt for a completed lesson selected for review. Preserve earned progress separately. Test the complete → leave → due review → fresh answers sequence.

### 2. P1 — Conflicting session edits are silently hidden in an inaccessible backup

Evidence: `app/session-recovery.tsx:41–47`, `app/session-recovery.tsx:86`.

When local unsynced work is based on an older server revision, recovery writes it to a `:conflict-backup` storage key and opens the remote draft. The UI reports a restored session; it does not explain that another version of the learner's work was set aside. There is no UI to view, export, or restore that backup. The ordinary draft cache subsequently receives the selected remote state, and a later conflict can replace the single backup.

Reproduce: edit offline on device A; edit and save the same passage on B; reopen on A after reconnecting. A's edits are not shown and the backup is only reachable through developer storage tools.

Fix: show the conflict before replacing the working draft. Offer “Keep my version,” “Use saved version,” and “Download both.” Preserve versioned backups until resolved. The separate reload action currently deletes the ordinary cached draft; provide an export/backup there as well.

### 3. P1 — Progress can claim device persistence when local storage has failed

Evidence: `app/use-progress-sync.ts:10`, `app/use-progress-sync.ts:28`; `app/page.tsx:289`.

`cachePending` swallows storage errors. After a failed network save, the hook says changes are kept on this device, and Today displays “Saved on this device.” If storage is disabled or full, neither remote nor local persistence exists. Closing the tab can lose those edits. Larger notebooks and accumulated recording transcripts make the size limit relevant over time.

Fix: return persistence success, distinguish “saved locally” from “only in this open tab,” and offer export when neither destination is available. Test a throwing localStorage implementation together with a failed save. Apply the same truthful-status rule throughout the app.

### 4. P1 — Malformed speaking feedback can crash the feedback panel

Evidence: `app/api/feedback/route.ts:26`, `app/api/feedback/route.ts:42`; `app/page.tsx:452`, `app/page.tsx:465`.

The recording endpoint parses model JSON but does not validate its shape. The client stores that result and renders `strengths.map` and `corrections.map` directly. A syntactically valid but structurally invalid result, such as `strengths: null`, can cause a render exception. The transcription response is also trusted without runtime validation. Comprehension and writing already have better validation patterns.

Fix: add bounded validators for transcription and speaking feedback before returning 200; reject invalid responses with a retryable error. Validate again before accepting client state. Add explicit `Cache-Control: private, no-store` to recording feedback responses because they contain private transcripts. This is a missing privacy directive, not evidence that a cache currently stores these POST responses.

### 5. P2 — A stalled save can block all subsequent saves and retries

Evidence: `app/session-recovery.tsx:48–62`; `app/use-calendar.ts:14–19`; `app/recording-journal.tsx:7`.

Session and calendar PUTs have no deadline. They set `saving`/`busy` before fetch and clear it only when the request settles. A connection that stays pending leaves periodic and manual retries returning early. Recording upload likewise leaves its button busy indefinitely. Initial load timeouts do not cover these saves.

Fix: add per-request abort deadlines and an explicit stalled state. A timeout after a committed write needs reconciliation: re-read the revision and compare the sent snapshot before retrying. Preserve recordings and text while resolving uncertain outcomes.

### 6. P2 — Calendar does not pull other-device changes while already open

Evidence: `app/use-calendar.ts:14`, `app/use-calendar.ts:23`, `app/use-calendar.ts:28`.

After its initial GET, the calendar only reads again after its own PUT receives a conflict. The three-second timer runs a flush that immediately returns when there are no local edits. Retry also only flushes. Thus device A can display stale goals indefinitely after B updates them, including after returning to the open calendar.

Fix: refresh on focus/online and periodically while visible. Merge fresh remote state with pending local edits. Show last successful sync time. Test two mounted clients where only one edits.

### 7. P2 — Retell recording does not participate in the language-switch guard

Evidence: `app/page.tsx:248`, `app/page.tsx:439`, `app/page.tsx:460`.

The profile enables language switching using Home's `recording` state. The final retell's `Response` owns a separate recording state. Recording there does not disable the profile switch. Switching language reloads the document and can discard the current recording; browser beforeunload behavior may provide a warning, but the intended guard is ineffective. Internal navigation can also unmount a recorder and cancel its take.

Fix: derive all navigation protection from a shared capture/unsaved-recording state. Offer stop-and-keep or discard when leaving. Preserve a finished take until explicitly discarded or saved, including when coaching is pending.

### 8. P2 — Phrase-review audio bypasses the shared playback coordination

Evidence: `app/page.tsx:323–335`; compare `app/phrase-tools.tsx` and `lib/audio-capture.ts:29–40`.

PhraseReviewDeck checks captureActive before generating audio but does not broadcast playback ownership or subscribe to the pause event. Its detached `new Audio()` is absent from document media queries. It also does not recheck captureActive after asynchronous generation. Starting another app player can overlap this audio; a later playback/capture lock cannot reliably stop that detached instance through the shared event.

Fix: use a shared playback controller for every player, including review cards and journal media. Recheck the capture lock after asynchronous work. Test late generation, another player starting, and a recording starting.

### 9. P2 — Invalid or unconfigured AI requests consume the hourly allowance

Evidence: `app/api/comprehension/route.ts:6–16`; `app/api/feedback/route.ts:5–18`; `app/api/ai-guard.ts:10–17`.

The quota guard increments the database counter before these endpoints check configuration or validate input. Empty summaries, missing audio, oversized recordings, and missing API configuration can consume the same 60-request allowance used for actual coaching and generated speech. It is a request quota, so charging for valid but failed upstream calls may be intentional; charging for rejected input is avoidable.

Fix: separate authorization/origin checks from quota reservation. Validate bounded input and configuration first, then reserve quota immediately before upstream work. Keep server enforcement atomic.

### 10. P2 — Shared appearance writes can move a progress revision backward

Evidence: `app/api/progress/route.ts:39–46`.

Swedish saves compute a timestamp from the Swedish revision, then reuse it for an unconditional French-row appearance upsert. The French row can already have a newer timestamp, particularly under concurrent requests or after an earlier monotonic increment. A delayed Swedish theme write can decrease that row's revision. Reusing a previously issued revision weakens the compare-and-swap protection and can allow an old French client to overwrite newer data if its expected revision matches the reused value.

Fix: store appearance in its own account preference record with its own revision, or atomically advance the French revision relative to that row's existing value. A single timestamp is not a safe revision for independent rows. Add an interleaved-request test with controlled timestamps.

### 11. P2 — Feature-request retries can silently discard edited text

Evidence: `app/request-center.tsx:10`, `app/request-center.tsx:14`; `app/api/requests/route.ts:28`.

The form keeps one ID until a successful response. If the first POST commits but its response is lost, the learner can edit the text and retry with the same ID. The API uses onConflictDoNothing and returns saved:true regardless of whether the stored content matches. The client clears the revised text, although only the original text is stored.

Fix: bind an idempotency key to an immutable payload. Return the canonical stored request and reject a different payload under the same ID, or provide an explicit update operation. Keep the form text until the returned saved content matches.

### 12. P2 — Practice-day calculations disagree around midnight

Evidence: `app/api/journey/route.ts:40`; `app/page.tsx:240`; `lib/journey.ts:27–32`; `lib/usage.ts:2`, `lib/usage.ts:37`.

Journey daily keys and practiceDates use UTC dates; achievements group activity by the browser's local date; owner usage uses America/New_York. For an Eastern-time learner, the daily XP boundary arrives at 8 PM during daylight saving time or 7 PM in standard time. Daily rewards, activity displays, and weekly summaries can therefore disagree about which day practice belongs to.

Fix: define one account practice timezone and compute daily/weekly boundaries consistently on the server. Preserve idempotency when migrating old keys. Test evening practice, Sunday/Monday, travel, and daylight-saving transitions.

### 13. P3 — Library tabs and filters are not represented consistently in navigation

Evidence: `app/page.tsx:227–228`, `app/page.tsx:343–350`.

Library initializes a few tabs from the hash, but selecting a tab only updates component state. Main navigation writes a hash containing only view and lesson/video ID. Reloading or using Back cannot reliably restore the selected library area; poetry is absent from the tab initializer as well. This makes a growing library harder to navigate and bookmark.

Fix: encode area, filters, and sort in a single route state. Restore on Back/Forward and preserve them after returning from a lesson.

## Quality-of-life improvements

| Priority | Improvement | Concrete behavior and benefit |
| --- | --- | --- |
| High | One save-status surface | Show progress, current session, calendar, and audio separately, with last sync and Retry/Export actions. “Synced” must identify what is synced. |
| High | Explicit Resume versus Review | Resume an unfinished attempt; start a fresh review of completed material; show previous attempts as history. Removes completion-screen ambiguity. |
| High | Recovery comparison UI | Show local and saved timestamps and readable answer previews. Let learners download both before resolving conflicts. |
| High | Save/download a recording immediately | Keep optional saving available even while coaching is running or has failed. Currently journal saving waits for analysis to finish. Add a download-original action. |
| High | Phrase search and organization | Search phrase and sentence; filter by source, language, due date, and topic; support undo removal and editing saved context. Avoid making a large notebook one long list. |
| High | A clear next action | On Today, distinguish “Continue your lesson,” “Review due,” and “Start something new.” Display estimated total practice time, not only audio duration. |
| Medium | Calendar refresh and practice links | A goal such as “Review ten phrases” should open the relevant activity. Distinguish planned goals from automatically observed practice. Keep manual goals editable. |
| Medium | Recording journal organization | Add labels, duration, task/source filtering, remaining slots, retry loading, and a “compare with previous attempt of this task” shortcut. Two-item comparison is a useful foundation. |
| Medium | Remember playback preferences | Remember speed per language and distinguish a deliberately slowed first listen from an independent natural-speed attempt. |
| Medium | Simpler listening feedback | Lead with one useful listening target and an immediate replay action. Put technical scoring detail under an optional disclosure. |
| Medium | One feedback/request entry point | Profile notes, the request center, and legacy update history overlap. Use one discoverable notebook with Submitted/Planned/In progress/Shipped states. |
| Medium | Keyboard and touch phrase selection | Provide a deliberate phrase-selection mode or selectable sentence controls alongside native text highlighting. Validate touch handles, zoom, keyboard access, and focus return in real browsers. |
| Medium | Consistent reversible removal | Undo for phrase/note deletion; stronger confirmation for permanent audio deletion. Make destructive actions visually distinct from study actions. |
| Medium | Nonblocking release announcements | Permit “Read later” even if acknowledgement sync is unavailable. The current full-screen dialog can keep the learner blocked when saving acknowledgement fails. |
| Low | Language-aware product metadata | The root title, description, and social cards only describe French despite the Swedish track. |
| Low | Better maintenance documentation | Replace starter README sections with app architecture, local database setup, required nonsecret configuration names, test commands, and deployment/recovery guidance. |

## Validation and maintenance findings

- `npm test` stopped during build with EPERM removing `dist/.openai/drizzle` in the Sites closeBundle hook. Client and server reference-analysis stages had completed. This is a local filesystem/build failure; it is not evidence of a production runtime defect. The cause could be a lock, permissions, or the environment and needs diagnosis.
- Running `node --experimental-strip-types --test tests/*.test.mjs` directly produced 90 tests: 87 passed, three failed because `dist/server/index.js` was missing after the failed build. The three were rendered-page/auth integration tests, so those checks remain unverified.
- `npx tsc --noEmit` reported four Cloudflare typing errors: the `cloudflare:workers` module in two files, plus missing Fetcher and D1Database globals in the worker. Generate/include the appropriate Worker types and make type checking an explicit script.
- `npm run lint` reported 9,742 problems (9,721 errors and 21 warnings). It traversed generated `.sites-runtime/package-stage/dist` bundles, so that count substantially overstates authored-source issues. Ignore generated runtime/build directories, scope lint intentionally, and then establish a useful baseline. There were also authored test/script warnings/errors in the output.
- The default test command omits `tests/usage-recovery.test.mjs` and `tests/seasonal-theme.test.mjs`; the direct wildcard run included them. Use test discovery or explicitly keep the script complete.
- Several tests transpile and execute extracted component fragments with custom hook implementations. These are useful targeted checks, but they do not replace actual React/browser lifecycle tests for navigation, focus, microphone permissions, hydration, concurrent requests, and layout.
- Core learner state and many distinct UI flows are concentrated in `app/page.tsx`, with dense one-line handlers. Split lifecycle-heavy hooks and feature components into focused modules. Prefer shared validators and a single playback coordinator over repeated ad hoc implementations.
- Progress persistence accepts any JSON object below a character-count limit. Introduce a versioned, bounded server schema and migration path. Character count is also not the same as UTF-8 byte size. Validate aggregate limits before the UI repeatedly retries an unsavable growing state.

## Recommended implementation order

1. Fix completed-lesson review entry, visible conflict recovery, and truthful persistence status.
2. Add recording-feedback validation, bounded uploads, save deadlines, and shared recording/playback navigation state.
3. Correct calendar remote refresh, shared theme revisions, request idempotency payload handling, and practice timezone rules.
4. Restore a clean build/typecheck/lint baseline and add browser tests for the high-impact flows.
5. Improve phrase search, journal management, navigable library state, and the Today next-action hierarchy.

The browser acceptance pass should cover desktop and narrow mobile layouts; fresh and returning users; French and Swedish; keyboard-only operation; blocked/full storage; offline start and reconnection; simultaneous devices; microphone allow/deny/cancel; navigation during recording/coaching; and real seek/playback behavior. These remain verification work, not claims that those browser checks passed in this review.
