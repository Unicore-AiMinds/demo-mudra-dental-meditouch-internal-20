import React, { useState } from 'react';
import { useDentalLabs, DentalLab } from '@/contexts/DentalLabsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const LabsTab: React.FC = () => {
  const { dentalLabs, isLoading, addLab, updateLab, deleteLab, refreshLabs } = useDentalLabs();
  const { toast } = useToast();

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // State for form fields
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [contactCountryCode, setContactCountryCode] = useState('+91');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [specialization, setSpecialization] = useState('');

  // State for editing
  const [editingLab, setEditingLab] = useState<DentalLab | null>(null);

  // Reset form fields
  const resetForm = () => {
    setName('');
    setContact('');
    setContactCountryCode('+91');
    setAddress('');
    setCity('');
    setPincode('');
    setSpecialization('');
  };

  // Handle opening the add dialog
  const handleAddDialogOpen = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Handle opening the edit dialog
  const handleEditDialogOpen = (lab: DentalLab) => {
    setEditingLab(lab);
    setName(lab.name);

    // Parse contact number to extract country code if it exists
    if (lab.contact && lab.contact.startsWith('+')) {
      const parts = lab.contact.split(' ');
      if (parts.length > 1) {
        setContactCountryCode(parts[0]);
        setContact(parts.slice(1).join(' '));
      } else {
        setContact(lab.contact);
        setContactCountryCode('+91');
      }
    } else {
      setContact(lab.contact);
      setContactCountryCode('+91');
    }

    setAddress(lab.address || '');
    setCity(lab.city || '');
    setPincode(lab.pincode || '');
    setSpecialization(lab.specialization || '');
    setIsEditDialogOpen(true);
  };

  // Handle opening the delete dialog
  const handleDeleteDialogOpen = (lab: DentalLab) => {
    setEditingLab(lab);
    setIsDeleteDialogOpen(true);
  };

  // Handle adding a new lab
  const handleAddLab = async () => {
    if (!name || !contact) {
      toast({
        title: 'Validation Error',
        description: 'Name and contact are required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Format the contact number with country code
      const formattedContact = `${contactCountryCode} ${contact.trim()}`;

      await addLab({
        name,
        contact: formattedContact,
        address,
        city,
        pincode,
        specialization,
      });
      setIsAddDialogOpen(false);
      resetForm();
      await refreshLabs();
    } catch (error) {
      console.error('Error adding lab:', error);
    }
  };

  // Handle updating a lab
  const handleUpdateLab = async () => {
    if (!editingLab || !name || !contact) {
      toast({
        title: 'Validation Error',
        description: 'Name and contact are required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Format the contact number with country code
      const formattedContact = `${contactCountryCode} ${contact.trim()}`;

      await updateLab(editingLab.id, {
        name,
        contact: formattedContact,
        address,
        city,
        pincode,
        specialization,
      });
      setIsEditDialogOpen(false);
      setIsConfirmDialogOpen(false);
      resetForm();
      await refreshLabs();
    } catch (error) {
      console.error('Error updating lab:', error);
    }
  };

  // Handle deleting a lab
  const handleDeleteLab = async () => {
    if (!editingLab) return;

    try {
      await deleteLab(editingLab.id);
      setIsDeleteDialogOpen(false);
      await refreshLabs();
    } catch (error) {
      console.error('Error deleting lab:', error);
    }
  };

  // Confirm update
  const confirmUpdate = () => {
    setIsEditDialogOpen(false);
    setIsConfirmDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading labs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Dental Labs</CardTitle>
            <CardDescription>Manage dental labs for lab work assignments</CardDescription>
          </div>
          <Button onClick={handleAddDialogOpen} className="bg-dental-primary hover:bg-dental-dark">
            <Plus className="h-4 w-4 mr-2" /> Add Lab
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {dentalLabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Labs Found</h3>
            <p className="text-muted-foreground mt-2">
              Add dental labs to assign lab work to them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dentalLabs.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-medium">{lab.name}</TableCell>
                    <TableCell>{lab.contact}</TableCell>
                    <TableCell>{lab.address}</TableCell>
                    <TableCell>{lab.city}</TableCell>
                    <TableCell>{lab.specialization}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditDialogOpen(lab)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteDialogOpen(lab)}
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

        {/* Add Lab Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Dental Lab</DialogTitle>
              <DialogDescription>
                Enter the details of the dental lab to add it to your system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Lab Name*</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter lab name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact" className="flex items-center">
                    Contact Number <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex">
                    <Select
                      defaultValue="+91"
                      value={contactCountryCode}
                      onValueChange={setContactCountryCode}
                    >
                      <SelectTrigger className="w-[100px] rounded-r-none border-r-0">
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
                      className="rounded-l-none"
                      value={contact}
                      onChange={(e) => {
                        // Only allow digits
                        const numericValue = e.target.value.replace(/\D/g, '');
                        setContact(numericValue);
                      }}
                      placeholder="Contact Number"
                      required
                      pattern="\d+"
                      title="Please enter only digits"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter lab address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter pincode"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="E.g., Crowns & Bridges, Dentures, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLab} className="bg-dental-primary hover:bg-dental-dark">
                Add Lab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Lab Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Dental Lab</DialogTitle>
              <DialogDescription>
                Update the details of the selected dental lab.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Lab Name*</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter lab name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact" className="flex items-center">
                    Contact Number <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex">
                    <Select
                      value={contactCountryCode}
                      onValueChange={setContactCountryCode}
                    >
                      <SelectTrigger className="w-[100px] rounded-r-none border-r-0">
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
                      className="rounded-l-none"
                      value={contact}
                      onChange={(e) => {
                        // Only allow digits
                        const numericValue = e.target.value.replace(/\D/g, '');
                        setContact(numericValue);
                      }}
                      placeholder="Contact Number"
                      required
                      pattern="\d+"
                      title="Please enter only digits"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter lab address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pincode">Pincode</Label>
                  <Input
                    id="edit-pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter pincode"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="E.g., Crowns & Bridges, Dentures, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmUpdate} className="bg-dental-primary hover:bg-dental-dark">
                Update Lab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Update Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to update this dental lab?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLab} className="bg-dental-primary hover:bg-dental-dark">
                Confirm Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Lab Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Dental Lab</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {editingLab?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeleteLab} variant="destructive">
                Delete Lab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LabsTab;
