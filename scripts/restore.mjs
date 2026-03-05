/**
 * Mudra Clinic — Restore Backup Script
 *
 * Restores Supabase tables from a dated backup zip file.
 * Performs a CLEAN restore: deletes all existing rows first, then inserts backup data.
 * Handles table order to respect foreign key constraints.
 *
 * Usage:  node restore.mjs 2026-02-25
 *         node restore.mjs              (restores the latest backup)
 */

import { readFileSync, readdirSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';

// ── Config ──────────────────────────────────────────────────────────────────
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(SCRIPTS_DIR, '..');

// Load .env file
const envPath = join(APP_DIR, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const BATCH_SIZE = 500;
const BACKUP_ROOT = join(APP_DIR, 'backup');

// ── Restore order (parent tables first, respects foreign keys) ──────────
// Circular FK between appointments ↔ follow_ups is handled specially:
//   Pass 1: Insert appointments with follow_up FKs nulled out
//   Pass 2: Insert follow_ups (they can now reference appointments)
//   Pass 3: Update appointments to restore follow_up FK values
const RESTORE_ORDER = [
  // Tier 1: No incoming FKs (standalone / root tables)
  'clinics',
  'roles',
  'permissions',
  'units',
  'dealers',
  'dental_labs',
  'lab_work_types',
  'services',
  'services_with_follow_up',
  'stock_item_definitions',
  'medicines',
  'medications',

  // Tier 2: Depend on Tier 1
  'clinic_operating_hours',   // → clinics
  'users',                    // → roles
  'role_permissions',         // → roles, permissions
  'patients',                 // standalone (no FK to other tables)
  'stock_items',              // → dealers, stock_item_definitions
  'service_follow_up_rules',  // → services

  // Tier 3: Depend on Tier 2
  'doctors',                  // standalone
  'follow_up_steps',          // → service_follow_up_rules, services
  'stock_batches',            // → stock_items
  'vital_signs',              // → patients, doctors

  // Tier 4: Depend on Tier 3 (circular handled specially)
  'appointments',             // → patients, doctors (follow_up FK handled in pass 2)
  'dental_charting',          // → patients, doctors, appointments

  // Tier 5: Depend on Tier 4
  'follow_ups',               // → patients, doctors, appointments, dental_charting
  'dental_history',           // → appointments, patients, doctors
  'lab_jobs',                 // → patients, dental_labs
  'prescriptions',            // → patients, doctors

  // Tier 6: Depend on Tier 5
  'prescription_medications', // → prescriptions, medications
  'stock_transactions',       // → stock_items, stock_batches

  // Tier 7: Auth & logs (depend on users)
  'user_sessions',            // → users
  'password_reset_tokens',    // → users
  'audit_logs',               // → users
];

// Columns in appointments that reference follow_ups (circular FK)
const APPOINTMENT_FOLLOW_UP_FK = 'based_on_follow_up_id';

// ── Helpers ─────────────────────────────────────────────────────────────────
function log(message) {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] ${message}\n`);
}

function unzip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`;
  execSync(cmd, { stdio: 'pipe' });
}

function httpsRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function deleteAllRows(table) {
  // First, null out the circular FK in appointments before deleting follow_ups
  if (table === 'follow_ups') {
    const nullUrl = `${SUPABASE_URL}/rest/v1/appointments?${APPOINTMENT_FOLLOW_UP_FK}=not.is.null`;
    await httpsRequest(nullUrl, 'PATCH', {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    }, JSON.stringify({ [APPOINTMENT_FOLLOW_UP_FK]: null }));
  }

  // Delete all rows — Supabase REST requires a filter, so we use id=not.is.null
  // which matches every row that has an id (i.e. all rows)
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=not.is.null`;
  const res = await httpsRequest(url, 'DELETE', {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Prefer: 'return=minimal',
  });

  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`DELETE ${table}: HTTP ${res.statusCode}: ${res.body}`);
  }
}

async function upsertRows(table, rows) {
  if (!rows || rows.length === 0) return 0;

  let total = 0;
  // Process in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await httpsRequest(url, 'POST', {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    }, JSON.stringify(batch));

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`HTTP ${res.statusCode}: ${res.body}`);
    }
    total += batch.length;
  }
  return total;
}

async function updateRows(table, rows, columns) {
  // Update specific columns using PATCH for each row by primary key (id)
  let updated = 0;
  for (const row of rows) {
    if (!row.id) continue;

    const patch = {};
    let hasValue = false;
    for (const col of columns) {
      if (row[col] !== undefined && row[col] !== null) {
        patch[col] = row[col];
        hasValue = true;
      }
    }
    if (!hasValue) continue;

    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${row.id}`;
    const res = await httpsRequest(url, 'PATCH', {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    }, JSON.stringify(patch));

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`PATCH ${table} id=${row.id}: HTTP ${res.statusCode}: ${res.body}`);
    }
    updated++;
  }
  return updated;
}

function findLatestBackup() {
  if (!existsSync(BACKUP_ROOT)) return null;

  const zips = readdirSync(BACKUP_ROOT)
    .filter((f) => /^\d{4}-\d{2}-\d{2}(_\d{2}-\d{2})?\.zip$/.test(f))
    .sort()
    .reverse();

  return zips.length > 0 ? zips[0].replace('.zip', '') : null;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  let date = process.argv[2];

  if (!date) {
    date = findLatestBackup();
    if (!date) {
      log('ERROR: No backup date provided and no backups found.');
      log('Usage: node restore.mjs 2026-02-25');
      process.exit(1);
    }
    log(`No date specified — using latest backup: ${date}`);
  }

  const zipPath = join(BACKUP_ROOT, `${date}.zip`);
  const extractDir = join(BACKUP_ROOT, `_restore_${date}`);

  // Check if zip exists
  if (!existsSync(zipPath)) {
    // Check if raw folder exists (legacy / unzipped backup)
    const rawDir = join(BACKUP_ROOT, date);
    if (existsSync(rawDir)) {
      log(`No zip found, using raw backup folder: ${date}`);
      return await restoreFromFolder(rawDir, date);
    }
    log(`ERROR: Backup not found: ${zipPath}`);
    process.exit(1);
  }

  // Unzip
  log(`Extracting ${date}.zip ...`);
  try {
    unzip(zipPath, extractDir);
  } catch (err) {
    log(`ERROR: Failed to unzip: ${err.message}`);
    process.exit(1);
  }

  try {
    await restoreFromFolder(extractDir, date);
  } finally {
    // Clean up extracted folder
    rmSync(extractDir, { recursive: true, force: true });
    log('Cleaned up temporary extract folder.');
  }
}

async function restoreFromFolder(folder, date) {
  log(`=== Restore started from backup ${date} ===`);

  // ── Phase 1: Delete all existing rows (reverse order — children first) ──
  log('--- Phase 1: Clearing existing data ---');
  const deleteOrder = [...RESTORE_ORDER].reverse();
  for (const table of deleteOrder) {
    try {
      await deleteAllRows(table);
      log(`  DEL   ${table} — cleared`);
    } catch (err) {
      log(`  WARN  ${table} — delete failed: ${err.message}`);
    }
  }

  // ── Phase 2: Insert backup data (forward order — parents first) ──
  log('--- Phase 2: Restoring backup data ---');

  let success = 0;
  let skipped = 0;
  let failed = 0;

  // Store appointments data for the circular FK fix (pass 3)
  let appointmentsRawData = null;

  for (const table of RESTORE_ORDER) {
    const filePath = join(folder, `${table}.json`);

    if (!existsSync(filePath)) {
      log(`  SKIP  ${table} (no backup file)`);
      skipped++;
      continue;
    }

    try {
      let rows = JSON.parse(readFileSync(filePath, 'utf-8'));
      if (rows.length === 0) {
        log(`  SKIP  ${table} (0 rows)`);
        skipped++;
        continue;
      }

      // Special handling for appointments: null out follow_up FK on first pass
      if (table === 'appointments') {
        appointmentsRawData = rows;
        rows = rows.map((row) => ({
          ...row,
          [APPOINTMENT_FOLLOW_UP_FK]: null,
        }));
      }

      const count = await upsertRows(table, rows);
      log(`  OK    ${table} — ${count} rows inserted`);
      success++;
    } catch (err) {
      log(`  FAIL  ${table} — ${err.message}`);
      failed++;
    }
  }

  // Pass 2: Restore the circular FK (appointments.based_on_follow_up_id)
  if (appointmentsRawData) {
    const rowsWithFK = appointmentsRawData.filter(
      (r) => r[APPOINTMENT_FOLLOW_UP_FK] != null
    );
    if (rowsWithFK.length > 0) {
      try {
        const updated = await updateRows('appointments', rowsWithFK, [APPOINTMENT_FOLLOW_UP_FK]);
        log(`  OK    appointments — ${updated} follow_up FK links restored`);
      } catch (err) {
        log(`  WARN  appointments FK restore — ${err.message}`);
      }
    }
  }

  log(`=== Restore complete: ${success} restored, ${skipped} skipped, ${failed} failed ===`);
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
