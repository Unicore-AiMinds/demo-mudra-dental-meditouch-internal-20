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

interface StockItem {
  id: string;
  name: string;
  subItem?: string;
  itemType: 'Consumable' | 'Inventory';
  dealer?: string;
  description: string;
  unit: string;
  currentQuantity: number;
  minimumThreshold: number;
  nearestExpiryDate?: string;
  createdAt: string; // Date when the item was added to inventory
}

const StockTracker = () => {
  const { activeClinic, isDental } = useClinic();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterItemType, setFilterItemType] = useState('all'); // 'all', 'Consumable', or 'Inventory'
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<StockItem | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: '1',
      name: 'Dental Composite',
      subItem: 'Filtek Supreme Ultra',
      itemType: 'Consumable',
      dealer: 'Dental Depot',
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
    if (!newItem.name || !newItem.unit) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields.",
        variant: "destructive"
      });
      return;
    }

    const newId = `${stockItems.length + 1}`;
    const itemToAdd = { id: newId, ...newItem };

    setStockItems(prev => [...prev, itemToAdd]);
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to inventory.`,
    });

    setNewItem({
      name: '',
      subItem: '',
      itemType: 'Consumable',
      dealer: '',
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
    setIsEditDialogOpen(true);
  };

  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleUpdateConfirm = () => {
    setIsConfirmUpdateOpen(true);
  };

  const handleUpdateItem = () => {
    if (!currentEditItem) return;

    if (!currentEditItem.name || !currentEditItem.unit) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields.",
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Enter details for the new inventory item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="itemName" className="text-right">Name</Label>
                <Input
                  id="itemName"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Item name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subItem" className="text-right">Sub-item</Label>
                <Input
                  id="subItem"
                  value={newItem.subItem}
                  onChange={(e) => setNewItem({...newItem, subItem: e.target.value})}
                  className="col-span-3"
                  placeholder="Sub-item or brand name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="itemType" className="text-right">Item Type</Label>
                <div className="col-span-3 flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="consumable"
                      name="itemType"
                      value="Consumable"
                      checked={newItem.itemType === 'Consumable'}
                      onChange={() => setNewItem({...newItem, itemType: 'Consumable'})}
                      className="mr-2"
                    />
                    <label htmlFor="consumable">Consumable</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="inventory"
                      name="itemType"
                      value="Inventory"
                      checked={newItem.itemType === 'Inventory'}
                      onChange={() => setNewItem({...newItem, itemType: 'Inventory'})}
                      className="mr-2"
                    />
                    <label htmlFor="inventory">Inventory</label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dealer" className="text-right">Dealer</Label>
                <Input
                  id="dealer"
                  value={newItem.dealer}
                  onChange={(e) => setNewItem({...newItem, dealer: e.target.value})}
                  className="col-span-3"
                  placeholder="Supplier or dealer name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="col-span-3"
                  placeholder="Item description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit</Label>
                <Input
                  id="unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                  className="col-span-3"
                  placeholder="e.g., pack, bottle"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newItem.currentQuantity}
                  onChange={(e) => setNewItem({...newItem, currentQuantity: Number(e.target.value)})}
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="threshold" className="text-right">Min. Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newItem.minimumThreshold}
                  onChange={(e) => setNewItem({...newItem, minimumThreshold: Number(e.target.value)})}
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiry" className="text-right">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newItem.nearestExpiryDate}
                  onChange={(e) => setNewItem({...newItem, nearestExpiryDate: e.target.value})}
                  className="col-span-3"
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update details for the inventory item.
              </DialogDescription>
            </DialogHeader>
            {currentEditItem && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editItemName" className="text-right">Name</Label>
                  <Input
                    id="editItemName"
                    value={currentEditItem.name}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Item name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSubItem" className="text-right">Sub-item</Label>
                  <Input
                    id="editSubItem"
                    value={currentEditItem.subItem || ''}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, subItem: e.target.value})}
                    className="col-span-3"
                    placeholder="Sub-item or brand name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editItemType" className="text-right">Item Type</Label>
                  <div className="col-span-3 flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="editConsumable"
                        name="editItemType"
                        value="Consumable"
                        checked={currentEditItem.itemType === 'Consumable'}
                        onChange={() => setCurrentEditItem({...currentEditItem, itemType: 'Consumable'})}
                        className="mr-2"
                      />
                      <label htmlFor="editConsumable">Consumable</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="editInventory"
                        name="editItemType"
                        value="Inventory"
                        checked={currentEditItem.itemType === 'Inventory'}
                        onChange={() => setCurrentEditItem({...currentEditItem, itemType: 'Inventory'})}
                        className="mr-2"
                      />
                      <label htmlFor="editInventory">Inventory</label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDealer" className="text-right">Dealer</Label>
                  <Input
                    id="editDealer"
                    value={currentEditItem.dealer || ''}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, dealer: e.target.value})}
                    className="col-span-3"
                    placeholder="Supplier or dealer name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDescription" className="text-right">Description</Label>
                  <Input
                    id="editDescription"
                    value={currentEditItem.description}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Item description"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editUnit" className="text-right">Unit</Label>
                  <Input
                    id="editUnit"
                    value={currentEditItem.unit}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, unit: e.target.value})}
                    className="col-span-3"
                    placeholder="e.g., pack, bottle"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editQuantity" className="text-right">Quantity</Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    value={currentEditItem.currentQuantity}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, currentQuantity: Number(e.target.value)})}
                    className="col-span-3"
                    min="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editThreshold" className="text-right">Min. Threshold</Label>
                  <Input
                    id="editThreshold"
                    type="number"
                    value={currentEditItem.minimumThreshold}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, minimumThreshold: Number(e.target.value)})}
                    className="col-span-3"
                    min="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editExpiry" className="text-right">Expiry Date</Label>
                  <Input
                    id="editExpiry"
                    type="date"
                    value={currentEditItem.nearestExpiryDate || ''}
                    onChange={(e) => setCurrentEditItem({...currentEditItem, nearestExpiryDate: e.target.value})}
                    className="col-span-3"
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
                const headers = ['Item', 'Sub-item', 'Item Type', 'Dealer', 'Description', 'Quantity', 'Unit', 'Min Threshold', 'Expiry', 'Status', 'Date Added'];

                const csvContent = [
                  headers.join(','),
                  ...sortedAndFilteredItems.map((item: StockItem) => {
                    const status = isLowStock(item) ? 'Low' : isExpiringSoon(item) ? 'Expiring' : 'OK';
                    return [
                      `"${item.name}"`,
                      `"${item.subItem || ''}"`,
                      `"${item.itemType}"`,
                      `"${item.dealer || ''}"`,
                      `"${item.description}"`,
                      item.currentQuantity,
                      `"${item.unit}"`,
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

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden md:table-cell">Sub-item</TableHead>
                  <TableHead className="hidden md:table-cell">Item Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Dealer</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="hidden md:table-cell">Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No items match your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredItems.map((item: StockItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.subItem || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={item.itemType === 'Consumable' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-teal-50 text-teal-700 border-teal-200'}>
                          {item.itemType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{item.dealer || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{item.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{item.currentQuantity} {item.unit}{item.currentQuantity !== 1 ? 's' : ''}</span>
                          {isLowStock(item) && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
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
                        {isLowStock(item) ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Low
                          </Badge>
                        ) : isExpiringSoon(item) ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Expiring
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            OK
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem onClick={() => handleEditItem(item)}>Edit Item</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockTracker;
