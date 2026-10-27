import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Stable references: the component re-runs effects when these arrays change identity
const data = vi.hoisted(() => ({
  appointments: {
    dentalAppointments: [
      { id: "a1", patient_id: "p1", patient_name: "Sapna Kusurkar", date: "2025-08-14", time: "5:00 PM", service: "Jig Trial", doctor: "Dr. Bhargavi Kolhapure", status: "confirmed", clinic_type: "dental" },
    ],
    meditouchAppointments: [],
  },
  patients: { patients: [{ id: "p1", phone: "9822775164" }] },
  doctors: { doctors: [] },
}));
vi.mock("@/contexts/AppointmentContext", () => ({ useAppointments: () => data.appointments }));
vi.mock("@/contexts/PatientContext", () => ({ usePatients: () => data.patients }));
vi.mock("@/contexts/ClinicContext", () => ({ useClinic: () => ({ activeClinic: "dental" }) }));
vi.mock("@/contexts/DoctorContext", () => ({ useDoctors: () => data.doctors }));

import AppointmentList from "./AppointmentList";

describe("AppointmentList on a phone", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 400 });
  });

  it("labels the phone field with the desktop column name", () => {
    render(<AppointmentList />);
    fireEvent.click(screen.getByText(/Appointment List \(/));
    expect(screen.getByText("Phone Number")).toBeTruthy();
    expect(screen.getByText("9822775164")).toBeTruthy();
  });
});
