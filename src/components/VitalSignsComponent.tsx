import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Plus, Save, X, Trash } from 'lucide-react';
import { VitalSign } from '@/types/vital-signs';
import { useVitalSigns } from '@/contexts/VitalSignsContext';
import { usePermissions } from '@/contexts/PermissionContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Component to display notes with tooltip on hover
const NotesTooltip: React.FC<{ notes: string }> = ({ notes }) => {
  if (!notes) return <span>-</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="max-w-[200px] truncate cursor-help">{notes}</div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[400px] p-4 bg-white text-black border shadow-lg rounded-md">
          <p className="whitespace-pre-wrap break-words">{notes}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface VitalSignsComponentProps {
  patientId: string;
  patientName: string;
}

const VitalSignsComponent: React.FC<VitalSignsComponentProps> = ({ patientId, patientName }) => {
  const { getPatientVitalSigns, addVitalSign, updateVitalSign, deleteVitalSign } = useVitalSigns();
  const { hasPermission } = usePermissions();
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { toast } = useToast();

  // State for confirmation dialogs
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [vitalSignToDelete, setVitalSignToDelete] = useState<string | null>(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);

  // Form state for new vital sign
  const [newVitalSign, setNewVitalSign] = useState<Omit<VitalSign, 'id' | 'patientId' | 'date' | 'recorded_by'>>({
    weight: '',
    blood_pressure: '',
    pulse: '',
    temperature: '',
    respiratory_rate: '',
    notes: ''
    // removed recorded_by field
  });

  // Load vital signs for the patient
  useEffect(() => {
    const fetchVitalSigns = async () => {
      try {
        const patientVitalSigns = await getPatientVitalSigns(patientId);

        // Filter out any records with invalid dates before sorting
        const validVitalSigns = patientVitalSigns.filter(vs =>
          vs.date && !isNaN(new Date(vs.date).getTime())
        );

        // Sort by date (newest first)
        const sortedVitalSigns = [...validVitalSigns].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        setVitalSigns(sortedVitalSigns);
      } catch (error) {
        console.error('Error fetching vital signs:', error);
        toast({
          title: "Error",
          description: "Failed to load vital signs. Please try again.",
          variant: "destructive"
        });
        setVitalSigns([]);
      }
    };

    fetchVitalSigns();
  }, [patientId, getPatientVitalSigns, toast]);

  // Handle input change for new vital sign
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewVitalSign(prev => ({ ...prev, [name]: value }));
  };

  // Open save confirmation dialog
  const handleSaveNewVitalSign = () => {
    // Validate required fields
    if (!newVitalSign.weight || !newVitalSign.blood_pressure || !newVitalSign.pulse ||
        !newVitalSign.temperature || !newVitalSign.respiratory_rate) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Open confirmation dialog
    setIsConfirmSaveOpen(true);
  };

  // Confirm and execute save
  const confirmSaveVitalSign = async () => {
    try {
      // Add new vital sign using context
      const newRecord = await addVitalSign(patientId, newVitalSign);

      // Update local state
      setVitalSigns(prev => [newRecord, ...prev]);

      // Reset form and close
      setNewVitalSign({
        weight: '',
        blood_pressure: '',
        pulse: '',
        temperature: '',
        respiratory_rate: '',
        notes: ''
      });
      setIsAddingNew(false);
      setIsConfirmSaveOpen(false);

      // Show success message
      toast({
        title: "Vital Signs Recorded",
        description: "The vital signs have been successfully recorded.",
      });
    } catch (error) {
      console.error('Error adding vital signs:', error);
      toast({
        title: "Error",
        description: "Failed to add vital signs. Please try again.",
        variant: "destructive"
      });
      setIsConfirmSaveOpen(false);
    }
  };

  // Handle editing an existing vital sign
  const handleEditVitalSign = (id: string) => {
    const vitalSign = vitalSigns.find(vs => vs.id === id);
    if (vitalSign) {
      setNewVitalSign({
        weight: vitalSign.weight,
        blood_pressure: vitalSign.blood_pressure,
        pulse: vitalSign.pulse,
        temperature: vitalSign.temperature,
        respiratory_rate: vitalSign.respiratory_rate,
        notes: vitalSign.notes || ''
      });
      setIsEditing(id);
    }
  };

  // Open update confirmation dialog
  const handleUpdateVitalSign = () => {
    if (!isEditing) return;

    // Validate required fields
    if (!newVitalSign.weight || !newVitalSign.blood_pressure || !newVitalSign.pulse ||
        !newVitalSign.temperature || !newVitalSign.respiratory_rate) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Open confirmation dialog
    setIsConfirmUpdateOpen(true);
  };

  // Confirm and execute update
  const confirmUpdateVitalSign = async () => {
    if (!isEditing) return;

    try {
      // Update the vital sign using context
      const updatedVitalSign = await updateVitalSign(isEditing, newVitalSign);

      if (updatedVitalSign) {
        // Update local state
        setVitalSigns(prev => prev.map(vs =>
          vs.id === isEditing
            ? updatedVitalSign
            : vs
        ));

        // Show success message
        toast({
          title: "Vital Signs Updated",
          description: "The vital signs have been successfully updated.",
        });
      } else {
        // Show error message
        toast({
          title: "Update Failed",
          description: "Failed to update vital signs. Please try again.",
          variant: "destructive",
        });
      }

      // Reset form and close
      setNewVitalSign({
        weight: '',
        blood_pressure: '',
        pulse: '',
        temperature: '',
        respiratory_rate: '',
        notes: ''
      });
      setIsEditing(null);
      setIsConfirmUpdateOpen(false);
    } catch (error) {
      console.error('Error updating vital signs:', error);
      toast({
        title: "Error",
        description: "Failed to update vital signs. Please try again.",
        variant: "destructive"
      });
      setIsConfirmUpdateOpen(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteVitalSign = (id: string) => {
    setVitalSignToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  // Confirm and execute deletion
  const confirmDeleteVitalSign = async () => {
    if (!vitalSignToDelete) return;

    try {
      // Delete the vital sign using context
      const success = await deleteVitalSign(vitalSignToDelete);

      if (success) {
        // Update local state by removing the deleted record
        setVitalSigns(prev => prev.filter(vs => vs.id !== vitalSignToDelete));

        // Show success message
        toast({
          title: "Record Deleted",
          description: "The vital sign record has been successfully deleted.",
        });

        // Close the dialog and reset state
        setIsConfirmDeleteOpen(false);
        setVitalSignToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting vital sign:', error);
      toast({
        title: "Error",
        description: "Failed to delete vital sign record. Please try again.",
        variant: "destructive"
      });

      // Close the dialog but keep the ID in case user wants to retry
      setIsConfirmDeleteOpen(false);
    }
  };

  // Cancel adding or editing
  const handleCancel = () => {
    setNewVitalSign({
      weight: '',
      blood_pressure: '',
      pulse: '',
      temperature: '',
      respiratory_rate: '',
      notes: ''
    });
    setIsAddingNew(false);
    setIsEditing(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Vital Signs</CardTitle>
          {!isAddingNew && !isEditing && hasPermission('patients.create_vital_signs') && (
            <Button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Record Vital Signs
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Form for adding or editing vital signs */}
          {(isAddingNew || isEditing) && (
            <div className="mb-6 p-4 border rounded-md bg-muted/20">
              <h3 className="text-lg font-medium mb-4">
                {isEditing ? "Edit Vital Signs" : "Record New Vital Signs"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="weight"
                    name="weight"
                    placeholder="e.g., 70"
                    value={newVitalSign.weight}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_pressure">Blood Pressure (mmHg) <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="blood_pressure"
                    name="blood_pressure"
                    placeholder="e.g., 120/80"
                    value={newVitalSign.blood_pressure}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse">Pulse (bpm) <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="pulse"
                    name="pulse"
                    placeholder="e.g., 72"
                    value={newVitalSign.pulse}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C) <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="temperature"
                    name="temperature"
                    placeholder="e.g., 36.8"
                    value={newVitalSign.temperature}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="respiratory_rate">Respiratory Rate (breaths/min) <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="respiratory_rate"
                    name="respiratory_rate"
                    placeholder="e.g., 16"
                    value={newVitalSign.respiratory_rate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* Removed Recorded By field */}
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional notes"
                    value={newVitalSign.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="resize-y"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={isEditing ? handleUpdateVitalSign : handleSaveNewVitalSign}>
                  <Save className="h-4 w-4 mr-1" />
                  {isEditing ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* Table of vital signs */}
          {vitalSigns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>BP (mmHg)</TableHead>
                    <TableHead>Pulse (bpm)</TableHead>
                    <TableHead>Temp (°C)</TableHead>
                    <TableHead>Resp Rate (breaths/min)</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitalSigns.map((vs) => (
                    <TableRow key={vs.id}>
                      <TableCell>
                        {vs.date && !isNaN(new Date(vs.date).getTime())
                          ? format(new Date(vs.date), 'dd/MM/yyyy HH:mm')
                          : 'Invalid date'}
                      </TableCell>
                      <TableCell>{vs.weight}</TableCell>
                      <TableCell>{vs.blood_pressure}</TableCell>
                      <TableCell>{vs.pulse}</TableCell>
                      <TableCell>{vs.temperature}</TableCell>
                      <TableCell>{vs.respiratory_rate}</TableCell>
                      <TableCell>
                        <NotesTooltip notes={vs.notes || ''} />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {hasPermission('patients.edit_vital_signs') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVitalSign(vs.id)}
                              disabled={isAddingNew || isEditing !== null}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('patients.delete_vital_signs') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVitalSign(vs.id)}
                              disabled={isAddingNew || isEditing !== null}
                              title="Delete"
                              className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No vital signs recorded for this patient.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Confirmation Dialog */}
      <Dialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Save</DialogTitle>
            <DialogDescription>
              Are you sure you want to save these vital sign records?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You are about to save the following vital signs:
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">Weight:</span> {newVitalSign.weight} kg</p>
              <p><span className="font-medium">Blood Pressure:</span> {newVitalSign.blood_pressure} mmHg</p>
              <p><span className="font-medium">Pulse:</span> {newVitalSign.pulse} bpm</p>
              <p><span className="font-medium">Temperature:</span> {newVitalSign.temperature} °C</p>
              <p><span className="font-medium">Respiratory Rate:</span> {newVitalSign.respiratory_rate} breaths/min</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSaveVitalSign}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Confirmation Dialog */}
      <Dialog open={isConfirmUpdateOpen} onOpenChange={setIsConfirmUpdateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update this vital sign record?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You are about to update the vital signs to:
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">Weight:</span> {newVitalSign.weight} kg</p>
              <p><span className="font-medium">Blood Pressure:</span> {newVitalSign.blood_pressure} mmHg</p>
              <p><span className="font-medium">Pulse:</span> {newVitalSign.pulse} bpm</p>
              <p><span className="font-medium">Temperature:</span> {newVitalSign.temperature} °C</p>
              <p><span className="font-medium">Respiratory Rate:</span> {newVitalSign.respiratory_rate} breaths/min</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUpdateVitalSign}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vital sign record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {vitalSignToDelete && (
              <p className="text-sm text-muted-foreground">
                You are about to delete the vital sign record from{' '}
                {vitalSigns.find(vs => vs.id === vitalSignToDelete)?.date &&
                 !isNaN(new Date(vitalSigns.find(vs => vs.id === vitalSignToDelete)?.date || '').getTime()) ?
                  format(new Date(vitalSigns.find(vs => vs.id === vitalSignToDelete)?.date || ''), 'dd/MM/yyyy HH:mm') :
                  'unknown date'}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteVitalSign}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VitalSignsComponent;
