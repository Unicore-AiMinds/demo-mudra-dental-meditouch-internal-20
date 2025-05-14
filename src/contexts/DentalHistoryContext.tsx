import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DentalHistoryEntry,
  TentativeFollowUp,
  ServiceWithFollowUp,
  defaultDentalHistoryEntries,
  defaultFollowUps,
  defaultServiceWithFollowUp
} from '../types/dental-history';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { v4 as uuidv4 } from 'uuid';

interface DentalHistoryContextType {
  dentalHistory: Record<string, DentalHistoryEntry[]>;
  tentativeFollowUps: TentativeFollowUp[];
  servicesWithFollowUp: ServiceWithFollowUp[];
  isLoading: boolean;
  getPatientHistory: (patientId: string) => Promise<DentalHistoryEntry[]>;
  updateServiceFollowUpConfig: (serviceId: string, config: Partial<ServiceWithFollowUp>) => Promise<void>;
  markAppointmentCompleted: (
    appointmentId: string,
    patientId: string,
    patientName: string,
    service: string,
    doctor: string,
    date: string
  ) => Promise<void>;
  updateFollowUpStatus: (followUpId: string, status: TentativeFollowUp['status']) => Promise<void>;
  updatePaymentStatus: (patientId: string, appointmentId: string, status: 'paid' | 'unpaid') => Promise<void>;
  getPendingFollowUps: () => TentativeFollowUp[];
  // New functions for integration
  addTentativeFollowUps: (followUps: Omit<TentativeFollowUp, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  getPatientName: (patientId: string) => Promise<string | undefined>;
  getFollowUpsForChartingEntry: (chartingEntryId: string) => TentativeFollowUp[];
  linkFollowUpToAppointment: (followUpId: string, appointmentId: string) => Promise<void>;
  // Functions for snoozing and notes
  snoozeFollowUp: (followUpId: string, snoozeUntilDate: string, notes?: string) => Promise<void>;
  updateFollowUpNotes: (followUpId: string, notes: string) => Promise<void>;
  getSnoozedFollowUps: () => TentativeFollowUp[];
}

const DentalHistoryContext = createContext<DentalHistoryContextType | undefined>(undefined);

export const DentalHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dentalHistory, setDentalHistory] = useState<Record<string, DentalHistoryEntry[]>>({});
  const [tentativeFollowUps, setTentativeFollowUps] = useState<TentativeFollowUp[]>([]);
  const [servicesWithFollowUp, setServicesWithFollowUp] = useState<ServiceWithFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState<boolean>(false);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Initialize data from Supabase
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);

        // We'll skip checking if the table exists and just try to use it
        // If it doesn't exist, we'll handle the error gracefully

        // Fetch dental history entries
        console.log('Fetching dental history entries...');
        const historyEntries = await supabase.from<DentalHistoryEntry>('dental_history').getAll();

        // Fetch follow-ups
        const followUps = await supabase.from<TentativeFollowUp>('follow_ups').getAll();

        // Fetch services with follow-up
        let services = [];
        try {
          services = await supabase.from<ServiceWithFollowUp>('services_with_follow_up').getAll();
        } catch (error) {
          console.error('Error fetching services with follow-up:', error);
          console.log('Using default services with follow-up');
          services = [];
        }

        // If no dental history entries exist, create default ones
        if (historyEntries.length === 0) {
          // First check if the referenced appointments exist
          const appointmentIds = defaultDentalHistoryEntries.map(entry => entry.appointment_id);
          const existingAppointments = await supabase.from('appointments').getAll({
            filters: { appointment_code: { $in: appointmentIds } }
          });

          console.log('Checking for existing appointments before creating dental history:', existingAppointments);

          // Only insert entries where the appointment exists
          for (const entry of defaultDentalHistoryEntries) {
            try {
              // Check if this appointment exists
              const appointmentExists = existingAppointments.some(app => {
                // Type assertion to handle the unknown type
                const typedApp = app as { appointment_code?: string };
                return typedApp.appointment_code === entry.appointment_id;
              });

              if (appointmentExists) {
                await supabase.from<DentalHistoryEntry>('dental_history').insert(entry);
                console.log(`Successfully inserted dental history for appointment ${entry.appointment_id}`);
              } else {
                console.warn(`Skipping dental history entry for appointment ${entry.appointment_id} - appointment does not exist`);
              }
            } catch (insertError) {
              console.error(`Error inserting dental history entry for appointment ${entry.appointment_id}:`, insertError);
            }
          }

          // Fetch the newly created entries
          const newEntries = await supabase.from<DentalHistoryEntry>('dental_history').getAll();

          // Group entries by patient ID
          const groupedEntries: Record<string, DentalHistoryEntry[]> = {};
          newEntries.forEach(entry => {
            if (!groupedEntries[entry.patient_id]) {
              groupedEntries[entry.patient_id] = [];
            }
            groupedEntries[entry.patient_id].push(entry);
          });

          setDentalHistory(groupedEntries);
        } else {
          // Group existing entries by patient ID
          const groupedEntries: Record<string, DentalHistoryEntry[]> = {};
          historyEntries.forEach(entry => {
            if (!groupedEntries[entry.patient_id]) {
              groupedEntries[entry.patient_id] = [];
            }
            groupedEntries[entry.patient_id].push(entry);
          });

          setDentalHistory(groupedEntries);
        }

        // If no follow-ups exist, create default ones
        if (followUps.length === 0) {
          for (const followUp of defaultFollowUps) {
            await supabase.from<TentativeFollowUp>('follow_ups').insert(followUp);
          }

          // Fetch the newly created follow-ups
          const newFollowUps = await supabase.from<TentativeFollowUp>('follow_ups').getAll();
          setTentativeFollowUps(newFollowUps);
        } else {
          setTentativeFollowUps(followUps);
        }

        // If no services with follow-up exist, create default ones
        if (services.length === 0) {
          for (const service of defaultServiceWithFollowUp) {
            await supabase.from<ServiceWithFollowUp>('services_with_follow_up').insert(service);
          }

          // Fetch the newly created services
          const newServices = await supabase.from<ServiceWithFollowUp>('services_with_follow_up').getAll();
          setServicesWithFollowUp(newServices);
        } else {
          setServicesWithFollowUp(services);
        }
      } catch (error) {
        console.error('Error initializing dental history data:', error);

        // Set empty data instead of showing an error
        setDentalHistory({});
        setTentativeFollowUps([]);
        setServicesWithFollowUp([]);

        // Only show a toast, don't set database error
        toast({
          title: 'Notice',
          description: 'No dental history data available yet. You can add new entries as needed.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [supabase, toast]);

  // Get dental history for a specific patient
  const getPatientHistory = async (patientId: string): Promise<DentalHistoryEntry[]> => {
    try {
      if (!patientId) {
        console.warn('Empty patient ID provided to getPatientHistory');
        return [];
      }

      console.log(`Fetching dental history for patient ID: ${patientId}`);

      // Fetch directly from Supabase for the most up-to-date data
      const entries = await supabase.from<DentalHistoryEntry>('dental_history').getAll({
        filters: { patient_id: patientId },
        order: { column: 'date', ascending: false }
      });

      console.log(`Retrieved ${entries.length} dental history entries for patient ${patientId}`);

      // Also fetch past unresolved appointments for this patient
      console.log(`Checking for past unresolved appointments for patient ID: ${patientId}`);
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');

      const appointments = await supabase.from('appointments').getAll({
        filters: {
          patient_id: patientId
        }
      });

      // Filter for past appointments that are not completed, cancelled, or scheduled
      const pastUnresolvedAppointments = appointments.filter(app => {
        // Type assertion to handle the unknown type
        const typedApp = app as {
          date: string;
          status: string;
          id: string;
          service?: string;
          doctor?: string;
          payment_status?: 'paid' | 'unpaid';
        };

        return typedApp.date < todayString &&
               typedApp.status !== 'completed' &&
               typedApp.status !== 'cancelled' &&
               typedApp.status !== 'scheduled';
      });

      console.log(`Found ${pastUnresolvedAppointments.length} past unresolved appointments for patient ${patientId}`);

      // Convert past unresolved appointments to dental history entries
      const unresolvedEntries: DentalHistoryEntry[] = pastUnresolvedAppointments.map(app => {
        // Type assertion to handle the unknown type
        const typedApp = app as {
          id: string;
          date: string;
          service?: string;
          doctor?: string;
          payment_status?: 'paid' | 'unpaid';
        };

        return {
          id: `unresolved-${typedApp.id}`,
          appointment_id: typedApp.id,
          patient_id: patientId,
          date: typedApp.date,
          service: typedApp.service || 'Unknown Service',
          doctor: typedApp.doctor || 'Unknown Doctor',
          payment_status: typedApp.payment_status || 'unpaid',
          procedure_performed_notes: 'This appointment is past its scheduled date but has not been marked as completed, cancelled, or rescheduled.',
          status: 'Unresolved' // Add a special status for these entries
        };
      });

      // Combine regular entries with unresolved appointments
      const combinedEntries = [...entries, ...unresolvedEntries];

      // Sort by date (newest first)
      combinedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return combinedEntries;
    } catch (error) {
      console.error('Error fetching patient history:', error);

      // Just log the error and return an empty array without showing a toast
      // This makes the application more resilient to database issues
      if (error instanceof Error) {
        console.error('Detailed error:', error.message);
      }

      // Return empty array
      return [];
    }
  };

  // Update service follow-up configuration
  const updateServiceFollowUpConfig = async (serviceId: string, config: Partial<ServiceWithFollowUp>): Promise<void> => {
    try {
      // Update in Supabase
      await supabase.from<ServiceWithFollowUp>('services_with_follow_up').update(serviceId, config);

      // Update local state
      setServicesWithFollowUp(prevServices =>
        prevServices.map(service =>
          service.id === serviceId ? { ...service, ...config } : service
        )
      );

      toast({
        title: 'Success',
        description: 'Service follow-up configuration updated successfully.',
      });
    } catch (error) {
      console.error('Error updating service follow-up config:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service follow-up configuration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Mark an appointment as completed and generate follow-up needed
  const markAppointmentCompleted = async (
    appointmentId: string,
    patientId: string,
    patientName: string,
    service: string,
    doctor: string,
    date: string
  ): Promise<void> => {
    try {
      console.log(`=== MARKING APPOINTMENT COMPLETED ===`);
      console.log(`Patient: ${patientName}, Service: ${service}, Date: ${date}`);

      // Find the service configuration - try exact match first, then case-insensitive
      let serviceConfig = servicesWithFollowUp.find(s => s.name === service);

      // If no exact match, try case-insensitive match
      if (!serviceConfig) {
        console.log(`No exact match found for service "${service}", trying case-insensitive match`);
        serviceConfig = servicesWithFollowUp.find(s =>
          s.name.toLowerCase() === service.toLowerCase()
        );
      }

      // If still no match, create a default service config for Dental Checkup
      if (!serviceConfig && service.toLowerCase().includes('dental') && service.toLowerCase().includes('check')) {
        console.log(`No service config found for "${service}", creating default config for Dental Checkup`);

        // Create a temporary service config
        serviceConfig = {
          id: 'temp-id',
          name: 'Dental Checkup',
          duration: 30,
          price: 500,
          requires_follow_up: true,
          default_follow_up_interval_days: 180, // 6 months
          number_of_follow_ups: 1,
          follow_up_service_name: 'Dental Checkup'
        };

        // Try to add this to the database for future use
        try {
          console.log('Adding default service with follow-up to database');
          const addedService = await supabase.from('services_with_follow_up').insert(serviceConfig);
          console.log('Added default service with follow-up:', addedService);
        } catch (addError) {
          console.error('Error adding default service with follow-up:', addError);
          // Continue with the temporary config even if saving fails
        }
      }

      // Create new history entry
      const newHistoryEntry = {
        appointment_id: appointmentId,
        patient_id: patientId,
        date,
        service,
        doctor,
        payment_status: 'unpaid' as const, // Default to unpaid
        procedure_performed_notes: "Procedure completed successfully."
      };

      console.log('Creating dental history entry:', newHistoryEntry);

      // Add to Supabase
      const createdEntry = await supabase.from<DentalHistoryEntry>('dental_history').insert(newHistoryEntry);
      console.log('Created dental history entry:', createdEntry);

      // Update local state
      setDentalHistory(prev => {
        const patientHistory = prev[patientId] || [];
        return {
          ...prev,
          [patientId]: [...patientHistory, createdEntry]
        };
      });

      console.log(`Checking if follow-up is required for service: "${service}"`);
      console.log('Available services with follow-up:', servicesWithFollowUp.map(s => s.name));
      console.log('Service config found:', serviceConfig);

      // ALWAYS create a follow-up for dental checkups, regardless of config
      const isDentalCheckup = service.toLowerCase().includes('dental') && service.toLowerCase().includes('check');

      // Check if follow-up is required
      if ((serviceConfig && serviceConfig.requires_follow_up && serviceConfig.default_follow_up_interval_days > 0) || isDentalCheckup) {
        console.log(`Follow-up is required for service "${service}"`);

        // Generate a unique sequence group ID for this set of follow-ups
        const sequenceGroupId = `seq-${uuidv4().substring(0, 8)}`;

        // First, check if there's a service follow-up rule with multiple steps
        try {
          // Fetch service follow-up rules
          const { data: rulesData, error: rulesError } = await supabase
            .from('service_follow_up_rules')
            .select('*')
            .eq('triggering_service_name', service);

          if (rulesError) {
            console.error('Error fetching service follow-up rules:', rulesError);
          } else if (rulesData && rulesData.length > 0) {
            console.log(`Found service follow-up rule for ${service}`);
            const rule = rulesData[0];

            // Fetch steps for this rule
            const { data: stepsData, error: stepsError } = await supabase
              .from('follow_up_steps')
              .select('*')
              .eq('service_follow_up_rule_id', rule.id)
              .order('sequence', { ascending: true });

            if (stepsError) {
              console.error('Error fetching follow-up steps:', stepsError);
            } else if (stepsData && stepsData.length > 0) {
              console.log(`Found ${stepsData.length} steps for this rule`);

              // Create follow-ups for each step
              for (let i = 0; i < stepsData.length; i++) {
                const step = stepsData[i];

                // Calculate follow-up date based on interval days
                const appointmentDate = new Date(date);
                const followUpDate = new Date(appointmentDate);
                followUpDate.setDate(followUpDate.getDate() + step.interval_days);
                const tentativeDate = format(followUpDate, 'yyyy-MM-dd');

                // Generate a unique follow-up ID
                const followUpId = `FU${uuidv4().substring(0, 8)}`;

                // Create the follow-up
                const newFollowUp = {
                  follow_up_id: followUpId,
                  patient_id: patientId,
                  patient_name: patientName,
                  based_on_appointment_id: appointmentId,
                  tentative_date: tentativeDate,
                  follow_up_sequence: step.sequence,
                  total_steps_in_sequence: stepsData.length,
                  sequence_group_id: sequenceGroupId,
                  suggested_service_name: step.suggested_service_name || service,
                  original_service: service,
                  original_doctor: doctor,
                  // First step is Pending, others are Waiting
                  status: i === 0 ? 'Pending' as const : 'Waiting' as const,
                  special_notes: step.notes || ''
                };

                console.log(`Creating follow-up step ${step.sequence}/${stepsData.length} for ${patientName}'s ${service}:`, newFollowUp);

                // Insert into database
                try {
                  await supabase.from<TentativeFollowUp>('follow_ups').insert(newFollowUp);
                  console.log(`Successfully created follow-up step ${step.sequence}`);
                } catch (insertError) {
                  console.error(`Error inserting follow-up step ${step.sequence}:`, insertError);
                }
              }

              // Show toast notification
              toast({
                title: "Follow-up Sequence Created",
                description: `${stepsData.length} follow-up steps created for ${patientName}.`,
              });

              // Force refresh the follow-ups list
              try {
                console.log('Forcing refresh of follow-ups list...');
                const directFollowUps = await supabase.from<TentativeFollowUp>('follow_ups').getAll({
                  order: { column: 'tentative_date', ascending: true }
                });

                console.log(`Query found ${directFollowUps?.length || 0} follow-ups`);
                setTentativeFollowUps(directFollowUps || []);

                // Dispatch a custom event to notify the RecallList component to refresh
                const refreshEvent = new CustomEvent('refresh-follow-ups');
                document.dispatchEvent(refreshEvent);
                console.log('Dispatched refresh-follow-ups event');
              } catch (refreshError) {
                console.error('Error refreshing follow-ups:', refreshError);
              }

              // We've created the multi-step follow-ups, so return early
              return;
            }
          }
        } catch (ruleError) {
          console.error('Error processing service follow-up rules:', ruleError);
        }

        // If we get here, either there was no rule or an error occurred
        // Fall back to creating a single follow-up
        const intervalDays = serviceConfig?.default_follow_up_interval_days || 180; // Default to 6 months if not specified
        console.log(`Creating single follow-up with interval ${intervalDays} days`);

        // Calculate tentative follow-up date
        const appointmentDate = new Date(date);
        const followUpDate = addDays(appointmentDate, intervalDays);
        const tentativeDate = format(followUpDate, 'yyyy-MM-dd');

        // Generate a unique follow-up ID
        const followUpId = `FU${uuidv4().substring(0, 8)}`;

        // Create follow-up
        const newFollowUp = {
          follow_up_id: followUpId,
          patient_id: patientId,
          patient_name: patientName,
          based_on_appointment_id: appointmentId,
          tentative_date: tentativeDate,
          follow_up_sequence: 1,
          total_steps_in_sequence: 1,
          sequence_group_id: sequenceGroupId,
          suggested_service_name: serviceConfig?.follow_up_service_name || service,
          original_service: service,
          original_doctor: doctor,
          status: 'Pending' as const
        };

        // Add to Supabase
        console.log('Inserting follow-up into database:', newFollowUp);
        try {
          await supabase.from<TentativeFollowUp>('follow_ups').insert(newFollowUp);
          console.log('Successfully inserted follow-up into database');
        } catch (insertError) {
          console.error('Error inserting follow-up:', insertError);
          throw insertError;
        }

        // Fetch the newly created follow-up
        console.log(`Fetching newly created follow-up with ID: ${followUpId}`);
        const createdFollowUp = await supabase.from<TentativeFollowUp>('follow_ups').getAll({
          filters: { follow_up_id: followUpId }
        });
        console.log('Fetched follow-up result:', createdFollowUp);

        // Update local state
        if (createdFollowUp.length > 0) {
          setTentativeFollowUps(prev => [...prev, createdFollowUp[0]]);
        } else {
          // If we couldn't fetch it, add the new follow-up directly to state
          console.log('Could not fetch created follow-up, adding directly to state');
          setTentativeFollowUps(prev => [...prev, {...newFollowUp, id: 'temp-' + followUpId}]);
        }

        // Show toast notification
        toast({
          title: "Follow-up Reminder Created",
          description: `Follow-up reminder created for ${patientName} due around ${tentativeDate}.`,
        });

        console.log(`Successfully created follow-up for ${patientName} with service "${newFollowUp.suggested_service_name}" due on ${tentativeDate}`);

        // Force refresh the follow-ups list using the custom Supabase client
        try {
          console.log('Forcing refresh of follow-ups list...');
          const directFollowUps = await supabase.from<TentativeFollowUp>('follow_ups').getAll({
            order: { column: 'tentative_date', ascending: true }
          });

          console.log(`Query found ${directFollowUps?.length || 0} follow-ups`);
          setTentativeFollowUps(directFollowUps || []);

          // Dispatch a custom event to notify the RecallList component to refresh
          const refreshEvent = new CustomEvent('refresh-follow-ups');
          document.dispatchEvent(refreshEvent);
          console.log('Dispatched refresh-follow-ups event');
        } catch (refreshError) {
          console.error('Error refreshing follow-ups:', refreshError);
        }
      } else {
        console.log(`No follow-up created for service "${service}" - either no service config found, follow-up not required, or interval days is 0`);
      }
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark appointment as completed. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add multiple tentative follow-ups (used by integration service)
  const addTentativeFollowUps = async (followUps: Omit<TentativeFollowUp, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> => {
    if (followUps.length === 0) return;

    try {
      // Add follow-ups to Supabase
      for (const followUp of followUps) {
        await supabase.from<TentativeFollowUp>('follow_ups').insert(followUp);
      }

      // Fetch all follow-ups to update local state
      const allFollowUps = await supabase.from<TentativeFollowUp>('follow_ups').getAll();
      setTentativeFollowUps(allFollowUps);

      toast({
        title: 'Success',
        description: 'Follow-ups added successfully.',
      });
    } catch (error) {
      console.error('Error adding follow-ups:', error);
      toast({
        title: 'Error',
        description: 'Failed to add follow-ups. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get patient name from patient ID
  const getPatientName = async (patientId: string): Promise<string | undefined> => {
    try {
      if (!patientId) {
        console.warn('Empty patient ID provided to getPatientName');
        return 'Unknown Patient';
      }

      // First try to find by patient_id field
      let patients = await supabase.from('patients').getAll({
        filters: { patient_id: patientId }
      });

      // If not found, try by id field
      if (patients.length === 0) {
        patients = await supabase.from('patients').getAll({
          filters: { id: patientId }
        });
      }

      if (patients.length > 0 && typeof patients[0] === 'object' && patients[0] !== null) {
        // Type assertion to handle the unknown type
        const patient = patients[0] as { name?: string };
        if (patient.name) {
          return patient.name;
        }
      }

      // If patient not found in database, return a generic name
      console.warn(`Patient with ID ${patientId} not found in database`);
      return 'Unknown Patient';
    } catch (error) {
      console.error('Error fetching patient name:', error);
      return 'Unknown Patient';
    }
  };

  // Get follow-ups related to a specific charting entry
  const getFollowUpsForChartingEntry = (chartingEntryId: string): TentativeFollowUp[] => {
    return tentativeFollowUps.filter(
      followUp => followUp.based_on_charting_entry_id === chartingEntryId
    );
  };

  // Link a follow-up to an appointment
  const linkFollowUpToAppointment = async (followUpId: string, appointmentId: string): Promise<void> => {
    try {
      // Find the follow-up to update
      const followUp = tentativeFollowUps.find(fu => fu.follow_up_id === followUpId);

      if (!followUp) {
        throw new Error('Follow-up not found');
      }

      // Update in Supabase
      await supabase.from<TentativeFollowUp>('follow_ups').update(followUp.id, {
        status: 'Scheduled',
        scheduled_appointment_id: appointmentId
      });

      // Update local state
      setTentativeFollowUps(prev =>
        prev.map(fu =>
          fu.follow_up_id === followUpId
            ? {
                ...fu,
                status: 'Scheduled',
                scheduled_appointment_id: appointmentId
              }
            : fu
        )
      );

      toast({
        title: 'Success',
        description: 'Follow-up linked to appointment successfully.',
      });
    } catch (error) {
      console.error('Error linking follow-up to appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to link follow-up to appointment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Update follow-up status
  const updateFollowUpStatus = async (followUpId: string, status: TentativeFollowUp['status']): Promise<void> => {
    try {
      // Find the follow-up to update
      const followUp = tentativeFollowUps.find(fu => fu.follow_up_id === followUpId);

      if (!followUp) {
        throw new Error('Follow-up not found');
      }

      // Update in Supabase
      await supabase.from<TentativeFollowUp>('follow_ups').update(followUp.id, { status });

      // Update local state
      setTentativeFollowUps(prev =>
        prev.map(fu =>
          fu.follow_up_id === followUpId ? { ...fu, status } : fu
        )
      );

      toast({
        title: 'Success',
        description: `Follow-up status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating follow-up status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow-up status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Update payment status for a dental history entry
  const updatePaymentStatus = async (patientId: string, appointmentId: string, status: 'paid' | 'unpaid'): Promise<void> => {
    try {
      // Find the history entry to update
      const entries = await supabase.from<DentalHistoryEntry>('dental_history').getAll({
        filters: {
          patient_id: patientId,
          appointment_id: appointmentId
        }
      });

      if (entries.length === 0) {
        throw new Error('Dental history entry not found');
      }

      // Update in Supabase
      await supabase.from<DentalHistoryEntry>('dental_history').update(entries[0].id, { payment_status: status });

      // Update local state
      setDentalHistory(prev => {
        const patientHistory = prev[patientId] || [];
        const updatedHistory = patientHistory.map(entry =>
          entry.appointment_id === appointmentId
            ? { ...entry, payment_status: status }
            : entry
        );

        return {
          ...prev,
          [patientId]: updatedHistory
        };
      });

      toast({
        title: "Payment Status Updated",
        description: `The payment status has been updated to ${status === 'paid' ? 'Paid' : 'Unpaid'}.`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Snooze a follow-up until a specific date
  const snoozeFollowUp = async (followUpId: string, snoozeUntilDate: string, notes?: string): Promise<void> => {
    try {
      // Find the follow-up to be snoozed
      const followUpToSnooze = tentativeFollowUps.find(fu => fu.follow_up_id === followUpId);

      if (!followUpToSnooze) {
        throw new Error('Follow-up not found');
      }

      // Calculate the difference in days between original date and snooze date
      const originalDate = new Date(followUpToSnooze.tentative_date);
      const snoozeDate = new Date(snoozeUntilDate);
      const daysDifference = Math.floor((snoozeDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));

      // Update the follow-up in Supabase
      await supabase.from<TentativeFollowUp>('follow_ups').update(followUpToSnooze.id, {
        status: 'Snoozed',
        snoozed_until: snoozeUntilDate,
        special_notes: notes || followUpToSnooze.special_notes
      });

      // Find and update any subsequent steps in the same sequence
      const relatedFollowUps = tentativeFollowUps.filter(fu =>
        fu.sequence_group_id === followUpToSnooze.sequence_group_id &&
        fu.follow_up_sequence > followUpToSnooze.follow_up_sequence &&
        fu.status === 'Pending'
      );

      for (const relatedFollowUp of relatedFollowUps) {
        // Calculate new date by adding the same number of days
        const currentDate = new Date(relatedFollowUp.tentative_date);
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + daysDifference);

        // Update in Supabase
        await supabase.from<TentativeFollowUp>('follow_ups').update(relatedFollowUp.id, {
          tentative_date: format(newDate, 'yyyy-MM-dd'),
          special_notes: relatedFollowUp.special_notes ||
            `Rescheduled due to patient unavailability for step ${followUpToSnooze.follow_up_sequence}`
        });
      }

      // Fetch all follow-ups to update local state
      const allFollowUps = await supabase.from<TentativeFollowUp>('follow_ups').getAll();
      setTentativeFollowUps(allFollowUps);

      toast({
        title: 'Success',
        description: 'Follow-up snoozed successfully.',
      });
    } catch (error) {
      console.error('Error snoozing follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to snooze follow-up. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Update special notes for a follow-up
  const updateFollowUpNotes = async (followUpId: string, notes: string): Promise<void> => {
    try {
      // Find the follow-up to update
      const followUp = tentativeFollowUps.find(fu => fu.follow_up_id === followUpId);

      if (!followUp) {
        throw new Error('Follow-up not found');
      }

      // Update in Supabase
      await supabase.from<TentativeFollowUp>('follow_ups').update(followUp.id, { special_notes: notes });

      // Update local state
      setTentativeFollowUps(prev =>
        prev.map(fu =>
          fu.follow_up_id === followUpId
            ? { ...fu, special_notes: notes }
            : fu
        )
      );

      toast({
        title: 'Success',
        description: 'Follow-up notes updated successfully.',
      });
    } catch (error) {
      console.error('Error updating follow-up notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow-up notes. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get pending follow-ups
  const getPendingFollowUps = (): TentativeFollowUp[] => {
    return tentativeFollowUps.filter(followUp =>
      // Only show follow-ups that are pending (not completed, scheduled, or cancelled)
      followUp.status === 'Pending'
    );
  };

  // Get snoozed follow-ups
  const getSnoozedFollowUps = (): TentativeFollowUp[] => {
    return tentativeFollowUps.filter(followUp =>
      // Only show follow-ups that are snoozed (not completed, scheduled, or cancelled)
      followUp.status === 'Snoozed'
    );
  };

  // No database initialization handler needed

  // If there's a database error, just show a simple error message
  if (databaseError) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">No Data Available</h2>
        <p className="mb-4 text-gray-600">The dental history data is not available at the moment. This could be because the database is still being set up.</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <DentalHistoryContext.Provider
      value={{
        dentalHistory,
        tentativeFollowUps,
        servicesWithFollowUp,
        isLoading,
        getPatientHistory,
        updateServiceFollowUpConfig,
        markAppointmentCompleted,
        updateFollowUpStatus,
        updatePaymentStatus,
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
