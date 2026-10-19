# Visual monthly calendar

My Calendar leads with a Sunday–Saturday (or Monday–Sunday) month table, followed by the selected
day's checklist, the main monthly goal, and the existing weekly checklist sections.
The month grid includes neighboring dates to complete each week. Today and the
selected date have separate visual treatments. Arrow keys move by day/week;
Home and End move within a calendar row. On phones, compact markers summarize
items and the selected-day panel provides the full readable checklist.

Daily tasks use an optional `date` (`YYYY-MM-DD`) on the existing `CalendarGoal`.
Every task retains its Monday `week` key. A dated task must have a real supported
date and `weekStart(date) === week`. Existing undated weekly goals remain valid;
they are never assigned an invented date. The editor can schedule an undated
goal, move a dated item, or return it to a flexible week. All surfaces edit the
same task ID, preserving completion and creation time.

The calendar JSON remains version 1 and uses the existing account/language-scoped
calendar API, optimistic revisions, offline recovery, and three-way conflict
handling. No database migration or rewrite of existing calendars is required.
Date-only grid calculations use UTC noon and UTC weekday arithmetic so browser
timezone and daylight-saving transitions do not shift columns. Today follows the
learner's browser-local date. Monthly study counts are based on manually checked
dated items, not inferred lesson attendance.

Regression coverage checks month/day alignment, four- and six-row months,
century leap-year rules, supported date boundaries, legacy records, moving
items, conflict merges, API persistence and account/language isolation.

## Display and holidays

The browser display preference supports Sunday/Monday week starts and U.S.,
France, or hidden holiday annotations. Home/End follow the chosen row layout.
Changing display settings never changes task dates or Monday-based weekly keys.
Draft quick-add text is held separately for each date during a mounted visit;
unsubmitted drafts are not saved after reload. Full holiday names appear in the
selected-day panel; phones use a gold marker to keep the grid uncluttered.

Holiday annotations use current recurring national rules, with selected common
observances. They are not an exhaustive regional or historical holiday database.
U.S. actual dates and Friday/Monday observed dates are separate, including
New Year’s Day observed in the previous December. France uses Gregorian Easter
for Easter Monday, Ascension and Whit Monday. Annotations never enter the saved
plan, checkbox totals, or manually tracked study-day counts.

Date references checked against [OPM’s federal holiday schedule](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/)
and [Service Public’s French 2026 holiday dates](https://www.service-public.gouv.fr/particuliers/actualites/A18558).
