
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define clinic types
export type ClinicType = 'dental' | 'meditouch';

// Define the clinic context type
interface ClinicContextType {
  activeClinic: ClinicType;
  setActiveClinic: (clinic: ClinicType) => void;
  isDental: boolean;
  isMeditouch: boolean;
  clinicCapacity: number; // Added clinic capacity
}

// Create the clinic context
const ClinicContext = createContext<ClinicContextType | null>(null);

// Clinic Provider component
export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeClinic, setActiveClinic] = useState<ClinicType>('dental');

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
