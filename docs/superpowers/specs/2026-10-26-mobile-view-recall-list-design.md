# Mobile view: Recall List page (design)

**Date:** 2026-10-26
**Branch:** `feature/mobile-view`
**Mockups (approved by the user on 2026-10-26):** `2026-10-26-mobile-view-recall-list-mockups.html`,
20 phone screens, numbered 1–20 ("R#" below), plus sections E (messages, edge cases) and F
(existing issues). Open it in a browser.

This follows the rules of `2026-10-24-mobile-view-appointments-patients-design.md` (same
switch point, same "only the layout changes" rule, same anti-goals). Read §4–§8 of that
document first; they apply here unchanged.

---

## 1. Why

The Recall List is part of the appointment flow: the receptionist calls patients who are due
and books them with **Schedule**. On a phone today the page can't be used (checked at 384 px,
DEV data):

- Only the **Pending** tab button is visible; **Waiting** and **Snoozed** are cut off.
- The 7-column table is cut after the date, so **ⓘ, Schedule, Snooze and 🗑 can't be reached**.

Already fine on a phone (no work needed): the Details, Snooze and Delete popups (fixed by the
earlier popup-margin change), and **Schedule → pre-filled Create New Appointment** (R#20,
checked live at 384 px).

## 2. Goals

1. Below **1024 px** wide, every Recall List screen, tab, action, popup, message and empty state
   works as in the mockups.
2. At **1024 px and wider nothing changes**, pixel for pixel and behaviour for behaviour.
3. Same data, words, colours, fonts, icons, permissions and business rules as desktop.

## 3. Non-goals

- No new features beyond the phone **Sort by** box (§6).
- No change to `FollowUpContext`, Supabase queries, follow-up generation, sequences, or
  snooze/activate/delete logic.
- Not fixing the existing issues in §9.

## 4. Anti-goals (failure even if the phone view works)

- Any visible or behavioural change at ≥1024 px.
- Different wording from desktop.
- Any change in which recalls appear, their order, counts, or what a button does.

## 5. What the phone layout is (decided with the user through the mockups)

| Area | Phone (<1024 px) | Mockup |
|---|---|---|
| Page title + subtitle | Unchanged | R#1 |
| Card header | Title "Tentative Follow-ups" and description, then the **3 tab buttons full width below them** (equal thirds), same labels with counts, same colours (selected = app blue `default` button, on both clinics) | R#1, R#8 |
| Search, status filter | Unchanged (already full width on phones). Filter only on Pending; Waiting/Snoozed keep the greyed "Status filters not applicable" box | R#1, R#2, R#9 |
| Sort by | New small "Sort by" box above the cards (§6). Hidden when there are no cards | R#1, R#3 |
| List | **One card per follow-up** instead of the table, same rows in the same order | R#1 |
| Card content | Patient name (+ Step badge as desktop), then grey labels with **desktop column names**: Tentative Date, Suggested Service, Original Service, Original Doctor, Notes | R#1, R#4 |
| Tentative Date | As desktop: red + **Overdue** badge on Pending when before now; "Snoozed until …" small grey line on Snoozed tab | R#1, R#11 |
| Notes | Shows on the card cut short; tap to see all (existing `TapNote`, fallback "-") | R#4 |
| Card buttons | Same buttons and order as desktop's Action cell, per tab: Pending **ⓘ, Schedule, Snooze, 🗑**; Waiting **ⓘ, Activate Early, 🗑**; Snoozed **ⓘ, Activate, 🗑**. 🗑 only with `recall_list.delete`. Text buttons share the free width | R#1, R#7, R#9, R#11 |
| Schedule colour | Same as desktop: dental-primary / meditouch-primary text | R#8 |
| Empty states | Unchanged (same component) | R#6, R#10, R#12 |
| Popups (Details, Snooze, Delete) | Unchanged | R#13–R#18 |
| Toasts | Unchanged | R#19 |
| Schedule flow | Unchanged | R#20 |

Tablets and phones held sideways (up to 1023 px) get the same card layout, one card per row,
full width.

## 6. Sort by (the one phone-only control)

Desktop sorts by clicking the **Patient ⇅** and **Tentative Date ⇅** headers (`toggleSort`
sets `sortBy` + `sortOrder`). Cards have no headers, so phones get a "Sort by" drop-down that
sets the **same two state values** directly:

| Option label (desktop's own words) | sortBy | sortOrder |
|---|---|---|
| Tentative Date (Earliest First) *(default)* | date | asc |
| Tentative Date (Latest First) | date | desc |
| Patient (A-Z) | patient | asc |
| Patient (Z-A) | patient | desc |

Built like the approved Patients `PatientSortSelect`: a native `<select>` with a "Sort by"
label, so Android shows its own picker. The sorting itself is the existing
`filteredAndSortedFollowUps` memo; nothing about it changes.

## 7. Constraints

- `RecallList.tsx` keeps its desktop JSX. Wrap it in `isCompact ? <phone> : <existing>`
  ternaries (as done for Patients/Appointments) using `useIsCompact()` (`< 1024 px`).
- Put the phone markup in new files under `src/components/recall/compact/`
  (`RecallCardList.tsx`, `RecallSortSelect.tsx`) that receive the page's existing state and
  handlers. Reuse `TapNote`.
- The Waiting tab's "Activate Early" logic is written inline in the desktop JSX. The phone card
  needs the same action. Either the phone gets a callback that runs exactly that code, or the
  inline code is moved into a named handler used by both; the behaviour (activate, then the
  same toast, then `fetchFollowUps()`, no error toast) must stay identical.
- No change to shared components except through phone-only classes.
- DEV database only. No commits unless the user asks.

## 8. Verification required

- Unit tests for the phone pieces (buttons per tab, delete permission, Overdue only on Pending,
  Step badge, Snoozed-until line, Sort by mapping).
- Live checks at 360, 384, 412, 820 and 1023 px: no sideways scroll, all 3 tabs visible, every
  card button reachable, Details/Snooze/Delete open (then cancelled, nothing saved), Sort by
  re-orders, filter and search work, clinic switch.
- Desktop: pixel comparison of the Recall List (all 3 tabs + the 3 popups) and the existing
  desktop scenarios at 1440 px against a baseline build of the branch before this work. Must be
  identical.
- Build passes, all unit tests pass, no new lint errors.

## 9. Existing issues (out of scope, do not change)

- Desktop at 1440 px: the Action column (🗑) and the "Snoozed" tab are cut off on the right.
- A recall due today counts as "Upcoming" in the filter but shows red/Overdue.
- Activate Early shows no error message if it fails.
- The snooze calendar opens on the current month even when the default date is next month.
- "Clear Sequence Filter" can never appear (nothing calls `handleViewSequence`).

## 10. Calls made by Claude after the builder check

- **Activate Early on the phone** uses a new handler in `RecallList.tsx` with the same body as
  the desktop inline code (activate → same toast → `fetchFollowUps()`, no error toast). The
  desktop inline code is left untouched, so desktop can't change.
- **Waiting tab checks:** DEV has 0 Waiting recalls and the checks must not write to DEV, so the
  Waiting cards are covered by unit tests and by browser checks that fake the `follow_ups`
  response (no database writes).
- **Tablets (768–1023 px):** search and the status filter stay side by side as today (the
  existing `md:flex-row`); only phones under 768 px see them stacked, as now.

## 11. Left to the builder

Exact spacing and class names, the `TapNote` `maxChars` value, and whether the tab buttons need
smaller side padding to fit "Pending (34)" at 360 px. Labels are never shortened (rule from the
earlier design); if a label can't fit, reduce padding.
