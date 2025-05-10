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

  // Form state for new prescription
  const [newPrescription, setNewPrescription] = useState<{
    diagnosis: string;
    notes: string;
    prescribed_by: string;
    status: 'Active' | 'Completed' | 'Cancelled';
    medications: Medication[];
    doctor_reg_no: string;
  }>({
    diagnosis: '',
    notes: '',
    prescribed_by: '',
    status: 'Active',
    medications: [],
    doctor_reg_no: ''
  });

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

    // Add to current medications list
    const medicationToAdd: Medication = {
      id: `temp-${Date.now()}`, // Temporary ID for UI purposes
      ...newMedication
    };

    setNewPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, medicationToAdd]
    }));

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
  const handleRemoveMedication = (medicationId: string) => {
    setNewPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== medicationId)
    }));
  };

  // Handle saving a new prescription
  const handleSaveNewPrescription = async () => {
    try {
      // Validate required fields
      if (!newPrescription.diagnosis || !newPrescription.prescribed_by || newPrescription.medications.length === 0) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields and add at least one medication.",
          variant: "destructive",
        });
        return;
      }

      const { medications } = newPrescription;

      // ✅ STEP 1: Save prescription
      console.log("Saving prescription:", newPrescription);
      const newRecord = await addPrescription(patientId, newPrescription);

      if (newRecord) {
        // Make sure we're using the UUID from the database, not the text ID
        const prescriptionIdToUse = newRecord.id;
        console.log("IMPORTANT: Using prescription UUID for medication links:", prescriptionIdToUse);
        console.log("Prescription text ID (for reference only):", newRecord.prescription_id);

        // ✅ STEP 2: Add medications using the context method
        console.log("Adding medications using context method");

        try {
          for (const medication of medications) {
            // Remove the temporary ID as it's not needed and ensure all string values are trimmed
            const { id, ...medicationWithoutId } = medication;

            // Sanitize all string fields to avoid whitespace issues
            const sanitizedMedication = {
              ...medicationWithoutId,
              name: medicationWithoutId.name.trim(),
              dosage: (medicationWithoutId.dosage || '').trim(),
              duration: (medicationWithoutId.duration || '').trim(),
              food_instructions: (medicationWithoutId.food_instructions || '').trim(),
              instructions: (medicationWithoutId.instructions || '').trim(),
              dispense_quantity: (medicationWithoutId.dispense_quantity || '').trim()
            };

            console.log("Adding medication using context method:", sanitizedMedication);

            // Use the context method which properly handles medicine ID lookup and error handling
            const result = await addMedicationToPrescription(prescriptionIdToUse, sanitizedMedication);

            console.log("Successfully added medication:", result);
          }
        } catch (err) {
          console.error("Error adding medication:", err);

          // Show error to user
          toast({
            title: "Error Adding Medication",
            description: err.message || "Failed to add medication. Please check if the medicine exists in the system.",
            variant: "destructive",
          });

          // Cancel the entire save process
          throw err; // Re-throw to stop the process
        }

        // ✅ STEP 4: Refresh prescriptions from DB
        const updatedPrescriptions = await getPatientPrescriptions(patientId);
        setPrescriptions(updatedPrescriptions);

        // ✅ STEP 5: Reset form
        setNewPrescription({
          diagnosis: '',
          notes: '',
          prescribed_by: '',
          status: 'Active',
          medications: [],
          doctor_reg_no: ''
        });
        setIsAddingNew(false);

        toast({
          title: "Success",
          description: "Prescription and medications saved successfully.",
        });
      }
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
      setNewPrescription({
        diagnosis: prescription.diagnosis,
        notes: prescription.notes || '',
        prescribed_by: prescription.prescribed_by,
        status: prescription.status,
        medications: [...prescription.medications],
        doctor_reg_no: prescription.doctor_reg_no || ''
      });
      setIsEditing(id);
    }
  };

  // Handle updating an existing prescription
  const handleUpdatePrescription = async () => {
    try {
      if (!isEditing) return;

      // Validate required fields
      if (!newPrescription.diagnosis || !newPrescription.prescribed_by || newPrescription.medications.length === 0) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields and add at least one medication.",
          variant: "destructive",
        });
        return;
      }

      // Extract medications before updating prescription
      const { medications } = newPrescription;

      console.log("Updating prescription:", isEditing);
      console.log("Medications to update:", medications);

      // Create a copy without medications for the update
      const prescriptionWithoutMedications = {
        ...newPrescription,
        medications: [] // Clear medications for the update
      };

      // Update the prescription using context
      const updatedPrescription = await updatePrescription(isEditing, prescriptionWithoutMedications);

      if (updatedPrescription) {
        // We need to use the UUID (id) for the foreign key relationship, not the text prescription_id
        const prescriptionIdToUse = updatedPrescription.id;
        console.log("Successfully updated prescription. UUID:", updatedPrescription.id, "Text ID:", updatedPrescription.prescription_id);
        console.log("Using ID for medication relationship:", prescriptionIdToUse);

        // First, we need to fetch the current prescription to get its medications
        const currentPrescriptions = await getPatientPrescriptions(patientId);
        const currentPrescription = currentPrescriptions.find(p => p.id === isEditing);

        if (currentPrescription) {
          // Delete all existing medications
          for (const med of currentPrescription.medications || []) {
            if (med.id) {
              console.log("Removing medication:", med.id);
              // Use the context method for consistent handling and proper fallbacks
              console.log("Using context method to remove medication with ID:", med.id);
              await removeMedicationFromPrescription(prescriptionIdToUse, med.id);
              console.log("Successfully removed medication with ID:", med.id);
            }
          }

          // We'll use the medications directly with the context method
          // No need to prepare them with IDs as the context method will handle that
          console.log("Using medications directly with context method");

          // Use the context method for adding medications
          console.log("Using context method to add medications");

          try {
            // Add all new medications using the context method
            for (const medication of medications) {
              // Sanitize all string fields to avoid whitespace issues
              const sanitizedMedication = {
                ...medication,
                name: medication.name.trim(),
                dosage: (medication.dosage || '').trim(),
                duration: (medication.duration || '').trim(),
                food_instructions: (medication.food_instructions || '').trim(),
                instructions: (medication.instructions || '').trim(),
                dispense_quantity: (medication.dispense_quantity || '').trim()
              };

              console.log("Adding medication using context method:", sanitizedMedication);

              // Use the context method which properly handles medicine ID lookup and error handling
              const result = await addMedicationToPrescription(prescriptionIdToUse, sanitizedMedication);

              console.log("Successfully added medication:", result);
            }
          } catch (err) {
            console.error("Error adding medication:", err);

            // Show error to user
            toast({
              title: "Error Adding Medication",
              description: err.message || "Failed to add medication. Please check if the medicine exists in the system.",
              variant: "destructive",
            });

            // Cancel the entire update process
            throw err; // Re-throw to stop the process
          }

          console.log("All medications processed");

          // Refresh prescriptions from the database to ensure we have the latest data
          console.log("Refreshing prescriptions from database");
          const updatedPrescriptions = await getPatientPrescriptions(patientId);
          setPrescriptions(updatedPrescriptions);
        } else {
          console.error("Could not find current prescription with ID:", isEditing);
        }

        // Wait a moment for database operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch updated prescriptions with a slight delay to ensure database consistency
        console.log("Fetching updated prescriptions after updating");
        const updatedPrescriptions = await getPatientPrescriptions(patientId);
        console.log("Updated prescriptions:", updatedPrescriptions);
        setPrescriptions(updatedPrescriptions);

        // Show success message
        toast({
          title: "Prescription Updated",
          description: "The prescription has been successfully updated.",
        });
      } else {
        // Show error message
        toast({
          title: "Update Failed",
          description: "Failed to update prescription. Please try again.",
          variant: "destructive",
        });
      }

      // Reset form and close
      setNewPrescription({
        diagnosis: '',
        notes: '',
        prescribed_by: '',
        status: 'Active',
        medications: [],
        doctor_reg_no: ''
      });
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
    setNewPrescription({
      diagnosis: '',
      notes: '',
      prescribed_by: '',
      status: 'Active',
      medications: [],
      doctor_reg_no: ''
    });
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

      // Write the prescription content
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription - ${patientName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
              }
              .header h2 {
                margin-bottom: 5px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                margin-bottom: 20px;
              }
              .text-right {
                text-align: right;
              }
              .rx {
                font-size: 20px;
                font-family: serif;
                margin-bottom: 10px;
              }
              .medications {
                margin-left: 20px;
              }
              .medication {
                margin-bottom: 15px;
              }
              .medication-name {
                font-weight: bold;
              }
              .medication-details {
                margin-left: 15px;
                font-size: 0.9em;
              }
              .dispense {
                font-weight: bold;
              }
              .section {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
              }
              .signature {
                margin-top: 60px;
                text-align: right;
              }
              .signature-line {
                margin-bottom: 40px;
                border-bottom: 1px solid #000;
                width: 200px;
                display: inline-block;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${currentClinicInfo.name}</h2>
              <p>${getFullAddress()}</p>
              <p>Phone: ${currentClinicInfo.phone}</p>
            </div>

            <div class="info-grid">
              <div>
                <p><strong>Patient:</strong> ${patientName}</p>
                <p><strong>Age/DOB:</strong> ${getPatientAgeOrDOB()}</p>
                <p><strong>Date:</strong> ${format(new Date(prescription.date), 'dd/MM/yyyy')}</p>
              </div>
              <div class="text-right">
                <p><strong>Doctor:</strong> ${prescription.prescribed_by}</p>
                <p><strong>Reg. No:</strong> ${prescription.doctor_reg_no || 'N/A'}</p>
                <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
              </div>
            </div>

            <div class="rx">Rx</div>

            ${prescription.medications && prescription.medications.length > 0 ? `
              <ol class="medications">
                ${prescription.medications.map(med => `
                  <li class="medication">
                    <div class="medication-name">${med.name} - ${med.dosage}</div>
                    <div class="medication-details">
                      For ${med.duration}
                      ${med.timing && (med.timing.morning || med.timing.afternoon || med.timing.night) ?
                        ` - Timing: ${[
                          med.timing.morning ? 'Morning' : '',
                          med.timing.afternoon ? 'Afternoon' : '',
                          med.timing.night ? 'Night' : ''
                        ].filter(Boolean).join(', ')}` : ''}
                      ${med.food_instructions ? ` - ${med.food_instructions}` : ''}
                      ${med.instructions ? ` - Notes: ${med.instructions}` : ''}
                    </div>
                    <div class="medication-details dispense">
                      Dispense: ${med.dispense_quantity}
                    </div>
                  </li>
                `).join('')}
              </ol>
            ` : `
              <p class="no-medications">No medications added to this prescription.</p>
            `}

            ${prescription.notes ? `
              <div class="section">
                <p><strong>Notes:</strong></p>
                <p>${prescription.notes}</p>
              </div>
            ` : ''}

            <div class="signature">
              <div class="signature-line"></div>
              <p>${prescription.prescribed_by}</p>
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
      }, 100);
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
          {!isAddingNew && !isEditing && (
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
                  <Label htmlFor="diagnosis">Diagnosis *</Label>
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
                  <Label htmlFor="prescribedBy">Prescribed By *</Label>
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
                  <Label htmlFor="status">Status *</Label>
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
                <h4 className="text-md font-medium mb-2">Medications *</h4>

                {/* Current Medications List */}
                {newPrescription.medications.length > 0 && (
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
                        {newPrescription.medications.map((med) => (
                          <TableRow key={med.id}>
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
                                onClick={() => handleRemoveMedication(med.id)}
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
                      <Label htmlFor="medicineName" className="text-xs font-medium mb-1 block">Name *</Label>
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
                      <Label htmlFor="dosage" className="text-xs font-medium mb-1 block">Dosage *</Label>
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
                      <Label className="text-xs font-medium mb-1 block">Timing *</Label>
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
                      <Label htmlFor="duration" className="text-xs font-medium mb-1 block">Duration *</Label>
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
                      <Label htmlFor="dispenseQuantity" className="text-xs font-medium mb-1 block">Dispense Qty *</Label>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPrescription(prescription.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
