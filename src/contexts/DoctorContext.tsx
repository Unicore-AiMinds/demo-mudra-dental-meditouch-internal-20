import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRandomDentalColor } from '@/utils/doctorColors';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/components/ui/use-toast';

// Define the Doctor type
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  aadhar_doc?: string;
  pan_doc?: string;
  color: string;
}

// Define the context type
interface DoctorContextType {
  doctors: Doctor[];
  isLoading: boolean;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => Promise<Doctor>;
  deleteDoctor: (id: string) => Promise<void>;
  updateDoctorColor: (doctorId: string, newColor: string) => Promise<void>;
  getDoctorByName: (name: string) => Doctor | undefined;
}

// Create the context
const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

// Default doctors data (used for initialization if no doctors exist)
const defaultDoctors = [
  {
    name: "Dr. Rajan Khanna",
    specialization: "General Dentistry",
    email: "rajan.khanna@mudraclinic.com",
    phone: "+91 98765 43210",
    color: "#4A90E2" // Sky blue
  },
  {
    name: "Dr. Priya Desai",
    specialization: "Orthodontics",
    email: "priya.desai@mudraclinic.com",
    phone: "+91 87654 32109",
    color: "#2ECC71" // Emerald green
  },
  {
    name: "Dr. Vikram Mehta",
    specialization: "Endodontics",
    email: "vikram.mehta@mudraclinic.com",
    phone: "+91 76543 21098",
    color: "#9B59B6" // Amethyst
  }
];

// Provider component
export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch doctors from Supabase
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);

        // Fetch doctors from Supabase
        const { data: fetchedDoctors, error } = await supabase
          .from('doctors')
          .select('*');

        if (error) throw error;

        // If no doctors exist, create default ones
        if (!fetchedDoctors || fetchedDoctors.length === 0) {
          console.log('No doctors found, creating defaults...');

          for (const doctor of defaultDoctors) {
            const { error: insertError } = await supabase
              .from('doctors')
              .insert(doctor);

            if (insertError) throw insertError;
          }

          // Fetch the newly created doctors
          const { data: newDoctors, error: fetchError } = await supabase
            .from('doctors')
            .select('*');

          if (fetchError) throw fetchError;

          setDoctors(newDoctors || []);
        } else {
          setDoctors(fetchedDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctors. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [supabase, toast]);

  // Add a new doctor
  const addDoctor = async (doctor: Omit<Doctor, 'id'>): Promise<Doctor> => {
    try {
      // Generate a random color if not provided
      const doctorWithColor = {
        ...doctor,
        color: doctor.color || getRandomDentalColor()
      };

      // Add doctor to Supabase
      const { data, error } = await supabase
        .from('doctors')
        .insert(doctorWithColor)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create doctor');

      const newDoctor = data as Doctor;

      // Update local state
      setDoctors(prev => [...prev, newDoctor]);

      toast({
        title: 'Success',
        description: `Doctor ${doctor.name} added successfully.`,
      });

      return newDoctor;
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to add doctor. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a doctor
  const updateDoctor = async (id: string, doctor: Partial<Doctor>): Promise<Doctor> => {
    try {
      // Update doctor in Supabase
      const { data, error } = await supabase
        .from('doctors')
        .update(doctor)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update doctor');

      const updatedDoctor = data as Doctor;

      // Update local state
      setDoctors(prev =>
        prev.map(d => d.id === id ? updatedDoctor : d)
      );

      toast({
        title: 'Success',
        description: 'Doctor updated successfully.',
      });

      return updatedDoctor;
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update doctor. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a doctor
  const deleteDoctor = async (id: string): Promise<void> => {
    try {
      // Delete doctor from Supabase
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setDoctors(prev => prev.filter(d => d.id !== id));

      toast({
        title: 'Success',
        description: 'Doctor deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete doctor. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a doctor's color
  const updateDoctorColor = async (doctorId: string, newColor: string): Promise<void> => {
    try {
      // Update doctor color in Supabase
      const { error } = await supabase
        .from('doctors')
        .update({ color: newColor })
        .eq('id', doctorId);

      if (error) throw error;

      // Update local state
      setDoctors(prevDoctors =>
        prevDoctors.map(doctor =>
          doctor.id === doctorId
            ? { ...doctor, color: newColor }
            : doctor
        )
      );

      toast({
        title: 'Success',
        description: 'Doctor color updated successfully.',
      });
    } catch (error) {
      console.error('Error updating doctor color:', error);
      toast({
        title: 'Error',
        description: 'Failed to update doctor color. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Function to get a doctor by name
  const getDoctorByName = (name: string) => {
    return doctors.find(doctor => doctor.name === name);
  };

  return (
    <DoctorContext.Provider value={{
      doctors,
      isLoading,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      updateDoctorColor,
      getDoctorByName
    }}>
      {children}
    </DoctorContext.Provider>
  );
};

// Custom hook to use the doctor context
export const useDoctors = () => {
  const context = useContext(DoctorContext);
  if (context === undefined) {
    throw new Error('useDoctors must be used within a DoctorProvider');
  }
  return context;
};
