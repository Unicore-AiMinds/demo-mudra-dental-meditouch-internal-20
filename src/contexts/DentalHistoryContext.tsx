import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DentalHistoryEntry, TentativeFollowUp, ServiceWithFollowUp } from '../types/dental-history';
import { demoDentalHistory, initialTentativeFollowUps, demoServicesWithFollowUp } from '../data/demo-dental-history';
import { addDays, format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface DentalHistoryContextType {
  dentalHistory: Record<string, DentalHistoryEntry[]>;
  tentativeFollowUps: TentativeFollowUp[];
  servicesWithFollowUp: ServiceWithFollowUp[];
  getPatientHistory: (patientId: string) => DentalHistoryEntry[];
  updateServiceFollowUpConfig: (serviceId: number, config: Partial<ServiceWithFollowUp>) => void;
  markAppointmentCompleted: (
    appointmentId: string,
    patientId: string,
    patientName: string,
    service: string,
    doctor: string,
    date: string
  ) => void;
  updateFollowUpStatus: (followUpId: string, status: TentativeFollowUp['status']) => void;
  getPendingFollowUps: () => TentativeFollowUp[];
  // New functions for integration
  addTentativeFollowUps: (followUps: TentativeFollowUp[]) => void;
  getPatientName: (patientId: string) => string | undefined;
  getFollowUpsForChartingEntry: (chartingEntryId: string) => TentativeFollowUp[];
  linkFollowUpToAppointment: (followUpId: string, appointmentId: string) => void;
  // Functions for snoozing and notes
  snoozeFollowUp: (followUpId: string, snoozeUntilDate: string, notes?: string) => void;
  updateFollowUpNotes: (followUpId: string, notes: string) => void;
  getSnoozedFollowUps: () => TentativeFollowUp[];
}

const DentalHistoryContext = createContext<DentalHistoryContextType | undefined>(undefined);

export const DentalHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dentalHistory, setDentalHistory] = useState<Record<string, DentalHistoryEntry[]>>(demoDentalHistory);
  const [tentativeFollowUps, setTentativeFollowUps] = useState<TentativeFollowUp[]>(initialTentativeFollowUps);
  const [servicesWithFollowUp, setServicesWithFollowUp] = useState<ServiceWithFollowUp[]>(demoServicesWithFollowUp);
  const { toast } = useToast();

  // Get dental history for a specific patient
  const getPatientHistory = (patientId: string): DentalHistoryEntry[] => {
    return dentalHistory[patientId] || [];
  };

  // Update service follow-up configuration
  const updateServiceFollowUpConfig = (serviceId: number, config: Partial<ServiceWithFollowUp>) => {
    setServicesWithFollowUp(prevServices =>
      prevServices.map(service =>
        service.id === serviceId ? { ...service, ...config } : service
      )
    );
  };

  // Mark an appointment as completed and generate follow-up if needed
  const markAppointmentCompleted = (
    appointmentId: string,
    patientId: string,
    patientName: string,
    service: string,
    doctor: string,
    date: string
  ) => {
    // Find the service configuration
    const serviceConfig = servicesWithFollowUp.find(s => s.name === service);

    // Add to dental history
    const newHistoryEntry: DentalHistoryEntry = {
      appointmentId,
      patientId,
      date,
      service,
      doctor,
      procedurePerformedNotes: "Procedure completed successfully."
    };

    // Update dental history
    setDentalHistory(prev => {
      const patientHistory = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [...patientHistory, newHistoryEntry]
      };
    });

    // Check if follow-up is required
    if (serviceConfig && serviceConfig.requiresFollowUp && serviceConfig.defaultFollowUpIntervalDays > 0) {
      // Calculate tentative follow-up date
      const appointmentDate = new Date(date);
      const followUpDate = addDays(appointmentDate, serviceConfig.defaultFollowUpIntervalDays);
      const tentativeDate = format(followUpDate, 'yyyy-MM-dd');

      // Create follow-up
      const newFollowUp: TentativeFollowUp = {
        followUpId: `FU${Date.now()}`,
        patientId,
        patientName,
        basedOnAppointmentId: appointmentId,
        tentativeDate,
        followUpSequence: 1,
        totalStepsInSequence: serviceConfig.numberOfFollowUps || 1,
        suggestedServiceName: serviceConfig.followUpServiceName,
        originalService: service,
        originalDoctor: doctor,
        status: 'Pending'
      };

      // Add to tentative follow-ups
      setTentativeFollowUps(prev => [...prev, newFollowUp]);

      // Show toast notification
      toast({
        title: "Follow-up Reminder Created",
        description: `Follow-up reminder created for ${patientName} due around ${tentativeDate}.`,
      });
    }
  };

  // Add multiple tentative follow-ups (used by integration service)
  const addTentativeFollowUps = (followUps: TentativeFollowUp[]) => {
    if (followUps.length === 0) return;

    setTentativeFollowUps(prev => [...prev, ...followUps]);
  };

  // Get patient name from patient ID
  const getPatientName = (patientId: string): string | undefined => {
    // This is a simplified implementation - in a real app, you would look up the patient in a database
    const demoPatientNames: Record<string, string> = {
      'PT001': 'Aarav Sharma',
      'PT002': 'Priya Patel',
      'PT003': 'Vikram Singh',
      'PT004': 'Neha Kapoor',
      'PT005': 'Rajiv Malhotra',
      'PT006': 'Ananya Reddy',
      'PT007': 'Arjun Nair',
      'PT008': 'Divya Menon',
    };

    return demoPatientNames[patientId];
  };

  // Get follow-ups related to a specific charting entry
  const getFollowUpsForChartingEntry = (chartingEntryId: string): TentativeFollowUp[] => {
    return tentativeFollowUps.filter(
      followUp => followUp.basedOnChartingEntryId === chartingEntryId
    );
  };

  // Link a follow-up to an appointment
  const linkFollowUpToAppointment = (followUpId: string, appointmentId: string) => {
    setTentativeFollowUps(prev =>
      prev.map(followUp =>
        followUp.followUpId === followUpId
          ? {
              ...followUp,
              status: 'Scheduled',
              scheduledAppointmentId: appointmentId
            }
          : followUp
      )
    );
  };

  // Update follow-up status
  const updateFollowUpStatus = (followUpId: string, status: TentativeFollowUp['status']) => {
    setTentativeFollowUps(prev =>
      prev.map(followUp =>
        followUp.followUpId === followUpId ? { ...followUp, status } : followUp
      )
    );
  };

  // Snooze a follow-up until a specific date
  const snoozeFollowUp = (followUpId: string, snoozeUntilDate: string, notes?: string) => {
    // First, find the follow-up to be snoozed
    const followUpToSnooze = tentativeFollowUps.find(fu => fu.followUpId === followUpId);

    if (!followUpToSnooze) return;

    // Calculate the difference in days between original date and snooze date
    const originalDate = new Date(followUpToSnooze.tentativeDate);
    const snoozeDate = new Date(snoozeUntilDate);
    const daysDifference = Math.floor((snoozeDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));

    setTentativeFollowUps(prev => {
      return prev.map(followUp => {
        // If this is the follow-up to be snoozed
        if (followUp.followUpId === followUpId) {
          return {
            ...followUp,
            status: 'Snoozed',
            snoozedUntil: snoozeUntilDate,
            specialNotes: notes || followUp.specialNotes
          };
        }

        // If this is a subsequent step in the same sequence
        if (
          followUp.sequenceGroupId === followUpToSnooze.sequenceGroupId &&
          followUp.followUpSequence > followUpToSnooze.followUpSequence &&
          followUp.status === 'Pending'
        ) {
          // Calculate new date by adding the same number of days
          const currentDate = new Date(followUp.tentativeDate);
          const newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + daysDifference);

          return {
            ...followUp,
            tentativeDate: format(newDate, 'yyyy-MM-dd'),
            specialNotes: followUp.specialNotes ||
              `Rescheduled due to patient unavailability for step ${followUpToSnooze.followUpSequence}`
          };
        }

        // Otherwise, return the follow-up unchanged
        return followUp;
      });
    });
  };

  // Update special notes for a follow-up
  const updateFollowUpNotes = (followUpId: string, notes: string) => {
    setTentativeFollowUps(prev =>
      prev.map(followUp =>
        followUp.followUpId === followUpId
          ? { ...followUp, specialNotes: notes }
          : followUp
      )
    );
  };

  // Get pending follow-ups
  const getPendingFollowUps = (): TentativeFollowUp[] => {
    return tentativeFollowUps.filter(followUp => followUp.status === 'Pending');
  };

  // Get snoozed follow-ups
  const getSnoozedFollowUps = (): TentativeFollowUp[] => {
    return tentativeFollowUps.filter(followUp => followUp.status === 'Snoozed');
  };

  return (
    <DentalHistoryContext.Provider
      value={{
        dentalHistory,
        tentativeFollowUps,
        servicesWithFollowUp,
        getPatientHistory,
        updateServiceFollowUpConfig,
        markAppointmentCompleted,
        updateFollowUpStatus,
        getPendingFollowUps,
        // New functions for integration
        addTentativeFollowUps,
        getPatientName,
        getFollowUpsForChartingEntry,
        linkFollowUpToAppointment,
        // New functions for snoozing and notes
        snoozeFollowUp,
        updateFollowUpNotes,
        getSnoozedFollowUps
      }}
    >
      {children}
    </DentalHistoryContext.Provider>
  );
};

export const useDentalHistory = (): DentalHistoryContextType => {
  const context = useContext(DentalHistoryContext);
  if (context === undefined) {
    throw new Error('useDentalHistory must be used within a DentalHistoryProvider');
  }
  return context;
};
