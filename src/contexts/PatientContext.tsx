import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export interface Patient {
  id: string;
  patient_id?: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  date_of_birth?: string;
  email: string | null;
  phone: string;
  alt_phone?: string | null;
  address?: string;
  city?: string;
  pincode?: string;
  blood_group?: string;
  referred_by?: string;
  clinic: 'dental' | 'meditouch' | 'both';
  last_visit: string | '';
  created_at?: string;
  updated_at?: string;
}

interface PatientContextType {
  patients: Patient[];
  isLoading: boolean;
  addPatient: (patient: Omit<Patient, 'id' | 'patient_id' | 'created_at' | 'updated_at'>) => Promise<Patient>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  getPatientById: (id: string) => Promise<Patient | null>;
  searchPatients: (query: string) => Promise<Patient[]>;
}

// Default patients for initialization
const defaultPatients = [
  {
    patient_id: "PT001",
    name: "Aarav Sharma",
    gender: "male" as const,
    age: 35,
    date_of_birth: "1988-05-15",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    address: "123 Main Street",
    city: "Mumbai",
    pincode: "400001",
    blood_group: "O+",
    clinic: "dental" as const,
    last_visit: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  },
  {
    patient_id: "PT002",
    name: "Priya Patel",
    gender: "female" as const,
    age: 28,
    date_of_birth: "1995-08-22",
    email: "priya.patel@example.com",
    phone: "+91 87654 32109",
    address: "456 Park Avenue",
    city: "Delhi",
    pincode: "110001",
    blood_group: "A+",
    clinic: "dental" as const,
    last_visit: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]
  },
  {
    patient_id: "PT009",
    name: "Riya Sharma",
    gender: "female" as const,
    age: 8,
    date_of_birth: "2015-03-10",
    email: null,
    phone: "+91 98765 43211",
    address: "789 Children's Lane",
    city: "Mumbai",
    pincode: "400002",
    blood_group: "B+",
    referred_by: "Dr. Khanna",
    clinic: "dental" as const,
    last_visit: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  }
];

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch patients from Supabase
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        
        // Fetch patients from Supabase
        const fetchedPatients = await supabase.from<Patient>('patients').getAll({
          order: { column: 'name', ascending: true }
        });
        
        // If no patients exist, create default ones
        if (fetchedPatients.length === 0) {
          for (const patient of defaultPatients) {
            await supabase.from<Patient>('patients').insert(patient);
          }
          
          // Fetch the newly created patients
          const newPatients = await supabase.from<Patient>('patients').getAll({
            order: { column: 'name', ascending: true }
          });
          setPatients(newPatients);
        } else {
          setPatients(fetchedPatients);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load patients. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [supabase, toast]);

  // Add a new patient
  const addPatient = async (patient: Omit<Patient, 'id' | 'patient_id' | 'created_at' | 'updated_at'>): Promise<Patient> => {
    try {
      // Generate a unique patient ID
      const patientCount = await supabase.from<Patient>('patients').getAll({ limit: 1000 });
      const patientId = `PT${String(patientCount.length + 1).padStart(3, '0')}`;
      
      // Create new patient with ID
      const newPatient = {
        patient_id: patientId,
        ...patient
      };
      
      // Add to Supabase
      const createdPatient = await supabase.from<Patient>('patients').insert(newPatient);
      
      // Update local state
      setPatients(prev => [...prev, createdPatient]);
      
      toast({
        title: 'Success',
        description: `Patient ${patient.name} added successfully.`,
      });
      
      return createdPatient;
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to add patient. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing patient
  const updatePatient = async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    try {
      // Update in Supabase
      const updatedPatient = await supabase.from<Patient>('patients').update(id, patient);
      
      // Update local state
      setPatients(prev => 
        prev.map(p => p.id === id ? { ...p, ...patient } : p)
      );
      
      toast({
        title: 'Success',
        description: 'Patient updated successfully.',
      });
      
      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to update patient. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a patient
  const deletePatient = async (id: string): Promise<void> => {
    try {
      // Delete from Supabase
      await supabase.from<Patient>('patients').delete(id);
      
      // Update local state
      setPatients(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: 'Success',
        description: 'Patient deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete patient. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get a patient by ID
  const getPatientById = async (id: string): Promise<Patient | null> => {
    try {
      // First check local state
      const localPatient = patients.find(p => p.id === id || p.patient_id === id);
      if (localPatient) return localPatient;
      
      // If not found locally, fetch from Supabase
      const fetchedPatient = await supabase.from<Patient>('patients').getById(id);
      return fetchedPatient || null;
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch patient. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Search patients
  const searchPatients = async (query: string): Promise<Patient[]> => {
    if (!query) return patients;
    
    const lowerQuery = query.toLowerCase();
    return patients.filter(
      patient => 
        patient.name.toLowerCase().includes(lowerQuery) ||
        patient.phone.includes(query) ||
        (patient.email && patient.email.toLowerCase().includes(lowerQuery)) ||
        (patient.patient_id && patient.patient_id.toLowerCase().includes(lowerQuery))
    );
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        isLoading,
        addPatient,
        updatePatient,
        deletePatient,
        getPatientById,
        searchPatients
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

// Custom hook to use the patient context
export const usePatients = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};
