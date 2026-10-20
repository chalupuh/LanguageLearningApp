# French beginner pack — release candidate

Prepared 20 October 2026. The user has authorized publication as an **early-tester release**, with listening review delegated to **Alexis**. Human audio review remains pending and is no longer a prerequisite for this authorized early-tester publication. No invitation is authorized without Alexis's actual sign-in email. Publication outcome and version IDs will be recorded separately after the native Sites operation completes.

## Review next

Open **http://localhost:4174/** on this computer. The page serves only the final 24 WAVs and a checklist, prioritizes the three repaired scenes, shows every turn ID/text/voice, and exports `french-human-listening-review.json`. Total audio: **9 minutes 11 seconds**. All 24 players loaded metadata in the browser with zero media errors; all 24 listening results are pending. Review pronunciation, perceived voice continuity, intelligibility, pace and joins. Léa is marin, Paul is cedar, and announcement narration is marin. Mark problems by turn ID. Playback and ASR never automatically award a human pass.

If the local server stops, run `node scripts/serve-french-listening-review.mjs` from this checkout and reopen that URL. The retained local review server is intentionally left running for this handoff. `docs/french-audio-review.html` is a static fallback without saved checklist results.

The tool inventory contains synthesis, transcription and browser playback but **no direct audio-perception/listening tool**. The agent has not heard these recordings. No AI direct-audio or human listening sign-off is claimed. There is no reason to regenerate the automated-passing audio while waiting for this review.

## Candidate and integration state

| Item | Read-only finding |
| --- | --- |
| Worktree | `C:/Users/goldg/.codex/worktrees/5d84/Language Learning App` |
| Base | Detached HEAD `0e9901bdb0d1deb2f6ef228d82c8dc5771605d1b`; full implementation is uncommitted and preserved. |
| Primary local main | Same `0e9901b` base; primary checkout status was clean. No local main integration conflict exists at the observed state. |
| GitHub remote | `https://github.com/chalupuh/LanguageLearningApp.git`; live remote main observed at `2bb2d8298da5526d7a650a19c894522f1f868407`, an ancestor 15 commits behind candidate base. Local origin/main is stale at `3326d2d`; do not use it to infer deployed source or force-push over it. |
| Existing Site | `appgprj_6a8e6f57d2188191a0313a144050cac0`, À l’Oreille, slug `a-loreille-french`. |
| Production URL | https://a-loreille-french.newhart-it.chatgpt.site |
| Saved/live baseline | Sites version 44, source `0e9901bdb0d1deb2f6ef228d82c8dc5771605d1b`; deployment `appgdep_6ad67b043ed0819195f9e0c82c06bfd9` confirmed succeeded. Rollback version ID: `appgprj_6a8e6f57d2188191a0313a144050cac0~appgver_bbc93207b7f88191838df4ea546a6449`. |
| Audience | Existing Sites access mode `public`; application invitation/sign-in checks remain in force. Preserve the existing mode and all application allowlists. Do not convert it to a new private Site or widen membership. |
| Storage/config | `.openai/hosting.json` unchanged: D1 `DB`, R2 `BUCKET`. `db/`, all existing Drizzle SQL/journal files, dependency lockfiles and Vite config unchanged from deployed version 44. **No new schema migration or backfill for this update.** |

Scope: 16 French conversations and eight announcements with explicit turn/cast mappings; server-owned versioned A1/A2/B1 unlocks; per-account tutorial, feedback context and advanced-user beginner visibility. Existing learners retain their progress and advanced access; beginner-v1 retains its earned thresholds. The 97 pre-existing audio records/bytes remain unchanged. No tester email has been assumed or added.

Validation: production build, all 116 tests, TypeScript, lint baseline (193 existing findings / zero new groups), diff whitespace checks and 24-scene structural audit pass. Unprompted mini-transcribe plus independent flagged-scene whisper checks establish no unresolved automated script flag. Human audio review remains pending. Full evidence: `french-predeployment-qa.md`, `french-audio-production-report.json`, `french-transcription-qa.json`, `french-transcription-qa-crosscheck.json`.

## Reproducible local snapshot

Run `python scripts/prepare-french-release.py`. It snapshots tracked and non-ignored untracked source files at this base, records per-file SHA-256 hashes, validates final audio hashes, and writes ignored `work/french-release-candidate/source-review.tar` plus `inventory.json`. It does not stage, commit, merge, push, contact Sites, include ignored credentials/local data, or change production. This is a **review snapshot, not a Sites-verified deployment archive**. The official Sites workflow must create its own verified source commit/archive after authorization. Rerun the snapshot if any source changes.

## Authorized early-tester publication workflow

1. Recheck Site latest source and primary main for concurrent changes. Preserve other user work; integrate only this candidate. Do not reset, force-push or overwrite newer Site changes. Alexis will perform the pending listening review during early testing; compare her feedback with final scene hashes and target any repairs afterward.
2. Use the existing Site’s `create_source_repository_write_credential` and official `site-workflow.mjs` helper for this same project ID. Keep its credential only in memory/stdin. Package with the official `build-site.mjs`; retain the helper’s verified commit SHA and archive. Do not repurpose the local review tar as an upload artifact.
3. Preserve audience and all environment values. Because current audience is public, use **`save_site_version` then `deploy_site_version`** for the verified candidate. Do not use the owner-private deployment action. Poll only the resulting deployment until terminal state; retain its version/deployment IDs and URL.
4. Smoke-check deployment health, bundled assets and authenticated/unauthenticated route behavior with available authorized access. Do not impersonate Nikki or Alexis. Account-isolation and Nikki-preservation fixtures already pass locally; real account checks belong to those users. Confirm the storage bindings remain connected. Releasing code does not authorize resetting any learner data.
5. Add a tester only after the actual ChatGPT sign-in email and invitation authorization are provided. Append it while preserving all current `ALLOWED_USER_EMAILS` entries and `OWNER_EMAIL`; do not guess an address. No tester invitation is part of this candidate.
6. If a material regression appears, redeploy the retained version-44 archive/source through Sites. No new migration rollback is needed for this candidate; preserve learner data written since release.

**Authorization:** publish this tested candidate to the existing Site, preserving audience, invitations, environment values, bindings and learner data. Human listening review stays assigned to Alexis and pending. Her exact ChatGPT sign-in email remains the only missing invitation input.
