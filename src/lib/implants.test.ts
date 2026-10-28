import { describe, it, expect } from "vitest";
import {
  ImplantState,
  batchLeft,
  dealerStock,
  implantTotal,
  implantStatus,
  nearestExpiry,
  batchStatus,
  usableBatches,
  recordIncoming,
  recordConsumption,
  recordReturn,
} from "./implants";

const TODAY = "2026-10-28";

const state = (): ImplantState => ({
  implants: [
    { id: "i1", item: "Osstem TS III", subItem: "4.0 × 10 mm", unit: "Piece", minThreshold: 2, description: "" },
    { id: "i2", item: "Adin Touareg-S", subItem: "3.75 × 10 mm", unit: "Piece", minThreshold: 1, description: "" },
  ],
  batches: [
    { id: "b1", implantId: "i1", dealerId: "d1", dealerName: "Rahul Adin", batchNumber: "OS1", expiryDate: "2029-10-31", receivedDate: "2026-10-02", received: 4, used: 1, returned: 0 },
    { id: "b2", implantId: "i1", dealerId: "d2", dealerName: "Samarth Dental", batchNumber: "", expiryDate: "2029-03-31", receivedDate: "2026-10-05", received: 3, used: 0, returned: 1 },
    { id: "b3", implantId: "i1", dealerId: "d1", dealerName: "Rahul Adin", batchNumber: "OS0", expiryDate: "2026-05-31", receivedDate: "2025-06-01", received: 1, used: 0, returned: 0 },
  ],
  transactions: [],
});

describe("counts", () => {
  it("left = received − used − returned", () => {
    expect(batchLeft(state().batches[0])).toBe(3);
    expect(batchLeft(state().batches[1])).toBe(2);
  });

  it("adds up each dealer's batches", () => {
    expect(dealerStock(state(), "i1")).toEqual([
      { dealerId: "d1", dealerName: "Rahul Adin", left: 4, usable: 3 },
      { dealerId: "d2", dealerName: "Samarth Dental", left: 2, usable: 2 },
    ]);
  });

  it("total is the sum of all dealers", () => {
    expect(implantTotal(state(), "i1")).toBe(6);
    expect(implantTotal(state(), "i2")).toBe(0);
  });
});

describe("status", () => {
  it("Out of Stock when nothing is left", () => {
    expect(implantStatus(state(), "i2", TODAY)).toBe("Out of Stock");
  });

  it("Low Stock at or below the minimum threshold (as Stock Tracker)", () => {
    const s = state();
    s.batches = s.batches.filter((b) => b.id === "b2").map((b) => ({ ...b, returned: 2 })); // 1 left, threshold 2
    expect(implantStatus(s, "i1", TODAY)).toBe("Low Stock");
    s.batches[0] = { ...s.batches[0], returned: 1 }; // 2 left, threshold 2
    expect(implantStatus(s, "i1", TODAY)).toBe("Low Stock");
  });

  it("Expired when a batch with pieces left is past its expiry date", () => {
    expect(implantStatus(state(), "i1", TODAY)).toBe("Expired"); // b3 expired with 1 left
    const s = state();
    s.batches[2] = { ...s.batches[2], returned: 1 }; // expired batch sent back: nothing expired left
    expect(implantStatus(s, "i1", TODAY)).toBe("Normal");
  });

  it("can still be used on the expiry date itself", () => {
    const s = state();
    s.batches = s.batches.filter((b) => b.id !== "b3");
    s.batches[0] = { ...s.batches[0], expiryDate: TODAY };
    expect(implantStatus(s, "i1", TODAY)).toBe("Expiring Soon");
  });

  it("Expiring Soon when a batch with pieces left expires within 60 days", () => {
    const s = state();
    s.batches = s.batches.filter((b) => b.id !== "b3");
    expect(implantStatus(s, "i1", TODAY)).toBe("Normal");
    s.batches[0] = { ...s.batches[0], expiryDate: "2026-12-15" }; // 48 days away
    expect(implantStatus(s, "i1", TODAY)).toBe("Expiring Soon");
  });

  it("order as Stock Tracker: Out of Stock, Expired, Expiring Soon, Low Stock, Normal", () => {
    const s = state();
    s.batches = s.batches.filter((b) => b.id === "b2").map((b) => ({ ...b, returned: 2, expiryDate: "2026-12-15" })); // low and expiring
    expect(implantStatus(s, "i1", TODAY)).toBe("Expiring Soon");
  });
});

describe("expiry details", () => {
  it("nearest expiry among batches with pieces left, with its piece count", () => {
    expect(nearestExpiry(state(), "i1", TODAY)).toEqual({ date: "2026-05-31", pieces: 1, expired: true, expiringSoon: false });
    const s = state();
    s.batches[2] = { ...s.batches[2], returned: 1 }; // empty batches are ignored
    expect(nearestExpiry(s, "i1", TODAY)).toEqual({ date: "2029-03-31", pieces: 2, expired: false, expiringSoon: false });
    expect(nearestExpiry(state(), "i2", TODAY)).toBeNull();
  });

  it("adds up batches that share the nearest date", () => {
    const s = state();
    s.batches = s.batches.filter((b) => b.id !== "b3").map((b) => ({ ...b, expiryDate: "2026-12-15" }));
    expect(nearestExpiry(s, "i1", TODAY)).toEqual({ date: "2026-12-15", pieces: 5, expired: false, expiringSoon: true });
  });

  it("each batch has its own status (Stock Tracker words)", () => {
    const [b1, b2, b3] = state().batches;
    expect(batchStatus(b1, TODAY)).toBe("Good");
    expect(batchStatus({ ...b2, expiryDate: "2026-12-15" }, TODAY)).toBe("Expiring Soon");
    expect(batchStatus(b3, TODAY)).toBe("Expired");
    expect(batchStatus({ ...b3, returned: 1 }, TODAY)).toBe("Out of Stock");
  });
});

describe("usable batches (for consumption)", () => {
  it("skips expired and empty batches, earliest expiry first", () => {
    expect(usableBatches(state(), "i1", "d1", TODAY).map((b) => b.id)).toEqual(["b1"]);
  });
});

describe("recordIncoming", () => {
  it("adds one batch per dealer row and an Incoming transaction each", () => {
    const next = recordIncoming(state(), {
      implantId: "i1",
      receivedDate: TODAY,
      rows: [
        { dealerId: "d1", dealerName: "Rahul Adin", quantity: 5, batchNumber: "OS9", expiryDate: "2029-10-31" },
        { dealerId: "d2", dealerName: "Samarth Dental", quantity: 3, batchNumber: "", expiryDate: "2029-03-31" },
      ],
    });
    expect(implantTotal(next, "i1")).toBe(14);
    expect(dealerStock(next, "i1").map((d) => d.left)).toEqual([9, 5]);
    expect(next.transactions.map((t) => [t.type, t.dealerName, t.quantity])).toEqual([
      ["Incoming", "Rahul Adin", 5],
      ["Incoming", "Samarth Dental", 3],
    ]);
  });
});

describe("recordConsumption", () => {
  it("takes from the chosen dealer's earliest-expiring usable batch and logs the patient", () => {
    const next = recordConsumption(state(), {
      implantId: "i1", dealerId: "d1", quantity: 1, date: TODAY,
      patientId: "p1", patientName: "Anjali Railkar", toothNo: "36",
    }, TODAY);
    expect(next.batches.find((b) => b.id === "b1")!.used).toBe(2);
    expect(next.batches.find((b) => b.id === "b3")!.used).toBe(0); // expired batch untouched
    expect(next.transactions[0]).toMatchObject({ type: "Consumption", dealerName: "Rahul Adin", quantity: 1, patientName: "Anjali Railkar", toothNo: "36", batchNumber: "OS1" });
  });

  it("only changes that dealer's count", () => {
    const next = recordConsumption(state(), { implantId: "i1", dealerId: "d2", quantity: 2, date: TODAY, patientId: "p1", patientName: "A" }, TODAY);
    expect(dealerStock(next, "i1").map((d) => d.left)).toEqual([4, 0]);
  });

  it("refuses more than the dealer's usable pieces", () => {
    expect(() => recordConsumption(state(), { implantId: "i1", dealerId: "d1", quantity: 4, date: TODAY, patientId: "p1", patientName: "A" }, TODAY))
      .toThrow("You can consume up to 3 Pieces");
  });

  it("refuses an expired chosen batch", () => {
    expect(() => recordConsumption(state(), { implantId: "i1", dealerId: "d1", batchId: "b3", quantity: 1, date: TODAY, patientId: "p1", patientName: "A" }, TODAY))
      .toThrow("This batch has expired");
  });
});

describe("recordReturn", () => {
  it("returns to the chosen dealer (any batch, earliest expiry first) and logs the note", () => {
    const next = recordReturn(state(), { implantId: "i1", dealerId: "d2", quantity: 2, date: TODAY, notes: "Wrong size" });
    expect(dealerStock(next, "i1").map((d) => d.left)).toEqual([4, 0]);
    expect(next.transactions[0]).toMatchObject({ type: "Return", dealerName: "Samarth Dental", quantity: 2, notes: "Wrong size" });
  });

  it("can return expired pieces", () => {
    const next = recordReturn(state(), { implantId: "i1", dealerId: "d1", batchId: "b3", quantity: 1, date: TODAY });
    expect(next.batches.find((b) => b.id === "b3")!.returned).toBe(1);
  });

  it("refuses more than the dealer has", () => {
    expect(() => recordReturn(state(), { implantId: "i1", dealerId: "d2", quantity: 3, date: TODAY }))
      .toThrow("You can return up to 2 Pieces");
  });
});
