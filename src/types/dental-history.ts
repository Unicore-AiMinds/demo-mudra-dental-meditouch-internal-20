// Dental History and Follow-up Types

export interface DentalHistoryEntry {
  id: string;
  appointment_id: string;
  patient_id: string;
  date: string; // YYYY-MM-DD format
  service: string;
  doctor: string;
  payment_status?: 'paid' | 'unpaid';
  diagnosis_notes?: string;
  treatment_plan_suggested?: string;
  procedure_performed_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TentativeFollowUp {
  id: string;
  follow_up_id: string;
  patient_id: string;
  patient_name: string;
  based_on_appointment_id: string;
  tentative_date: string; // YYYY-MM-DD format
  follow_up_sequence: number;
  total_steps_in_sequence: number; // Total number of steps in this follow-up sequence
  sequence_group_id?: string; // ID to group related follow-ups in the same sequence
  suggested_service_name: string;
  original_service: string;
  original_doctor: string;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Snoozed';
  // Reference to the dental charting entry that generated this follow-up
  based_on_charting_entry_id?: string;
  // Reference to the appointment scheduled for this follow-up
  scheduled_appointment_id?: string;
  // Type of follow-up (for filtering and display purposes)
  follow_up_type?: 'Treatment' | 'Check' | 'Maintenance';
  // Special notes for staff about patient availability
  special_notes?: string;
  // If snoozed, the date until which it's snoozed
  snoozed_until?: string; // YYYY-MM-DD format
  created_at?: string;
  updated_at?: string;
}

export interface ServiceWithFollowUp {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  requires_follow_up: boolean;
  default_follow_up_interval_days: number;
  number_of_follow_ups: number;
  follow_up_service_name: string;
  created_at?: string;
  updated_at?: string;
}

// Define the structure for a follow-up step
export interface FollowUpStep {
  id?: string;
  service_follow_up_rule_id?: string;
  follow_up_service_id?: string;
  sequence: number; // 1, 2, 3...
  interval_days: number;
  suggested_service_name: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the structure for a service follow-up rule
export interface ServiceFollowUpRule {
  id: string;
  rule_id: string; // Unique ID
  service_id?: string;
  triggering_service_name: string; // Matches a name in the Services list
  followUps: FollowUpStep[];
  created_at?: string;
  updated_at?: string;
}

// Default dental history entries for initialization
export const defaultDentalHistoryEntries = [
  {
    appointment_id: "d101",
    patient_id: "PT001",
    date: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0], // 6 months ago
    service: "General Checkup",
    doctor: "Dr. Khanna",
    payment_status: "paid" as const,
    diagnosis_notes: "Patient has mild gingivitis and early signs of plaque buildup.",
    treatment_plan_suggested: "Regular cleaning and improved brushing technique.",
    procedure_performed_notes: "Completed full dental examination and cleaning."
  },
  {
    appointment_id: "d901",
    patient_id: "PT009",
    date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // 1 month ago
    service: "Pediatric Dental Checkup",
    doctor: "Dr. Patel",
    payment_status: "paid" as const,
    diagnosis_notes: "First dental visit. Patient has early caries on primary molars.",
    treatment_plan_suggested: "Composite fillings for affected teeth and preventive sealants.",
    procedure_performed_notes: "Completed examination and took intraoral photographs. Patient was cooperative."
  }
];

// Default follow-ups for initialization
export const defaultFollowUps = [
  {
    follow_up_id: 'fu1',
    patient_id: 'PT001',
    patient_name: 'Aarav Sharma',
    based_on_appointment_id: 'd101',
    tentative_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0], // 6 months from now
    follow_up_sequence: 1,
    total_steps_in_sequence: 1,
    sequence_group_id: 'seq1',
    suggested_service_name: 'General Checkup',
    original_service: 'General Checkup',
    original_doctor: 'Dr. Khanna',
    status: 'Pending' as const
  },
  {
    follow_up_id: 'fu2',
    patient_id: 'PT009',
    patient_name: 'Riya Sharma',
    based_on_appointment_id: 'd901',
    tentative_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0], // 3 months from now
    follow_up_sequence: 1,
    total_steps_in_sequence: 1,
    sequence_group_id: 'seq2',
    suggested_service_name: 'Pediatric Dental Checkup',
    original_service: 'Pediatric Dental Checkup',
    original_doctor: 'Dr. Patel',
    status: 'Pending' as const
  }
];

// Default service follow-up rules for initialization
export const defaultServiceWithFollowUp = [
  {
    name: "General Checkup",
    duration: 30,
    price: 500,
    description: "Comprehensive dental examination and consultation",
    requires_follow_up: true,
    default_follow_up_interval_days: 180, // 6 months
    number_of_follow_ups: 1,
    follow_up_service_name: "General Checkup"
  },
  {
    name: "Pediatric Dental Checkup",
    duration: 45,
    price: 800,
    description: "Child-friendly comprehensive dental examination and consultation",
    requires_follow_up: true,
    default_follow_up_interval_days: 90, // 3 months for children
    number_of_follow_ups: 1,
    follow_up_service_name: "Pediatric Dental Checkup"
  },
  {
    name: "Root Canal Treatment",
    duration: 60,
    price: 5000,
    description: "Treatment for infected tooth pulp",
    requires_follow_up: true,
    default_follow_up_interval_days: 7, // 1 week
    number_of_follow_ups: 2,
    follow_up_service_name: "Root Canal Follow-up"
  }
];
