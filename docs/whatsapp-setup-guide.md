# WhatsApp Notification Setup Guide
> DentalMetrix — OpenClaw Integration

Follow these steps on any fresh PC to get WhatsApp appointment notifications working without any blockers.

---

## Prerequisites

- Node.js v22 or later
- npm / pnpm / bun
- WhatsApp account (the clinic's number)

---

## Step 1 — Install OpenClaw Globally

```bash
npm install -g openclaw@latest
```

---

## Step 2 — Run the Onboarding Wizard

```bash
openclaw onboard
```

This will:
- Create the config directory at `C:\Users\<you>\.openclaw\`
- Generate `openclaw.json` with gateway settings
- Guide you through linking your WhatsApp account (scan QR code)

> **Important:** When asked to link a WhatsApp channel, choose **WhatsApp Web** and scan the QR code from your clinic's WhatsApp phone.

---

## Step 3 — Note Your Gateway Token

After onboarding, open:
```
C:\Users\<you>\.openclaw\openclaw.json
```

Find and copy the gateway token:
```json
"gateway": {
  "port": 18789,
  "auth": {
    "mode": "token",
    "token": "YOUR_TOKEN_HERE"
  }
}
```

You will need this token in Step 6.

---

## Step 4 — Start the Gateway

```bash
openclaw gateway run
```

Keep this terminal open. The gateway runs on port `18789`.

---

## Step 5 — Fix Device Scope (Critical Step)

This is the step that caused the blocker on the original setup. After running the gateway once, the CLI device gets registered with **read-only** scope by default. You must upgrade it to admin scope manually.

1. Stop the gateway (`Ctrl+C`)

2. Open `C:\Users\<you>\.openclaw\devices\paired.json`

3. Find the entry where `"clientMode": "cli"` and update its scopes to:
```json
"scopes": [
  "operator.admin",
  "operator.write",
  "operator.read",
  "operator.approvals",
  "operator.pairing"
],
"tokens": {
  "operator": {
    ...existing token fields...,
    "scopes": [
      "operator.admin",
      "operator.write",
      "operator.read",
      "operator.approvals",
      "operator.pairing"
    ]
  }
}
```

4. Open `C:\Users\<you>\.openclaw\identity\device-auth.json` and update scopes to match:
```json
"scopes": [
  "operator.admin",
  "operator.write",
  "operator.read",
  "operator.approvals",
  "operator.pairing"
]
```

5. Restart the gateway:
```bash
openclaw gateway run
```

---

## Step 6 — Update the Proxy Script

Open `whatsapp-proxy.mjs` in the DentalMetrix project root and update the `OPENCLAW_GATEWAY_TOKEN` env value to match your token from Step 3:

```js
exec(cmd, {
  env: {
    ...process.env,
    OPENCLAW_GATEWAY_TOKEN: 'YOUR_TOKEN_HERE'   // ← paste your token
  }
}, ...)
```

---

## Step 7 — Update Patient Phone Numbers

Ensure all patients in the database have a valid 10-digit Indian mobile number saved (without country code). The proxy automatically prepends `+91`.

---

## Step 8 — Run Everything

Open **three terminals**:

**Terminal 1 — OpenClaw Gateway:**
```bash
openclaw gateway run
```

**Terminal 2 — WhatsApp Proxy:**
```bash
cd "E:\DentalMetrix Project"
node whatsapp-proxy.mjs
```

**Terminal 3 — DentalMetrix App:**
```bash
cd "E:\DentalMetrix Project"
npm run dev
```

---

## Step 9 — Test

1. Open the app at `http://localhost:8080`
2. Go to **Settings → WhatsApp** tab
3. Enter your phone number with country code (e.g. `+918975522308`)
4. Click **Send Test Message**
5. Check the proxy terminal — you should see `[proxy] Success`
6. Check your WhatsApp — message should arrive

---

## Trigger Points in the App

| Event | WhatsApp Message Sent |
|---|---|
| New appointment created | Scheduled message |
| Appointment date/time changed | Rescheduled message |
| Appointment status → cancelled | Cancelled message |

---

## Troubleshooting

| Error | Fix |
|---|---|
| `CORS blocked` | Make sure Vite dev server is running (proxy handles it) |
| `pairing required` | Redo Step 5 — device scope not upgraded |
| `ECONNREFUSED 18789` | Gateway not running — do Step 4 |
| `Failed to fetch` | Proxy not running — do Step 8 Terminal 2 |
| No message on phone | Check patient has a phone number saved in profile |
| `405 Method Not Allowed` | Wrong port — ensure proxy targets `18789` |
