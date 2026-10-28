# Implant Tracker (POC, front-end only)

**Date:** 2026-10-28 · **Branch:** `feature/implant-tracker-poc` (from `integration`)
**Mockup (approved 2026-10-28):** `2026-10-28-implant-tracker-mockups.html` (same folder).

## Why

The client wants to track dental implants that come from **several dealers**: receive a quantity from
each dealer, record each implant **used for a patient** (from a specific dealer), and **return** unused
pieces to the dealer they came from. This is a **demo for the client**: no database, no money.

## Decisions (user)

- Quantity tracking only: **no rate, cost or payment** anywhere.
- Simple flow for the **receptionist**.
- Consumption is tied to a **patient** picked from the ERP list (required); **Tooth No.** and **Batch**
  optional.
- New menu item **Implant Tracker**, after Stock Tracker, **Dental Metrix only** (like Lab Work).
- Words from the system: Item / Sub-item, Record Incoming, Record Consumption, View Batches & History,
  Batch Number, Expiry Date, Received Date, Quantity Received / Used, Min. Threshold, statuses Normal /
  Low Stock / Out of Stock / Expiring Soon, "Insufficient Stock", "No Stock Available",
  "Missing Information". New: **Record Return** (Quantity Returned, Return Date, Notes).
- **POC:** sample data kept in memory in the browser (resets on reload). Dealers and patients are read
  from the existing ERP lists (read-only). Nothing is written to the database.
- Phones: system words win, so the three actions are in the ⋯ menu on phones too (the mockup's short
  "Incoming / Use / Return" buttons were not approved).

## Behaviour

- Each implant is listed once; its stock is the sum of its **batches**. A batch = one delivery from one
  dealer (dealer, optional batch number, expiry date, received date, quantity received; used and returned
  counts). **Left = received − used − returned** per batch; per dealer = sum of its batches.
- **Record Incoming**: one implant, one or more rows (Dealer, Quantity Received, Batch Number, Expiry
  Date) + Received Date; each row becomes a batch. Confirm step.
- **Record Consumption**: Patient, Dealer (only dealers with usable pieces; count shown), optional
  Specific Batch (default: first expiring, FEFO; expired batches can't be used), Quantity Used, optional
  Tooth No., Date Used. Confirm step.
- **Record Return**: Dealer (only dealers with pieces left), optional Specific Batch, Quantity Returned
  (max = that dealer's / batch's left), Return Date, optional Notes. Confirm step.
- **Status**: Out of Stock (0 left) → Low Stock (below Min. Threshold) → Expiring Soon (a batch with
  pieces left expires within 60 days or has expired) → Normal.
- **View Batches & History**: Batches tab (per batch: dealer, batch, received date, expiry, received,
  used, returned, left) and Transactions tab (date, type, dealer, quantity, patient/tooth or notes).
- Add / Edit implant (Item, Sub-item, Unit "Piece", Min. Threshold, Description). Export CSV of the list.
- Phones/tablets (<1024 px): cards instead of the table; popups full screen (same as other ERP pages).

## Out of scope (until the client approves the demo)

Database tables, permissions of its own (the demo uses `stock.view`), audit log, linking to the patient
page or charting, money.
