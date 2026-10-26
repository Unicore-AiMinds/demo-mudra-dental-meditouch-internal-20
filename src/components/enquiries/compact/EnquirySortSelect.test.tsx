import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EnquirySortSelect from "./EnquirySortSelect";

describe("EnquirySortSelect", () => {
  it("lists the 8 sort choices in order", () => {
    render(<EnquirySortSelect sortField="submitted_at" sortDirection="desc" onChange={() => {}} />);
    expect(screen.getAllByRole("option").map(o => o.textContent)).toEqual([
      "Date (Newest First)",
      "Date (Oldest First)",
      "Name (A-Z)",
      "Name (Z-A)",
      "Service (A-Z)",
      "Service (Z-A)",
      "Status (A-Z)",
      "Status (Z-A)",
    ]);
  });

  it("shows the current sort", () => {
    render(<EnquirySortSelect sortField="name" sortDirection="desc" onChange={() => {}} />);
    expect((screen.getByLabelText("Sort by") as HTMLSelectElement).value).toBe("name-desc");
  });

  it("sets status A-Z", () => {
    const onChange = vi.fn();
    render(<EnquirySortSelect sortField="submitted_at" sortDirection="desc" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "status-asc" } });
    expect(onChange).toHaveBeenCalledWith("status", "asc");
  });

  it("sets date oldest first", () => {
    const onChange = vi.fn();
    render(<EnquirySortSelect sortField="name" sortDirection="asc" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "submitted_at-asc" } });
    expect(onChange).toHaveBeenCalledWith("submitted_at", "asc");
  });
});
