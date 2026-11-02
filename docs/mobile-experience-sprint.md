# Mobile experience sprint

## Goal

A new learner can open À l’Oreille on a phone, understand where to begin, complete a lesson without controls or text being obscured, move among the primary destinations without horizontal navigation, and recover safely after an interruption or loading failure.

## Completed in the November 2, 2026 checkpoint

- Replaced the overflowing mobile header navigation with a fixed, safe-area-aware listening dock.
- Kept Today, language-specific Learn, Library, Hands-free, and Progress in thumb reach; moved Calendar and About into an accessible More sheet.
- Added active-page semantics, Escape and focus trapping, 44px-or-larger targets, and a distinct Hands-free destination.
- Reduced first-time guidance from six steps plus competing surfaces to one four-step flow that ends inside the first lesson.
- Prevented the French starter guide and release notes from covering an active lesson.
- Made the phone header compact and kept primary lesson actions sticky above the dock.
- Set mobile form controls to 16px to prevent iOS input zoom and added safe scroll margins around the on-screen keyboard.
- Added route-specific document titles and focus movement to the destination heading.
- Added a direct progress-load retry state that explains server progress is unchanged and local lesson drafts remain available.
- Added a global reduced-motion fallback.
- Added regression tests for navigation, onboarding overlap, loading recovery, motion, safe areas, and lesson ergonomics.
- Browser-validated Spanish at 320×568, 375×667, 390×844, 430×932, and 768×1024 without horizontal overflow.

## Next checkpoint

1. Test on physical iPhone Safari and Android Chrome with 200% text, landscape rotation, and the software keyboard open.
2. Test Bluetooth headphones, car Bluetooth, screen lock, navigation-audio interruption, and an incoming call with Brandon's device.
3. Add browser-level interaction tests for the mobile More sheet, first-lesson handoff, focus movement, and draft restoration. Existing source tests protect the structure but do not replace end-to-end testing.
4. Add privacy-conscious client diagnostics for audio-load failures, microphone denial, sync retry, and restored sessions. Do not collect raw audio or learner response text.
5. Evaluate a read-only cached catalog shell for first-load outages. Current drafts survive locally, but a device that has never completed its initial progress load still needs the server before entering the app.

## Acceptance checks

- No sideways page or navigation scrolling at supported phone widths.
- Primary mobile targets are at least 44×44 CSS pixels.
- The dock and sticky lesson controls respect bottom safe areas and do not overlap.
- Only one first-visit modal is exposed at a time; no modal covers the first lesson.
- Keyboard focus moves to the new view heading and remains trapped inside open modal sheets.
- Reduced-motion mode removes nonessential animation and transition time.
- A progress-load failure gives a visible retry and accurately explains what is and is not preserved.
