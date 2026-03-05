/**
 * Mudra Clinic — Daily Auto-Backup Script
 *
 * Exports all Supabase tables as JSON files into a dated backup folder.
 * Deletes backups older than 30 days.
 *
 * Usage:  node backup.mjs
 * Runs via Windows Task Scheduler daily at 2:00 AM.
 */

import { readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync, rmSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
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

const RETENTION_DAYS = 7;
const PAGE_SIZE = 1000;
const BACKUP_ROOT = join(APP_DIR, 'backup');
const LOG_FILE = join(BACKUP_ROOT, 'backup.log');

// ── Tables to back up ───────────────────────────────────────────────────────
const TABLES = [
  // Core
  'patients',
  'appointments',
  'doctors',
  'services',
  'services_with_follow_up',
  'clinics',
  'clinic_operating_hours',
  // Clinical
  'dental_charting',
  'dental_history',
  'vital_signs',
  // Prescriptions
  'medicines',
  'medications',
  'prescriptions',
  'prescription_medications',
  // Follow-up
  'follow_ups',
  'follow_up_steps',
  'service_follow_up_rules',
  // Lab work
  'lab_jobs',
  'lab_work_types',
  'dental_labs',
  // Stock / Inventory
  'stock_items',
  'stock_item_definitions',
  'stock_batches',
  'stock_transactions',
  'dealers',
  'units',
  // User & Auth
  'users',
  'user_sessions',
  'roles',
  'permissions',
  'role_permissions',
  'password_reset_tokens',
  'audit_logs',
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  process.stdout.write(line);
  try {
    appendFileSync(LOG_FILE, line);
  } catch { /* ignore if log dir doesn't exist yet */ }
}

function todayString() {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const time = `${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date}_${time}`;
}

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
  });
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
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

async function fetchTable(table) {
  const rows = [];
  let offset = 0;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&offset=${offset}&limit=${PAGE_SIZE}`;
    const res = await httpsGet(url, {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      // Table may not exist — return null so we can skip it
      if (res.statusCode === 404 || res.statusCode === 400) return null;
      throw new Error(`HTTP ${res.statusCode}: ${res.body}`);
    }

    const data = JSON.parse(res.body);
    rows.push(...data);

    if (data.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  return rows;
}

function zipFolder(folderPath, zipPath) {
  // Use PowerShell Compress-Archive (built into Windows 10/11)
  const cmd = `powershell -NoProfile -Command "Compress-Archive -Path '${folderPath}\\*' -DestinationPath '${zipPath}' -Force"`;
  execSync(cmd, { stdio: 'pipe' });
}

function deleteOldBackups() {
  if (!existsSync(BACKUP_ROOT)) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  for (const name of readdirSync(BACKUP_ROOT)) {
    // Match: YYYY-MM-DD_HH-MM.zip, YYYY-MM-DD.zip, or YYYY-MM-DD (legacy)
    const match = name.match(/^(\d{4}-\d{2}-\d{2})(_\d{2}-\d{2})?(\.zip)?$/);
    if (!match) continue;

    const folderDate = new Date(match[1] + 'T00:00:00');
    if (folderDate < cutoff) {
      const fullPath = join(BACKUP_ROOT, name);
      rmSync(fullPath, { recursive: true, force: true });
      log(`Deleted old backup: ${name}`);
    }
  }
}

// ── Parse CLI arguments ─────────────────────────────────────────────────────
function getArg(name) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

const BACKUP_USER = getArg('--user');        // e.g. "Dr. Smith"
const BACKUP_TYPE = BACKUP_USER ? 'manual' : 'auto';

// ── Audit log helper ────────────────────────────────────────────────────────
async function writeAuditLog(details) {
  const entry = {
    timestamp: new Date().toISOString(),
    user_name: BACKUP_USER || 'System (Auto)',
    user_role: BACKUP_USER ? 'user' : 'system',
    action_category: 'settings',
    action_type: BACKUP_TYPE === 'auto' ? 'autobackup' : 'backup',
    target_entity: 'database',
    details,
  };

  try {
    const url = `${SUPABASE_URL}/rest/v1/audit_logs`;
    const res = await httpsPost(url, {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    }, JSON.stringify(entry));

    if (res.statusCode >= 200 && res.statusCode < 300) {
      log(`  AUDIT  ${BACKUP_TYPE} backup logged`);
    } else {
      log(`  WARN   Audit log failed: HTTP ${res.statusCode} — ${res.body}`);
    }
  } catch (err) {
    log(`  WARN   Audit log failed: ${err.message}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
const LOCK_FILE = join(BACKUP_ROOT, '.backup-in-progress');

async function main() {
  const date = todayString();
  const backupDir = join(BACKUP_ROOT, date);

  mkdirSync(backupDir, { recursive: true });

  // Create lock file so the frontend knows backup is in progress
  writeFileSync(LOCK_FILE, date);

  log(`=== Backup started for ${date} ===`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const table of TABLES) {
    try {
      const rows = await fetchTable(table);
      if (rows === null) {
        log(`  SKIP  ${table} (table not found)`);
        skipped++;
        continue;
      }
      const filePath = join(backupDir, `${table}.json`);
      writeFileSync(filePath, JSON.stringify(rows, null, 2));
      log(`  OK    ${table} — ${rows.length} rows`);
      success++;
    } catch (err) {
      log(`  FAIL  ${table} — ${err.message}`);
      failed++;
    }
  }

  // Zip the backup folder
  const zipPath = join(BACKUP_ROOT, `${date}.zip`);
  try {
    zipFolder(backupDir, zipPath);
    rmSync(backupDir, { recursive: true, force: true });
    log(`  ZIP   ${date}.zip created`);
  } catch (err) {
    log(`  WARN  Could not zip backup: ${err.message} (raw folder kept)`);
  }

  // Clean up old backups
  deleteOldBackups();

  log(`=== Backup complete: ${success} saved, ${skipped} skipped, ${failed} failed ===\n`);

  // Write audit log entry
  const auditDetails = failed === 0
    ? `${BACKUP_TYPE === 'auto' ? 'Auto' : 'Manual'} backup completed: ${success} tables backed up successfully.`
    : `${BACKUP_TYPE === 'auto' ? 'Auto' : 'Manual'} backup completed with errors: ${success} saved, ${skipped} skipped, ${failed} failed.`;
  await writeAuditLog(auditDetails);

  // Show Windows notification
  const title = failed === 0 ? 'Backup taken successfully' : 'Backup Completed with Errors';
  const msg = failed === 0
    ? `${success} tables backed up successfully.`
    : `${success} saved, ${skipped} skipped, ${failed} failed.`;
  try {
    execSync(
      `powershell -NoProfile -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.ShowBalloonTip(5000, '${title}', '${msg}', 'Info'); Start-Sleep -Seconds 5; $n.Dispose()"`,
      { stdio: 'pipe', windowsHide: true }
    );
  } catch { /* ignore notification failure */ }
}

main()
  .catch((err) => {
    log(`FATAL: ${err.message}`);
  })
  .finally(() => {
    // Always remove lock file so the frontend is unblocked
    try { unlinkSync(LOCK_FILE); } catch {}
  });
