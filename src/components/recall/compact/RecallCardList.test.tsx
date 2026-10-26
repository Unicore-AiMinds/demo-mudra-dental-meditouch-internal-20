import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { FollowUp } from "@/contexts/FollowUpContext";
import RecallCardList, { RecallCardListProps } from "./RecallCardList";

const followUp = (over: Partial<FollowUp> = {}): FollowUp => ({
  id: "f1",
  follow_up_id: "FU1",
  patient_id: "p1",
  patient_name: "Anjali Railkar",
  tentative_date: "2025-09-11",
  follow_up_sequence: 1,
  total_steps_in_sequence: 1,
  suggested_service_name: "PAIN FOLLOW UP",
  original_service: "Implant Placement",
  original_doctor: "Dr. Bhargavi Kolhapure",
  status: "Pending",
  ...over,
});

const handlers = () => ({
  onViewDetails: vi.fn(),
  onSchedule: vi.fn(),
  onSnooze: vi.fn(),
  onActivateEarly: vi.fn(),
  onActivate: vi.fn(),
  onDelete: vi.fn(),
});

const renderList = (props: Partial<RecallCardListProps> = {}) => {
  const h = handlers();
  render(
    <RecallCardList
      followUps={[followUp()]}
      activeTab="pending"
      activeClinic="dental"
      canDelete
      {...h}
      {...props}
    />
  );
  return h;
};

describe("RecallCardList", () => {
  it("pending tab shows Details, Schedule, Snooze and Delete, each calling its handler with the follow-up", () => {
    const h = renderList();
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Snooze" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    for (const fn of [h.onViewDetails, h.onSchedule, h.onSnooze, h.onDelete]) {
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
    }
    expect(screen.queryByRole("button", { name: /Activate/ })).toBeNull();
  });

  it("hides Delete without permission", () => {
    renderList({ canDelete: false });
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.getByRole("button", { name: "Schedule" })).toBeTruthy();
  });

  it("waiting tab shows Activate Early instead of Schedule and Snooze", () => {
    const h = renderList({ activeTab: "waiting", followUps: [followUp({ status: "Waiting" })] });
    expect(screen.queryByRole("button", { name: "Schedule" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Snooze" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Activate Early" }));
    expect(h.onActivateEarly).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  it("snoozed tab shows Activate and the snoozed-until line", () => {
    const h = renderList({ activeTab: "snoozed", followUps: [followUp({ status: "Snoozed", snoozed_until: "2026-04-25" })] });
    expect(screen.getByText("Snoozed until Apr 25, 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Activate" }));
    expect(h.onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
    expect(screen.queryByRole("button", { name: "Schedule" })).toBeNull();
  });

  it("pending card with snoozed_until does not show the snoozed line", () => {
    renderList({ followUps: [followUp({ snoozed_until: "2026-04-25" })] });
    expect(screen.queryByText(/Snoozed until/)).toBeNull();
  });

  it("shows Overdue only on the pending tab for past dates", () => {
    renderList();
    expect(screen.getByText("Sep 11, 2025")).toBeTruthy();
    expect(screen.getByText("Overdue")).toBeTruthy();
  });

  it("does not show Overdue for a future date", () => {
    renderList({ followUps: [followUp({ tentative_date: "2099-01-01" })] });
    expect(screen.queryByText("Overdue")).toBeNull();
  });

  it("does not show Overdue on the snoozed tab", () => {
    renderList({ activeTab: "snoozed", followUps: [followUp({ status: "Snoozed" })] });
    expect(screen.queryByText("Overdue")).toBeNull();
  });

  it("shows the Step badge only for a sequence", () => {
    renderList({ followUps: [followUp({ sequence_group_id: "g1", follow_up_sequence: 1, total_steps_in_sequence: 3 })] });
    expect(screen.getByText("Step 1/3")).toBeTruthy();
  });

  it("hides the Step badge without a sequence group", () => {
    renderList({ followUps: [followUp({ follow_up_sequence: 1, total_steps_in_sequence: 3 })] });
    expect(screen.queryByText(/Step 1\/3/)).toBeNull();
  });

  it("marks a waiting step in its badge", () => {
    renderList({ activeTab: "waiting", followUps: [followUp({ status: "Waiting", sequence_group_id: "g1", follow_up_sequence: 2, total_steps_in_sequence: 3 })] });
    expect(screen.getByText("Step 2/3 (Waiting)")).toBeTruthy();
  });

  it("uses the desktop column names as labels", () => {
    renderList();
    for (const label of ["Tentative Date", "Suggested Service", "Original Service", "Original Doctor", "Notes"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText("PAIN FOLLOW UP")).toBeTruthy();
    expect(screen.getByText("Implant Placement")).toBeTruthy();
    expect(screen.getByText("Dr. Bhargavi Kolhapure")).toBeTruthy();
  });

  it("colours Schedule with the dental colour", () => {
    renderList();
    expect(screen.getByRole("button", { name: "Schedule" }).className).toContain("text-dental-primary");
  });

  it("colours Schedule with the Meditouch colour", () => {
    renderList({ activeClinic: "meditouch" });
    expect(screen.getByRole("button", { name: "Schedule" }).className).toContain("text-meditouch-primary");
  });

  it('shows "-" when there is no note', () => {
    renderList();
    expect(screen.getByText("-")).toBeTruthy();
  });

  it('greys the "-" for a missing note, like desktop', () => {
    renderList();
    expect(screen.getByText("-").className).toContain("text-muted-foreground");
  });

  it("lets a long patient name wrap instead of pushing the card wider", () => {
    renderList({ followUps: [followUp({ patient_name: "Averyveryverylongpatientnamewithoutanyspaces" })] });
    expect(screen.getByText("Averyveryverylongpatientnamewithoutanyspaces").className).toContain("[overflow-wrap:anywhere]");
  });

  it("shows the note when there is one", () => {
    renderList({ followUps: [followUp({ special_notes: "Call after 10th" })] });
    expect(screen.getByText("Call after 10th")).toBeTruthy();
  });

  it("lets a short note without spaces wrap inside the card", () => {
    renderList({ followUps: [followUp({ special_notes: "https://example.com/note-123" })] });
    expect(screen.getByText("https://example.com/note-123").closest("div")!.className).toContain("[overflow-wrap:anywhere]");
  });
});
