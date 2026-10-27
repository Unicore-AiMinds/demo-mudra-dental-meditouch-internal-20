import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Enquiry } from "@/components/enquiries/enquiry";
import StatusChangeDialog from "./StatusChangeDialog";

const enquiry: Enquiry = {
  id: 4,
  name: "Test Convert Lead",
  email: "test.convert@example.com",
  phone: "+91 9812345678",
  service_inquiry: "RCT & Crown",
  message: "Please call me to book.",
  clinic: "dental_metrix",
  status: "contacted",
  submitted_at: "2026-10-05T10:13:00Z",
  updated_at: "2026-10-05T10:13:00Z",
};

describe("StatusChangeDialog", () => {
  it("uses the ERP's status-change wording with the old and new status", () => {
    render(<StatusChangeDialog pending={{ enquiry, next: "follow-up" }} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Confirm Status Change")).toBeTruthy();
    expect(screen.getByText("Are you sure you want to update the status for this enquiry?")).toBeTruthy();
    expect(screen.getByText(/You are about to change the status from/).textContent).toBe(
      "You are about to change the status from Contacted to Follow-up."
    );
  });

  it("confirms with the enquiry and the new status", () => {
    const onConfirm = vi.fn();
    render(<StatusChangeDialog pending={{ enquiry, next: "follow-up" }} onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Update Status" }));
    expect(onConfirm).toHaveBeenCalledWith(enquiry, "follow-up");
  });

  it("cancels without confirming", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<StatusChangeDialog pending={{ enquiry, next: "closed" }} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("is closed when nothing is pending", () => {
    render(<StatusChangeDialog pending={null} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText("Confirm Status Change")).toBeNull();
  });
});
