import { describe, it, expect } from "vitest";
import { sortByTime } from "./sortByTime";

describe("sortByTime", () => {
  it("orders 12-hour times through the day without changing the input", () => {
    const input = [{ time: "4:00 PM" }, { time: "9:15 AM" }, { time: "12:30 PM" }, { time: "1:00 PM" }];
    const sorted = sortByTime(input);
    expect(sorted.map(a => a.time)).toEqual(["9:15 AM", "12:30 PM", "1:00 PM", "4:00 PM"]);
    expect(input[0].time).toBe("4:00 PM");
  });
});
