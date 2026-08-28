# Owner usage dashboard

`/usage` uses `/api/owner-usage`. The API requires both an invited account and an
exact match to `OWNER_EMAIL`; missing owner configuration fails closed. Responses
are private/no-store. The owner navigation link is not the security boundary.
No learner notice or release announcement was added for this feature.

## Collection

- Authenticated POST `/api/usage` accepts only session ID, canonical source,
  four-step position and timestamp intervals. Identity comes from server auth.
- No keys, text, recordings, page contents or raw interaction events are sent.
- Visible, focused intervals count while recently interacting (60-second idle
  timeout) or playing audio/video. Long timer gaps are dropped. Foreground
  playback is an estimate of engagement, not proof of attention.
- Samples are sent every five seconds with bounded, in-memory retry and a
  best-effort keepalive on exit. More than two minutes of stale data is rejected;
  connection loss and clock skew can therefore leave gaps.
- Duplicate samples have a composite key. Reporting unions intervals, including
  across simultaneous sessions/devices. Fine-grained samples older than 90 days
  are removed when that learner starts a new measured session. Session metadata
  remains for last-active/history; no historic time is synthesized from XP.
- Changing a passage/Studio selection starts another session. Returning after
  30 minutes of inactivity starts a new one. Sub-second uncompleted sessions are
  omitted from stopping-point/history rows.

## Completion and interpretation

Only the existing server-validated four-step loop endpoint marks completion.
It does so for zero-XP repeats as well as new lessons and due reviews. Completion
is idempotent per usage session. Analytics failure cannot block the lesson save.

An unfinished session means no confirmed completion and no activity for at least
five minutes, not that the learner struggled. Studio selection changes may
produce these rows. App browsing updates last active but is not practice time.
Phrase review/checkpoints outside Library/Studio loops do not contribute to the
loop-time metric. Dates use America/New_York; weeks start Monday. The 7/30/90-day
filter is a rolling duration, while practice days always describe this week.

Learning evidence comes from the existing journey ledger, not usage telemetry.
Fixed-answer checks retain their first/replay labels; AI observations compare
only first-listen Library material at the same labeled level with at least four
observations. Neither XP, usage, nor these small samples establish a CEFR level.

## Verification

`npm test` includes real SQLite route tests for owner denial, no-store responses,
source immutability, retry deduplication, overlap union, invalid interval rejection,
and zero-XP completions. A mocked client lifecycle checks hidden/focus/idle
transitions and cleanup without reading anyone's live practice data.
