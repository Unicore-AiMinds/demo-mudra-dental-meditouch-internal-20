import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isAfter } from 'date-fns';

// Define appointment types
export interface BaseAppointment {
  id: string;
  appointment_id?: string;
  patient_id: string;
  patient_name: string;
  service: string;
  time: string;
  date: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'arrived' | 'no-show';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DentalAppointment extends BaseAppointment {
  doctor: string;
  doctor_id: string;
  second_patient_name?: string;
  second_patient_id?: string;
  charting_entry_id?: string;
  follow_up_id?: string;
}

export interface MeditouchAppointment extends BaseAppointment {
  // Any meditouch-specific fields
}

export type Appointment = DentalAppointment | MeditouchAppointment;

// Default appointments for initialization
const defaultDentalAppointments: Omit<DentalAppointment, 'id'>[] = [
  {
    appointment_id: 'd1',
    patient_id: 'PT001',
    patient_name: 'Aarav Sharma',
    service: 'Dental Checkup',
    doctor: 'Dr. Khanna',
    doctor_id: 'DOC001',
    time: '9:00 AM',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'confirmed' as const
  },
  {
    appointment_id: 'd2',
    patient_id: 'PT002',
    patient_name: 'Priya Patel',
    service: 'Root Canal',
    doctor: 'Dr. Khanna',
    doctor_id: 'DOC001',
    time: '9:15 AM',
    date: format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd'),
    status: 'confirmed' as const
  }
];

const defaultMeditouchAppointments: Omit<MeditouchAppointment, 'id'>[] = [
  {
    appointment_id: 'm1',
    patient_id: 'PT004',
    patient_name: 'Neha Kapoor',
    service: 'Skin Consultation',
    time: '9:15 AM',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'confirmed' as const
  }
];

// Define context type
interface AppointmentContextType {
  dentalAppointments: DentalAppointment[];
  meditouchAppointments: MeditouchAppointment[];
  isLoading: boolean;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'appointment_id' | 'created_at' | 'updated_at'>) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Omit<Appointment, 'id' | 'appointment_id' | 'created_at' | 'updated_at'>>) => Promise<Appointment>;
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
          // Fetch dental appointments from Supabase
          const fetchedDentalAppointments = await supabase.from<DentalAppointment>('dental_appointments').getAll({
            order: { column: 'date', ascending: true }
          });

          console.log('Fetched dental appointments:', fetchedDentalAppointments);

          // If no dental appointments exist, create default ones
          if (!fetchedDentalAppointments || fetchedDentalAppointments.length === 0) {
            console.log('No dental appointments found, creating defaults');

            // Add IDs to default appointments
            const appointmentsWithIds = defaultDentalAppointments.map(app => ({
              ...app,
              id: app.appointment_id // Use appointment_id as id for now
            }));

            // Set default appointments in state
            setDentalAppointments(appointmentsWithIds as DentalAppointment[]);

            // Try to insert them into Supabase
            for (const appointment of defaultDentalAppointments) {
              try {
                await supabase.from<DentalAppointment>('dental_appointments').insert(appointment);
              } catch (insertError) {
                console.error('Error inserting default dental appointment:', insertError);
              }
            }
          } else {
            // Set fetched appointments in state
            setDentalAppointments(fetchedDentalAppointments);
          }
        } catch (dentalError) {
          console.error('Error fetching dental appointments:', dentalError);

          // Set empty array instead of using default data
          setDentalAppointments([]);

          // Show error toast
          toast({
            title: 'Error',
            description: 'Failed to load dental appointments. Please try again.',
            variant: 'destructive',
          });
        }

        try {
          // Fetch meditouch appointments from Supabase
          const fetchedMeditouchAppointments = await supabase.from<MeditouchAppointment>('meditouch_appointments').getAll({
            order: { column: 'date', ascending: true }
          });

          console.log('Fetched meditouch appointments:', fetchedMeditouchAppointments);

          // If no meditouch appointments exist, create default ones
          if (!fetchedMeditouchAppointments || fetchedMeditouchAppointments.length === 0) {
            console.log('No meditouch appointments found, creating defaults');

            // Add IDs to default appointments
            const appointmentsWithIds = defaultMeditouchAppointments.map(app => ({
              ...app,
              id: app.appointment_id // Use appointment_id as id for now
            }));

            // Set default appointments in state
            setMeditouchAppointments(appointmentsWithIds as MeditouchAppointment[]);

            // Try to insert them into Supabase
            for (const appointment of defaultMeditouchAppointments) {
              try {
                await supabase.from<MeditouchAppointment>('meditouch_appointments').insert(appointment);
              } catch (insertError) {
                console.error('Error inserting default meditouch appointment:', insertError);
              }
            }
          } else {
            // Set fetched appointments in state
            setMeditouchAppointments(fetchedMeditouchAppointments);
          }
        } catch (meditouchError) {
          console.error('Error fetching meditouch appointments:', meditouchError);

          // Set empty array instead of using default data
          setMeditouchAppointments([]);

          // Show error toast
          toast({
            title: 'Error',
            description: 'Failed to load meditouch appointments. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error initializing appointments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load appointments. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAppointments();
  }, [supabase, toast]);

  // Add a new appointment
  const addAppointment = async (
    appointment: Omit<Appointment, 'id' | 'appointment_id' | 'created_at' | 'updated_at'>
  ): Promise<Appointment> => {
    try {
      // Generate a unique appointment ID
      const isDental = 'doctor' in appointment;
      const prefix = isDental ? 'd' : 'm';
      const appointmentId = `${prefix}${uuidv4().substring(0, 8)}`;

      // Create new appointment with ID
      const newAppointment = {
        appointment_id: appointmentId,
        ...appointment
      };

      // Add to Supabase
      try {
        // Add ID to the appointment
        const appointmentWithId = {
          ...newAppointment,
          id: appointmentId
        };

        if (isDental) {
          // Try to insert into Supabase
          try {
            await supabase.from<DentalAppointment>('dental_appointments').insert(newAppointment as DentalAppointment);
          } catch (insertError) {
            console.error('Error inserting dental appointment to Supabase:', insertError);
          }

          // Update local state regardless of Supabase success
          setDentalAppointments(prev => [...prev, appointmentWithId as DentalAppointment]);
          return appointmentWithId as Appointment;
        } else {
          // Try to insert into Supabase
          try {
            await supabase.from<MeditouchAppointment>('meditouch_appointments').insert(newAppointment as MeditouchAppointment);
          } catch (insertError) {
            console.error('Error inserting meditouch appointment to Supabase:', insertError);
          }

          // Update local state regardless of Supabase success
          setMeditouchAppointments(prev => [...prev, appointmentWithId as MeditouchAppointment]);
          return appointmentWithId as Appointment;
        }
      } catch (error) {
        console.error('Error in addAppointment:', error);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Appointment scheduled successfully.',
      });
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
    updates: Partial<Omit<Appointment, 'id' | 'appointment_id' | 'created_at' | 'updated_at'>>
  ): Promise<Appointment> => {
    try {
      // Determine if it's a dental or meditouch appointment
      const dentalAppointment = dentalAppointments.find(a => a.id === id || a.appointment_id === id);

      let updatedAppointment;
      if (dentalAppointment) {
        // Update local state first
        const updatedLocalAppointment = { ...dentalAppointment, ...updates };
        setDentalAppointments(prev =>
          prev.map(a => a.id === id || a.appointment_id === id ? updatedLocalAppointment : a)
        );

        // Try to update in Supabase
        try {
          await supabase.from<DentalAppointment>('dental_appointments').update(id, updates);
        } catch (updateError) {
          console.error('Error updating dental appointment in Supabase:', updateError);
        }

        updatedAppointment = updatedLocalAppointment;
      } else {
        // Find the meditouch appointment
        const meditouchAppointment = meditouchAppointments.find(a => a.id === id || a.appointment_id === id);

        if (!meditouchAppointment) {
          throw new Error(`Appointment with ID ${id} not found`);
        }

        // Update local state first
        const updatedLocalAppointment = { ...meditouchAppointment, ...updates };
        setMeditouchAppointments(prev =>
          prev.map(a => a.id === id || a.appointment_id === id ? updatedLocalAppointment : a)
        );

        // Try to update in Supabase
        try {
          await supabase.from<MeditouchAppointment>('meditouch_appointments').update(id, updates);
        } catch (updateError) {
          console.error('Error updating meditouch appointment in Supabase:', updateError);
        }

        updatedAppointment = updatedLocalAppointment;
      }

      toast({
        title: 'Success',
        description: 'Appointment updated successfully.',
      });

      return updatedAppointment;
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
      const dentalAppointment = dentalAppointments.find(a => a.id === id || a.appointment_id === id);

      if (dentalAppointment) {
        // Update local state first
        setDentalAppointments(prev =>
          prev.filter(a => a.id !== id && a.appointment_id !== id)
        );

        // Try to delete from Supabase
        try {
          await supabase.from<DentalAppointment>('dental_appointments').delete(id);
        } catch (deleteError) {
          console.error('Error deleting dental appointment from Supabase:', deleteError);
        }
      } else {
        // Update local state first
        setMeditouchAppointments(prev =>
          prev.filter(a => a.id !== id && a.appointment_id !== id)
        );

        // Try to delete from Supabase
        try {
          await supabase.from<MeditouchAppointment>('meditouch_appointments').delete(id);
        } catch (deleteError) {
          console.error('Error deleting meditouch appointment from Supabase:', deleteError);
        }
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

      if (clinic === 'dental') {
        // Fetch dental appointments for the date
        const appointments = await supabase.from<DentalAppointment>('dental_appointments').getAll({
          filters: { date: dateString },
          order: { column: 'time', ascending: true }
        });

        return appointments;
      } else {
        // Fetch meditouch appointments for the date
        const appointments = await supabase.from<MeditouchAppointment>('meditouch_appointments').getAll({
          filters: { date: dateString },
          order: { column: 'time', ascending: true }
        });

        return appointments;
      }
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
      let appointments: Appointment[] = [];

      if (clinic === 'dental' || clinic === 'both') {
        // Fetch dental appointments for the patient
        const dentalApps = await supabase.from<DentalAppointment>('dental_appointments').getAll({
          filters: { patient_id: patientId },
          order: { column: 'date', ascending: true }
        });

        appointments = [...appointments, ...dentalApps];
      }

      if (clinic === 'meditouch' || clinic === 'both') {
        // Fetch meditouch appointments for the patient
        const meditouchApps = await supabase.from<MeditouchAppointment>('meditouch_appointments').getAll({
          filters: { patient_id: patientId },
          order: { column: 'date', ascending: true }
        });

        appointments = [...appointments, ...meditouchApps];
      }

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

      if (clinic === 'dental') {
        // Fetch upcoming dental appointments
        const appointments = await supabase.from<DentalAppointment>('dental_appointments').getAll({
          filters: {
            date: { $gte: todayString },
            status: { $ne: 'cancelled' },
            status: { $ne: 'completed' }
          },
          order: { column: 'date', ascending: true }
        });

        return appointments;
      } else {
        // Fetch upcoming meditouch appointments
        const appointments = await supabase.from<MeditouchAppointment>('meditouch_appointments').getAll({
          filters: {
            date: { $gte: todayString },
            status: { $ne: 'cancelled' },
            status: { $ne: 'completed' }
          },
          order: { column: 'date', ascending: true }
        });

        return appointments;
      }
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch upcoming appointments. Please try again.',
        variant: 'destructive',
      });

      // Return empty array instead of using local state as fallback
      return [];
    }
  };

  // Mark an appointment as completed
  const markAppointmentCompleted = async (appointmentId: string): Promise<void> => {
    try {
      await updateAppointment(appointmentId, { status: 'completed' });

      // Dispatch event to update dental charting if needed
      const appointment = dentalAppointments.find(a => a.id === appointmentId || a.appointment_id === appointmentId);

      if (appointment && appointment.charting_entry_id) {
        // Dispatch event to update charting entry status
        const event = new CustomEvent('updateChartingEntryStatus', {
          detail: {
            entryId: appointment.charting_entry_id,
            appointmentId: appointmentId,
            status: 'Completed'
          }
        });

        document.dispatchEvent(event);
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
      const dateString = format(date, 'yyyy-MM-dd');

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
