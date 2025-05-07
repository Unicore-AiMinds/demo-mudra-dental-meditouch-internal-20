
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';

// Define clinic types
export type ClinicType = 'dental' | 'meditouch';

// Define clinic interface
interface Clinic {
  id: string;
  name: string;
  type: ClinicType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
}

// Define the clinic context type
interface ClinicContextType {
  activeClinic: ClinicType;
  setActiveClinic: (clinic: ClinicType) => void;
  isDental: boolean;
  isMeditouch: boolean;
  clinicCapacity: number;
  clinics: Clinic[];
  isLoading: boolean;
}

// Create the clinic context
const ClinicContext = createContext<ClinicContextType | null>(null);

// Clinic Provider component
export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeClinic, setActiveClinic] = useState<ClinicType>('dental');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();

  // Initialize default clinics if none exist
  useEffect(() => {
    const initializeClinics = async () => {
      try {
        setIsLoading(true);

        // Fetch clinics from Supabase
        const fetchedClinics = await supabase.from<Clinic>('clinics').getAll();

        if (fetchedClinics.length === 0) {
          // Create default clinics
          const defaultClinics = [
            {
              name: 'Mudra Dental Clinic',
              type: 'dental' as ClinicType,
              address: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001',
              phone: '+91 9876543210',
              email: 'info@mudradental.com'
            },
            {
              name: 'Mudra Meditouch Clinic',
              type: 'meditouch' as ClinicType,
              address: '456 Park Avenue',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400002',
              phone: '+91 9876543211',
              email: 'info@mudrameditouch.com'
            }
          ];

          for (const clinic of defaultClinics) {
            await supabase.from<Clinic>('clinics').insert(clinic);
          }

          // Fetch the newly created clinics
          const newClinics = await supabase.from<Clinic>('clinics').getAll();
          setClinics(newClinics);
        } else {
          setClinics(fetchedClinics);
        }
      } catch (error) {
        console.error('Error initializing clinics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeClinics();
  }, [supabase]);

  // Save active clinic to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mudraActiveClinic', activeClinic);

    // Update document theme based on active clinic
    document.body.classList.remove('theme-dental', 'theme-meditouch');
    document.body.classList.add(`theme-${activeClinic}`);
  }, [activeClinic]);

  // Check localStorage for previously selected clinic on initial load
  useEffect(() => {
    const savedClinic = localStorage.getItem('mudraActiveClinic') as ClinicType;
    if (savedClinic && (savedClinic === 'dental' || savedClinic === 'meditouch')) {
      setActiveClinic(savedClinic);
    }
  }, []);

  // Get current clinic capacity
  const clinicCapacity = activeClinic === 'dental' ? 2 : 1;

  return (
    <ClinicContext.Provider value={{
      activeClinic,
      setActiveClinic,
      isDental: activeClinic === 'dental',
      isMeditouch: activeClinic === 'meditouch',
      clinicCapacity,
      clinics,
      isLoading,
    }}>
      {children}
    </ClinicContext.Provider>
  );
};

// Hook for using clinic context
export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
