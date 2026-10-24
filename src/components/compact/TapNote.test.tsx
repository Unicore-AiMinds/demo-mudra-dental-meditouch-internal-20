import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TapNote from "./TapNote";

const longText = "Part of mouth rehabilitation - Step 1. Patient not available until January.";

describe("TapNote", () => {
  it("shows full short text without a toggle", () => {
    render(<TapNote text="Sensitive to cold" />);
    expect(screen.getByText("Sensitive to cold")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("truncates long text and reveals it on tap", () => {
    render(<TapNote text={longText} />);
    expect(screen.queryByText(longText)).toBeNull();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(longText)).toBeTruthy();
  });

  it("renders N/A for empty text", () => {
    render(<TapNote text="" />);
    expect(screen.getByText("N/A")).toBeTruthy();
  });

  it("uses the given fallback for empty text", () => {
    render(<TapNote text="" fallback="-" />);
    expect(screen.getByText("-")).toBeTruthy();
  });
});
