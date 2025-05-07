import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ChartingEntry, defaultChartingEntries } from '@/types/dental-charting';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDentalHistory } from './DentalHistoryContext';
import { useSupabase } from './SupabaseContext';
import { v4 as uuidv4 } from 'uuid';

interface DentalChartingContextType {
  patientChartingHistory: ChartingEntry[];
  getPatientChartingHistory: (patientId: string) => Promise<ChartingEntry[]>;
  getPlannedChartingEntries: () => Promise<ChartingEntry[]>;
  getPatientName: (patientId: string) => Promise<string>;
  updateChartingEntryStatus: (entryId: string, status: 'Scheduled' | 'Completed') => Promise<void>;
  linkChartingEntryToAppointment: (entryId: string, appointmentId: string) => Promise<void>;
  snoozeChartingEntry: (entryId: string, snoozeUntilDate: string, notes?: string) => Promise<void>;
  addChartingEntry: (entry: Omit<ChartingEntry, 'id' | 'entry_id' | 'created_at' | 'updated_at'>) => Promise<ChartingEntry>;
  isLoading: boolean;
}

const DentalChartingContext = createContext<DentalChartingContextType | undefined>(undefined);

export const DentalChartingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patientChartingHistory, setPatientChartingHistory] = useState<ChartingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { getPatientName: getPatientNameFromHistory } = useDentalHistory();
  const { supabase } = useSupabase();

  // Initialize dental charting entries from Supabase
  useEffect(() => {
    const initializeChartingEntries = async () => {
      try {
        setIsLoading(true);

        // Fetch charting entries from Supabase
        const fetchedEntries = await supabase.from<ChartingEntry>('dental_charting').getAll({
          order: { column: 'date_recorded', ascending: false }
        });

        // If no entries exist, create default ones
        if (fetchedEntries.length === 0) {
          // Create default entries
          for (const entry of defaultChartingEntries) {
            await supabase.from<ChartingEntry>('dental_charting').insert(entry);
          }

          // Fetch the newly created entries
          const newEntries = await supabase.from<ChartingEntry>('dental_charting').getAll({
            order: { column: 'date_recorded', ascending: false }
          });
          setPatientChartingHistory(newEntries);
        } else {
          setPatientChartingHistory(fetchedEntries);
        }
      } catch (error) {
        console.error('Error initializing dental charting entries:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dental charting entries. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChartingEntries();
  }, [supabase, toast]);

  // Listen for the updateChartingEntryStatus event
  useEffect(() => {
    const handleUpdateChartingEntryStatus = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        entryId: string;
        appointmentId: string;
        status: 'Scheduled' | 'Completed';
      }>;

      const { entryId, appointmentId, status } = customEvent.detail;

      try {
        // Update the charting entry status
        await updateChartingEntryStatus(entryId, status);

        // Link the charting entry to the appointment
        await linkChartingEntryToAppointment(entryId, appointmentId);
      } catch (error) {
        console.error('Error handling charting entry status update:', error);
      }
    };

    // Add event listener
    document.addEventListener('updateChartingEntryStatus', handleUpdateChartingEntryStatus);

    // Clean up
    return () => {
      document.removeEventListener('updateChartingEntryStatus', handleUpdateChartingEntryStatus);
    };
  }, []);

  // Add a new charting entry
  const addChartingEntry = async (
    entry: Omit<ChartingEntry, 'id' | 'entry_id' | 'created_at' | 'updated_at'>
  ): Promise<ChartingEntry> => {
    try {
      // Generate a unique entry ID
      const entryCount = await supabase.from<ChartingEntry>('dental_charting').getAll({ limit: 1000 });
      const entryId = `CE${String(entryCount.length + 1).padStart(3, '0')}`;

      // Create new entry with ID
      const newEntry = {
        entry_id: entryId,
        ...entry
      };

      // Add to Supabase
      const createdEntry = await supabase.from<ChartingEntry>('dental_charting').insert(newEntry);

      // Update local state
      setPatientChartingHistory(prev => [createdEntry, ...prev]);

      toast({
        title: 'Success',
        description: 'Dental charting entry added successfully.',
      });

      return createdEntry;
    } catch (error) {
      console.error('Error adding charting entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to add charting entry. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get charting history for a specific patient
  const getPatientChartingHistory = async (patientId: string): Promise<ChartingEntry[]> => {
    try {
      // Fetch directly from Supabase for the most up-to-date data
      const entries = await supabase.from<ChartingEntry>('dental_charting').getAll({
        filters: { patient_id: patientId },
        order: { column: 'date_recorded', ascending: false }
      });

      return entries;
    } catch (error) {
      console.error('Error fetching patient charting history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dental charting history. Please try again.',
        variant: 'destructive',
      });
      return patientChartingHistory.filter(entry => entry.patient_id === patientId);
    }
  };

  // Get all planned charting entries that don't have appointments scheduled
  const getPlannedChartingEntries = async (): Promise<ChartingEntry[]> => {
    try {
      // Fetch directly from Supabase for the most up-to-date data
      const entries = await supabase.from<ChartingEntry>('dental_charting').getAll({
        filters: { status: 'Planned' },
        order: { column: 'date_recorded', ascending: false }
      });

      // Filter out entries that already have appointments scheduled
      return entries.filter(entry => !entry.scheduled_appointment_id);
    } catch (error) {
      console.error('Error fetching planned charting entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch planned dental treatments. Please try again.',
        variant: 'destructive',
      });
      return patientChartingHistory.filter(entry =>
        entry.status === 'Planned' && !entry.scheduled_appointment_id
      );
    }
  };

  // Get patient name - fallback to using the dental history context
  const getPatientName = async (patientId: string): Promise<string> => {
    try {
      const name = await getPatientNameFromHistory(patientId);
      return name || "Unknown Patient";
    } catch (error) {
      console.error('Error fetching patient name:', error);
      return "Unknown Patient";
    }
  };

  // Update a charting entry status
  const updateChartingEntryStatus = async (entryId: string, status: 'Scheduled' | 'Completed'): Promise<void> => {
    try {
      // Find the entry to update
      const entry = patientChartingHistory.find(e => e.entry_id === entryId);

      if (!entry) {
        throw new Error('Charting entry not found');
      }

      // Update in Supabase
      await supabase.from<ChartingEntry>('dental_charting').update(entry.id, { status });

      // Update local state
      setPatientChartingHistory(prev =>
        prev.map(e =>
          e.entry_id === entryId
            ? { ...e, status }
            : e
        )
      );

      // Show notification
      toast({
        title: `Treatment ${status}`,
        description: `The treatment has been marked as ${status.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Error updating charting entry status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update treatment status. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Link a charting entry to an appointment
  const linkChartingEntryToAppointment = async (entryId: string, appointmentId: string): Promise<void> => {
    try {
      // Find the entry to update
      const entry = patientChartingHistory.find(e => e.entry_id === entryId);

      if (!entry) {
        throw new Error('Charting entry not found');
      }

      // Update in Supabase
      await supabase.from<ChartingEntry>('dental_charting').update(entry.id, {
        scheduled_appointment_id: appointmentId
      });

      // Update local state
      setPatientChartingHistory(prev =>
        prev.map(e =>
          e.entry_id === entryId
            ? { ...e, scheduled_appointment_id: appointmentId }
            : e
        )
      );

      toast({
        title: 'Success',
        description: 'Treatment linked to appointment successfully.',
      });
    } catch (error) {
      console.error('Error linking charting entry to appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to link treatment to appointment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Snooze a charting entry
  const snoozeChartingEntry = async (entryId: string, snoozeUntilDate: string, notes?: string): Promise<void> => {
    try {
      // Find the entry to update
      const entry = patientChartingHistory.find(e => e.entry_id === entryId);

      if (!entry) {
        throw new Error('Charting entry not found');
      }

      // Add snooze note to existing notes if provided
      const updatedNotes = notes
        ? `${entry.notes ? entry.notes + '\n' : ''}[Snoozed until ${snoozeUntilDate}]: ${notes}`
        : entry.notes;

      // Update in Supabase
      await supabase.from<ChartingEntry>('dental_charting').update(entry.id, {
        snoozed_until: snoozeUntilDate,
        notes: updatedNotes
      });

      // Update local state
      setPatientChartingHistory(prev =>
        prev.map(e => {
          if (e.entry_id === entryId) {
            return {
              ...e,
              snoozed_until: snoozeUntilDate,
              notes: updatedNotes
            };
          }
          return e;
        })
      );

      toast({
        title: 'Success',
        description: `Treatment snoozed until ${snoozeUntilDate}.`,
      });
    } catch (error) {
      console.error('Error snoozing charting entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to snooze treatment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <DentalChartingContext.Provider
      value={{
        patientChartingHistory,
        getPatientChartingHistory,
        getPlannedChartingEntries,
        getPatientName,
        updateChartingEntryStatus,
        linkChartingEntryToAppointment,
        snoozeChartingEntry,
        addChartingEntry,
        isLoading
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
