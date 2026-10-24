import { describe, it, expect } from "vitest";
import { previewList } from "./compact";

const ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("previewList", () => {
  it("shows the first 3 and counts the rest when collapsed", () => {
    expect(previewList(ten, false)).toEqual({ visible: [1, 2, 3], hiddenCount: 7 });
  });

  it("shows everything when expanded", () => {
    expect(previewList(ten, true)).toEqual({ visible: ten, hiddenCount: 0 });
  });

  it("hides nothing when there are 3 or fewer", () => {
    expect(previewList([1, 2], false)).toEqual({ visible: [1, 2], hiddenCount: 0 });
  });
});
