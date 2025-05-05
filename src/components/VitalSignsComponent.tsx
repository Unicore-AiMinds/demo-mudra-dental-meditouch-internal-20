import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Save, X } from 'lucide-react';
import { VitalSign } from '@/types/vital-signs';
import { useVitalSigns } from '@/contexts/VitalSignsContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const { getPatientVitalSigns, addVitalSign, updateVitalSign } = useVitalSigns();
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state for new vital sign
  const [newVitalSign, setNewVitalSign] = useState<Omit<VitalSign, 'id' | 'patientId' | 'date'>>({
    weight: '',
    bloodPressure: '',
    pulse: '',
    temperature: '',
    respiratoryRate: '',
    notes: '',
    recordedBy: ''
  });

  // Load vital signs for the patient
  useEffect(() => {
    const patientVitalSigns = getPatientVitalSigns(patientId);
    setVitalSigns(patientVitalSigns.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  }, [patientId, getPatientVitalSigns]);

  // Handle input change for new vital sign
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewVitalSign(prev => ({ ...prev, [name]: value }));
  };

  // Handle saving a new vital sign
  const handleSaveNewVitalSign = () => {
    // Validate required fields
    if (!newVitalSign.weight || !newVitalSign.bloodPressure || !newVitalSign.pulse ||
        !newVitalSign.temperature || !newVitalSign.respiratoryRate || !newVitalSign.recordedBy) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Add new vital sign using context
    const newRecord = addVitalSign(patientId, newVitalSign);

    // Update local state
    setVitalSigns(prev => [newRecord, ...prev]);

    // Reset form and close
    setNewVitalSign({
      weight: '',
      bloodPressure: '',
      pulse: '',
      temperature: '',
      respiratoryRate: '',
      notes: '',
      recordedBy: ''
    });
    setIsAddingNew(false);

    // Show success message
    toast({
      title: "Vital Signs Recorded",
      description: "The vital signs have been successfully recorded.",
    });
  };

  // Handle editing an existing vital sign
  const handleEditVitalSign = (id: string) => {
    const vitalSign = vitalSigns.find(vs => vs.id === id);
    if (vitalSign) {
      setNewVitalSign({
        weight: vitalSign.weight,
        bloodPressure: vitalSign.bloodPressure,
        pulse: vitalSign.pulse,
        temperature: vitalSign.temperature,
        respiratoryRate: vitalSign.respiratoryRate,
        notes: vitalSign.notes || '',
        recordedBy: vitalSign.recordedBy
      });
      setIsEditing(id);
    }
  };

  // Handle updating an existing vital sign
  const handleUpdateVitalSign = () => {
    if (!isEditing) return;

    // Validate required fields
    if (!newVitalSign.weight || !newVitalSign.bloodPressure || !newVitalSign.pulse ||
        !newVitalSign.temperature || !newVitalSign.respiratoryRate || !newVitalSign.recordedBy) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Update the vital sign using context
    const updatedVitalSign = updateVitalSign(isEditing, newVitalSign);

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
      bloodPressure: '',
      pulse: '',
      temperature: '',
      respiratoryRate: '',
      notes: '',
      recordedBy: ''
    });
    setIsEditing(null);
  };

  // Cancel adding or editing
  const handleCancel = () => {
    setNewVitalSign({
      weight: '',
      bloodPressure: '',
      pulse: '',
      temperature: '',
      respiratoryRate: '',
      notes: '',
      recordedBy: ''
    });
    setIsAddingNew(false);
    setIsEditing(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Vital Signs</CardTitle>
          {!isAddingNew && !isEditing && (
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
                  <Label htmlFor="weight">Weight (kg) *</Label>
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
                  <Label htmlFor="bloodPressure">Blood Pressure (mmHg) *</Label>
                  <Input
                    id="bloodPressure"
                    name="bloodPressure"
                    placeholder="e.g., 120/80"
                    value={newVitalSign.bloodPressure}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse">Pulse (bpm) *</Label>
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
                  <Label htmlFor="temperature">Temperature (°C) *</Label>
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
                  <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min) *</Label>
                  <Input
                    id="respiratoryRate"
                    name="respiratoryRate"
                    placeholder="e.g., 16"
                    value={newVitalSign.respiratoryRate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recordedBy">Recorded By *</Label>
                  <Input
                    id="recordedBy"
                    name="recordedBy"
                    placeholder="e.g., Dr. Smith"
                    value={newVitalSign.recordedBy}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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
                    <TableHead>Recorded By</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitalSigns.map((vs) => (
                    <TableRow key={vs.id}>
                      <TableCell>{format(new Date(vs.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>{vs.weight}</TableCell>
                      <TableCell>{vs.bloodPressure}</TableCell>
                      <TableCell>{vs.pulse}</TableCell>
                      <TableCell>{vs.temperature}</TableCell>
                      <TableCell>{vs.respiratoryRate}</TableCell>
                      <TableCell>{vs.recordedBy}</TableCell>
                      <TableCell>
                        <NotesTooltip notes={vs.notes || ''} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVitalSign(vs.id)}
                          disabled={isAddingNew || isEditing !== null}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
    </div>
  );
};

export default VitalSignsComponent;
