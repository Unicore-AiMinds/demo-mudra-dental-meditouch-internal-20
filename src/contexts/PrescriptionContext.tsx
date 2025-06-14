import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Prescription, Medication, defaultPrescriptions, defaultMedications } from '@/types/prescriptions';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { handleDatabaseError } from '@/utils/error-handler';
import { AuditLogTemplates } from '@/utils/auditLogger';
import { usePatients } from '@/contexts/PatientContext';
import { useAuditLog } from '@/contexts/AuditLogContext';

// Supabase configuration - same as in supabase.ts
// Verify this matches your actual Supabase project
const SUPABASE_URL = 'https://cqtloiklvpvafeoiyyhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGxvaWtsdnB2YWZlb2l5eWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE1MjAsImV4cCI6MjA2Mjk2NzUyMH0.iaGIQNydn1xK8SQXidXLHya6X2qUtQGq0lVqGw8OZbw';

// Log Supabase configuration to verify
console.log('Using Supabase project:', SUPABASE_URL);

// Define Medicine type if not already imported
interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface PrescriptionContextType {
  getPatientPrescriptions: (patientId: string) => Promise<Prescription[]>;
  addPrescription: (patientId: string, prescription: Omit<Prescription, 'id' | 'prescription_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>) => Promise<Prescription>;
  updatePrescription: (prescriptionId: string, updates: Partial<Omit<Prescription, 'id' | 'prescription_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>>) => Promise<Prescription | null>;
  getActivePrescriptions: (patientId: string) => Promise<Prescription[]>;
  addMedicationToPrescription: (prescriptionId: string, medication: Omit<Medication, 'id' | 'medication_id' | 'prescription_id' | 'created_at' | 'updated_at'>, showToast?: boolean) => Promise<Medication | null>;
  removeMedicationFromPrescription: (prescriptionId: string, medicationId: string, showToast?: boolean) => Promise<boolean>;
  isLoading: boolean;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export const PrescriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const { getPatientById } = usePatients();
  const { logAction } = useAuditLog();

  // Helper function to get patient name for audit logging
  const getPatientNameForAudit = async (patientId: string): Promise<string> => {
    try {
      const patient = await getPatientById(patientId);
      return patient?.name || `Patient ${patientId}`;
    } catch (error) {
      console.error('Error fetching patient name for audit:', error);
      return `Patient ${patientId}`;
    }
  };

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

          // Create default medications - try both table names
          for (const medication of defaultMedications) {
            try {
              // First try with the correct table name from the SQL schema
              await supabase.from<Medication>('prescription_medications').insert(medication);
              console.log(`Added default medication to prescription_medications table`);
            } catch (err) {
              console.error("Error adding default to prescription_medications:", err);
              // Fallback to potential alternative table name
              try {
                await supabase.from<Medication>('prescription_medication').insert(medication);
                console.log(`Added default medication to prescription_medication table`);
              } catch (fallbackErr) {
                console.error("Error adding default to prescription_medication:", fallbackErr);
              }
            }
          }

          // Fetch the newly created prescriptions
          const newPrescriptions = await supabase.from<Prescription>('prescriptions').getAll();

          // Fetch the newly created medications - try both table names
          let newMedications = [];
          try {
            // First try with the correct table name from the SQL schema
            newMedications = await supabase.from<Medication>('prescription_medications').getAll();
            console.log(`Fetched ${newMedications.length} medications from prescription_medications table`);
          } catch (err) {
            console.error("Error fetching from prescription_medications:", err);
            // Fallback to potential alternative table name
            try {
              newMedications = await supabase.from<Medication>('prescription_medication').getAll();
              console.log(`Fetched ${newMedications.length} medications from prescription_medication table`);
            } catch (fallbackErr) {
              console.error("Error fetching from prescription_medication:", fallbackErr);
              // Last resort - create an empty array
              newMedications = [];
            }
          }

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
          // Fetch all medications - try both table names
          let fetchedMedications = [];
          try {
            // First try with the correct table name from the SQL schema
            fetchedMedications = await supabase.from<Medication>('prescription_medications').getAll();
            console.log(`Fetched ${fetchedMedications.length} medications from prescription_medications table`);
          } catch (err) {
            console.error("Error fetching from prescription_medications:", err);
            // Fallback to potential alternative table name
            try {
              fetchedMedications = await supabase.from<Medication>('prescription_medication').getAll();
              console.log(`Fetched ${fetchedMedications.length} medications from prescription_medication table`);
            } catch (fallbackErr) {
              console.error("Error fetching from prescription_medication:", fallbackErr);
              // Last resort - create an empty array
              fetchedMedications = [];
            }
          }

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
        // Use the global error handler
        // handleDatabaseError({
        //   error,
        //   toast,
        //   errorKey: 'prescriptions_init_error',
        //   customMessage: 'Prescription data will be available after setup is complete.',
        //   showToast: true
        // });
      } finally {
        setIsLoading(false);
      }
    };

    initializePrescriptions();
  }, [supabase, toast]);

  // Get all prescriptions for a patient with a single SQL-like query approach
  const getPatientPrescriptions = async (patientId: string): Promise<Prescription[]> => {
    try {
      console.log(`Fetching prescriptions for patient ID: ${patientId}`);
      console.log("=== IMPROVED PRESCRIPTION LOADING PROCESS ===");

      // Step 1: Fetch prescriptions for the patient
      console.log("Step 1: Fetching prescriptions for patient");
      const fetchedPrescriptions = await supabase.from<Prescription>('prescriptions').getAll({
        filters: { patient_id: patientId },
        order: { column: 'date', ascending: false }
      });

      console.log(`Found ${fetchedPrescriptions.length} prescriptions for patient ID: ${patientId}`);

      if (fetchedPrescriptions.length === 0) {
        console.log(`No prescriptions found for patient ID: ${patientId}`);
        return [];
      }

      // Get the UUIDs of the prescriptions
      const prescriptionUuids = fetchedPrescriptions.map(p => p.id);
      console.log(`Prescription UUIDs: ${prescriptionUuids.join(', ')}`);

      // Step 2: Fetch prescription-medication links for these prescriptions
      console.log("Step 2: Fetching prescription-medication links for these prescriptions");

      // Build a filter to get links only for these prescriptions
      // We need to use a different approach since joining with & doesn't work for multiple IDs
      // Instead, we'll use the "in" operator
      const prescriptionIdsString = prescriptionUuids.join(',');
      const linksUrl = `${SUPABASE_URL}/rest/v1/prescription_medications?prescription_id=in.(${prescriptionIdsString})`;

      console.log("Fetching links with URL:", linksUrl);

      let links = [];
      try {
        const linksResponse = await fetch(linksUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!linksResponse.ok) {
          console.error(`Error fetching links: ${linksResponse.status} ${linksResponse.statusText}`);
          throw new Error(`Failed to fetch links: ${linksResponse.status}`);
        }

        links = await linksResponse.json();
        console.log(`Found ${links.length} prescription-medication links`);
      } catch (error) {
        console.error("Error fetching prescription-medication links:", error);
        links = [];
      }

      // Step 3: Fetch medications for these links
      console.log("Step 3: Fetching medications for these links");

      let medications = [];
      if (links.length > 0) {
        // Get all medication IDs from the links
        const medicationIds = links.map(link => link.medication_id);
        console.log(`Medication IDs to fetch: ${medicationIds.join(', ')}`);

        // Build a filter to get only these medications using the "in" operator
        const medicationIdsString = medicationIds.join(',');
        const medicationsUrl = `${SUPABASE_URL}/rest/v1/medications?id=in.(${medicationIdsString})`;

        console.log("Fetching medications with URL:", medicationsUrl);

        try {
          const medicationsResponse = await fetch(medicationsUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });

          if (!medicationsResponse.ok) {
            console.error(`Error fetching medications: ${medicationsResponse.status} ${medicationsResponse.statusText}`);
            throw new Error(`Failed to fetch medications: ${medicationsResponse.status}`);
          }

          medications = await medicationsResponse.json();
          console.log(`Found ${medications.length} medications`);
        } catch (error) {
          console.error("Error fetching medications:", error);
          medications = [];
        }
      } else {
        console.log("No links found, so no medications to fetch");
      }

      // Step 4: Map medications to prescriptions
      console.log("Step 4: Mapping medications to prescriptions");

      // Create a map of prescription ID to medications
      const medicationsByPrescription: Record<string, Medication[]> = {};

      // Initialize with empty arrays for all prescriptions
      prescriptionUuids.forEach(uuid => {
        medicationsByPrescription[uuid] = [];
      });

      // Process links and medications
      if (links.length > 0 && medications.length > 0) {
        console.log("Adding medications to prescriptions from database...");
        console.log("Links:", links);
        console.log("Medications:", medications);

        links.forEach(link => {
          console.log(`Looking for medication with ID ${link.medication_id}`);
          const medication = medications.find(med => med.id === link.medication_id);

          if (medication && link.prescription_id) {
            console.log(`Mapping medication ${medication.id} (${medication.name}) to prescription ${link.prescription_id}`);

            // Convert flat medication fields to the expected structure
            const formattedMedication: Medication = {
              id: medication.id,
              medication_id: medication.medication_id,
              prescription_id: link.prescription_id,
              name: medication.name,
              dosage: medication.dosage,
              duration: medication.duration,
              timing: {
                morning: medication.timing_morning,
                afternoon: medication.timing_afternoon,
                night: medication.timing_night
              },
              food_instructions: medication.food_instructions,
              instructions: medication.instructions,
              dispense_quantity: medication.dispense_quantity
            };

            // Add to the appropriate prescription
            medicationsByPrescription[link.prescription_id].push(formattedMedication);
          }
        });
      } else {
        console.log("No medications found in database. Checking for embedded medications...");

        // Check for embedded medications in the prescription objects
        fetchedPrescriptions.forEach(prescription => {
          if (prescription.medications && prescription.medications.length > 0) {
            console.log(`Found ${prescription.medications.length} embedded medications in prescription ${prescription.id}`);
            medicationsByPrescription[prescription.id] = prescription.medications;
          }
        });
      }

      // Step 5: Create prescriptions with medications
      console.log("Step 5: Creating prescriptions with medications");

      const prescriptionsWithMedications = fetchedPrescriptions.map(prescription => {
        const medsForPrescription = medicationsByPrescription[prescription.id] || [];
        console.log(`Prescription ${prescription.prescription_id} (ID: ${prescription.id}) has ${medsForPrescription.length} medications`);

        if (medsForPrescription.length > 0) {
          console.log(`Medications for prescription ${prescription.id}:`,
            medsForPrescription.map(m => ({ id: m.id, name: m.name, dosage: m.dosage }))
          );
        }

        return {
          ...prescription,
          medications: medsForPrescription
        };
      });

      // Update local state
      setPrescriptions(prev => ({
        ...prev,
        [patientId]: prescriptionsWithMedications
      }));

      return prescriptionsWithMedications;
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      // Use the global error handler
      // handleDatabaseError({
      //   error,
      //   toast,
      //   errorKey: `prescriptions_fetch_error_${patientId}`,
      //   customMessage: 'Prescription data will be available after setup is complete.',
      //   showToast: true
      // });

      // Return existing prescriptions from state or empty array
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
      // Use the global error handler
      // handleDatabaseError({
      //   error,
      //   toast,
      //   errorKey: `active_prescriptions_error_${patientId}`,
      //   customMessage: 'Prescription data will be available after setup is complete.',
      //   showToast: true
      // });
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

      // Add to Supabase using direct fetch API to ensure we get the UUID back
      const { medications, ...prescriptionWithoutMedications } = newPrescription;

      console.log("=== PRESCRIPTION CREATION PROCESS ===");
      console.log("Inserting prescription:", prescriptionWithoutMedications);

      // Use direct fetch API for more control
      const response = await fetch(`${SUPABASE_URL}/rest/v1/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(prescriptionWithoutMedications)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from Supabase:", errorText);
        throw new Error(`Failed to insert prescription: ${response.status} ${response.statusText}`);
      }

      // Parse the response to get the created prescription with UUID
      const responseData = await response.json();
      console.log("Supabase direct insert response for prescription:", responseData);

      if (!responseData || responseData.length === 0) {
        throw new Error("Failed to create prescription: No response data");
      }

      // Use the created prescription with UUID
      const createdPrescription = responseData[0];
      console.log("Successfully created prescription with UUID:", createdPrescription.id);

      // Make sure the created prescription has an empty medications array
      const prescriptionWithEmptyMedications = {
        ...createdPrescription,
        medications: []
      };

      // Update local state
      const updatedPrescriptions = { ...prescriptions };
      if (!updatedPrescriptions[patientId]) {
        updatedPrescriptions[patientId] = [];
      }
      updatedPrescriptions[patientId] = [prescriptionWithEmptyMedications, ...updatedPrescriptions[patientId]];
      setPrescriptions(updatedPrescriptions);

      // Log audit action for prescription creation
      try {
        const patientName = await getPatientNameForAudit(patientId);
        const patient = await getPatientById(patientId);
        const auditEntry = AuditLogTemplates.prescription.create(
          createdPrescription.id,
          patientName,
          prescription.diagnosis || 'No diagnosis specified',
          prescription.prescribed_by || 'Unknown',
          0 // No medications added yet
        );

        // Set clinic type based on patient's clinic registration
        if (patient?.clinic === 'both') {
          // Create audit log entries for both clinics
          await logAction({ ...auditEntry, clinic_type: 'dental' });
          await logAction({ ...auditEntry, clinic_type: 'meditouch' });
        } else {
          // Create single audit log entry
          const clinicType = patient?.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({ ...auditEntry, clinic_type: clinicType });
        }
      } catch (auditError) {
        console.error('Failed to log prescription creation audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'Prescription added successfully.',
      });

      return createdPrescription;
    } catch (error) {
      console.error('Error adding prescription:', error);
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `prescription_add_error_${patientId}`,
        customMessage: 'Failed to add prescription. Please try again.',
        showToast: true
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
      await supabase.from<Prescription>('prescriptions').update(
        prescriptionToUpdate.id,
        updates
      );

      // Ensure we have a valid prescription object with ID to return
      const prescriptionToReturn = {
        ...prescriptionToUpdate,
        ...updates,
        id: prescriptionToUpdate.id // Ensure ID is preserved
      };

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

      // Log audit action for prescription update
      try {
        const patientName = await getPatientNameForAudit(patientId);
        const patient = await getPatientById(patientId);
        const afterPrescription = { ...prescriptionToUpdate, ...updates };
        const auditEntry = AuditLogTemplates.prescription.update(
          prescriptionToUpdate.id,
          patientName,
          {
            before: prescriptionToUpdate,
            after: afterPrescription
          }
        );

        // Set clinic type based on patient's clinic registration
        if (patient?.clinic === 'both') {
          // Create audit log entries for both clinics
          await logAction({ ...auditEntry, clinic_type: 'dental' });
          await logAction({ ...auditEntry, clinic_type: 'meditouch' });
        } else {
          // Create single audit log entry
          const clinicType = patient?.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({ ...auditEntry, clinic_type: clinicType });
        }
      } catch (auditError) {
        console.error('Failed to log prescription update audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'Prescription updated successfully.',
      });

      return prescriptionToReturn;
    } catch (error) {
      console.error('Error updating prescription:', error);
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `prescription_update_error_${prescriptionId}`,
        customMessage: 'Failed to update prescription. Please try again.',
        showToast: true
      });
      return null;
    }
  };

  // Helper function to safely resolve prescription ID to UUID
  const resolvePrescriptionId = async (prescriptionId: string): Promise<string> => {
    console.log(`Resolving prescription ID: ${prescriptionId}`);

    // If it's already a UUID, return as-is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prescriptionId)) {
      console.log(`ID is already a UUID: ${prescriptionId}`);
      return prescriptionId;
    }

    // Search in local state first
    for (const patientId in prescriptions) {
      const prescription = prescriptions[patientId].find(
        p => p.prescription_id === prescriptionId || p.id === prescriptionId
      );

      if (prescription) {
        console.log(`Found prescription UUID ${prescription.id} for prescription_id ${prescriptionId} in local state`);
        return prescription.id;
      }
    }

    // If not found in local state, fetch from Supabase
    try {
      console.log(`Fetching prescription with ID ${prescriptionId} from database`);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/prescriptions?prescription_id=eq.${prescriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) {
        console.error(`Error fetching prescription: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch prescription: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        console.log(`Found prescription in database with UUID: ${data[0].id}`);
        return data[0].id;
      }

      // As a last resort, try direct UUID lookup
      console.log(`Trying direct UUID lookup for ${prescriptionId}`);
      const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/prescriptions?id=eq.${prescriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (directData && directData.length > 0) {
          console.log(`Found prescription with direct UUID lookup: ${directData[0].id}`);
          return directData[0].id;
        }
      }

      console.error(`Could not find prescription with ID ${prescriptionId}`);
      throw new Error(`Prescription with ID ${prescriptionId} not found`);
    } catch (error) {
      console.error('Error resolving prescription ID:', error);
      throw error;
    }
  };

  // Add a medication to an existing prescription
  const addMedicationToPrescription = async (
    prescriptionId: string,
    medication: Omit<Medication, 'id' | 'medication_id' | 'prescription_id' | 'created_at' | 'updated_at'>,
    showToast: boolean = true
  ): Promise<Medication | null> => {
    try {
      console.log("Starting addMedicationToPrescription with:", { prescriptionId, medication });

      // Check if prescriptionId is undefined or null
      if (!prescriptionId) {
        console.error("Invalid prescription ID: undefined or null");
        throw new Error("Invalid prescription ID: undefined or null. Please provide a valid prescription ID.");
      }

      // Helper function for safe string comparison - handles null, undefined, case, and whitespace
      const safeEqual = (a: string | null | undefined, b: string | null | undefined): boolean => {
        return (a ?? '').toString().trim().toLowerCase() === (b ?? '').toString().trim().toLowerCase();
      };

      // For backward compatibility and logging
      const normalize = (str: string | null | undefined): string => {
        return (str ?? '').toString().trim().toLowerCase();
      };

      // Check if prescriptionId is already a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prescriptionId);

      // Use the ID directly if it's a UUID, otherwise try to resolve it
      let prescriptionUuid = '';

      if (isUuid) {
        prescriptionUuid = prescriptionId;
        console.log(`Using provided UUID directly: ${prescriptionUuid}`);
      } else {
        // For backward compatibility, try to resolve the ID
        try {
          prescriptionUuid = await resolvePrescriptionId(prescriptionId);
          console.log(`Resolved prescription ID ${prescriptionId} to UUID: ${prescriptionUuid}`);
        } catch (error) {
          console.error(`Failed to resolve prescription ID ${prescriptionId}:`, error);
          throw new Error(`Invalid prescription ID: ${prescriptionId}. Please use the UUID.`);
        }
      }

      // STEP 1: First, check if the medicine exists in the medicines table
      console.log("Checking if medicine exists in medicines table...");

      // Verify the medicines table schema first
      try {
        console.log("Verifying medicines table schema...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicines?limit=0`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!response.ok) {
          console.error(`Error accessing medicines table: ${response.status} ${response.statusText}`);
          throw new Error(`Medicines table access error: ${response.status}`);
        }

        // Check the table schema
        const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/medicines?select=id,name,dosage,description,created_at,updated_at&limit=0`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!schemaResponse.ok) {
          console.error(`Error checking medicines schema: ${schemaResponse.status} ${schemaResponse.statusText}`);
          // Continue anyway, but log the error
        } else {
          console.log("Medicines table schema verified successfully");
        }
      } catch (error) {
        console.error("Error verifying medicines table:", error);
        // Continue anyway, but log the error
      }

      // Fetch medicines from the table
      const fetchedMedicines = await supabase.from<Medicine>('medicines').getAll();
      console.log(`Found ${fetchedMedicines.length} medicines in the database`);

      // Add detailed logging for medicine matching
      console.log('User input medicine:', {
        name: medication.name,
        normalizedName: normalize(medication.name),
        dosage: medication.dosage,
        normalizedDosage: normalize(medication.dosage || '')
      });

      console.log('Available medicines in DB:', fetchedMedicines.map(m => ({
        id: m.id,
        name: m.name,
        normalizedName: normalize(m.name),
        dosage: m.dosage,
        normalizedDosage: normalize(m.dosage || '')
      })));

      // Find matching medicine by name and dosage using safeEqual for reliable matching
      let matchingMedicine = fetchedMedicines.find(m => {
        const nameMatches = safeEqual(m.name, medication.name);
        const dosageMatches = safeEqual(m.dosage, medication.dosage);

        console.log(`Comparing: "${m.name}" (${normalize(m.name)}) with "${medication.name}" (${normalize(medication.name)}) - Match: ${nameMatches}`);
        console.log(`Comparing: "${m.dosage || ''}" (${normalize(m.dosage || '')}) with "${medication.dosage || ''}" (${normalize(medication.dosage || '')}) - Match: ${dosageMatches}`);

        return nameMatches && dosageMatches;
      });

      // If no matching medicine is found, create one
      if (!matchingMedicine) {
        console.log(`Medicine not found: ${medication.name} ${medication.dosage}. Creating a new one.`);

        try {
          // Create a new medicine with explicit ID and all required fields
          const medicineUuid = uuidv4();
          const newMedicine = {
            id: medicineUuid,
            name: medication.name.trim(), // Trim whitespace
            dosage: (medication.dosage || '').trim(), // Trim whitespace
            description: "Added automatically from prescription",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log("Creating new medicine with direct API:", newMedicine);

          // Use direct fetch API for more control
          try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/medicines`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(newMedicine)
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("Error response from Supabase:", errorText);
              throw new Error(`Failed to create medicine: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log("Supabase direct insert response for medicine:", responseData);

            // Use the created medicine
            const createdMedicine = responseData[0] || { ...newMedicine };
            console.log("Successfully created medicine:", createdMedicine);

            // Use the newly created medicine
            matchingMedicine = createdMedicine;
          } catch (apiError) {
            console.error("API error creating medicine:", apiError);
            // Fallback to using the new medicine object directly
            matchingMedicine = newMedicine;
          }

          // Show a success toast
          toast({
            title: "Medicine Created",
            description: `Created medicine: ${medication.name} ${medication.dosage || ''}`,
          });
        } catch (error) {
          console.error("Failed to create medicine:", error);

          // Show a toast error to the user
          toast({
            title: "Invalid Medicine",
            description: `Medicine not found and could not be created: ${medication.name}, ${medication.dosage}`,
            variant: "destructive",
          });

          // Throw an error to stop the process
          throw new Error(`Medicine not found and could not be created: ${medication.name}, ${medication.dosage}`);
        }
      }

      // STEP 2: Create a medication record in the medications table
      console.log("Creating medication record in medications table...");

      // Generate a unique medication ID
      const medicationTextId = `MED${uuidv4().substring(0, 8)}`;

      // Create the medication record with all required fields from the schema
      // Trim all string values to avoid whitespace issues
      const medicationRecord = {
        medication_id: medicationTextId,
        name: medication.name.trim(),
        dosage: (medication.dosage || '').trim(),
        duration: (medication.duration || '').trim(),
        timing_morning: medication.timing?.morning || false,
        timing_afternoon: medication.timing?.afternoon || false,
        timing_night: medication.timing?.night || false,
        food_instructions: (medication.food_instructions || '').trim(),
        instructions: (medication.instructions || '').trim(),
        dispense_quantity: (medication.dispense_quantity || '').trim(),
        frequency: '' // Add any missing required fields from the schema
      };

      console.log("=== MEDICATION CREATION PROCESS ===");
      console.log("Prescription UUID to link to:", prescriptionUuid);
      console.log("Medication to save:", {
        ...medicationRecord,
        prescription_id: prescriptionUuid
      });

      // Verify medications table schema first
      try {
        console.log("Verifying medications table schema...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medications?limit=0`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!response.ok) {
          console.error(`Error accessing medications table: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error("Error details:", errorText);
        } else {
          console.log("Medications table exists and is accessible");
        }
      } catch (error) {
        console.error("Error verifying medications table:", error);
      }

      // Insert into medications table - DIRECT APPROACH
      let createdMedicationRecord: { id: string };
      try {
        // Generate a UUID for the medication
        const medicationUuid = uuidv4();

        // Create a complete record with all required fields
        const completeRecord = {
          id: medicationUuid, // Explicitly set the ID
          medication_id: medicationTextId,
          name: medication.name.trim(),
          dosage: (medication.dosage || '').trim(),
          duration: (medication.duration || '').trim(),
          timing_morning: medication.timing?.morning || false,
          timing_afternoon: medication.timing?.afternoon || false,
          timing_night: medication.timing?.night || false,
          food_instructions: (medication.food_instructions || '').trim(),
          instructions: (medication.instructions || '').trim(),
          dispense_quantity: (medication.dispense_quantity || '').trim(),
          frequency: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log("Attempting to insert medication with complete record:", completeRecord);

        // Use the direct fetch API to ensure the record is created
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(completeRecord)
        });

        // Log the full response for debugging
        console.log("Response status:", response.status, response.statusText);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from Supabase:", errorText);
          throw new Error(`Failed to insert medication: ${response.status} ${response.statusText}`);
        }

        // Parse the response
        const responseData = await response.json();
        console.log("Supabase direct insert response:", responseData);

        if (responseData && responseData.length > 0 && responseData[0].id) {
          createdMedicationRecord = { id: responseData[0].id };
          console.log("Successfully created medication with returned ID:", responseData[0].id);
        } else {
          // If we don't get a valid response, use our generated UUID
          createdMedicationRecord = { id: medicationUuid };
          console.log("Using generated UUID for medication:", medicationUuid);
        }
      } catch (error) {
        console.error("Failed to create medication record:", error);

        // Generate a UUID for UI purposes
        const medicationUuid = uuidv4();
        createdMedicationRecord = { id: medicationUuid };

        // Show a warning but continue with UI updates
        toast({
          title: "Warning",
          description: "Could not save medication to database. Using temporary data for display.",
        });
      }

      // STEP 3: Link the medication to the prescription in the prescription_medications table
      console.log("Linking medication to prescription...");

      // Verify prescription_medications table schema first
      try {
        console.log("Verifying prescription_medications table schema...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/prescription_medications?limit=0`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!response.ok) {
          console.error(`Error accessing prescription_medications table: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error("Error details:", errorText);
        } else {
          console.log("Prescription_medications table exists and is accessible");
        }
      } catch (error) {
        console.error("Error verifying prescription_medications table:", error);
      }

      // Verify that the prescription exists
      try {
        console.log(`Verifying prescription with ID ${prescriptionUuid} exists...`);
        const prescriptionResponse = await fetch(`${SUPABASE_URL}/rest/v1/prescriptions?id=eq.${prescriptionUuid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!prescriptionResponse.ok) {
          console.error(`Error verifying prescription: ${prescriptionResponse.status} ${prescriptionResponse.statusText}`);
          throw new Error(`Failed to verify prescription: ${prescriptionResponse.status}`);
        }

        const prescriptionData = await prescriptionResponse.json();
        if (!prescriptionData || prescriptionData.length === 0) {
          console.error(`Prescription with ID ${prescriptionUuid} not found in database`);
          throw new Error(`Prescription with ID ${prescriptionUuid} not found in database`);
        }

        console.log(`Verified prescription exists with ID ${prescriptionUuid}`);
      } catch (error) {
        console.error("Error verifying prescription:", error);
        throw error;
      }

      // Create the link record with explicit ID
      const linkUuid = uuidv4();
      const linkRecord = {
        id: linkUuid,
        prescription_id: prescriptionUuid,
        medication_id: createdMedicationRecord.id
      };

      console.log("=== PRESCRIPTION-MEDICATION LINKING PROCESS ===");
      console.log("Prescription UUID:", prescriptionUuid);
      console.log("Medication UUID:", createdMedicationRecord.id);
      console.log("Link record to insert:", linkRecord);

      // Insert into prescription_medications table - DIRECT APPROACH
      try {
        console.log("Attempting to insert link record using direct fetch API...");

        // Create a complete link record with all required fields
        const completeLinkRecord = {
          id: linkUuid,
          prescription_id: prescriptionUuid,
          medication_id: createdMedicationRecord.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log("Link record to insert:", completeLinkRecord);

        // Use the direct fetch API to ensure the record is created
        const response = await fetch(`${SUPABASE_URL}/rest/v1/prescription_medications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(completeLinkRecord)
        });

        // Log the full response for debugging
        console.log("Response status:", response.status, response.statusText);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from Supabase:", errorText);

          // Try to parse the error for more details
          try {
            const errorJson = JSON.parse(errorText);
            console.error("Parsed error:", errorJson);

            // Check for foreign key violation
            if (errorText.includes("foreign key constraint") || errorText.includes("violates foreign key constraint")) {
              console.error("Foreign key constraint violation. This likely means the medication_id or prescription_id doesn't exist in their respective tables.");
              console.error("Medication ID:", createdMedicationRecord.id);
              console.error("Prescription ID:", prescriptionUuid);
            }
          } catch (parseError) {
            // Just log the raw error if we can't parse it
            console.error("Could not parse error JSON:", parseError);
          }

          throw new Error(`Failed to insert link: ${response.status} ${response.statusText}`);
        }

        // Parse the response
        const responseData = await response.json();
        console.log("Supabase direct insert response for link:", responseData);

        console.log("Successfully linked medication to prescription");
      } catch (insertError) {
        console.error("Failed to link medication to prescription:", insertError);
        console.log("Continuing with UI updates only");

        // Show a user-friendly message
        toast({
          title: "Partial Success",
          description: "Medication added to UI but may not be saved in database.",
        });
      }

      // Create a complete medication object for the UI
      const createdMedication: Medication = {
        id: createdMedicationRecord.id,
        medication_id: medicationTextId,
        prescription_id: prescriptionUuid,
        name: medication.name,
        dosage: medication.dosage || '',
        duration: medication.duration || '',
        timing: {
          morning: medication.timing?.morning || false,
          afternoon: medication.timing?.afternoon || false,
          night: medication.timing?.night || false
        },
        food_instructions: medication.food_instructions || '',
        instructions: medication.instructions || '',
        dispense_quantity: medication.dispense_quantity || ''
      };

      console.log('Created medication:', createdMedication);

      // Update local state
      setPrescriptions(prev => {
        const newPrescriptions = { ...prev };
        let updated = false;

        // Find the prescription in all patients
        for (const patientId in newPrescriptions) {
          const index = newPrescriptions[patientId].findIndex(
            p => p.id === prescriptionId || p.prescription_id === prescriptionId
          );

          if (index !== -1) {
            console.log(`Found prescription at index ${index} for patient ${patientId}`);

            // Make sure medications array exists
            const currentMedications = newPrescriptions[patientId][index].medications || [];

            // Add it to the prescription
            const updatedPrescription = {
              ...newPrescriptions[patientId][index],
              medications: [
                ...currentMedications,
                createdMedication
              ]
            };

            console.log('Updated prescription:', updatedPrescription);

            newPrescriptions[patientId] = [
              ...newPrescriptions[patientId].slice(0, index),
              updatedPrescription,
              ...newPrescriptions[patientId].slice(index + 1)
            ];

            updated = true;
            break;
          }
        }

        if (!updated) {
          console.warn(`Could not find prescription ${prescriptionId} in local state to update`);
        }

        return newPrescriptions;
      });

      // Log audit action for medication addition
      try {
        // Find the patient ID from the prescription
        let patientIdForAudit = '';
        for (const pid in prescriptions) {
          const found = prescriptions[pid].find(p => p.id === prescriptionUuid);
          if (found) {
            patientIdForAudit = pid;
            break;
          }
        }
        const patientName = await getPatientNameForAudit(patientIdForAudit);
        const patient = await getPatientById(patientIdForAudit);
        const auditEntry = AuditLogTemplates.prescription.addMedication(
          prescriptionUuid,
          patientName,
          medication.name,
          medication.dosage || '',
          medication.duration || ''
        );

        // Set clinic type based on patient's clinic registration
        if (patient?.clinic === 'both') {
          // Create audit log entries for both clinics
          await logAction({ ...auditEntry, clinic_type: 'dental' });
          await logAction({ ...auditEntry, clinic_type: 'meditouch' });
        } else {
          // Create single audit log entry
          const clinicType = patient?.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({ ...auditEntry, clinic_type: clinicType });
        }
      } catch (auditError) {
        console.error('Failed to log medication addition audit:', auditError);
      }

      // Toast notification is now optional and controlled by the caller
      if (showToast) {
        toast({
          title: 'Success',
          description: 'Medication added to prescription successfully.',
        });
      }

      return createdMedication;
    } catch (error) {
      console.error('Error adding medication to prescription:', error);
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `medication_add_error_${prescriptionId}`,
        customMessage: 'Failed to add medication to prescription. Please try again.',
        showToast: true
      });
      return null;
    }
  };

  // Remove a medication from a prescription
  const removeMedicationFromPrescription = async (
    prescriptionId: string,
    medicationId: string,
    showToast: boolean = true
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

      // Find the actual UUID of the prescription (not the text prescription_id)
      let prescriptionUuid = '';

      // Search in local state first to get the actual UUID
      for (const patientId in prescriptions) {
        const prescription = prescriptions[patientId].find(
          p => p.prescription_id === prescriptionId || p.id === prescriptionId
        );

        if (prescription) {
          prescriptionUuid = prescription.id;
          console.log(`Found prescription UUID ${prescriptionUuid} for prescription_id ${prescriptionId}`);
          break;
        }
      }

      // If not found in local state, fetch from Supabase
      if (!prescriptionUuid) {
        try {
          const fetchedPrescriptions = await supabase.from<Prescription>('prescriptions').getAll({
            filters: { prescription_id: prescriptionId }
          });

          if (fetchedPrescriptions.length > 0) {
            prescriptionUuid = fetchedPrescriptions[0].id;
            console.log(`Fetched prescription UUID ${prescriptionUuid} for prescription_id ${prescriptionId}`);
          } else {
            console.error(`Could not find prescription with prescription_id ${prescriptionId}`);
            throw new Error(`Prescription with ID ${prescriptionId} not found`);
          }
        } catch (error) {
          console.error('Error fetching prescription UUID:', error);
          throw error;
        }
      }

      if (!medicationToDelete) {
        // If not found in local state, fetch from Supabase - try both table names
        let fetchedMedications = [];

        try {
          // First try with the correct table name from the SQL schema
          fetchedMedications = await supabase.from<Medication>('prescription_medications').getAll({
            filters: {
              prescription_id: prescriptionUuid, // Use the UUID, not the text ID
              medication_id: medicationId
            }
          });
          console.log(`Fetched ${fetchedMedications.length} medications from prescription_medications table`);
        } catch (err) {
          console.error("Error fetching from prescription_medications:", err);
          // Fallback to potential alternative table name
          try {
            fetchedMedications = await supabase.from<Medication>('prescription_medication').getAll({
              filters: {
                prescription_id: prescriptionUuid, // Use the UUID, not the text ID
                medication_id: medicationId
              }
            });
            console.log(`Fetched ${fetchedMedications.length} medications from prescription_medication table`);
          } catch (fallbackErr) {
            console.error("Error fetching from prescription_medication:", fallbackErr);
          }
        }

        if (fetchedMedications.length === 0) {
          throw new Error('Medication not found');
        }

        medicationToDelete = fetchedMedications[0];
      }

      // Delete from Supabase using direct fetch API for more control
      try {
        console.log(`Attempting to delete medication with ID ${medicationId} from prescription ${prescriptionUuid}`);

        // First, try to delete the link in prescription_medications table
        const linkDeleteUrl = `${SUPABASE_URL}/rest/v1/prescription_medications?medication_id=eq.${medicationId}`;
        console.log("Deleting link with URL:", linkDeleteUrl);

        const linkDeleteResponse = await fetch(linkDeleteUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!linkDeleteResponse.ok) {
          console.error(`Error deleting link: ${linkDeleteResponse.status} ${linkDeleteResponse.statusText}`);
          const errorText = await linkDeleteResponse.text();
          console.error("Error details:", errorText);
        } else {
          console.log("Successfully deleted link from prescription_medications table");
        }

        // Then, delete the medication itself
        const medicationDeleteUrl = `${SUPABASE_URL}/rest/v1/medications?id=eq.${medicationId}`;
        console.log("Deleting medication with URL:", medicationDeleteUrl);

        const medicationDeleteResponse = await fetch(medicationDeleteUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!medicationDeleteResponse.ok) {
          console.error(`Error deleting medication: ${medicationDeleteResponse.status} ${medicationDeleteResponse.statusText}`);
          const errorText = await medicationDeleteResponse.text();
          console.error("Error details:", errorText);
        } else {
          console.log("Successfully deleted medication from medications table");
        }
      } catch (err) {
        console.error("Error deleting medication:", err);
        throw new Error("Failed to delete medication: " + err.message);
      }

      // Update local state
      setPrescriptions(prev => {
        const newPrescriptions = { ...prev };
        let updated = false;

        // Find the prescription in all patients
        for (const patientId in newPrescriptions) {
          const index = newPrescriptions[patientId].findIndex(
            p => p.id === prescriptionId || p.prescription_id === prescriptionId
          );

          if (index !== -1) {
            console.log(`Found prescription at index ${index} for patient ${patientId}`);

            // Make sure medications array exists
            if (!newPrescriptions[patientId][index].medications) {
              console.warn(`No medications array found for prescription ${prescriptionId}`);
              newPrescriptions[patientId][index].medications = [];
              continue;
            }

            // Log before deletion
            console.log(`Before deletion: ${newPrescriptions[patientId][index].medications.length} medications`);
            console.log('Medications:', newPrescriptions[patientId][index].medications.map(m => ({ id: m.id, name: m.name })));
            console.log(`Trying to delete medication with ID: ${medicationId}`);

            // Filter out the medication
            const updatedMedications = newPrescriptions[patientId][index].medications.filter(m => {
              const doesNotMatch = m.id !== medicationId && m.medication_id !== medicationId;
              if (!doesNotMatch) {
                console.log(`Found matching medication to delete: ${m.id} / ${m.medication_id} - ${m.name}`);
              }
              return doesNotMatch;
            });

            // Log after deletion
            console.log(`After deletion: ${updatedMedications.length} medications`);
            console.log('Updated medications:', updatedMedications.map(m => ({ id: m.id, name: m.name })));

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

            updated = true;
            break;
          }
        }

        if (!updated) {
          console.warn(`Could not find prescription ${prescriptionId} in local state to update`);
        }

        return newPrescriptions;
      });

      // Log audit action for medication removal
      try {
        // Find the patient ID from the prescription
        let patientIdForAudit = '';
        for (const pid in prescriptions) {
          const found = prescriptions[pid].find(p => p.id === prescriptionUuid);
          if (found) {
            patientIdForAudit = pid;
            break;
          }
        }
        const patientName = await getPatientNameForAudit(patientIdForAudit);
        const patient = await getPatientById(patientIdForAudit);
        const auditEntry = AuditLogTemplates.prescription.removeMedication(
          prescriptionUuid,
          patientName,
          medicationToDelete?.name || 'Unknown medication',
          medicationToDelete?.dosage || ''
        );

        // Set clinic type based on patient's clinic registration
        if (patient?.clinic === 'both') {
          // Create audit log entries for both clinics
          await logAction({ ...auditEntry, clinic_type: 'dental' });
          await logAction({ ...auditEntry, clinic_type: 'meditouch' });
        } else {
          // Create single audit log entry
          const clinicType = patient?.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({ ...auditEntry, clinic_type: clinicType });
        }
      } catch (auditError) {
        console.error('Failed to log medication removal audit:', auditError);
      }

      // Toast notification is now optional and controlled by the caller
      if (showToast !== false) {
        toast({
          title: 'Success',
          description: 'Medication removed from prescription successfully.',
        });
      }

      return true;
    } catch (error) {
      console.error('Error removing medication from prescription:', error);
      // Use the global error handler
      handleDatabaseError({
        error,
        toast,
        errorKey: `medication_remove_error_${prescriptionId}_${medicationId}`,
        customMessage: 'Failed to remove medication from prescription. Please try again.',
        showToast: true
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
