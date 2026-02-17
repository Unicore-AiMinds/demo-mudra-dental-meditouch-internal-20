import React, { useState } from 'react';
import { useStockDefinitions, StockDefinition } from '@/contexts/StockDefinitionsContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Package, AlertCircle } from 'lucide-react';
import { UnitsSelect } from '@/components/ui/units-select';

const StockItemsTab: React.FC = () => {
  const { stockDefinitions, isLoading, addStockDefinition, updateStockDefinition, deleteStockDefinition } = useStockDefinitions();
  const { toast } = useToast();

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<StockDefinition | null>(null);

  // State for new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemSubItem, setNewItemSubItem] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemType, setNewItemType] = useState<'Consumable' | 'Inventory'>('Consumable');
  const [newItemMinThreshold, setNewItemMinThreshold] = useState(0);
  const [newItemUnit, setNewItemUnit] = useState('Piece');
  const [newItemClinicType, setNewItemClinicType] = useState<'dental' | 'meditouch' | 'both'>('dental');

  // State for edit item
  const [editItemName, setEditItemName] = useState('');
  const [editItemSubItem, setEditItemSubItem] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemType, setEditItemType] = useState<'Consumable' | 'Inventory'>('Consumable');
  const [editItemMinThreshold, setEditItemMinThreshold] = useState(0);
  const [editItemUnit, setEditItemUnit] = useState('');
  const [editItemClinicType, setEditItemClinicType] = useState<'dental' | 'meditouch' | 'both'>('dental');

  // Handle edit item
  const handleEditItem = (item: StockDefinition) => {
    setCurrentItem(item);
    setEditItemName(item.name);
    setEditItemSubItem(item.sub_item || '');
    setEditItemDescription(item.description);
    setEditItemType(item.item_type);
    setEditItemMinThreshold(item.minimum_threshold);
    setEditItemUnit(item.unit || '');
    setEditItemClinicType(item.clinic_type || 'dental');
    setIsEditDialogOpen(true);
  };

  // Handle delete item
  const handleDeleteItem = (item: StockDefinition) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Handle add item
  const handleAddItem = async () => {
    if (!newItemName || newItemMinThreshold < 0 || !newItemUnit) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate stock item before adding
    const duplicateItem = stockDefinitions.find(existing => {
      const nameMatch = existing.name.trim().toLowerCase() === newItemName.trim().toLowerCase();
      const subItemMatch = (existing.sub_item || '').trim().toLowerCase() === (newItemSubItem || '').trim().toLowerCase();
      // Check clinic_type overlap: either one is 'both', or they match
      const clinicOverlap =
        existing.clinic_type === 'both' ||
        newItemClinicType === 'both' ||
        existing.clinic_type === newItemClinicType;
      return nameMatch && subItemMatch && clinicOverlap;
    });

    if (duplicateItem) {
      const subItemLabel = duplicateItem.sub_item ? ` (${duplicateItem.sub_item})` : '';
      toast({
        title: 'Duplicate Stock Item',
        description: `A stock item "${duplicateItem.name}${subItemLabel}" already exists for the selected clinic.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await addStockDefinition({
        name: newItemName,
        sub_item: newItemSubItem || undefined,
        description: newItemDescription,
        item_type: newItemType,
        minimum_threshold: newItemMinThreshold,
        unit: newItemUnit, // Unit is now required
        clinic_type: newItemClinicType,
      });

      // Reset form
      setNewItemName('');
      setNewItemSubItem('');
      setNewItemDescription('');
      setNewItemType('Consumable');
      setNewItemMinThreshold(0);
      setNewItemUnit('Piece');
      setNewItemClinicType('dental');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding stock item:', error);
    }
  };

  // Handle update item
  const handleUpdateItem = async () => {
    if (!currentItem) return;

    if (!editItemName || editItemMinThreshold < 0 || !editItemUnit) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateStockDefinition(currentItem.id, {
        name: editItemName,
        sub_item: editItemSubItem || undefined,
        description: editItemDescription,
        item_type: editItemType,
        minimum_threshold: editItemMinThreshold,
        unit: editItemUnit, // Unit is now required
        clinic_type: editItemClinicType,
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating stock item:', error);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!currentItem) return;

    try {
      await deleteStockDefinition(currentItem.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting stock item:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Manage Stock Items
          </CardTitle>
          <CardDescription>
            Configure stock items, sub-items, and item types for Dental Metrix Clinic
          </CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Stock Item
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading stock items...</p>
          </div>
        ) : stockDefinitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Stock Items Found</h3>
            <p className="text-muted-foreground mt-2">
              Add stock items to manage your inventory.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Sub-item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Item Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockDefinitions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sub_item || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={item.description}>
                    {item.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={item.item_type === 'Consumable' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-teal-50 text-teal-700 border-teal-200'}>
                      {item.item_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.unit || '-'}</TableCell>
                  <TableCell>{item.minimum_threshold || '-'}</TableCell>
                  <TableCell>
                    {item.clinic_type === 'dental' ? 'Dental Matrix' : 
                     item.clinic_type === 'meditouch' ? 'Meditouch' : 
                     item.clinic_type === 'both' ? 'Both Clinics' : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteItem(item)}
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

      {/* Add Stock Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Stock Item</DialogTitle>
            <DialogDescription>
              Add a new stock item to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label htmlFor="itemName" className="flex items-center">
                  Item Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="itemName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="itemSubItem">Sub-item</Label>
                <Input
                  id="itemSubItem"
                  value={newItemSubItem}
                  onChange={(e) => setNewItemSubItem(e.target.value)}
                  placeholder="Enter sub-item (optional)"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="itemDescription">
                  Description
                </Label>
                <Textarea
                  id="itemDescription"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="itemType" className="flex items-center">
                  Item Type <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={newItemType}
                  onValueChange={(value) => setNewItemType(value as 'Consumable' | 'Inventory')}
                >
                  <SelectTrigger id="itemType">
                    <SelectValue placeholder="Select Item Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumable">Consumable</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="itemUnit" className="flex items-center">
                  Unit <span className="text-red-500 ml-1">*</span>
                </Label>
                <UnitsSelect
                  value={newItemUnit}
                  onValueChange={setNewItemUnit}
                  placeholder="Select Unit"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="itemClinicType" className="flex items-center">
                  Clinic <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={newItemClinicType}
                  onValueChange={(value: 'dental' | 'meditouch' | 'both') => setNewItemClinicType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dental">Dental Matrix</SelectItem>
                    <SelectItem value="meditouch">Meditouch</SelectItem>
                    <SelectItem value="both">Both Clinics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="itemMinThreshold" className="flex items-center">
                  Minimum Threshold <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="itemMinThreshold"
                  type="number"
                  min="0"
                  value={newItemMinThreshold}
                  onChange={(e) => setNewItemMinThreshold(parseInt(e.target.value))}
                  placeholder="Enter minimum threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Items will be marked as low stock when quantity falls below this threshold
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Stock Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
            <DialogDescription>
              Update stock item information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editItemName" className="flex items-center">
                  Item Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="editItemName"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editItemSubItem">Sub-item</Label>
                <Input
                  id="editItemSubItem"
                  value={editItemSubItem}
                  onChange={(e) => setEditItemSubItem(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editItemDescription">
                  Description
                </Label>
                <Textarea
                  id="editItemDescription"
                  value={editItemDescription}
                  onChange={(e) => setEditItemDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editItemType" className="flex items-center">
                  Item Type <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={editItemType}
                  onValueChange={(value) => setEditItemType(value as 'Consumable' | 'Inventory')}
                >
                  <SelectTrigger id="editItemType">
                    <SelectValue placeholder="Select Item Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumable">Consumable</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editItemUnit" className="flex items-center">
                  Unit <span className="text-red-500 ml-1">*</span>
                </Label>
                <UnitsSelect
                  value={editItemUnit}
                  onValueChange={setEditItemUnit}
                  placeholder="Select Unit"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editItemClinicType" className="flex items-center">
                  Clinic <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={editItemClinicType}
                  onValueChange={(value: 'dental' | 'meditouch' | 'both') => setEditItemClinicType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dental">Dental Matrix</SelectItem>
                    <SelectItem value="meditouch">Meditouch</SelectItem>
                    <SelectItem value="both">Both Clinics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editItemMinThreshold" className="flex items-center">
                  Minimum Threshold <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="editItemMinThreshold"
                  type="number"
                  min="0"
                  value={editItemMinThreshold}
                  onChange={(e) => setEditItemMinThreshold(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>
              Update Stock Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the stock item "{currentItem?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default StockItemsTab;
