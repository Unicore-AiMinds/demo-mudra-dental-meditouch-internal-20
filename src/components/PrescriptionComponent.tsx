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
}

const PrescriptionComponent: React.FC<PrescriptionComponentProps> = ({ patientId, patientName }) => {
  const { 
    getPatientPrescriptions, 
    addPrescription, 
    updatePrescription,
    addMedicationToPrescription,
    removeMedicationFromPrescription
  } = usePrescriptions();
  
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
  }>({
    diagnosis: '',
    notes: '',
    prescribedBy: '',
    status: 'Active',
    medications: []
  });

  // Form state for new medication
  const [newMedication, setNewMedication] = useState<Omit<Medication, 'id'>>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  // Load prescriptions for the patient
  useEffect(() => {
    const patientPrescriptions = getPatientPrescriptions(patientId);
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
    setNewMedication(prev => ({ ...prev, [name]: value }));
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
      instructions: ''
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
    if (!newPrescription.diagnosis || !newPrescription.prescribedBy || newPrescription.medications.length === 0) {
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
      medications: []
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
        medications: [...prescription.medications]
      });
      setIsEditing(id);
    }
  };

  // Handle updating an existing prescription
  const handleUpdatePrescription = () => {
    if (!isEditing) return;

    // Validate required fields
    if (!newPrescription.diagnosis || !newPrescription.prescribedBy || newPrescription.medications.length === 0) {
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
      medications: []
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
      medications: []
    });
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setIsAddingNew(false);
    setIsEditing(null);
  };

  // Handle printing a prescription
  const handlePrintPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowPrintDialog(true);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Prescriptions</CardTitle>
          {!isAddingNew && !isEditing && (
            <Button 
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
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
                                onClick={() => handlePrintPrescription(prescription)}
                              >
                                <Printer className="h-4 w-4" />
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Prescription</DialogTitle>
            </DialogHeader>
            
            <div className="p-4 border rounded-md">
              {/* Clinic Header */}
              <div className="text-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold">Dental Metrix Clinic</h2>
                <p>123 Healthcare Street, Mumbai, India</p>
                <p>Phone: +91 9876543210 | Email: info@dentalmetrix.com</p>
              </div>
              
              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>Patient:</strong> {patientName}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedPrescription.date), 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-right">
                  <p><strong>Doctor:</strong> {selectedPrescription.prescribedBy}</p>
                  <p><strong>Diagnosis:</strong> {selectedPrescription.diagnosis}</p>
                </div>
              </div>
              
              {/* Rx Symbol */}
              <div className="mb-4">
                <span className="text-2xl font-serif">Rx</span>
              </div>
              
              {/* Medications */}
              <div className="mb-6">
                <ul className="list-decimal pl-5 space-y-4">
                  {selectedPrescription.medications.map((med, index) => (
                    <li key={med.id} className="pl-2">
                      <p className="font-medium">{med.name} - {med.dosage}</p>
                      <p className="text-sm pl-4">
                        {med.frequency}, for {med.duration}
                        {med.instructions && ` (${med.instructions})`}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="mb-6 border-t pt-4">
                  <p><strong>Notes:</strong></p>
                  <p>{selectedPrescription.notes}</p>
                </div>
              )}
              
              {/* Signature */}
              <div className="mt-10 pt-6 border-t text-right">
                <p className="mb-10">Signature</p>
                <p className="font-medium">{selectedPrescription.prescribedBy}</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>
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
