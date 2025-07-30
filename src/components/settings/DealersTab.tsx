import React, { useState } from 'react';
import { useDealers, Dealer } from '@/contexts/DealersContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, AlertCircle, User } from 'lucide-react';
import { capitalizeWords } from '@/utils/string-utils';

const DealersTab: React.FC = () => {
  const { dealers, isLoading, addDealer, updateDealer, deleteDealer } = useDealers();
  const { toast } = useToast();
  
  console.log('DealersTab: dealers =', dealers);
  console.log('DealersTab: isLoading =', isLoading);

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentDealer, setCurrentDealer] = useState<Dealer | null>(null);

  // State for new dealer form
  const [newDealerName, setNewDealerName] = useState('');
  const [newDealerEmail, setNewDealerEmail] = useState('');
  const [newDealerContact, setNewDealerContact] = useState('');
  const [newDealerContactCountryCode, setNewDealerContactCountryCode] = useState('+91');
  const [newDealerAddress, setNewDealerAddress] = useState('');
  const [newDealerCity, setNewDealerCity] = useState('');
  const [newDealerPincode, setNewDealerPincode] = useState('');
  const [newDealerClinicType, setNewDealerClinicType] = useState<'dental' | 'meditouch' | 'both'>('dental');

  // Reset form fields
  const resetForm = () => {
    setNewDealerName('');
    setNewDealerEmail('');
    setNewDealerContact('');
    setNewDealerContactCountryCode('+91');
    setNewDealerAddress('');
    setNewDealerCity('');
    setNewDealerPincode('');
    setNewDealerClinicType('dental');
  };

  // Handle add dialog open
  const handleAddDialogOpen = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Handle add dealer
  const handleAddItem = async () => {
    if (!newDealerName || !newDealerContact) {
      toast({
        title: "Validation Error",
        description: "Name and contact are required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format if provided
    if (newDealerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newDealerEmail.trim())) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }
    }

    // Validate contact number (only digits)
    if (!/^\d+$/.test(newDealerContact.trim())) {
      toast({
        title: "Validation Error",
        description: "Contact number should contain only digits.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Format the contact number with country code
      const formattedContact = `${newDealerContactCountryCode} ${newDealerContact.trim()}`;

      // Create the new dealer object
      const newDealer = {
        name: capitalizeWords(newDealerName.trim()),
        email: newDealerEmail.trim() || null,
        contact: formattedContact,
        address: newDealerAddress.trim() || null,
        city: capitalizeWords(newDealerCity.trim()) || null,
        pincode: newDealerPincode.trim() || null,
        clinic_type: newDealerClinicType
      };

      await addDealer(newDealer);
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding dealer:', error);
    }
  };

  // Handle edit dealer
  const handleEditItem = (dealer: Dealer) => {
    setCurrentDealer(dealer);

    // Extract country code from contact number if it exists
    if (dealer.contact && dealer.contact.startsWith('+')) {
      const parts = dealer.contact.split(' ');
      if (parts.length > 1) {
        setNewDealerContactCountryCode(parts[0]);
        setNewDealerContact(parts.slice(1).join(' '));
      } else {
        setNewDealerContact(dealer.contact);
        setNewDealerContactCountryCode('+91');
      }
    } else {
      setNewDealerContact(dealer.contact || '');
      setNewDealerContactCountryCode('+91');
    }

    setNewDealerName(dealer.name || '');
    setNewDealerEmail(dealer.email || '');
    setNewDealerAddress(dealer.address || '');
    setNewDealerCity(dealer.city || '');
    setNewDealerPincode(dealer.pincode || '');
    setNewDealerClinicType(dealer.clinic_type || 'dental');

    setIsEditDialogOpen(true);
  };

  // Handle update dealer
  const handleUpdateItem = async () => {
    if (!currentDealer) return;

    if (!newDealerName || !newDealerContact) {
      toast({
        title: "Validation Error",
        description: "Name and contact are required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format if provided
    if (newDealerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newDealerEmail.trim())) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }
    }

    // Validate contact number (only digits)
    if (!/^\d+$/.test(newDealerContact.trim())) {
      toast({
        title: "Validation Error",
        description: "Contact number should contain only digits.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Format the contact number with country code
      const formattedContact = `${newDealerContactCountryCode} ${newDealerContact.trim()}`;

      // Create the updated dealer object
      const updatedDealer = {
        name: capitalizeWords(newDealerName.trim()),
        email: newDealerEmail.trim() || null,
        contact: formattedContact,
        address: newDealerAddress.trim() || null,
        city: capitalizeWords(newDealerCity.trim()) || null,
        pincode: newDealerPincode.trim() || null,
        clinic_type: newDealerClinicType
      };

      await updateDealer(currentDealer.id, updatedDealer);
      setIsConfirmDialogOpen(false);
      setIsEditDialogOpen(false);
      setCurrentDealer(null);
    } catch (error) {
      console.error('Error updating dealer:', error);
    }
  };

  // Handle delete dealer
  const handleDeleteItem = async () => {
    if (!currentDealer) return;

    try {
      await deleteDealer(currentDealer.id);
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      setCurrentDealer(null);
    } catch (error) {
      console.error('Error deleting dealer:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Manage Dealers
          </CardTitle>
          <CardDescription>
            Add and manage dealers for Dental Metrix Clinic
          </CardDescription>
        </div>
        <Button onClick={handleAddDialogOpen}>
          <Plus className="mr-2 h-4 w-4" /> Add Dealer
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading dealers...</p>
          </div>
        ) : dealers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Dealers Found</h3>
            <p className="text-muted-foreground mt-2">
              Add dealers to manage your inventory suppliers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealers.map((dealer) => (
                  <TableRow key={dealer.id}>
                    <TableCell className="font-medium">{dealer.name}</TableCell>
                    <TableCell>{dealer.email || '-'}</TableCell>
                    <TableCell>{dealer.contact}</TableCell>
                    <TableCell>{dealer.address || '-'}</TableCell>
                    <TableCell>{dealer.city || '-'}</TableCell>
                    <TableCell>{dealer.pincode || '-'}</TableCell>
                    <TableCell>
                      {dealer.clinic_type === 'dental' ? 'Dental Matrix' : 
                       dealer.clinic_type === 'meditouch' ? 'Meditouch' : 
                       dealer.clinic_type === 'both' ? 'Both Clinics' : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditItem(dealer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setCurrentDealer(dealer);
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
          </div>
        )}
      </CardContent>

      {/* Add Dealer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Dealer</DialogTitle>
            <DialogDescription>
              Enter the details of the new dealer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                value={newDealerName}
                onChange={(e) => setNewDealerName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newDealerEmail}
                onChange={(e) => setNewDealerEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact*
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newDealerContactCountryCode}
                  onValueChange={setNewDealerContactCountryCode}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="+91" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91 (IN)</SelectItem>
                    <SelectItem value="+1">+1 (US)</SelectItem>
                    <SelectItem value="+44">+44 (UK)</SelectItem>
                    <SelectItem value="+61">+61 (AU)</SelectItem>
                    <SelectItem value="+971">+971 (UAE)</SelectItem>
                    <SelectItem value="+65">+65 (SG)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="contact"
                  value={newDealerContact}
                  onChange={(e) => setNewDealerContact(e.target.value)}
                  className="flex-1"
                  placeholder="Contact Number"
                  pattern="\d+"
                  title="Please enter only digits"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                value={newDealerAddress}
                onChange={(e) => setNewDealerAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                City
              </Label>
              <Input
                id="city"
                value={newDealerCity}
                onChange={(e) => setNewDealerCity(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pincode" className="text-right">
                Pincode
              </Label>
              <Input
                id="pincode"
                value={newDealerPincode}
                onChange={(e) => setNewDealerPincode(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clinic-type" className="text-right">
                Clinic*
              </Label>
              <Select
                value={newDealerClinicType}
                onValueChange={(value: 'dental' | 'meditouch' | 'both') => setNewDealerClinicType(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select clinic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dental">Dental Matrix</SelectItem>
                  <SelectItem value="meditouch">Meditouch</SelectItem>
                  <SelectItem value="both">Both Clinics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Dealer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dealer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dealer</DialogTitle>
            <DialogDescription>
              Update the dealer's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name*
              </Label>
              <Input
                id="edit-name"
                value={newDealerName}
                onChange={(e) => setNewDealerName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={newDealerEmail}
                onChange={(e) => setNewDealerEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contact" className="text-right">
                Contact*
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newDealerContactCountryCode}
                  onValueChange={setNewDealerContactCountryCode}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="+91" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91 (IN)</SelectItem>
                    <SelectItem value="+1">+1 (US)</SelectItem>
                    <SelectItem value="+44">+44 (UK)</SelectItem>
                    <SelectItem value="+61">+61 (AU)</SelectItem>
                    <SelectItem value="+971">+971 (UAE)</SelectItem>
                    <SelectItem value="+65">+65 (SG)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="edit-contact"
                  value={newDealerContact}
                  onChange={(e) => setNewDealerContact(e.target.value)}
                  className="flex-1"
                  placeholder="Contact Number"
                  pattern="\d+"
                  title="Please enter only digits"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Address
              </Label>
              <Input
                id="edit-address"
                value={newDealerAddress}
                onChange={(e) => setNewDealerAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-city" className="text-right">
                City
              </Label>
              <Input
                id="edit-city"
                value={newDealerCity}
                onChange={(e) => setNewDealerCity(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-pincode" className="text-right">
                Pincode
              </Label>
              <Input
                id="edit-pincode"
                value={newDealerPincode}
                onChange={(e) => setNewDealerPincode(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-clinic-type" className="text-right">
                Clinic*
              </Label>
              <Select
                value={newDealerClinicType}
                onValueChange={(value: 'dental' | 'meditouch' | 'both') => setNewDealerClinicType(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select clinic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dental">Dental Matrix</SelectItem>
                  <SelectItem value="meditouch">Meditouch</SelectItem>
                  <SelectItem value="both">Both Clinics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsConfirmDialogOpen(true)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Update Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to save these changes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>
              Save Changes
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
              This will permanently delete the dealer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DealersTab;
