/**
 * Prepares a minimal node_modules folder for the installer.
 * Traces only the runtime dependencies needed by mudra-server.mjs and whatsapp-baileys.mjs.
 *
 * Usage: node scripts/prepare-server-deps.mjs
 * Output: installer/server-node-modules/ (ready for Inno Setup)
 */

import { readFileSync, existsSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'node_modules');
const DEST = join(ROOT, 'installer', 'server-node-modules');

// Root packages required by the server
const ROOT_PKGS = ['@whiskeysockets/baileys', 'qrcode'];

function getDeps(pkgName, visited = new Set()) {
  if (visited.has(pkgName)) return visited;
  visited.add(pkgName);

  const pkgPath = join(SRC, pkgName, 'package.json');
  if (!existsSync(pkgPath)) {
    console.warn('  MISSING:', pkgName);
    return visited;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = pkg.dependencies || {};

  for (const dep of Object.keys(deps)) {
    getDeps(dep, visited);
  }
  return visited;
}

// Collect all needed packages
console.log('Tracing dependencies...');
const allDeps = new Set();
for (const pkg of ROOT_PKGS) {
  getDeps(pkg, allDeps);
}

const sorted = [...allDeps].sort();
console.log(`Found ${sorted.length} packages to bundle.\n`);

// Clean and recreate output dir
if (existsSync(DEST)) {
  rmSync(DEST, { recursive: true, force: true });
}
mkdirSync(DEST, { recursive: true });

// Copy each package
for (const pkg of sorted) {
  const src = join(SRC, pkg);
  const dest = join(DEST, pkg);

  if (!existsSync(src)) {
    console.warn('SKIP (not found):', pkg);
    continue;
  }

  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log('  Copied:', pkg);
}

console.log(`\nDone! ${sorted.length} packages copied to installer/server-node-modules/`);
