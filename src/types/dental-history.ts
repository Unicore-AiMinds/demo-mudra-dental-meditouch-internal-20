// Dental History and Follow-up Types

export interface DentalHistoryEntry {
  appointmentId: string;
  patientId: string;
  date: string; // YYYY-MM-DD format
  service: string;
  doctor: string;
  paymentStatus?: 'paid' | 'unpaid';
  diagnosisNotes?: string;
  treatmentPlanSuggested?: string;
  procedurePerformedNotes?: string;
}

export interface TentativeFollowUp {
  followUpId: string;
  patientId: string;
  patientName: string;
  basedOnAppointmentId: string;
  tentativeDate: string; // YYYY-MM-DD format
  followUpSequence: number;
  totalStepsInSequence: number; // Total number of steps in this follow-up sequence
  sequenceGroupId?: string; // ID to group related follow-ups in the same sequence
  suggestedServiceName: string;
  originalService: string;
  originalDoctor: string;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Snoozed';
  // Reference to the dental charting entry that generated this follow-up
  basedOnChartingEntryId?: string;
  // Reference to the appointment scheduled for this follow-up
  scheduledAppointmentId?: string;
  // Type of follow-up (for filtering and display purposes)
  followUpType?: 'Treatment' | 'Check' | 'Maintenance';
  // Special notes for staff about patient availability
  specialNotes?: string;
  // If snoozed, the date until which it's snoozed
  snoozedUntil?: string; // YYYY-MM-DD format
}

export interface ServiceWithFollowUp {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
  requiresFollowUp: boolean;
  defaultFollowUpIntervalDays: number;
  numberOfFollowUps: number;
  followUpServiceName: string;
}

// Define the structure for a follow-up step
export interface FollowUpStep {
  sequence: number; // 1, 2, 3...
  intervalDays: number;
  suggestedServiceName: string;
  notes?: string;
}

// Define the structure for a service follow-up rule
export interface ServiceFollowUpRule {
  ruleId: string; // Unique ID
  triggeringServiceName: string; // Matches a name in the Services list
  followUps: FollowUpStep[];
}
