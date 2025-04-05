import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Package, FileDown, Filter, X } from 'lucide-react';
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
  description: string;
  unit: string;
  currentQuantity: number;
  minimumThreshold: number;
  nearestExpiryDate?: string;
}

const StockTracker = () => {
  const { activeClinic, isDental } = useClinic();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: '1',
      name: 'Dental Composite',
      description: 'A2 Shade - Universal',
      unit: 'syringe',
      currentQuantity: 2,
      minimumThreshold: 5,
      nearestExpiryDate: '2025-08-15',
    },
    {
      id: '2',
      name: 'Impression Material',
      description: 'Alginate - Medium Set',
      unit: 'pack',
      currentQuantity: 3,
      minimumThreshold: 5,
      nearestExpiryDate: '2025-06-30',
    },
    {
      id: '3',
      name: 'Orthodontic Wire',
      description: '0.016 inch - NiTi',
      unit: 'spool',
      currentQuantity: 4,
      minimumThreshold: 6,
    },
    {
      id: '4',
      name: 'Dental Cement',
      description: 'Glass Ionomer - Light Cure',
      unit: 'bottle',
      currentQuantity: 8,
      minimumThreshold: 4,
      nearestExpiryDate: '2025-04-25',
    },
    {
      id: '5',
      name: 'Dental Burs',
      description: 'Diamond - Assorted',
      unit: 'pack',
      currentQuantity: 12,
      minimumThreshold: 5,
    },
    {
      id: '6',
      name: 'Topical Anesthetic',
      description: 'Benzocaine 20%',
      unit: 'jar',
      currentQuantity: 6,
      minimumThreshold: 3,
      nearestExpiryDate: '2024-09-10',
    },
    {
      id: '7',
      name: 'Face Masks',
      description: 'Surgical - Level 3',
      unit: 'box',
      currentQuantity: 15,
      minimumThreshold: 5,
    },
  ]);

  const [newItem, setNewItem] = useState<Omit<StockItem, 'id'>>({
    name: '',
    description: '',
    unit: '',
    currentQuantity: 0,
    minimumThreshold: 0,
    nearestExpiryDate: undefined
  });

  if (!isDental) {
    navigate('/dashboard');
  }

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'low' && item.currentQuantity <= item.minimumThreshold) return matchesSearch;
    if (filterStatus === 'expiring' && item.nearestExpiryDate && new Date(item.nearestExpiryDate) < new Date('2025-06-01')) return matchesSearch;
    
    return false;
  });

  const isLowStock = (item: StockItem) => item.currentQuantity <= item.minimumThreshold;
  const isExpiringSoon = (item: StockItem) => item.nearestExpiryDate && new Date(item.nearestExpiryDate) < new Date('2025-06-01');

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
      description: '',
      unit: '',
      currentQuantity: 0,
      minimumThreshold: 0,
      nearestExpiryDate: undefined
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
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <Package className="h-4 w-4 mr-2 text-dental-primary" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockItems.length}</div>
              <p className="text-xs text-muted-foreground">Across {new Set(stockItems.map(item => item.unit)).size} categories</p>
            </CardContent>
          </Card>
          
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockItems.filter(item => item.currentQuantity <= item.minimumThreshold).length}</div>
              <p className="text-xs text-muted-foreground">Items below minimum threshold</p>
            </CardContent>
          </Card>
          
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockItems.filter(item => item.nearestExpiryDate && new Date(item.nearestExpiryDate) < new Date('2025-06-01')).length}</div>
              <p className="text-xs text-muted-foreground">Items expiring within 30 days</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:w-3/4">
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
                
                <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="low">Low Stock</TabsTrigger>
                    <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button variant="outline" className="flex gap-2 items-center">
                  <FileDown className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
              
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden sm:table-cell">Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="hidden md:table-cell">Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No items match your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
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
                                <DropdownMenuItem>Edit Item</DropdownMenuItem>
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
      </div>
    </div>
  );
};

export default StockTracker;
