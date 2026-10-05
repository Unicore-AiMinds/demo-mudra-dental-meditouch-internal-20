# Production Release Checklist — ERP (`integration` → `Demo`)

**Purpose:** Steps to safely release the accumulated features from the
`integration` branch to **production** (`Demo`, the Netlify-live ERP).
**Last updated:** 2026-10-05

> This is the big batched release. Do the database migrations on the LIVE
> project **before/at** the merge, then switch Netlify to live and deploy.

---

## 0. Current state (as of 2026-10-05)
- `integration` contains **all features**: book-to-confirm, payment-receipt,
  prescription-table, dashboard-count-fix, reports-drilldown,
  searchable-dropdowns, and **enquiries** (website lead inbox + convert-to-patient).
- `Demo` (production) is **far behind** (~32 commits, last updated 24 Feb 2026) —
  it has none of these features yet.
- **Databases:**
  - DEV  = `pwijqupjtminhcmtbxta` (local development)
  - LIVE = `cqtloiklvpvafeoiyyhy` (production — what the deployed ERP reads)

---

## 1. Database migrations on the LIVE project (`cqtloiklvpvafeoiyyhy`)
Run these in the Supabase SQL Editor **for the LIVE project**.

### 1a. `contact_submissions` table — ✅ DONE
Created on both DEV and LIVE (website leads table). See
`DATABASE-CONNECTION-NOTES.md` in the website repo for the full SQL.

### 1b. Enquiries permissions — ✅ DONE (DEV + LIVE)
The `enquiries` permissions (`view`, `change_status`, `export`, `delete`) were
seeded into both projects and granted to the **Super Administrator** and
**Admin** roles. After deploy, grant to any other roles as needed via
**Settings → Roles & Permissions**.

### 1c. `booked` appointment status — ⚠️ STILL NEEDS RUNNING ON LIVE
Required by the Book-to-Confirm feature. Already run on DEV; **must be run on
LIVE before/at deploy** or creating a "booked" appointment will fail the DB
CHECK constraint.

```sql
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('booked', 'confirmed', 'arrived', 'completed', 'cancelled'));
```
(Source: `src/docs/migrations/2026-09-23-add-booked-status.sql`.)

> If any other feature adds a new permission or DB constraint later, add it to
> this section before release.

---

## 2. Switch the ERP's Netlify site to the LIVE database
On the **ERP** Netlify site → **Environment variables**, confirm these point at
the LIVE project (`cqtloiklvpvafeoiyyhy`):
- `VITE_SUPABASE_URL`  = `https://cqtloiklvpvafeoiyyhy.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (LIVE anon key)

> The ERP reads Supabase directly with the anon key via `src/lib/supabase-config.ts`
> (env-driven). It does NOT use a service-role key. If any service-role usage is
> added later, set it here too.

---

## 3. Merge and deploy
1. Merge `integration` → `Demo` (resolve conflicts keeping all feature changes).
2. Push `Demo`.
3. Netlify auto-deploys `Demo` (or trigger **Deploy → Deploy without cache**).
4. Wait for a green "Published".

---

## 4. Post-deploy verification (on the live site)
- Log in; confirm the sidebar shows all modules incl. **Enquiries**.
- **Enquiries:** real website leads appear; status change / filter / sort /
  export / convert-to-patient all work; clinic toggle filters dental vs meditouch.
- **Appointments:** create a Booked appointment → Confirm → Mark Completed
  (verifies the `booked` migration took).
- **Payment receipt**, **prescription print**, **reports drill-down**,
  **searchable dropdowns**, **dashboard counts** all behave as on dev.
- Spot-check that existing data (patients, appointments) is intact.

---

## 5. Rollback
- Netlify: **Deploys → select the previous working deploy → Publish deploy**
  (instant revert of the frontend).
- The DB migrations above are **additive/widening** (new table, widened CHECK
  constraint, new permissions) and do not need rollback; they don't affect the
  old frontend.

---

## Notes
- Granting the Enquiries permission uses the Settings role editor; the built-in
  "Initialize System" button is currently commented out in `RolesTab.tsx`, so new
  permissions are seeded directly (see how it was done for enquiries) or by
  re-enabling that button.
- Keep DEV (`pwijqupjtminhcmtbxta`) as the local-development database; never point
  local `.env` at LIVE except for a brief, read-only preview.
