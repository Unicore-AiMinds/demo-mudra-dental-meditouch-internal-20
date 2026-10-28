# Implant Tracker (POC, front-end only)

**Date:** 2026-10-28 · **Branch:** `feature/implant-tracker-poc` (from `integration`)
**Mockup (approved 2026-10-28):** `2026-10-28-implant-tracker-mockups.html` (same folder).

## Why

The client wants to track dental implants that come from **several dealers**: receive a quantity from
each dealer, record each implant **used for a patient** (from a specific dealer), and **return** unused
pieces to the dealer they came from. This is a **demo for the client**: no database, no money.

## Decisions (user)

- Quantity tracking; **no rate or payment**. Update 2026-10-28: an optional **Cost / Piece (₹)** per
  batch (Record Incoming and opening stock), shown in the Batches tab, because one implant can cost
  differently per dealer.
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
  Date, optional Cost / Piece) + Received Date; each row becomes a batch. Confirm step.
- **Add New Implant** has an optional **Opening stock** part (Quantity; then Dealer and Expiry Date
  required, Batch Number and Cost / Piece optional). It is saved as an Incoming batch received today,
  noted "Opening stock" in Transactions. **Edit Implant** has no quantity: after adding, stock changes
  only through Incoming / Consumption / Return (Stock Tracker's editable quantity made its counts drift).
- **Record Consumption**: Patient, Dealer (only dealers with usable pieces; count shown), optional
  Specific Batch (default: first expiring, FEFO; expired batches can't be used), Quantity Used, optional
  Tooth No., Date Used. Confirm step.
- **Record Return**: Dealer (only dealers with pieces left), optional Specific Batch, Quantity Returned
  (max = that dealer's / batch's left), Return Date, optional Notes. Confirm step.
- **Status** (same order as Stock Tracker): Out of Stock (0 left) → Expired (a batch with pieces left is
  past its expiry) → Expiring Soon (a batch with pieces left expires within 60 days) → Low Stock (at or
  below Min. Threshold) → Normal. The expiry date itself is still usable; expired from the next day.
- **Expiry column** (list; card line on phones): nearest expiry among batches with pieces left, full date,
  with how many pieces it covers ("4 Pieces expiring", "1 Piece expired"). Expired summary card and tab.
- **Batches tab** has a Status per batch: Good / Expiring Soon / Expired / Out of Stock (Stock Tracker
  words and colours).
- **View Batches & History**: Batches tab (per batch: dealer, batch, received date, expiry, received,
  used, returned, left) and Transactions tab (date, type, dealer, quantity, patient/tooth or notes).
- Add / Edit implant (Item, Sub-item, Unit "Piece", Min. Threshold, Description). Export CSV of the list.
- Phones/tablets (<1024 px): cards instead of the table; popups full screen (same as other ERP pages).

## Out of scope (until the client approves the demo)

Database tables, permissions of its own (the demo uses `stock.view`), audit log, linking to the patient
page or charting, money.

## Later: pick implants from Settings instead of typing (noted 2026-10-28, parked by user)

Today Add New Implant has free-text Item / Sub-item, so the same implant can be typed two ways
(e.g. "osstem" / "4.0 mm" next to "Osstem TS III" / "4.0 × 10 mm"). Stock Tracker avoids this:

- **Name** is a search box (`Combobox`) over **Settings → Stock Items** (`stock_item_definitions`).
- **Sub-item** is a drop-down of that item's sub-items only.
- **Unit, Min. Threshold, Description, Item Type** fill in from the chosen Settings entry.

Settings → Stock Items holds: Item name, Sub-item, Description, Item Type (Consumable / Inventory),
Unit, Clinic (dental / meditouch / both), Min. Threshold. On DEV it has 76 items and **no implants**,
and there is no way to mark an item as an implant.

Plan for the real version: add Item Type **"Implant"** in Settings → Stock Items (database change;
check any constraint on `item_type`), enter each implant as Item = brand/system, Sub-item = size, and
make Add New Implant search only items of type Implant, like Stock Tracker. A demo-only version with a
sample implant list was offered and declined for now.
