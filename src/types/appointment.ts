// Define appointment types with references to follow-ups and dental charting

export interface BaseAppointment {
  id: string;
  time: string;
  patient: string;
  patientId: string; // Reference to patient ID
  service: string;
  date?: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  // Reference to follow-up that generated this appointment
  basedOnFollowUpId?: string;
  // Reference to dental charting entry that this appointment is for
  relatedToChartingEntryId?: string;
  // Notes about the appointment
  notes?: string;
}

export interface DentalAppointment extends BaseAppointment {
  doctor: string;
  secondPatient?: string;
  // Dental-specific fields
  treatmentType?: 'Initial' | 'Follow-up' | 'Emergency';
}

export interface MeditouchAppointment extends BaseAppointment {
  // Meditouch-specific fields
  therapist?: string;
  treatmentType?: 'Consultation' | 'Procedure' | 'Follow-up';
}

export type AppointmentType = DentalAppointment | MeditouchAppointment;

// Helper function to determine if an appointment is dental
export function isDentalAppointment(appointment: AppointmentType): appointment is DentalAppointment {
  return 'doctor' in appointment;
}

// Helper function to determine if an appointment is meditouch
export function isMeditouchAppointment(appointment: AppointmentType): appointment is MeditouchAppointment {
  return 'therapist' in appointment || !('doctor' in appointment);
}
