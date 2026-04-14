# Baileys WhatsApp Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace OpenClaw gateway with direct Baileys library integration for WhatsApp messaging, keeping the same frontend API contract.

**Architecture:** Baileys runs in-process inside `mudra-server.mjs`. A new module `server/whatsapp-baileys.mjs` encapsulates all Baileys connection logic (session persistence, QR generation, rate-limited sending). The existing `/api/sendMessage` endpoint calls this module instead of spawning the OpenClaw CLI. Three new endpoints (`/api/whatsapp/status`, `/api/whatsapp/qr`, `/api/whatsapp/logout`) provide connection management.

**Tech Stack:** Node.js (ESM), `@whiskeysockets/baileys` (WhatsApp Web client), `qrcode` (QR image generation)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `server/whatsapp-baileys.mjs` | **Create** | Baileys connection manager: init, reconnect, QR generation, session persistence, rate-limited message sending |
| `server/mudra-server.mjs` | **Modify** | Replace OpenClaw handler with Baileys calls, add 3 new endpoints |
| `package.json` | **Modify** | Add `@whiskeysockets/baileys` and `qrcode` dependencies |
| `.gitignore` | **Modify** | Add `whatsapp-auth/` entry |
| `.env` | **Modify** | Remove `OPENCLAW_GATEWAY_TOKEN` lines |
| `installer/mudra-setup.iss` | **Modify** | Remove OpenClaw scheduled task, add `whatsapp-auth/` directory |

**Unchanged files:** `src/services/whatsapp-service.ts` (same `/api/sendMessage` contract), all React components, `vite.config.ts`.

---

### Task 1: Install Dependencies and Update .gitignore

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install Baileys and qrcode packages**

Run:
```bash
cd "E:/DentalMetrix Project"
npm install @whiskeysockets/baileys qrcode
```

Expected: packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Add whatsapp-auth/ to .gitignore**

Add this line at the end of `.gitignore`:

```
# WhatsApp Baileys session credentials
whatsapp-auth/
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add baileys and qrcode dependencies, ignore auth dir"
```

---

### Task 2: Create Baileys Connection Manager

**Files:**
- Create: `server/whatsapp-baileys.mjs`

This module encapsulates all Baileys logic. It exports four functions: `initWhatsApp()`, `sendWhatsAppMessage(phone, message)`, `getWhatsAppStatus()`, `logoutWhatsApp()`.

- [ ] **Step 1: Create `server/whatsapp-baileys.mjs`**

```javascript
/**
 * WhatsApp Baileys Connection Manager
 *
 * Manages WhatsApp Web connection via Baileys library.
 * Handles session persistence, QR generation, reconnection, and rate-limited sending.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import QRCode from 'qrcode';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const AUTH_DIR = join(__dirname, '..', 'whatsapp-auth');

// Ensure auth directory exists
mkdirSync(AUTH_DIR, { recursive: true });

// ── State ────────────────────────────────────────────────────────────────────

let sock = null;
let currentQR = null;         // raw QR string from Baileys
let connectionStatus = 'disconnected'; // 'disconnected' | 'qr_needed' | 'connected'
let messageQueue = [];
let isSending = false;

// ── Rate limiter ─────────────────────────────────────────────────────────────

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

async function processQueue() {
  if (isSending || messageQueue.length === 0) return;
  isSending = true;

  while (messageQueue.length > 0) {
    const { phone, message, resolve, reject } = messageQueue.shift();

    try {
      if (connectionStatus !== 'connected' || !sock) {
        throw new Error('WhatsApp is not connected. Please scan QR code first.');
      }

      // Baileys expects JID format: 919876543210@s.whatsapp.net
      const jid = phone.replace(/^\+/, '') + '@s.whatsapp.net';
      await sock.sendMessage(jid, { text: message });
      console.log(`[whatsapp] Message sent to ${phone}`);
      resolve({ success: true });
    } catch (err) {
      console.error(`[whatsapp] Send failed for ${phone}: ${err.message}`);
      reject(err);
    }

    // Rate-limit: wait 1-3 seconds between messages
    if (messageQueue.length > 0) {
      await new Promise(r => setTimeout(r, randomDelay()));
    }
  }

  isSending = false;
}

// ── Connection ───────────────────────────────────────────────────────────────

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, undefined),
    },
    printQRInTerminal: true,
    // Suppress noisy Baileys logs in production
    logger: {
      level: 'silent',
      trace() {}, debug() {}, info() {}, warn() {}, error() {},
      fatal() {}, child() { return this; },
    },
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Connection status updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
      connectionStatus = 'qr_needed';
      console.log('[whatsapp] QR code generated — scan with your phone');
    }

    if (connection === 'close') {
      currentQR = null;
      connectionStatus = 'disconnected';

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log('[whatsapp] Connection closed, reconnecting...');
        setTimeout(connectToWhatsApp, 3000);
      } else {
        console.log('[whatsapp] Logged out. Clear session and scan QR again.');
        sock = null;
      }
    }

    if (connection === 'open') {
      currentQR = null;
      connectionStatus = 'connected';
      console.log('[whatsapp] Connected successfully!');
    }
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the WhatsApp connection. Call once at server startup.
 */
export async function initWhatsApp() {
  console.log('[whatsapp] Initializing Baileys connection...');
  await connectToWhatsApp();
}

/**
 * Send a WhatsApp message. Returns a promise that resolves when sent.
 * Messages are queued and rate-limited (1-3s delay between sends).
 *
 * @param {string} phone - Phone number with country code, e.g. "+919876543210"
 * @param {string} message - Message text (supports WhatsApp formatting like *bold*)
 * @returns {Promise<{success: boolean}>}
 */
export function sendWhatsAppMessage(phone, message) {
  return new Promise((resolve, reject) => {
    messageQueue.push({ phone, message, resolve, reject });
    processQueue();
  });
}

/**
 * Get current connection status and QR code if available.
 *
 * @returns {Promise<{status: string, qr?: string}>}
 *   status: 'connected' | 'qr_needed' | 'disconnected'
 *   qr: base64 PNG data URL (only when status is 'qr_needed')
 */
export async function getWhatsAppStatus() {
  const result = { status: connectionStatus };

  if (connectionStatus === 'qr_needed' && currentQR) {
    result.qr = await QRCode.toDataURL(currentQR);
  }

  return result;
}

/**
 * Disconnect and clear the session. User will need to scan QR again.
 */
export async function logoutWhatsApp() {
  if (sock) {
    await sock.logout();
    sock = null;
  }
  currentQR = null;
  connectionStatus = 'disconnected';
  console.log('[whatsapp] Logged out and session cleared');
}
```

- [ ] **Step 2: Verify the file was created correctly**

Run:
```bash
node -e "import('./server/whatsapp-baileys.mjs').then(() => console.log('Module loads OK')).catch(e => console.error('Load error:', e.message))"
```

Expected: `Module loads OK` (or a runtime error about WhatsApp connection, which is fine — it means the imports resolved).

- [ ] **Step 3: Commit**

```bash
git add server/whatsapp-baileys.mjs
git commit -m "feat: add Baileys WhatsApp connection manager module"
```

---

### Task 3: Replace OpenClaw with Baileys in mudra-server.mjs

**Files:**
- Modify: `server/mudra-server.mjs` (lines 1-128, 276-280)

This task replaces the OpenClaw CLI handler with Baileys calls, and adds three new endpoints.

- [ ] **Step 1: Update imports at the top of `mudra-server.mjs`**

Replace lines 1-21:

Old:
```javascript
/**
 * Mudra Clinic — Combined Server
 *
 * Serves the built React app (dist/) and handles WhatsApp proxy API.
 * Binds to 0.0.0.0 for LAN access.
 *
 * Usage:
 *   node server/mudra-server.mjs
 *
 * Environment variables:
 *   OPENCLAW_GATEWAY_TOKEN  — OpenClaw gateway token (optional, falls back to openclaw config)
 *   MUDRA_PORT              — Server port (default: 8080)
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
```

New:
```javascript
/**
 * Mudra Clinic — Combined Server
 *
 * Serves the built React app (dist/) and handles WhatsApp messaging via Baileys.
 * Binds to 0.0.0.0 for LAN access.
 *
 * Usage:
 *   node server/mudra-server.mjs
 *
 * Environment variables:
 *   MUDRA_PORT              — Server port (default: 8080)
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { initWhatsApp, sendWhatsAppMessage, getWhatsAppStatus, logoutWhatsApp } from './whatsapp-baileys.mjs';
```

- [ ] **Step 2: Replace the `handleSendMessage` function (lines 67-128)**

Old (the entire `handleSendMessage` function from line 67 to line 128):

Replace with:

```javascript
// ── WhatsApp message handler ────────────────────────────────────────────────

function handleSendMessage(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', async () => {
    try {
      const { phone, message } = JSON.parse(body);

      if (!phone || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'phone and message are required' }));
        return;
      }

      const result = await sendWhatsAppMessage(phone, message);
      console.log(`[api] Message sent to ${phone}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error(`[api] Error: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
```

- [ ] **Step 3: Add WhatsApp management endpoints in the server request handler**

Find this block (around line 276-280):

```javascript
  // API route: WhatsApp proxy
  if (req.method === 'POST' && req.url === '/api/sendMessage') {
    handleSendMessage(req, res);
    return;
  }
```

Replace with:

```javascript
  // API route: WhatsApp send message
  if (req.method === 'POST' && req.url === '/api/sendMessage') {
    handleSendMessage(req, res);
    return;
  }

  // API route: WhatsApp connection status
  if (req.method === 'GET' && req.url === '/api/whatsapp/status') {
    try {
      const status = await getWhatsAppStatus();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API route: WhatsApp QR code page (for easy scanning in browser)
  if (req.method === 'GET' && req.url === '/api/whatsapp/qr') {
    try {
      const status = await getWhatsAppStatus();
      if (status.status === 'connected') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif"><h1>WhatsApp Connected</h1></body></html>');
      } else if (status.qr) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<html><body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:sans-serif">
          <h2>Scan QR Code with WhatsApp</h2>
          <img src="${status.qr}" style="width:300px;height:300px" />
          <p>Open WhatsApp > Settings > Linked Devices > Link a Device</p>
          <script>setTimeout(() => location.reload(), 15000)</script>
        </body></html>`);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif"><h2>Waiting for QR code... <script>setTimeout(() => location.reload(), 3000)</script></h2></body></html>');
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API route: WhatsApp logout
  if (req.method === 'POST' && req.url === '/api/whatsapp/logout') {
    try {
      await logoutWhatsApp();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
```

- [ ] **Step 4: Initialize Baileys before starting the server**

Find the `server.listen` call at the bottom (line 286):

```javascript
server.listen(PORT, '0.0.0.0', () => {
```

Add Baileys initialization right before it:

```javascript
// Initialize WhatsApp connection before starting HTTP server
initWhatsApp().catch(err => {
  console.error('[whatsapp] Failed to initialize:', err.message);
});

server.listen(PORT, '0.0.0.0', () => {
```

- [ ] **Step 5: Add `async` to the server request handler**

The `createServer` callback needs to be async for the `await` calls in the new endpoints. Find:

```javascript
const server = createServer((req, res) => {
```

Replace with:

```javascript
const server = createServer(async (req, res) => {
```

- [ ] **Step 6: Remove the OpenClaw .env loading (optional cleanup)**

In `.env`, remove the OpenClaw token lines (lines 5-8). The file should become:

```
# Supabase
VITE_SUPABASE_URL=https://pwijqupjtminhcmtbxta.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3aWpxdXBqdG1pbmhjbXRieHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTM1NTgsImV4cCI6MjA4NjE2OTU1OH0.x3Xn3_JC2crG7yuB02xeR0bTF773aqNSHMMZgT1shLU
```

- [ ] **Step 7: Verify server starts without errors**

Run:
```bash
cd "E:/DentalMetrix Project"
node server/mudra-server.mjs
```

Expected output:
```
[whatsapp] Initializing Baileys connection...
[whatsapp] QR code generated — scan with your phone
[mudra] Mudra Clinic server running on port 8080
[mudra] Local:   http://localhost:8080
```

Then open `http://localhost:8080/api/whatsapp/qr` in browser — should see QR code page.

Press Ctrl+C to stop.

- [ ] **Step 8: Commit**

```bash
git add server/mudra-server.mjs .env
git commit -m "feat: replace OpenClaw with Baileys in mudra-server"
```

---

### Task 4: Update Installer — Remove OpenClaw Scheduled Task

**Files:**
- Modify: `installer/mudra-setup.iss` (lines 70-72, 150-171, 207-209)

- [ ] **Step 1: Remove OpenClaw uninstall tasks (lines 70-72)**

Find and delete these lines from the `[UninstallRun]` section:

```
; Stop and remove the OpenClaw gateway task on uninstall
Filename: "schtasks"; Parameters: "/end /tn ""MudraOpenClawGateway"""; Flags: runhidden; RunOnceId: "StopGatewayTask"
Filename: "schtasks"; Parameters: "/delete /tn ""MudraOpenClawGateway"" /f"; Flags: runhidden; RunOnceId: "RemoveGatewayTask"
```

- [ ] **Step 2: Remove OpenClaw scheduled task creation (lines 150-171)**

Find and delete this block from the `CurStepChanged` procedure:

```pascal
    // Create scheduled task for OpenClaw WhatsApp gateway (runs at logon, hidden)
    // Requires openclaw to be installed globally: npm install -g openclaw
    Exec(
      'powershell.exe',
      '-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Command "' +
        'Unregister-ScheduledTask -TaskName ''MudraOpenClawGateway'' -Confirm:$false -ErrorAction SilentlyContinue; ' +
        '$action = New-ScheduledTaskAction -Execute ''powershell.exe'' ' +
          '-Argument ''-ExecutionPolicy Bypass -WindowStyle Hidden -Command openclaw gateway run''; ' +
        '$trigger = New-ScheduledTaskTrigger -AtLogon; ' +
        '$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries ' +
          '-ExecutionTimeLimit (New-TimeSpan -Days 365) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1); ' +
        'Register-ScheduledTask -TaskName ''MudraOpenClawGateway'' -Action $action -Trigger $trigger -Settings $settings ' +
          '-Description ''OpenClaw WhatsApp gateway for Mudra Clinic'' -RunLevel Highest"',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode
    );

    // Start the gateway immediately (don't wait for next logon)
    Exec(
      'schtasks',
      '/run /tn "MudraOpenClawGateway"',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode
    );
```

- [ ] **Step 3: Remove OpenClaw stop from `KillAppProcesses` (lines 207-209)**

Find and delete:

```pascal
  // Stop the OpenClaw gateway scheduled task
  Exec('schtasks', '/end /tn "MudraOpenClawGateway"',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
```

- [ ] **Step 4: Add node_modules to installer bundling (for Baileys)**

In the `[Files]` section, after the backup script line, add:

```
; Baileys and dependencies (node_modules required at runtime)
Source: "..\node_modules\@whiskeysockets\*"; DestDir: "{app}\node_modules\@whiskeysockets"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\node_modules\qrcode\*"; DestDir: "{app}\node_modules\qrcode"; Flags: ignoreversion recursesubdirs createallsubdirs
```

Note: Baileys has transitive dependencies. After testing, you may need to add more `node_modules` entries for its peer dependencies. Alternatively, consider bundling with a tool like `esbuild` to create a single-file server — but that's a separate optimization task.

- [ ] **Step 5: Commit**

```bash
git add installer/mudra-setup.iss
git commit -m "chore: remove OpenClaw gateway task from installer, add Baileys deps"
```

---

### Task 5: End-to-End Manual Testing

No automated tests for this task — WhatsApp integration requires a real device.

- [ ] **Step 1: Start the server**

```bash
cd "E:/DentalMetrix Project"
node server/mudra-server.mjs
```

Verify:
- Console shows `[whatsapp] QR code generated`
- `http://localhost:8080/api/whatsapp/status` returns `{"status":"qr_needed","qr":"data:image/png;base64,..."}`

- [ ] **Step 2: Scan QR code**

Open `http://localhost:8080/api/whatsapp/qr` in a browser. Scan the QR code with the clinic WhatsApp.

Verify:
- Console shows `[whatsapp] Connected successfully!`
- `http://localhost:8080/api/whatsapp/status` returns `{"status":"connected"}`
- QR page auto-refreshes and shows "WhatsApp Connected"

- [ ] **Step 3: Send a test message via API**

```bash
curl -X POST http://localhost:8080/api/sendMessage \
  -H "Content-Type: application/json" \
  -d '{"phone": "+91XXXXXXXXXX", "message": "Test from Baileys integration"}'
```

Replace `+91XXXXXXXXXX` with a real number. Verify the message arrives on WhatsApp.

- [ ] **Step 4: Test session persistence (restart server)**

Stop the server (Ctrl+C), then restart:

```bash
node server/mudra-server.mjs
```

Verify:
- Console shows `[whatsapp] Connected successfully!` (no QR scan needed)
- `http://localhost:8080/api/whatsapp/status` returns `{"status":"connected"}`

- [ ] **Step 5: Test from the React UI**

Open `http://localhost:8080` in a browser. Navigate to Appointments, create or select an appointment, and trigger a WhatsApp notification. Verify the message arrives.

- [ ] **Step 6: Test logout**

```bash
curl -X POST http://localhost:8080/api/whatsapp/logout
```

Verify:
- Console shows `[whatsapp] Logged out and session cleared`
- Status returns `{"status":"disconnected"}`
- Restarting server requires QR scan again

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete Baileys WhatsApp integration — replaces OpenClaw"
```
