# Mobile view: Enquiries (Leads) page (design)

**Date:** 2026-10-26
**Branch:** `feature/mobile-view`
**Mockups (approved by the user on 2026-10-26, with one change: Export centred):**
`2026-10-26-mobile-view-enquiries-mockups.html`, 15 phone screens ("Q#" below), plus section D
(messages, edge cases) and E (existing issues).

Follows `2026-10-24-mobile-view-appointments-patients-design.md` (§4–§8 apply unchanged: switch
point 1024 px, only the layout changes, desktop wording wins, no desktop change) and the same
patterns as `2026-10-26-mobile-view-recall-list-design.md`.

---

## 1. Why

Enquiries (website leads) are the start of the appointment flow: the receptionist calls the lead,
updates its status and converts it to a patient. On a phone today (384 px, DEV) the 8-column table
sits in a sideways-scrolling box; the Status drop-down, **Convert** and **🗑** are off-screen
(Convert starts at x=1089).

Already fine (no work): the Delete confirmation, and Convert → full-screen **Add New Patient**
pre-filled with name/email/phone (`AddPatientDialog`, already phone-ready).

## 2. Goals / non-goals / anti-goals

- Below 1024 px every screen, filter, action, popup, message and empty state works as in the
  mockups. At ≥1024 px **nothing changes** (pixel- and behaviour-identical).
- Same data, words, colours, permissions, business rules (status change, optimistic update +
  rollback, convert → New becomes Contacted, export file).
- Non-goals: no data/query changes; no change to `AddPatientDialog`; not fixing §8.
- Anti-goal: any change at ≥1024 px; different words; different behaviour of any button.

## 3. Phone layout (<1024 px)

| Area | Phone | Mockup |
|---|---|---|
| Header (title + inbox icon, subtitle, "N new" badge, Refresh) | Unchanged | Q#1, Q#8 |
| Search | Full width | Q#1 |
| Status + Date filters | Side by side, equal halves, full width together | Q#1, Q#3 |
| Record count + Export (CSV) | **"N record(s)" centred, Export (CSV) full-width button under it** (user's request). Export keeps its permission and disabled-at-0 rule | Q#1, Q#9 |
| Sort by | New box above the cards (§4); hidden when there are no cards | Q#1, Q#5 |
| List | One card per enquiry of the current page (`pageRows`), same order | Q#1 |
| Card | Name as title; rows with desktop column names **Date, Phone, Email, Service, Message, Status** | Q#1 |
| Phone | Tappable `tel:` link (dials) | Q#1, D |
| Email / Message | Email wraps (no truncation); empty → "-". Message: cut short, tap to read all (`TapNote`), empty → "-" | Q#7 |
| Status | `canChangeStatus`: the same shadcn Select with the 5 statuses, disabled while that enquiry is saving; otherwise the coloured Badge (same `STATUS_STYLES`) | Q#2, Q#10, Q#11 |
| Buttons | Convert (`canConvert`, full remaining width) and 🗑 (`canDelete`); no row when neither | Q#1, Q#10 |
| Empty / loading | Same 3 messages in the same bordered box | Q#9 |
| Pagination | Same controls; centred on 2 lines: "Rows per page [15]", then "‹ Page x of y ›" | Q#6 |
| Delete popup, Convert form, toasts | Unchanged | Q#12–Q#15 |

Tablets / phones sideways (≤1023 px): the same cards, full width.

## 4. Sort by

Desktop: clicking Date / Name / Service / Status headers (`handleSort`: same field toggles
direction; a new field starts at `desc`). Phone: native `<select>` labelled "Sort by" setting
`sortField` + `sortDirection` directly:

| Label | sortField | sortDirection |
|---|---|---|
| Date (Newest First) *(default)* | submitted_at | desc |
| Date (Oldest First) | submitted_at | asc |
| Name (A-Z) | name | asc |
| Name (Z-A) | name | desc |
| Service (A-Z) | service_inquiry | asc |
| Service (Z-A) | service_inquiry | desc |
| Status (A-Z) | status | asc |
| Status (Z-A) | status | desc |

Desktop shows only arrows, so these words are Claude's call (approved with the mockup).

## 5. Constraints

- Desktop JSX stays; phone differences are `isCompact` ternaries (`useIsCompact`, `<1024 px`) on
  class names, plus the card branch replacing the `<Table>` only when `isCompact`.
- New phone components in `src/components/enquiries/compact/` (`EnquiryCardList.tsx`,
  `EnquirySortSelect.tsx`) receiving the page's existing state and handlers.
- The `Enquiry` type and `STATUS_OPTIONS / STATUS_STYLES / STATUS_LABEL` are needed by the card
  list; move them unchanged to a shared module (`src/components/enquiries/enquiry.ts`) imported by
  both. Values must stay byte-identical.
- DEV database only. Live checks must not write to DEV: status change and delete are verified with
  intercepted (faked) network responses; Convert is opened and cancelled.
- No commits unless the user asks.

## 6. Verification required

Unit tests for both components; build; full unit suite; lint/tsc no new errors; live checks at 360,
384, 412, 820, 1023 px (no sideways scroll, all card controls reachable, filters, sort, search,
status change with faked save, delete with faked delete, convert form opens pre-filled and is
cancelled, export button centred, pages); desktop pixel comparison of Enquiries scenarios + all
existing desktop scenarios at 1440 and 1024 against a baseline build: identical.

## 7. Calls made by Claude

- Sort by labels (§4). Tappable phone number. Pagination centred on 2 lines.
- Export centred as a full-width button under a centred record count (user asked "in center or
  something"; this matches the Patients header buttons that are full width on phones).

Calls after the builder check: mockup screens Q#6/Q#14 are trimmed to save space (cards always
show all rows from §3); 🗑 is an outlined button with a red icon (as in the mockup and Recall
List); the bordered box is kept only around the loading/empty messages, not around the cards;
Sort by hides while loading or empty, pagination behaves exactly as desktop; an empty phone shows
nothing (no `tel:` link).

## 8. Existing issues (out of scope)

- Desktop 1440 px: Refresh, Export (CSV) and Convert/🗑 are cut off on the right (🗑 ends at
  1504 px).
