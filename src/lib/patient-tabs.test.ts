import { describe, it, expect } from "vitest";
import { getVisiblePatientTabs } from "./patient-tabs";

const all = () => true;
const values = (tabs: { value: string }[]) => tabs.map(t => t.value);

describe("getVisiblePatientTabs", () => {
  it("lists all 6 tabs in desktop order for a 'both' patient", () => {
    const tabs = getVisiblePatientTabs("both", all);
    expect(values(tabs)).toEqual(["overview", "appointments", "dental-charting", "appointment-history", "prescriptions", "vital-signs"]);
    expect(tabs.map(t => t.label)).toEqual(["Patient Info", "Appointments", "Dental Charting", "Appointment History", "Prescriptions", "Vital Signs"]);
  });

  it("calls the history tab 'Dental History' for a dental-only patient", () => {
    const history = getVisiblePatientTabs("dental", all).find(t => t.value === "appointment-history");
    expect(history?.label).toBe("Dental History");
  });

  it("has no Dental Charting for a Meditouch-only patient", () => {
    expect(values(getVisiblePatientTabs("meditouch", all))).not.toContain("dental-charting");
  });

  it("hides a tab the user has no permission for", () => {
    const tabs = getVisiblePatientTabs("both", p => p !== "patients.view_prescriptions");
    expect(values(tabs)).not.toContain("prescriptions");
  });
});
