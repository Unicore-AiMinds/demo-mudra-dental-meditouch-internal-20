import { useState, useMemo } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Package, FileDown, Filter, X, ArrowUpDown, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    subItems: ["Filtek Supreme Ultra", "3M Z350", "Tetric N-Ceram"],
    description: "Light-cured restorative material for anterior and posterior restorations",
    itemType: "Consumable"
  },
  {
    id: 2,
    name: "Impression Material",
    subItems: ["Jeltrate Plus", "Alginate Regular", "Speedex"],
    description: "Alginate impression material for preliminary impressions",
    itemType: "Consumable"
  },
  {
    id: 3,
    name: "Orthodontic Wire",
    subItems: ["Ormco NiTi", "3M Unitek", "G&H Wire"],
    description: "Nickel titanium archwires for orthodontic treatment",
    itemType: "Inventory"
  },
  {
    id: 4,
    name: "Dental Cement",
    subItems: ["GC Fuji II LC", "RelyX", "Ketac Cem"],
    description: "Light-cured glass ionomer restorative cement",
    itemType: "Consumable"
  },
  {
    id: 5,
    name: "Dental Burs",
    subItems: ["Mani Diamond", "SS White", "Dentsply Carbide"],
    description: "Diamond dental burs for cavity preparation",
    itemType: "Inventory"
  }
];

// Dealers from Settings page
const initialDealers = [
  { id: 1, name: "Dental Depot", contact: "+91 98765 43210", city: "Mumbai" },
  { id: 2, name: "Henry Schein", contact: "+91 87654 32109", city: "Delhi" },
  { id: 3, name: "Ormco Direct", contact: "+91 76543 21098", city: "Bangalore" },
  { id: 4, name: "GC India", contact: "+91 65432 10987", city: "Chennai" },
  { id: 5, name: "Mani Inc", contact: "+91 54321 09876", city: "Hyderabad" },
  { id: 6, name: "Patterson Dental", contact: "+91 43210 98765", city: "Pune" },
  { id: 7, name: "3M Healthcare", contact: "+91 32109 87654", city: "Kolkata" }
];

const StockTracker = () => {
  const { activeClinic, isDental } = useClinic();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Stock items list for dropdown
  const stockItemsList = initialStockItems;

  // Dealers list for dropdown
  const dealersList = initialDealers;

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
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: '1',
      name: 'Dental Composite',
      subItem: 'Filtek Supreme Ultra',
      itemType: 'Consumable',
      dealer: 'Dental Depot',
      rate: 1250,
      description: 'A2 Shade - Universal',
      unit: 'syringe',
      currentQuantity: 2,
      minimumThreshold: 5,
      nearestExpiryDate: '2025-08-15',
      createdAt: '2023-10-15',
    },
    {
      id: '2',
      name: 'Impression Material',
      subItem: 'Jeltrate Plus',
      itemType: 'Consumable',
      dealer: 'Henry Schein',
      rate: 850,
      description: 'Alginate - Medium Set',
      unit: 'pack',
      currentQuantity: 3,
      minimumThreshold: 5,
      nearestExpiryDate: '2025-06-30',
      createdAt: '2023-10-16',
    },
    {
      id: '3',
      name: 'Orthodontic Wire',
      subItem: 'Ormco NiTi',
      itemType: 'Inventory',
      dealer: 'Ormco Direct',
      rate: 3200,
      description: '0.016 inch - NiTi',
      unit: 'spool',
      currentQuantity: 4,
      minimumThreshold: 6,
      createdAt: '2023-10-10',
    },
    {
      id: '4',
      name: 'Dental Cement',
      subItem: 'GC Fuji II LC',
      itemType: 'Consumable',
      dealer: 'GC India',
      rate: 1450,
      description: 'Glass Ionomer - Light Cure',
      unit: 'bottle',
      currentQuantity: 8,
      minimumThreshold: 4,
      nearestExpiryDate: '2025-04-25',
      createdAt: '2023-09-28',
    },
    {
      id: '5',
      name: 'Dental Burs',
      subItem: 'Mani Diamond',
      itemType: 'Inventory',
      dealer: 'Mani Inc',
      rate: 2100,
      description: 'Diamond - Assorted',
      unit: 'pack',
      currentQuantity: 12,
      minimumThreshold: 5,
      createdAt: '2023-10-03',
    },
    {
      id: '6',
      name: 'Topical Anesthetic',
      subItem: 'Benzodent',
      itemType: 'Consumable',
      dealer: 'Patterson Dental',
      rate: 550,
      description: 'Benzocaine 20%',
      unit: 'jar',
      currentQuantity: 6,
      minimumThreshold: 3,
      nearestExpiryDate: '2024-09-10',
      createdAt: '2023-10-12',
    },
    {
      id: '7',
      name: 'Face Masks',
      subItem: '3M Earloop',
      itemType: 'Consumable',
      dealer: '3M Healthcare',
      rate: 750,
      description: 'Surgical - Level 3',
      unit: 'box',
      currentQuantity: 15,
      minimumThreshold: 5,
      createdAt: '2023-10-05',
    },
  ]);

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

  if (!isDental) {
    navigate('/dashboard');
  }

  const sortedAndFilteredItems = useMemo(() => {
    // First filter the items
    const filtered = stockItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by status
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'low' && item.currentQuantity <= item.minimumThreshold) ||
        (filterStatus === 'expiring' && item.nearestExpiryDate && new Date(item.nearestExpiryDate) < new Date('2025-06-01'));

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

  const isLowStock = (item: StockItem) => item.currentQuantity <= item.minimumThreshold;
  const isExpiringSoon = (item: StockItem) => item.nearestExpiryDate && new Date(item.nearestExpiryDate) < new Date('2025-06-01');

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleAddStockItem = () => {
    setIsAddDialogOpen(true);
  };

  const handleSaveNewItem = () => {
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

    const newId = `${stockItems.length + 1}`;
    const itemToAdd = { id: newId, ...newItem };

    setStockItems(prev => [itemToAdd, ...prev]);
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to inventory.`,
    });

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

    setIsAddDialogOpen(false);
  };

  const handleIncomingStock = (itemId: string) => {
    toast({
      title: "Feature in Development",
      description: "Record incoming stock functionality will be available soon.",
    });
  };

  const handleConsumeStock = (itemId: string) => {
    toast({
      title: "Feature in Development",
      description: "Record stock consumption functionality will be available soon.",
    });
  };

  const handleEditItem = (item: StockItem) => {
    setCurrentEditItem(item);

    // Find the corresponding stock item to get sub-items
    const stockItem = stockItemsList.find(si => si.name === item.name);
    if (stockItem && stockItem.subItems) {
      setEditSelectedItemSubItems(stockItem.subItems);
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

  const handleUpdateItem = () => {
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

    setStockItems(prev =>
      prev.map(item =>
        item.id === currentEditItem.id ? currentEditItem : item
      )
    );

    toast({
      title: "Item Updated",
      description: `${currentEditItem.name} has been updated successfully.`,
    });

    setIsConfirmUpdateOpen(false);
    setIsEditDialogOpen(false);
    setCurrentEditItem(null);
  };

  const handleDeleteConfirm = () => {
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteItem = () => {
    if (!currentEditItem) return;

    setStockItems(prev => prev.filter(item => item.id !== currentEditItem.id));

    toast({
      title: "Item Deleted",
      description: `${currentEditItem.name} has been removed from inventory.`,
    });

    setIsConfirmDeleteOpen(false);
    setIsEditDialogOpen(false);
    setCurrentEditItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Stock Tracker</h1>
          <p className="text-muted-foreground">Manage and monitor dental supplies inventory</p>
        </div>

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
                Enter details for the new inventory item. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="itemName" className="text-right text-xs">Name *</Label>
                <div className="col-span-3">
                  <Select
                    value={newItem.name || undefined}
                    onValueChange={(value) => {
                      // Find the selected stock item
                      const selectedItem = stockItemsList.find(item => item.name === value);
                      if (selectedItem) {
                        // Update the selected item's sub-items
                        setSelectedItemSubItems(selectedItem.subItems || []);

                        // Update the form with the selected item's details
                        // Description is pre-populated but can be edited by the user
                        setNewItem({
                          ...newItem,
                          name: selectedItem.name,
                          subItem: selectedItem.subItems && selectedItem.subItems.length > 0 ? selectedItem.subItems[0] : '',
                          itemType: selectedItem.itemType as 'Consumable' | 'Inventory',
                          description: selectedItem.description || ''
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
                  <Select
                    value={newItem.subItem || undefined}
                    onValueChange={(value) => {
                      setNewItem({
                        ...newItem,
                        subItem: value
                      });
                    }}
                    disabled={selectedItemSubItems.length === 0}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={selectedItemSubItems.length === 0 ? "Select an item first" : "Select a sub-item"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedItemSubItems.map((subItem) => (
                        <SelectItem key={subItem} value={subItem}>
                          {subItem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="itemType" className="text-right text-xs">Item Type *</Label>
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
                <Label htmlFor="quantity" className="text-right text-xs">Quantity *</Label>
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
                <Label htmlFor="unit" className="text-right text-xs">Unit *</Label>
                <Input
                  id="unit"
                  value={newItem.unit}
                  onChange={(e) => {
                    // Capitalize the first letter
                    const value = e.target.value;
                    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
                    setNewItem({...newItem, unit: capitalizedValue});
                  }}
                  className="col-span-3 h-8"
                  placeholder="e.g., Pack, Bottle"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="threshold" className="text-right text-xs">Min. Threshold *</Label>
                <Input
                  id="threshold"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newItem.minimumThreshold === 0 && document.activeElement !== document.getElementById('threshold') ? '' : newItem.minimumThreshold}
                  onChange={(e) => {
                    // Only allow numeric input
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    const value = numericValue === '' ? 0 : parseInt(numericValue, 10);
                    setNewItem({...newItem, minimumThreshold: value});
                  }}
                  onFocus={(e) => {
                    if (newItem.minimumThreshold === 0) {
                      e.target.value = '';
                    }
                  }}
                  className="col-span-3 h-8"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="dealer" className="text-right text-xs">Dealer *</Label>
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
                <Label htmlFor="rate" className="text-right text-xs">Rate (₹) *</Label>
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
                <Label htmlFor="expiry" className="text-right text-xs">Expiry Date *</Label>
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update details for the inventory item. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            {currentEditItem && (
              <div className="grid gap-2 py-2">
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editItemName" className="text-right text-xs">Name *</Label>
                  <div className="col-span-3">
                    <Select
                      value={currentEditItem.name || undefined}
                      onValueChange={(value) => {
                        // Find the selected stock item
                        const selectedItem = stockItemsList.find(item => item.name === value);
                        if (selectedItem) {
                          // Update the selected item's sub-items
                          setEditSelectedItemSubItems(selectedItem.subItems || []);

                          // Update the form with the selected item's details
                          // Description is pre-populated but can be edited by the user
                          setCurrentEditItem({
                            ...currentEditItem,
                            name: selectedItem.name,
                            subItem: selectedItem.subItems && selectedItem.subItems.length > 0 ? selectedItem.subItems[0] : '',
                            itemType: selectedItem.itemType as 'Consumable' | 'Inventory',
                            description: selectedItem.description || ''
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
                    <Select
                      value={currentEditItem.subItem || undefined}
                      onValueChange={(value) => {
                        setCurrentEditItem({
                          ...currentEditItem,
                          subItem: value
                        });
                      }}
                      disabled={editSelectedItemSubItems.length === 0}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder={editSelectedItemSubItems.length === 0 ? "Select an item first" : "Select a sub-item"} />
                      </SelectTrigger>
                      <SelectContent>
                        {editSelectedItemSubItems.map((subItem) => (
                          <SelectItem key={subItem} value={subItem}>
                            {subItem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Label htmlFor="editItemType" className="text-right text-xs">Item Type *</Label>
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
                  <Label htmlFor="editQuantity" className="text-right text-xs">Quantity *</Label>
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
                  <Label htmlFor="editUnit" className="text-right text-xs">Unit *</Label>
                  <Input
                    id="editUnit"
                    value={currentEditItem.unit}
                    onChange={(e) => {
                      // Capitalize the first letter
                      const value = e.target.value;
                      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
                      setCurrentEditItem({...currentEditItem, unit: capitalizedValue});
                    }}
                    className="col-span-3 h-8"
                    placeholder="e.g., Pack, Bottle"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editThreshold" className="text-right text-xs">Min. Threshold *</Label>
                  <Input
                    id="editThreshold"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={currentEditItem.minimumThreshold === 0 && document.activeElement !== document.getElementById('editThreshold') ? '' : currentEditItem.minimumThreshold}
                    onChange={(e) => {
                      // Only allow numeric input
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      const value = numericValue === '' ? 0 : parseInt(numericValue, 10);
                      setCurrentEditItem({...currentEditItem, minimumThreshold: value});
                    }}
                    onFocus={(e) => {
                      if (currentEditItem.minimumThreshold === 0) {
                        e.target.value = '';
                      }
                    }}
                    className="col-span-3 h-8"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="editDealer" className="text-right text-xs">Dealer *</Label>
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
                  <Label htmlFor="editRate" className="text-right text-xs">Rate (₹) *</Label>
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
                  <Label htmlFor="editExpiry" className="text-right text-xs">Expiry Date *</Label>
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
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
              <div>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="mr-2">Cancel</Button>
                <Button onClick={handleUpdateConfirm}>Update</Button>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
            <div className="bg-amber-50 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Low Stock</div>
              <div className="text-2xl font-bold">{stockItems.filter(item => item.currentQuantity <= item.minimumThreshold).length}</div>
              <div className="text-xs text-muted-foreground">Items below minimum threshold</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-red-50 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Expiring Soon</div>
              <div className="text-2xl font-bold">{stockItems.filter(item => item.nearestExpiryDate && new Date(item.nearestExpiryDate) < new Date('2025-06-01')).length}</div>
              <div className="text-xs text-muted-foreground">Items expiring within 30 days</div>
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
                  <TabsTrigger value="low">Low Stock</TabsTrigger>
                  <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
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
            <Button
              variant="outline"
              className="flex gap-2 items-center"
              onClick={() => {
                // Create CSV content from the filtered and sorted data
                const headers = ['Item', 'Sub-item', 'Description', 'Item Type', 'Quantity', 'Unit', 'Dealer', 'Rate', 'Min Threshold', 'Expiry', 'Status', 'Date Added'];

                const csvContent = [
                  headers.join(','),
                  ...sortedAndFilteredItems.map((item: StockItem) => {
                    let status = 'OK';
                    if (isLowStock(item) && isExpiringSoon(item)) {
                      status = 'Low, Expiring';
                    } else if (isLowStock(item)) {
                      status = 'Low';
                    } else if (isExpiringSoon(item)) {
                      status = 'Expiring';
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
                      `"${item.nearestExpiryDate || ''}"`,
                      `"${status}"`,
                      `"${item.createdAt}"`
                    ].join(',');
                  })
                ].join('\n');

                // Create a blob and download link
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                // Create a temporary link and trigger download
                const link = document.createElement('a');
                const filename = `dental_stock_inventory_${new Date().toISOString().split('T')[0]}.csv`;

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
                      <TableRow key={item.id}>
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
                            {isLowStock(item) && (
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
                              {new Date(item.nearestExpiryDate).toLocaleDateString()}
                              {isExpiringSoon(item) && (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {isLowStock(item) && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Low
                              </Badge>
                            )}
                            {isExpiringSoon(item) && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Expiring
                              </Badge>
                            )}
                            {!isLowStock(item) && !isExpiringSoon(item) && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                OK
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                                <DropdownMenuItem onClick={() => handleIncomingStock(item.id)}>
                                  Record Incoming
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleConsumeStock(item.id)}>
                                  Record Consumption
                                </DropdownMenuItem>
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
    </div>
  );
};

export default StockTracker;
