import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Enquiry } from "@/components/enquiries/enquiry";
import { formatDateForDisplay } from "@/utils/dateFormatter";
import EnquiryCardList, { EnquiryCardListProps } from "./EnquiryCardList";

const enquiry = (over: Partial<Enquiry> = {}): Enquiry => ({
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
  ...over,
});

const renderList = (props: Partial<EnquiryCardListProps> = {}) => {
  const h = { onStatusChange: vi.fn(), onView: vi.fn(), onConvert: vi.fn(), onDelete: vi.fn() };
  render(
    <EnquiryCardList
      enquiries={[enquiry()]}
      canChangeStatus
      canConvert
      canDelete
      updatingId={null}
      {...h}
      {...props}
    />
  );
  return h;
};

describe("EnquiryCardList", () => {
  it("shows the desktop column names with the enquiry's values", () => {
    renderList();
    for (const label of ["Date", "Phone", "Email", "Service", "Message", "Status"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText("Test Convert Lead")).toBeTruthy();
    expect(screen.getByText(formatDateForDisplay("2026-10-05T10:13:00Z"))).toBeTruthy();
    expect(screen.getByText("test.convert@example.com")).toBeTruthy();
    expect(screen.getByText("RCT & Crown")).toBeTruthy();
    expect(screen.getByText("Please call me to book.")).toBeTruthy();
  });

  it("makes the phone number a call link", () => {
    renderList();
    const link = screen.getByRole("link", { name: "+91 9812345678" });
    expect(link.getAttribute("href")).toBe("tel:+919812345678");
  });

  it("shows no call link without a phone number", () => {
    renderList({ enquiries: [enquiry({ phone: "" })] });
    expect(screen.queryByRole("link")).toBeNull();
  });

  it('shows "-" for a missing email and message', () => {
    renderList({ enquiries: [enquiry({ email: "", message: null })] });
    expect(screen.getAllByText("-")).toHaveLength(2);
  });

  it("shows the status drop-down with the current status", () => {
    renderList();
    expect(screen.getByRole("combobox").textContent).toContain("Contacted");
  });

  it("shows a coloured badge instead of the drop-down without permission", () => {
    renderList({ canChangeStatus: false });
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Contacted").className).toContain("bg-amber-100");
  });

  it("disables only the drop-down of the enquiry being saved", () => {
    renderList({ enquiries: [enquiry({ id: 4 }), enquiry({ id: 5, name: "Other Lead" })], updatingId: 4 });
    const [first, second] = screen.getAllByRole("combobox");
    expect(first.hasAttribute("disabled")).toBe(true);
    expect(second.hasAttribute("disabled")).toBe(false);
  });

  it("calls Convert and Delete with the enquiry", () => {
    const h = renderList();
    fireEvent.click(screen.getByRole("button", { name: /Convert/ }));
    fireEvent.click(screen.getByRole("button", { name: "Delete enquiry" }));
    expect(h.onConvert).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
    expect(h.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
  });

  it("hides Convert without patients.create and Delete without enquiries.delete", () => {
    renderList({ canConvert: false });
    expect(screen.queryByRole("button", { name: /Convert/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Delete enquiry" })).toBeTruthy();
  });

  it("opens View with the enquiry", () => {
    const h = renderList();
    fireEvent.click(screen.getByRole("button", { name: /View/ }));
    expect(h.onView).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
  });

  it("still shows View without Convert and Delete permissions", () => {
    renderList({ canConvert: false, canDelete: false });
    expect(screen.getByRole("button", { name: /View/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Convert/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete enquiry" })).toBeNull();
  });

  it("lets long names and emails wrap", () => {
    renderList({ enquiries: [enquiry({ name: "Averyveryverylongleadnamewithoutspaces", email: "averyveryverylongemailaddress@example.com" })] });
    expect(screen.getByText("Averyveryverylongleadnamewithoutspaces").className).toContain("[overflow-wrap:anywhere]");
    expect(screen.getByText("averyveryverylongemailaddress@example.com").className).toContain("[overflow-wrap:anywhere]");
  });

  it("lets a short message without spaces wrap inside the card", () => {
    renderList({ enquiries: [enquiry({ message: "https://example.com/book-now-page-123" })] });
    expect(screen.getByText("https://example.com/book-now-page-123").closest("div")!.className).toContain("[overflow-wrap:anywhere]");
  });
});
