import { describe, it, expect } from "vitest";
import { quantityFromBatches } from "./stockQuantity";

describe("quantityFromBatches", () => {
  it("adds up what is left in every batch", () => {
    expect(quantityFromBatches([{ current_quantity: 1 }, { current_quantity: 4 }, { current_quantity: 0 }], 99)).toBe(5);
  });

  it("corrects an old count that no longer matches the batches", () => {
    // item showed 2 after a direct edit, the batches really hold 6, 1 is consumed -> 5 (not 1)
    expect(quantityFromBatches([{ current_quantity: 2 }, { current_quantity: 3 }], 1)).toBe(5);
  });

  it("keeps the old way of counting when no batches could be read", () => {
    expect(quantityFromBatches([], 7)).toBe(7);
  });
});
