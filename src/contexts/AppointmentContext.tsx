import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from './AuditLogContext';
import { AuditLogTemplates } from '@/utils/auditLogger';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useClinic } from './ClinicContext';
import { useServices } from './ServiceContext';
import { handleDatabaseError } from '@/utils/error-handler';

// Define appointment types
export interface Appointment {
  id: string;
  appointment_code: string;
  patient_id: string;
  // patient_name is not in the database schema, but we need it for UI display
  patient_name?: string; // Not stored in DB, used for UI only
  time: string;
  service: string;
  date: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  payment_status?: 'paid' | 'unpaid';
  based_on_follow_up_id?: string;
  notes?: string;
  clinic_type: 'dental' | 'meditouch';
  doctor?: string;
  second_patient?: string;
  treatment_type?: string;
  therapist?: string;
  created_at?: string;
  updated_at?: string;
  doctor_id?: string;
  charting_entry_id?: string;
  duration_minutes?: number;
}

export type DentalAppointment = Appointment & {
  clinic_type: 'dental';
  doctor: string;
};

export type MeditouchAppointment = Appointment & {
  clinic_type: 'meditouch';
};

// No default appointments - everything will come from Supabase

// Define context type
interface AppointmentContextType {
  dentalAppointments: DentalAppointment[];
  meditouchAppointments: MeditouchAppointment[];
  isLoading: boolean;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'appointment_code' | 'created_at' | 'updated_at'>) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Omit<Appointment, 'id' | 'appointment_code' | 'created_at' | 'updated_at'>>) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentsByDate: (date: Date, clinic: 'dental' | 'meditouch') => Promise<Appointment[]>;
  getAppointmentsByDateRange: (startDate: Date, endDate: Date, clinic: 'dental' | 'meditouch') => Promise<Appointment[]>;
  getPatientAppointments: (patientId: string, clinic: 'dental' | 'meditouch' | 'both') => Promise<Appointment[]>;
  getUpcomingAppointments: (clinic: 'dental' | 'meditouch') => Promise<Appointment[]>;
  markAppointmentCompleted: (appointmentId: string) => Promise<void>;
  getAvailableTimeSlots: (date: Date, clinic: 'dental' | 'meditouch') => Promise<string[]>;
}

// Create context
const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// Provider component
export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dentalAppointments, setDentalAppointments] = useState<Appointment[]>([]);
  const [meditouchAppointments, setMeditouchAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // EMERGENCY FIX: Add patient name cache to prevent repeated fetching
  const [patientNameCache, setPatientNameCache] = useState<Map<string, string>>(new Map());

  const { supabase } = useSupabase();
  const { toast } = useToast();
  const { isDental } = useClinic();
  const { getServiceByName } = useServices();
  const { logAction } = useAuditLog();

  // EMERGENCY FIX: Helper function to get patient names with caching
  const getPatientNamesForAppointments = async (appointments: Appointment[]): Promise<Appointment[]> => {
    if (appointments.length === 0) return appointments;

    // Get unique patient IDs that we don't have cached
    const patientIds = [...new Set(appointments.map(app => app.patient_id).filter(Boolean))];
    const uncachedPatientIds = patientIds.filter(id => !patientNameCache.has(id));

    // Only fetch patients we don't have cached
    if (uncachedPatientIds.length > 0) {
      try {
        // Fetch only the specific patients we need, with pagination
        const patients = await supabase.from<{ id: string; name: string }>('patients').getAll({
          select: 'id, name',
          limit: Math.min(uncachedPatientIds.length + 10, 100)  // Reasonable limit
        });

        // Update cache with new patient names
        const newCache = new Map(patientNameCache);
        patients.forEach(patient => {
          if (patient.id && patient.name && uncachedPatientIds.includes(patient.id)) {
            newCache.set(patient.id, patient.name);
          }
        });
        setPatientNameCache(newCache);
      } catch (error) {
        console.error('Error fetching patient names:', error);
      }
    }

    // Add patient names to appointments using cache
    return appointments.map(app => ({
      ...app,
      patient_name: patientNameCache.get(app.patient_id) || 'Unknown Patient'
    }));
  };

  // Initialize appointments from Supabase
  useEffect(() => {
    const initializeAppointments = async () => {
      try {
        setIsLoading(true);

        try {
          // Fetch all appointments from Supabase
          const fetchedAppointments = await supabase.from<Appointment>('appointments').getAll({
            order: { column: 'date', ascending: false } // Latest first
          });

          console.log('Fetched all appointments:', fetchedAppointments);

          // Fetch all patients to get their names
          const patients = await supabase.from<{ id: string; name: string }>('patients').getAll();
          console.log('Fetched patients for name lookup:', patients.length);

          // Create a map of patient IDs to names for quick lookup
          const patientNameMap: Record<string, string> = {};
          patients.forEach(patient => {
            if (patient.id && patient.name) {
              patientNameMap[patient.id] = patient.name;
            }
          });

          // Add patient names to appointments
          const appointmentsWithNames = fetchedAppointments.map(app => {
            return {
              ...app,
              patient_name: patientNameMap[app.patient_id] || 'Unknown Patient'
            };
          });

          console.log('Added patient names to appointments');

          // Filter appointments by clinic type
          const dentalApps = appointmentsWithNames.filter(app => app.clinic_type === 'dental') as DentalAppointment[];
          const meditouchApps = appointmentsWithNames.filter(app => app.clinic_type === 'meditouch') as MeditouchAppointment[];

          console.log('Filtered dental appointments:', dentalApps.length);
          console.log('Filtered meditouch appointments:', meditouchApps.length);

          // Set fetched appointments in state
          setDentalAppointments(dentalApps);
          setMeditouchAppointments(meditouchApps);
        } catch (error) {
          console.error('Error fetching appointments:', error);

          // Set empty arrays instead of using default data
          setDentalAppointments([]);
          setMeditouchAppointments([]);

          // Use the global error handler
          // handleDatabaseError({
          //   error,
          //   toast,
          //   errorKey: 'appointments_init_error',
          //   customMessage: 'Appointments will be available after setup is complete.',
          //   showToast: true
          // });
          console.error('Error accessing appointments table:', error);
        }
      } catch (error) {
        console.error('Error initializing appointments:', error);
        // Use the global error handler
        // handleDatabaseError({
        //   error,
        //   toast,
        //   errorKey: 'appointments_init_error',
        //   customMessage: 'Appointments will be available after setup is complete.',
        //   showToast: true
        // });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAppointments();
  }, [supabase, toast]);

  // Add a new appointment
  const addAppointment = async (
    appointment: Omit<Appointment, 'id' | 'appointment_code' | 'created_at' | 'updated_at'>
  ): Promise<Appointment> => {
    try {
      console.log('addAppointment called with data:', JSON.stringify(appointment, null, 2));

      // Validate required fields
      if (!appointment.patient_name) {
        console.error('Missing patient_name in appointment data');
        throw new Error('Patient name is required');
      }

      if (!appointment.service) {
        console.error('Missing service in appointment data');
        throw new Error('Service is required');
      }

      if (!appointment.time) {
        console.error('Missing time in appointment data');
        throw new Error('Time is required');
      }

      if (!appointment.date) {
        console.error('Missing date in appointment data');
        throw new Error('Date is required');
      }

      if (!appointment.clinic_type) {
        console.error('Missing clinic_type in appointment data');
        throw new Error('Clinic type is required');
      }

      // Generate a unique appointment code
      const isDental = appointment.clinic_type === 'dental';
      const appointmentCode = `${isDental ? 'd' : 'm'}${uuidv4().substring(0, 8)}`;

      // Generate a UUID for the appointment
      const id = uuidv4();

      // Create new appointment with ID and code
      // Extract patient_name since it's not in the database schema
      const { patient_name, ...appointmentData } = appointment;

      // Calculate duration in minutes based on service if not provided
      console.log('Checking service duration for:', appointment);
      if (!appointment.duration_minutes) {
        if (appointment.service && appointment.clinic_type) {
          try {
            console.log(`Looking up service: "${appointment.service}" for clinic: ${appointment.clinic_type}`);

            // Get the actual service from the services context
            const serviceData = getServiceByName(appointment.service, appointment.clinic_type);

            if (serviceData && serviceData.duration) {
              appointment.duration_minutes = serviceData.duration;
              console.log(`Found service duration: ${serviceData.duration} minutes for service: ${appointment.service}`);
            } else {
              // Default to 30 minutes if service not found
              appointment.duration_minutes = 30;
              console.log(`Service not found in database, defaulting to 30 minutes for service: ${appointment.service}`);
            }
          } catch (error) {
            console.error('Error looking up service duration:', error);
            // Default to 30 minutes if there's an error
            appointment.duration_minutes = 30;
            console.log('Defaulted to 30 minutes due to error');
          }
        } else {
          // Default to 30 minutes if no service is specified
          appointment.duration_minutes = 30;
          console.log('No service or clinic_type specified, defaulted to 30 minutes');
        }
      } else {
        console.log(`Using provided duration_minutes: ${appointment.duration_minutes}`);
      }

      const newAppointment = {
        ...appointmentData,
        id,
        appointment_code: appointmentCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        duration_minutes: appointment.duration_minutes,
        status: 'confirmed' as const
      };

      // Note: patient_name will be added back for UI display after Supabase insert

      console.log('Prepared appointment object for Supabase:', JSON.stringify(newAppointment, null, 2));

      // Add to Supabase
      try {
        console.log(`Adding ${isDental ? 'dental' : 'meditouch'} appointment to Supabase table 'appointments'`);

        // Insert into Supabase - send only the data that matches the database schema
        try {
          const result = await supabase.from('appointments').insert(newAppointment);

          // Check if the insert was successful
          if (result.error) {
            console.error('Error inserting appointment:', result.error);
            throw new Error(`Failed to create appointment: ${result.error.message}`);
          }

          console.log('Appointment created successfully');
          const createdAppointment = result.data ? result.data[0] : newAppointment;
          console.log('Created appointment:', createdAppointment);
        } catch (insertError) {
          console.error('Exception during appointment creation:', insertError);
          throw new Error('Failed to create appointment in database');
        }

        // For UI display, we need to add back the patient_name
        const appointmentForUI = {
          ...newAppointment,
          patient_name
        };

        // Update local state based on clinic type
        if (isDental) {
          console.log('Updating local dental appointments state');
          setDentalAppointments(prev => [...prev, appointmentForUI as DentalAppointment]);
        } else {
          console.log('Updating local meditouch appointments state');
          setMeditouchAppointments(prev => [...prev, appointmentForUI as MeditouchAppointment]);
        }

        console.log('Successfully created appointment');

        // Show success toast
        toast({
          title: 'Success',
          description: 'Appointment scheduled successfully.',
        });

        // Log the audit action with detailed information
        try {
          await logAction(AuditLogTemplates.appointment.create(
            newAppointment.id,
            patient_name,
            appointment.service,
            appointment.date,
            appointment.time,
            appointment.doctor || appointment.therapist
          ));
        } catch (auditError) {
          console.error('Failed to log appointment creation audit:', auditError);
        }

        // Return the UI-friendly version with patient_name
        return appointmentForUI;
      } catch (error) {
        console.error('Error in addAppointment Supabase operation:', error);

        // Log more details about the error
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }

        toast({
          title: 'Database Error',
          description: 'Failed to save appointment to database. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule appointment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing appointment
  const updateAppointment = async (
    id: string,
    updates: Partial<Omit<Appointment, 'id' | 'appointment_code' | 'created_at' | 'updated_at'>>
  ): Promise<Appointment> => {
    try {
      // Determine if it's a dental or meditouch appointment
      const dentalAppointment = dentalAppointments.find(a => a.id === id || a.appointment_code === id);
      const meditouchAppointment = meditouchAppointments.find(a => a.id === id || a.appointment_code === id);

      // Find the appointment to update
      const existingAppointment = dentalAppointment || meditouchAppointment;

      if (!existingAppointment) {
        throw new Error(`Appointment with ID ${id} not found`);
      }

      // Add updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Create the updated appointment object
      const updatedLocalAppointment = {
        ...existingAppointment,
        ...updatesWithTimestamp
      };

      console.log('Updating appointment in Supabase:', id, updatesWithTimestamp);

      // Update in Supabase first
      const { data: updatedDbAppointment, error } = await supabase
        .from<Appointment>('appointments')
        .update(id, updatesWithTimestamp);

      if (error) throw error;

      console.log('Supabase response for appointment update:', updatedDbAppointment);

      // Then update local state based on clinic type
      if (updatedLocalAppointment.clinic_type === 'dental') {
        setDentalAppointments(prev =>
          prev.map(a => a.id === id || a.appointment_code === id ? updatedLocalAppointment as DentalAppointment : a)
        );
      } else {
        setMeditouchAppointments(prev =>
          prev.map(a => a.id === id || a.appointment_code === id ? updatedLocalAppointment as MeditouchAppointment : a)
        );
      }

      toast({
        title: 'Success',
        description: 'Appointment updated successfully.',
      });

      // Log the audit action with appropriate type and detailed information
      try {
        let updateType: 'status' | 'details' | 'cancel' | undefined;

        // Determine the type of update
        if (updates.status === 'cancelled') {
          updateType = 'cancel';
        } else if (updates.status && updates.status !== existingAppointment.status) {
          updateType = 'status';
        } else {
          updateType = 'details';
        }

        // Create detailed audit log with appointment information
        await logAction(AuditLogTemplates.appointment.updateDetailed(
          id,
          updatedLocalAppointment.patient_name || 'Unknown Patient',
          updatedLocalAppointment.service,
          updatedLocalAppointment.date,
          updatedLocalAppointment.time,
          updatedLocalAppointment.doctor || updatedLocalAppointment.therapist,
          { before: existingAppointment, after: updatedLocalAppointment },
          updateType
        ));
      } catch (auditError) {
        console.error('Failed to log appointment update audit:', auditError);
      }

      return updatedLocalAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete an appointment
  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      // Determine if it's a dental or meditouch appointment
      const dentalAppointment = dentalAppointments.find(a => a.id === id || a.appointment_code === id);
      const meditouchAppointment = meditouchAppointments.find(a => a.id === id || a.appointment_code === id);

      // Find the appointment to delete
      const existingAppointment = dentalAppointment || meditouchAppointment;

      if (!existingAppointment) {
        throw new Error(`Appointment with ID ${id} not found`);
      }

      // Store appointment info for audit log
      const patientName = existingAppointment.patient_name || 'Unknown Patient';

      console.log('Deleting appointment from Supabase:', id);

      // Delete from Supabase first
      const { error } = await supabase
        .from<Appointment>('appointments')
        .delete(id);

      if (error) throw error;

      console.log('Appointment deleted from Supabase');

      // Then update local state based on clinic type
      if (existingAppointment.clinic_type === 'dental') {
        setDentalAppointments(prev =>
          prev.filter(a => a.id !== id && a.appointment_code !== id)
        );
      } else {
        setMeditouchAppointments(prev =>
          prev.filter(a => a.id !== id && a.appointment_code !== id)
        );
      }

      // Log the audit action with detailed information
      try {
        await logAction(AuditLogTemplates.appointment.delete(
          id,
          patientName,
          existingAppointment.service,
          existingAppointment.date
        ));
      } catch (auditError) {
        console.error('Failed to log appointment deletion audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'Appointment deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete appointment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get appointments for a specific date
  const getAppointmentsByDate = async (date: Date, clinic: 'dental' | 'meditouch'): Promise<Appointment[]> => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');

      // EMERGENCY FIX: Fetch appointments with pagination
      const appointments = await supabase.from<Appointment>('appointments').getAll({
        filters: {
          date: dateString,
          clinic_type: clinic
        },
        order: { column: 'time', ascending: true },
        limit: 100  // EMERGENCY FIX: Add pagination limit for daily appointments
      });

      // EMERGENCY FIX: Use cached patient name fetching
      const appointmentsWithNames = await getPatientNamesForAppointments(appointments);

      console.log(`Fetched ${appointments.length} ${clinic} appointments for date ${dateString} with patient names`);
      return appointmentsWithNames;
    } catch (error) {
      console.error('Error fetching appointments by date:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch appointments. Please try again.',
        variant: 'destructive',
      });

      // Return empty array instead of using local state as fallback
      return [];
    }
  };

  // EMERGENCY FIX: Get appointments for a date range (replaces multiple daily fetches)
  const getAppointmentsByDateRange = async (startDate: Date, endDate: Date, clinic: 'dental' | 'meditouch'): Promise<Appointment[]> => {
    try {
      const startDateString = format(startDate, 'yyyy-MM-dd');
      const endDateString = format(endDate, 'yyyy-MM-dd');

      console.log(`Fetching ${clinic} appointments from ${startDateString} to ${endDateString}`);

      // EMERGENCY FIX: Use a simpler approach - fetch all appointments and filter in JavaScript
      // This is more reliable than complex date range filters
      const appointments = await supabase.from<Appointment>('appointments').getAll({
        filters: {
          clinic_type: clinic
        },
        order: { column: 'date', ascending: true },
        limit: 200  // EMERGENCY FIX: Reduced pagination limit to prevent massive data fetching
      });

      // Filter appointments within the date range in JavaScript
      const filteredAppointments = appointments.filter(app => {
        return app.date >= startDateString && app.date <= endDateString;
      });

      // EMERGENCY FIX: Use cached patient name fetching
      const appointmentsWithNames = await getPatientNamesForAppointments(filteredAppointments);

      console.log(`Fetched ${filteredAppointments.length} ${clinic} appointments for date range ${startDateString} to ${endDateString} with patient names`);
      return appointmentsWithNames;
    } catch (error) {
      console.error(`Error fetching ${clinic} appointments for date range:`, error);
      return [];
    }
  };

  // Get appointments for a specific patient
  const getPatientAppointments = async (patientId: string, clinic: 'dental' | 'meditouch' | 'both'): Promise<Appointment[]> => {
    try {
      // Prepare filters based on clinic type
      let filters: Record<string, any> = { patient_id: patientId };

      if (clinic === 'dental') {
        filters.clinic_type = 'dental';
      } else if (clinic === 'meditouch') {
        filters.clinic_type = 'meditouch';
      }
      // For 'both', we don't add clinic_type filter

      // EMERGENCY FIX: Fetch appointments with pagination
      const appointments = await supabase.from<Appointment>('appointments').getAll({
        filters,
        order: { column: 'date', ascending: true },
        limit: 50  // EMERGENCY FIX: Add pagination limit for patient appointments
      });

      // Fetch the patient name using custom Supabase API
      const patientData = await supabase.from<{ id: string; name: string }>('patients').getById(patientId, {
        select: 'name'
      });

      if (patientData && patientData.name) {
        // Add patient name to all appointments
        const appointmentsWithName = appointments.map(app => ({
          ...app,
          patient_name: patientData.name
        }));

        console.log(`Fetched ${appointments.length} appointments for patient ${patientId} (${patientData.name}) with clinic filter ${clinic}`);
        return appointmentsWithName;
      }

      console.log(`Fetched ${appointments.length} appointments for patient ${patientId} with clinic filter ${clinic}`);
      return appointments;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch patient appointments. Please try again.',
        variant: 'destructive',
      });

      // Return empty array instead of using local state as fallback
      return [];
    }
  };

  // Get upcoming appointments
  const getUpcomingAppointments = async (clinic: 'dental' | 'meditouch'): Promise<Appointment[]> => {
    try {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');

      console.log(`Fetching upcoming ${clinic} appointments from date ${todayString}`);

      // EMERGENCY FIX: Fetch appointments with pagination
      const appointments = await supabase.from<Appointment>('appointments').getAll({
        filters: {
          clinic_type: clinic
        },
        order: { column: 'date', ascending: true },
        limit: 100  // EMERGENCY FIX: Further reduced limit for upcoming appointments
      });

      // Filter for dates >= today and exclude cancelled/completed appointments in JavaScript
      const upcomingAppointments = appointments.filter(app => {
        return app.date >= todayString &&
               app.status !== 'cancelled' &&
               app.status !== 'completed';
      });

      // EMERGENCY FIX: Use cached patient name fetching
      const appointmentsWithNames = await getPatientNamesForAppointments(upcomingAppointments);

      console.log(`Fetched ${appointments.length} total ${clinic} appointments, ${upcomingAppointments.length} are upcoming with patient names`);
      return appointmentsWithNames;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch upcoming appointments. Please try again.',
        variant: 'destructive',
      });

      // Return empty array
      return [];
    }
  };

  // Mark an appointment as completed
  const markAppointmentCompleted = async (appointmentId: string): Promise<void> => {
    try {
      console.log(`Marking appointment ${appointmentId} as completed`);

      // Find the appointment first to get details for audit log
      const appointment = dentalAppointments.find(a => a.id === appointmentId || a.appointment_code === appointmentId) ||
                         meditouchAppointments.find(a => a.id === appointmentId || a.appointment_code === appointmentId);

      // Update appointment status
      await updateAppointment(appointmentId, { status: 'completed' });

      // Log specific completion audit entry
      if (appointment) {
        try {
          await logAction(AuditLogTemplates.appointment.complete(
            appointmentId,
            appointment.patient_name || 'Unknown Patient',
            appointment.service,
            appointment.date,
            appointment.time
          ));
        } catch (auditError) {
          console.error('Failed to log appointment completion audit:', auditError);
        }
      }

      // Dispatch event to update dental charting if needed

      if (appointment) {
        console.log('Found appointment:', appointment);

        // Check if this appointment was scheduled from a pending treatment
        if (appointment.charting_entry_id) {
          console.log(`Appointment has charting entry ID: ${appointment.charting_entry_id}`);

          // Dispatch event to update charting entry status
          const event = new CustomEvent('updateChartingEntryStatus', {
            detail: {
              entryId: appointment.charting_entry_id,
              appointmentId: appointmentId,
              status: 'Completed'
            }
          });

          document.dispatchEvent(event);
          console.log('Dispatched updateChartingEntryStatus event');

          // Also update the pending_treatments table if it exists
          try {
            console.log('Updating pending_treatments table');
            // Find the pending treatment record first
            const pendingTreatments = await supabase.from('pending_treatments').getAll({
              filters: { charting_entry_id: appointment.charting_entry_id }
            });

            if (pendingTreatments.length > 0) {
              // Update the first matching record
              await supabase.from('pending_treatments').update(pendingTreatments[0].id, { status: 'completed' });
              console.log('Updated pending_treatments table');
            } else {
              console.log('No pending treatment found for charting entry ID:', appointment.charting_entry_id);
            }
          } catch (pendingError) {
            console.error('Error updating pending_treatments:', pendingError);
            // Continue even if this fails
          }
        } else {
          console.log('Appointment does not have a charting entry ID');
        }
      } else {
        console.log(`Could not find appointment with ID ${appointmentId}`);
      }

      toast({
        title: 'Success',
        description: 'Appointment marked as completed.',
      });
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark appointment as completed. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get available time slots for a specific date
  const getAvailableTimeSlots = async (date: Date, clinic: 'dental' | 'meditouch'): Promise<string[]> => {
    try {
      // Format date for logging
      const dateString = format(date, 'yyyy-MM-dd');
      console.log(`Getting available time slots for ${clinic} on ${dateString}`);

      // Get all appointments for the date
      const appointments = await getAppointmentsByDate(date, clinic);

      // Create a map of booked slots
      const bookedSlots: Record<string, number> = {};

      // Count booked slots
      appointments.forEach(appointment => {
        if (appointment.status !== 'cancelled' && appointment.status !== 'completed') {
          if (!bookedSlots[appointment.time]) {
            bookedSlots[appointment.time] = 0;
          }
          bookedSlots[appointment.time]++;
        }
      });

      // Generate all possible time slots
      const allTimeSlots: string[] = [];

      // Start from 9 AM
      for (let hour = 9; hour <= 17; hour++) {
        // Skip lunch break (1 PM to 2 PM)
        if (hour === 13) continue;

        for (let minute = 0; minute < 60; minute += 15) {
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          const timeString = `${formattedHour}:${formattedMinute}`;

          allTimeSlots.push(timeString);
        }
      }

      // Filter available slots
      const maxPatientsPerSlot = clinic === 'dental' ? 2 : 1;

      const availableSlots = allTimeSlots.filter(time => {
        const bookedCount = bookedSlots[time] || 0;
        return bookedCount < maxPatientsPerSlot;
      });

      return availableSlots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to get available time slots. Please try again.',
        variant: 'destructive',
      });

      // Generate time slots programmatically instead of using hardcoded fallback
      const allTimeSlots: string[] = [];

      // Start from 9 AM
      for (let hour = 9; hour <= 17; hour++) {
        // Skip lunch break (1 PM to 2 PM)
        if (hour === 13) continue;

        for (let minute = 0; minute < 60; minute += 15) {
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          allTimeSlots.push(`${formattedHour}:${formattedMinute}`);
        }
      }

      return allTimeSlots;
    }
  };

  return (
    <AppointmentContext.Provider
      value={{
        dentalAppointments,
        meditouchAppointments,
        isLoading,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getAppointmentsByDate,
        getAppointmentsByDateRange,
        getPatientAppointments,
        getUpcomingAppointments,
        markAppointmentCompleted,
        getAvailableTimeSlots
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

// Custom hook to use the appointment context
export const useAppointments = (): AppointmentContextType => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};
