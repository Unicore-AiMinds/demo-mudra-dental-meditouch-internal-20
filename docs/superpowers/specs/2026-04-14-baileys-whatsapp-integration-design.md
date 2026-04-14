# Baileys WhatsApp Integration Design

**Date:** 2026-04-14
**Status:** Approved
**Branch:** `openclaw_whatsapp_service`

## Summary

Replace the OpenClaw gateway WhatsApp integration with direct Baileys (`@whiskeysockets/baileys`) library integration inside `mudra-server.mjs`. This eliminates the OpenClaw dependency and its associated costs while maintaining the same frontend API contract.

## Motivation

- **Cost savings**: Baileys is free and open-source; OpenClaw has recurring costs.
- **Single machine deployment**: Only one clinic PC runs the system, making session management straightforward.

## Known Risks

- **Ban risk**: Baileys is an unofficial, reverse-engineered WhatsApp Web API. Meta can temporarily restrict or permanently ban numbers using unofficial APIs.
- **Session maintenance**: WhatsApp may periodically invalidate sessions, requiring QR re-scan.
- **Protocol changes**: WhatsApp protocol updates can break Baileys until the library is updated.
- **Mitigations**: Rate limiting (max 30 msgs/min), random delays (1-3s between messages), low message volume (~20-50 msgs/day for a clinic).

## Architecture

### Current Flow (OpenClaw)

```
React App -> mudra-server.mjs (/api/sendMessage) -> OpenClaw CLI (child process) -> OpenClaw Gateway -> WhatsApp
```

### New Flow (Baileys)

```
React App -> mudra-server.mjs (/api/sendMessage) -> Baileys (in-process) -> WhatsApp Web
```

Baileys runs as an in-process library inside `mudra-server.mjs`. The WhatsApp Web socket connection is maintained for the lifetime of the server process.

### Session Persistence

- Auth credentials stored in `./whatsapp-auth/` directory (relative to server)
- On server start: load saved auth -> auto-reconnect (no QR needed)
- On first run or session expiry: generate QR code -> staff scans with clinic WhatsApp
- Auth directory added to `.gitignore` (contains secrets)

## API Changes

### Existing Endpoint (unchanged contract)

```
POST /api/sendMessage
Body: { "phone": "+919876543210", "message": "Your appointment..." }
Response: { "success": true } or { "error": "..." }
```

Internal implementation changes from spawning OpenClaw CLI to calling Baileys `sendMessage()`.

### New Endpoints

```
GET /api/whatsapp/status
Response: { "status": "connected" | "disconnected" | "qr_needed" }

GET /api/whatsapp/qr
Response: QR code as base64 PNG image (or HTML page with QR for browser viewing)

POST /api/whatsapp/logout
Response: { "success": true }
```

## Rate Limiting & Safety

- Message queue: messages sent sequentially, never in parallel
- Max 30 messages per minute
- Random 1-3 second delay between consecutive messages
- Phone number formatting preserved from existing `whatsapp-service.ts` logic

## File Changes

### Modified Files

| File | Changes |
|------|---------|
| `server/mudra-server.mjs` | Remove OpenClaw CLI logic. Add Baileys initialization, connection management, QR generation, session persistence, rate-limited message sending, new endpoints (`/status`, `/qr`, `/logout`). |
| `package.json` | Add `@whiskeysockets/baileys` and `qrcode` (for QR image generation) dependencies. |
| `installer/mudra-setup.iss` | Remove `MudraOpenClawGateway` scheduled task. Add `whatsapp-auth/` directory to install package. |
| `.gitignore` | Add `whatsapp-auth/` entry. |
| `.env` | Remove `OPENCLAW_GATEWAY_TOKEN` (no longer needed). |

### Unchanged Files

| File | Reason |
|------|--------|
| `src/services/whatsapp-service.ts` | Same `/api/sendMessage` API contract; no frontend changes. |
| `src/pages/Appointments.tsx` | Uses `whatsapp-service.ts`; no changes needed. |
| `src/contexts/AppointmentContext.tsx` | No WhatsApp API changes. |
| `vite.config.ts` | Dev proxy to `/api/sendMessage` stays the same. |

## OpenClaw Removal

- Remove `OPENCLAW_GATEWAY_TOKEN` environment variable usage from `mudra-server.mjs`
- Remove OpenClaw CLI path detection and `child_process.spawn` logic
- Remove `MudraOpenClawGateway` scheduled task from `installer/mudra-setup.iss`
- `openclaw` global npm package no longer required on target machine
- System Node v22 requirement drops (Baileys works with Node v18+, bundled v20 is fine)

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@whiskeysockets/baileys` | latest | WhatsApp Web API client |
| `qrcode` | latest | QR code image generation for pairing |

## Testing Plan

1. Install dependencies, start server, verify QR code generation
2. Scan QR with test WhatsApp number
3. Send test message via `/api/sendMessage` endpoint
4. Restart server, verify auto-reconnection (no QR needed)
5. Test from the React UI (appointment notifications)
6. Verify rate limiting works under rapid successive sends
