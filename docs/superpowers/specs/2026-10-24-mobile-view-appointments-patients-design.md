# Mobile view: Appointments and Patients pages (design)

**Date:** 2026-10-24
**Branch:** `feature/mobile-view` (based on `integration`)
**Mockups (approved):**
- `2026-10-24-mobile-view-appointments-mockups.html`: 32 phone screens, numbered 1–31 (3a/3b)
- `2026-10-24-mobile-view-patients-mockups.html`: 30 phone screens, numbered 1–29 (+10b)

Open the mockups in a browser. Screen numbers in this document ("A#12", "P#10b") refer to them:
**A#** = Appointments mockup, **P#** = Patients mockup.

---

## 1. Why

The clinic wants to use the ERP **like an app on a phone**. The main user is the
**receptionist**; doctors use it less. On a phone they need **everything the desktop
Appointments and Patients pages already do**: check today's appointments, book,
confirm, reschedule, cancel, mark completed, take payment and print the receipt, look
up a patient and work in every patient tab.

Today both pages are unusable on a phone. This was checked at 390 px and 404 px wide in
headless Edge, against the DEV database.

- **Appointments:** page content is ~860 px wide and the right half is clipped. The
  doctor filter, patient search, "Today" and the header's **New** button sit
  off-screen. The Daily view's existing phone branch shows 44 tall boxes (~11 screens
  of scrolling). Weekly/Monthly show only Sun–Tue. The Appointment List popup cuts off
  the Service and Phone columns.
- **Patients:** the table is clipped and the row **▾ actions menu is off-screen**, so
  **a patient cannot be opened at all on a phone**. On the patient page the 6 tab
  buttons overlap the content, and the tooth chart and the tables are cut off.

## 2. Goals

1. On any screen **narrower than 1024 px** (phones held upright or sideways, and
   tablets) every screen, tab, popup, action, message and empty state of both pages
   works, laid out as in the mockups. At **1024 px and wider** (laptops and desktop
   computers) nothing changes.
2. Same fonts (Inter body, Poppins headings), same colours, same words, same icons
   (lucide), same buttons and labels. **Only the layout changes.**
3. Same data, same business rules, same permissions as desktop (details in §6).

## 3. Non-goals

- No new features beyond the few layout conveniences listed in §8 ("calls made").
- No database or schema changes. No changes to Supabase queries or contexts beyond
  what a layout needs.
- No change to printed or downloaded output: the payment receipt PDF and the
  prescription print layout stay byte-for-byte the same.
- Making the ERP an installable home-screen app (PWA) is a possible later step and is
  out of scope here.
- Fixing the existing bugs listed in §10 (separate tasks).

## 4. Anti-goals: these count as failure even if the phone view works

- **Any visible or behavioural change at 1024 px and wider** (laptops/desktops). The
  user's standing instruction: *"don't break any existing logic, functionality or
  code."*
- Any change to slot limits, warnings, statuses, payment logic, follow-up generation or
  permissions.
- Different wording, colours or fonts from desktop.

## 5. Constraints

- Work on `feature/mobile-view` from `integration`. Local dev uses the **DEV** Supabase
  project only. Never point at LIVE.
- `src/pages/Appointments.tsx` is ~3,590 lines. Do **not** grow it with large phone
  markup. Put phone layouts in new components and keep the existing desktop JSX path
  intact (render the phone component when `useIsMobile()` is true, the existing JSX
  otherwise), reusing the page's existing state and handlers. The same idea applies to
  `Patients.tsx`, `PatientDetails.tsx`, `DentalChartingComponent.tsx`,
  `PrescriptionComponent.tsx` and `VitalSignsComponent.tsx`.
- Shared components (`AppHeader`, `AppLayout`, `ui/dialog`, `AddPatientDialog`,
  `UnresolvedAppointmentsAlert`, …) are used on other pages. Any change to them must
  be phone-only and must not alter desktop rendering anywhere.
- Commits only when the user asks. Commit attribution:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## 6. Behaviour that must stay exactly as desktop (both pages)

Everything below was read from the code and must be preserved on the phone.

**Appointments**
- Time slots 9:00 AM–7:45 PM in 15-minute steps. Dental allows 2 per slot, Meditouch 1.
  This is a *soft* limit: tapping a full slot shows "Warning: Time Slot Conflict … Do you
  want to continue?" with **Continue Anyway** (orange), so 3 in a slot can exist (DEV
  12 Feb 2026, 2:15 PM).
- The orange **"Full"** slot only appears when a search or doctor filter hides the
  patients in a slot whose unfiltered count has reached the limit.
- Tapping a past time on today gives the "Time Slot Unavailable" toast. Doctor booked in
  the other clinic → warning. Long service whose following slots are full → warning.
- Completed and cancelled appointments are hidden from Daily/Weekly/Monthly.
- Multi-slot appointments repeat in every slot they occupy, with the small bottom bar.
- Blocks use the doctor's colour (doctors table `color`), falling back to `#4A90E2`
  (dental) / `#16A085` (meditouch). The amber **BOOKED** tag shows on `booked` status.
- The Edit popup's green button: **Confirm Appointment** when `booked`, **Mark as
  Completed** when `confirmed`. Buttons follow `appointments.edit / create / delete`.
- Mark as Completed → "Service Completed Successfully" (Payment Status badge) → tapping
  the badge → "Confirm Payment Status Change" → **Mark as Paid** opens the Payment
  Receipt → **Download Receipt** makes the existing jsPDF file.
- Weekly/Monthly count badge colours: Dental ≥10 red, ≥5 yellow, else green (Meditouch
  ≥5 / ≥3). Monthly shows 3 appointments then "+N more", which expands, then "Collapse".
- Pending Treatments tab and Appointment List link are Dental-only.
- Every toast keeps its title and text (about 30 kinds).
- Opening the booking form pre-filled from Recall List / Pending "Schedule"
  (`openNewAppointmentFormWithData`), including the grey "Follow-up Service" box.

**Patients**
- Tabs and buttons follow the existing permissions (`patients.view_patient_info`,
  `view_appointments`, `view_dental_chart`, `view_treatment_history`,
  `view_prescriptions`, `view_vital_signs`, `edit`, `delete`, `export`, `create`,
  `edit_dental_chart`, `create/edit/delete_vital_signs`,
  `create/edit_prescriptions`).
- Dental Charting tab only for `dental`/`both` patients. History title "Dental History"
  for dental-only patients, otherwise "Appointment History". Column "Doctor" /
  "Therapist" / "Doctor/Therapist".
- Patient list search, the 3 clinic tabs (changing tab clears the search), sorting,
  pagination (10/20/25/50/100), Export CSV, Add/Edit/Delete with their confirmations
  and validations.
- Charting: Existing → Finding/Condition; Planned/Completed → Service. Planned entries
  keep the **Mark Completed** switch (it generates follow-ups). "Add Charting Entry"
  stays disabled until required fields are filled.
- Prescription Dispense Qty auto-calculates from timing × duration. **Print** uses the
  existing direct print (hidden iframe).

## 7. Decisions the user made

1. **Daily view = "Design B": compact time-slot list** (A#1). Every 15-minute slot as a
   thin row under hour headings, booked blocks inside. Not the "bookings only" list.
2. **Date navigation stays as desktop:** ‹ › (day/week/month), the date button opens the
   **same Calendar component** (A#19), and Today. The swipeable day strip and the red
   "now" line from early drafts were **removed**.
3. **Calendars look exactly like desktop's** (shadcn/react-day-picker). The main
   calendar is unchanged on phones. Appointment List "Custom Range": Start Date and End
   Date calendars sit **one above the other**, then Apply Range (A#27).
4. **Monthly (A#3a/3b):** each day shows only its count badge. Tapping a day lists its
   first 3 appointments under the calendar, then "+N more". "+N more" expands to the
   full list with **Collapse**. "Open in Daily ›" link. Tapping a line opens Edit.
5. **Weekly (A#2):** the 7 days stacked vertically.
6. **Every desktop feature is on the phone**, including the Appointment List
   (A#6, cards with tappable phone number), Pending Treatments, receipt, add patient,
   all popups.
7. **Popup background stays 80% black**, same as desktop (`bg-black/80`).
8. **Top bar on phones = 2 rows** (A#1): row 1 ☰ menu left; search, + New, bell,
   S avatar right. Row 2 the full-width **Dental Metrix | Meditouch** switch. Notifications
   and My Account menus drop down under their own buttons (A#30a/b). This is the shared
   header, so it applies to every page on phones.
9. **Patient page tabs become one drop-down** ("Prescriptions ⌄", P#10/10b),
   listing only permitted tabs with a tick on the current one.
10. **Patient list pagination** in 3 lines (P#3): count line, buttons, "Page x of y".
11. **Add Medication**: Duration on its own full-width row (number + unit), Dispense
    Qty on its own row (P#20).
12. **Prescription card**: grey labels above values, Edit and Print as two equal buttons
    (P#18).
13. Fonts and colours must be identical to desktop. "We are just changing the design;
    all other elements remain the same."
14. **Switch point = 1024 px.** Phone layout for every width below 1024 px, so phones
    held sideways and tablets also get it (at 820 px today's layout is clipped too).
    1024 px and wider is unchanged.
15. **Clinic phones are mostly Android.** Test on Android (Chrome) first; iPhone is
    secondary.

## 8. Calls made by Claude (approved with the mockups; flagged so they can be reviewed)

- Use a new, separate "compact layout" check (`< 1024 px`) for the phone layouts and the
  2-row header. Leave `useIsMobile()` (`< 768 px`) and the sidebar's existing behaviour
  untouched, because `useIsMobile()` is used in 9 places, including the sidebar and
  dialog widths.
- **Wording rule when a mockup differs from desktop: desktop wording wins.** The
  mockups shortened some text to fit. The build uses the full desktop text, for
  example the tab "Pending Treatments" (not "Pending"), and keeps the page title
  "Appointments" with its subtitle (smaller). No new labels are added: the tab
  drop-down shows just the current tab name, without the mockup's "Section" caption.
  If a full label doesn't fit at 360 px, the row may wrap or scroll sideways; the
  text is never shortened.
- The phone header keeps the small clinic logo icon next to ☰ (today's phone header
  shows the logo, and tapping it switches clinic; keep that behaviour). The switch row
  is added below.
- **Patient list sorting on phones:** a small "Sort by" drop-down above the cards with
  the same options as desktop's sortable headers (Name, Age, Last Visit; ascending /
  descending; default unchanged). Pending Treatments keeps its "Patient ⇅" sort button
  above the cards (A#4). This exists only so sorting isn't lost; it adds nothing new.
- Long forms (Create/Edit Appointment, Add/Edit Patient, Payment Receipt, Appointment
  List, Unresolved list) are full-screen on phones with buttons pinned at the bottom.
  Short confirmations stay centred with stacked buttons (`DialogFooter` already stacks
  below `sm`).
- Daily view opens scrolled to the current time when viewing today.
- The big amber "Past Appointments Need Attention" box becomes a one-line bar on phones.
  Tapping it opens the existing "Unresolved Past Appointments" list (A#5, as cards).
- Weekly lines show "time · service · patient" (desktop's fuller style), because a
  phone row has room.
- Tables become cards everywhere (appointment list, patient list, charting history,
  dental history, prescriptions, medications, vital signs, pending treatments), with
  the same fields.
- Hover-only info becomes tap: appointment block details are shown in the Edit popup;
  long notes (charting, vitals) expand on tap (P#26).
- Patient card: tapping the card body also opens View Details (the ▾ menu stays).
- Tooth chart: one row per quadrant (8 teeth), same labels and order (P#12).
  Alternative: keep desktop layout with sideways scroll. Checkbox Grid 4 per row (P#13).
- Prescription form: Cancel / Save stick to the bottom of the screen while scrolling
  (P#19/20).
- Patient Info shows 2 columns (desktop 3).
- Patient Search (header) is currently hidden on phones (`hidden md:flex`); it is shown
  again (A#7).

## 9. Screen list

The mockups are the visual spec. Behaviour for each is in §6/§7.

**Appointments (A#)**: 1 Daily · 2 Weekly · 3a/3b Monthly · 4 Pending Treatments ·
5 Unresolved list · 6 Appointment List · 7 Patient Search · 8 Create New Appointment ·
9 Add New Patient · 10 Warning: Time Slot Conflict · 11 Confirm Appointment ·
12 Edit Appointment (booked) · 13 Confirm Update · 14 Confirm Cancellation ·
15 Service Completed Successfully · 16 Confirm Payment Status Change ·
17 Payment Receipt · 18 Snooze Treatment · 19 Main date calendar · 20 "Full" slot ·
21 Pick lists in forms · 22 Confirm Patient Addition · 23 Booking from Recall/Pending ·
24 Messages · 25 Edit (confirmed → Mark as Completed) · 26 Receipt, Cheque mode ·
27 Custom Range · 28 Empty screens · 29 Meditouch · 30a/30b Notifications / My Account ·
31 Side menu (already works; no change).

**Patients (P#)**: 1 Patient list · 2 ▾ Actions menu · 3 Pagination · 4 Add New Patient ·
5 Confirm Add Patient · 6 Edit Patient · 7 Confirm Update · 8 Delete ("Are you sure?") ·
9 No patients found · 10 Patient Info · 10b Tab drop-down open · 11 Appointments tab ·
12 Tooth chart · 13 Checkbox Grid / child teeth · 14 Charting form · 15 Charting History ·
16 Dental/Appointment History · 17 Confirm Payment Status Change · 18 Prescriptions list ·
19 Create New Prescription · 20 Add Medication · 21 Print · 22 Vital Signs list ·
23 Record New Vital Signs · 24 Confirm Save/Update · 25 Confirm Deletion ·
26 Long notes · 27 Messages · 28 Meditouch patient · 29 Empty tabs.

Mockup data is real DEV data where it existed; anything marked *example* is sample
data. In the mockups the icons are emoji/simple SVG placeholders; the build uses the
same lucide icons as desktop.

## 10. Existing issues found (out of scope, do not change as part of this work)

1. Opening/refreshing `/patients` directly shows **403 Access Denied**: `ProtectedRoute`
   checks `requiredPermissions` before `PermissionContext` has finished loading. Works
   when reached through the menu. A separate fix is recommended.
2. Patient page **"Edit Patient"** button only navigates back to `/patients` (code says
   "for now"). Keep as is.
3. `PrescriptionComponent` has a print-preview Dialog nothing opens
   (`handlePrintPrescription` unused). Leave it.
4. `Appointments.tsx` contains unused code (`handleReschedule` → `/appointments/new`,
   `goToNewAppointment`, `AppointmentCard`, `handleDirect*`). No phone design needed. Leave it.

## 11. Open questions

None. Tablets and sideways phones were settled as decision 14, and phone types as
decision 15.

## 12. Risks / things to verify during the build

- **Printing on phones:** verify the prescription Print (hidden iframe) and the receipt
  `jsPDF.save()` on a real **Android** phone first (the clinic's main devices), then on
  iPhone. If printing fails on a phone, **report it to the user before changing the
  print method**. The user has not approved a phone-only print method yet. Any fix must
  keep the printed layout identical and leave desktop unchanged.
- **Desktop regression:** take before/after screenshots at 1440×900 of every desktop
  screen and popup touched, and compare. Any difference is a bug. The existing
  screenshot script (`D:\claude-scratch\pw\shot.mjs`, DEV-only, temporary session) can
  do this at any width (`DESKTOP=1`, `SPA=1`, `FAKE_DATE`, `CLICK_TEXT`).
- Shared `AppHeader` / dialog changes affect every page on phones. Spot-check other pages
  at 404 px.

## 13. Left to the builder

- Component structure and file names for the phone layouts. How to share state and
  handlers with the existing pages without duplicating business logic.
- Exact Tailwind classes and spacing, within the mockups' look.
- Order of work (suggested: shared header/layout/dialog → Appointments → Patients).
- Test approach. There's no test script in `package.json`; screenshot comparison plus a
  manual phone checklist is acceptable.
