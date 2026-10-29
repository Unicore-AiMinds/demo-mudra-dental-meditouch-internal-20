import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Enquiry } from "@/components/enquiries/enquiry";
import { formatDateForDisplay } from "@/utils/dateFormatter";
import EnquiryDetailsDialog, { EnquiryDetailsDialogProps } from "./EnquiryDetailsDialog";

const LONG_MESSAGE =
  "Hello, I have pain in my lower left tooth for two weeks and would like to book an RCT and crown. " +
  "Please call me after 6 pm on weekdays or any time on Saturday.";

const enquiry = (over: Partial<Enquiry> = {}): Enquiry => ({
  id: 4,
  name: "Test Convert Lead",
  email: "test.convert@example.com",
  phone: "+91 9812345678",
  service_inquiry: "RCT & Crown",
  message: LONG_MESSAGE,
  clinic: "dental_metrix",
  status: "contacted",
  submitted_at: "2026-10-05T10:13:00Z",
  updated_at: "2026-10-05T10:13:00Z",
  ...over,
});

const renderDialog = (props: Partial<EnquiryDetailsDialogProps> = {}) => {
  const h = { onStatusChange: vi.fn(), onConvert: vi.fn(), onClose: vi.fn() };
  render(
    <EnquiryDetailsDialog
      enquiry={enquiry()}
      isCompact={false}
      canChangeStatus
      canConvert
      updatingId={null}
      {...h}
      {...props}
    />
  );
  return h;
};

describe("EnquiryDetailsDialog", () => {
  it("shows every detail of the enquiry, with the full message", () => {
    renderDialog();
    expect(screen.getByText("Enquiry Details")).toBeTruthy();
    for (const label of ["Status", "Name", "Date", "Phone", "Email", "Service", "Message"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText("Test Convert Lead")).toBeTruthy();
    expect(screen.getByText(formatDateForDisplay("2026-10-05T10:13:00Z"))).toBeTruthy();
    expect(screen.getByText("+91 9812345678")).toBeTruthy();
    expect(screen.getByText("test.convert@example.com")).toBeTruthy();
    expect(screen.getByText("RCT & Crown")).toBeTruthy();
    const message = screen.getByText(LONG_MESSAGE);
    expect(message.className).toContain("whitespace-pre-wrap");
    expect(message.className).not.toContain("truncate");
  });

  it('shows "-" for a missing email and message', () => {
    renderDialog({ enquiry: enquiry({ email: "", message: null }) });
    expect(screen.getAllByText("-")).toHaveLength(2);
  });

  it("makes the phone number a call link on phones only", () => {
    renderDialog({ isCompact: true });
    expect(screen.getByRole("link", { name: "+91 9812345678" }).getAttribute("href")).toBe("tel:+919812345678");
  });

  it("shows the phone number as plain text on desktop", () => {
    renderDialog();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows the status drop-down with the current status", () => {
    renderDialog();
    expect(screen.getByRole("combobox").textContent).toContain("Contacted");
  });

  it("shows a coloured badge instead of the drop-down without permission", () => {
    renderDialog({ canChangeStatus: false });
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Contacted").className).toContain("bg-amber-100");
  });

  it("disables the drop-down while this enquiry is being saved", () => {
    renderDialog({ updatingId: 4 });
    expect(screen.getByRole("combobox").hasAttribute("disabled")).toBe(true);
  });

  it("calls Convert with the enquiry", () => {
    const h = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Convert/ }));
    expect(h.onConvert).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
  });

  it("hides Convert without patients.create", () => {
    renderDialog({ canConvert: false });
    expect(screen.queryByRole("button", { name: /Convert/ })).toBeNull();
  });

  it("closes with the Close button", () => {
    const h = renderDialog();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(h.onClose).toHaveBeenCalled();
  });

  it("is closed when no enquiry is selected", () => {
    renderDialog({ enquiry: null });
    expect(screen.queryByText("Enquiry Details")).toBeNull();
  });
});
