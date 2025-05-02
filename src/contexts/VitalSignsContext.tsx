import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VitalSign, demoVitalSigns } from '@/types/vital-signs';
import { v4 as uuidv4 } from 'uuid';

interface VitalSignsContextType {
  getPatientVitalSigns: (patientId: string) => VitalSign[];
  addVitalSign: (patientId: string, vitalSign: Omit<VitalSign, 'id' | 'patientId' | 'date'>) => VitalSign;
  updateVitalSign: (vitalSignId: string, updates: Partial<Omit<VitalSign, 'id' | 'patientId' | 'date'>>) => VitalSign | null;
  getLatestVitalSign: (patientId: string) => VitalSign | null;
}

const VitalSignsContext = createContext<VitalSignsContextType | undefined>(undefined);

export const VitalSignsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vitalSigns, setVitalSigns] = useState<Record<string, VitalSign[]>>(demoVitalSigns);

  // Get all vital signs for a patient
  const getPatientVitalSigns = (patientId: string): VitalSign[] => {
    return vitalSigns[patientId] || [];
  };

  // Add a new vital sign record
  const addVitalSign = (
    patientId: string,
    vitalSign: Omit<VitalSign, 'id' | 'patientId' | 'date'>
  ): VitalSign => {
    const newVitalSign: VitalSign = {
      id: `VS${uuidv4().substring(0, 8)}`,
      patientId,
      date: new Date().toISOString(),
      ...vitalSign
    };

    setVitalSigns(prev => {
      const patientVitalSigns = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [newVitalSign, ...patientVitalSigns]
      };
    });

    return newVitalSign;
  };

  // Update an existing vital sign record
  const updateVitalSign = (
    vitalSignId: string,
    updates: Partial<Omit<VitalSign, 'id' | 'patientId' | 'date'>>
  ): VitalSign | null => {
    let updatedVitalSign: VitalSign | null = null;

    setVitalSigns(prev => {
      const newVitalSigns = { ...prev };
      
      // Find the vital sign in all patients
      for (const patientId in newVitalSigns) {
        const index = newVitalSigns[patientId].findIndex(vs => vs.id === vitalSignId);
        
        if (index !== -1) {
          // Update the vital sign
          updatedVitalSign = {
            ...newVitalSigns[patientId][index],
            ...updates
          };
          
          newVitalSigns[patientId] = [
            ...newVitalSigns[patientId].slice(0, index),
            updatedVitalSign,
            ...newVitalSigns[patientId].slice(index + 1)
          ];
          
          break;
        }
      }
      
      return newVitalSigns;
    });

    return updatedVitalSign;
  };

  // Get the latest vital sign record for a patient
  const getLatestVitalSign = (patientId: string): VitalSign | null => {
    const patientVitalSigns = vitalSigns[patientId] || [];
    
    if (patientVitalSigns.length === 0) {
      return null;
    }
    
    // Sort by date (newest first) and return the first one
    return [...patientVitalSigns].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  };

  return (
    <VitalSignsContext.Provider
      value={{
        getPatientVitalSigns,
        addVitalSign,
        updateVitalSign,
        getLatestVitalSign
      }}
    >
      {children}
    </VitalSignsContext.Provider>
  );
};

export const useVitalSigns = (): VitalSignsContextType => {
  const context = useContext(VitalSignsContext);
  if (context === undefined) {
    throw new Error('useVitalSigns must be used within a VitalSignsProvider');
  }
  return context;
};
