import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ChartingEntry, defaultChartingEntries } from '@/types/dental-charting';
import { useToast } from '@/hooks/use-toast';
import { useDentalHistory } from './DentalHistoryContext';
import { useSupabase } from './SupabaseContext';
import { handleDatabaseError } from '@/utils/error-handler';

// Define Supabase constants
const SUPABASE_URL = 'https://otvhtpnmunoazgqhennu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dmh0cG5tdW5vYXpncWhlbm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDEwMTAsImV4cCI6MjA2MjE3NzAxMH0.TeZa-YGzfToszrWrMomsjw3R9mRxFR-7NE7sNLFi9JM';

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
        // Use the global error handler
        handleDatabaseError({
          error,
          toast,
          errorKey: 'dental_charting_init_error',
          customMessage: 'Dental charting data will be available after setup is complete.',
          showToast: true
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

      console.log(`Received updateChartingEntryStatus event: entryId=${entryId}, appointmentId=${appointmentId}, status=${status}`);

      try {
        // First, fetch the latest charting entries to ensure we have the most up-to-date data
        console.log('Fetching latest charting entries before updating status');
        const latestEntries = await supabase.from<ChartingEntry>('dental_charting').getAll();
        setPatientChartingHistory(latestEntries);

        // Find the entry to update in the latest data
        const entryToUpdate = latestEntries.find(e => e.entry_id === entryId);

        if (!entryToUpdate) {
          console.error(`Charting entry with ID ${entryId} not found in latest data`);
          // Try to find by ID instead of entry_id as a fallback
          const entryById = latestEntries.find(e => e.id === entryId);
          if (entryById) {
            console.log(`Found entry by ID instead: ${entryById.entry_id}`);
            // Update using the entry_id we found
            await updateChartingEntryStatus(entryById.entry_id, status);
            await linkChartingEntryToAppointment(entryById.entry_id, appointmentId);
          } else {
            throw new Error(`Charting entry with ID ${entryId} not found`);
          }
        } else {
          console.log(`Found charting entry to update: ${entryToUpdate.entry_id}`);
          // Update the charting entry status
          await updateChartingEntryStatus(entryId, status);

          // Link the charting entry to the appointment
          await linkChartingEntryToAppointment(entryId, appointmentId);
        }

        // Refresh the charting entries after the update
        console.log('Refreshing charting entries after update');
        const updatedEntries = await supabase.from<ChartingEntry>('dental_charting').getAll();
        setPatientChartingHistory(updatedEntries);

        console.log('Successfully updated charting entry status and refreshed data');
      } catch (error) {
        console.error('Error handling charting entry status update:', error);

        // Show error toast
        toast({
          title: 'Error',
          description: 'Failed to update dental charting status. Please try refreshing the page.',
          variant: 'destructive',
        });
      }
    };

    // Add event listener
    document.addEventListener('updateChartingEntryStatus', handleUpdateChartingEntryStatus);
    console.log('Added updateChartingEntryStatus event listener');

    // Clean up
    return () => {
      document.removeEventListener('updateChartingEntryStatus', handleUpdateChartingEntryStatus);
      console.log('Removed updateChartingEntryStatus event listener');
    };
  }, [supabase, toast]);

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
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: 'dental_charting_add_error',
        customMessage: 'Failed to add charting entry. Please try again.',
        showToast: true
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
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_charting_patient_error_${patientId}`,
        customMessage: 'Dental charting data will be available after setup is complete.',
        showToast: true
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
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: 'dental_charting_planned_error',
        customMessage: 'Dental charting data will be available after setup is complete.',
        showToast: true
      });

      // Return empty array instead of throwing an error for empty data
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
      console.log(`Updating charting entry ${entryId} status to ${status}`);

      // Find the entry to update
      const entry = patientChartingHistory.find(e => e.entry_id === entryId);

      if (!entry) {
        console.error(`Charting entry ${entryId} not found in local state`);

        // Try to fetch it directly from the database
        console.log('Trying to fetch entry directly from database');

        const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?entry_id=eq.${entryId}`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!fetchResponse.ok) {
          throw new Error(`Failed to fetch charting entry: ${fetchResponse.statusText}`);
        }

        const entries = await fetchResponse.json();
        const error = null;

        if (error) {
          console.error('Error fetching entry from database:', error);
          throw new Error('Failed to fetch charting entry from database');
        }

        if (!entries || entries.length === 0) {
          console.error(`Charting entry ${entryId} not found in database`);
          throw new Error('Charting entry not found');
        }

        // Use the entry from the database
        const dbEntry = entries[0];
        console.log('Found charting entry in database:', dbEntry);

        // Update in Supabase using the REST API directly
        console.log(`Updating charting entry with ID ${dbEntry.id} to status ${status} using direct REST API`);

        try {
          // First, log the current entry in the database
          const checkBeforeResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?id=eq.${dbEntry.id}`, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          const entryBeforeUpdate = await checkBeforeResponse.json();
          console.log('Entry before update:', entryBeforeUpdate);

          // Now perform the update
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?id=eq.${dbEntry.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              status,
              updated_at: new Date().toISOString()
            })
          });

          if (!updateResponse.ok) {
            console.error(`Error response from Supabase: ${updateResponse.status} ${updateResponse.statusText}`);
            const errorText = await updateResponse.text();
            console.error('Error details:', errorText);
            throw new Error(`Failed to update charting entry: ${updateResponse.statusText}`);
          }

          // Check if the update was successful
          const checkAfterResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?id=eq.${dbEntry.id}`, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          const entryAfterUpdate = await checkAfterResponse.json();
          console.log('Entry after update:', entryAfterUpdate);

          console.log('Successfully updated charting entry in Supabase');
        } catch (error) {
          console.error('Error during REST API update:', error);
          throw error;
        }

        // Refresh the local state
        const updatedEntries = await supabase.from<ChartingEntry>('dental_charting').getAll();
        setPatientChartingHistory(updatedEntries);
        console.log('Refreshed local state with latest data');
      } else {
        console.log('Found charting entry in local state:', entry);

        // Update in Supabase using the REST API directly
        console.log(`Updating charting entry with ID ${entry.id} to status ${status} using direct REST API`);

        try {
          // First, log the current entry in the database
          const checkBeforeResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?id=eq.${entry.id}`, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          const entryBeforeUpdate = await checkBeforeResponse.json();
          console.log('Entry before update:', entryBeforeUpdate);

          // Now perform the update
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?id=eq.${entry.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              status,
              updated_at: new Date().toISOString()
            })
          });

          if (!updateResponse.ok) {
            console.error(`Error response from Supabase: ${updateResponse.status} ${updateResponse.statusText}`);
            const errorText = await updateResponse.text();
            console.error('Error details:', errorText);
            throw new Error(`Failed to update charting entry: ${updateResponse.statusText}`);
          }

          // Check if the update was successful
          const checkAfterResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?id=eq.${entry.id}`, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          const entryAfterUpdate = await checkAfterResponse.json();
          console.log('Entry after update:', entryAfterUpdate);

          console.log('Successfully updated charting entry in Supabase');
        } catch (error) {
          console.error('Error during REST API update:', error);
          throw error;
        }

        // Update local state
        setPatientChartingHistory(prev =>
          prev.map(e => {
            if (e.entry_id === entryId) {
              // Ensure status is a valid ChartingEntry status
              const validStatus = status === 'Scheduled' ? 'Planned' : status;
              return { ...e, status: validStatus as 'Existing' | 'Planned' | 'Completed' };
            }
            return e;
          })
        );
        console.log('Updated local state');
      }

      // If status is Completed, also update any pending_treatments entries
      if (status === 'Completed') {
        try {
          console.log('Updating pending_treatments table for charting entry:', entryId);

          // First check if there are any pending treatments for this charting entry
          const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/pending_treatments?charting_entry_id=eq.${entryId}`, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          const pendingTreatments = await checkResponse.json();
          console.log('Found pending treatments:', pendingTreatments);

          // Use direct REST API for this update as well
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/pending_treatments?charting_entry_id=eq.${entryId}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
          });

          if (!updateResponse.ok) {
            console.error(`Error updating pending_treatments: ${updateResponse.status} ${updateResponse.statusText}`);
            const errorText = await updateResponse.text();
            console.error('Error details:', errorText);
          } else {
            console.log('Successfully updated pending_treatments table');

            // Verify the update
            const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/pending_treatments?charting_entry_id=eq.${entryId}`, {
              method: 'GET',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            });

            const updatedTreatments = await verifyResponse.json();
            console.log('Pending treatments after update:', updatedTreatments);
          }
        } catch (pendingError) {
          console.error('Error updating pending_treatments:', pendingError);
          // Continue even if this fails
        }
      }

      // Show notification
      toast({
        title: `Treatment ${status}`,
        description: `The treatment has been marked as ${status.toLowerCase()}.`,
      });

      // Refresh the data again to ensure everything is up to date
      console.log('Performing final refresh of data from Supabase');

      // Use direct REST API to get the latest data
      const finalResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!finalResponse.ok) {
        console.error('Error fetching final data:', finalResponse.statusText);
      } else {
        const finalEntries = await finalResponse.json();
        console.log('Final entries from Supabase:', finalEntries);

        // Update the local state with the latest data
        setPatientChartingHistory(finalEntries);
        console.log('Final refresh of local state completed');

        // Double-check that our specific entry was updated
        const updatedEntry = finalEntries.find((e: { entry_id: string }) => e.entry_id === entryId);
        console.log('Our updated entry in final refresh:', updatedEntry);
      }

    } catch (error) {
      console.error('Error updating charting entry status:', error);

      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_charting_status_error_${entryId}`,
        customMessage: 'Failed to update treatment status. Please try again.',
        showToast: true
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
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_charting_link_error_${entryId}`,
        customMessage: 'Failed to link treatment to appointment. Please try again.',
        showToast: true
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
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_charting_snooze_error_${entryId}`,
        customMessage: 'Failed to snooze treatment. Please try again.',
        showToast: true
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
