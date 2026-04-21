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
import { mkdirSync, rmSync } from 'node:fs';
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
        console.log('[whatsapp] Logged out. Clearing session and generating new QR...');
        sock = null;
        // Clear old auth files so reconnect starts fresh with a new QR
        try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
        mkdirSync(AUTH_DIR, { recursive: true });
        setTimeout(connectToWhatsApp, 3000);
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
    try { await sock.logout(); } catch {}
    sock = null;
  }
  currentQR = null;
  connectionStatus = 'disconnected';

  // Clear auth files so next connect starts fresh
  try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
  mkdirSync(AUTH_DIR, { recursive: true });
  console.log('[whatsapp] Logged out and session cleared');

  // Start a new connection so a fresh QR code is generated
  setTimeout(() => {
    console.log('[whatsapp] Starting new connection for QR generation...');
    connectToWhatsApp().catch(err => {
      console.error('[whatsapp] Failed to reconnect after logout:', err.message);
    });
  }, 2000);
}
