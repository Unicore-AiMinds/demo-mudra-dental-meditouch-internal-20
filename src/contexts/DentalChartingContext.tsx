import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ChartingEntry } from '@/types/dental-charting';
import { demoChartingHistory } from '@/data/demo-dental-charting';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDentalHistory } from './DentalHistoryContext';

// Update the ChartingEntry type to include scheduledAppointmentId and snoozedUntil
declare module '@/types/dental-charting' {
  interface ChartingEntry {
    scheduledAppointmentId?: string;
    snoozedUntil?: string;
  }
}

interface DentalChartingContextType {
  patientChartingHistory: ChartingEntry[];
  setPatientChartingHistory: React.Dispatch<React.SetStateAction<ChartingEntry[]>>;
  getPatientChartingHistory: (patientId: string) => ChartingEntry[];
  getPlannedChartingEntries: () => ChartingEntry[];
  getPatientName: (patientId: string) => string;
  updateChartingEntryStatus: (entryId: string, status: 'Scheduled' | 'Completed') => void;
  linkChartingEntryToAppointment: (entryId: string, appointmentId: string) => void;
  snoozeChartingEntry: (entryId: string, snoozeUntilDate: string, notes?: string) => void;
}

const DentalChartingContext = createContext<DentalChartingContextType | undefined>(undefined);

export const DentalChartingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patientChartingHistory, setPatientChartingHistory] = useState<ChartingEntry[]>(demoChartingHistory);
  const { toast } = useToast();
  const { getPatientName: getPatientNameFromHistory } = useDentalHistory();

  // Listen for the updateChartingEntryStatus event
  useEffect(() => {
    const handleUpdateChartingEntryStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{
        entryId: string;
        appointmentId: string;
        status: 'Scheduled' | 'Completed';
      }>;

      const { entryId, appointmentId, status } = customEvent.detail;

      // Update the charting entry status
      updateChartingEntryStatus(entryId, status);

      // Link the charting entry to the appointment
      linkChartingEntryToAppointment(entryId, appointmentId);
    };

    // Add event listener
    document.addEventListener('updateChartingEntryStatus', handleUpdateChartingEntryStatus);

    // Clean up
    return () => {
      document.removeEventListener('updateChartingEntryStatus', handleUpdateChartingEntryStatus);
    };
  }, []);

  // Get charting history for a specific patient
  const getPatientChartingHistory = (patientId: string): ChartingEntry[] => {
    return patientChartingHistory.filter(entry => entry.patientId === patientId);
  };

  // Get all planned charting entries that don't have appointments scheduled
  const getPlannedChartingEntries = (): ChartingEntry[] => {
    return patientChartingHistory.filter(entry =>
      entry.status === 'Planned' &&
      !entry.scheduledAppointmentId
    );
  };

  // Get patient name - fallback to using the dental history context
  const getPatientName = (patientId: string): string => {
    return getPatientNameFromHistory(patientId) || "Unknown Patient";
  };

  // Update a charting entry status
  const updateChartingEntryStatus = (entryId: string, status: 'Scheduled' | 'Completed') => {
    setPatientChartingHistory(prev =>
      prev.map(entry =>
        entry.entryId === entryId
          ? { ...entry, status }
          : entry
      )
    );

    // Show notification
    toast({
      title: `Treatment ${status}`,
      description: `The treatment has been marked as ${status.toLowerCase()}.`,
    });
  };

  // Link a charting entry to an appointment
  const linkChartingEntryToAppointment = (entryId: string, appointmentId: string) => {
    setPatientChartingHistory(prev =>
      prev.map(entry =>
        entry.entryId === entryId
          ? { ...entry, scheduledAppointmentId: appointmentId }
          : entry
      )
    );
  };

  // Snooze a charting entry
  const snoozeChartingEntry = (entryId: string, snoozeUntilDate: string, notes?: string) => {
    setPatientChartingHistory(prev =>
      prev.map(entry => {
        if (entry.entryId === entryId) {
          // Add snooze note to existing notes if provided
          const updatedNotes = notes
            ? `${entry.notes ? entry.notes + '\n' : ''}[Snoozed until ${snoozeUntilDate}]: ${notes}`
            : entry.notes;

          return {
            ...entry,
            snoozedUntil: snoozeUntilDate,
            notes: updatedNotes
          };
        }
        return entry;
      })
    );
  };

  return (
    <DentalChartingContext.Provider
      value={{
        patientChartingHistory,
        setPatientChartingHistory,
        getPatientChartingHistory,
        getPlannedChartingEntries,
        getPatientName,
        updateChartingEntryStatus,
        linkChartingEntryToAppointment,
        snoozeChartingEntry
      }}
      data-dental-charting-context
    >
      {children}
    </DentalChartingContext.Provider>
  );
};

export const useDentalCharting = (): DentalChartingContextType => {
  const context = useContext(DentalChartingContext);
  if (context === undefined) {
    throw new Error('useDentalCharting must be used within a DentalChartingProvider');
  }
  return context;
};
