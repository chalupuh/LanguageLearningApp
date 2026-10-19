# Calendar review — October 19, 2026

## Outcome

The expanded regression suite passes (105 app tests). The production build and
TypeScript check pass. Lint baseline reports 194 existing findings and no new
diagnostic groups. Calendar workflows were also exercised in the local browser;
test items were removed afterward. Existing main goals and weekly items were
preserved. This is evidence for the tested paths, not a guarantee that no bugs
remain.

## Functionality checks

| Area | Verification | Result |
| --- | --- | --- |
| Month accuracy | All 3,600 months from 1900–2199, with Sunday and Monday starts; contiguous dates, correct columns, correct month lengths, four/five/six rows | Pass |
| Leap years and time zones | Century leap rules; UTC, New York, Honolulu, Kiritimati and Paris subprocesses; March/November DST periods | Pass |
| Daily checklist | Browser quick-add, completion, edit text, move across months, reload | Pass; task ID and completion retained |
| Draft safety | Rendered component and browser: type on one day, select another, return | Fixed; quick-add drafts stay on their original date during the visit |
| Delete recovery | Rendered component and browser delete/undo | Pass; one original task restored with completion intact |
| Weekly goals | Legacy undated goals, editor day/week scope changes, date-to-week validation | Pass; display week-start never changes saved weekly keys |
| Main goals | Effective-month history and browser inspection of existing October/November goals | Pass |
| Keyboard | Monday-start Home key selects/focuses Monday; arrow navigation; boundary month guard; mobile Back to month returns focus to selected date | Pass |
| Date limits | Browser January 1900 previous-month disabled, December 2199 next-month disabled; arrow navigation cannot enter 1899 | Pass |
| Save and recovery | Hook harness: offline edit, remount, reconnect, remote updates, edit during in-flight PUT, conflicts | Pass; latest edit retained and conflicting edits blocked |
| API isolation | Real SQLite integration: account/language separation, stale revisions, origin validation, invalid dated records | Pass |
| Holidays | Official 2026 U.S./French fixtures, actual/observed dates, cross-year New Year, Easter-derived French dates | Pass |
| Display preferences | Sunday/Monday, U.S./France/hidden holidays; browser reload and fresh component mount | Pass; preferences stored locally |
| Holiday/task separation | Hide/change region with a saved study task | Pass; task and completion totals unchanged |
| Responsive layout | Desktop, 390×844 and 320×740; no horizontal overflow; gold mobile marker opens full holiday detail | Pass |

## Changes made

- Fixed date-switching carrying unsubmitted quick-add text to the wrong day.
- Added locally remembered Sunday/Monday week layout.
- Added locally remembered U.S., France, or hidden holiday annotations.
- Distinguished national holidays and common observances from study checklists.
- Added a progress strip; stronger weekday contrast; quieter gold holiday marks;
  a dated selected-day heading; two-column weekly plans on larger screens.
- Improved mobile return-to-month keyboard focus and explicit control labels.

## Useful next improvements

1. Recurring study plans (for example, Monday/Wednesday listening), with a clear
   choice between editing one occurrence and a whole series.
2. Optional calendar export (ICS) for personal calendars, keeping study records
   and their privacy under the learner's control.
3. Search across old calendar items, plus an upcoming/overdue view for busy months.

These are suggestions, not features shipped in this update. Reminders would
require notification preferences and delivery design; they were not added.

## Verification limits

Sync and conflict checks use controlled hook/network simulations and SQLite;
they were not repeated across two physical devices or with a real network outage.
Mobile sizes were browser viewport tests, not physical iOS/Android devices.
Holiday rules are current recurring national dates and selected observances;
regional and historical completeness is outside scope. Unsaved quick-add drafts
last only for the current mounted calendar visit.

Holiday references: [U.S. OPM schedule](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/)
and [France Service Public, 2026](https://www.service-public.gouv.fr/particuliers/actualites/A18558).
