import { ChartingEntry } from "@/types/dental-charting";
import { TentativeFollowUp, ServiceFollowUpRule } from "@/types/dental-history";
import { AppointmentType, DentalAppointment } from "@/types/appointment";
import { format, addDays } from "date-fns";

// Mock service follow-up rules
const serviceFollowUpRules: ServiceFollowUpRule[] = [
  {
    ruleId: "rule1",
    triggeringServiceName: "Root Canal",
    followUps: [
      {
        sequence: 1,
        intervalDays: 7,
        suggestedServiceName: "Root Canal Check",
        notes: "Check for healing and any complications"
      },
      {
        sequence: 2,
        intervalDays: 30,
        suggestedServiceName: "Crown Consultation",
        notes: "Evaluate for permanent crown"
      }
    ]
  },
  {
    ruleId: "rule2",
    triggeringServiceName: "Composite Filling",
    followUps: [
      {
        sequence: 1,
        intervalDays: 14,
        suggestedServiceName: "Filling Check",
        notes: "Check filling integrity and occlusion"
      }
    ]
  },
  {
    ruleId: "rule3",
    triggeringServiceName: "Extraction",
    followUps: [
      {
        sequence: 1,
        intervalDays: 7,
        suggestedServiceName: "Post-Extraction Check",
        notes: "Check healing and remove sutures if needed"
      },
      {
        sequence: 2,
        intervalDays: 90,
        suggestedServiceName: "Replacement Options",
        notes: "Discuss tooth replacement options"
      }
    ]
  }
];

/**
 * Generate follow-ups based on a dental charting entry
 */
export function generateFollowUpsFromChartingEntry(
  chartingEntry: ChartingEntry | any, // Accept any to handle both field naming conventions
  patientName: string
): TentativeFollowUp[] {
  // Handle both field naming conventions
  const status = chartingEntry.status;
  const service = chartingEntry.service;
  const entryId = chartingEntry.entry_id || chartingEntry.entryId;
  const dateRecorded = chartingEntry.date_recorded || chartingEntry.dateRecorded;
  const patientId = chartingEntry.patient_id || chartingEntry.patientId;
  const notes = chartingEntry.notes;

  // Only generate follow-ups for planned treatments
  if (status !== 'Planned') {
    return [];
  }

  // Find matching service follow-up rule
  if (!service) {
    return [];
  }

  const matchingRule = serviceFollowUpRules.find(
    rule => rule.triggeringServiceName.toLowerCase() === service.toLowerCase()
  );

  if (!matchingRule) {
    return [];
  }

  // Generate a sequence group ID for related follow-ups
  const sequenceGroupId = `seq-${entryId}-${Date.now()}`;

  // Create follow-ups based on the rule
  return matchingRule.followUps.map(step => {
    const followUpDate = addDays(new Date(dateRecorded), step.intervalDays);

    return {
      follow_up_id: `fu-${entryId}-${step.sequence}-${Date.now()}`,
      patient_id: patientId,
      patient_name: patientName,
      based_on_appointment_id: "", // Will be filled when the treatment is performed
      based_on_charting_entry_id: entryId,
      tentative_date: format(followUpDate, 'yyyy-MM-dd'),
      follow_up_sequence: step.sequence,
      total_steps_in_sequence: matchingRule.followUps.length,
      sequence_group_id: sequenceGroupId,
      suggested_service_name: step.suggestedServiceName,
      original_service: service || '',
      original_doctor: "", // Will be filled when the treatment is performed
      status: 'Pending',
      follow_up_type: 'Treatment',
      special_notes: notes // Pass any notes from the charting entry to the follow-up
    };
  });
}

/**
 * Generate follow-ups based on a completed appointment
 */
export function generateFollowUpsFromAppointment(
  appointment: AppointmentType,
  relatedChartingEntryId?: string
): TentativeFollowUp[] {
  // Only generate follow-ups for completed appointments
  if (appointment.status !== 'completed') {
    return [];
  }

  // Find matching service follow-up rule
  const matchingRule = serviceFollowUpRules.find(
    rule => rule.triggeringServiceName.toLowerCase() === appointment.service.toLowerCase()
  );

  if (!matchingRule) {
    return [];
  }

  // Generate a sequence group ID for related follow-ups
  const sequenceGroupId = `seq-${appointment.id}-${Date.now()}`;

  // Create follow-ups based on the rule
  return matchingRule.followUps.map(step => {
    const appointmentDate = appointment.date
      ? new Date(appointment.date)
      : new Date();
    const followUpDate = addDays(appointmentDate, step.intervalDays);

    return {
      followUpId: `fu-${appointment.id}-${step.sequence}-${Date.now()}`,
      patientId: appointment.patientId,
      patientName: appointment.patient,
      basedOnAppointmentId: appointment.id,
      basedOnChartingEntryId: relatedChartingEntryId,
      tentativeDate: format(followUpDate, 'yyyy-MM-dd'),
      followUpSequence: step.sequence,
      totalStepsInSequence: matchingRule.followUps.length,
      sequenceGroupId,
      suggestedServiceName: step.suggestedServiceName,
      originalService: appointment.service,
      originalDoctor: 'doctor' in appointment ? appointment.doctor : "",
      status: 'Pending',
      followUpType: 'Check',
      specialNotes: appointment.notes // Pass any notes from the appointment to the follow-up
    };
  });
}

/**
 * Create an appointment from a follow-up
 */
export function createAppointmentFromFollowUp(
  followUp: TentativeFollowUp,
  time: string,
  doctor: string
): DentalAppointment {
  return {
    id: `appt-${followUp.followUpId}-${Date.now()}`,
    patientId: followUp.patientId,
    patient: followUp.patientName,
    service: followUp.suggestedServiceName,
    time,
    date: followUp.tentativeDate,
    status: 'confirmed',
    doctor,
    basedOnFollowUpId: followUp.followUpId,
    relatedToChartingEntryId: followUp.basedOnChartingEntryId,
    treatmentType: 'Follow-up',
    notes: `Follow-up for ${followUp.originalService} (${followUp.followUpSequence} of ${followUp.totalStepsInSequence})`
  };
}

/**
 * Update a charting entry when an appointment is completed
 */
export function updateChartingEntryFromAppointment(
  chartingEntry: ChartingEntry,
  appointment: AppointmentType,
  completionEntryId: string
): ChartingEntry {
  // If this is a planned treatment being completed
  if (chartingEntry.status === 'Planned') {
    return {
      ...chartingEntry,
      status: 'Completed',
      completedByEntryId: completionEntryId
    };
  }

  return chartingEntry;
}

/**
 * Create a completion charting entry when an appointment is completed
 */
export function createCompletionChartingEntry(
  originalEntry: ChartingEntry,
  appointment: AppointmentType
): ChartingEntry {
  const completionEntryId = `ce-completion-${originalEntry.entryId}-${Date.now()}`;

  return {
    entryId: completionEntryId,
    patientId: originalEntry.patientId,
    dateRecorded: appointment.date || format(new Date(), 'yyyy-MM-dd'),
    toothNumbers: originalEntry.toothNumbers,
    surfaces: originalEntry.surfaces,
    service: originalEntry.service,
    status: 'Completed',
    notes: `Completed treatment. Original plan: ${originalEntry.notes || 'No notes'}`,
    completesEntryId: originalEntry.entryId
  };
}

/**
 * Update a follow-up when an appointment is scheduled for it
 */
export function updateFollowUpWithAppointment(
  followUp: TentativeFollowUp,
  appointmentId: string
): TentativeFollowUp {
  return {
    ...followUp,
    status: 'Scheduled',
    scheduledAppointmentId: appointmentId
  };
}

/**
 * Update a follow-up when its appointment is completed
 */
export function updateFollowUpAfterAppointmentCompletion(
  followUp: TentativeFollowUp
): TentativeFollowUp {
  return {
    ...followUp,
    status: 'Completed'
  };
}

/**
 * Find all follow-ups related to a charting entry
 */
export function findFollowUpsForChartingEntry(
  chartingEntryId: string,
  allFollowUps: TentativeFollowUp[]
): TentativeFollowUp[] {
  return allFollowUps.filter(
    followUp => followUp.basedOnChartingEntryId === chartingEntryId
  );
}

/**
 * Find the charting entry related to a follow-up
 */
export function findChartingEntryForFollowUp(
  followUp: TentativeFollowUp,
  allChartingEntries: ChartingEntry[]
): ChartingEntry | undefined {
  return followUp.basedOnChartingEntryId
    ? allChartingEntries.find(entry => entry.entryId === followUp.basedOnChartingEntryId)
    : undefined;
}

/**
 * Find the appointment related to a follow-up
 */
export function findAppointmentForFollowUp(
  followUp: TentativeFollowUp,
  allAppointments: AppointmentType[]
): AppointmentType | undefined {
  return followUp.scheduledAppointmentId
    ? allAppointments.find(appt => appt.id === followUp.scheduledAppointmentId)
    : undefined;
}
