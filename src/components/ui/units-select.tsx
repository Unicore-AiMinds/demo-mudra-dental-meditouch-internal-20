import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useUnits } from '@/contexts/UnitsContext';
import { useToast } from '@/hooks/use-toast';

interface UnitsSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const UnitsSelect: React.FC<UnitsSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select Unit",
  disabled = false
}) => {
  const { units, addUnit, deleteUnit } = useUnits();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [unitToDelete, setUnitToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a unit name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newUnit = await addUnit(newUnitName.trim());
      onValueChange(newUnit.name);
      setNewUnitName('');
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;

    try {
      await deleteUnit(unitToDelete.id);

      // If the deleted unit was selected, clear the selection
      if (value === unitToDelete.name) {
        onValueChange('');
      }

      setUnitToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const openDeleteDialog = (unit: { id: string; name: string }) => {
    setUnitToDelete(unit);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Add Unit Option */}
          <div className="p-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Unit
            </Button>
          </div>

          {/* Separator */}
          <div className="border-t my-1" />

          {/* Unit Options */}
          {units.map((unit) => (
            <div key={unit.id} className="relative group">
              <SelectItem value={unit.name} className="pr-8">
                {unit.name}
              </SelectItem>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openDeleteDialog({ id: unit.id, name: unit.name });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Separator before delete options */}
          {units.length > 0 && (
            <>
              <div className="border-t my-1" />
              <div className="p-1">
                <div className="text-xs text-muted-foreground px-2 py-1">
                  Hover over units above to delete them
                </div>
              </div>
            </>
          )}
        </SelectContent>
      </Select>

      {/* Add Unit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>
              Enter the name of the new unit you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter unit name (e.g., Liter, Gram, etc.)"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddUnit();
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUnit}>
              Add Unit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the unit "{unitToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
            {value === unitToDelete?.name && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                <strong>Warning:</strong> This unit is currently selected and will be cleared if deleted.
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
