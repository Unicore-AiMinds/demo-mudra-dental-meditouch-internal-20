# Enquiries Mobile View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Enquiries page fully usable below 1024 px (cards, Sort by, centred Export, centred pages) with ≥1024 px pixel- and behaviour-identical.

**Architecture:** `Enquiries.tsx` reads `useIsCompact()`; phone-only class names via ternaries and, only when compact, `EnquirySortSelect` + `EnquiryCardList` replace the `<Table>`. The `Enquiry` type and status constants move unchanged to a shared module.

**Tech Stack:** React 18 + TS, Tailwind, shadcn/ui, lucide-react, Vitest + Testing Library, Playwright (Edge) scripts in `D:\claude-scratch\pw`.

**Spec:** `docs/superpowers/specs/2026-10-26-mobile-view-enquiries-design.md`

## Global Constraints

- Phone layout when `window.innerWidth < 1024` (`useIsCompact`); ≥1024 px unchanged.
- Desktop words exactly; status colours `STATUS_STYLES` unchanged.
- Permissions: `enquiries.change_status` (drop-down vs badge), `patients.create` (Convert), `enquiries.delete` (🗑), `enquiries.export` (Export).
- No DB writes in checks (status/delete faked via route interception). No commits unless asked.

## Review Focus

1. Saving a status on one card disables only that card's drop-down (`updatingId === e.id`) — pinned in Task 2 test.
2. Enquiry with empty email / message / phone: "-" for email & message, no `tel:` link for empty phone — pinned in Task 2 tests.
3. Neither convert nor delete permission → no button row — pinned in Task 2 test.
4. Pagination at 360 px: centred two lines, no overflow — live check Task 3.
5. Export disabled at 0 records on phone too — live check Task 3 (search "zzzz").

---

### Task 1: Shared enquiry module + EnquirySortSelect

**Files:**
- Create: `src/components/enquiries/enquiry.ts` (move `Enquiry`, `STATUS_OPTIONS`, `STATUS_STYLES`, `STATUS_LABEL` from `src/pages/Enquiries.tsx:56-92`, values byte-identical, exported)
- Modify: `src/pages/Enquiries.tsx` (delete the moved block, import from the module)
- Create: `src/components/enquiries/compact/EnquirySortSelect.tsx` + `.test.tsx`

**Interfaces:**
- Produces: `export type EnquirySortField = 'submitted_at' | 'name' | 'service_inquiry' | 'status'`; default export `EnquirySortSelect({ sortField, sortDirection, onChange }: { sortField: EnquirySortField; sortDirection: 'asc' | 'desc'; onChange: (f: EnquirySortField, d: 'asc' | 'desc') => void })`.

- [ ] Tests (RED first): lists the 8 labels of spec §4 in order; shows current (`name`,`desc` → value `name-desc`); choosing `status-asc` calls `onChange('status','asc')`; choosing `submitted_at-asc` calls `onChange('submitted_at','asc')`.
- [ ] Implement like `RecallSortSelect` (native select, id `enquiry-sort`, label "Sort by").
- [ ] `npx vitest run src/components/enquiries` → PASS; `npm run build` passes after the move.

### Task 2: EnquiryCardList

**Files:** Create `src/components/enquiries/compact/EnquiryCardList.tsx` + `.test.tsx`

**Interfaces:**
```ts
export interface EnquiryCardListProps {
  enquiries: Enquiry[];            // the current page (pageRows)
  canChangeStatus: boolean;
  canConvert: boolean;
  canDelete: boolean;
  updatingId: number | null;
  onStatusChange: (e: Enquiry, next: Enquiry['status']) => void;
  onConvert: (e: Enquiry) => void;
  onDelete: (e: Enquiry) => void;
}
```
Card per spec §3: name title; rows Date (`formatDateForDisplay(submitted_at)`), Phone (`<a href={'tel:' + phone.replace(/\s/g,'')}>` when phone, else empty), Email (`email || '-'`, wraps), Service, Message (`TapNote` text `message ?? ''`, maxChars 40, fallback "-"), Status (shadcn Select of `STATUS_OPTIONS` with `STATUS_LABEL`, `disabled={updatingId === e.id}`, or `Badge className={STATUS_STYLES[status]}`). Buttons: Convert (outline, `UserPlus`, `flex-1`, title "Create a patient from this enquiry") when `canConvert`; 🗑 (outline, red icon, `aria-label="Delete enquiry"`) when `canDelete`; no row when neither. Key `e.id`.

- [ ] Tests (RED first): shows the 6 labels and values; phone is a `tel:+919812345678` link; empty phone → no link; empty email/message → "-"; badge (not combobox) without change permission, with the status class; Convert/Delete call handlers with the enquiry; no buttons without both permissions; combobox disabled when `updatingId` equals the id and enabled for another card.
- [ ] Implement; `npx vitest run src/components/enquiries` → PASS.

### Task 3: Wire into Enquiries.tsx + live checks

**Files:** Modify `src/pages/Enquiries.tsx` (toolbar ~377-423, list container ~426-541, pagination ~545-586).

- [ ] `const isCompact = useIsCompact();`
- [ ] Toolbar ternaries: container `grid grid-cols-2 gap-2` (phone) vs existing; Input `h-9 w-full col-span-2`; both SelectTriggers `h-9 w-full`; count/export div `col-span-2 flex flex-col items-center gap-2`; Export button adds `w-full` on phone.
- [ ] List container: phone with cards → `space-y-3` (no border); otherwise existing class. Inside, when phone and there are rows: `<EnquirySortSelect …/>` + `<EnquiryCardList enquiries={pageRows} … onStatusChange={handleStatusChange} onConvert={setEnquiryToConvert} onDelete={setEnquiryToDelete} />`; otherwise existing `<Table>`.
- [ ] Pagination ternaries: container `flex flex-col items-center gap-2 pt-2 border-t` on phone; in the second group use `order-1/2/3` classes on phone so it reads ‹ Page x of y ›.
- [ ] `npm run build`, `npx vitest run` → pass.
- [ ] Live `check-enquiries.mjs` at 360/384/412/820/1023: no sideways scroll; card controls in viewport; Export centred (|centre − card centre| ≤ 2 px) and full width; filters; Sort by Name (A-Z); search "zzzz" → message, Export disabled; Convert opens pre-filled form, Cancel; status change and delete with PATCH/DELETE fulfilled by route (no DB write) → "Status updated" / "Enquiry deleted" toasts; faked 32-row list → pages "Page 1 of 3", ‹ disabled. Afterwards DEV `contact_submissions` unchanged.

### Task 4: Desktop proof and final checks

- [ ] `node regress.mjs` (baseline worktree `D:\mudra-baseline-enq` @ b6056e7 on 8081) → ALL IDENTICAL (includes 9 Enquiries scenarios).
- [ ] lint + tsc error counts for changed files unchanged vs baseline.
- [ ] Final fresh review; fix Critical/Important with tests.
- [ ] Cleanup: stop 8081, `cmd /c rmdir` the junction only, `git worktree remove --force`.
