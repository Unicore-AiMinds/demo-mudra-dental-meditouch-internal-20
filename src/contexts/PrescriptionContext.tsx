import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Prescription, Medication, defaultPrescriptions, defaultMedications } from '@/types/prescriptions';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface PrescriptionContextType {
  getPatientPrescriptions: (patientId: string) => Promise<Prescription[]>;
  addPrescription: (patientId: string, prescription: Omit<Prescription, 'id' | 'prescription_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>) => Promise<Prescription>;
  updatePrescription: (prescriptionId: string, updates: Partial<Omit<Prescription, 'id' | 'prescription_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>>) => Promise<Prescription | null>;
  getActivePrescriptions: (patientId: string) => Promise<Prescription[]>;
  addMedicationToPrescription: (prescriptionId: string, medication: Omit<Medication, 'id' | 'medication_id' | 'prescription_id' | 'created_at' | 'updated_at'>) => Promise<Medication | null>;
  removeMedicationFromPrescription: (prescriptionId: string, medicationId: string) => Promise<boolean>;
  isLoading: boolean;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export const PrescriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Initialize prescriptions and medications from Supabase
  useEffect(() => {
    const initializePrescriptions = async () => {
      try {
        setIsLoading(true);

        // Fetch prescriptions from Supabase
        const fetchedPrescriptions = await supabase.from<Prescription>('prescriptions').getAll();

        // If no prescriptions exist, create default ones
        if (fetchedPrescriptions.length === 0) {
          // Create default prescriptions
          for (const prescription of defaultPrescriptions) {
            await supabase.from<Prescription>('prescriptions').insert(prescription);
          }

          // Create default medications
          for (const medication of defaultMedications) {
            await supabase.from<Medication>('prescription_medications').insert(medication);
          }

          // Fetch the newly created prescriptions
          const newPrescriptions = await supabase.from<Prescription>('prescriptions').getAll();

          // Fetch the newly created medications
          const newMedications = await supabase.from<Medication>('prescription_medications').getAll();

          // Group medications by prescription ID
          const medicationsByPrescription: Record<string, Medication[]> = {};
          newMedications.forEach(medication => {
            if (!medicationsByPrescription[medication.prescription_id || '']) {
              medicationsByPrescription[medication.prescription_id || ''] = [];
            }
            medicationsByPrescription[medication.prescription_id || ''].push(medication);
          });

          // Add medications to prescriptions
          const prescriptionsWithMedications = newPrescriptions.map(prescription => ({
            ...prescription,
            medications: medicationsByPrescription[prescription.prescription_id || ''] || []
          }));

          // Group prescriptions by patient ID
          const groupedPrescriptions: Record<string, Prescription[]> = {};
          prescriptionsWithMedications.forEach(prescription => {
            if (!groupedPrescriptions[prescription.patient_id]) {
              groupedPrescriptions[prescription.patient_id] = [];
            }
            groupedPrescriptions[prescription.patient_id].push(prescription);
          });

          setPrescriptions(groupedPrescriptions);
        } else {
          // Fetch all medications
          const fetchedMedications = await supabase.from<Medication>('prescription_medications').getAll();

          // Group medications by prescription ID
          const medicationsByPrescription: Record<string, Medication[]> = {};
          fetchedMedications.forEach(medication => {
            if (!medicationsByPrescription[medication.prescription_id || '']) {
              medicationsByPrescription[medication.prescription_id || ''] = [];
            }
            medicationsByPrescription[medication.prescription_id || ''].push(medication);
          });

          // Add medications to prescriptions
          const prescriptionsWithMedications = fetchedPrescriptions.map(prescription => ({
            ...prescription,
            medications: medicationsByPrescription[prescription.prescription_id || ''] || []
          }));

          // Group prescriptions by patient ID
          const groupedPrescriptions: Record<string, Prescription[]> = {};
          prescriptionsWithMedications.forEach(prescription => {
            if (!groupedPrescriptions[prescription.patient_id]) {
              groupedPrescriptions[prescription.patient_id] = [];
            }
            groupedPrescriptions[prescription.patient_id].push(prescription);
          });

          setPrescriptions(groupedPrescriptions);
        }
      } catch (error) {
        console.error('Error initializing prescriptions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load prescriptions. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializePrescriptions();
  }, [supabase, toast]);

  // Get all prescriptions for a patient
  const getPatientPrescriptions = async (patientId: string): Promise<Prescription[]> => {
    try {
      // Fetch directly from Supabase for the most up-to-date data
      const fetchedPrescriptions = await supabase.from<Prescription>('prescriptions').getAll({
        filters: { patient_id: patientId },
        order: { column: 'date', ascending: false }
      });

      // Fetch medications for these prescriptions
      const prescriptionIds = fetchedPrescriptions.map(p => p.prescription_id).filter(Boolean);

      if (prescriptionIds.length === 0) {
        return [];
      }

      const fetchedMedications = await supabase.from<Medication>('prescription_medications').getAll({
        filters: { prescription_id: prescriptionIds }
      });

      // Group medications by prescription ID
      const medicationsByPrescription: Record<string, Medication[]> = {};
      fetchedMedications.forEach(medication => {
        if (!medicationsByPrescription[medication.prescription_id || '']) {
          medicationsByPrescription[medication.prescription_id || ''] = [];
        }
        medicationsByPrescription[medication.prescription_id || ''].push(medication);
      });

      // Add medications to prescriptions
      const prescriptionsWithMedications = fetchedPrescriptions.map(prescription => ({
        ...prescription,
        medications: medicationsByPrescription[prescription.prescription_id || ''] || []
      }));

      return prescriptionsWithMedications;
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch prescriptions. Please try again.',
        variant: 'destructive',
      });
      return prescriptions[patientId] || [];
    }
  };

  // Get only active prescriptions for a patient
  const getActivePrescriptions = async (patientId: string): Promise<Prescription[]> => {
    try {
      const patientPrescriptions = await getPatientPrescriptions(patientId);
      return patientPrescriptions.filter(prescription => prescription.status === 'Active');
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch active prescriptions. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Add a new prescription
  const addPrescription = async (
    patientId: string,
    prescription: Omit<Prescription, 'id' | 'prescription_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>
  ): Promise<Prescription> => {
    try {
      // Generate a unique prescription ID
      const prescriptionId = `PR${uuidv4().substring(0, 8)}`;

      // Create new prescription
      const newPrescription = {
        prescription_id: prescriptionId,
        patient_id: patientId,
        date: new Date().toISOString(),
        medications: [], // Will be added separately
        ...prescription
      };

      // Add to Supabase
      const { medications, ...prescriptionWithoutMedications } = newPrescription;
      const createdPrescription = await supabase.from<Prescription>('prescriptions').insert(prescriptionWithoutMedications);

      // Update local state
      const updatedPrescriptions = { ...prescriptions };
      if (!updatedPrescriptions[patientId]) {
        updatedPrescriptions[patientId] = [];
      }
      updatedPrescriptions[patientId] = [createdPrescription, ...updatedPrescriptions[patientId]];
      setPrescriptions(updatedPrescriptions);

      toast({
        title: 'Success',
        description: 'Prescription added successfully.',
      });

      return createdPrescription;
    } catch (error) {
      console.error('Error adding prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to add prescription. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing prescription
  const updatePrescription = async (
    prescriptionId: string,
    updates: Partial<Omit<Prescription, 'id' | 'prescription_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>>
  ): Promise<Prescription | null> => {
    try {
      // Find the prescription to update
      let prescriptionToUpdate: Prescription | null = null;
      let patientId = '';

      // Search in local state first
      for (const pid in prescriptions) {
        const found = prescriptions[pid].find(p => p.id === prescriptionId || p.prescription_id === prescriptionId);
        if (found) {
          prescriptionToUpdate = found;
          patientId = pid;
          break;
        }
      }

      if (!prescriptionToUpdate) {
        // If not found in local state, fetch from Supabase
        const fetchedPrescriptions = await supabase.from<Prescription>('prescriptions').getAll({
          filters: { prescription_id: prescriptionId }
        });

        if (fetchedPrescriptions.length === 0) {
          throw new Error('Prescription not found');
        }

        prescriptionToUpdate = fetchedPrescriptions[0];
        patientId = prescriptionToUpdate.patient_id;
      }

      // Update in Supabase
      const updatedPrescription = await supabase.from<Prescription>('prescriptions').update(
        prescriptionToUpdate.id,
        updates
      );

      // Update local state
      setPrescriptions(prev => {
        const newPrescriptions = { ...prev };

        if (newPrescriptions[patientId]) {
          const index = newPrescriptions[patientId].findIndex(
            p => p.id === prescriptionId || p.prescription_id === prescriptionId
          );

          if (index !== -1) {
            newPrescriptions[patientId] = [
              ...newPrescriptions[patientId].slice(0, index),
              { ...newPrescriptions[patientId][index], ...updates },
              ...newPrescriptions[patientId].slice(index + 1)
            ];
          }
        }

        return newPrescriptions;
      });

      toast({
        title: 'Success',
        description: 'Prescription updated successfully.',
      });

      return updatedPrescription;
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update prescription. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Add a medication to an existing prescription
  const addMedicationToPrescription = async (
    prescriptionId: string,
    medication: Omit<Medication, 'id' | 'medication_id' | 'prescription_id' | 'created_at' | 'updated_at'>
  ): Promise<Medication | null> => {
    try {
      // Generate a unique medication ID
      const medicationId = `MED${uuidv4().substring(0, 8)}`;

      // Create new medication
      const newMedication = {
        medication_id: medicationId,
        prescription_id: prescriptionId,
        ...medication
      };

      // Add to Supabase
      const createdMedication = await supabase.from<Medication>('prescription_medications').insert(newMedication);

      // Update local state
      setPrescriptions(prev => {
        const newPrescriptions = { ...prev };

        // Find the prescription in all patients
        for (const patientId in newPrescriptions) {
          const index = newPrescriptions[patientId].findIndex(
            p => p.id === prescriptionId || p.prescription_id === prescriptionId
          );

          if (index !== -1) {
            // Add it to the prescription
            const updatedPrescription = {
              ...newPrescriptions[patientId][index],
              medications: [
                ...newPrescriptions[patientId][index].medications,
                createdMedication
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

      toast({
        title: 'Success',
        description: 'Medication added to prescription successfully.',
      });

      return createdMedication;
    } catch (error) {
      console.error('Error adding medication to prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to add medication to prescription. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Remove a medication from a prescription
  const removeMedicationFromPrescription = async (
    prescriptionId: string,
    medicationId: string
  ): Promise<boolean> => {
    try {
      // Find the medication to delete
      let medicationToDelete: Medication | null = null;

      // Search in local state first
      for (const patientId in prescriptions) {
        const prescription = prescriptions[patientId].find(
          p => p.id === prescriptionId || p.prescription_id === prescriptionId
        );

        if (prescription) {
          medicationToDelete = prescription.medications.find(
            m => m.id === medicationId || m.medication_id === medicationId
          ) || null;
          break;
        }
      }

      if (!medicationToDelete) {
        // If not found in local state, fetch from Supabase
        const fetchedMedications = await supabase.from<Medication>('prescription_medications').getAll({
          filters: {
            prescription_id: prescriptionId,
            medication_id: medicationId
          }
        });

        if (fetchedMedications.length === 0) {
          throw new Error('Medication not found');
        }

        medicationToDelete = fetchedMedications[0];
      }

      // Delete from Supabase
      await supabase.from<Medication>('prescription_medications').delete(medicationToDelete.id);

      // Update local state
      setPrescriptions(prev => {
        const newPrescriptions = { ...prev };

        // Find the prescription in all patients
        for (const patientId in newPrescriptions) {
          const index = newPrescriptions[patientId].findIndex(
            p => p.id === prescriptionId || p.prescription_id === prescriptionId
          );

          if (index !== -1) {
            // Filter out the medication
            const updatedMedications = newPrescriptions[patientId][index].medications.filter(
              m => m.id !== medicationId && m.medication_id !== medicationId
            );

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

      toast({
        title: 'Success',
        description: 'Medication removed from prescription successfully.',
      });

      return true;
    } catch (error) {
      console.error('Error removing medication from prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove medication from prescription. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <PrescriptionContext.Provider
      value={{
        getPatientPrescriptions,
        addPrescription,
        updatePrescription,
        getActivePrescriptions,
        addMedicationToPrescription,
        removeMedicationFromPrescription,
        isLoading
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
