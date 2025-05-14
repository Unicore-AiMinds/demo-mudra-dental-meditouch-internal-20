import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
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
  getPatientAppointments: (patientId: string, clinic: 'dental' | 'meditouch' | 'both') => Promise<Appointment[]>;
  getUpcomingAppointments: (clinic: 'dental' | 'meditouch') => Promise<Appointment[]>;
  markAppointmentCompleted: (appointmentId: string) => Promise<void>;
  getAvailableTimeSlots: (date: Date, clinic: 'dental' | 'meditouch') => Promise<string[]>;
}

// Create context
const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// Provider component
export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dentalAppointments, setDentalAppointments] = useState<DentalAppointment[]>([]);
  const [meditouchAppointments, setMeditouchAppointments] = useState<MeditouchAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

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
          handleDatabaseError({
            error,
            toast,
            errorKey: 'appointments_init_error',
            customMessage: 'Appointments will be available after setup is complete.',
            showToast: true
          });
        }
      } catch (error) {
        console.error('Error initializing appointments:', error);
        // Use the global error handler
        handleDatabaseError({
          error,
          toast,
          errorKey: 'appointments_init_error',
          customMessage: 'Appointments will be available after setup is complete.',
          showToast: true
        });
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
      const prefix = isDental ? 'd' : 'm';
      const appointmentCode = `${prefix}${uuidv4().substring(0, 8)}`;

      // Generate a UUID for the appointment
      const id = uuidv4();

      // Create new appointment with ID and code
      // Extract patient_name since it's not in the database schema
      const { patient_name, ...appointmentData } = appointment;

      const newAppointment = {
        id,
        appointment_code: appointmentCode,
        ...appointmentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Note: patient_name will be added back for UI display after Supabase insert

      console.log('Prepared appointment object for Supabase:', JSON.stringify(newAppointment, null, 2));

      // Add to Supabase
      try {
        console.log(`Adding ${isDental ? 'dental' : 'meditouch'} appointment to Supabase table 'appointments'`);

        // Insert into Supabase - send only the data that matches the database schema
        const createdAppointment = await supabase.from<Appointment>('appointments').insert(newAppointment);

        console.log('Supabase response for appointment:', JSON.stringify(createdAppointment, null, 2));

        if (!createdAppointment) {
          console.error('Supabase returned null or undefined response');
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
      const updatedDbAppointment = await supabase.from<Appointment>('appointments').update(id, updatesWithTimestamp);

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

      console.log('Deleting appointment from Supabase:', id);

      // Delete from Supabase first
      await supabase.from<Appointment>('appointments').delete(id);

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

      // Fetch appointments for the date and clinic type
      const appointments = await supabase.from<Appointment>('appointments').getAll({
        filters: {
          date: dateString,
          clinic_type: clinic
        },
        order: { column: 'time', ascending: true }
      });

      // Fetch patient names for these appointments
      const patientIds = appointments.map(app => app.patient_id).filter(Boolean);

      if (patientIds.length > 0) {
        // Fetch patients for these IDs
        const patients = await supabase.from<{ id: string; name: string }>('patients').getAll({
          filters: { id: { $in: patientIds } }
        });

        // Create a map of patient IDs to names
        const patientNameMap: Record<string, string> = {};
        patients.forEach(patient => {
          if (patient.id && patient.name) {
            patientNameMap[patient.id] = patient.name;
          }
        });

        // Add patient names to appointments
        const appointmentsWithNames = appointments.map(app => ({
          ...app,
          patient_name: patientNameMap[app.patient_id] || 'Unknown Patient'
        }));

        console.log(`Fetched ${appointments.length} ${clinic} appointments for date ${dateString} with patient names`);
        return appointmentsWithNames;
      }

      console.log(`Fetched ${appointments.length} ${clinic} appointments for date ${dateString}`);
      return appointments;
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

  // Get appointments for a specific patient
  const getPatientAppointments = async (patientId: string, clinic: 'dental' | 'meditouch' | 'both'): Promise<Appointment[]> => {
    try {
      // Prepare filters based on clinic type
      let clinicFilter = {};

      if (clinic === 'dental') {
        clinicFilter = { clinic_type: 'dental' };
      } else if (clinic === 'meditouch') {
        clinicFilter = { clinic_type: 'meditouch' };
      }

      // Fetch appointments for the patient
      const appointments = await supabase.from<Appointment>('appointments').getAll({
        filters: {
          patient_id: patientId,
          ...clinicFilter
        },
        order: { column: 'date', ascending: true }
      });

      // Fetch the patient name
      const patient = await supabase.from<{ id: string; name: string }>('patients').getById(patientId);

      if (patient && patient.name) {
        // Add patient name to all appointments
        const appointmentsWithName = appointments.map(app => ({
          ...app,
          patient_name: patient.name
        }));

        console.log(`Fetched ${appointments.length} appointments for patient ${patientId} (${patient.name}) with clinic filter ${clinic}`);
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

      // Fetch upcoming appointments for the specified clinic
      const appointments = await supabase.from<Appointment>('appointments').getAll({
        filters: {
          clinic_type: clinic,
          status: { $nin: ['cancelled', 'completed'] }
        },
        order: { column: 'date', ascending: true }
      });

      // Filter for dates >= today in JavaScript since Supabase filters might not work as expected
      const upcomingAppointments = appointments.filter(app => {
        return app.date >= todayString;
      });

      // Fetch patient names for these appointments
      const patientIds = upcomingAppointments.map(app => app.patient_id).filter(Boolean);

      if (patientIds.length > 0) {
        // Fetch patients for these IDs
        const patients = await supabase.from<{ id: string; name: string }>('patients').getAll({
          filters: { id: { $in: patientIds } }
        });

        // Create a map of patient IDs to names
        const patientNameMap: Record<string, string> = {};
        patients.forEach(patient => {
          if (patient.id && patient.name) {
            patientNameMap[patient.id] = patient.name;
          }
        });

        // Add patient names to appointments
        const appointmentsWithNames = upcomingAppointments.map(app => ({
          ...app,
          patient_name: patientNameMap[app.patient_id] || 'Unknown Patient'
        }));

        console.log(`Fetched ${appointments.length} total ${clinic} appointments, ${upcomingAppointments.length} are upcoming with patient names`);
        return appointmentsWithNames;
      }

      console.log(`Fetched ${appointments.length} total ${clinic} appointments, ${upcomingAppointments.length} are upcoming`);
      return upcomingAppointments;
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
      await updateAppointment(appointmentId, { status: 'completed' });

      // Dispatch event to update dental charting if needed
      const appointment = dentalAppointments.find(a => a.id === appointmentId || a.appointment_code === appointmentId);

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
            await supabase.from('pending_treatments')
              .update({ status: 'completed' })
              .eq('charting_entry_id', appointment.charting_entry_id);
            console.log('Updated pending_treatments table');
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
