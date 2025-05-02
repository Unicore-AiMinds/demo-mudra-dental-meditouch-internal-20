import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Prescription, Medication, demoPrescriptions } from '@/types/prescriptions';
import { v4 as uuidv4 } from 'uuid';

interface PrescriptionContextType {
  getPatientPrescriptions: (patientId: string) => Prescription[];
  addPrescription: (patientId: string, prescription: Omit<Prescription, 'id' | 'patientId' | 'date'>) => Prescription;
  updatePrescription: (prescriptionId: string, updates: Partial<Omit<Prescription, 'id' | 'patientId' | 'date'>>) => Prescription | null;
  getActivePrescriptions: (patientId: string) => Prescription[];
  addMedicationToPrescription: (prescriptionId: string, medication: Omit<Medication, 'id'>) => Medication | null;
  removeMedicationFromPrescription: (prescriptionId: string, medicationId: string) => boolean;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export const PrescriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>(demoPrescriptions);

  // Get all prescriptions for a patient
  const getPatientPrescriptions = (patientId: string): Prescription[] => {
    return prescriptions[patientId] || [];
  };

  // Get only active prescriptions for a patient
  const getActivePrescriptions = (patientId: string): Prescription[] => {
    const patientPrescriptions = prescriptions[patientId] || [];
    return patientPrescriptions.filter(prescription => prescription.status === 'Active');
  };

  // Add a new prescription
  const addPrescription = (
    patientId: string,
    prescription: Omit<Prescription, 'id' | 'patientId' | 'date'>
  ): Prescription => {
    const newPrescription: Prescription = {
      id: `PR${uuidv4().substring(0, 8)}`,
      patientId,
      date: new Date().toISOString(),
      ...prescription
    };

    setPrescriptions(prev => {
      const patientPrescriptions = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [newPrescription, ...patientPrescriptions]
      };
    });

    return newPrescription;
  };

  // Update an existing prescription
  const updatePrescription = (
    prescriptionId: string,
    updates: Partial<Omit<Prescription, 'id' | 'patientId' | 'date'>>
  ): Prescription | null => {
    let updatedPrescription: Prescription | null = null;

    setPrescriptions(prev => {
      const newPrescriptions = { ...prev };
      
      // Find the prescription in all patients
      for (const patientId in newPrescriptions) {
        const index = newPrescriptions[patientId].findIndex(p => p.id === prescriptionId);
        
        if (index !== -1) {
          // Update the prescription
          updatedPrescription = {
            ...newPrescriptions[patientId][index],
            ...updates
          };
          
          newPrescriptions[patientId] = [
            ...newPrescriptions[patientId].slice(0, index),
            updatedPrescription,
            ...newPrescriptions[patientId].slice(index + 1)
          ];
          
          break;
        }
      }
      
      return newPrescriptions;
    });

    return updatedPrescription;
  };

  // Add a medication to an existing prescription
  const addMedicationToPrescription = (
    prescriptionId: string,
    medication: Omit<Medication, 'id'>
  ): Medication | null => {
    let addedMedication: Medication | null = null;

    setPrescriptions(prev => {
      const newPrescriptions = { ...prev };
      
      // Find the prescription in all patients
      for (const patientId in newPrescriptions) {
        const index = newPrescriptions[patientId].findIndex(p => p.id === prescriptionId);
        
        if (index !== -1) {
          // Create the new medication
          addedMedication = {
            id: `MED${uuidv4().substring(0, 8)}`,
            ...medication
          };
          
          // Add it to the prescription
          const updatedPrescription = {
            ...newPrescriptions[patientId][index],
            medications: [
              ...newPrescriptions[patientId][index].medications,
              addedMedication
            ]
          };
          
          newPrescriptions[patientId] = [
            ...newPrescriptions[patientId].slice(0, index),
            updatedPrescription,
            ...newPrescriptions[patientId].slice(index + 1)
          ];
          
          break;
        }
      }
      
      return newPrescriptions;
    });

    return addedMedication;
  };

  // Remove a medication from a prescription
  const removeMedicationFromPrescription = (
    prescriptionId: string,
    medicationId: string
  ): boolean => {
    let success = false;

    setPrescriptions(prev => {
      const newPrescriptions = { ...prev };
      
      // Find the prescription in all patients
      for (const patientId in newPrescriptions) {
        const index = newPrescriptions[patientId].findIndex(p => p.id === prescriptionId);
        
        if (index !== -1) {
          // Filter out the medication
          const updatedMedications = newPrescriptions[patientId][index].medications.filter(
            m => m.id !== medicationId
          );
          
          // If the medication was found and removed, the lengths will be different
          success = updatedMedications.length < newPrescriptions[patientId][index].medications.length;
          
          // Update the prescription
          const updatedPrescription = {
            ...newPrescriptions[patientId][index],
            medications: updatedMedications
          };
          
          newPrescriptions[patientId] = [
            ...newPrescriptions[patientId].slice(0, index),
            updatedPrescription,
            ...newPrescriptions[patientId].slice(index + 1)
          ];
          
          break;
        }
      }
      
      return newPrescriptions;
    });

    return success;
  };

  return (
    <PrescriptionContext.Provider
      value={{
        getPatientPrescriptions,
        addPrescription,
        updatePrescription,
        getActivePrescriptions,
        addMedicationToPrescription,
        removeMedicationFromPrescription
      }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
};

export const usePrescriptions = (): PrescriptionContextType => {
  const context = useContext(PrescriptionContext);
  if (context === undefined) {
    throw new Error('usePrescriptions must be used within a PrescriptionProvider');
  }
  return context;
};
