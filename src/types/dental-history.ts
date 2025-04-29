// Dental History and Follow-up Types

export interface DentalHistoryEntry {
  appointmentId: string;
  patientId: string;
  date: string; // YYYY-MM-DD format
  service: string;
  doctor: string;
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
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
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
