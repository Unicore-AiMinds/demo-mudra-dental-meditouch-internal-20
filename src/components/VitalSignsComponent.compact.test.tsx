import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/contexts/VitalSignsContext", () => ({
  useVitalSigns: () => ({
    getPatientVitalSigns: async () => [
      { id: "v1", patientId: "p1", date: "2026-03-04T05:30:00", weight: "65", blood_pressure: "124/81", pulse: "79", temperature: "36.6", respiratory_rate: "15", notes: "test purpose" },
    ],
    addVitalSign: vi.fn(),
    updateVitalSign: vi.fn(),
    deleteVitalSign: vi.fn(),
  }),
}));
vi.mock("@/contexts/PermissionContext", () => ({ usePermissions: () => ({ hasPermission: () => true }) }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import VitalSignsComponent from "./VitalSignsComponent";

describe("VitalSignsComponent on a phone", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 400 });
  });

  it("uses the desktop column labels on the record card", async () => {
    render(<VitalSignsComponent patientId="p1" patientName="Test" />);
    expect(await screen.findByText("Weight (kg)")).toBeTruthy();
    for (const label of ["BP (mmHg)", "Pulse (bpm)", "Temp (°C)", "Resp Rate (breaths/min)"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});
