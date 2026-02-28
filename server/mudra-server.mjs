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
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
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

      // Use execFile (no shell) to prevent command injection
      execFile('openclaw', ['message', 'send', '--target', phone, '--message', message], {
        env,
      }, (error, stdout, stderr) => {
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
