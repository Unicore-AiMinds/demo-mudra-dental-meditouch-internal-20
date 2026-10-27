# Recall List Mobile View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Recall List fully usable below 1024 px (cards, full-width tabs, Sort by) while leaving ≥1024 px pixel- and behaviour-identical.

**Architecture:** `RecallList.tsx` reads `useIsCompact()` and, only when true, renders the tab buttons below the card title, a `RecallSortSelect` and a `RecallCardList` instead of the table. The new components get the page's existing state and handlers as props; the desktop JSX stays in the `false` branch of each ternary, unedited.

**Tech Stack:** React 18 + TypeScript, Tailwind, shadcn/ui, lucide-react, date-fns, Vitest + Testing Library, Playwright (Edge) scripts in `D:\claude-scratch\pw`.

**Spec:** `docs/superpowers/specs/2026-10-26-mobile-view-recall-list-design.md` (mockups: `2026-10-26-mobile-view-recall-list-mockups.html`)

## Global Constraints

- Switch point: phone layout when `window.innerWidth < 1024` (`useIsCompact`). ≥1024 px: no visible or behavioural change.
- Words are desktop's exactly; labels are never shortened (reduce padding instead).
- Same colours: selected tab = `Button variant="default"`; Schedule text `text-dental-primary` (dental) / `text-meditouch-primary` (meditouch); Overdue badge `bg-red-50 text-red-700 border-red-200`; Step badge `bg-blue-50 text-blue-700 border-blue-200`, Waiting step badge `bg-gray-100 text-gray-700 border-gray-200`; delete `text-red-600`.
- 🗑 only when `hasPermission('recall_list.delete')`.
- No change to `FollowUpContext`, queries, or any handler's behaviour. DEV database only; live checks never confirm Snooze/Delete/Activate.
- No commits unless the user asks (they asked for logical-group commits before; ask again at the end).

## Review Focus

1. Tab change while a phone card's note is expanded: expansion state must not leak to a different follow-up (cards keyed by the same `stableKey` as desktop rows).
2. Recall with `total_steps_in_sequence > 1` but no `sequence_group_id`: no Step badge (desktop requires both), pinned in Task 2 test.
3. `snoozed_until` present on a Pending-tab card: the "Snoozed until" line shows only on the Snoozed tab, pinned in Task 2 test.
4. Today's date on Pending: Overdue badge uses `isBefore(parseISO(date), new Date())`, the same expression as desktop, pinned in Task 2 test with a past date and a future date.
5. Width 768–1023 px (tablet): cards + full-width tabs show, search/filter stay side by side; pinned by the live check at 820 and 1023 in Task 3.

---

### Task 1: RecallSortSelect

**Files:**
- Create: `src/components/recall/compact/RecallSortSelect.tsx`
- Test: `src/components/recall/compact/RecallSortSelect.test.tsx`

**Interfaces:**
- Produces: `export type RecallSortBy = 'date' | 'patient'`, `export type RecallSortOrder = 'asc' | 'desc'`, default export `RecallSortSelect({ sortBy, sortOrder, onChange }: { sortBy: RecallSortBy; sortOrder: RecallSortOrder; onChange: (sortBy: RecallSortBy, sortOrder: RecallSortOrder) => void })`.

- [ ] **Step 1: Write the failing tests** (same style as `PatientSortSelect.test.tsx`)

```tsx
it("lists desktop's 4 sort choices in order", () => {
  render(<RecallSortSelect sortBy="date" sortOrder="asc" onChange={() => {}} />);
  expect(screen.getAllByRole("option").map(o => o.textContent)).toEqual([
    "Tentative Date (Earliest First)", "Tentative Date (Latest First)", "Patient (A-Z)", "Patient (Z-A)",
  ]);
});
it("shows the current sort", () => {
  render(<RecallSortSelect sortBy="patient" sortOrder="desc" onChange={() => {}} />);
  expect((screen.getByLabelText("Sort by") as HTMLSelectElement).value).toBe("patient-desc");
});
it("sets patient Z-A", () => {
  const onChange = vi.fn();
  render(<RecallSortSelect sortBy="date" sortOrder="asc" onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "patient-desc" } });
  expect(onChange).toHaveBeenCalledWith("patient", "desc");
});
it("sets date latest first", () => { /* value "date-desc" → onChange("date","desc") */ });
```

- [ ] **Step 2: Run** `npx vitest run src/components/recall` → FAIL (module not found).
- [ ] **Step 3: Implement** as a native `<select id="recall-sort">` with `<label htmlFor="recall-sort">Sort by</label>`, option values `date-asc | date-desc | patient-asc | patient-desc`, same classes as `PatientSortSelect`.
- [ ] **Step 4: Run** `npx vitest run src/components/recall` → PASS.

### Task 2: RecallCardList

**Files:**
- Create: `src/components/recall/compact/RecallCardList.tsx`
- Test: `src/components/recall/compact/RecallCardList.test.tsx`

**Interfaces:**
- Consumes: `FollowUp` from `@/contexts/FollowUpContext`, `ClinicType` from `@/contexts/ClinicContext`, `TapNote` from `@/components/compact/TapNote`.
- Produces: default export `RecallCardList(props: RecallCardListProps)` with

```ts
export interface RecallCardListProps {
  followUps: FollowUp[];               // already filtered + sorted by the page
  activeTab: 'pending' | 'snoozed' | 'waiting';
  activeClinic: ClinicType;
  canDelete: boolean;
  onViewDetails: (f: FollowUp) => void;
  onSchedule: (f: FollowUp) => void;
  onSnooze: (f: FollowUp) => void;
  onActivateEarly: (f: FollowUp) => void; // Waiting tab
  onActivate: (f: FollowUp) => void;      // Snoozed tab
  onDelete: (f: FollowUp) => void;
}
```

Card content (spec §5): name (+ Step badge when `sequence_group_id && total_steps_in_sequence > 1`, text `Step {n}/{total}` + ` (Waiting)` when status is Waiting); rows with labels `Tentative Date`, `Suggested Service`, `Original Service`, `Original Doctor`, `Notes`; date `format(parseISO(d), 'MMM d, yyyy')`, red + `Overdue` badge when `activeTab === 'pending' && isBefore(parseISO(d), new Date())`; `Snoozed until {MMM d, yyyy}` line when `activeTab === 'snoozed' && snoozed_until`; notes via `<TapNote text={special_notes ?? ''} fallback="-" />`. Buttons per tab exactly as spec §5 with the desktop icons (`Info`, `Clock`, `AlarmClock`, `Trash2`); icon-only buttons get `aria-label` ("Details", "Delete") so they are findable; text buttons `flex-1`. Key each card with desktop's `${id}-${patient_id}-${tentative_date}`.

- [ ] **Step 1: Write the failing tests** (fixture: a pending FollowUp dated `2025-09-11`, a future one `2099-01-01`, a sequence one with `sequence_group_id:'g', follow_up_sequence:1, total_steps_in_sequence:3`)
  - `pending tab shows Details, Schedule, Snooze and Delete, and each calls its handler with the follow-up`
  - `hides Delete without permission` (`canDelete={false}` → no `Delete` button)
  - `waiting tab shows Activate Early (not Schedule/Snooze)` and clicking it calls `onActivateEarly`
  - `snoozed tab shows Activate and the "Snoozed until Apr 25, 2026" line` (`snoozed_until:'2026-04-25'`)
  - `pending card with snoozed_until does not show the snoozed line`
  - `Overdue only on pending for past dates`: past date on pending → "Overdue"; `2099-01-01` → none; past date on snoozed tab → none
  - `Step badge only with a sequence group`: `Step 1/3` shown; same totals without `sequence_group_id` → absent; waiting status → `Step 2/3 (Waiting)`
  - `uses desktop column names as labels`: all 5 labels present
  - `Schedule uses the clinic colour`: dental → class `text-dental-primary`; meditouch → `text-meditouch-primary`
  - `no note shows "-"`
- [ ] **Step 2: Run** `npx vitest run src/components/recall` → FAIL.
- [ ] **Step 3: Implement** `RecallCardList.tsx`.
- [ ] **Step 4: Run** `npx vitest run src/components/recall` → PASS.

### Task 3: Wire the phone layout into RecallList

**Files:**
- Modify: `src/pages/RecallList.tsx` (imports; CardHeader ~1056–1109; after the filter row ~1156; list ~1158–1360; new handler near `handleUnsnoozeFollowUp` ~883)

**Interfaces:**
- Consumes: Task 1 `RecallSortSelect`, Task 2 `RecallCardList`, `useIsCompact` from `@/hooks/use-compact`.

- [ ] **Step 1: Add** `const isCompact = useIsCompact();` and `handleActivateEarly(followUp: FollowUp)` whose body is a verbatim copy of the Waiting button's inline `onClick` (activate → toast "Follow-up Activated" / "Step {n} for {name} has been activated and moved to the pending list." → `fetchFollowUps()`). Do not edit the desktop inline code.
- [ ] **Step 2: CardHeader:** `isCompact ?` title/description block, then the 3 existing tab `Button`s in a `grid grid-cols-3 border rounded-md overflow-hidden` container with `px-2` so "Pending (34)" fits at 360 px, same `variant`/`onClick` logic (the Waiting button keeps its async fetch before `setActiveTab('waiting')`) `:` existing JSX untouched.
- [ ] **Step 3: Sort + list:** when `isCompact && filteredAndSortedFollowUps.length > 0`, render `<RecallSortSelect sortBy={sortBy} sortOrder={sortOrder} onChange={(b, o) => { setSortBy(b); setSortOrder(o); }} />` then `<RecallCardList … canDelete={hasPermission('recall_list.delete')} onViewDetails={handleViewDetails} onSchedule={handleScheduleAppointment} onSnooze={handleOpenSnoozeDialog} onActivateEarly={handleActivateEarly} onActivate={handleUnsnoozeFollowUp} onDelete={handleDeleteFollowUp} />`; otherwise the existing table. Empty state unchanged.
- [ ] **Step 4: Run** `npm run build` → succeeds; `npx vitest run` → all pass (22 existing + new).
- [ ] **Step 5: Live phone checks** (new `D:\claude-scratch\pw\check-recall.mjs`, widths 360/384/412/820/1023): `scrollWidth === innerWidth`; all 3 tab buttons fully inside the viewport; on the first card Details/Schedule/Snooze/Delete visible and inside the viewport; Details, Snooze (incl. calendar) and Delete popups open and are closed with Close/Cancel/Escape; Sort by "Patient (A-Z)" → first card name ≤ second (localeCompare); filter Overdue/Upcoming counts 32/2; search "zzzz" → "No pending follow-ups"; Waiting/Snoozed tabs; Meditouch switch shows "Pending (4)". Waiting cards with fake data via `page.route('**/rest/v1/follow_ups*status=eq.Waiting*', …)` returning one Waiting row (no DB writes). Screenshots to `D:\claude-scratch\pw\recall\after-*`. Then confirm DEV `follow_ups` still has `{ Snoozed: 1, Pending: 34 }`.
- [ ] **Step 6: Commit** only if the user asks.

### Task 4: Desktop proof and final checks

- [ ] **Step 1:** Baseline server (worktree `D:\mudra-baseline-recall` at `0b8a8bc`, port 8081) running; feature on 8080.
- [ ] **Step 2: Run** `node regress.mjs` in `D:\claude-scratch\pw` → `ALL IDENTICAL` (all desktop scenarios incl. the 8 recall ones, at 1440 and 1024).
- [ ] **Step 3: Run** `npx eslint src/pages/RecallList.tsx src/components/recall` → no new errors versus baseline (`npx eslint` on the baseline copy of `RecallList.tsx`).
- [ ] **Step 4:** Stop the 8081 server. First remove only the junction link with `cmd /c rmdir "D:\mudra-baseline-recall\node_modules"` (no `/s`, so the real `node_modules` is untouched; check it still exists afterwards), then `git worktree remove --force D:/mudra-baseline-recall`.
- [ ] **Step 5:** Report to the user with screenshots summary; ask about commit/push.
