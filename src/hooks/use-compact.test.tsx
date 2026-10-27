import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsCompact } from "./use-compact";

const setWidth = (w: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: w });
};

describe("useIsCompact", () => {
  afterEach(() => setWidth(1024));

  it("is true at 1023px", () => {
    setWidth(1023);
    const { result } = renderHook(() => useIsCompact());
    expect(result.current).toBe(true);
  });

  it("is false at 1024px", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsCompact());
    expect(result.current).toBe(false);
  });

  it("updates on resize", () => {
    setWidth(1440);
    const { result } = renderHook(() => useIsCompact());
    expect(result.current).toBe(false);
    act(() => {
      setWidth(400);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);
  });
});
