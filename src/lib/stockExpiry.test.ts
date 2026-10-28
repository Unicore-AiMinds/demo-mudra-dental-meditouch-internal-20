import { describe, it, expect } from "vitest";
import { daysUntilExpiry, isPastExpiry, isWithinExpiryWindow } from "./stockExpiry";

// 28 Oct 2026, late evening local time (time of day must not matter)
const NOW = new Date(2026, 9, 28, 22, 30);
const MORNING = new Date(2026, 9, 28, 3, 0);

describe("stock expiry rules", () => {
  it("counts whole days, whatever the time of day", () => {
    expect(daysUntilExpiry("2026-10-28", NOW)).toBe(0);
    expect(daysUntilExpiry("2026-10-28", MORNING)).toBe(0);
    expect(daysUntilExpiry("2026-10-29", NOW)).toBe(1);
    expect(daysUntilExpiry("2026-10-27", NOW)).toBe(-1);
    expect(daysUntilExpiry("2026-10-28T00:00:00+00:00", NOW)).toBe(0);
  });

  it("the expiry date itself is not expired; the next day is", () => {
    expect(isPastExpiry("2026-10-28", NOW)).toBe(false);
    expect(isPastExpiry("2026-10-27", NOW)).toBe(true);
  });

  it("expiring soon from the expiry day up to 60 days ahead", () => {
    expect(isWithinExpiryWindow("2026-10-28", NOW)).toBe(true);
    expect(isWithinExpiryWindow("2026-12-27", NOW)).toBe(true); // 60 days
    expect(isWithinExpiryWindow("2026-12-28", NOW)).toBe(false); // 61 days
    expect(isWithinExpiryWindow("2026-10-27", NOW)).toBe(false); // already expired
  });
});
