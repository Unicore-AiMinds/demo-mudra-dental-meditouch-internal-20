/**
 * Mudra Clinic — Daily Auto-Backup Script
 *
 * Exports all Supabase tables as JSON files into a dated backup folder.
 * Deletes backups older than 30 days.
 *
 * Usage:  node backup.mjs
 * Runs via Windows Task Scheduler daily at 2:00 AM.
 */

import { writeFileSync, mkdirSync, appendFileSync, readdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://pwijqupjtminhcmtbxta.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3aWpxdXBqdG1pbmhjbXRieHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTM1NTgsImV4cCI6MjA4NjE2OTU1OH0.x3Xn3_JC2crG7yuB02xeR0bTF773aqNSHMMZgT1shLU';

const RETENTION_DAYS = 7;
const PAGE_SIZE = 1000;

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(SCRIPTS_DIR, '..');
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    // Process both zip files (YYYY-MM-DD.zip) and legacy directories (YYYY-MM-DD)
    const match = name.match(/^(\d{4}-\d{2}-\d{2})(\.zip)?$/);
    if (!match) continue;

    const folderDate = new Date(match[1] + 'T00:00:00');
    if (folderDate < cutoff) {
      const fullPath = join(BACKUP_ROOT, name);
      rmSync(fullPath, { recursive: true, force: true });
      log(`Deleted old backup: ${name}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const date = todayString();
  const backupDir = join(BACKUP_ROOT, date);

  mkdirSync(backupDir, { recursive: true });

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

  // Show Windows notification
  const title = failed === 0 ? 'Backup Successful' : 'Backup Completed with Errors';
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

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
