# Review implementation — October 18, 2026

The prioritized reliability work and first usability improvements are implemented locally. The hosted Site has not been changed. Publication requires explicit user approval after automatic approval review rejected the source/publishing workflow as potentially production-impacting.

## Delivered in review priority order

1. **Review entry and recovery:** completed lessons begin fresh practice; previous completion/XP/answers are not restored as a new review. Start-over clears rehearsal and highlights. Conflicting drafts remain visible and stop syncing until the learner chooses a version. The learner can compare answers, download both versions, keep local work, or use the saved version. Replacing a version also preserves a timestamped local backup. A save committed before a lost response is recognized on retry.
2. **Accurate persistence:** progress reports an explicit unsaved state when both network and browser storage fail. Closing a tab warns when its progress has no durable copy. Session and calendar messages likewise distinguish stored work from open-tab-only work. Restored pending progress is shown as syncing until it reaches the server.
3. **Recording reliability:** shared runtime validation rejects incomplete speaking feedback and invalid transcripts. Private feedback receives no-store headers. Audio uploads are bounded before parsing, and invalid/unconfigured requests do not consume AI quota. Save/upload deadlines prevent permanently busy controls. Finished audio can be saved during coaching or downloaded directly. Navigation checks protect active or unsaved takes; final-retell recording participates in language-switch protection. Phrase-review audio joins the common playback coordination.
4. **Cross-device consistency:** calendar reads and merges remote state before saving, checks again while open, and refreshes on focus/reconnection. Shared theme writes advance the French revision relative to that record. Request IDs reject different retry payloads while keeping edited text. Practice reward dates and weekly achievements use America/New_York, with compatibility checks for existing daily reward events.
5. **Usability:** library tabs, status, and sort round-trip through the URL and survive leaving/returning. Poetry deep links work. Phrase search includes the phrase, sentence, and source title; the notebook supports due-only filtering, context editing, and undo removal. The recording journal has search, refresh, downloads, and available-slot counts. Playback speed is remembered per language. Release announcements allow Read later. Today distinguishes due reviews from new lessons. Product metadata describes both languages.

## Verification

- Production build: passed locally with filesystem sandbox escalation; no deployment command was run successfully.
- TypeScript: passed. `npm run typecheck` now generates scoped Cloudflare Worker declarations before checking. Generated runtime files remain ignored and do not override browser DOM globals.
- Automated regression suite: 96 tests passed in the final build-and-test run. Tests include malformed speaking output, quota ordering, completed-draft entry, storage failure, timezone boundaries, theme revision advancement, request retry payload conflicts, calendar remote refresh, and both session conflict resolutions.
- Browser checks: French library navigation/filter retention, a completed lesson opening at First listen, phrase search, context-editor opening/cancel, Swedish recording-journal loading, and a narrow viewport with no horizontal overflow.
- Real microphone capture and live paid AI calls were not exercised. AI tests use mocks. Simultaneous physical devices and full screen-reader testing remain unverified.
- `npm run lint` now excludes generated `.sites-runtime`, `.wrangler`, and work artifacts. Existing authored-code lint debt remains. `npm run lint:baseline` prevents the recorded 198 findings (176 errors, 22 warnings) from growing; it does not claim that strict lint is clean. The baseline is in `docs/lint-baseline.json`.

## Remaining improvements

The broader review backlog is retained rather than represented as complete: a single account-wide save-status panel, durable attempt history, named/duration-indexed recording comparisons, calendar goals that directly open practice, a unified replacement for all legacy feedback surfaces, dedicated keyboard/touch phrase-selection controls, and broader component/state refactoring. Lint cleanup should reduce the recorded baseline incrementally. New runtime validators should replace remaining legacy `any` types as each surface is touched.

No authentication policy, audience, API credentials, bundled recordings, or production user records were changed by this implementation.
