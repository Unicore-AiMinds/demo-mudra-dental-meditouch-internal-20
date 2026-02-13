import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ChartingEntry, defaultChartingEntries } from '@/types/dental-charting';
import { Patient } from '@/contexts/PatientContext';
import { useToast } from '@/hooks/use-toast';
import { useDentalHistory } from './DentalHistoryContext';
import { useSupabase } from './SupabaseContext';
import { handleDatabaseError } from '@/utils/error-handler';
import { useAuditLog } from './AuditLogContext';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase-config';

interface DentalChartingContextType {
  patientChartingHistory: ChartingEntry[];
  getPatientChartingHistory: (patientId: string) => Promise<ChartingEntry[]>;
  getPlannedChartingEntries: () => Promise<ChartingEntry[]>;
  getPatientName: (patientId: string) => Promise<string>;
  updateChartingEntryStatus: (entryId: string, status: 'Scheduled' | 'Completed') => Promise<void>;
  updateChartingEntry: (entryId: string, updates: Partial<ChartingEntry>) => Promise<void>;
  deleteChartingEntry: (entryId: string) => Promise<void>;
  linkChartingEntryToAppointment: (entryId: string, appointmentId: string) => Promise<void>;
  snoozeChartingEntry: (entryId: string, snoozeUntilDate: string, notes?: string) => Promise<void>;
  unsnoozeChartingEntry: (entryId: string) => Promise<void>;
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
  const { logAction } = useAuditLog();

  // Helper function to log audit actions for both clinics if patient is registered for both
  const logDentalChartingAudit = async (
    patientId: string,
    auditData: {
      action_type: string;
      target_entity: string;
      target_id: string;
      details: string;
    }
  ) => {
    try {
      // Get patient clinic type to determine audit log visibility
      const patients = await supabase.from<Patient>('patients').getAll({
        filters: { id: patientId }
      });

      if (patients.length > 0) {
        const patient = patients[0];

        // If patient is registered for both clinics, create audit entries for both
        if (patient.clinic === 'both') {
          // Create audit log entry for dental clinic
          await logAction({
            action_category: 'dental_charting',
            ...auditData,
            clinic_type: 'dental'
          });

          // Create audit log entry for meditouch clinic
          await logAction({
            action_category: 'dental_charting',
            ...auditData,
            clinic_type: 'meditouch'
          });
        } else {
          // Create single audit log entry for patients registered to one clinic
          const clinicType = patient.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({
            action_category: 'dental_charting',
            ...auditData,
            clinic_type: clinicType
          });
        }
      } else {
        // Fallback if patient not found - default to dental
        await logAction({
          action_category: 'dental_charting',
          ...auditData,
          clinic_type: 'dental'
        });
      }
    } catch (error) {
      console.error('Failed to log dental charting audit:', error);
    }
  };

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
        // handleDatabaseError({
        //   error,
        //   toast,
        //   errorKey: 'dental_charting_init_error',
        //   customMessage: 'Dental charting data will be available after setup is complete.',
        //   showToast: true
        // });
        console.error('Error initializing dental charting:', error);
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

      // Log the audit action with detailed information
      try {
        // Get patient name for audit logging
        let patientName = 'Unknown Patient';
        try {
          patientName = await getPatientName(entry.patient_id);
        } catch (nameError) {
          console.error('Failed to get patient name for audit:', nameError);
        }

        // Use helper function to handle dual clinic audit logging
        await logDentalChartingAudit(entry.patient_id, {
          action_type: 'Create Dental Chart Entry',
          target_entity: 'Dental Charting',
          target_id: createdEntry.id,
          details: `Created ${entry.status?.toLowerCase() || 'dental'} chart entry for ${patientName} - Tooth ${Array.isArray(entry.tooth_numbers) ? entry.tooth_numbers.join(', ') : entry.tooth_numbers || 'Unknown'}${Array.isArray(entry.surfaces) && entry.surfaces.length > 0 ? ` (Surfaces: ${entry.surfaces.join(', ')})` : ''}${entry.status === 'Existing' ? (entry.finding ? ` - Finding: ${entry.finding}` : '') : (entry.service ? ` - Service: ${entry.service}` : '')}`
        });
      } catch (auditError) {
        console.error('Failed to log dental charting creation audit:', auditError);
      }

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
      // handleDatabaseError({
      //   error,
      //   toast,
      //   errorKey: `dental_charting_patient_error_${patientId}`,
      //   customMessage: 'Dental charting data will be available after setup is complete.',
      //   showToast: true
      // });
      console.error('Error fetching patient charting history:', error);
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
      // handleDatabaseError({
      //   error,
      //   toast,
      //   errorKey: 'dental_charting_planned_error',
      //   customMessage: 'Dental charting data will be available after setup is complete.',
      //   showToast: true
      // });
      console.error('Error fetching planned charting entries:', error);

      // Return empty array instead of throwing an error for empty data
      return patientChartingHistory.filter(entry =>
        entry.status === 'Planned' && !entry.scheduled_appointment_id
      );
    }
  };

  // Get patient name - fallback to using the dental history context
  const getPatientName = async (patientId: string): Promise<string> => {
    try {
      console.log('Getting patient name for ID:', patientId);
      const name = await getPatientNameFromHistory(patientId);
      console.log('Retrieved patient name:', name);
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

          // Log audit action for status change
          try {
            let patientName = 'Unknown Patient';
            try {
              patientName = await getPatientName(dbEntry.patient_id);
            } catch (nameError) {
              console.error('Failed to get patient name for audit:', nameError);
            }

            const teeth = Array.isArray(dbEntry.tooth_numbers) ? dbEntry.tooth_numbers.join(', ') : 'Unknown';
            const treatmentInfo = dbEntry.status === 'Existing'
              ? (dbEntry.finding ? ` - Finding: ${dbEntry.finding}` : '')
              : (dbEntry.service ? ` - Service: ${dbEntry.service}` : '');

            await logDentalChartingAudit(dbEntry.patient_id, {
              action_type: 'Update Dental Chart Status',
              target_entity: 'Dental Charting',
              target_id: dbEntry.id,
              details: `Changed status for ${patientName} - Tooth ${teeth}${treatmentInfo}: "${entryBeforeUpdate[0]?.status || 'Unknown'}" → "${status}"`
            });
          } catch (auditError) {
            console.error('Failed to log dental charting status change audit:', auditError);
          }

          console.log('Successfully updated charting entry in Supabase');
        } catch (error) {
          console.error('Error during REST API update:', error);
          throw error;
        }

        // Update local state efficiently instead of full refresh
        setPatientChartingHistory(prev => 
          prev.map(entry => 
            entry.entry_id === entryId 
              ? { ...entry, status, updated_at: new Date().toISOString() }
              : entry
          )
        );
        console.log('Updated local state efficiently');
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

          // Log audit action for status change
          try {
            let patientName = 'Unknown Patient';
            try {
              patientName = await getPatientName(entry.patient_id);
            } catch (nameError) {
              console.error('Failed to get patient name for audit:', nameError);
            }

            const teeth = Array.isArray(entry.tooth_numbers) ? entry.tooth_numbers.join(', ') : 'Unknown';
            const treatmentInfo = entry.status === 'Existing'
              ? (entry.finding ? ` - Finding: ${entry.finding}` : '')
              : (entry.service ? ` - Service: ${entry.service}` : '');

            await logDentalChartingAudit(entry.patient_id, {
              action_type: 'Update Dental Chart Status',
              target_entity: 'Dental Charting',
              target_id: entry.id,
              details: `Changed status for ${patientName} - Tooth ${teeth}${treatmentInfo}: "${entryBeforeUpdate[0]?.status || 'Unknown'}" → "${status}"`
            });
          } catch (auditError) {
            console.error('Failed to log dental charting status change audit:', auditError);
          }

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

      // Database update completed successfully
      // Local state was already updated efficiently above
      console.log('Charting entry status update completed successfully');

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

  // Update a charting entry with detailed field-level audit logging
  const updateChartingEntry = async (entryId: string, updates: Partial<ChartingEntry>): Promise<void> => {
    try {
      // Find the entry to update in local state first
      let entry = patientChartingHistory.find(e => e.entry_id === entryId);

      // If not found in local state, fetch from database
      if (!entry) {
        console.log(`Entry ${entryId} not found in local state, fetching from database...`);
        const entries = await supabase.from<ChartingEntry>('dental_charting').getAll({
          filters: { entry_id: entryId }
        });

        if (entries.length === 0) {
          throw new Error('Charting entry not found in database');
        }

        entry = entries[0];
        console.log('Found entry in database:', entry);
      }

      // Get the current state before update for audit logging
      const beforeState = { ...entry };

      // Prepare the update data
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.entry_id;
      delete updateData.created_at;

      // Update in Supabase
      await supabase.from<ChartingEntry>('dental_charting').update(entry.id, updateData);

      // Get the updated entry for audit logging
      const updatedEntries = await supabase.from<ChartingEntry>('dental_charting').getAll({
        filters: { entry_id: entryId }
      });
      const afterState = updatedEntries[0];

      // Update local state
      setPatientChartingHistory(prev =>
        prev.map(e =>
          e.entry_id === entryId
            ? { ...e, ...updateData }
            : e
        )
      );

      // Log detailed audit action with field-level changes
      try {
        let patientName = 'Unknown Patient';
        try {
          patientName = await getPatientName(entry.patient_id);
        } catch (nameError) {
          console.error('Failed to get patient name for audit:', nameError);
        }

        // Build detailed change description
        const changedFields: string[] = [];

        // Check for tooth number changes
        if (JSON.stringify(beforeState.tooth_numbers) !== JSON.stringify(afterState.tooth_numbers)) {
          const beforeTeeth = Array.isArray(beforeState.tooth_numbers) ? beforeState.tooth_numbers.join(', ') : beforeState.tooth_numbers || 'None';
          const afterTeeth = Array.isArray(afterState.tooth_numbers) ? afterState.tooth_numbers.join(', ') : afterState.tooth_numbers || 'None';
          changedFields.push(`Tooth Numbers: "${beforeTeeth}" → "${afterTeeth}"`);
        }

        // Check for surface changes
        if (JSON.stringify(beforeState.surfaces) !== JSON.stringify(afterState.surfaces)) {
          const beforeSurfaces = Array.isArray(beforeState.surfaces) && beforeState.surfaces.length > 0 ? beforeState.surfaces.join(', ') : 'None';
          const afterSurfaces = Array.isArray(afterState.surfaces) && afterState.surfaces.length > 0 ? afterState.surfaces.join(', ') : 'None';
          changedFields.push(`Surfaces: "${beforeSurfaces}" → "${afterSurfaces}"`);
        }

        // Check for finding changes
        if (beforeState.finding !== afterState.finding) {
          changedFields.push(`Finding: "${beforeState.finding || 'None'}" → "${afterState.finding || 'None'}"`);
        }

        // Check for service changes
        if (beforeState.service !== afterState.service) {
          changedFields.push(`Service: "${beforeState.service || 'None'}" → "${afterState.service || 'None'}"`);
        }

        // Check for status changes
        if (beforeState.status !== afterState.status) {
          changedFields.push(`Status: "${beforeState.status || 'None'}" → "${afterState.status || 'None'}"`);
        }

        // Check for notes changes
        if (beforeState.notes !== afterState.notes) {
          const beforeNotes = beforeState.notes ? (beforeState.notes.length > 50 ? beforeState.notes.substring(0, 50) + '...' : beforeState.notes) : 'None';
          const afterNotes = afterState.notes ? (afterState.notes.length > 50 ? afterState.notes.substring(0, 50) + '...' : afterState.notes) : 'None';
          changedFields.push(`Notes: "${beforeNotes}" → "${afterNotes}"`);
        }

        const toothNumbers = Array.isArray(afterState.tooth_numbers) ? afterState.tooth_numbers.join(', ') : afterState.tooth_numbers || 'Unknown';
        const baseDetails = `Updated dental chart entry for ${patientName} - Tooth ${toothNumbers}`;
        const detailsText = changedFields.length > 0
          ? `${baseDetails}: ${changedFields.join(', ')}`
          : `${baseDetails} - No specific field changes detected`;

        await logDentalChartingAudit(entry.patient_id, {
          action_type: 'Update Dental Chart Entry',
          target_entity: 'Dental Charting',
          target_id: entry.id,
          details: detailsText
        });
      } catch (auditError) {
        console.error('Failed to log dental charting update audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'Dental charting entry updated successfully.',
      });
    } catch (error) {
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_charting_update_error_${entryId}`,
        customMessage: 'Failed to update charting entry. Please try again.',
        showToast: true
      });
      throw error;
    }
  };

  // Delete a charting entry with audit logging
  const deleteChartingEntry = async (entryId: string): Promise<void> => {
    try {
      // Find the entry to delete
      const entry = patientChartingHistory.find(e => e.entry_id === entryId);

      if (!entry) {
        throw new Error('Charting entry not found');
      }

      // Delete from Supabase
      await supabase.from<ChartingEntry>('dental_charting').delete(entry.id);

      // Update local state
      setPatientChartingHistory(prev =>
        prev.filter(e => e.entry_id !== entryId)
      );

      // Log audit action for deletion
      try {
        let patientName = 'Unknown Patient';
        try {
          patientName = await getPatientName(entry.patient_id);
        } catch (nameError) {
          console.error('Failed to get patient name for audit:', nameError);
        }

        const teeth = Array.isArray(entry.tooth_numbers) ? entry.tooth_numbers.join(', ') : 'Unknown';
        const treatmentInfo = entry.status === 'Existing'
          ? (entry.finding ? ` - Finding: ${entry.finding}` : '')
          : (entry.service ? ` - Service: ${entry.service}` : '');

        await logDentalChartingAudit(entry.patient_id, {
          action_type: 'Delete Dental Chart Entry',
          target_entity: 'Dental Charting',
          target_id: entry.id,
          details: `Deleted ${entry.status?.toLowerCase() || 'dental'} chart entry for ${patientName} - Tooth ${teeth}${treatmentInfo}`
        });
      } catch (auditError) {
        console.error('Failed to log dental charting deletion audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'Dental charting entry deleted successfully.',
      });
    } catch (error) {
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_charting_delete_error_${entryId}`,
        customMessage: 'Failed to delete charting entry. Please try again.',
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

      // Log audit action for linking to appointment
      try {
        let patientName = 'Unknown Patient';
        try {
          patientName = await getPatientName(entry.patient_id);
        } catch (nameError) {
          console.error('Failed to get patient name for audit:', nameError);
        }

        const teeth = Array.isArray(entry.tooth_numbers) ? entry.tooth_numbers.join(', ') : 'Unknown';
        const serviceInfo = entry.service ? ` - Service: ${entry.service}` : '';

        await logDentalChartingAudit(entry.patient_id, {
          action_type: 'Link Chart to Appointment',
          target_entity: 'Dental Charting',
          target_id: entry.id,
          details: `Linked dental chart entry for ${patientName} - Tooth ${teeth}${serviceInfo} to appointment ${appointmentId}`
        });
      } catch (auditError) {
        console.error('Failed to log dental charting link to appointment audit:', auditError);
      }

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

      // Log audit action for snoozing entry
      try {
        let patientName = 'Unknown Patient';
        try {
          patientName = await getPatientName(entry.patient_id);
        } catch (nameError) {
          console.error('Failed to get patient name for audit:', nameError);
        }

        const teeth = Array.isArray(entry.tooth_numbers) ? entry.tooth_numbers.join(', ') : 'Unknown';
        const serviceInfo = entry.service ? ` - Service: ${entry.service}` : '';
        const notesInfo = notes ? ` with notes: "${notes}"` : '';

        await logDentalChartingAudit(entry.patient_id, {
          action_type: 'Snooze Dental Chart Entry',
          target_entity: 'Dental Charting',
          target_id: entry.id,
          details: `Snoozed dental chart entry for ${patientName} - Tooth ${teeth}${serviceInfo} until ${snoozeUntilDate}${notesInfo}`
        });
      } catch (auditError) {
        console.error('Failed to log dental charting snooze audit:', auditError);
      }

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

  // Unsnooze a charting entry (remove snooze date)
  const unsnoozeChartingEntry = async (entryId: string): Promise<void> => {
    try {
      console.log(`Unsnoozing charting entry: ${entryId}`);

      // First, get the entry from database to ensure we have the correct ID
      const entries = await supabase.from<ChartingEntry>('dental_charting').getAll({
        filters: { entry_id: entryId }
      });

      if (entries.length === 0) {
        throw new Error('Charting entry not found');
      }

      const entry = entries[0];
      console.log('Found entry to unsnooze:', entry);

      // Update in Supabase using direct fetch to ensure it works
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/dental_charting?id=eq.${entry.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          snoozed_until: null,
          updated_at: new Date().toISOString()
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Update response error:', errorText);
        throw new Error(`Failed to update entry: ${updateResponse.status} ${updateResponse.statusText}`);
      }

      const updatedData = await updateResponse.json();
      console.log('Successfully unnoozed entry:', updatedData);

      // Update local state if the entry exists there
      setPatientChartingHistory(prev =>
        prev.map(e =>
          e.entry_id === entryId
            ? { ...e, snoozed_until: null }
            : e
        )
      );

      // Log audit action for unsnoozing entry
      try {
        let patientName = 'Unknown Patient';
        try {
          patientName = await getPatientName(entry.patient_id);
        } catch (nameError) {
          console.error('Failed to get patient name for audit:', nameError);
        }

        const teeth = Array.isArray(entry.tooth_numbers) ? entry.tooth_numbers.join(', ') : 'Unknown';
        const serviceInfo = entry.service ? ` - Service: ${entry.service}` : '';

        await logDentalChartingAudit(entry.patient_id, {
          action_type: 'Activate Dental Chart Entry',
          target_entity: 'Dental Charting',
          target_id: entry.id,
          details: `Activated dental chart entry for ${patientName} - Tooth ${teeth}${serviceInfo} (removed snooze)`
        });
      } catch (auditError) {
        console.error('Failed to log dental charting unsnooze audit:', auditError);
      }

      console.log('Unsnooze operation completed successfully');
    } catch (error) {
      console.error('Error unsnoozing charting entry:', error);
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_charting_unsnooze_error_${entryId}`,
        customMessage: 'Failed to activate treatment. Please try again.',
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
        updateChartingEntry,
        deleteChartingEntry,
        linkChartingEntryToAppointment,
        snoozeChartingEntry,
        unsnoozeChartingEntry,
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
