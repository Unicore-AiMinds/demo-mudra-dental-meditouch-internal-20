import React, { useState } from 'react';
import { useLabWorkTypes, LabWorkType } from '@/contexts/LabWorkTypesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const LabWorkTypesTab: React.FC = () => {
  const { labWorkTypes, isLoading, addLabWorkType, updateLabWorkType, deleteLabWorkType, refreshLabWorkTypes } = useLabWorkTypes();
  const { toast } = useToast();

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State for form fields
  const [name, setName] = useState('');
  const [turnaroundDuration, setTurnaroundDuration] = useState<number | ''>('');
  const [turnaroundUnit, setTurnaroundUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [editingLabWorkType, setEditingLabWorkType] = useState<LabWorkType | null>(null);

  // Reset form fields
  const resetForm = () => {
    setName('');
    setTurnaroundDuration('');
    setTurnaroundUnit('days');
    setEditingLabWorkType(null);
  };

  // Handle opening the edit dialog
  const handleEdit = (labWorkType: LabWorkType) => {
    setEditingLabWorkType(labWorkType);
    setName(labWorkType.name);
    setTurnaroundDuration(labWorkType.turnaround_duration);
    setTurnaroundUnit(labWorkType.turnaround_unit);
    setIsEditDialogOpen(true);
  };

  // Format turnaround time for display
  const formatTurnaround = (duration: number, unit: string): string => {
    return `${duration} ${unit}${duration !== 1 ? 's' : ''}`;
  };

  // Handle adding a new lab work type
  const handleAddLabWorkType = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Work type name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!turnaroundDuration || turnaroundDuration === '' || Number(turnaroundDuration) <= 0) {
      toast({
        title: "Error",
        description: "Turnaround duration must be a positive number.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addLabWorkType({
        name,
        turnaround_duration: Number(turnaroundDuration),
        turnaround_unit: turnaroundUnit,
      });
      setIsAddDialogOpen(false);
      resetForm();
      await refreshLabWorkTypes();
    } catch (error) {
      console.error('Error adding lab work type:', error);
      toast({
        title: "Error",
        description: "Failed to add lab work type. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle updating a lab work type
  const handleUpdateLabWorkType = async () => {
    if (!editingLabWorkType) return;

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Work type name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!turnaroundDuration || turnaroundDuration === '' || Number(turnaroundDuration) <= 0) {
      toast({
        title: "Error",
        description: "Turnaround duration must be a positive number.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateLabWorkType(editingLabWorkType.id, {
        name,
        turnaround_duration: Number(turnaroundDuration),
        turnaround_unit: turnaroundUnit,
      });
      setIsEditDialogOpen(false);
      setIsConfirmDialogOpen(false);
      resetForm();
      await refreshLabWorkTypes();
    } catch (error) {
      console.error('Error updating lab work type:', error);
      toast({
        title: "Error",
        description: "Failed to update lab work type. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle deleting a lab work type
  const handleDeleteLabWorkType = async () => {
    if (!editingLabWorkType) return;

    try {
      await deleteLabWorkType(editingLabWorkType.id);
      setIsDeleteDialogOpen(false);
      resetForm();
      await refreshLabWorkTypes();
    } catch (error) {
      console.error('Error deleting lab work type:', error);
      toast({
        title: "Error",
        description: "Failed to delete lab work type. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Manage Lab Work Types
          </CardTitle>
          <CardDescription>
            Add and manage types of lab work for Dental Metrix Clinic
          </CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Work Type
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading lab work types...</p>
          </div>
        ) : labWorkTypes.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No lab work types found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new lab work type to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Type Name</TableHead>
                <TableHead>Turnaround Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labWorkTypes.map((labWorkType) => (
                <TableRow key={labWorkType.id}>
                  <TableCell className="font-medium">{labWorkType.name}</TableCell>
                  <TableCell>{formatTurnaround(labWorkType.turnaround_duration, labWorkType.turnaround_unit)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(labWorkType)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setEditingLabWorkType(labWorkType);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add Lab Work Type Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lab Work Type</DialogTitle>
            <DialogDescription>
              Enter the details for the new lab work type. Fields marked with an asterisk (*) are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workTypeName" className="flex items-center">
                  Work Type Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="workTypeName"
                  placeholder="e.g., PFM Crown"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="turnaroundDuration" className="flex items-center">
                    Duration <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="turnaroundDuration"
                    type="number"
                    min="1"
                    placeholder="e.g., 3"
                    value={turnaroundDuration}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setTurnaroundDuration('');
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          setTurnaroundDuration(numValue);
                        }
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turnaroundUnit" className="flex items-center">
                    Unit <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={turnaroundUnit}
                    onValueChange={(value) => setTurnaroundUnit(value as 'days' | 'weeks' | 'months')}
                    required
                  >
                    <SelectTrigger id="turnaroundUnit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button className="bg-dental-primary hover:bg-dental-dark" onClick={handleAddLabWorkType}>
              Add Work Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lab Work Type Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Work Type</DialogTitle>
            <DialogDescription>
              Update lab work type information. Fields marked with an asterisk (*) are required.
            </DialogDescription>
          </DialogHeader>
          {editingLabWorkType && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editWorkTypeName" className="flex items-center">
                    Work Type Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="editWorkTypeName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editTurnaroundDuration" className="flex items-center">
                      Duration <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="editTurnaroundDuration"
                      type="number"
                      min="1"
                      value={turnaroundDuration}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setTurnaroundDuration('');
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue > 0) {
                            setTurnaroundDuration(numValue);
                          }
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editTurnaroundUnit" className="flex items-center">
                      Unit <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={turnaroundUnit}
                      onValueChange={(value) => setTurnaroundUnit(value as 'days' | 'weeks' | 'months')}
                      required
                    >
                      <SelectTrigger id="editTurnaroundUnit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button className="bg-dental-primary hover:bg-dental-dark" onClick={handleUpdateLabWorkType}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lab work type? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingLabWorkType && (
            <div className="py-4">
              <p className="font-medium">{editingLabWorkType.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatTurnaround(editingLabWorkType.turnaround_duration, editingLabWorkType.turnaround_unit)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLabWorkType}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LabWorkTypesTab;
