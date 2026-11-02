# CLAUDE.md — À l'Oreille (LanguageLearningApp)

Listening-first language practice app for French (deepest), Spanish (A1–A2) and Swedish (A1).
Development is shared between Codex and Claude Code. **Follow `AGENTS.md`** (git workflow, checks,
secrets) — it is the shared rulebook; this file is the orientation map.

## Workflow essentials (from AGENTS.md)
- Start: `git status`, `git fetch origin`, compare with GitHub; on clean `main` use `git pull --ff-only origin main`.
- Never force-push or discard the other tool's work; reconcile diverged histories.
- Before commit: `npm run typecheck`, `npm test` (builds first), `npm run lint:baseline`.
- After push, verify the remote SHA. A GitHub push does **not** deploy — deployment is the separate Sites publish workflow. Sites-created commits must also be pushed to GitHub.
- Never commit `.env*`, `.wrangler/`, `.sites-runtime/`, build output. Keep `.openai/hosting.json` tracked.
- Shared rules that Codex must also follow belong in `AGENTS.md`, not only here.

## Stack
- vinext (Next-style app router on Vite 8), React 19, Cloudflare Worker via OpenAI Sites (`vite.config.ts`: vinext + sites + cloudflare plugins). Node >= 22.13.
- `worker/index.ts`: `/_vinext/image`, otherwise vinext app-router entry.
- DB: D1 (`DB`) through Drizzle — `db/index.ts` `getDb()`, tables in `db/schema.ts`, migrations `drizzle/0000–0008` (`npm run db:generate`). R2 (`BUCKET`) stores recordings.
- Env vars: `ALLOWED_USER_EMAILS`, `OWNER_EMAIL`, `OPENAI_API_KEY`.

## Layout
- `app/` UI components (each `foo.tsx` usually has `foo.css`), hooks (`use-*.ts`), `app/api/*/route.ts`.
- `lib/` pure logic and validators (testable). `content/` authored lessons, releases. `scripts/` audio + QA tooling. `tests/*.test.mjs` node:test. `docs/` plans, QA reports, reviews.

## Navigation (single-page app)
- `app/page.tsx` (~129KB, 497 minified long lines) holds `Page` → `AccessGate` → `LanguageContext.Provider` → `Home key={language}`, plus `HomeView`, `LibraryView`, `StudioView`, `AboutView`. **Make small, targeted exact-substring edits; it is the main merge-conflict hotspot.**
- Adding a view touches 4 places in `page.tsx`: the `view` union, the hash-restore whitelist, the `navigation` arrays + label map (labels duplicated later in the file), and the render ternary chain — plus the tutorial `Destination` type and any regex tests.
- Views via state: `today | practice | library | studio | progress | about | swedish | spanish | calendar | handsfree`. Nav (fr): today, library, handsfree, calendar, progress, about; sv inserts `swedish` ("A1 Lab"), es inserts `spanish` ("A1–A2 Lab") after today. `studio` is in no nav array. `progress` renders `JourneyHub`; `practice` goes through `SessionRecoveryGate`.
- Hash restore is gated on `progressLoaded`; the pushState effect skips its first run (`navigationReady` ref).
- Routing is by URL hash (`#library`, `#practice/<passageId>`, `#studio/<videoId>`) with `history.pushState`; unknown → today.
- Library sub-route: `#library/<category>?status=&sort=` (`lib/library-route.ts`, `app/use-library-navigation.ts`); categories all/everyday/announcements/situations/lab/native/recordings/poetry.
- Language from `?language=fr|sv|es` (default fr, `app/learning-language.tsx`); switching does a full reload; state is per-language.
- Only other real route: `/feedback` (owner inbox), `/usage` (owner dashboard).
- Studio (YouTube) is paused: `lib/studio-availability.ts` `STUDIO_ENABLED=false`.
- Onboarding: `app/first-time-tutorial.tsx` (6 steps; key `a-loreille:welcome-v1:<email-hash>:<lang>`, per account + language); `app/french-course.tsx` beginner guide.

## Styling
- Hand-written CSS, kebab-case classes (`.app-shell`, `.topbar`, `.session-rail`). Tailwind v4 imported but effectively unused.
- Tokens in `app/globals.css` `:root` (`--paper --card --ink --muted --line --coral --pink --blue --green --cream` …).
- Seasonal themes: `lib/seasonal-theme.ts` → `html[data-holiday-theme]`; `app/seasonal-contrast.css` keeps study text dark-on-paper. No dark mode.
- Mobile: 850px is the main layout break (nav hidden, stacked workspace); 620/600/520px common, plus many one-off widths per component. Respects `prefers-reduced-motion`.
- Not every component has its own CSS (daily-mix, french-course, spanish-lab use shared/global styles).
- Storage keys mostly prefixed `a-loreille-` (tutorial uses `a-loreille:`).

## Learning loop
1. **Pick** — `lib/daily-practice.ts` `dailyPractice()`: due reviews first (difficult ones prioritized), else unseen lesson scored by reflections (+4), interest (+3), CEFR distance (−2×). Shown in `app/daily-mix.tsx`; pathways in `app/learning-pathway.tsx`.
Session is a 4-step `step` index in `Home` (0 player+comprehension, 1 listen closer, 2 retell with rehearse embedded, 3 response+rating); components report back via callbacks.
2. **Listen** — `app/passage-player.tsx`; TTS via `/api/speech` (`gpt-4o-mini-tts`, voice style from `lib/speech-policy.ts`), 1× / 0.8×.
3. **Comprehension** — learner summary → `/api/comprehension`, validated by `lib/comprehension.ts`; tagged with listening condition (first/replay/slowed/transcript/familiar) as an `observation`.
4. **Listen closer** — `app/listen-closer.tsx`: re-listen, reveal transcript, save phrases.
5. **Rehearse** — `app/rehearse.tsx` + `lib/rehearsal.ts` (echo / build / rhythm); rendered inside `RetellPractice` via its `rehearsal` prop.
6. **Retell/speak** — `app/retell-practice.tsx`, `app/fluency-practice.tsx`; recording → `/api/feedback` (transcribe, then `gpt-5.4-mini` strict JSON). Retells judged on meaning (`lib/retell-policy.ts`), not word matching.
7. **Rate** Again/Hard/Good/Easy → `lib/review-schedule.ts` `nextReview()`: 10 min / ×1.2 / ×2 / ×2.5 (simple expanding intervals, not SM-2). Used for lessons (`reviewMemory["lesson:"+id]`) and saved phrases (`phrase:`). Completing a loop sets a fixed +3-day first review; `nextReview` applies only once rated.
- Hands-free mode: browser SpeechRecognition; `app/hands-free-session.tsx`, `lib/hands-free-commands.ts`, `lib/hands-free-session.ts`. State is localStorage only (`a-loreille-hands-free-v1-<lang>`), not progress-synced, no XP. Server routes/voice-activity from `docs/hands-free-mobile-plan.md` not built yet.
- XP (server-side, deduped, `app/api/journey`, `lib/journey.ts`): loop 40 (once/lesson; needs summary+retell, decoded, rehearsed), due review 20 (per passage, only when due, 24h gap), rehearse 10 (per passage/day), phrase-set 10/day (single phrases 0), checkpoint 25 (French, in order, ≥7 days apart), observations 0. XP only unlocks cosmetics.
- Level access is separate: `lib/french-progression.ts` (A1→A2→B1→B2 by completed required lessons).
- Skill evidence: `lib/learning-evidence.ts`, `app/skill-evidence.tsx`.

## API & data
- Every route: `app/api/app-auth.ts` `authorizeAppRequest` (oai-authenticated headers + allowlist; localhost = local-development). Language namespacing: `learning-track.ts`. AI calls: `ai-guard.ts` (`guardAiRequest`/`fetchAi`, 60/hour in `ai_quota`, 45s timeout, no retry). Owner-only routes compare `OWNER_EMAIL` inline (no shared helper). Localhost skips auth — test 401/403 via the built worker.
- Routes: progress, calendar, recordings, session-drafts, journey, announcements, usage, owner-usage, session, requests, feedback-inbox, feedback-updates, feedback, comprehension, writing, phrase-help, speech, youtube-transcript.
- Progress: one JSON blob per user in `learner_progress`; client `app/use-progress-sync.ts`; three-way merge `lib/progress-sync.ts` `mergeProgress(base, local, remote)` (explicit deletions except `completed`/`practiceDates`, which never delete; newer `reviewedAt` wins for such objects; `listeningPatterns` merge additively). Saves debounced 700ms with `If-Match` revision. Observations live in journey events, not the blob.

## Content
- `Passage` type in `content/passages.ts` (id, level A1–B2+, language?, text, decode, translation, phrase, speaker, cast/dialogue, challenges, comprehensionPoints, category, releasedAt…). `passages` aggregates French beginner/service/poetry/Swedish; **Spanish lessons (`content/spanish-beginner.ts`) are imported separately**.
- Announcements/situations: `content/announcements.ts`, `content/situations.ts`; listening scoring `content/listening-challenges.ts`.
- Labs: French (`content/french-lab.ts`, `app/french-lab.tsx`), Spanish (data in `app/spanish-lab.tsx`, logic `lib/spanish-lab.ts`), Swedish (`content/swedish-lab.ts`, `lib/swedish-lab.ts`, `app/swedish-lab.tsx`).
- Audio: `public/audio/passages/` (aligned WAVs in `aligned-turns-v1/`), manifest `content/audio-recordings.ts` (generated — do not hand-edit). Generate with `scripts/rebuild-aligned-audio.mjs --only=<id>` (needs `OPENAI_API_KEY`); validate with `npm run audio:check` (`lib/audio-recording-validation.ts`).
- Shipping an update to learners: append to `content/releases.ts` (`YYYY-MM-DD-slug`, items with `mark`).
- Adding a language touches: `language` unions in Passage/Announcement, content file, audio catalog script, `lib/speech-policy.ts`, a lab, `app/learning-language.tsx`, `listening-challenges.ts`.

## Tests
- `tests/*.test.mjs`: many are regex assertions over source/CSS (renaming classes or strings can break them — grep tests before refactoring); some transpile `lib/*.ts` and test logic; `rendered-html.test.mjs` runs the built worker and checks `/` and API auth codes.
- Content tests pin counts (e.g. 6 Spanish announcements, 8 situations) — update tests when intentionally adding content.
- `lint:baseline` fails only on findings beyond `docs/lint-baseline.json`.

## Open items
- French beginner pack: human listening review still pending (`docs/french-production-checkpoint.md`).
