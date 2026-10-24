import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PatientSortSelect, { DEFAULT_PATIENT_SORTING } from "./PatientSortSelect";

describe("PatientSortSelect", () => {
  it("sorts by age, highest first, when 'Age (high–low)' is chosen", () => {
    const onChange = vi.fn();
    render(<PatientSortSelect sorting={DEFAULT_PATIENT_SORTING} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "age-desc" } });
    expect(onChange).toHaveBeenCalledWith([{ id: "age", desc: true }]);
  });

  it("restores the page's default order (newest added first)", () => {
    const onChange = vi.fn();
    render(<PatientSortSelect sorting={[{ id: "name", desc: false }]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "default" } });
    expect(onChange).toHaveBeenCalledWith([{ id: "created_at", desc: true }]);
  });

  it("shows the current table sorting", () => {
    render(<PatientSortSelect sorting={[{ id: "lastVisit", desc: false }]} onChange={() => {}} />);
    expect((screen.getByLabelText("Sort by") as HTMLSelectElement).value).toBe("lastVisit-asc");
  });
});
