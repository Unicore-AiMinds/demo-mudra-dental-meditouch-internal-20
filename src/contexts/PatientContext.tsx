import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { handleDatabaseError } from '@/utils/error-handler';

export interface Patient {
  id: string;
  patient_code?: string;
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
  created_at: string;
  updated_at: string;
}

interface PatientContextType {
  patients: Patient[];
  isLoading: boolean;
  addPatient: (patient: Omit<Patient, 'id' | 'patient_code' | 'created_at' | 'updated_at'>) => Promise<Patient>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  getPatientById: (id: string) => Promise<Patient | null>;
  searchPatients: (query: string) => Promise<Patient[]>;
}

// Default patients for initialization
const defaultPatients = [
  {
    patient_code: "PT001",
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
    last_visit: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    created_at: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
    updated_at: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()
  },
  {
    patient_code: "PT002",
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
    last_visit: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    created_at: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString(),
    updated_at: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString()
  },
  {
    patient_code: "PT009",
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
    last_visit: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    created_at: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
    updated_at: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString()
  }
];

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Define fetchPatients as a function that can be called from anywhere in the component
  const fetchPatients = async () => {
      try {
        setIsLoading(true);

        // Fetch patients from Supabase, sorted by created_at date (newest first)
        const fetchedPatients = await supabase.from<Patient>('patients').getAll({
          order: { column: 'created_at', ascending: false }
        });

        console.log('Raw fetched patients:', fetchedPatients);

        // Process the fetched patients to ensure all fields are properly formatted
        const processedPatients = fetchedPatients.map(patient => ({
          ...patient,
          // Ensure all fields are properly set for display
          id: patient.id,
          patient_code: patient.patient_code || `PT${Date.now().toString().slice(-6)}`,
          name: patient.name,
          gender: patient.gender,
          age: patient.age,
          date_of_birth: patient.date_of_birth,
          email: patient.email,
          phone: patient.phone || '',
          alt_phone: patient.alt_phone,
          address: patient.address,
          city: patient.city,
          pincode: patient.pincode,
          blood_group: patient.blood_group,
          referred_by: patient.referred_by,
          clinic: patient.clinic,
          last_visit: patient.last_visit,
          created_at: patient.created_at,
          updated_at: patient.updated_at
        }));

        console.log('Processed patients:', processedPatients);

        // If no patients exist, create default ones
        if (processedPatients.length === 0) {
          for (const patient of defaultPatients) {
            await supabase.from<Patient>('patients').insert(patient);
          }

          // Fetch the newly created patients, sorted by created_at date (newest first)
          const newPatients = await supabase.from<Patient>('patients').getAll({
            order: { column: 'created_at', ascending: false }
          });

          // Process the new patients
          const processedNewPatients = newPatients.map(patient => ({
            ...patient,
            // Ensure all fields are properly set for display
            id: patient.id,
            patient_code: patient.patient_code || `PT${Date.now().toString().slice(-6)}`,
            name: patient.name,
            gender: patient.gender,
            age: patient.age,
            date_of_birth: patient.date_of_birth,
            email: patient.email,
            phone: patient.phone || '',
            alt_phone: patient.alt_phone,
            address: patient.address,
            city: patient.city,
            pincode: patient.pincode,
            blood_group: patient.blood_group,
            referred_by: patient.referred_by,
            clinic: patient.clinic,
            last_visit: patient.last_visit,
            created_at: patient.created_at,
            updated_at: patient.updated_at
          }));

          setPatients(processedNewPatients);
        } else {
          setPatients(processedPatients);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        // Use the global error handler
        handleDatabaseError({
          error,
          toast,
          errorKey: 'patients_fetch_error',
          customMessage: 'Patient data will be available after setup is complete.',
          showToast: true
        });
      } finally {
        setIsLoading(false);
      }
    };

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new patient
  const addPatient = async (patient: Omit<Patient, 'id' | 'patient_code' | 'created_at' | 'updated_at'>): Promise<Patient> => {
    try {
      // Generate a unique patient code
      const patientCount = await supabase.from<Patient>('patients').getAll({ limit: 1000 });
      const patientCode = `PT${String(patientCount.length + 1).padStart(3, '0')}`;

      // Ensure gender and clinic are lowercase and match the allowed values
      const gender = (patient.gender || '').toLowerCase() as 'male' | 'female' | 'other';
      const clinic = (patient.clinic || '').toLowerCase() as 'dental' | 'meditouch' | 'both';

      // Validate gender
      if (!['male', 'female', 'other'].includes(gender)) {
        throw new Error('Gender must be one of: male, female, other');
      }

      // Validate clinic
      if (!['dental', 'meditouch', 'both'].includes(clinic)) {
        throw new Error('Clinic must be one of: dental, meditouch, both');
      }

      // Validate phone number
      if (!patient.phone || patient.phone.trim() === '') {
        throw new Error('Phone number is required');
      }

      // Get the current timestamp for consistent use
      const now = new Date().toISOString();

      // Create new patient with code and validated fields
      const newPatient = {
        patient_code: patientCode,
        ...patient,
        gender,
        clinic,
        // Ensure all required fields are present and properly formatted
        name: patient.name.trim(),
        phone: patient.phone.trim(),
        // Set optional fields to null if they're empty strings
        email: patient.email && patient.email.trim() !== '' ? patient.email.trim() : null,
        alt_phone: patient.alt_phone && patient.alt_phone.trim() !== '' ? patient.alt_phone.trim() : null,
        address: patient.address && patient.address.trim() !== '' ? patient.address.trim() : null,
        city: patient.city && patient.city.trim() !== '' ? patient.city.trim() : null,
        pincode: patient.pincode && patient.pincode.trim() !== '' ? patient.pincode.trim() : null,
        blood_group: patient.blood_group && patient.blood_group.trim() !== '' ? patient.blood_group.trim() : null,
        referred_by: patient.referred_by && patient.referred_by.trim() !== '' ? patient.referred_by.trim() : null,
        last_visit: patient.last_visit && patient.last_visit.trim() !== '' ? patient.last_visit.trim() : null,
        // Add timestamps - critical for proper sorting
        created_at: now,
        updated_at: now
      };

      console.log('Attempting to add patient with data:', newPatient);

      try {
        // Add to Supabase
        const createdPatient = await supabase.from<Patient>('patients').insert(newPatient);

        console.log('Successfully added patient:', createdPatient);

        // Create a complete patient object for the local state
        // Use the original newPatient data to ensure we have all the fields correctly
        const completePatient = {
          ...createdPatient,
          // Ensure all fields are properly set for display
          id: createdPatient.id,
          patient_code: patientCode,
          name: newPatient.name,
          gender: newPatient.gender,
          age: newPatient.age,
          date_of_birth: newPatient.date_of_birth,
          email: newPatient.email,
          phone: newPatient.phone,
          alt_phone: newPatient.alt_phone,
          address: newPatient.address,
          city: newPatient.city,
          pincode: newPatient.pincode,
          blood_group: newPatient.blood_group,
          referred_by: newPatient.referred_by,
          clinic: newPatient.clinic,
          last_visit: newPatient.last_visit,
          created_at: createdPatient.created_at || new Date().toISOString(),
          updated_at: createdPatient.updated_at || new Date().toISOString()
        };

        console.log('Complete patient object for local state:', completePatient);

        // Update local state with the complete patient object
        setPatients(prev => [...prev, completePatient]);

        toast({
          title: 'Success',
          description: `Patient ${patient.name} added successfully.`,
        });

        // Trigger a refresh of the patients list to ensure we have the latest data
        setTimeout(() => {
          fetchPatients();
        }, 500);

        return createdPatient;
      } catch (insertError) {
        console.error('Specific error during patient insert:', insertError);

        // Try again with a different patient_code format
        // This is a fallback in case there's an issue with the original patient_code
        console.log('Attempting fallback: Adding patient with alternative patient_code format');

        // Generate a different format for patient_code to avoid conflicts
        const fallbackPatientCode = `PT${Date.now().toString().slice(-6)}`;

        // Get the current timestamp for consistent use
        const fallbackNow = new Date().toISOString();

        const fallbackPatient = {
          ...patient,
          patient_code: fallbackPatientCode,  // Always include patient_code
          // Add timestamps - critical for proper sorting
          created_at: fallbackNow,
          updated_at: fallbackNow
        };

        console.log('Fallback patient data:', fallbackPatient);
        const createdPatient = await supabase.from<Patient>('patients').insert(fallbackPatient);

        console.log('Successfully added patient with fallback:', createdPatient);

        // Create a complete patient object for the local state
        // Use the original fallbackPatient data to ensure we have all the fields correctly
        const completePatient = {
          ...createdPatient,
          // Ensure all fields are properly set for display
          id: createdPatient.id,
          patient_code: fallbackPatientCode,
          name: patient.name,
          gender: gender,
          age: patient.age,
          date_of_birth: patient.date_of_birth,
          email: patient.email,
          phone: patient.phone,
          alt_phone: patient.alt_phone,
          address: patient.address,
          city: patient.city,
          pincode: patient.pincode,
          blood_group: patient.blood_group,
          referred_by: patient.referred_by,
          clinic: clinic,
          last_visit: patient.last_visit,
          created_at: createdPatient.created_at || new Date().toISOString(),
          updated_at: createdPatient.updated_at || new Date().toISOString()
        };

        console.log('Complete patient object for local state (fallback):', completePatient);

        // Update local state with the complete patient object
        setPatients(prev => [...prev, completePatient]);

        toast({
          title: 'Success',
          description: `Patient ${patient.name} added successfully.`,
        });

        // Trigger a refresh of the patients list to ensure we have the latest data
        setTimeout(() => {
          fetchPatients();
        }, 500);

        return createdPatient;
      }
    } catch (error) {
      console.error('Error adding patient:', error);

      // Log detailed information about the patient data
      console.error('Patient data that failed to save:', patient);

      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: 'patient_add_error',
        customMessage: 'Failed to add patient. Please try again.',
        showToast: true
      });

      // Re-throw the error for the UI to handle
      throw error;
    }
  };

  // Update an existing patient
  const updatePatient = async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    try {
      console.log('Updating patient with ID:', id, 'and data:', patient);

      // Get the current patient from state to merge with updates
      const currentPatient = patients.find(p => p.id === id);
      if (!currentPatient) {
        throw new Error(`Patient with ID ${id} not found`);
      }

      // Ensure gender and clinic are lowercase and match the allowed values if provided
      let gender = currentPatient.gender;
      if (patient.gender) {
        gender = patient.gender.toLowerCase() as 'male' | 'female' | 'other';
        // Validate gender
        if (!['male', 'female', 'other'].includes(gender)) {
          throw new Error('Gender must be one of: male, female, other');
        }
      }

      let clinic = currentPatient.clinic;
      if (patient.clinic) {
        clinic = patient.clinic.toLowerCase() as 'dental' | 'meditouch' | 'both';
        // Validate clinic
        if (!['dental', 'meditouch', 'both'].includes(clinic)) {
          throw new Error('Clinic must be one of: dental, meditouch, both');
        }
      }

      // Format all fields properly
      const updatedData = {
        ...patient,
        // Ensure all fields are properly formatted
        gender: gender,
        clinic: clinic,
        name: patient.name ? patient.name.trim() : currentPatient.name,
        phone: patient.phone ? patient.phone.trim() : currentPatient.phone,
        // Format optional fields
        email: patient.email && patient.email.trim() !== '' ? patient.email.trim() : (patient.email === '' ? null : currentPatient.email),
        alt_phone: patient.alt_phone && patient.alt_phone.trim() !== '' ? patient.alt_phone.trim() : (patient.alt_phone === '' ? null : currentPatient.alt_phone),
        address: patient.address && patient.address.trim() !== '' ? patient.address.trim() : (patient.address === '' ? null : currentPatient.address),
        city: patient.city && patient.city.trim() !== '' ? patient.city.trim() : (patient.city === '' ? null : currentPatient.city),
        pincode: patient.pincode && patient.pincode.trim() !== '' ? patient.pincode.trim() : (patient.pincode === '' ? null : currentPatient.pincode),
        blood_group: patient.blood_group && patient.blood_group.trim() !== '' ? patient.blood_group.trim() : (patient.blood_group === '' ? null : currentPatient.blood_group),
        referred_by: patient.referred_by && patient.referred_by.trim() !== '' ? patient.referred_by.trim() : (patient.referred_by === '' ? null : currentPatient.referred_by),
        last_visit: patient.last_visit && patient.last_visit.trim() !== '' ? patient.last_visit.trim() : (patient.last_visit === '' ? null : currentPatient.last_visit),
        // Add updated_at timestamp
        updated_at: new Date().toISOString()
      };

      console.log('Formatted update data:', updatedData);

      // Update in Supabase
      const updatedPatient = await supabase.from<Patient>('patients').update(id, updatedData);

      console.log('Supabase update response:', updatedPatient);

      // Create a complete updated patient object for the local state
      const completeUpdatedPatient = {
        ...currentPatient,
        ...updatedData,
        id: id,
        patient_code: currentPatient.patient_code,
        created_at: currentPatient.created_at
      };

      console.log('Complete updated patient for local state:', completeUpdatedPatient);

      // Update local state with the complete updated patient
      setPatients(prev =>
        prev.map(p => p.id === id ? completeUpdatedPatient : p)
      );

      toast({
        title: 'Success',
        description: 'Patient updated successfully.',
      });

      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient:', error);
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `patient_update_error_${id}`,
        customMessage: 'Failed to update patient. Please try again.',
        showToast: true
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
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `patient_delete_error_${id}`,
        customMessage: 'Failed to delete patient. Please try again.',
        showToast: true
      });
      throw error;
    }
  };

  // Get a patient by ID
  const getPatientById = async (id: string): Promise<Patient | null> => {
    try {
      // First check local state
      const localPatient = patients.find(p => p.id === id || p.patient_code === id);
      if (localPatient) return localPatient;

      // If not found locally, fetch from Supabase
      const fetchedPatient = await supabase.from<Patient>('patients').getById(id);
      return fetchedPatient || null;
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `patient_fetch_error_${id}`,
        customMessage: 'Failed to fetch patient. Please try again.',
        showToast: true
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
        (patient.patient_code && patient.patient_code.toLowerCase().includes(lowerQuery))
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
