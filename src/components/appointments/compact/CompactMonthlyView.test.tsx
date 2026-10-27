import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from "date-fns";
import CompactMonthlyView from "./CompactMonthlyView";
import type { AppointmentType, CalendarItemProps } from "./types";

const feb = new Date(2026, 1, 12);
const monthDates = eachDayOfInterval({ start: startOfMonth(feb), end: endOfMonth(feb) });

const tenOn12th = Array.from({ length: 10 }, (_, i) => ({
  id: `a${i}`,
  patient_name: `Patient ${i}`,
  service: `Service ${i}`,
  time: "1:00 PM",
  date: "2026-02-12",
  status: "confirmed",
})) as unknown as AppointmentType[];

const Item = ({ appointment }: CalendarItemProps) => <div data-testid="item">{appointment.patient_name}</div>;

const renderMonth = () =>
  render(
    <CompactMonthlyView
      isDental
      date={feb}
      monthDates={monthDates}
      doctors={[]}
      getAppointmentsForDate={(d) => (format(d, "yyyy-MM-dd") === "2026-02-12" ? tenOn12th : [])}
      getServiceDuration={() => 15}
      onOpenDay={() => {}}
      onEditAppointment={() => {}}
      CalendarItem={Item}
    />
  );

describe("CompactMonthlyView", () => {
  it("shows 3 appointments and '+7 more' after tapping a day with 10", () => {
    renderMonth();
    fireEvent.click(screen.getByRole("button", { name: /^12/ }));
    expect(screen.getAllByTestId("item")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "+7 more" })).toBeTruthy();
  });

  it("shows all 10 and 'Collapse' after tapping '+7 more'", () => {
    renderMonth();
    fireEvent.click(screen.getByRole("button", { name: /^12/ }));
    fireEvent.click(screen.getByRole("button", { name: "+7 more" }));
    expect(screen.getAllByTestId("item")).toHaveLength(10);
    expect(screen.getByRole("button", { name: "Collapse" })).toBeTruthy();
  });
});
