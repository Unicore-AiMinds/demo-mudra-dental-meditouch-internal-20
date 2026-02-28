/**
 * Tiny WhatsApp proxy server
 * Listens on port 18790, accepts POST /api/sendMessage { phone, message }
 * and runs: openclaw message send --to <phone> --message <message>
 *
 * Run with: node whatsapp-proxy.mjs
 */

import { createServer } from 'node:http';
import { exec } from 'node:child_process';

const PORT = 18790;

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/sendMessage') {
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

        // Escape double quotes in the message for the shell command
        const safeMessage = message.replace(/"/g, '\\"');

        const cmd = `openclaw message send --target "${phone}" --message "${safeMessage}"`;
        console.log(`[proxy] Running: ${cmd}`);

        exec(cmd, {
          env: {
            ...process.env,
            OPENCLAW_GATEWAY_TOKEN: 'b5f287d57ab859d94e98047a97a0b40ecf0cdfa36e1aed91'
          }
        }, (error, stdout, stderr) => {
          if (error) {
            console.error(`[proxy] Error: ${stderr || error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: stderr || error.message }));
            return;
          }
          console.log(`[proxy] Success: ${stdout}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, output: stdout }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[proxy] WhatsApp proxy running at http://localhost:${PORT}`);
  console.log(`[proxy] POST /api/sendMessage  { phone, message }`);
});
