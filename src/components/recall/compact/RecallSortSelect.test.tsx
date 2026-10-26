import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RecallSortSelect from "./RecallSortSelect";

describe("RecallSortSelect", () => {
  it("lists desktop's 4 sort choices in order", () => {
    render(<RecallSortSelect sortBy="date" sortOrder="asc" onChange={() => {}} />);
    expect(screen.getAllByRole("option").map(o => o.textContent)).toEqual([
      "Tentative Date (Earliest First)",
      "Tentative Date (Latest First)",
      "Patient (A-Z)",
      "Patient (Z-A)",
    ]);
  });

  it("shows the current sort", () => {
    render(<RecallSortSelect sortBy="patient" sortOrder="desc" onChange={() => {}} />);
    expect((screen.getByLabelText("Sort by") as HTMLSelectElement).value).toBe("patient-desc");
  });

  it("sets patient Z-A", () => {
    const onChange = vi.fn();
    render(<RecallSortSelect sortBy="date" sortOrder="asc" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "patient-desc" } });
    expect(onChange).toHaveBeenCalledWith("patient", "desc");
  });

  it("sets tentative date latest first", () => {
    const onChange = vi.fn();
    render(<RecallSortSelect sortBy="patient" sortOrder="asc" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "date-desc" } });
    expect(onChange).toHaveBeenCalledWith("date", "desc");
  });
});
