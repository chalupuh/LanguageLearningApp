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
- `app/page.tsx` (~200KB, minified long lines) holds `Page` → `AccessGate` → `LanguageContext.Provider` → `Home key={language}`, plus `LibraryView` and `StudioView`. **Make small, targeted edits; it is the main merge-conflict hotspot.**
- Views via state: `today | practice | library | studio | progress | about | swedish | spanish | calendar | handsfree`. Nav array is per language (sv adds "A1 Lab", es adds "A1–A2 Lab").
- Routing is by URL hash (`#library`, `#practice/<passageId>`, `#studio/<videoId>`) with `history.pushState`; unknown → today.
- Library sub-route: `#library/<category>?status=&sort=` (`lib/library-route.ts`, `app/use-library-navigation.ts`); categories all/everyday/announcements/situations/lab/native/recordings/poetry.
- Language from `?language=fr|sv|es` (default fr, `app/learning-language.tsx`); switching does a full reload; state is per-language.
- Only other real route: `/feedback` (owner inbox), `/usage` (owner dashboard).
- Studio (YouTube) is paused: `lib/studio-availability.ts` `STUDIO_ENABLED=false`.
- Onboarding: `app/first-time-tutorial.tsx` (per-language localStorage flag); `app/french-course.tsx` beginner guide.

## Styling
- Hand-written CSS, kebab-case classes (`.app-shell`, `.topbar`, `.session-rail`). Tailwind v4 imported but effectively unused.
- Tokens in `app/globals.css` `:root` (`--paper --card --ink --muted --line --coral --pink --blue --green --cream` …).
- Seasonal themes: `lib/seasonal-theme.ts` → `html[data-holiday-theme]`; `app/seasonal-contrast.css` keeps study text dark-on-paper. No dark mode.
- Mobile: max-width queries at 850px (nav hidden, stacked workspace), 620px, 520px; respects `prefers-reduced-motion`.
- localStorage keys prefixed `a-loreille-`.

## Learning loop
1. **Pick** — `lib/daily-practice.ts` `dailyPractice()`: due reviews first (difficult ones prioritized), else unseen lesson scored by reflections (+4), interest (+3), CEFR distance (−2×). Shown in `app/daily-mix.tsx`; pathways in `app/learning-pathway.tsx`.
2. **Listen** — `app/passage-player.tsx`; TTS via `/api/speech` (`gpt-4o-mini-tts`, voice style from `lib/speech-policy.ts`), 1× / 0.8×.
3. **Comprehension** — learner summary → `/api/comprehension`, validated by `lib/comprehension.ts`; tagged with listening condition (first/replay/slowed/transcript/familiar) as an `observation`.
4. **Listen closer** — `app/listen-closer.tsx`: re-listen, reveal transcript, save phrases.
5. **Rehearse** — `app/rehearse.tsx` + `lib/rehearsal.ts` (echo / build / rhythm).
6. **Retell/speak** — `app/retell-practice.tsx`, `app/fluency-practice.tsx`; recording → `/api/feedback` (transcribe, then `gpt-5.4-mini` strict JSON). Retells judged on meaning (`lib/retell-policy.ts`), not word matching.
7. **Rate** Again/Hard/Good/Easy → `lib/review-schedule.ts` `nextReview()`: 10 min / ×1.2 / ×2 / ×2.5 (simple expanding intervals, not SM-2). Used for lessons and saved phrases.
- Hands-free mode: browser SpeechRecognition; `lib/hands-free-commands.ts`, `lib/hands-free-session.ts`.
- XP (server-side, deduped, `app/api/journey`, `lib/journey.ts`): loop 40 (once/lesson), due review 20 (1/day), rehearse 10/day, phrase-set 10/day, checkpoint 25. XP only unlocks cosmetics.
- Level access is separate: `lib/french-progression.ts` (A1→A2→B1→B2 by completed required lessons).
- Skill evidence: `lib/learning-evidence.ts`, `app/skill-evidence.tsx`.

## API & data
- Every route: `app/api/app-auth.ts` `authorizeAppRequest` (oai-authenticated headers + allowlist; localhost = local-development). Language namespacing: `learning-track.ts`. AI calls: `ai-guard.ts` (`guardAiRequest`/`fetchAi`, 60/hour in `ai_quota`).
- Routes: progress, calendar, recordings, session-drafts, journey, announcements, usage, owner-usage, session, requests, feedback-inbox, feedback-updates, feedback, comprehension, writing, phrase-help, speech, youtube-transcript.
- Progress: one JSON blob per user in `learner_progress`; client `app/use-progress-sync.ts`; three-way merge `lib/progress-sync.ts` `mergeProgress(base, local, remote)` (explicit deletions, newer `reviewedAt` wins).

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
