import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Save, X, Trash, FileText, Printer } from 'lucide-react';
import { Prescription, Medication } from '@/types/prescriptions';
import { usePrescriptions } from '@/contexts/PrescriptionContext';
import { useClinicInfo } from '@/contexts/ClinicInfoContext';
import { format as formatDate } from 'date-fns';
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

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const { toast } = useToast();

  // Form state for new prescription
  const [newPrescription, setNewPrescription] = useState<{
    diagnosis: string;
    notes: string;
    prescribedBy: string;
    status: 'Active' | 'Completed' | 'Cancelled';
    medications: Medication[];
    doctorRegNo: string;
  }>({
    diagnosis: '',
    notes: '',
    prescribedBy: '',
    status: 'Active',
    medications: [],
    doctorRegNo: ''
  });

  // Form state for new medication
  const [newMedication, setNewMedication] = useState<Omit<Medication, 'id'>>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    dispenseQuantity: ''
  });

  // Load prescriptions for the patient
  useEffect(() => {
    console.log('Loading prescriptions for patient ID:', patientId);
    const patientPrescriptions = getPatientPrescriptions(patientId);
    console.log('Found prescriptions:', patientPrescriptions);
    setPrescriptions(patientPrescriptions.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  }, [patientId, getPatientPrescriptions]);

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

  // Handle input change for new medication
  const handleMedicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Update the medication state
    setNewMedication(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate dispense quantity if frequency and duration are set
      if ((name === 'frequency' || name === 'duration') && updated.frequency && updated.duration) {
        try {
          // Extract numeric values from frequency (e.g., "3 times daily" -> 3)
          const frequencyMatch = updated.frequency.match(/(\d+)/);
          const frequencyNum = frequencyMatch ? parseInt(frequencyMatch[0], 10) : 0;

          // Extract numeric values from duration (e.g., "7 days" -> 7)
          const durationMatch = updated.duration.match(/(\d+)/);
          const durationNum = durationMatch ? parseInt(durationMatch[0], 10) : 0;

          // Calculate total quantity if both values are valid numbers
          if (frequencyNum > 0 && durationNum > 0) {
            const total = frequencyNum * durationNum;
            // Format as just the total number of tablets
            updated.dispenseQuantity = `${total} tablets`;
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
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required medication fields.",
        variant: "destructive",
      });
      return;
    }

    // Auto-calculate dispense quantity if not already set
    if (!newMedication.dispenseQuantity) {
      try {
        // Extract numeric values from frequency (e.g., "3 times daily" -> 3)
        const frequencyMatch = newMedication.frequency.match(/(\d+)/);
        const frequencyNum = frequencyMatch ? parseInt(frequencyMatch[0], 10) : 0;

        // Extract numeric values from duration (e.g., "7 days" -> 7)
        const durationMatch = newMedication.duration.match(/(\d+)/);
        const durationNum = durationMatch ? parseInt(durationMatch[0], 10) : 0;

        // Calculate total quantity if both values are valid numbers
        if (frequencyNum > 0 && durationNum > 0) {
          const total = frequencyNum * durationNum;
          // Format as just the total number of tablets
          setNewMedication(prev => ({
            ...prev,
            dispenseQuantity: `${total} tablets`
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
      frequency: '',
      duration: '',
      instructions: '',
      dispenseQuantity: ''
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
  const handleSaveNewPrescription = () => {
    // Validate required fields
    if (!newPrescription.diagnosis || !newPrescription.prescribedBy || !newPrescription.doctorRegNo || newPrescription.medications.length === 0) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields and add at least one medication.",
        variant: "destructive",
      });
      return;
    }

    // Add new prescription using context
    const newRecord = addPrescription(patientId, newPrescription);

    // Update local state
    setPrescriptions(prev => [newRecord, ...prev]);

    // Reset form and close
    setNewPrescription({
      diagnosis: '',
      notes: '',
      prescribedBy: '',
      status: 'Active',
      medications: [],
      doctorRegNo: ''
    });
    setIsAddingNew(false);

    // Show success message
    toast({
      title: "Prescription Created",
      description: "The prescription has been successfully created.",
    });
  };

  // Handle editing an existing prescription
  const handleEditPrescription = (id: string) => {
    const prescription = prescriptions.find(p => p.id === id);
    if (prescription) {
      setNewPrescription({
        diagnosis: prescription.diagnosis,
        notes: prescription.notes || '',
        prescribedBy: prescription.prescribedBy,
        status: prescription.status,
        medications: [...prescription.medications],
        doctorRegNo: prescription.doctorRegNo || ''
      });
      setIsEditing(id);
    }
  };

  // Handle updating an existing prescription
  const handleUpdatePrescription = () => {
    if (!isEditing) return;

    // Validate required fields
    if (!newPrescription.diagnosis || !newPrescription.prescribedBy || !newPrescription.doctorRegNo || newPrescription.medications.length === 0) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields and add at least one medication.",
        variant: "destructive",
      });
      return;
    }

    // Update the prescription using context
    const updatedPrescription = updatePrescription(isEditing, newPrescription);

    if (updatedPrescription) {
      // Update local state
      setPrescriptions(prev => prev.map(p =>
        p.id === isEditing
          ? updatedPrescription
          : p
      ));

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
      prescribedBy: '',
      status: 'Active',
      medications: [],
      doctorRegNo: ''
    });
    setIsEditing(null);
  };

  // Cancel adding or editing
  const handleCancel = () => {
    setNewPrescription({
      diagnosis: '',
      notes: '',
      prescribedBy: '',
      status: 'Active',
      medications: [],
      doctorRegNo: ''
    });
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      dispenseQuantity: ''
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
                <p><strong>Doctor:</strong> ${prescription.prescribedBy}</p>
                <p><strong>Reg. No:</strong> ${prescription.doctorRegNo || 'N/A'}</p>
                <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
              </div>
            </div>

            <div class="rx">Rx</div>

            <ol class="medications">
              ${prescription.medications.map(med => `
                <li class="medication">
                  <div class="medication-name">${med.name} - ${med.dosage}</div>
                  <div class="medication-details">
                    ${med.frequency}, for ${med.duration}
                    ${med.instructions ? ` (${med.instructions})` : ''}
                  </div>
                  <div class="medication-details dispense">
                    Dispense: ${med.dispenseQuantity}
                  </div>
                </li>
              `).join('')}
            </ol>

            ${prescription.notes ? `
              <div class="section">
                <p><strong>Notes:</strong></p>
                <p>${prescription.notes}</p>
              </div>
            ` : ''}

            <div class="signature">
              <div class="signature-line"></div>
              <p>${prescription.prescribedBy}</p>
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
                  <Input
                    id="prescribedBy"
                    name="prescribedBy"
                    placeholder="e.g., Dr. Smith"
                    value={newPrescription.prescribedBy}
                    onChange={handlePrescriptionChange}
                    required
                  />
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
                  <Label htmlFor="doctorRegNo">Doctor Registration No. *</Label>
                  <Input
                    id="doctorRegNo"
                    name="doctorRegNo"
                    placeholder="e.g., MCI-12345"
                    value={newPrescription.doctorRegNo}
                    onChange={handlePrescriptionChange}
                    required
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
                          <TableHead>Frequency</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Dispense Qty</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newPrescription.medications.map((med) => (
                          <TableRow key={med.id}>
                            <TableCell>{med.name}</TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.frequency}</TableCell>
                            <TableCell>{med.duration}</TableCell>
                            <TableCell>{med.dispenseQuantity}</TableCell>
                            <TableCell>{med.instructions}</TableCell>
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
                <div className="border p-3 rounded-md bg-background">
                  <h5 className="text-sm font-medium mb-2">Add Medication</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
                    <div>
                      <Label htmlFor="name" className="text-xs">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Medication name"
                        value={newMedication.name}
                        onChange={handleMedicationChange}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosage" className="text-xs">Dosage *</Label>
                      <Input
                        id="dosage"
                        name="dosage"
                        placeholder="e.g., 500mg"
                        value={newMedication.dosage}
                        onChange={handleMedicationChange}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frequency" className="text-xs">Frequency *</Label>
                      <Input
                        id="frequency"
                        name="frequency"
                        placeholder="e.g., 3 times daily"
                        value={newMedication.frequency}
                        onChange={handleMedicationChange}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration" className="text-xs">Duration *</Label>
                      <Input
                        id="duration"
                        name="duration"
                        placeholder="e.g., 7 days"
                        value={newMedication.duration}
                        onChange={handleMedicationChange}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dispenseQuantity" className="text-xs">Dispense Qty *</Label>
                      <Input
                        id="dispenseQuantity"
                        name="dispenseQuantity"
                        placeholder="e.g., 21 tablets"
                        value={newMedication.dispenseQuantity}
                        onChange={handleMedicationChange}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instructions" className="text-xs">Instructions</Label>
                      <Input
                        id="instructions"
                        name="instructions"
                        placeholder="Special instructions"
                        value={newMedication.instructions}
                        onChange={handleMedicationChange}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddMedication}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Medication
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
                            {prescription.medications.map(med => med.name).join(', ')}
                          </TableCell>
                          <TableCell>{prescription.prescribedBy}</TableCell>
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
                  <p><strong>Doctor:</strong> {selectedPrescription.prescribedBy}</p>
                  <p><strong>Reg. No:</strong> {selectedPrescription.doctorRegNo}</p>
                  <p><strong>Diagnosis:</strong> {selectedPrescription.diagnosis}</p>
                </div>
              </div>

              {/* Rx Symbol */}
              <div className="mb-2">
                <span className="text-xl font-serif">Rx</span>
              </div>

              {/* Medications */}
              <div className="mb-4">
                <ul className="list-decimal pl-5 space-y-2">
                  {selectedPrescription.medications.map(med => (
                    <li key={med.id} className="pl-2">
                      <p className="font-medium text-sm">{med.name} - {med.dosage}</p>
                      <p className="text-xs pl-2">
                        {med.frequency}, for {med.duration}
                        {med.instructions && ` (${med.instructions})`}
                      </p>
                      <p className="text-xs pl-2 font-medium">
                        Dispense: {med.dispenseQuantity}
                      </p>
                    </li>
                  ))}
                </ul>
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
                <p className="font-medium text-sm">{selectedPrescription.prescribedBy}</p>
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
