import { useState, useMemo, useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useStock } from '@/hooks/use-stock';
import { useStockDefinitions } from '@/contexts/StockDefinitionsContext';
import { useDealers } from '@/contexts/DealersContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Package, FileDown, Filter, X, ArrowUpDown, CalendarDays, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import IncomingStockDialog from '@/components/IncomingStockDialog';
import ConsumeStockDialog from '@/components/ConsumeStockDialog';
import StockBatchesDialog from '@/components/StockBatchesDialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateForExport, formatDateForFilename } from '@/utils/dateFormatter';

interface StockItem {
  id: string;
  name: string;
  subItem?: string;
  itemType: 'Consumable' | 'Inventory';
  dealer?: string;
  rate?: number; // Price/rate per unit
  description: string;
  unit: string;
  currentQuantity: number;
  minimumThreshold: number;
  nearestExpiryDate?: string;
  createdAt: string; // Date when the item was added to inventory
}

// Stock items from Settings page
const initialStockItems = [
  {
    id: 1,
    name: "Dental Composite",
    subItems: [
      { name: "Filtek Supreme Ultra", minimumThreshold: 5 },
      { name: "3M Z350", minimumThreshold: 4 },
      { name: "Tetric N-Ceram", minimumThreshold: 6 }
    ],
    description: "Light-cured restorative material for anterior and posterior restorations",
    itemType: "Consumable"
  },
  {
    id: 2,
    name: "Impression Material",
    subItems: [
      { name: "Jeltrate Plus", minimumThreshold: 3 },
      { name: "Alginate Regular", minimumThreshold: 5 },
      { name: "Speedex", minimumThreshold: 2 }
    ],
    description: "Alginate impression material for preliminary impressions",
    itemType: "Consumable"
  },
  {
    id: 3,
    name: "Orthodontic Wire",
    subItems: [
      { name: "Ormco NiTi", minimumThreshold: 6 },
      { name: "3M Unitek", minimumThreshold: 8 },
      { name: "G&H Wire", minimumThreshold: 7 }
    ],
    description: "Nickel titanium archwires for orthodontic treatment",
    itemType: "Inventory"
  },
  {
    id: 4,
    name: "Dental Cement",
    subItems: [
      { name: "GC Fuji II LC", minimumThreshold: 4 },
      { name: "RelyX", minimumThreshold: 3 },
      { name: "Ketac Cem", minimumThreshold: 5 }
    ],
    description: "Light-cured glass ionomer restorative cement",
    itemType: "Consumable"
  },
  {
    id: 5,
    name: "Dental Burs",
    subItems: [
      { name: "Mani Diamond", minimumThreshold: 10 },
      { name: "SS White", minimumThreshold: 12 },
      { name: "Dentsply Carbide", minimumThreshold: 8 }
    ],
    description: "Diamond dental burs for cavity preparation",
    itemType: "Inventory"
  }
];

// Dealers are now managed by DealersContext

const StockTracker = () => {
  const { activeClinic, isDental } = useClinic();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stockDefinitions } = useStockDefinitions();
  const { stockItems: dbStockItems, isLoading: isStockLoading, addStockItem, updateStockItem, deleteStockItem } = useStock();

  // Group stock items by name for dropdown
  const stockItemsList = useMemo(() => {
    // Create a map to group items by name
    const itemMap = new Map();

    stockDefinitions.forEach(item => {
      if (!itemMap.has(item.name)) {
        // Create a new entry with the first item
        itemMap.set(item.name, {
          id: item.id,
          name: item.name,
          description: item.description,
          item_type: item.item_type,
          minimum_threshold: item.minimum_threshold,
          unit: item.unit,
          sub_items: [],
          // Store sub-item details with their properties
          sub_item_details: {}
        });
      }

      // Get the existing item
      const existingItem = itemMap.get(item.name);

      // Add sub-item to existing entry if it exists
      if (item.sub_item && !existingItem.sub_items.includes(item.sub_item)) {
        existingItem.sub_items.push(item.sub_item);

        // Store the sub-item details with its properties
        existingItem.sub_item_details[item.sub_item] = {
          id: item.id,
          minimum_threshold: item.minimum_threshold,
          unit: item.unit,
          description: item.description
        };
      }
    });

    // Convert map to array
    return Array.from(itemMap.values());
  }, [stockDefinitions]);

  // Get dealers from DealersContext
  const { dealers: dealersList } = useDealers();

  // State for selected item's sub-items
  const [selectedItemSubItems, setSelectedItemSubItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterItemType, setFilterItemType] = useState('all'); // 'all', 'Consumable', or 'Inventory'
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<StockItem | null>(null);
  const [editSelectedItemSubItems, setEditSelectedItemSubItems] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // State for batch management dialogs
  const [isIncomingDialogOpen, setIsIncomingDialogOpen] = useState(false);
  const [isConsumeDialogOpen, setIsConsumeDialogOpen] = useState(false);
  const [isBatchesDialogOpen, setIsBatchesDialogOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<{
    id: string;
    name: string;
    unit: string;
    currentQuantity: number;
  } | null>(null);

  const [newItem, setNewItem] = useState<Omit<StockItem, 'id'>>({
    name: '',
    subItem: '',
    itemType: 'Consumable',
    dealer: '',
    rate: 0,
    description: '',
    unit: '',
    currentQuantity: 0,
    minimumThreshold: 0,
    nearestExpiryDate: undefined,
    createdAt: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
  });

  // Removed clinic restriction - Stock Tracker now available for both clinics

  // Update stockItems when dbStockItems changes
  useEffect(() => {
    // Always convert and set items, even if array is empty (important for clinic filtering)
    const convertedItems = dbStockItems.map(item => ({
      id: item.id,
      name: item.name,
      subItem: item.sub_item,
      itemType: item.item_type,
      dealer: item.dealer,
      rate: item.rate,
      description: item.description,
      unit: item.unit,
      currentQuantity: item.current_quantity,
      minimumThreshold: item.minimum_threshold,
      nearestExpiryDate: item.nearest_expiry_date,
      createdAt: item.created_at
    }));
    setStockItems(convertedItems);
  }, [dbStockItems]);

  // Priority-based status functions to avoid logical conflicts
  const isOutOfStock = (item: StockItem) => item.currentQuantity === 0;
  const isLowStock = (item: StockItem) => item.currentQuantity > 0 && item.currentQuantity <= item.minimumThreshold;

  // Check if item is expired (expiry date is today or in the past)
  const isExpired = (item: StockItem) => {
    if (!item.nearestExpiryDate) return false;

    const expiryDate = new Date(item.nearestExpiryDate);
    const today = new Date();

    // Set both dates to midnight to compare just the dates
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Return true if expiry date is today or in the past
    return expiryDate <= today;
  };

  // Check if item is expiring soon (within 60 days) - only if not out of stock or expired
  const isExpiringSoon = (item: StockItem) => {
    if (!item.nearestExpiryDate || isOutOfStock(item) || isExpired(item)) return false;

    const expiryDate = new Date(item.nearestExpiryDate);
    const today = new Date();

    // Calculate the difference in days
    const differenceInTime = expiryDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    // Return true if expiring within 60 days but not expired yet
    return differenceInDays > 0 && differenceInDays <= 60;
  };

  // Get primary status for an item (priority-based, only one status)
  const getPrimaryStatus = (item: StockItem) => {
    if (isOutOfStock(item)) return 'outofstock';
    if (isExpired(item)) return 'expired';
    if (isExpiringSoon(item)) return 'expiring';
    if (isLowStock(item)) return 'low';
    return 'normal';
  };

  const sortedAndFilteredItems = useMemo(() => {
    // First filter the items
    const filtered = stockItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by status
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'outofstock' && isOutOfStock(item)) ||
        (filterStatus === 'low' && isLowStock(item)) ||
        (filterStatus === 'expiring' && isExpiringSoon(item)) ||
        (filterStatus === 'expired' && isExpired(item));

      // Filter by item type
      const matchesItemType =
        filterItemType === 'all' ||
        item.itemType === filterItemType;

      return matchesSearch && matchesStatus && matchesItemType;
    });

    // Then sort the filtered items by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [stockItems, searchQuery, filterStatus, filterItemType, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleAddStockItem = () => {
    setIsAddDialogOpen(true);
  };

  const handleSaveNewItem = async () => {
    if (
      !newItem.name ||
      !newItem.itemType ||
      !newItem.dealer ||
      newItem.rate <= 0 ||
      !newItem.unit ||
      newItem.currentQuantity < 0 ||
      newItem.minimumThreshold < 0 ||
      !newItem.nearestExpiryDate
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields marked with *.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert from component format to database format
      const dbItem = {
        name: newItem.name,
        sub_item: newItem.subItem,
        item_type: newItem.itemType,
        dealer: newItem.dealer,
        rate: newItem.rate,
        description: newItem.description,
        unit: newItem.unit,
        current_quantity: newItem.currentQuantity,
        minimum_threshold: newItem.minimumThreshold,
        nearest_expiry_date: newItem.nearestExpiryDate,
        clinic_type: activeClinic as 'dental' | 'meditouch'
      };

      await addStockItem(dbItem);

      setNewItem({
        name: '',
        subItem: '',
        itemType: 'Consumable',
        dealer: '',
        rate: 0,
        description: '',
        unit: '',
        currentQuantity: 0,
        minimumThreshold: 0,
        nearestExpiryDate: undefined,
        createdAt: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      });

      // Show success toast
      toast({
        title: "Stock Item Added",
        description: "The new stock item has been added successfully.",
        variant: "default"
      });

      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding stock item:', error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to add stock item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleIncomingStock = (itemId: string) => {
    // Find the stock item
    const item = stockItems.find(i => i.id === itemId);
    if (!item) return;

    // Set the selected item for the dialog
    setSelectedStockItem({
      id: itemId,
      name: `${item.name}${item.subItem ? ` (${item.subItem})` : ''}`,
      unit: item.unit,
      currentQuantity: item.currentQuantity
    });

    // Open the dialog
    setIsIncomingDialogOpen(true);
  };

  const handleConsumeStock = (itemId: string) => {
    // Find the stock item
    const item = stockItems.find(i => i.id === itemId);
    if (!item) {
      console.error('Stock item not found:', itemId);
      return;
    }

    // Set the selected item for the dialog
    setSelectedStockItem({
      id: itemId,
      name: `${item.name}${item.subItem ? ` (${item.subItem})` : ''}`,
      unit: item.unit,
      currentQuantity: item.currentQuantity
    });

    // Open the dialog
    setIsConsumeDialogOpen(true);
  };

  const handleViewBatches = (itemId: string) => {
    // Find the stock item
    const item = stockItems.find(i => i.id === itemId);
    if (!item) return;

    // Set the selected item for the dialog
    setSelectedStockItem({
      id: itemId,
      name: `${item.name}${item.subItem ? ` (${item.subItem})` : ''}`,
      unit: item.unit,
      currentQuantity: item.currentQuantity
    });

    // Open the dialog
    setIsBatchesDialogOpen(true);
  };

  const handleEditItem = (item: StockItem) => {
    setCurrentEditItem(item);

    // Find the corresponding stock definition from our grouped items
    const stockDefinition = stockItemsList.find(def => def.name === item.name);
    if (stockDefinition) {
      // Get all sub-items for this item
      if (stockDefinition.sub_items && stockDefinition.sub_items.length > 0) {
        setEditSelectedItemSubItems(stockDefinition.sub_items);

        // If the item has a sub-item, update the form with the sub-item's details
        if (item.subItem && stockDefinition.sub_item_details[item.subItem]) {
          const subItemDetails = stockDefinition.sub_item_details[item.subItem];

          // Update the minimum threshold and unit based on the sub-item
          setCurrentEditItem({
            ...item,
            minimumThreshold: subItemDetails.minimum_threshold,
            unit: subItemDetails.unit || 'Piece',
            description: subItemDetails.description || item.description
          });
        }
      } else {
        setEditSelectedItemSubItems([]);
      }
    } else {
      setEditSelectedItemSubItems([]);
    }

    setIsEditDialogOpen(true);
  };

  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleUpdateConfirm = () => {
    setIsConfirmUpdateOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!currentEditItem) return;

    if (
      !currentEditItem.name ||
      !currentEditItem.itemType ||
      !currentEditItem.dealer ||
      !currentEditItem.rate || currentEditItem.rate <= 0 ||
      !currentEditItem.unit ||
      currentEditItem.currentQuantity < 0 ||
      currentEditItem.minimumThreshold < 0 ||
      !currentEditItem.nearestExpiryDate
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields marked with *.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert from component format to database format
      const dbItem = {
        name: currentEditItem.name,
        sub_item: currentEditItem.subItem,
        item_type: currentEditItem.itemType,
        dealer: currentEditItem.dealer,
        rate: currentEditItem.rate,
        description: currentEditItem.description,
        unit: currentEditItem.unit,
        current_quantity: currentEditItem.currentQuantity,
        minimum_threshold: currentEditItem.minimumThreshold,
        nearest_expiry_date: currentEditItem.nearestExpiryDate,
        clinic_type: activeClinic as 'dental' | 'meditouch'
      };

      await updateStockItem(currentEditItem.id, dbItem);

      // Show success toast
      toast({
        title: "Stock Item Updated",
        description: "The stock item has been updated successfully.",
        variant: "default"
      });

      setIsConfirmUpdateOpen(false);
      setIsEditDialogOpen(false);
      setCurrentEditItem(null);
    } catch (error) {
      console.error('Error updating stock item:', error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update stock item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConfirm = () => {
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!currentEditItem) return;

    try {
      await deleteStockItem(currentEditItem.id);

      // Show success toast
      toast({
        title: "Stock Item Deleted",
        description: `${currentEditItem.name}${currentEditItem.subItem ? ` (${currentEditItem.subItem})` : ''} has been deleted successfully.`,
        variant: "default"
      });

      setIsConfirmDeleteOpen(false);
      setIsEditDialogOpen(false);
      setCurrentEditItem(null);
    } catch (error) {
      console.error('Error deleting stock item:', error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to delete stock item. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Stock Tracker</h1>
          <p className="text-muted-foreground">Manage and monitor dental supplies inventory</p>
        </div>

        {hasPermission('stock.create') && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-dental-primary hover:bg-dental-dark"
                onClick={handleAddStockItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Enter details for the new inventory item. Fields marked with <span className="text-red-500">*</span> are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="itemName" className="text-right text-xs">Name <span className="text-red-500 ml-1">*</span></Label>
                <div className="col-span-3">
                  <Select
                    value={newItem.name || undefined}
                    onValueChange={(value) => {
                      // Find the selected stock definition
                      const selectedItem = stockItemsList.find(item => item.name === value);
                      if (selectedItem) {
                        // Get all sub-items for this item from our grouped data
                        if (selectedItem.sub_items && selectedItem.sub_items.length > 0) {
                          setSelectedItemSubItems(selectedItem.sub_items);
                        } else {
                          setSelectedItemSubItems([]);
                        }

                        // Get the first sub-item if available
                        const subItem = selectedItem.sub_items && selectedItem.sub_items.length > 0
                          ? selectedItem.sub_items[0]
                          : '';

                        // Get the sub-item details if available
                        const subItemDetails = subItem && selectedItem.sub_item_details[subItem]
                          ? selectedItem.sub_item_details[subItem]
                          : null;

                        // Update the form with the selected item's details
                        setNewItem({
                          ...newItem,
                          name: selectedItem.name,
                          subItem: subItem,
                          itemType: selectedItem.item_type,
                          description: subItemDetails ? subItemDetails.description : (selectedItem.description || ''),
                          minimumThreshold: subItemDetails ? subItemDetails.minimum_threshold : selectedItem.minimum_threshold,
                          unit: subItemDetails ? (subItemDetails.unit || 'Piece') : (selectedItem.unit || 'Piece')
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItemsList.map((item) => (
                        <SelectItem key={item.id} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="subItem" className="text-right text-xs">Sub-item</Label>
                <div className="col-span-3">
                  {selectedItemSubItems.length > 0 ? (
                    <Select
                      value={newItem.subItem || undefined}
                      onValueChange={(value) => {
                        // Find the selected item
                        const selectedItem = stockItemsList.find(item => item.name === newItem.name);
                        if (selectedItem && selectedItem.sub_item_details[value]) {
                          // Get the sub-item details
                          const subItemDetails = selectedItem.sub_item_details[value];

                          // Update the form with the selected sub-item's details
                          setNewItem({
                            ...newItem,
                            subItem: value,
                            minimumThreshold: subItemDetails.minimum_threshold,
                            unit: subItemDetails.unit || 'Piece',
                            description: subItemDetails.description || newItem.description
                          });
                        } else {
                          // Just update the sub-item if no details found
                          setNewItem({
                            ...newItem,
                            subItem: value
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select a sub-item" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedItemSubItems.map((subItem) => (
                          <SelectItem key={subItem} value={subItem}>
                            {subItem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="subItem"
                      value=""
                      readOnly
                      disabled
                      className="col-span-3 h-8"
                      placeholder="No sub-item available"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="description" className="text-right text-xs">Description</Label>
                <Input
                  id="description"
                  value={newItem.description}
                  onChange={(e) => {
                    // Capitalize the first letter of each sentence
                    const value = e.target.value;
                    const capitalizedValue = value.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
                    setNewItem({...newItem, description: capitalizedValue});
                  }}
                  className="col-span-3 h-8"
                  placeholder="Item description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="itemType" className="text-right text-xs">Item Type <span className="text-red-500 ml-1">*</span></Label>
                <div className="col-span-3 flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="consumable"
                      name="itemType"
                      value="Consumable"
                      checked={newItem.itemType === 'Consumable'}
                      disabled
                      className="mr-2"
                    />
                    <label htmlFor="consumable" className={newItem.itemType === 'Consumable' ? 'font-medium' : 'text-gray-500'}>Consumable</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="inventory"
                      name="itemType"
                      value="Inventory"
                      checked={newItem.itemType === 'Inventory'}
                      disabled
                      className="mr-2"
                    />
                    <label htmlFor="inventory" className={newItem.itemType === 'Inventory' ? 'font-medium' : 'text-gray-500'}>Inventory</label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="quantity" className="text-right text-xs">Quantity <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newItem.currentQuantity === 0 && document.activeElement !== document.getElementById('quantity') ? '' : newItem.currentQuantity}
                  onChange={(e) => {
                    // Only allow numeric input
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    const value = numericValue === '' ? 0 : parseInt(numericValue, 10);
                    setNewItem({...newItem, currentQuantity: value});
                  }}
                  onFocus={(e) => {
                    if (newItem.currentQuantity === 0) {
                      e.target.value = '';
                    }
                  }}
                  className="col-span-3 h-8"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="unit" className="text-right text-xs">Unit <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="unit"
                  value={newItem.unit}
                  readOnly={!!newItem.name} // Make it read-only if an item is selected
                  onChange={(e) => {
                    // Only allow changes if no item is selected
                    if (!newItem.name) {
                      // Capitalize the first letter
                      const value = e.target.value;
                      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
                      setNewItem({...newItem, unit: capitalizedValue});
                    }
                  }}
                  className={`col-span-3 h-8 ${newItem.name ? 'bg-gray-100' : ''}`}
                  placeholder="e.g., Pack, Bottle"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="threshold" className="text-right text-xs">Min. Threshold <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="threshold"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newItem.minimumThreshold === 0 && document.activeElement !== document.getElementById('threshold') ? '' : newItem.minimumThreshold}
                  onChange={(e) => {
                    // Only allow numeric input if no item is selected
                    if (!newItem.name) {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      const value = numericValue === '' ? 0 : parseInt(numericValue, 10);
                      setNewItem({...newItem, minimumThreshold: value});
                    }
                  }}
                  onFocus={(e) => {
                    if (newItem.minimumThreshold === 0 && !newItem.name) {
                      e.target.value = '';
                    }
                  }}
                  className={`col-span-3 h-8 ${newItem.name && newItem.subItem ? 'bg-gray-100' : ''}`}
                  readOnly={!!(newItem.name && newItem.subItem)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="dealer" className="text-right text-xs">Dealer <span className="text-red-500 ml-1">*</span></Label>
                <div className="col-span-3">
                  <Select
                    value={newItem.dealer || undefined}
                    onValueChange={(value) => {
                      setNewItem({
                        ...newItem,
                        dealer: value
                      });
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select a dealer" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealersList.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.name}>
                          {dealer.name} ({dealer.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="rate" className="text-right text-xs">Rate (₹) <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="rate"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newItem.rate === 0 && document.activeElement !== document.getElementById('rate') ? '' : newItem.rate}
                  onChange={(e) => {
                    // Only allow numeric input
                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                    const value = numericValue === '' ? 0 : parseFloat(numericValue);
                    setNewItem({...newItem, rate: value});
                  }}
                  onFocus={(e) => {
                    if (newItem.rate === 0) {
                      e.target.value = '';
                    }
                  }}
                  className="col-span-3 h-8"
                  placeholder="Price per unit"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="expiry" className="text-right text-xs">Expiry Date <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newItem.nearestExpiryDate}
                  onChange={(e) => setNewItem({...newItem, nearestExpiryDate: e.target.value})}
                  className="col-span-3 h-8"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveNewItem}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update details for the inventory item. Fields marked with <span className="text-red-500">*</span> are required.
              </DialogDescription>
            </DialogHeader>
            {currentEditItem && (
              <div className="grid gap-2 py-2">
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editItemName" className="text-right text-xs">Name <span className="text-red-500 ml-1">*</span></Label>
                  <div className="col-span-3">
                    <Select
                      value={currentEditItem.name || undefined}
                      onValueChange={(value) => {
                        // Find the selected stock definition
                        const selectedItem = stockItemsList.find(item => item.name === value);
                        if (selectedItem) {
                          // Get all sub-items for this item from our grouped data
                          if (selectedItem.sub_items && selectedItem.sub_items.length > 0) {
                            setEditSelectedItemSubItems(selectedItem.sub_items);
                          } else {
                            setEditSelectedItemSubItems([]);
                          }

                          // Get the first sub-item if available
                          const subItem = selectedItem.sub_items && selectedItem.sub_items.length > 0
                            ? selectedItem.sub_items[0]
                            : '';

                          // Get the sub-item details if available
                          const subItemDetails = subItem && selectedItem.sub_item_details[subItem]
                            ? selectedItem.sub_item_details[subItem]
                            : null;

                          // Update the form with the selected item's details
                          setCurrentEditItem({
                            ...currentEditItem,
                            name: selectedItem.name,
                            subItem: subItem,
                            itemType: selectedItem.item_type,
                            description: subItemDetails ? subItemDetails.description : (selectedItem.description || ''),
                            minimumThreshold: subItemDetails ? subItemDetails.minimum_threshold : selectedItem.minimum_threshold,
                            unit: subItemDetails ? (subItemDetails.unit || 'Piece') : (selectedItem.unit || 'Piece')
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockItemsList.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editSubItem" className="text-right text-xs">Sub-item</Label>
                  <div className="col-span-3">
                    {editSelectedItemSubItems.length > 0 ? (
                      <Select
                        value={currentEditItem.subItem || undefined}
                        onValueChange={(value) => {
                          // Find the selected item
                          const selectedItem = stockItemsList.find(item => item.name === currentEditItem.name);
                          if (selectedItem && selectedItem.sub_item_details[value]) {
                            // Get the sub-item details
                            const subItemDetails = selectedItem.sub_item_details[value];

                            // Update the form with the selected sub-item's details
                            setCurrentEditItem({
                              ...currentEditItem,
                              subItem: value,
                              minimumThreshold: subItemDetails.minimum_threshold,
                              unit: subItemDetails.unit || 'Piece',
                              description: subItemDetails.description || currentEditItem.description
                            });
                          } else {
                            // Just update the sub-item if no details found
                            setCurrentEditItem({
                              ...currentEditItem,
                              subItem: value
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select a sub-item" />
                        </SelectTrigger>
                        <SelectContent>
                          {editSelectedItemSubItems.map((subItem) => (
                            <SelectItem key={subItem} value={subItem}>
                              {subItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="editSubItem"
                        value=""
                        readOnly
                        disabled
                        className="col-span-3 h-8"
                        placeholder="No sub-item available"
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editDescription" className="text-right text-xs">Description</Label>
                  <Input
                    id="editDescription"
                    value={currentEditItem.description}
                    onChange={(e) => {
                      // Capitalize the first letter of each sentence
                      const value = e.target.value;
                      const capitalizedValue = value.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
                      setCurrentEditItem({...currentEditItem, description: capitalizedValue});
                    }}
                    className="col-span-3 h-8"
                    placeholder="Item description"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editItemType" className="text-right text-xs">Item Type <span className="text-red-500 ml-1">*</span></Label>
                  <div className="col-span-3 flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="editConsumable"
                        name="editItemType"
                        value="Consumable"
                        checked={currentEditItem.itemType === 'Consumable'}
                        disabled
                        className="mr-2"
                      />
                      <label htmlFor="editConsumable" className={currentEditItem.itemType === 'Consumable' ? 'font-medium' : 'text-gray-500'}>Consumable</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="editInventory"
                        name="editItemType"
                        value="Inventory"
                        checked={currentEditItem.itemType === 'Inventory'}
                        disabled
                        className="mr-2"
                      />
                      <label htmlFor="editInventory" className={currentEditItem.itemType === 'Inventory' ? 'font-medium' : 'text-gray-500'}>Inventory</label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editQuantity" className="text-right text-xs">Quantity <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="editQuantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={currentEditItem.currentQuantity === 0 && document.activeElement !== document.getElementById('editQuantity') ? '' : currentEditItem.currentQuantity}
                    onChange={(e) => {
                      // Only allow numeric input
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      const value = numericValue === '' ? 0 : parseInt(numericValue, 10);
                      setCurrentEditItem({...currentEditItem, currentQuantity: value});
                    }}
                    onFocus={(e) => {
                      if (currentEditItem.currentQuantity === 0) {
                        e.target.value = '';
                      }
                    }}
                    className="col-span-3 h-8"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editUnit" className="text-right text-xs">Unit <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="editUnit"
                    value={currentEditItem.unit}
                    readOnly={!!currentEditItem.name} // Make it read-only if an item is selected
                    onChange={(e) => {
                      // Only allow changes if no item is selected
                      if (!currentEditItem.name) {
                        // Capitalize the first letter
                        const value = e.target.value;
                        const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
                        setCurrentEditItem({...currentEditItem, unit: capitalizedValue});
                      }
                    }}
                    className={`col-span-3 h-8 ${currentEditItem.name ? 'bg-gray-100' : ''}`}
                    placeholder="e.g., Pack, Bottle"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editThreshold" className="text-right text-xs">Min. Threshold <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="editThreshold"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={currentEditItem.minimumThreshold === 0 && document.activeElement !== document.getElementById('editThreshold') ? '' : currentEditItem.minimumThreshold}
                    onChange={(e) => {
                      // Only allow numeric input if no item is selected from the dropdown
                      if (!currentEditItem.name) {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        const value = numericValue === '' ? 0 : parseInt(numericValue, 10);
                        setCurrentEditItem({...currentEditItem, minimumThreshold: value});
                      }
                    }}
                    onFocus={(e) => {
                      if (currentEditItem.minimumThreshold === 0 && !currentEditItem.name) {
                        e.target.value = '';
                      }
                    }}
                    className={`col-span-3 h-8 ${currentEditItem.name && currentEditItem.subItem ? 'bg-gray-100' : ''}`}
                    readOnly={!!(currentEditItem.name && currentEditItem.subItem)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editDealer" className="text-right text-xs">Dealer <span className="text-red-500 ml-1">*</span></Label>
                  <div className="col-span-3">
                    <Select
                      value={currentEditItem.dealer || undefined}
                      onValueChange={(value) => {
                        setCurrentEditItem({
                          ...currentEditItem,
                          dealer: value
                        });
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select a dealer" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealersList.map((dealer) => (
                          <SelectItem key={dealer.id} value={dealer.name}>
                            {dealer.name} ({dealer.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editRate" className="text-right text-xs">Rate (₹) <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="editRate"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={(currentEditItem.rate === 0 || !currentEditItem.rate) && document.activeElement !== document.getElementById('editRate') ? '' : currentEditItem.rate}
                    onChange={(e) => {
                      // Only allow numeric input
                      const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                      const value = numericValue === '' ? 0 : parseFloat(numericValue);
                      setCurrentEditItem({...currentEditItem, rate: value});
                    }}
                    onFocus={(e) => {
                      if (currentEditItem.rate === 0 || !currentEditItem.rate) {
                        e.target.value = '';
                      }
                    }}
                    className="col-span-3 h-8"
                    placeholder="Price per unit"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editExpiry" className="text-right text-xs">Expiry Date <span className="text-red-500 ml-1">*</span></Label>
                  <Input
                    id="editExpiry"
                    type="date"
                    value={currentEditItem.nearestExpiryDate || ''}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, nearestExpiryDate: e.target.value})}
                    className="col-span-3 h-8"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-between">
              {hasPermission('stock.delete') && (
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Delete
                </Button>
              )}
              <div>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="mr-2">Cancel</Button>
                {hasPermission('stock.edit') && (
                  <Button onClick={handleUpdateConfirm}>Update</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Confirmation Dialog */}
        <Dialog open={isConfirmUpdateOpen} onOpenChange={setIsConfirmUpdateOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to update this item?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmUpdateOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={handleUpdateItem}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                {currentEditItem && (
                  <>Are you sure you want to delete <strong>{currentEditItem.name}</strong>? This action cannot be undone.</>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)} className="mr-2">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteItem}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-blue-50 p-2 rounded-full">
              <Package className="h-5 w-5 text-dental-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Items</div>
              <div className="text-2xl font-bold">{stockItems.length}</div>
              <div className="text-xs text-muted-foreground">Across {new Set(stockItems.map(item => item.unit)).size} categories</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-red-50 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Out of Stock</div>
              <div className="text-2xl font-bold">{stockItems.filter(item => isOutOfStock(item)).length}</div>
              <div className="text-xs text-muted-foreground">Items with zero quantity</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-amber-50 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Low Stock</div>
              <div className="text-2xl font-bold">{stockItems.filter(item => isLowStock(item)).length}</div>
              <div className="text-xs text-muted-foreground">Items below minimum threshold</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-orange-50 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Expiring Soon</div>
              <div className="text-2xl font-bold">{stockItems.filter(item => isExpiringSoon(item)).length}</div>
              <div className="text-xs text-muted-foreground">Items expiring within 60 days</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Expired</div>
              <div className="text-2xl font-bold">{stockItems.filter(item => isExpired(item)).length}</div>
              <div className="text-xs text-muted-foreground">Items that have expired</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader className="pb-2">
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Manage your dental supply inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All Status</TabsTrigger>
                  <TabsTrigger value="outofstock">Out of Stock</TabsTrigger>
                  <TabsTrigger value="low">Low Stock</TabsTrigger>
                  <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs value={filterItemType} onValueChange={setFilterItemType} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All Types</TabsTrigger>
                  <TabsTrigger value="Consumable">Consumable</TabsTrigger>
                  <TabsTrigger value="Inventory">Inventory</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button variant="outline" onClick={toggleSortOrder} className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Sort by Date
              <ArrowUpDown className="h-4 w-4 ml-1" />
            </Button>
            {hasPermission('stock.export') && (
              <Button
                variant="outline"
                className="flex gap-2 items-center"
                onClick={() => {
                // Create CSV content from the filtered and sorted data
                const headers = ['Item', 'Sub-item', 'Description', 'Item Type', 'Quantity', 'Unit', 'Dealer', 'Rate', 'Min Threshold', 'Expiry', 'Status', 'Date Added'];

                const csvContent = [
                  headers.join(','),
                  ...sortedAndFilteredItems.map((item: StockItem) => {
                    const primaryStatus = getPrimaryStatus(item);
                    let status = 'OK';

                    switch (primaryStatus) {
                      case 'outofstock':
                        status = 'Out of Stock';
                        break;
                      case 'expired':
                        status = 'Expired';
                        break;
                      case 'expiring':
                        status = 'Expiring Soon';
                        break;
                      case 'low':
                        status = 'Low Stock';
                        break;
                      default:
                        status = 'OK';
                    }
                    return [
                      `"${item.name}"`,
                      `"${item.subItem || ''}"`,
                      `"${item.description}"`,
                      `"${item.itemType}"`,
                      item.currentQuantity,
                      `"${item.unit}"`,
                      `"${item.dealer || ''}"`,
                      `"${item.rate ? '₹' + item.rate.toLocaleString() : ''}"`,
                      item.minimumThreshold,
                      `"${item.nearestExpiryDate ? formatDateForExport(item.nearestExpiryDate) : ''}"`,
                      `"${status}"`,
                      `"${formatDateForExport(item.createdAt)}"`
                    ].join(',');
                  })
                ].join('\n');

                // Create a blob and download link
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                // Create a temporary link and trigger download
                const link = document.createElement('a');
                const filename = `dental_stock_inventory_${formatDateForFilename()}.csv`;

                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast({
                  title: "Export Successful",
                  description: `${sortedAndFilteredItems.length} records exported to CSV.`,
                });
              }}
            >
              <FileDown className="h-4 w-4" />
              <span>Export</span>
            </Button>
            )}
          </div>

          <div className="border rounded-md overflow-x-auto max-w-[calc(100vw-3rem)]">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden md:table-cell">Sub-item</TableHead>
                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Item Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                    <TableHead className="hidden lg:table-cell">Dealer</TableHead>
                    <TableHead className="hidden lg:table-cell">Rate</TableHead>
                    <TableHead className="hidden md:table-cell">Min Threshold</TableHead>
                    <TableHead className="hidden md:table-cell">Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                        No items match your search criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredItems.map((item: StockItem) => (
                      <TableRow
                        key={item.id}
                        className={isExpired(item) ? "bg-red-50" : ""}
                      >
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.subItem || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{item.description}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={item.itemType === 'Consumable' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-teal-50 text-teal-700 border-teal-200'}>
                            {item.itemType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{item.currentQuantity}</span>
                            {isOutOfStock(item) && (
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                            )}
                            {isLowStock(item) && !isOutOfStock(item) && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {item.unit}{item.currentQuantity !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{item.dealer || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {item.rate ? `₹${item.rate.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.minimumThreshold}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.nearestExpiryDate ? (
                            <div className="flex items-center gap-1">
                              <span className={isExpired(item) ? "text-red-600 font-medium" : ""}>
                                {new Date(item.nearestExpiryDate).toLocaleDateString()}
                              </span>
                              {isExpired(item) && (
                                <AlertTriangle className="h-3 w-3 text-red-600" />
                              )}
                              {isExpiringSoon(item) && !isExpired(item) && (
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const primaryStatus = getPrimaryStatus(item);
                              switch (primaryStatus) {
                                case 'outofstock':
                                  return (
                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 font-medium">
                                      Out of Stock
                                    </Badge>
                                  );
                                case 'expired':
                                  return (
                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 font-medium">
                                      Expired
                                    </Badge>
                                  );
                                case 'expiring':
                                  return (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                      Expiring Soon
                                    </Badge>
                                  );
                                case 'low':
                                  return (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                      Low Stock
                                    </Badge>
                                  );
                                default:
                                  return (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      Normal
                                    </Badge>
                                  );
                              }
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission('stock.edit') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleEditItem(item)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Edit
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="19" cy="12" r="1"></circle>
                                    <circle cx="5" cy="12" r="1"></circle>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {hasPermission('stock.manage_batches') && (
                                  <DropdownMenuItem onClick={() => handleIncomingStock(item.id)}>
                                    Record Incoming
                                  </DropdownMenuItem>
                                )}
                                {hasPermission('stock.consume') && (
                                  <DropdownMenuItem onClick={() => handleConsumeStock(item.id)}>
                                    Record Consumption
                                  </DropdownMenuItem>
                                )}
                                {(hasPermission('stock.manage_batches') || hasPermission('stock.consume')) && hasPermission('stock.view_batches') && (
                                  <DropdownMenuSeparator />
                                )}
                                {hasPermission('stock.view_batches') && (
                                  <DropdownMenuItem onClick={() => handleViewBatches(item.id)}>
                                    <Info className="h-4 w-4 mr-2" />
                                    View Batches & History
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Management Dialogs */}
      {selectedStockItem && (
        <>
          <IncomingStockDialog
            isOpen={isIncomingDialogOpen}
            onClose={() => setIsIncomingDialogOpen(false)}
            stockItemId={selectedStockItem.id}
            stockItemName={selectedStockItem.name}
            stockItemUnit={selectedStockItem.unit}
          />

          <ConsumeStockDialog
            isOpen={isConsumeDialogOpen}
            onClose={() => setIsConsumeDialogOpen(false)}
            stockItemId={selectedStockItem.id}
            stockItemName={selectedStockItem.name}
            stockItemUnit={selectedStockItem.unit}
            currentQuantity={selectedStockItem.currentQuantity}
          />

          <StockBatchesDialog
            isOpen={isBatchesDialogOpen}
            onClose={() => setIsBatchesDialogOpen(false)}
            stockItemId={selectedStockItem.id}
            stockItemName={selectedStockItem.name}
          />
        </>
      )}
    </div>
  );
};

export default StockTracker;
