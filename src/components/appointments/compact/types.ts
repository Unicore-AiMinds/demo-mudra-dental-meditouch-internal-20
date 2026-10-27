import type { ComponentType } from 'react';
import type { DentalAppointment, MeditouchAppointment } from '@/contexts/AppointmentContext';

export type AppointmentType = DentalAppointment | MeditouchAppointment;
export type DoctorOption = { id: string; name: string; color?: string };

// Props of the appointment block components defined in pages/Appointments.tsx. They are
// passed in as props (not imported) so the compact views reuse the exact desktop blocks
// without a circular import.
export interface SlotAppointmentProps {
  appointment: AppointmentType;
  isDental: boolean;
  onClick: () => void;
  isCompact?: boolean;
  isMultiSlot?: boolean;
  isFirstSlot?: boolean;
  slotsOccupied?: number;
  doctorsList: DoctorOption[];
}

export interface CalendarItemProps {
  appointment: AppointmentType;
  isDental: boolean;
  onClick: () => void;
  isCompact?: boolean;
  doctorsList: DoctorOption[];
  getServiceDuration: (serviceName: string) => number;
}

export type SlotAppointmentComponent = ComponentType<SlotAppointmentProps>;
export type CalendarItemComponent = ComponentType<CalendarItemProps>;
