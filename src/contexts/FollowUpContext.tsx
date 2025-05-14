import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays } from 'date-fns';

// Define the follow-up interface based on the follow_ups table
export interface FollowUp {
  id: string;
  follow_up_id: string;
  patient_id: string;
  patient_name: string;
  based_on_appointment_id?: string;
  tentative_date: string; // YYYY-MM-DD format
  follow_up_sequence: number;
  total_steps_in_sequence: number;
  sequence_group_id?: string;
  suggested_service_name: string;
  original_service: string;
  original_doctor: string;
  original_doctor_id?: string;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Snoozed' | 'Waiting';
  based_on_charting_entry_id?: string;
  based_on_charting_entry_uuid?: string;
  scheduled_appointment_id?: string;
  follow_up_type?: 'Treatment' | 'Check' | 'Maintenance';
  special_notes?: string;
  snoozed_until?: string; // YYYY-MM-DD format
  created_at?: string;
  updated_at?: string;
}

// Define the dental history entry interface
interface DentalHistoryEntry {
  id: string;
  appointment_id: string;
  patient_id: string;
  date: string;
  service: string;
  doctor: string;
  payment_status: string;
  procedure_performed_notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the context type
interface FollowUpContextType {
  followUps: FollowUp[];
  isLoading: boolean;
  fetchFollowUps: () => Promise<void>;
  addFollowUp: (followUp: Omit<FollowUp, 'id' | 'follow_up_id' | 'created_at' | 'updated_at'>) => Promise<FollowUp>;
  updateFollowUp: (id: string, updates: Partial<Omit<FollowUp, 'id' | 'follow_up_id' | 'created_at' | 'updated_at'>>) => Promise<FollowUp | null>;
  deleteFollowUp: (id: string) => Promise<boolean>;
  getFollowUpsForPatient: (patientId: string) => FollowUp[];
  getPendingFollowUps: () => FollowUp[];
  getSnoozedFollowUps: () => FollowUp[];
  getWaitingFollowUps: () => FollowUp[];
  snoozeFollowUp: (id: string, snoozeUntilDate: string, notes?: string) => Promise<FollowUp | null>;
  activateFollowUp: (id: string) => Promise<FollowUp | null>;
  completeFollowUp: (id: string, notes?: string) => Promise<FollowUp | null>;
  cancelFollowUp: (id: string, notes?: string) => Promise<FollowUp | null>;
  scheduleFollowUp: (id: string, appointmentId: string) => Promise<FollowUp | null>;
  createMissingFollowUps: () => Promise<void>; // Add the new function
}

// Create the context
const FollowUpContext = createContext<FollowUpContextType | undefined>(undefined);

// Helper function to deduplicate follow-ups
const deduplicateFollowUps = (followUps: FollowUp[]): FollowUp[] => {
  // Create a map to track unique follow-ups by patient and appointment
  const uniqueMap = new Map<string, FollowUp>();

  // Sort by created_at (newest first) so we keep the most recent entries
  const sortedFollowUps = [...followUps].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

    // If created_at dates are the same, use ID as a tiebreaker for stable sorting
    if (dateA === dateB) {
      return (a.id || '').localeCompare(b.id || '');
    }

    return dateB - dateA; // Newest first
  });

  // Process each follow-up
  for (const followUp of sortedFollowUps) {
    // Create a unique key based on patient_id, based_on_appointment_id, and suggested_service_name
    const key = `${followUp.patient_id}|${followUp.based_on_appointment_id || ''}|${followUp.suggested_service_name}`;

    // Only add if we haven't seen this combination before
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, followUp);
    }
  }

  // Get unique follow-ups
  const uniqueFollowUps = Array.from(uniqueMap.values());

  // Sort the deduplicated follow-ups by tentative_date for stable display order
  return uniqueFollowUps.sort((a, b) => {
    // Primary sort by tentative_date
    const dateA = new Date(a.tentative_date).getTime();
    const dateB = new Date(b.tentative_date).getTime();

    if (dateA !== dateB) {
      return dateA - dateB; // Earliest first
    }

    // Secondary sort by patient name
    if (a.patient_name !== b.patient_name) {
      return a.patient_name.localeCompare(b.patient_name);
    }

    // Tertiary sort by service name
    if (a.suggested_service_name !== b.suggested_service_name) {
      return a.suggested_service_name.localeCompare(b.suggested_service_name);
    }

    // Final sort by ID for absolute stability
    return (a.id || '').localeCompare(b.id || '');
  });
};

// Provider component
export const FollowUpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { supabase } = useSupabase();

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch follow-ups from Supabase
  const fetchFollowUps = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching follow-ups...');

      // Try a direct query to the follow_ups table using the custom client
      try {
        console.log('Querying follow_ups table directly...');
        // Use the custom Supabase client implementation with getAll
        const directData = await supabase.from<FollowUp>('follow_ups').getAll({
          order: { column: 'tentative_date', ascending: true }
        });

        if (directData && directData.length > 0) {
          console.log(`Direct query found ${directData.length} follow-ups`);

          // Check for any with Waiting status
          const waitingFollowUps = directData.filter(f => f.status === 'Waiting');
          console.log(`Found ${waitingFollowUps.length} follow-ups with Waiting status`);

          // Log all statuses for debugging
          const statusCounts = {};
          directData.forEach(f => {
            statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
          });
          console.log('Follow-ups by status:', statusCounts);

          // Deduplicate follow-ups before updating state
          const uniqueFollowUps = deduplicateFollowUps(directData);
          console.log(`Deduplicated follow-ups: ${directData.length} -> ${uniqueFollowUps.length}`);

          // Update state with the deduplicated data
          setFollowUps(uniqueFollowUps);
          return; // Exit early since we've set the data
        } else {
          console.log('Direct query found no follow-ups');
        }
      } catch (directQueryError) {
        console.error('Error in direct query - exception:', {
          name: directQueryError.name,
          message: directQueryError.message,
          stack: directQueryError.stack,
          fullError: JSON.stringify(directQueryError)
        });
      }

      // Fall back to using the custom Supabase client implementation
      console.log('Falling back to custom Supabase client...');
      const data = await supabase.from<FollowUp>('follow_ups').getAll({
        order: { column: 'tentative_date', ascending: true }
      });

      console.log(`Fetched ${data?.length || 0} follow-ups`);

      // Log details of each follow-up for debugging
      if (data && data.length > 0) {
        console.log('Follow-ups details:');
        data.forEach(followUp => {
          console.log(`- Patient: ${followUp.patient_name}, Service: ${followUp.suggested_service_name}, Status: ${followUp.status}, Date: ${followUp.tentative_date}`);
        });

        // Check for any with Waiting status
        const waitingFollowUps = data.filter(f => f.status === 'Waiting');
        console.log(`Found ${waitingFollowUps.length} follow-ups with Waiting status`);

        // Deduplicate follow-ups before updating state
        const uniqueFollowUps = deduplicateFollowUps(data);
        console.log(`Deduplicated follow-ups: ${data.length} -> ${uniqueFollowUps.length}`);

        // Update state with the deduplicated data
        setFollowUps(uniqueFollowUps);
        return; // Exit early since we've set the data
      } else {
        console.log('No follow-ups found in the database');
      }

      // Final fallback - deduplicate and set data
      const finalData = data || [];
      const uniqueFollowUps = deduplicateFollowUps(finalData);
      console.log(`Final deduplicated follow-ups: ${finalData.length} -> ${uniqueFollowUps.length}`);
      setFollowUps(uniqueFollowUps);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow-ups. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create follow-ups for dental checkups that might be missing them
  const createMissingFollowUps = async () => {
    try {
      console.log('Checking for missing follow-ups for dental checkups...');

      // Get recent dental history entries using the custom Supabase client
      const historyData = await supabase.from('dental_history').getAll({
        order: { column: 'date', ascending: false },
        limit: 20
      });

      if (!historyData) {
        console.error('Error fetching dental history');
        return;
      }

      if (historyData.length === 0) {
        console.log('No dental history entries found');
        return;
      }

      console.log(`Found ${historyData.length} dental history entries`);

      // Filter for dental checkups
      const checkups = historyData.filter(entry => {
        // Make sure entry is an object with the required properties
        if (typeof entry !== 'object' || entry === null) return false;

        // Cast to DentalHistoryEntry type
        const historyEntry = entry as DentalHistoryEntry;

        // Check if it has a service property that's a string
        return typeof historyEntry.service === 'string' &&
               historyEntry.service.toLowerCase().includes('dental') &&
               historyEntry.service.toLowerCase().includes('check');
      }) as DentalHistoryEntry[];

      if (checkups.length === 0) {
        console.log('No dental checkups found in history');
        return;
      }

      console.log(`Found ${checkups.length} dental checkups`);

      // Get existing follow-ups - create a set of patient_id + appointment_id combinations
      const existingFollowUpKeys = new Set<string>();

      followUps.forEach(f => {
        if (f.patient_id && f.based_on_appointment_id) {
          existingFollowUpKeys.add(`${f.patient_id}|${f.based_on_appointment_id}`);
        }
      });

      console.log(`Found ${existingFollowUpKeys.size} unique existing follow-up combinations`);

      // Filter for checkups that don't have follow-ups
      const checkupsWithoutFollowUps = checkups.filter(checkup => {
        const key = `${checkup.patient_id}|${checkup.appointment_id}`;
        return !existingFollowUpKeys.has(key);
      });

      if (checkupsWithoutFollowUps.length === 0) {
        console.log('All dental checkups already have follow-ups');
        return;
      }

      console.log(`Found ${checkupsWithoutFollowUps.length} dental checkups without follow-ups`);

      // Create follow-ups for these checkups
      for (const checkup of checkupsWithoutFollowUps) {
        // Get patient name using the custom Supabase client
        const patients = await supabase.from('patients').getAll({
          filters: { id: checkup.patient_id }
        });

        if (!patients || patients.length === 0) {
          console.log(`Could not find patient with ID ${checkup.patient_id}`);
          continue;
        }

        const patientName = patients[0].name || 'Unknown Patient';

        // Try to find a service follow-up rule for this service
        try {
          // Fetch service follow-up rules
          const { data: rulesData } = await supabase
            .from('service_follow_up_rules')
            .select('*')
            .eq('triggering_service_name', checkup.service);

          // Generate a unique sequence group ID for this set of follow-ups
          const sequenceGroupId = `seq-${Math.random().toString(36).substring(2, 10)}`;

          if (rulesData && rulesData.length > 0) {
            console.log(`Found service follow-up rule for ${checkup.service}`);
            const rule = rulesData[0];

            // Fetch steps for this rule
            const { data: stepsData } = await supabase
              .from('follow_up_steps')
              .select('*')
              .eq('service_follow_up_rule_id', rule.id)
              .order('sequence', { ascending: true });

            if (stepsData && stepsData.length > 0) {
              console.log(`Found ${stepsData.length} steps for this rule`);

              // Create follow-ups for each step
              for (let i = 0; i < stepsData.length; i++) {
                const step = stepsData[i];

                // Calculate follow-up date based on interval days
                const checkupDate = new Date(checkup.date);
                const followUpDate = new Date(checkupDate);
                followUpDate.setDate(followUpDate.getDate() + step.interval_days);

                // Generate a unique follow-up ID
                const followUpId = `FU${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

                // Create the follow-up
                const newFollowUp = {
                  follow_up_id: followUpId,
                  patient_id: checkup.patient_id,
                  patient_name: patientName,
                  based_on_appointment_id: checkup.appointment_id,
                  tentative_date: followUpDate.toISOString().split('T')[0],
                  follow_up_sequence: step.sequence,
                  total_steps_in_sequence: stepsData.length,
                  sequence_group_id: sequenceGroupId,
                  suggested_service_name: step.suggested_service_name || checkup.service,
                  original_service: checkup.service,
                  original_doctor: checkup.doctor,
                  // First step is Pending, others are Waiting
                  status: i === 0 ? 'Pending' as const : 'Waiting' as const,
                  special_notes: step.notes || ''
                };

                console.log(`Creating follow-up step ${step.sequence}/${stepsData.length} for ${patientName}'s ${checkup.service}:`, newFollowUp);

                // Insert into database using the custom Supabase client
                try {
                  const insertedFollowUp = await supabase.from<FollowUp>('follow_ups').insert(newFollowUp);
                  console.log(`Successfully created follow-up step ${step.sequence}:`, insertedFollowUp);
                } catch (insertError) {
                  console.error(`Error inserting follow-up step ${step.sequence}:`, insertError);
                }
              }

              // Skip the default follow-up creation since we created steps
              continue;
            }
          }

          // If no rule was found or no steps were found, create a default follow-up
          console.log(`No service follow-up rule found for ${checkup.service}, creating default follow-up`);

          // Calculate follow-up date (6 months from checkup date)
          const checkupDate = new Date(checkup.date);
          const followUpDate = new Date(checkupDate);
          followUpDate.setMonth(followUpDate.getMonth() + 6);

          // Generate a unique follow-up ID
          const followUpId = `FU${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

          // Create the follow-up
          const newFollowUp = {
            follow_up_id: followUpId,
            patient_id: checkup.patient_id,
            patient_name: patientName,
            based_on_appointment_id: checkup.appointment_id,
            tentative_date: followUpDate.toISOString().split('T')[0],
            follow_up_sequence: 1,
            total_steps_in_sequence: 1,
            sequence_group_id: sequenceGroupId,
            suggested_service_name: 'Dental Checkup',
            original_service: checkup.service,
            original_doctor: checkup.doctor,
            status: 'Pending' as const
          };

          console.log(`Creating default follow-up for ${patientName}'s dental checkup:`, newFollowUp);

          // Insert into database using the custom Supabase client
          try {
            const insertedFollowUp = await supabase.from<FollowUp>('follow_ups').insert(newFollowUp);
            console.log('Successfully created default follow-up:', insertedFollowUp);
          } catch (insertError) {
            console.error('Error inserting default follow-up:', insertError);
          }
        } catch (ruleError) {
          console.error('Error fetching service follow-up rules:', ruleError);

          // Fallback to creating a default follow-up
          // Calculate follow-up date (6 months from checkup date)
          const checkupDate = new Date(checkup.date);
          const followUpDate = new Date(checkupDate);
          followUpDate.setMonth(followUpDate.getMonth() + 6);

          // Generate a unique follow-up ID
          const followUpId = `FU${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

          // Create the follow-up
          const newFollowUp = {
            follow_up_id: followUpId,
            patient_id: checkup.patient_id,
            patient_name: patientName,
            based_on_appointment_id: checkup.appointment_id,
            tentative_date: followUpDate.toISOString().split('T')[0],
            follow_up_sequence: 1,
            total_steps_in_sequence: 1,
            sequence_group_id: `seq-${Math.random().toString(36).substring(2, 10)}`,
            suggested_service_name: 'Dental Checkup',
            original_service: checkup.service,
            original_doctor: checkup.doctor,
            status: 'Pending' as const
          };

          console.log(`Creating fallback follow-up for ${patientName}'s dental checkup:`, newFollowUp);

          // Insert into database using the custom Supabase client
          try {
            const insertedFollowUp = await supabase.from<FollowUp>('follow_ups').insert(newFollowUp);
            console.log('Successfully created fallback follow-up:', insertedFollowUp);
          } catch (insertError) {
            console.error('Error inserting fallback follow-up:', insertError);
          }
        }
      }

      // Refresh follow-ups
      await fetchFollowUps();

    } catch (error) {
      console.error('Error creating missing follow-ups:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    const initialize = async () => {
      await fetchFollowUps();

      // No longer automatically creating follow-ups
      // All follow-ups will be created manually when appointments are completed
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new follow-up
  const addFollowUp = async (followUp: Omit<FollowUp, 'id' | 'follow_up_id' | 'created_at' | 'updated_at'>): Promise<FollowUp> => {
    try {
      // Generate a unique follow-up ID
      const followUpId = `FU${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

      // Prepare the follow-up data
      const newFollowUp = {
        ...followUp,
        follow_up_id: followUpId,
      };

      // Insert into Supabase using the custom client
      const data = await supabase.from<FollowUp>('follow_ups').insert(newFollowUp);

      if (!data) throw new Error('Failed to create follow-up');

      // Update local state
      setFollowUps(prev => [...prev, data]);

      toast({
        title: 'Success',
        description: 'Follow-up has been created successfully.',
      });

      return data;
    } catch (error) {
      console.error('Error adding follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to create follow-up. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing follow-up
  const updateFollowUp = async (id: string, updates: Partial<Omit<FollowUp, 'id' | 'follow_up_id' | 'created_at' | 'updated_at'>>): Promise<FollowUp | null> => {
    try {
      // Update in Supabase using the custom client
      const data = await supabase.from<FollowUp>('follow_ups').update(id, updates);

      if (!data) return null;

      // Update local state
      setFollowUps(prev => prev.map(f => f.id === id ? data : f));

      return data;
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow-up. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete a follow-up
  const deleteFollowUp = async (id: string): Promise<boolean> => {
    try {
      // Delete from Supabase using the custom client
      await supabase.from('follow_ups').delete(id);

      // Update local state
      setFollowUps(prev => prev.filter(f => f.id !== id));

      toast({
        title: 'Success',
        description: 'Follow-up has been deleted successfully.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete follow-up. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get follow-ups for a specific patient
  const getFollowUpsForPatient = (patientId: string): FollowUp[] => {
    return followUps.filter(f => f.patient_id === patientId);
  };

  // Get all pending follow-ups - memoized for stability
  const getPendingFollowUps = (): FollowUp[] => {
    // Filter for pending follow-ups
    const pendingFollowUps = followUps.filter(f => f.status === 'Pending');

    // Sort them in a stable order
    const sortedPendingFollowUps = [...pendingFollowUps].sort((a, b) => {
      // Primary sort by date
      const dateA = new Date(a.tentative_date).getTime();
      const dateB = new Date(b.tentative_date).getTime();

      if (dateA !== dateB) {
        return dateA - dateB; // Earliest first
      }

      // Secondary sort by patient name
      const nameCompare = a.patient_name.localeCompare(b.patient_name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      // Tertiary sort by ID for absolute stability
      return (a.id || '').localeCompare(b.id || '');
    });

    console.log(`Found ${sortedPendingFollowUps.length} pending follow-ups:`,
      sortedPendingFollowUps.map(f => ({
        patient: f.patient_name,
        service: f.suggested_service_name,
        date: f.tentative_date
      }))
    );

    return sortedPendingFollowUps;
  };

  // Get all snoozed follow-ups - memoized for stability
  const getSnoozedFollowUps = (): FollowUp[] => {
    // Filter for snoozed follow-ups
    const snoozedFollowUps = followUps.filter(f => f.status === 'Snoozed');

    // Sort them in a stable order
    const sortedSnoozedFollowUps = [...snoozedFollowUps].sort((a, b) => {
      // Primary sort by date
      const dateA = new Date(a.tentative_date).getTime();
      const dateB = new Date(b.tentative_date).getTime();

      if (dateA !== dateB) {
        return dateA - dateB; // Earliest first
      }

      // Secondary sort by patient name
      const nameCompare = a.patient_name.localeCompare(b.patient_name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      // Tertiary sort by ID for absolute stability
      return (a.id || '').localeCompare(b.id || '');
    });

    console.log(`Found ${sortedSnoozedFollowUps.length} snoozed follow-ups`);
    return sortedSnoozedFollowUps;
  };

  // Get all waiting follow-ups - memoized for stability
  const getWaitingFollowUps = (): FollowUp[] => {
    // Debug: Log all follow-ups to see what we have
    console.log('All follow-ups in getWaitingFollowUps:', followUps.map(f => ({
      id: f.id,
      patient: f.patient_name,
      status: f.status,
      sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
      date: f.tentative_date
    })));

    // Check if we have any follow-ups with 'Waiting' status
    const hasWaitingStatus = followUps.some(f => f.status === 'Waiting');
    console.log('Do we have any follow-ups with Waiting status?', hasWaitingStatus);

    // Filter for waiting follow-ups - use exact string comparison
    const waitingFollowUps = followUps.filter(f => {
      const isWaiting = f.status === 'Waiting';
      if (isWaiting) {
        console.log('Found a waiting follow-up:', f);
      }
      return isWaiting;
    });

    console.log('Waiting follow-ups before sorting:', waitingFollowUps.map(f => ({
      id: f.id,
      patient: f.patient_name,
      status: f.status,
      sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
      date: f.tentative_date
    })));

    // Sort them in a stable order
    const sortedWaitingFollowUps = [...waitingFollowUps].sort((a, b) => {
      // Primary sort by date
      const dateA = new Date(a.tentative_date).getTime();
      const dateB = new Date(b.tentative_date).getTime();

      if (dateA !== dateB) {
        return dateA - dateB; // Earliest first
      }

      // Secondary sort by patient name
      const nameCompare = a.patient_name.localeCompare(b.patient_name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      // Tertiary sort by sequence number if they're in the same sequence
      if (a.sequence_group_id && b.sequence_group_id && a.sequence_group_id === b.sequence_group_id) {
        return a.follow_up_sequence - b.follow_up_sequence;
      }

      // Final sort by ID for absolute stability
      return (a.id || '').localeCompare(b.id || '');
    });

    console.log(`Found ${sortedWaitingFollowUps.length} waiting follow-ups:`,
      sortedWaitingFollowUps.map(f => ({
        id: f.id,
        patient: f.patient_name,
        sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
        date: f.tentative_date
      }))
    );
    return sortedWaitingFollowUps;
  };

  // Snooze a follow-up
  const snoozeFollowUp = async (id: string, snoozeUntilDate: string, notes?: string): Promise<FollowUp | null> => {
    const updates: Partial<FollowUp> = {
      status: 'Snoozed',
      snoozed_until: snoozeUntilDate
    };

    if (notes) {
      updates.special_notes = notes;
    }

    return updateFollowUp(id, updates);
  };

  // Activate a snoozed follow-up
  const activateFollowUp = async (id: string): Promise<FollowUp | null> => {
    return updateFollowUp(id, {
      status: 'Pending',
      snoozed_until: undefined
    });
  };

  // Mark a follow-up as completed
  const completeFollowUp = async (id: string, notes?: string): Promise<FollowUp | null> => {
    const updates: Partial<FollowUp> = {
      status: 'Completed'
    };

    if (notes) {
      updates.special_notes = notes;
    }

    // Update the current follow-up
    const updatedFollowUp = await updateFollowUp(id, updates);

    if (updatedFollowUp) {
      console.log('Follow-up completed:', updatedFollowUp);

      // Check if this is part of a sequence
      if (updatedFollowUp.sequence_group_id &&
          updatedFollowUp.follow_up_sequence < updatedFollowUp.total_steps_in_sequence) {

        console.log(`This is part of a sequence (${updatedFollowUp.follow_up_sequence}/${updatedFollowUp.total_steps_in_sequence})`);

        // Find the next step in the sequence
        const nextStepFollowUps = followUps.filter(f =>
          f.sequence_group_id === updatedFollowUp.sequence_group_id &&
          f.follow_up_sequence === updatedFollowUp.follow_up_sequence + 1 &&
          f.status === 'Waiting'
        );

        console.log(`Found ${nextStepFollowUps.length} next steps in the sequence`);

        // If we found the next step, update its status to Pending
        if (nextStepFollowUps.length > 0) {
          const nextStep = nextStepFollowUps[0];
          console.log('Updating next step to Pending:', nextStep);

          await updateFollowUp(nextStep.id, {
            status: 'Pending'
          });

          // Refresh the follow-ups list
          await fetchFollowUps();

          // Show toast notification
          toast({
            title: 'Next Follow-up Step Activated',
            description: `Step ${nextStep.follow_up_sequence} of ${nextStep.total_steps_in_sequence} for ${nextStep.patient_name} is now pending.`,
          });

          console.log('Next step updated and follow-ups refreshed');
        }
      }
    }

    return updatedFollowUp;
  };

  // Cancel a follow-up
  const cancelFollowUp = async (id: string, notes?: string): Promise<FollowUp | null> => {
    const updates: Partial<FollowUp> = {
      status: 'Cancelled'
    };

    if (notes) {
      updates.special_notes = notes;
    }

    return updateFollowUp(id, updates);
  };

  // Schedule a follow-up by linking it to an appointment
  const scheduleFollowUp = async (id: string, appointmentId: string): Promise<FollowUp | null> => {
    // Update the current follow-up
    const updatedFollowUp = await updateFollowUp(id, {
      status: 'Scheduled',
      scheduled_appointment_id: appointmentId
    });

    if (updatedFollowUp) {
      console.log('Follow-up scheduled:', updatedFollowUp);

      // Check if this is part of a sequence
      if (updatedFollowUp.sequence_group_id &&
          updatedFollowUp.follow_up_sequence < updatedFollowUp.total_steps_in_sequence) {

        console.log(`This is part of a sequence (${updatedFollowUp.follow_up_sequence}/${updatedFollowUp.total_steps_in_sequence})`);

        // Find the next step in the sequence
        const nextStepFollowUps = followUps.filter(f =>
          f.sequence_group_id === updatedFollowUp.sequence_group_id &&
          f.follow_up_sequence === updatedFollowUp.follow_up_sequence + 1 &&
          f.status === 'Waiting'
        );

        console.log(`Found ${nextStepFollowUps.length} next steps in the sequence`);

        // If we found the next step, update its status to Pending
        if (nextStepFollowUps.length > 0) {
          const nextStep = nextStepFollowUps[0];
          console.log('Updating next step to Pending:', nextStep);

          await updateFollowUp(nextStep.id, {
            status: 'Pending'
          });

          // Refresh the follow-ups list
          await fetchFollowUps();

          console.log('Next step updated and follow-ups refreshed');
        }
      }
    }

    return updatedFollowUp;
  };

  return (
    <FollowUpContext.Provider
      value={{
        followUps,
        isLoading,
        fetchFollowUps,
        addFollowUp,
        updateFollowUp,
        deleteFollowUp,
        getFollowUpsForPatient,
        getPendingFollowUps,
        getSnoozedFollowUps,
        getWaitingFollowUps,
        snoozeFollowUp,
        activateFollowUp,
        completeFollowUp,
        cancelFollowUp,
        scheduleFollowUp,
        createMissingFollowUps // Add the new function to the context
      }}
    >
      {children}
    </FollowUpContext.Provider>
  );
};

// Create a hook to use the context
export const useFollowUps = () => {
  const context = useContext(FollowUpContext);
  if (context === undefined) {
    throw new Error('useFollowUps must be used within a FollowUpProvider');
  }
  return context;
};
