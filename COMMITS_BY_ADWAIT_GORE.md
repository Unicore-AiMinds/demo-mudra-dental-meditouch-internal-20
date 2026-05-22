# DentalMetrix — Commit History by Adwait Gore

> **Note:** The `openclaw_whatsapp_service` branch contains changes intended for the **local installation** of the application. These changes are **not merged** into the `Demo` branch, which is connected to Netlify for the hosted/demo deployment. Keep this in mind when reviewing or pulling from this branch.

This document lists all commits made by **Adwait Gore** on the DentalMetrix project, organized chronologically from newest to oldest, with a description of the intent behind each change.

---

## April 2026

| Hash | Date | Message |
|------|------|---------|
| `a2c0b19` | 2026-04-21 | **[Chore] Update installer output filename to include version v1.01.02** — Embed the version number in the built installer filename for easier distribution and tracking. |
| `b9af422` | 2026-04-21 | **[Feature] Replace OpenClaw with direct Baileys WhatsApp integration** — Remove the third-party OpenClaw gateway and integrate WhatsApp messaging directly using the Baileys library for a self-hosted, dependency-free solution. |
| `31d799c` | 2026-04-14 | **[Plan] Baileys WhatsApp integration implementation plan** — Add an implementation plan document outlining the steps to migrate from OpenClaw to Baileys. |
| `2d30cd4` | 2026-04-14 | **[Spec] Baileys WhatsApp integration design document** — Add a design specification covering architecture, session management, and message flow for the Baileys integration. |

## March 2026

| Hash | Date | Message |
|------|------|---------|
| `7627cec` | 2026-03-06 | **[Intermediate] Use system Node v22 for openclaw and restore gateway scheduled task in installer** — Switch the OpenClaw runtime to the system-installed Node.js v22 and fix the gateway scheduled task in the installer. |
| `557364a` | 2026-03-06 | **[Intermediate] Remove installer binaries from git tracking and add to .gitignore** — Clean up the repository by untracking large installer binaries and preventing them from being committed in the future. |
| `5bb8b0b` | 2026-03-06 | **[Chore] Remove unused standalone WhatsApp proxy server** — Delete the standalone WhatsApp proxy server code that is no longer needed after the OpenClaw gateway integration. |
| `28f0262` | 2026-03-06 | **[Feature] Replace WhatsApp proxy task with OpenClaw gateway in installer** — Swap the custom WhatsApp proxy scheduled task for the OpenClaw gateway in the installer workflow. |
| `d391de4` | 2026-03-06 | **[Fix] Narrow dev proxy to /api/sendMessage only** — Restrict the development server proxy to only forward WhatsApp send-message requests, avoiding unintended proxy behavior. |
| `bcb8cec` | 2026-03-06 | **[Feature] Add follow-up service support in edit dialog and pass details to WhatsApp messages** — Allow selecting a follow-up service when editing appointments and include that information in WhatsApp notification messages. |
| `ffaa9f5` | 2026-03-06 | **[Feature] Add structured WhatsApp message templates with formatted date/time** — Introduce formatted, human-readable message templates for appointment confirmations, cancellations, and reminders sent via WhatsApp. |
| `9c53858` | 2026-03-06 | **[Fix] Bypass cmd.exe for multiline WhatsApp messages and add per-device session tracking** — Fix a Windows shell issue that broke multiline messages and add per-device session tracking so multiple devices can use WhatsApp independently. |
| `c97f346` | 2026-03-06 | **[Fix] Remove port number from system tray tooltip** — Clean up the system tray icon tooltip by removing the port number that was unnecessarily displayed. |
| `93d68be` | 2026-03-05 | **[Fix] Change auto-backup scheduled time from 2:00 AM to 2:00 PM** — Reschedule the automatic database backup to run at 2:00 PM instead of 2:00 AM to align with clinic operating hours. |
| `ebc2eb4` | 2026-03-05 | **[Feature] Add WhatsApp proxy to installer with startup scheduled task** — Bundle the WhatsApp proxy server into the installer and create a Windows scheduled task to start it automatically on boot. |
| `327c270` | 2026-03-05 | **[Fix] Add dist folder cleanup on uninstall** — Ensure the `dist` folder is removed during uninstallation to leave a clean system. |
| `70a6b01` | 2026-03-05 | **[Chore] Delete old backup zip and update installer binary** — Remove an outdated backup archive and refresh the installer binary. |
| `b2e01c5` | 2026-03-05 | **[Infra] Update installer with PowerShell scheduled task and uninstall improvements** — Enhance the installer to use PowerShell for creating scheduled tasks and improve the uninstall process. |
| `be0a5e1` | 2026-03-05 | **[Feature] Add backup API endpoints and BackupOverlay UI component** — Expose REST endpoints for triggering and monitoring backups, and add a UI overlay that shows backup progress. |
| `823d338` | 2026-03-05 | **[Enhancement] Improve restore script with clean restore and new backup naming** — Improve the database restore script to perform clean restores and adopt a new backup file naming convention. |
| `ae219a2` | 2026-03-05 | **[Enhancement] Improve backup script with audit logging, lock file, and timestamps** — Harden the backup script with audit log entries, a lock file to prevent concurrent runs, and timestamped output. |
| `4009845` | 2026-03-05 | **[Feature] Add session tracking API for tray backup integration** — Add an API that tracks active user sessions so the system tray app can determine safe times to run backups. |
| `0de8ebc` | 2026-03-05 | **[Feature] Add backup and auto-backup categories to audit log** — Extend the audit logging system with dedicated categories for manual and automatic backup events. |
| `3c78cda` | 2026-03-05 | **[Cleanup] Remove WhatsApp settings tab from Settings page** — Remove the WhatsApp configuration tab from the settings UI as configuration moved elsewhere. |
| `f54b173` | 2026-03-05 | **[Security] Move Supabase credentials to environment variables** — Extract hardcoded Supabase credentials into environment variables to prevent accidental exposure. |
| `6d1d183` | 2026-03-05 | **[Security] Remove hardcoded WhatsApp gateway token** — Remove a hardcoded authentication token for the WhatsApp gateway and load it from a secure source instead. |

## February 2026

| Hash | Date | Message |
|------|------|---------|
| `85f60ba` | 2026-02-28 | **[Infra] Add backup/restore scripts, installer assets, and documentation** — Introduce PowerShell backup and restore scripts, installer resource files, and supporting documentation. |
| `011c360` | 2026-02-28 | **[Feature] Auto-refresh browser on server exit and improve uninstall cleanup** — Automatically reload the browser when the backend server stops and improve the uninstaller's cleanup of leftover files. |
| `162a23e` | 2026-02-28 | **[Feature] Add WhatsApp settings tab with test message functionality** — Add a settings tab for configuring WhatsApp integration, including a button to send a test message. |
| `b16ebbe` | 2026-02-28 | **[Feature] Add WhatsApp notification popups on appointment actions** — Show toast/popup notifications when WhatsApp messages are sent on appointment creation, update, or cancellation. |
| `df8339d` | 2026-02-28 | **[Config] Add dev server proxy for WhatsApp API** — Configure the Vite development server to proxy WhatsApp API requests to the local backend. |
| `5d4a75e` | 2026-02-28 | **[Feature] Add standalone WhatsApp proxy server** — Create an Express-based proxy server that bridges the frontend to the WhatsApp gateway API. |
| `295d22d` | 2026-02-28 | **[Feature] Add WhatsApp messaging service for appointment notifications** — Build the core service layer for sending appointment-related notifications (confirmations, reminders, cancellations) via WhatsApp. |
| `d11cc63` | 2026-02-24 | **[UI] Style mandatory field asterisks in red across all forms** — Apply consistent red styling to required-field asterisks throughout the application. |
| `0eb1779` | 2026-02-24 | **[Feature] Add WhatsApp checkbox to AddPatientDialog in New Appointment tab** — Allow users to opt patients into WhatsApp notifications directly from the new appointment patient form. |
| `799740b` | 2026-02-24 | **[UI] Replace status column with doctor column and add doctor filter in appointment list** — Swap the appointment list's status column for a doctor column and add a filter dropdown to view appointments by doctor. |
| `0f72a70` | 2026-02-19 | **[UI] Show follow-up service in confirm dialog and revert edit dialog scroll** — Display the follow-up service name in the appointment confirmation dialog and fix a scroll regression in the edit dialog. |
| `859841d` | 2026-02-19 | **[UI] Add follow-up service field and compact appointment dialog layout** — Add a follow-up service selector to the appointment dialog and tighten the layout for better usability. |
| `e10bbf8` | 2026-02-19 | **[Fix] Recalculate follow-up tentative dates on recall appointment completion** — Automatically recalculate follow-up tentative dates when a recall-type appointment is marked as completed. |
| `cbe87a3` | 2026-02-18 | **[Fix] Persist patients added from New Appointment dialog to database** — Fix a bug where patients created inline during appointment scheduling were not being saved to the database. |
| `7474569` | 2026-02-18 | **[Config] Update Supabase project configuration** — Update Supabase connection settings to point to the correct project. |
| `81c8ffa` | 2026-02-18 | **[Validation] Enforce 10-digit mobile number validation on edit doctor form** — Add client-side validation to reject mobile numbers that are not exactly 10 digits on the doctor edit form. |
| `ef3c1af` | 2026-02-18 | **[Validation] Add duplicate doctor detection and name/specialization capitalization** — Prevent duplicate doctor entries and auto-capitalize doctor names and specializations on input. |
| `027e507` | 2026-02-18 | **[Validation] Add medicine name and stock item name capitalization** — Auto-capitalize medicine and stock item names for consistent data entry. |
| `1bf05c6` | 2026-02-18 | **[Validation] Add city capitalization for dental labs** — Auto-capitalize city names when adding or editing dental lab records. |
| `482f5af` | 2026-02-18 | **[Validation] Add patient name and city capitalization** — Auto-capitalize patient names and city fields for consistent formatting. |
| `a22854d` | 2026-02-17 | **[Validation] Add duplicate stock item detection before adding** — Warn or block when a user attempts to add a stock item that already exists. |
| `f6ddf55` | 2026-02-17 | **[Validation] Add duplicate service name detection before adding** — Warn or block when a user attempts to add a service with a name that already exists. |
| `7df1de1` | 2026-02-17 | **[Validation] Add duplicate appointment detection before scheduling** — Detect and warn about duplicate appointments for the same patient at the same time. |
| `3d0f68d` | 2026-02-17 | **[Validation] Enforce 10-digit mobile number for dealers, labs, and doctors** — Apply consistent 10-digit mobile number validation across dealer, lab, and doctor forms. |
| `ec8a0e8` | 2026-02-17 | **[Validation] Add mobile number, email, and duplicate patient validations** — Add comprehensive input validation for patient mobile numbers, email addresses, and duplicate detection. |
| `170c66e` | 2026-02-13 | **[Enhancement] Centralize Supabase configuration into a single source of truth** — Consolidate scattered Supabase connection strings and credentials into one shared configuration module. |

---

## Summary by Category

| Category | Count | Description |
|----------|-------|-------------|
| **Feature** | 16 | New functionality — WhatsApp integration, backup system, follow-up services, session tracking |
| **Validation** | 10 | Input validation — duplicate detection, mobile number enforcement, auto-capitalization |
| **Fix** | 7 | Bug fixes — shell issues, date recalculation, data persistence, proxy scope |
| **Enhancement** | 3 | Improvements to existing features — backup scripts, restore process, Supabase config |
| **Infra** | 3 | Infrastructure — installer, scheduled tasks, backup/restore scripts |
| **Security** | 2 | Credential management — environment variables, token removal |
| **UI** | 4 | User interface changes — appointment list, dialog layouts, styling |
| **Chore** | 3 | Housekeeping — cleanup unused code, update binaries, version naming |
| **Config** | 2 | Configuration changes — dev proxy, Supabase settings |
| **Spec/Plan** | 2 | Documentation — Baileys integration design and implementation plan |
| **Cleanup** | 1 | Remove obsolete UI components |

**Total commits: 52**
