# Mobile View (Appointments + Patients) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Appointments and Patients pages (and the shared top bar) a phone/tablet layout below 1024 px that matches the approved mockups, while leaving every screen at 1024 px and wider pixel-identical and behaviour-identical.

**Architecture:** A new `useIsCompact()` hook (`< 1024px`) decides, per page section, whether to render a new compact component or the **existing desktop JSX, left untouched**. Compact components reuse the pages' existing state, handlers and rules through props; business logic is never re-implemented differently. A side-by-side screenshot regression (the `integration` branch on port 8081 against this branch on port 8080, at 1440 and 1024 px) proves that desktop is unchanged after every task.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind, shadcn/ui (Radix), lucide-react, date-fns, Supabase (DEV project `pwijqupjtminhcmtbxta` only). New dev-only: vitest + jsdom + @testing-library/react. Regression tooling (outside the repo): playwright-core + Edge, pixelmatch, pngjs.

**Spec:** `docs/superpowers/specs/2026-10-24-mobile-view-appointments-patients-design.md` (read it first). The mockups beside it are the visual spec: **A#n** = `2026-10-24-mobile-view-appointments-mockups.html`, **P#n** = `2026-10-24-mobile-view-patients-mockups.html`.

## Global Constraints

- **Desktop freeze:** at viewport width ≥ 1024 px nothing may change, visually or behaviourally. Every task ends with `regress.mjs` reporting **0 differing pixels** in every scenario.
- **Compact switch:** `useIsCompact()` = `window.innerWidth < 1024`. Do **not** change `useIsMobile()` (`< 768`), `SidebarProvider`, or the sidebar.
- **Do not edit desktop JSX.** You may (a) wrap it in `{!isCompact && (...)}` / a ternary **without changing its contents**, (b) add `export` to existing in-file components, (c) add new functions. When a `className` must differ on compact, the desktop branch must produce the **identical string** as before.
- **Wording:** desktop wording wins over the mockups. Use full labels ("Pending Treatments", page title "Appointments" + subtitle). Add no new captions (no "Section" label). Text may wrap or scroll sideways at 360 px but is never shortened.
- **Look:** same fonts (Inter body, Poppins headings via existing `font-display` / `h1–h6`), same Tailwind colour tokens (`dental-primary #4A90E2`, `meditouch-primary #6CBFBF`, `primary`, doctor colours from `doctors.color`), same lucide icons as desktop.
- **Rules unchanged:** slot limits (Dental 2 soft / Meditouch 1), warnings, statuses, permissions (`hasPermission(...)` exactly as desktop), toasts, follow-up generation, payment flow, receipt PDF and prescription print output.
- **Popup overlay stays `bg-black/80`.** Long forms are full screen on compact with the buttons pinned to the bottom; short confirmations are left as they are.
- **Data:** DEV Supabase only. Never point `.env` at LIVE. Don't create or delete DB rows during regression runs.
- **Files:** scratch and tools live on D: (`D:\claude-scratch\pw`); the baseline worktree is `D:\mudra-baseline-integration`.
- **Commits:** one per task on `feature/mobile-view`, message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never commit `WBBOX-WHATSAPP-INTEGRATION.md`. No push unless the user asks.

## Review Focus

1. **Exactly 1024 px and 1023 px.** 1024 must equal integration (regression covers it); 1023 must show the full compact UI, with no half-desktop mix (Task 2 hook test; Task 15 screenshots at 1023).
2. **Resizing or rotating while a popup or form is open** (phone turned sideways, crossing 768 but staying < 1024): the open dialog and the typed form data must survive. Compact components receive state from the page; they must not own form state (Task 5 and Task 10 manual checks).
3. **Long names and long lists:** a 40-character patient name, a 4-medicine list, 3 patients in one Dental slot (DEV 12 Feb 2026, 2:15 PM), and 10 appointments on one month day must wrap, never overflow or clip (Tasks 5, 6, 10 and 13 screenshot checks at 360 px).
4. **Permissions:** a user without `appointments.edit` / `patients.delete` / `patients.view_dental_chart` must not see those buttons, menu items or tab-dropdown entries on compact (Task 11 `getVisiblePatientTabs` tests; Tasks 5 and 10 reuse the same `hasPermission` checks).
5. **Printing on the clinic's Android phones:** the prescription Print and the receipt Download must work from the compact UI. If either fails, **stop and report to the user**; don't change the print method (Task 15 manual checklist).

---

## File Structure

New files:
- `src/hooks/use-compact.tsx`: `COMPACT_BREAKPOINT`, `useIsCompact()`.
- `src/lib/compact.ts`: shared compact class strings and pure helpers.
- `src/lib/patient-tabs.ts`: which patient tabs a user and patient can see (labels identical to desktop).
- `src/components/compact/TapNote.tsx`: tap-to-expand long notes (replaces hover on compact).
- `src/components/compact/CompactHeader.tsx`: the 2-row top bar.
- `src/components/appointments/compact/AppointmentsCompactView.tsx`: compact page shell (title, alert bar, tabs, nav row, filters).
- `src/components/appointments/compact/CompactDailyView.tsx`, `CompactWeeklyView.tsx`, `CompactMonthlyView.tsx`.
- `src/components/patients/compact/PatientCardList.tsx`, `PatientSortSelect.tsx`, `CompactPagination.tsx`.
- `vitest.config.ts`, plus tests next to the files they test (`*.test.ts(x)`).

Modified (desktop JSX only wrapped, never edited): `src/components/AppHeader.tsx`, `src/components/UnresolvedAppointmentsAlert.tsx`, `src/pages/Appointments.tsx`, `src/components/AppointmentList.tsx`, `src/components/PendingTreatmentsView.tsx`, `src/components/AddPatientDialog.tsx`, `src/components/PaymentReceiptDialog.tsx`, `src/pages/Patients.tsx`, `src/pages/PatientDetails.tsx`, `src/components/DentalChartingComponent.tsx`, `src/components/VisualToothChart.tsx`, `src/components/PrescriptionComponent.tsx`, `src/components/VitalSignsComponent.tsx`, `package.json`.

---

### Task 1: Desktop regression harness (outside the repo)

**Files:**
- Create: `D:\claude-scratch\pw\scenarios.mjs`, `D:\claude-scratch\pw\regress.mjs`, `D:\claude-scratch\pw\compact-shots.mjs`
- Reuse: `D:\claude-scratch\pw\shot.mjs` (DEV-only guard, temp `user_sessions` row for the super_admin "System" user, `FAKE_DATE`, `SPA`, `CLICK_TEXT`, `DESKTOP`, `TYPE_SEARCH`)

**Interfaces:**
- Produces: `node regress.mjs` → compares `http://localhost:8081` (integration) with `http://localhost:8080` (feature) for every scenario and prints `name width diffPixels`. Exit code 1 if any `diffPixels > 0`. Writes `regress/<name>-<w>-{base,feat,diff}.png`.
- Produces: `node compact-shots.mjs <width> <height>` → screenshots every compact scenario from 8080 into `compact/<w>/<name>.png`.

- [ ] **Step 1: Create the baseline worktree.** `git -C D:/demo-mudra-dental-meditouch-internal-20 worktree add D:/mudra-baseline-integration integration`, copy `.env` (verify it contains `pwijqupjtminhcmtbxta`), `npm install`, then start `npx vite --port 8081 --strictPort` in the background. Keep the feature dev server on 8080.
- [ ] **Step 2: Install the tool deps** in `D:\claude-scratch\pw`: `npm i pixelmatch@5 pngjs@7`.
- [ ] **Step 3: Write `scenarios.mjs`.** `export const scenarios = [{ name, path, spa?, fakeDate?, clicks?: string[], typeSearch?, hover? }]`, with all of them run at widths `[1440, 1024]` (height 900). Required scenarios (FAKE_DATE `2026-02-12T09:00:00` for Appointments ones):
  - Appointments: `appt-daily`, `appt-weekly`, `appt-monthly`, `appt-pending`; the popups `appt-applist` (click "Appointment List ("), `appt-applist-range` (+ "All Appointments", "Custom Range", "Select date range"), `appt-new` (click "New Appointment"), `appt-edit` (click "Jig Trial"), `appt-calendar` (click "February 12th, 2026"), `appt-search-rewa` (typeSearch "Rewa"), `appt-unresolved` (click "more unresolved").
  - Patients (`spa: true`): `pat-list`, `pat-actions` (click the first row's "Open menu"), `pat-add` (click "Add New Patient"), `pat-edit` (actions → "Edit Patient"), and the patient tabs for `8450dd1c-154e-47c1-b24c-a2aa78efd1dd` (overview, appointments, dental-charting, appointment-history), `552e4ea8-807a-48eb-9164-c80f7378c9df` (prescriptions) and `e5dfc658-a4c2-4653-a862-eac9b5237b57` (vital-signs).
  - Other pages using shared parts (paths `/dashboard`, `/enquiries`, `/recall-list`; `spa: true`): `dashboard`, `enquiries`, `recall`.
- [ ] **Step 4: Write `regress.mjs`.** For each scenario and width: one temp session, open the same scenario on 8081 and 8080 in two pages (same viewport, same `clock.install` time, `animations: 'disabled'` on screenshot), wait for networkidle + 2.5 s, take full-page screenshots, run pixelmatch (threshold 0.1) and record the diff count. Delete the temp session in `finally`.
- [ ] **Step 5: Write `compact-shots.mjs`.** Same scenario list plus compact-only clicks, run against 8080 only at the given width (mobile UA, `isMobile`, `hasTouch`).
- [ ] **Step 6: Sanity run.** Both servers on the same code (feature branch = integration + docs). Run `node regress.mjs`. Expected: every scenario prints `0`, exit 0. Any non-zero means a flaky scenario (fix the wait or the click) before moving on.
- [ ] **Step 7:** No repo commit (tools live outside the repo). Note the commands at the top of the task list in the plan as a reminder.

### Task 2: Test setup, `useIsCompact`, shared compact helpers

**Files:**
- Modify: `package.json` (devDeps `vitest`, `jsdom`, `@testing-library/react`; script `"test": "vitest run"`)
- Create: `vitest.config.ts` (env `jsdom`, alias `@` → `src`, `include: ['src/**/*.test.{ts,tsx}']`, `exclude: ['src/__tests__/**']`, because the old Jest test isn't runnable)
- Create: `src/hooks/use-compact.tsx`, `src/hooks/use-compact.test.tsx`
- Create: `src/lib/compact.ts`, `src/lib/compact.test.ts`

**Interfaces:**
- Produces: `export const COMPACT_BREAKPOINT = 1024;` and `export function useIsCompact(): boolean`. The **initial value is computed synchronously** from `window.innerWidth`, so there's no desktop flash on phones, and it updates on `resize`.
- Produces in `src/lib/compact.ts`:
  - `export const COMPACT_FULLSCREEN_DIALOG: string`: classes for `DialogContent` that make it fill the screen below 1024 (must also override shadcn's `sm:max-w-lg sm:rounded-lg`): `"left-0 top-0 translate-x-0 translate-y-0 w-screen max-w-none sm:max-w-none h-[100dvh] max-h-none rounded-none sm:rounded-none p-0 gap-0 flex flex-col"`.
  - `export const COMPACT_DIALOG_BODY = "flex-1 overflow-y-auto px-4 py-4"`
  - `export const COMPACT_STICKY_FOOTER = "sticky bottom-0 z-10 border-t bg-background px-4 py-3 flex flex-col gap-2"`
  - `export function previewList<T>(items: T[], expanded: boolean, limit = 3): { visible: T[]; hiddenCount: number }`

- [ ] **Step 1: Write failing tests.**
  - `use-compact.test.tsx`:
    - `it('is true at 1023px')`: set `window.innerWidth = 1023`, `renderHook(useIsCompact)` → `true`.
    - `it('is false at 1024px')` → `false`.
    - `it('updates on resize')`: start at 1440, then 400 plus `dispatchEvent(new Event('resize'))` → `true`.
  - `compact.test.ts`:
    - `previewList([1..10], false)` → `{ visible: [1,2,3], hiddenCount: 7 }`.
    - `previewList([1..10], true)` → all 10 and `hiddenCount: 0`.
    - `previewList([1,2], false)` → `{ visible: [1,2], hiddenCount: 0 }`.
- [ ] **Step 2:** Run `npx vitest run src/hooks src/lib`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement `useIsCompact` and `previewList` and add the constants.
- [ ] **Step 4:** Run `npx vitest run src/hooks src/lib`. Expected: 6 passed. Then `npm run build`. Expected: success.
- [ ] **Step 5:** Run `node D:/claude-scratch/pw/regress.mjs`. Expected: all 0.
- [ ] **Step 6: Commit** `feat(mobile): add useIsCompact hook, compact helpers and vitest`.

### Task 3: Compact 2-row top bar (shared header)

**Files:**
- Create: `src/components/compact/CompactHeader.tsx`
- Modify: `src/components/AppHeader.tsx`: in the returned JSX, `isCompact ? <CompactHeader .../> : <existing header JSX unchanged>`. The search `Sheet`, the notifications dropdown and the user dropdown already exist in `AppHeader`, so pass the needed state/handlers down as props (`activeClinic`, `setActiveClinic`, `toggleSidebar`, `setIsSearchOpen`, `onNewAppointment`, `notifications`, `unreadCount`, `markAllAsRead`, `handleNotificationClick`, `user`, `logout`, `navigate`). Do **not** duplicate the Sheet: render the existing `<Sheet>` once, outside the ternary, so both layouts open the same one.

**Interfaces:**
- Produces: `CompactHeader(props: CompactHeaderProps)`. Layout per A#1 and spec decision 8, plus the logo-icon call in §8:
  - Row 1: `Menu` button (`toggleSidebar`) · the small clinic logo icon (tap = switch clinic, today's phone behaviour) · spacer · `Search` (opens the existing Sheet) · **New** button (the same `navigate('/appointments')` + `openNewAppointmentForm` event as desktop, with the same colour classes) · `Bell` dropdown (same content as desktop) · avatar dropdown (My Account, the user's name, Settings, Log out).
  - Row 2: full-width `ClinicSelector variant="tabs"` (the component desktop already uses).

- [ ] **Step 1: Implement** `CompactHeader` and the ternary in `AppHeader`.
- [ ] **Step 2: Verify compact.** `node compact-shots.mjs 360 780` and `404 862`, then look at the `appt-daily`, `pat-list` and `dashboard` shots. Expected: both rows visible, nothing clipped, the switch row full width, the menus drop down under their buttons (A#30a/b).
- [ ] **Step 3: Verify desktop.** Run `node regress.mjs`. Expected: all 0, including `dashboard`, `enquiries` and `recall`.
- [ ] **Step 4:** `npm run build` succeeds. **Commit** `feat(mobile): two-row compact top bar`.

### Task 4: Shared compact pieces: TapNote and the unresolved-appointments bar

**Files:**
- Create: `src/components/compact/TapNote.tsx`, `src/components/compact/TapNote.test.tsx`
- Modify: `src/components/UnresolvedAppointmentsAlert.tsx`

**Interfaces:**
- Produces: `TapNote({ text, maxChars = 30 }: { text: string; maxChars?: number })`. Shows `text` truncated with an info icon when `text.length > maxChars`. Tap toggles a full-text box under it (P#26). Empty text renders `N/A` (desktop's charting fallback; callers pass their own fallback otherwise).
- `UnresolvedAppointmentsAlert` on compact: a one-line amber bar `"{n} Past Appointment(s) Need Attention ›"` (same pluralisation, same amber classes as today's `Alert`). Tapping it opens the **existing** "Unresolved Past Appointments" dialog, made full screen (`COMPACT_FULLSCREEN_DIALOG`), with each row as a card (A#5: date + time header in amber, Patient, Service, Status badge). The desktop branch is the existing JSX, unchanged. This component is also used on Dashboard and Patient Details; the compact bar applies there too (builder's call per the spec's "amber bar" note).

- [ ] **Step 1: Failing tests** in `TapNote.test.tsx`:
  - `it('shows full short text without toggle')`
  - `it('truncates long text and reveals it on click')`: 60-char text, `fireEvent.click`, full text visible.
  - `it('renders N/A for empty text')`
- [ ] **Step 2:** Run `npx vitest run src/components/compact`. Expected: FAIL.
- [ ] **Step 3:** Implement `TapNote` and the compact branch of the alert.
- [ ] **Step 4:** Run `npx vitest run`. Expected: all pass. Run `compact-shots` (`appt-daily`, `appt-unresolved`, `dashboard`). Expected: matches A#1's bar and A#5. Run `regress.mjs`. Expected: all 0.
- [ ] **Step 5: Commit** `feat(mobile): TapNote and compact unresolved-appointments bar`.

### Task 5: Appointments compact shell + Daily view (Design B)

**Files:**
- Create: `src/components/appointments/compact/AppointmentsCompactView.tsx`, `CompactDailyView.tsx`
- Modify: `src/pages/Appointments.tsx`
  - Add `export` to the existing `TimeSlotAppointment` and `CalendarAppointmentItem` (no other change to them).
  - Add `const isCompact = useIsCompact();`.
  - Add a new handler `handleSlotTap(slot: string)` whose body **mirrors the desktop slot `onClick` (currently at lines ~2552–2583) statement for statement**: the full-slot warning, the double-booking check with the default service `isDental ? 'Dental Checkup' : 'General Consultation'`, then `handleNewAppointmentForTimeSlot(slot)`. It's a deliberate copy so the desktop JSX stays untouched; add a one-line comment saying so.
  - In the main return, wrap the page-top block (title div, `<UnresolvedAppointmentsAlert />`, and the Card with `Tabs`) as `{isCompact ? <AppointmentsCompactView {...} /> : (<>…existing JSX unchanged…</>)}`. **All dialogs below stay outside the ternary**, shared by both layouts.

**Interfaces:**
- Produces: `AppointmentsCompactViewProps` = `{ isDental, view, onViewChange(view: string), date, setDate, popoverOpen, setPopoverOpen, onPrev(), onNext(), doctors, selectedDoctor, setSelectedDoctor, searchTerm, setSearchTerm, hourlyTimeSlots: Record<string,string[]>, getAppointmentsForTimeSlot(slot), getBookedTimeSlots(), getSlotsOccupied(service), onSlotTap(slot), onEditAppointment(appt), weekDates: Date[], monthDates: Date[], getAppointmentsForDate(d: Date), getServiceDuration(service) }`.
  - `onViewChange` must do exactly what the desktop `Tabs onValueChange` does (`resetExpandedStates`, `setView`, `setSearchParams`), so extract nothing: pass a new arrow function that repeats those 3 calls.
- Shell layout (A#1, desktop wording):
  - `h1` "Appointments" (`text-2xl`) and the same subtitle.
  - The unresolved bar (Task 4).
  - Tabs "Daily / Weekly / Monthly / Pending Treatments" (Pending only for Dental; the row may scroll sideways). The `<AppointmentList />` link on its own line (Dental only).
  - Nav row: `‹`, the date Popover with the **same `Calendar` props as desktop**, `›`, "Today".
  - Filter row: the same `Combobox` (All Doctors + doctors) and the "Search Patient" input.
- `CompactDailyView` (A#1, A#20; spec §6):
  - For each `hourlyTimeSlots` hour, an hour heading, then one ~34 px row per slot: the left column shows the time; the right holds the `TimeSlotAppointment` blocks side by side (`isCompact={appointments.length > 1}`, same props as desktop).
  - An empty slot shows the slot time in grey. If `getBookedTimeSlots()[slot] >= (isDental ? 2 : 1)` and nothing is visible, it gets the orange background and the "Full" tag (same classes as desktop).
  - Row tap → `onSlotTap(slot)`; block tap → `onEditAppointment`.
  - On mount, when `date` is today, scroll the current-time slot into view.
  - `Pending Treatments` renders the existing `<DentalChartingProvider><PendingTreatmentsView/></DentalChartingProvider>` (its cards come in Task 9).

- [ ] **Step 1:** Implement the shell + `CompactDailyView` + `handleSlotTap` + the ternary.
- [ ] **Step 2: Compact check.** `compact-shots.mjs 360 780`, `404 862`, `820 1180`, `1023 900` with FAKE_DATE `2026-02-12T09:00:00` on `appt-daily` and `appt-search-rewa`. Expected:
  - no horizontal overflow (`scrollWidth === innerWidth`)
  - 2:15 PM shows 3 blocks
  - "Rewa" search shows "Full" at 2:15, 2:30 and 4:00 PM (A#20)
  - title, tabs, nav and filters all visible
- [ ] **Step 3: Manual behaviour check** at 404 px (DEV, FAKE_DATE not needed). Each of these must behave exactly as desktop does:
  - tap a past slot today → "Time Slot Unavailable" toast
  - tap an empty future slot → Create New Appointment with the time filled in
  - tap a block → Edit Appointment
  - tap a full slot → "Warning: Time Slot Conflict"
  
  Also open Create, type a patient name, rotate (resize to 900 px wide): the dialog and the text stay.
- [ ] **Step 4:** Run `regress.mjs`. Expected: all 0. Run `npm run build`. Expected: OK.
- [ ] **Step 5: Commit** `feat(mobile): compact Appointments shell and daily slot list`.

### Task 6: Appointments compact Weekly + Monthly

**Files:**
- Create: `src/components/appointments/compact/CompactWeeklyView.tsx`, `CompactMonthlyView.tsx`, `CompactMonthlyView.test.tsx`
- Modify: `AppointmentsCompactView.tsx` (render them for `view === 'weekly' | 'monthly'`)

**Interfaces:**
- Consumes: `previewList` (Task 2) and `CalendarAppointmentItem` (Task 5 export) for the line items, with the same doctor colours.
- Weekly (A#2):
  - The 7 `weekDates` stacked, each a card: day pill "Sun 8" (today → `isDental ? 'bg-dental-primary text-white' : 'bg-meditouch-primary text-white'`, card `border-primary bg-primary/5`, same as desktop).
  - The count badge, coloured like desktop: Dental `≥10` red-100/800, `≥5` yellow-100/800, else green-100/800; Meditouch `≥5` / `≥3`.
  - Then every appointment as `CalendarAppointmentItem` with `isCompact={false}` (the fuller "time | service" style).
  - Pill tap → `setDate(day)` + `onViewChange('daily')`; item tap → `onEditAppointment`.
- Monthly (A#3a/3b):
  - A 7-column grid of the month (leading blanks like desktop), each day showing its number and the count badge only; the selected day is ringed.
  - Tapping a day selects it (local state) and shows the panel under the grid: pill + badge + "Open in Daily ›" (→ setDate + daily).
  - The panel lists `previewList(items, expanded).visible`. When `hiddenCount > 0`, show a ghost button "+{hiddenCount} more"; when expanded, show "Collapse". This is desktop's own wording.
  - Item tap → `onEditAppointment`. Changing month (‹ ›) clears the selection.
- [ ] **Step 1: Failing test** `CompactMonthlyView.test.tsx`: render with 10 appointments on the 12th, click day 12, expect 3 items and a "+7 more" button; click it, expect 10 items and a "Collapse" button.
- [ ] **Step 2:** Run `npx vitest run src/components/appointments`. Expected: FAIL.
- [ ] **Step 3:** Implement both views.
- [ ] **Step 4:** Run the tests. Expected: PASS. Run `compact-shots` (`appt-weekly`, `appt-monthly` + click "12"). Expected: matches A#2 and A#3a, and no overflow at 360 px. Run `regress.mjs`. Expected: all 0.
- [ ] **Step 5: Commit** `feat(mobile): compact weekly and monthly appointment views`.

### Task 7: Full-screen compact forms (appointment create/edit, add patient, receipt)

**Files:**
- Modify: `src/pages/Appointments.tsx`: the Create (`~3036`) and Edit (`~3222`) `DialogContent` `className`. On compact use `cn(COMPACT_FULLSCREEN_DIALOG)`, wrap the form body in `COMPACT_DIALOG_BODY` and the footer buttons in `COMPACT_STICKY_FOOTER`. Desktop strings must stay byte-identical, so use `isCompact ? compactClasses : <the existing expression>`.
- Modify: `src/components/AddPatientDialog.tsx`, `src/components/PaymentReceiptDialog.tsx`: same pattern, using `useIsCompact()` inside the component.

**Interfaces:**
- Consumes: `COMPACT_FULLSCREEN_DIALOG`, `COMPACT_DIALOG_BODY`, `COMPACT_STICKY_FOOTER`.
- Footer button order on compact: primary on top, full width (A#8: "Create Appointment" then "Cancel"; A#12 Edit: row 1 `Update` + green `Confirm Appointment` / `Mark as Completed`, row 2 red `Cancel` + `Close`, each shown under the same `hasPermission` and status conditions as desktop). Receipt: "Download Receipt" then "Close".
- Short dialogs (Confirm Update, Confirm Cancellation, Confirm Appointment, Warning, Service Completed, Confirm Payment, Confirm Patient Addition): **no change** (`DialogFooter` already stacks below 640 px).
- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Run `compact-shots` with clicks (`appt-new`, `appt-edit`, plus "Add New Patient" inside Create). Expected: full screen, scrollable body, buttons pinned at the bottom (A#8, #9, #12, #17).
- [ ] **Step 3: Manual check at 404 px.** Book an appointment end to end (DEV), confirm it, mark it completed, tap Unpaid → Mark as Paid, and the receipt opens → Download Receipt saves the PDF. Then cancel the test appointment. Expected: the same toasts and steps as desktop.
- [ ] **Step 4:** Run `regress.mjs`. Expected: all 0 (`appt-new`, `appt-edit`, `pat-add` included).
- [ ] **Step 5: Commit** `feat(mobile): full-screen compact forms with pinned buttons`.

### Task 8: Compact Appointment List popup

**Files:** Modify `src/components/AppointmentList.tsx`.

**Interfaces:**
- On compact, `DialogContent` uses `COMPACT_FULLSCREEN_DIALOG`. The filters stack (A#6): "Filter by Date:" label, the Select at full width, then a row with the doctor `Combobox` and "Export", then the phone-list checkbox.
- The table becomes one card per row: a blue header (`bg-blue-50 text-blue-800 border-blue-200`) with date (`MMM d, yyyy`) and time, then Patient (bold), Doctor (`app.doctor || '-'`), Service, and Phone (the same `tel:` link, or grey "No phone").
- Custom Range popover on compact: the two `CalendarComponent`s **stacked** (Start Date, then End Date), then "Apply Range" (A#27). The calendar props are unchanged.
- The empty state, Close button, filtering, sorting, CSV export and link count are all unchanged.
- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Run `compact-shots` (`appt-applist`, `appt-applist-range`). Expected: matches A#6 / A#27, nothing cut off at 360 px.
- [ ] **Step 3:** Run `regress.mjs`. Expected: all 0.
- [ ] **Step 4: Commit** `feat(mobile): compact appointment list popup`.

### Task 9: Compact Pending Treatments

**Files:** Modify `src/components/PendingTreatmentsView.tsx`.

**Interfaces:**
- On compact, the Table becomes cards (A#4): Patient (`<PatientName/>`, bold), Teeth, Service, Notes (`TapNote`, fallback "-"). Then the buttons: "Schedule" (`Clock`, same classes) + "Snooze" (`AlarmClock`) on the Pending tab, "Activate" on the Snoozed tab, calling the same handlers.
- Above the cards, the existing sort button "Patient ⇅" (same `toggleSort`). The header (title, description, Pending/Snoozed toggle, search) is unchanged, but the toggle wraps under the title on compact. The Snooze dialog is unchanged.
- [ ] **Step 1:** Implement. **Step 2:** Run `compact-shots` (`appt-pending`). Expected: A#4. **Step 3:** Run `regress.mjs`. Expected: all 0. **Step 4: Commit** `feat(mobile): compact pending treatments cards`.

### Task 10: Patients list compact (cards, actions, sort, pagination, add/edit)

**Files:**
- Create: `src/components/patients/compact/PatientCardList.tsx`, `PatientSortSelect.tsx`, `CompactPagination.tsx`, `PatientSortSelect.test.tsx`
- Modify: `src/pages/Patients.tsx`: inside `CardContent`, `isCompact ? <PatientCardList …/> : <existing Table>`. Pagination block: `isCompact ? <CompactPagination table={table}/> : <existing>`. Add/Edit `DialogContent`: Task 7's pattern.

**Interfaces:**
- `PatientCardList({ rows: Row<Patient>[], activeClinic, lastVisitDates: Record<string,string>, onView(p), onEdit(p), onDelete(p), canEdit: boolean, canDelete: boolean })`. The card follows P#1:
  - name (bold) and the clinic badge (reuse the page's `getClinicBadge`)
  - "Gender · Age · City · Blood Group" (with the same "Not provided" fallbacks)
  - `Phone` icon + `+91 {phone}` / "Not provided"
  - `CalendarRange` icon + last visit / "No visits"
  - "Added {date}"
  - the ▾ `DropdownMenu`, identical to desktop: "Actions" label, View Details (`Eye`), Edit Patient (`Edit`, if canEdit), separator + red Delete Patient (`Trash`, if canDelete)
  
  Tapping the card body (not the ▾) calls `onView`. The empty state is "No patients found".
- `PatientSortSelect({ sorting: SortingState, onChange(s: SortingState) })`: options `Name (A–Z)`, `Name (Z–A)`, `Age (low–high)`, `Age (high–low)`, `Last Visit (oldest first)`, `Last Visit (newest first)` → `[{ id: 'name'|'age'|'lastVisit', desc }]`. When `sorting` is the page default `[{ id: "created_at", desc: true }]` (Patients.tsx line 143), show "Default order"; picking it restores exactly that value.
- `CompactPagination({ table })` follows P#3:
  - line 1: "Rows per page" + the same `<select>` (10/20/25/50/100) on the left, "x-y of N" on the right
  - line 2: Previous / up to 5 page numbers (the same windowing logic as desktop) / Next
  - line 3: "Page n of m"
- [ ] **Step 1: Failing test** `PatientSortSelect.test.tsx`: choosing "Age (high–low)" calls `onChange([{ id: 'age', desc: true }])`, and "Default order" calls `onChange([{ id: "created_at", desc: true }])`.
- [ ] **Step 2:** Run `npx vitest run src/components/patients`. Expected: FAIL. **Step 3:** Implement.
- [ ] **Step 4:** Run the tests. Expected: PASS. Run `compact-shots` (`pat-list`, `pat-actions`, `pat-add`, `pat-edit`, search "xyz"). Expected: P#1–#9 and no overflow at 360 px. Manual: delete a throwaway test patient created for the purpose on DEV. Expected: the same "Are you sure?" box and the "Patient Deleted" toast.
- [ ] **Step 5:** Run `regress.mjs`. Expected: all 0. **Commit** `feat(mobile): compact patient list with cards, sort and pagination`.

### Task 11: Patient Details compact (tab drop-down, info grid, history rows)

**Files:**
- Create: `src/lib/patient-tabs.ts`, `src/lib/patient-tabs.test.ts`
- Modify: `src/pages/PatientDetails.tsx`

**Interfaces:**
- Produces: `getVisiblePatientTabs(clinic: 'dental'|'meditouch'|'both', hasPermission: (p: string) => boolean): { value: string; label: string }[]`, in desktop order with desktop labels:
  - `overview` "Patient Info" (`patients.view_patient_info`)
  - `appointments` "Appointments" (`patients.view_appointments`)
  - `dental-charting` "Dental Charting" (clinic dental/both + `patients.view_dental_chart`)
  - `appointment-history` "Dental History" if clinic === 'dental', else "Appointment History" (`patients.view_treatment_history`)
  - `prescriptions` "Prescriptions" (`patients.view_prescriptions`)
  - `vital-signs` "Vital Signs" (`patients.view_vital_signs`)
- On compact:
  - The `TabsList` is replaced by a shadcn `Select` (value `activeTab`, `onValueChange={handleTabChange}`) listing `getVisiblePatientTabs(...)`, showing only the tab name (P#10/10b).
  - The Personal Information grid uses `grid-cols-2`.
  - The header's "Edit Patient" button goes full width (same behaviour: navigate to `/patients`).
  - `PatientAppointmentHistoryWrapper`'s table becomes rows: Service (bold), "date · doctor", and the same Paid/Unpaid `Badge` (same classes and click → the same confirm dialog) (P#16).
  
  The Appointments tab (`PatientUpcomingAppointments`) needs no change.
- [ ] **Step 1: Failing tests** `patient-tabs.test.ts`:
  - all permissions + `'both'` → 6 tabs, history label "Appointment History"
  - `'dental'` → history label "Dental History"
  - `'meditouch'` → no `dental-charting`
  - a missing `patients.view_prescriptions` → no `prescriptions`
- [ ] **Step 2:** Run `npx vitest run src/lib/patient-tabs.test.ts`. Expected: FAIL. **Step 3:** Implement and wire it in.
- [ ] **Step 4:** Run the tests. Expected: PASS. Run `compact-shots` (patient overview, appointments and appointment-history at 360/404/820). Expected: P#10, #10b (open the select), #11, #16, #17. Run `regress.mjs`. Expected: all 0.
- [ ] **Step 5: Commit** `feat(mobile): patient details tab drop-down and compact history`.

### Task 12: Dental Charting compact

**Files:** Modify `src/components/VisualToothChart.tsx`, `src/components/DentalChartingComponent.tsx`.

**Interfaces:**
- `VisualToothChart` on compact (P#12): the same buttons and switch. Each quadrant becomes its own block in the order Q1 (Upper Right), Q2 (Upper Left), Q4 (Lower Right), Q3 (Lower Left); with primary teeth, Q5, Q6, Q8, Q7. Each block has the same `QUADRANT n (…)` label, then an 8-column (primary: 5-column) grid of the same tooth buttons with the same selected/unselected classes and the same `onToothSelect`. Then the same FDI caption.
- `DentalChartingComponent` on compact:
  - Checkbox Grid uses `grid-cols-4` (P#13).
  - The "Add Charting Entry" button is full width (already `w-full md:w-auto`; nothing to change below 768, but force `w-full` for 768–1023 on compact).
  - The history Table becomes cards (P#15), one per entry:
    - header with `date_recorded` (`toLocaleDateString()`) and the status Badge (same variants)
    - Teeth (`ToothIndicator`) + numbers
    - Surface(s) (`SurfaceIndicator` + letters, or 'N/A')
    - Finding (amber-600) or Service (blue-600)
    - Notes (`TapNote`)
    - the same "Mark Completed" `Switch` + label for Planned entries, calling `handleStatusToggle(entry)`
- [ ] **Step 1:** Implement. **Step 2:** Run `compact-shots` (dental-charting tab; also click "Checkbox Grid" and "Show Child Teeth (Primary)"). Expected: P#12–#15, no overflow at 360 px. Manual: select 17, 18 → the buttons turn blue; add an Existing entry on a DEV test patient → the toast and the new card appear.
- [ ] **Step 3:** Run `regress.mjs`. Expected: all 0. **Step 4: Commit** `feat(mobile): compact dental charting (quadrant rows, cards)`.

### Task 13: Prescriptions compact

**Files:** Modify `src/components/PrescriptionComponent.tsx`.

**Interfaces:** On compact:
- **List (P#18):** the Table becomes cards:
  - header with the date (`dd/MM/yyyy`) and `getStatusBadge(status)`
  - fields with small grey labels above the values: "Diagnosis", "Medications" (names joined `, ` or "No medications"), "Prescribed By"
  - a 2-column footer: outline "Edit" (`Edit` icon, only with `patients.edit_prescriptions`) and the blue "Print" (`Printer` icon, `bg-blue-100 text-blue-600`, calling the same `handleDirectPrint(prescription)`)
  
  The filter `Tabs` are unchanged.
- **Form (P#19/#20):**
  - The added-medications Table becomes small cards: "name · dosage" header + trash button (same `handleRemoveMedication`), body "timing · food · duration · dispense qty".
  - In Add Medication, Duration takes its own full-width row (the number Input `flex-1` + the unit Select `w-[96px]`), and Dispense Qty its own row. The auto-calculation code is unchanged.
  - The form's Cancel/Save row becomes `sticky bottom-0` with `bg-background border-t`, as two equal buttons, while the form is open.
- The print-preview Dialog stays as it is (unused).
- [ ] **Step 1:** Implement. **Step 2:** Run `compact-shots` (the prescriptions tab, then click "New Prescription"). Expected: P#18–#20 at 360/404 px.
- [ ] **Step 3: Manual check.** Create a prescription with 2 medicines on a DEV test patient; Dispense Qty auto-fills; Save; Edit; Print opens the device print screen with the unchanged layout.
- [ ] **Step 4:** Run `regress.mjs`. Expected: all 0. **Step 5: Commit** `feat(mobile): compact prescriptions list and form`.

### Task 14: Vital Signs compact

**Files:** Modify `src/components/VitalSignsComponent.tsx`.

**Interfaces:** On compact:
- The Table becomes cards (P#22):
  - header with the date (`dd/MM/yyyy HH:mm`, the same 'Invalid date' fallback) and the Edit / red Delete icon buttons (same permissions, `disabled` and handlers)
  - a 2-column grid: Weight `{w} kg`, BP `{bp}`, Pulse `{p} bpm`, Temp `{t} °C`, Resp `{r} /min`
  - Notes via `TapNote`
- The form grid uses `grid-cols-2` for Weight/Pulse and Temperature/Respiratory Rate, with Blood Pressure and Notes at full width (P#23). Labels keep their full desktop text.
- The Confirm Save / Update / Deletion dialogs are unchanged.
- [ ] **Step 1:** Implement. **Step 2:** Run `compact-shots` (the vital-signs tab, "Record Vital Signs"). Expected: P#22–#25. Manual: record, edit, then delete a reading on a DEV test patient. Expected: the same confirms and toasts.
- [ ] **Step 3:** Run `regress.mjs`. Expected: all 0. **Step 4: Commit** `feat(mobile): compact vital signs`.

### Task 15: Final verification and handover

**Files:** none (verification only), unless fixes are needed.

- [ ] **Step 1:** Run `npx vitest run`. Expected: all pass. Run `npm run build`. Expected: success. Run `npx eslint` on every file touched by this branch (`git diff --name-only integration...HEAD -- src`). Expected: no new errors versus integration.
- [ ] **Step 2:** Run `node regress.mjs`. Expected: every scenario 0 at 1440 and 1024.
- [ ] **Step 3:** Run `compact-shots.mjs` at `360 780`, `404 862`, `820 1180`, `1023 900`, once with Dental Metrix and once with Meditouch selected (A#29: teal colours, no Pending tab, no Appointment List link, 1 per slot; P#28: no Dental Charting entry in the tab drop-down). Check each screen against the mockups (A#1–31, P#1–29). In every shot, `document.documentElement.scrollWidth === innerWidth`.
- [ ] **Step 4: Phone checklist for the user** (LAN URL `http://192.168.1.4:8080`, Android Chrome first, then iPhone if available). Check: book → confirm → complete → paid → receipt download; reschedule; cancel; Appointment List call link; patient open/edit; charting entry; prescription print; vitals. **If Print or Download fails on a phone, stop and report it. Don't change the print method without the user's approval.**
- [ ] **Step 5:** Stop the baseline server and remove the worktree (`git worktree remove D:/mudra-baseline-integration`). Summarise for the user. Don't merge or push without being asked.
