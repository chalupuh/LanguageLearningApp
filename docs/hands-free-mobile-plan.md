# Hands-free and mobile learning plan

## Goal

Give learners such as Brandon a safe, low-attention way to listen and respond without operating the screen. This is a learning mode, not a driving aid: setup happens while parked or with a passenger, and the moving experience is deliberately limited to audio and a small command vocabulary.

## Experience principles

- Start from a dedicated **Hands-free session** entry point, with an explicit “Set up while parked” screen.
- Once moving, never require reading, typing, precise taps, or visual feedback.
- Announce every microphone window and confirm every accepted command aloud.
- Never save raw cabin audio. Store only the learner's intentional response or its transcript when they choose to submit it.
- After two failed recognitions, pause and explain that the session can be resumed when safe.
- Put detailed corrections in a “Review when parked” summary.
- Do not ship an always-listening wake word in the first version.

## Delivery phases

### Phase 0 — Spanish voice correctness

- Route Spanish transcription, comprehension, and speaking feedback through Spanish-specific instructions.
- Use neutral Latin American Spanish and English coaching explanations.
- Keep all authored lesson and Lab audio bundled so playback does not depend on a live generation request.

### Phase 1 — safe listening mode

- Create a queue from downloaded/bundled lessons and Spanish Lab exercises.
- Add large parked controls for start, pause, speed, and session length.
- Auto-advance with spoken titles and a short countdown; never auto-award completion or XP merely because audio played.
- Integrate browser Media Session controls so pause/continue/next work from a lock screen, headset, or car Bluetooth where supported.
- Recover the queue and playback position after calls, navigation prompts, lost connectivity, or app suspension.

### Phase 2 — bounded spoken commands

Recognize only a small grammar: **repeat**, **slower**, **normal speed**, **next**, **back**, **pause**, **continue**, **help**, and **stop session**. Require audible confirmation for state-changing commands. Commands must never be interpreted as lesson answers or completion events.

### Phase 3 — spoken practice

- Add clearly announced, time-bounded recording windows for retells and recall prompts.
- Let the learner say **submit**, **try again**, or **skip** after hearing their captured response.
- Read back only concise coaching while moving; defer transcript and detailed feedback to the parked review.
- Make every capture cancellable and visibly/audibly distinguish microphone-on from microphone-off.

### Phase 4 — resilience and offline behavior

- Preflight the full session before departure and show which items are available offline.
- Persist the queue, current lesson, playback rate, and unsent attempts locally.
- Retry sync idempotently and never duplicate XP, completions, or attempts.
- Fall back to listening-only mode when speech recognition or network access is unavailable.

### Phase 5 — limited Brandon pilot

- Enable the mode for Brandon first after his account is provisioned.
- Test parked setup, normal road noise, car Bluetooth, headset controls, interruptions, poor connectivity, and screen lock.
- Collect explicit feedback after the drive; do not collect background audio.
- Expand access only after command accuracy, recovery, and safety criteria are met.

## Acceptance criteria

- A learner can complete a 15-minute listening session without touching or looking at the phone after parked setup.
- Playback survives screen lock and resumes correctly after calls and navigation prompts on supported browsers.
- Target command recognition succeeds at least 95% of the time in the supported test matrix.
- There are zero accidental lesson completions or XP awards from playback and command recognition tests.
- Failed recognition pauses safely after two attempts; every state change has an audible confirmation.
- Bundled audio continues offline, and queued progress syncs exactly once after reconnection.
- Validate Android Chrome and iPhone Safari with phone speaker, wired/Bluetooth headset, and car Bluetooth.

## Proposed implementation seams

- `lib/hands-free-session.ts`: queue and recovery state machine.
- `lib/hands-free-commands.ts`: bounded command parser with deterministic tests.
- `lib/voice-activity.ts`: announced, time-limited capture windows.
- `app/hands-free-session.tsx` and CSS: parked setup and minimal moving UI.
- `/api/hands-free-command` and `/api/hands-free-answer`: narrowly scoped recognition and feedback.
- Existing passage player, progress recording, session recovery, usage limits, tutorial, and bundled-audio catalog provide the integration points.

## Rollout guardrails

Keep the feature behind an account allowlist during the pilot. Log only command outcomes, interruption/recovery events, and anonymous performance metrics. Add a clear stop control and an emergency fallback to the device's normal media controls. The app must state that the learner is responsible for following local laws and should stop the session whenever it is distracting.
