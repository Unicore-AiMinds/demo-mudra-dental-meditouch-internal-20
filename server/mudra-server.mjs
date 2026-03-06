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

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');

// Load .env file from project root if it exists
const envPath = join(ROOT_DIR, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const PORT = parseInt(process.env.MUDRA_PORT || '8080', 10);

const MIME_TYPES = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.ico':   'image/x-icon',
  '.svg':   'image/svg+xml',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.eot':   'application/vnd.ms-fontobject',
  '.webp':  'image/webp',
  '.webm':  'video/webm',
  '.mp4':   'video/mp4',
  '.pdf':   'application/pdf',
  '.txt':   'text/plain',
};

// ── WhatsApp proxy handler ──────────────────────────────────────────────────

function handleSendMessage(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    try {
      const { phone, message } = JSON.parse(body);

      if (!phone || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'phone and message are required' }));
        return;
      }

      const env = { ...process.env };
      if (process.env.OPENCLAW_GATEWAY_TOKEN) {
        env.OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
      }

      // Run openclaw CLI
      // On Windows, .cmd wrappers go through cmd.exe which breaks multiline
      // messages. Bypass cmd.exe by calling node.exe with the openclaw script
      // directly so newlines in the message argument are preserved.
      const openclawExe = process.env.OPENCLAW_PATH || 'openclaw';
      const args = ['message', 'send', '--target', phone, '--message', message];

      let file, finalArgs;
      if (process.platform === 'win32') {
        // Resolve the .cmd wrapper to the actual JS entry point
        const npmDir = join(process.env.APPDATA || '', 'npm');
        const openclawScript = join(npmDir, 'node_modules', 'openclaw', 'openclaw.mjs');
        if (existsSync(openclawScript)) {
          file = process.execPath; // node.exe
          finalArgs = ['--disable-warning=ExperimentalWarning', openclawScript, ...args];
        } else {
          // Fallback to cmd.exe if script not found
          file = process.env.comspec || 'cmd.exe';
          finalArgs = ['/c', openclawExe, ...args];
        }
      } else {
        file = openclawExe;
        finalArgs = args;
      }

      execFile(file, finalArgs, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`[api] Error: ${stderr || error.message}`);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: stderr || error.message }));
          return;
        }
        console.log(`[api] Message sent to ${phone}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, output: stdout }));
      });
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    }
  });
}

// ── Static file handler ─────────────────────────────────────────────────────

function serveStatic(req, res) {
  // Decode URI and strip query string
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  let filePath = join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If file doesn't exist or is a directory, serve index.html (SPA fallback)
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST_DIR, 'index.html');
  }

  try {
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = readFileSync(filePath);

    // Cache static assets (JS, CSS, images) for 1 day; HTML for no-cache
    const cacheControl = ext === '.html'
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=86400';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

// ── Main server ─────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  // CORS headers for LAN access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health-check endpoint (used by client heartbeat)
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"ok"}');
    return;
  }

  // API route: Set/get current logged-in user (used by tray for backup)
  // Per-device tracking using client IP so one device logging out doesn't affect others
  if (req.method === 'POST' && req.url === '/api/auth/session') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { user_name } = JSON.parse(body);
        const clientIp = req.socket.remoteAddress || 'unknown';
        if (!server._sessions) server._sessions = new Map();
        if (user_name) {
          server._sessions.set(clientIp, user_name);
        } else {
          server._sessions.delete(clientIp);
        }
        console.log(`[auth] ${user_name ? 'Login' : 'Logout'} from ${clientIp} — active sessions: ${server._sessions.size}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/auth/session') {
    const sessions = server._sessions || new Map();
    // Return the first active user — tray backup just needs any logged-in user
    const activeUser = sessions.size > 0 ? [...sessions.values()][0] : null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user_name: activeUser }));
    return;
  }

  // API route: Trigger manual backup
  if (req.method === 'POST' && req.url === '/api/backup/trigger') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { user_name } = JSON.parse(body);
        if (!user_name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'user_name is required' }));
          return;
        }

        const backupScript = join(ROOT_DIR, 'scripts', 'backup.mjs');
        if (!existsSync(backupScript)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Backup script not found' }));
          return;
        }

        // Run backup in background with user name
        const nodeExe = join(ROOT_DIR, 'node.exe');
        const exe = existsSync(nodeExe) ? nodeExe : 'node';
        spawn(exe, [backupScript, '--user', user_name], {
          cwd: ROOT_DIR,
          detached: true,
          stdio: 'ignore',
        }).unref();

        console.log(`[api] Manual backup triggered by ${user_name}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // API route: Backup status
  if (req.method === 'GET' && req.url === '/api/backup/status') {
    const lockFile = join(ROOT_DIR, 'backup', '.backup-in-progress');
    const inProgress = existsSync(lockFile);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ inProgress }));
    return;
  }

  // API route: WhatsApp proxy
  if (req.method === 'POST' && req.url === '/api/sendMessage') {
    handleSendMessage(req, res);
    return;
  }

  // Everything else: serve static files
  serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mudra] Mudra Clinic server running on port ${PORT}`);
  console.log(`[mudra] Local:   http://localhost:${PORT}`);

  // Show LAN addresses
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`[mudra] LAN:     http://${net.address}:${PORT}`);
      }
    }
  }

  console.log(`[mudra] POST /api/sendMessage  { phone, message }`);
});
