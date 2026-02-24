import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Plus, Save, X, Trash, FileText, Printer } from 'lucide-react';
import { Prescription, Medication } from '@/types/prescriptions';
import { usePrescriptions } from '@/contexts/PrescriptionContext';
import { useClinicInfo } from '@/contexts/ClinicInfoContext';
import { useDoctors } from '@/contexts/DoctorContext';
import { useMedicines } from '@/contexts/MedicineContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { Medicine, getUniqueMedicineNames, getDosagesForMedicine } from '@/types/medicines';
import { format as formatDate } from 'date-fns';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PrescriptionComponentProps {
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientDOB?: string;
}

const PrescriptionComponent: React.FC<PrescriptionComponentProps> = ({ patientId, patientName, patientAge, patientDOB }) => {
  const {
    getPatientPrescriptions,
    addPrescription,
    updatePrescription,
    addMedicationToPrescription,
    removeMedicationFromPrescription
  } = usePrescriptions();
  const { currentClinicInfo, getFullAddress } = useClinicInfo();
  const { doctors } = useDoctors();
  const { medicines } = useMedicines();
  const { supabase } = useSupabase();
  const { hasPermission } = usePermissions();

  // Log available medicines for debugging
  useEffect(() => {
    console.log("Available medicines in the system:", medicines);
  }, [medicines]);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [availableDosages, setAvailableDosages] = useState<string[]>([]);
  const { toast } = useToast();

  // Define empty prescription object for reuse
  const emptyPrescription = {
    diagnosis: '',
    notes: '',
    prescribed_by: '',
    status: 'Active' as 'Active' | 'Completed' | 'Cancelled',
    doctor_reg_no: ''
  };

  // Form state for new prescription (without medications field)
  const [newPrescription, setNewPrescription] = useState(emptyPrescription);

  // Separate state for new medications list
  const [newMedications, setNewMedications] = useState<Omit<Medication, 'id' | 'medication_id' | 'prescription_id' | 'created_at' | 'updated_at'>[]>([]);

  // Form state for new medication
  const [newMedication, setNewMedication] = useState<Omit<Medication, 'id'>>({
    name: '',
    dosage: '',
    duration: '',
    timing: {
      morning: false,
      afternoon: false,
      night: false
    },
    food_instructions: '',
    instructions: '',
    dispense_quantity: ''
  });

  // Load prescriptions for the patient
  useEffect(() => {
    console.log('Loading prescriptions for patient ID:', patientId);
    const fetchPrescriptions = async () => {
      try {
        const patientPrescriptions = await getPatientPrescriptions(patientId);
        console.log('Found prescriptions:', patientPrescriptions);

        // Sort prescriptions by date (newest first)
        const sortedPrescriptions = [...patientPrescriptions].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setPrescriptions(sortedPrescriptions);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        toast({
          title: "Error",
          description: "Failed to load prescriptions. Please try again.",
          variant: "destructive"
        });
        setPrescriptions([]);
      }
    };

    fetchPrescriptions();
  }, [patientId, getPatientPrescriptions, toast]);

  // Filter prescriptions based on active tab
  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (activeTab === 'all') return true;
    return prescription.status.toLowerCase() === activeTab;
  });

  // Handle input change for new prescription
  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPrescription(prev => ({ ...prev, [name]: value }));
  };

  // Handle medicine name selection from combobox
  const handleMedicineNameSelect = (selectedMedicineName: string) => {
    if (selectedMedicineName) {
      // Update the medication name
      setNewMedication(prev => ({
        ...prev,
        name: selectedMedicineName,
        dosage: '' // Clear dosage when medicine changes
      }));

      // Get available dosages for this medicine
      const dosages = getDosagesForMedicine(medicines, selectedMedicineName);
      setAvailableDosages(dosages);

      // If there's only one dosage available, select it automatically
      if (dosages.length === 1) {
        setNewMedication(prev => ({
          ...prev,
          dosage: dosages[0]
        }));
      }
    } else {
      // If empty value is chosen, clear the fields
      setNewMedication(prev => ({
        ...prev,
        name: '',
        dosage: ''
      }));
      setAvailableDosages([]);
    }
  };

  // Handle dosage selection from combobox
  const handleDosageSelect = (selectedDosage: string) => {
    setNewMedication(prev => ({
      ...prev,
      dosage: selectedDosage
    }));
  };

  // Handle timing checkbox changes
  const handleTimingChange = (time: 'morning' | 'afternoon' | 'night') => {
    setNewMedication(prev => {
      // Toggle the timing checkbox
      const updatedTiming = {
        ...prev.timing!,
        [time]: !prev.timing![time]
      };

      // Create updated medication object
      const updated = {
        ...prev,
        timing: updatedTiming
      };

      // Auto-calculate dispense quantity if duration is set
      if (prev.duration) {
        try {
          // Extract numeric values from duration (e.g., "7 days" -> 7)
          const durationMatch = prev.duration.match(/(\d+)/);
          const durationNum = durationMatch ? parseInt(durationMatch[0], 10) : 0;

          if (durationNum > 0) {
            // Count selected timing checkboxes
            const frequencyPerDay = (updatedTiming.morning ? 1 : 0) +
                                   (updatedTiming.afternoon ? 1 : 0) +
                                   (updatedTiming.night ? 1 : 0);

            // Calculate total quantity if timing checkboxes are selected
            if (frequencyPerDay > 0) {
              const total = frequencyPerDay * durationNum;
              // Format as just the total number of tablets
              updated.dispense_quantity = `${total} tablets`;
            }
          }
        } catch (error) {
          console.error('Error calculating dispense quantity:', error);
        }
      }

      return updated;
    });
  };

  // Handle food instructions dropdown change
  const handleFoodInstructionsChange = (selectedInstruction: string) => {
    setNewMedication(prev => ({
      ...prev,
      food_instructions: selectedInstruction
    }));
  };

  // Handle input change for new medication
  const handleMedicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Sanitize input - trim whitespace for string fields
    const sanitizedValue = typeof value === 'string' ? value.trim() : value;

    // Update the medication state
    setNewMedication(prev => {
      // Create updated object with sanitized value
      const updated = {
        ...prev,
        [name]: sanitizedValue
      };

      // Special handling for name and dosage to ensure they're always trimmed
      if (name === 'name' || name === 'dosage') {
        updated[name] = (sanitizedValue || '').toString().trim();
      }

      // Auto-calculate dispense quantity if duration is set
      if (name === 'duration') {
        try {
          // Extract numeric values from duration (e.g., "7 days" -> 7)
          const durationMatch = updated.duration?.match(/(\d+)/);
          const durationNum = durationMatch ? parseInt(durationMatch[0], 10) : 0;

          if (durationNum > 0) {
            // Count selected timing checkboxes
            const frequencyPerDay = (updated.timing.morning ? 1 : 0) +
                                   (updated.timing.afternoon ? 1 : 0) +
                                   (updated.timing.night ? 1 : 0);

            // Calculate total quantity if timing checkboxes are selected
            if (frequencyPerDay > 0) {
              const total = frequencyPerDay * durationNum;
              // Format as just the total number of tablets
              updated.dispense_quantity = `${total} tablets`;
            }
          }
        } catch (error) {
          console.error('Error calculating dispense quantity:', error);
        }
      }

      return updated;
    });
  };

  // Handle adding a medication to the current prescription
  const handleAddMedication = () => {
    // Validate required fields
    if (!newMedication.name || !newMedication.dosage || !newMedication.duration) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required medication fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if timing is specified
    const hasTimingSelected = newMedication.timing &&
      (newMedication.timing.morning || newMedication.timing.afternoon || newMedication.timing.night);

    if (!hasTimingSelected) {
      toast({
        title: "Missing Timing Information",
        description: "Please select at least one timing checkbox (Morning/Afternoon/Night).",
        variant: "destructive",
      });
      return;
    }

    // Verify that the medicine exists in the medicines table
    // Helper function for safe string comparison - handles null, undefined, case, and whitespace
    const safeEqual = (a: string | null | undefined, b: string | null | undefined): boolean => {
      return (a ?? '').toString().trim().toLowerCase() === (b ?? '').toString().trim().toLowerCase();
    };

    // For logging purposes
    const normalize = (str: string | null | undefined): string => {
      return (str ?? '').toString().trim().toLowerCase();
    };

    // Sanitize the medication name and dosage one more time before comparison
    const sanitizedName = (newMedication.name ?? '').trim();
    const sanitizedDosage = (newMedication.dosage ?? '').trim();

    console.log('Looking for medicine match with sanitized values:', {
      name: sanitizedName,
      normalizedName: normalize(sanitizedName),
      dosage: sanitizedDosage,
      normalizedDosage: normalize(sanitizedDosage)
    });

    // Use safeEqual for more reliable matching
    const matchingMedicine = medicines.find(m =>
      safeEqual(m.name, sanitizedName) && safeEqual(m.dosage, sanitizedDosage)
    );

    if (!matchingMedicine) {
      console.error(`No matching medicine found for ${newMedication.name} - ${newMedication.dosage}`);
      console.log("Available medicines:", medicines.map(m => ({ id: m.id, name: m.name, dosage: m.dosage })));

      // Show a warning to the user with sanitized values
      toast({
        title: "Warning: Medicine Not Found",
        description: `${sanitizedName} ${sanitizedDosage} is not in the medicines database. This may cause issues when saving.`,
      });

      // Option to add the medicine to the database with sanitized values
      if (confirm(`${sanitizedName} ${sanitizedDosage} is not in the medicines database. Would you like to add it now?`)) {
        try {
          // Add the medicine to the database with sanitized values
          const newMedicine = {
            name: sanitizedName,
            dosage: sanitizedDosage,
            description: "Added from prescription form"
          };

          // Use the context method to add the medicine
          // This will be handled by the PrescriptionContext's addMedicationToPrescription method
          // which will properly handle the medicine ID lookup
          console.log("User chose to add medicine to database:", newMedicine);
          toast({
            title: "Medicine Will Be Added",
            description: `${sanitizedName} ${sanitizedDosage} will be added to the database when the prescription is saved.`,
          });
        } catch (error: unknown) {
          console.error("Error adding medicine:", error);
        }
      }
    } else {
      console.log(`Found matching medicine with ID: ${matchingMedicine.id} for ${newMedication.name} - ${newMedication.dosage}`);
    }

    // Auto-calculate dispense quantity if not already set
    if (!newMedication.dispense_quantity) {
      try {
        // Extract numeric values from duration (e.g., "7 days" -> 7)
        const durationMatch = newMedication.duration.match(/(\d+)/);
        const durationNum = durationMatch ? parseInt(durationMatch[0], 10) : 0;

        if (durationNum <= 0) {
          toast({
            title: "Invalid Duration",
            description: "Please enter a valid numeric duration.",
            variant: "destructive",
          });
          return;
        }

        // Count selected timing checkboxes
        const frequencyPerDay = (newMedication.timing.morning ? 1 : 0) +
                               (newMedication.timing.afternoon ? 1 : 0) +
                               (newMedication.timing.night ? 1 : 0);

        // Calculate total quantity
        if (frequencyPerDay > 0) {
          const total = frequencyPerDay * durationNum;
          // Format as just the total number of tablets
          setNewMedication(prev => ({
            ...prev,
            dispense_quantity: `${total} tablets`
          }));
        } else {
          toast({
            title: "Missing Dispense Quantity",
            description: "Please enter a dispense quantity manually as it couldn't be calculated automatically.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error calculating dispense quantity:', error);
        toast({
          title: "Missing Dispense Quantity",
          description: "Please enter a dispense quantity manually.",
          variant: "destructive",
        });
        return;
      }
    }

    // Add to the newMedications array instead of the prescription object
    setNewMedications(prev => [...prev, { ...newMedication }]);

    // Reset medication form
    setNewMedication({
      name: '',
      dosage: '',
      duration: '',
      timing: {
        morning: false,
        afternoon: false,
        night: false
      },
      food_instructions: '',
      instructions: '',
      dispense_quantity: ''
    });
  };

  // Handle removing a medication from the current prescription
  const handleRemoveMedication = (index: number) => {
    setNewMedications(prev => prev.filter((_, i) => i !== index));
  };

  // Handle saving a new prescription using the new approach
  const handleSaveNewPrescription = async () => {
    try {
      // Validate required fields
      if (!newPrescription.diagnosis || !newPrescription.prescribed_by) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in diagnosis and doctor fields.",
          variant: "destructive",
        });
        return;
      }

      if (newMedications.length === 0) {
        toast({
          title: "No Medications",
          description: "Please add at least one medication.",
          variant: "destructive",
        });
        return;
      }

      // 1️⃣ Create the prescription (no medications field needed)
      console.log("1️⃣ Creating prescription:", newPrescription);
      const createdPrescription = await addPrescription(patientId, newPrescription);

      if (!createdPrescription) {
        throw new Error("Failed to create prescription");
      }

      console.log("Prescription created:", createdPrescription);
      console.log("IMPORTANT: Using prescription UUID for medication links:", createdPrescription.id);

      // 2️⃣ For each medication, add it directly to DB
      console.log("2️⃣ Adding medications to database");

      for (const medication of newMedications) {
        // Sanitize all string fields to avoid whitespace issues
        const sanitizedMedication = {
          name: medication.name.trim(),
          dosage: (medication.dosage || '').trim(),
          duration: (medication.duration || '').trim(),
          timing: medication.timing,
          food_instructions: (medication.food_instructions || '').trim(),
          instructions: (medication.instructions || '').trim(),
          dispense_quantity: (medication.dispense_quantity || '').trim()
        };

        console.log("Adding medication to prescription:", sanitizedMedication);

        // Use the context method to add the medication directly to the database
        // Pass false for showToast to prevent multiple notifications
        const result = await addMedicationToPrescription(createdPrescription.id, sanitizedMedication, false);

        console.log("Successfully added medication:", result);
      }

      // 3️⃣ Refresh prescriptions from DB
      console.log("3️⃣ Refreshing prescriptions from database");
      const updatedPrescriptions = await getPatientPrescriptions(patientId);
      setPrescriptions(updatedPrescriptions);

      // 4️⃣ Reset form
      setNewPrescription(emptyPrescription);
      setNewMedications([]);
      setIsAddingNew(false);

      // 5️⃣ Show success message
      toast({
        title: "Success",
        description: "Prescription and medications saved successfully.",
      });
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast({
        title: "Error",
        description: "Failed to save prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle editing an existing prescription
  const handleEditPrescription = (id: string) => {
    const prescription = prescriptions.find(p => p.id === id);
    if (prescription) {
      // Set the prescription details
      setNewPrescription({
        diagnosis: prescription.diagnosis,
        notes: prescription.notes || '',
        prescribed_by: prescription.prescribed_by,
        status: prescription.status as 'Active' | 'Completed' | 'Cancelled',
        doctor_reg_no: prescription.doctor_reg_no || ''
      });

      // Set the medications in the separate array
      if (prescription.medications && prescription.medications.length > 0) {
        const medicationsWithoutIds = prescription.medications.map(med => ({
          name: med.name,
          dosage: med.dosage || '',
          duration: med.duration || '',
          timing: med.timing || { morning: false, afternoon: false, night: false },
          food_instructions: med.food_instructions || '',
          instructions: med.instructions || '',
          dispense_quantity: med.dispense_quantity || ''
        }));
        setNewMedications(medicationsWithoutIds);
      } else {
        setNewMedications([]);
      }

      setIsEditing(id);
    }
  };

  // Helper function to get medication changes (additions, removals, updates)
  const getMedicationChanges = (existingMedications: Medication[], newMedications: Omit<Medication, 'id' | 'medication_id' | 'prescription_id' | 'created_at' | 'updated_at'>[]) => {
    const changes = {
      toAdd: [] as typeof newMedications,
      toRemove: [] as Medication[],
      toUpdate: [] as { existing: Medication, updated: typeof newMedications[0] }[]
    };

    // Create a map of existing medications by a unique key (name + dosage)
    const existingMap = new Map<string, Medication>();
    existingMedications.forEach(med => {
      const key = `${(med.name || '').trim().toLowerCase()}_${(med.dosage || '').trim().toLowerCase()}`;
      existingMap.set(key, med);
    });

    // Create a map of new medications by the same key
    const newMap = new Map<string, typeof newMedications[0]>();
    newMedications.forEach(med => {
      const key = `${(med.name || '').trim().toLowerCase()}_${(med.dosage || '').trim().toLowerCase()}`;
      newMap.set(key, med);
    });

    // Find medications to add (in new but not in existing)
    newMap.forEach((newMed, key) => {
      if (!existingMap.has(key)) {
        changes.toAdd.push(newMed);
      }
    });

    // Find medications to remove (in existing but not in new)
    existingMap.forEach((existingMed, key) => {
      if (!newMap.has(key)) {
        changes.toRemove.push(existingMed);
      }
    });

    // Find medications to update (same name+dosage but other fields changed)
    existingMap.forEach((existingMed, key) => {
      const newMed = newMap.get(key);
      if (newMed) {
        // Check if any other fields have changed
        if (
          (existingMed.duration || '').trim() !== (newMed.duration || '').trim() ||
          (existingMed.food_instructions || '').trim() !== (newMed.food_instructions || '').trim() ||
          (existingMed.instructions || '').trim() !== (newMed.instructions || '').trim() ||
          (existingMed.dispense_quantity || '').trim() !== (newMed.dispense_quantity || '').trim() ||
          existingMed.timing?.morning !== newMed.timing?.morning ||
          existingMed.timing?.afternoon !== newMed.timing?.afternoon ||
          existingMed.timing?.night !== newMed.timing?.night
        ) {
          changes.toUpdate.push({ existing: existingMed, updated: newMed });
        }
      }
    });

    return changes;
  };

  // Handle updating an existing prescription using the new approach
  const handleUpdatePrescription = async () => {
    try {
      if (!isEditing) return;

      // Validate required fields
      if (!newPrescription.diagnosis || !newPrescription.prescribed_by) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in diagnosis and doctor fields.",
          variant: "destructive",
        });
        return;
      }

      if (newMedications.length === 0) {
        toast({
          title: "No Medications",
          description: "Please add at least one medication.",
          variant: "destructive",
        });
        return;
      }

      console.log("1️⃣ Updating prescription:", isEditing);
      console.log("Prescription data:", newPrescription);
      console.log("Medications to update:", newMedications);

      // Ensure we have a valid prescription ID
      if (!isEditing) {
        toast({
          title: "Error",
          description: "Invalid prescription ID. Cannot update prescription.",
          variant: "destructive",
        });
        return;
      }

      // 1️⃣ Update the prescription details
      const updatedPrescription = await updatePrescription(isEditing, newPrescription);

      if (updatedPrescription && updatedPrescription.id) {
        // We need to use the UUID (id) for the foreign key relationship
        const prescriptionIdToUse = updatedPrescription.id;
        console.log("Successfully updated prescription. UUID:", updatedPrescription.id);
        console.log("Using ID for medication relationship:", prescriptionIdToUse);

        // 2️⃣ First, fetch the current prescription to get its medications
        const currentPrescriptions = await getPatientPrescriptions(patientId);
        const currentPrescription = currentPrescriptions.find(p => p.id === isEditing);

        if (currentPrescription) {
          // 3️⃣ Get granular medication changes
          const medicationChanges = getMedicationChanges(currentPrescription.medications || [], newMedications);

          const hasChanges = medicationChanges.toAdd.length > 0 ||
                           medicationChanges.toRemove.length > 0 ||
                           medicationChanges.toUpdate.length > 0;

          if (hasChanges) {
            console.log("Medications have changed, applying granular updates...");
            console.log("Changes:", {
              toAdd: medicationChanges.toAdd.length,
              toRemove: medicationChanges.toRemove.length,
              toUpdate: medicationChanges.toUpdate.length
            });

            // Remove medications that are no longer needed
            for (const med of medicationChanges.toRemove) {
              if (med.id) {
                console.log(`Removing medication: ${med.id} - ${med.name}`);
                try {
                  await removeMedicationFromPrescription(prescriptionIdToUse, med.id, false);
                } catch (error) {
                  console.error(`Error removing medication ${med.id}:`, error);
                }
              }
            }

            // Add new medications
            for (const medication of medicationChanges.toAdd) {
              const sanitizedMedication = {
                name: medication.name.trim(),
                dosage: (medication.dosage || '').trim(),
                duration: (medication.duration || '').trim(),
                timing: medication.timing,
                food_instructions: (medication.food_instructions || '').trim(),
                instructions: (medication.instructions || '').trim(),
                dispense_quantity: (medication.dispense_quantity || '').trim()
              };

              console.log("Adding new medication:", sanitizedMedication);
              try {
                await addMedicationToPrescription(prescriptionIdToUse, sanitizedMedication, false);
              } catch (error) {
                console.error("Error adding medication:", error);
                throw error;
              }
            }

            // Update existing medications (remove and re-add with new details)
            for (const change of medicationChanges.toUpdate) {
              if (change.existing.id) {
                console.log(`Updating medication: ${change.existing.id} - ${change.existing.name}`);
                try {
                  // Remove the old version
                  await removeMedicationFromPrescription(prescriptionIdToUse, change.existing.id, false);

                  // Add the updated version
                  const sanitizedMedication = {
                    name: change.updated.name.trim(),
                    dosage: (change.updated.dosage || '').trim(),
                    duration: (change.updated.duration || '').trim(),
                    timing: change.updated.timing,
                    food_instructions: (change.updated.food_instructions || '').trim(),
                    instructions: (change.updated.instructions || '').trim(),
                    dispense_quantity: (change.updated.dispense_quantity || '').trim()
                  };

                  await addMedicationToPrescription(prescriptionIdToUse, sanitizedMedication, false);
                } catch (error) {
                  console.error(`Error updating medication ${change.existing.id}:`, error);
                }
              }
            }
          } else {
            console.log("Medications have not changed, skipping medication update");
          }

          // 5️⃣ Refresh prescriptions from the database
          console.log("Refreshing prescriptions from database");
          const updatedPrescriptions = await getPatientPrescriptions(patientId);
          console.log("Updated prescriptions:", updatedPrescriptions);

          // Check if medications are properly loaded
          const updatedPrescription = updatedPrescriptions.find(p => p.id === prescriptionIdToUse);
          if (updatedPrescription) {
            console.log("Updated prescription medications:", updatedPrescription.medications);
          }

          setPrescriptions(updatedPrescriptions);

          // 6️⃣ Show success message
          toast({
            title: "Prescription Updated",
            description: "The prescription has been successfully updated.",
          });
        } else {
          console.error("Could not find current prescription with ID:", isEditing);
          toast({
            title: "Update Failed",
            description: "Could not find the prescription to update.",
            variant: "destructive",
          });
        }
      } else {
        // Show error message
        toast({
          title: "Update Failed",
          description: "Failed to update prescription. Please try again.",
          variant: "destructive",
        });
      }

      // Reset form and close
      setNewPrescription(emptyPrescription);
      setNewMedications([]);
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to update prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Cancel adding or editing
  const handleCancel = () => {
    setNewPrescription(emptyPrescription);
    setNewMedications([]);
    setNewMedication({
      name: '',
      dosage: '',
      duration: '',
      timing: {
        morning: false,
        afternoon: false,
        night: false
      },
      food_instructions: '',
      instructions: '',
      dispense_quantity: ''
    });
    setIsAddingNew(false);
    setIsEditing(null);
  };

  // Handle printing a prescription
  const handlePrintPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowPrintDialog(true);
  };

  // Direct print function that takes a prescription as parameter
  const handleDirectPrint = (prescription: Prescription) => {
    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      document.body.appendChild(iframe);

      // Write the prescription content to the iframe
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Could not access iframe document');
      }

      // Write the prescription content with exact letterhead recreation
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription - ${patientName}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: Arial, sans-serif;
                width: 210mm;
                min-height: 297mm;
                background: white;
                color: #333;
              }

              /* Header Section - Two column layout */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 30px 40px 20px 40px;
                background: white;
                min-height: 150px;
              }

              /* Left Block: Doctor's Credentials */
              .doctor-info {
                flex: 1;
                text-align: left;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-self: flex-end;
                margin-bottom: 0px;
              }

              /* Right Block: Clinic Branding with Logo */
              .clinic-branding {
                flex: 1;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 20px;
              }

              .logo-container {
                width: 300px;
                height: 180px;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .dental-metrix-logo {
                width: 100%;
                height: auto;
                max-width: 300px;
                max-height: 180px;
              }

              /* Main Content Area */
              .main-content {
                padding: 30px 40px 20px 40px;
                min-height: 450px;
                background: white;
                position: relative;
              }


              .patient-info {
                margin-bottom: 25px;
                font-size: 14px;
                color: #333;
                line-height: 1.5;
              }

              .patient-info div {
                margin-bottom: 4px;
              }

              .rx-symbol {
                font-size: 32px;
                font-family: serif;
                color: #333;
                margin: 20px 0 15px 0;
                font-weight: bold;
              }

              .medications {
                margin: 0;
                padding: 0;
                list-style: none;
                counter-reset: medication-counter;
              }

              .medication {
                margin-bottom: 10px;
                padding-left: 20px;
                position: relative;
                font-size: 14px;
                color: #333;
              }

              .medication::before {
                content: counter(medication-counter) ".";
                counter-increment: medication-counter;
                position: absolute;
                left: 0;
                font-weight: bold;
                color: #333;
              }

              .medication-name {
                font-weight: bold;
                font-size: 14px;
                color: #333;
                margin-bottom: 2px;
              }

              .medication-details {
                font-size: 12px;
                color: #555;
                line-height: 1.3;
                margin-bottom: 1px;
              }

              .dispense {
                font-weight: bold;
                color: #333;
                font-size: 12px;
              }

              .notes-section {
                margin-top: 20px;
                padding: 15px;
                background: rgba(240, 245, 250, 0.5);
                border-left: 3px solid #00BCD4;
                border-radius: 3px;
                font-size: 13px;
                color: #333;
              }

              /* Services Section */
              .services-section {
                position: absolute;
                bottom: 90px;
                left: 0;
                right: 0;
                background: white;
                padding: 10px 40px;
                text-align: center;
              }

              .services-row {
                font-size: 11px;
                color: #333;
                margin-bottom: 3px;
                line-height: 1.3;
                font-weight: normal;
              }

              /* Footer separator line */
              .footer-separator {
                position: absolute;
                bottom: 70px;
                left: 40px;
                right: 40px;
                height: 3px;
                background: #1976D2;
                z-index: 5;
              }

              /* Footer */
              .footer {
                position: absolute;
                bottom: 20px;
                left: 0;
                right: 0;
                background: white;
                color: #333;
                text-align: center;
                padding: 10px 40px;
                font-size: 11px;
                line-height: 1.3;
              }

              .footer-address {
                margin-bottom: 4px;
                font-weight: normal;
              }

              .footer-contact {
                font-weight: normal;
              }

              .footer-contact .bold {
                font-weight: bold;
              }

              /* Signature Area */
              .signature-area {
                position: absolute;
                bottom: 170px;
                right: 80px;
                text-align: center;
                z-index: 10;
              }

              .signature-line {
                border-bottom: 1px solid #333;
                width: 200px;
                margin: 25px 0 8px 0;
              }

              .signature-name {
                font-weight: bold;
                font-size: 13px;
                color: #333;
              }

              .signature-reg {
                font-size: 11px;
                color: #666;
                margin-top: 3px;
              }

              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .services-section,
                .footer,
                .signature-area,
                .footer-separator {
                  position: fixed;
                }

                /* Hide browser default print headers and footers */
                @page {
                  margin: 0;
                  size: A4;
                }

                /* Additional CSS to ensure clean printing */
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                }
              }

            </style>
          </head>
          <body>
            <!-- Header Section -->
            <div class="header">
              <div class="doctor-info">
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 12px; white-space: nowrap;">Dr. Bhargavi Railkar - Kolhapure</div>
                <div style="font-size: 16px; margin-bottom: 6px;">MDS Prosthodontics & Implantology</div>
                <div style="font-size: 16px; margin-bottom: 6px;">Certification in Maxillofacial Prosthodontics</div>
                <div style="font-size: 16px;">Reg. No.: A 14618</div>
              </div>
              <div class="clinic-branding">
                <div class="logo-container">
                  <img class="dental-metrix-logo" src="/images/dentalmatrix.png" alt="Dental Metrix Logo" />
                </div>
              </div>
            </div>

            <!-- Main Content Area -->
            <div class="main-content">
              <!-- Patient Info -->
              <div class="patient-info">
                <div><strong>Patient:</strong> ${patientName}</div>
                <div><strong>Age:</strong> ${getPatientAgeOrDOB()}</div>
                <div><strong>Date:</strong> ${format(new Date(prescription.date), 'dd/MM/yyyy')}</div>
                ${prescription.diagnosis ? `<div><strong>Diagnosis:</strong> ${prescription.diagnosis}</div>` : ''}
              </div>

              <!-- Rx Symbol -->
              <div class="rx-symbol">℞</div>

              <!-- Medications -->
              ${prescription.medications && prescription.medications.length > 0 ? `
                <ol class="medications">
                  ${prescription.medications.map(med => `
                    <li class="medication">
                      <div class="medication-name">${med.name} - ${med.dosage}</div>
                      <div class="medication-details">
                        Duration: ${med.duration}${
                          med.timing && (med.timing.morning || med.timing.afternoon || med.timing.night)
                            ? `<br>Timing: ${[
                                med.timing.morning ? 'Morning' : '',
                                med.timing.afternoon ? 'Afternoon' : '',
                                med.timing.night ? 'Night' : ''
                              ].filter(Boolean).join(', ')}`
                            : ''
                        }${med.food_instructions ? `<br>Instructions: ${med.food_instructions}` : ''}${
                          med.instructions ? `<br>Notes: ${med.instructions}` : ''
                        }
                      </div>
                      <div class="medication-details dispense">
                        Dispense: ${med.dispense_quantity}
                      </div>
                    </li>
                  `).join('')}
                </ol>
              ` : `
                <p>No medications prescribed</p>
              `}

              <!-- Additional Notes -->
              ${prescription.notes ? `
                <div class="notes-section">
                  <strong>Additional Notes:</strong><br>
                  ${prescription.notes}
                </div>
              ` : ''}
            </div>

            <!-- Services Section -->
            <div class="services-section">
              <div class="services-row"><span style="color:#00BCD4;">I</span> Esthetic Smile Designing <span style="color:#00BCD4;">I</span> Dental Implants <span style="color:#00BCD4;">I</span> Full Mouth Rehabilitation <span style="color:#00BCD4;">I</span> Dental Aligners <span style="color:#00BCD4;">I</span></div>
              <div class="services-row"><span style="color:#00BCD4;">I</span> Teeth Whitening <span style="color:#00BCD4;">I</span> Oral Surgical Procedures <span style="color:#00BCD4;">I</span> Dental Extraction <span style="color:#00BCD4;">I</span> Specialist Children Dentistry <span style="color:#00BCD4;">I</span></div>
              <div class="services-row"><span style="color:#00BCD4;">I</span> Preventive Procedures <span style="color:#00BCD4;">I</span> Gum Surgeries <span style="color:#00BCD4;">I</span> Artificial Eyes Ears Nose & Finger <span style="color:#00BCD4;">I</span></div>
            </div>

            <!-- Footer separator line -->
            <div class="footer-separator"></div>

            <!-- Signature Area -->
            <div class="signature-area">
              <div class="signature-line"></div>
              <div class="signature-name">${prescription.prescribed_by || 'Doctor Name'}</div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-address">Manas, 1st Floor, Lakaki Road, Opp. Hotel Ambience, Model Colony, Shivajinagar, Pune 411 016.</div>
              <div class="footer-contact">T : <span class="bold">+91 91529 51573</span> &nbsp;&nbsp; Time : <span class="bold">10am to 6pm</span></div>
            </div>
          </body>
          </html>
      `);
      doc.close();

      // Wait for the content to load
      setTimeout(() => {
        try {
          // Print the iframe content
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // Remove the iframe after printing (or after a timeout)
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (error) {
          console.error('Error during print:', error);
          document.body.removeChild(iframe);
          alert('There was an error while printing. Please try again.');
        }
      }, 500);
    } catch (error) {
      console.error('Error preparing print document:', error);
      alert('Error preparing prescription for print. Please try again.');
    }
  };

  // For backward compatibility
  const handlePrint = (prescription?: Prescription) => {
    if (prescription) {
      handleDirectPrint(prescription);
    } else if (selectedPrescription) {
      handleDirectPrint(selectedPrescription);
    } else {
      alert('No prescription selected for printing');
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'Completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get patient age or DOB for the prescription receipt
  const getPatientAgeOrDOB = () => {
    try {
      if (patientDOB) {
        return `DOB: ${formatDate(new Date(patientDOB), 'dd/MM/yyyy')}`;
      } else if (patientAge) {
        return `Age: ${patientAge} years`;
      } else {
        return "Age/DOB: Not available";
      }
    } catch (error) {
      console.error('Error formatting patient age/DOB:', error);
      return "Age/DOB: Not available";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Prescriptions</CardTitle>
          {!isAddingNew && !isEditing && hasPermission('patients.create_prescriptions') && (
            <Button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Form for adding or editing prescriptions */}
          {(isAddingNew || isEditing) && (
            <div className="mb-6 p-4 border rounded-md bg-muted/20">
              <h3 className="text-lg font-medium mb-4">
                {isEditing ? "Edit Prescription" : "Create New Prescription"}
              </h3>

              {/* Prescription Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="diagnosis"
                    name="diagnosis"
                    placeholder="e.g., Dental abscess"
                    value={newPrescription.diagnosis}
                    onChange={handlePrescriptionChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prescribedBy">Prescribed By <span className="text-red-500 ml-1">*</span></Label>
                  <select
                    id="prescribed_by"
                    name="prescribed_by"
                    className="w-full h-10 px-3 py-2 border rounded-md"
                    value={newPrescription.prescribed_by}
                    onChange={handlePrescriptionChange}
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.name}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status <span className="text-red-500 ml-1">*</span></Label>
                  <select
                    id="status"
                    name="status"
                    className="w-full h-10 px-3 py-2 border rounded-md"
                    value={newPrescription.status}
                    onChange={handlePrescriptionChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor_reg_no">Doctor Registration No.</Label>
                  <Input
                    id="doctor_reg_no"
                    name="doctor_reg_no"
                    placeholder="e.g., MCI-12345"
                    value={newPrescription.doctor_reg_no}
                    onChange={handlePrescriptionChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional notes or instructions"
                    value={newPrescription.notes}
                    onChange={handlePrescriptionChange}
                    rows={2}
                  />
                </div>
              </div>

              {/* Medications Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">Medications <span className="text-red-500 ml-1">*</span></h4>

                {/* Current Medications List */}
                {newMedications.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Timing</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Dispense Qty</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newMedications.map((med, index) => (
                          <TableRow key={index}>
                            <TableCell>{med.name}</TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.duration}</TableCell>
                            <TableCell>
                              {med.timing && [
                                med.timing.morning ? 'Morning' : '',
                                med.timing.afternoon ? 'Afternoon' : '',
                                med.timing.night ? 'Night' : ''
                              ].filter(Boolean).join(', ')}
                            </TableCell>
                            <TableCell>{med.food_instructions}</TableCell>
                            <TableCell>{med.instructions}</TableCell>
                            <TableCell>{med.dispense_quantity}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMedication(index)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Add Medication Form */}
                <div className="border p-4 rounded-md bg-background shadow-sm">
                  <h5 className="text-sm font-medium mb-4 border-b pb-2">Add Medication</h5>

                  {/* First row - Name and Dosage */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Medicine Name */}
                    <div>
                      <Label htmlFor="medicineName" className="text-xs font-medium mb-1 block">Name <span className="text-red-500 ml-1">*</span></Label>
                      <Combobox
                        options={getUniqueMedicineNames(medicines).map(name => ({
                          value: name,
                          label: name
                        }))}
                        value={newMedication.name || ""}
                        onChange={handleMedicineNameSelect}
                        placeholder="Select a medicine"
                        emptyMessage="No medicines found"
                      />
                    </div>

                    {/* Dosage */}
                    <div>
                      <Label htmlFor="dosage" className="text-xs font-medium mb-1 block">Dosage <span className="text-red-500 ml-1">*</span></Label>
                      <Combobox
                        options={availableDosages.map(dosage => ({
                          value: dosage,
                          label: dosage
                        }))}
                        value={newMedication.dosage || ""}
                        onChange={handleDosageSelect}
                        placeholder="Select dosage"
                        emptyMessage="No dosages available"
                        disabled={availableDosages.length === 0}
                      />
                    </div>
                  </div>

                  {/* Second row - Timing and Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Timing Checkboxes */}
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Timing <span className="text-red-500 ml-1">*</span></Label>
                      <div className="flex space-x-4 border rounded-md p-2 bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="morning"
                            checked={newMedication.timing?.morning}
                            onChange={() => handleTimingChange('morning')}
                            className="mr-1.5 h-4 w-4"
                          />
                          <Label htmlFor="morning" className="text-sm cursor-pointer">Morning</Label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="afternoon"
                            checked={newMedication.timing?.afternoon}
                            onChange={() => handleTimingChange('afternoon')}
                            className="mr-1.5 h-4 w-4"
                          />
                          <Label htmlFor="afternoon" className="text-sm cursor-pointer">Afternoon</Label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="night"
                            checked={newMedication.timing?.night}
                            onChange={() => handleTimingChange('night')}
                            className="mr-1.5 h-4 w-4"
                          />
                          <Label htmlFor="night" className="text-sm cursor-pointer">Night</Label>
                        </div>
                      </div>
                    </div>

                    {/* Food Instructions */}
                    <div>
                      <Label htmlFor="foodInstructions" className="text-xs font-medium mb-1 block">Instructions</Label>
                      <Combobox
                        options={[
                          { value: "After food", label: "After food" },
                          { value: "Before food", label: "Before food" },
                          { value: "With food", label: "With food" },
                          { value: "Empty stomach", label: "Empty stomach" }
                        ]}
                        value={newMedication.food_instructions || ""}
                        onChange={handleFoodInstructionsChange}
                        placeholder="Select instructions"
                        emptyMessage="No instructions available"
                      />
                    </div>
                  </div>

                  {/* Third row - Duration and Dispense Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Duration */}
                    <div>
                      <Label htmlFor="duration" className="text-xs font-medium mb-1 block">Duration <span className="text-red-500 ml-1">*</span></Label>
                      <Input
                        id="duration"
                        name="duration"
                        placeholder="e.g., 7 days"
                        value={newMedication.duration}
                        onChange={handleMedicationChange}
                        className="h-9 text-sm focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Dispense Quantity */}
                    <div>
                      <Label htmlFor="dispenseQuantity" className="text-xs font-medium mb-1 block">Dispense Qty <span className="text-red-500 ml-1">*</span></Label>
                      <Input
                        id="dispenseQuantity"
                        name="dispenseQuantity"
                        placeholder="e.g., 21 tablets"
                        value={newMedication.dispense_quantity}
                        onChange={handleMedicationChange}
                        className="h-9 text-sm focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Fourth row - Notes */}
                  <div className="mb-4">
                    <Label htmlFor="instructions" className="text-xs font-medium mb-1 block">Notes</Label>
                    <Input
                      id="instructions"
                      name="instructions"
                      placeholder="Special notes"
                      value={newMedication.instructions}
                      onChange={handleMedicationChange}
                      className="h-9 text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddMedication}
                    className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Medication
                  </Button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={isEditing ? handleUpdatePrescription : handleSaveNewPrescription}>
                  <Save className="h-4 w-4 mr-1" />
                  {isEditing ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* Tabs for filtering prescriptions */}
          {!isAddingNew && !isEditing && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Table of prescriptions */}
          {!isAddingNew && !isEditing && (
            <>
              {filteredPrescriptions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Medications</TableHead>
                        <TableHead>Prescribed By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrescriptions.map((prescription) => (
                        <TableRow key={prescription.id}>
                          <TableCell>{format(new Date(prescription.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{prescription.diagnosis}</TableCell>
                          <TableCell>
                            {prescription.medications && prescription.medications.length > 0
                              ? prescription.medications.map(med => med.name).join(', ')
                              : 'No medications'}
                          </TableCell>
                          <TableCell>{prescription.prescribed_by}</TableCell>
                          <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {hasPermission('patients.edit_prescriptions') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPrescription(prescription.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Print directly without using state
                                  handleDirectPrint(prescription);
                                }}
                                title="Print directly"
                                className="bg-blue-100 hover:bg-blue-200"
                              >
                                <Printer className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No prescriptions found for this patient.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Print Prescription Dialog */}
      {selectedPrescription && (
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent className="max-w-2xl print:max-w-full print-prescription">
            <DialogHeader>
              <DialogTitle>Prescription</DialogTitle>
            </DialogHeader>

            <div className="p-4 border rounded-md print:border-none print:p-0 prescription-content">
              {/* Clinic Header */}
              <div className="text-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold">{currentClinicInfo.name}</h2>
                <p className="text-sm">{getFullAddress()}</p>
                <p className="text-sm">Phone: {currentClinicInfo.phone}</p>
              </div>

              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <p><strong>Patient:</strong> {patientName}</p>
                  <p><strong>Age/DOB:</strong> {getPatientAgeOrDOB()}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedPrescription.date), 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-right">
                  <p><strong>Doctor:</strong> {selectedPrescription.prescribed_by}</p>
                  <p><strong>Reg. No:</strong> {selectedPrescription.doctor_reg_no || 'N/A'}</p>
                  <p><strong>Diagnosis:</strong> {selectedPrescription.diagnosis}</p>
                </div>
              </div>

              {/* Rx Symbol */}
              <div className="mb-2">
                <span className="text-xl font-serif">Rx</span>
              </div>

              {/* Medications */}
              <div className="mb-4">
                {selectedPrescription.medications && selectedPrescription.medications.length > 0 ? (
                  <ul className="list-decimal pl-5 space-y-2">
                    {selectedPrescription.medications.map(med => (
                      <li key={med.id} className="pl-2">
                        <p className="font-medium text-sm">{med.name} - {med.dosage}</p>
                        <p className="text-xs pl-2">
                          For {med.duration}
                          {med.timing && (med.timing.morning || med.timing.afternoon || med.timing.night) &&
                            ` - Timing: ${[
                              med.timing.morning ? 'Morning' : '',
                              med.timing.afternoon ? 'Afternoon' : '',
                              med.timing.night ? 'Night' : ''
                            ].filter(Boolean).join(', ')}`
                          }
                          {med.food_instructions && ` - ${med.food_instructions}`}
                          {med.instructions && ` - Notes: ${med.instructions}`}
                        </p>
                        <p className="text-xs pl-2 font-medium">
                          Dispense: {med.dispense_quantity}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic">No medications added to this prescription.</p>
                )}
              </div>



              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="mb-4 border-t pt-2">
                  <p className="text-sm"><strong>Notes:</strong></p>
                  <p className="text-xs">{selectedPrescription.notes}</p>
                </div>
              )}

              {/* Signature */}
              <div className="mt-6 pt-4 border-t text-right">
                <div className="mb-6 w-[200px] h-[1px] border-b border-black inline-block"></div>
                <p className="font-medium text-sm">{selectedPrescription.prescribed_by}</p>
              </div>
            </div>

            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPrintDialog(false); // Close the dialog first
                  // Use the direct print function with the selected prescription
                  if (selectedPrescription) {
                    setTimeout(() => handleDirectPrint(selectedPrescription), 100);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PrescriptionComponent;
