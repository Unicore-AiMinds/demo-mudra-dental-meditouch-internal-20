import React, { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { usePatients } from '@/contexts/PatientContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the patient type
interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  dateOfBirth?: string;
  email: string | null;
  phone: string;
  altPhone?: string | null;
  address?: string;
  city?: string;
  pincode?: string;
  bloodGroup?: string;
  referredBy?: string;
  clinic: 'dental' | 'meditouch' | 'both';
  lastVisit: string;
}

interface AddPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: (patient: Patient) => void;
}

const AddPatientDialog: React.FC<AddPatientDialogProps> = ({
  isOpen,
  onClose,
  onPatientAdded
}) => {
  const { activeClinic } = useClinic();
  const { patients } = usePatients();
  const { toast } = useToast();
  const [isConfirmAddOpen, setIsConfirmAddOpen] = useState(false);
  const [useAgeInput, setUseAgeInput] = useState(true);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    pincode: '',
    bloodGroup: '',
    referredBy: '',
    clinic: activeClinic, // Set default clinic to current active clinic
    lastVisit: ''
  });

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      gender: '',
      age: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      altPhone: '',
      address: '',
      city: '',
      pincode: '',
      bloodGroup: '',
      referredBy: '',
      clinic: activeClinic, // Set default clinic to current active clinic
      lastVisit: ''
    });
    setUseAgeInput(true);
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Handle dialog close
  const handleDialogClose = () => {
    onClose();
    resetFormData();
  };

  // Handle add patient form submission
  const handleAddPatient = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Check required fields based on whether we're using age or DOB
    if (!formData.name || !formData.gender || !formData.phone || !formData.clinic) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number is exactly 10 digits
    if (!/^\d{10}$/.test(formData.phone)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Mobile number should be exactly 10 digits.",
        variant: "destructive",
      });
      return;
    }

    // Check age or DOB based on the selected option
    if (useAgeInput && !formData.age) {
      toast({
        title: "Missing Age",
        description: "Please enter the patient's age.",
        variant: "destructive",
      });
      return;
    }

    if (!useAgeInput && !formData.dateOfBirth) {
      toast({
        title: "Missing Date of Birth",
        description: "Please enter the patient's date of birth.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format if provided
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast({
          title: "Invalid Email Address",
          description: "Please enter a valid email address (e.g. name@example.com).",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for duplicate patient before showing confirmation
    const duplicatePatient = patients.find(existing =>
      existing.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
      existing.phone.trim() === formData.phone.trim() &&
      existing.gender.toLowerCase() === formData.gender.toLowerCase() &&
      existing.clinic.toLowerCase() === formData.clinic.toLowerCase()
    );

    if (duplicatePatient) {
      toast({
        title: "Duplicate Patient",
        description: `A patient with the same details already exists: ${duplicatePatient.name} (${duplicatePatient.patient_code || duplicatePatient.id})`,
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setIsConfirmAddOpen(true);
  };

  // Function to confirm adding a new patient
  const confirmAddPatient = () => {
    // Calculate age from DOB if DOB is used
    let calculatedAge = Number(formData.age);

    if (!useAgeInput && formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    // Create new patient object
    const newPatient = {
      id: `PT${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      name: formData.name,
      gender: formData.gender as 'male' | 'female' | 'other',
      age: calculatedAge,
      dateOfBirth: !useAgeInput ? formData.dateOfBirth : undefined,
      email: formData.email || null,
      phone: formData.phone,
      altPhone: formData.altPhone || null,
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      bloodGroup: formData.bloodGroup,
      referredBy: formData.referredBy,
      clinic: formData.clinic as 'dental' | 'meditouch' | 'both',
      lastVisit: formData.lastVisit || ''
    };

    // Close dialogs and show success message
    setIsConfirmAddOpen(false);
    onClose();

    toast({
      title: "Patient Added",
      description: `${formData.name} has been added to the patient registry.`,
    });

    // Call the callback if provided
    if (onPatientAdded) {
      onPatientAdded(newPatient);
    }

    // Reset the form
    resetFormData();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the patient details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPatient}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter patient's full name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.gender}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center space-x-4">
                    <Label>Age/DOB *</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="useAge"
                        name="ageOrDob"
                        checked={useAgeInput}
                        onChange={() => setUseAgeInput(true)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="useAge" className="cursor-pointer">Age</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="useDob"
                        name="ageOrDob"
                        checked={!useAgeInput}
                        onChange={() => setUseAgeInput(false)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="useDob" className="cursor-pointer">DOB</Label>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="space-y-2 flex-1">
                      {useAgeInput ? (
                        <>
                          <Label htmlFor="age">Age *</Label>
                          <Input
                            id="age"
                            type="number"
                            placeholder="Enter age"
                            value={formData.age}
                            onChange={handleFormChange}
                            required={useAgeInput}
                            className="h-10 w-full"
                          />
                        </>
                      ) : (
                        <>
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleFormChange}
                            required={!useAgeInput}
                            max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
                            className="h-10 w-full"
                          />
                        </>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="h-10 w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="flex">
                      <Select
                        defaultValue="+91"
                        value={phoneCountryCode}
                        onValueChange={setPhoneCountryCode}
                      >
                        <SelectTrigger className="w-[100px] rounded-r-none border-r-0 h-10">
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
                        id="phone"
                        className="rounded-l-none h-10 w-full"
                        placeholder="Contact Number"
                        value={formData.phone}
                        maxLength={10}
                        onChange={(e) => {
                          // Only allow digits
                          const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({...formData, phone: numericValue});
                        }}
                        required
                        pattern="\d{10}"
                        title="Please enter a valid 10-digit mobile number"
                      />
                    </div>
                    {formData.phone.length > 0 && formData.phone.length !== 10 && (
                      <p className="text-red-500 text-xs mt-1">Mobile number must be exactly 10 digits ({formData.phone.length}/10)</p>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="altPhone">Alternative Phone Number</Label>
                    <div className="flex">
                      <Select
                        defaultValue="+91"
                        value={phoneCountryCode}
                        onValueChange={setPhoneCountryCode}
                      >
                        <SelectTrigger className="w-[100px] rounded-r-none border-r-0 h-10">
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
                        id="altPhone"
                        className="rounded-l-none h-10 w-full"
                        placeholder="Alternative Contact Number"
                        value={formData.altPhone}
                        onChange={(e) => {
                          // Only allow digits
                          const numericValue = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, altPhone: numericValue});
                        }}
                        pattern="\d+"
                        title="Please enter only digits"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter patient's address"
                    value={formData.address}
                    onChange={handleFormChange}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    placeholder="Enter pincode"
                    value={formData.pincode}
                    onChange={handleFormChange}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <select
                    id="bloodGroup"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.bloodGroup}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referredBy">Referred By</Label>
                  <Input
                    id="referredBy"
                    placeholder="Enter referral source"
                    value={formData.referredBy}
                    onChange={handleFormChange}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic">Registered For *</Label>
                  <select
                    id="clinic"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.clinic}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Clinic</option>
                    <option value="dental" className={activeClinic === 'dental' ? 'font-bold' : ''}>
                      Dental Metrix {activeClinic === 'dental' ? '(Current)' : ''}
                    </option>
                    <option value="meditouch" className={activeClinic === 'meditouch' ? 'font-bold' : ''}>
                      Meditouch {activeClinic === 'meditouch' ? '(Current)' : ''}
                    </option>
                    <option value="both">Both Clinics</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastVisit">Last Visit</Label>
                  <Input
                    id="lastVisit"
                    type="date"
                    value={formData.lastVisit}
                    onChange={handleFormChange}
                    max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className={activeClinic === 'dental'
                  ? "bg-dental-primary hover:bg-dental-dark"
                  : "bg-meditouch-primary hover:bg-meditouch-dark"}
              >
                Add Patient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmAddOpen} onOpenChange={setIsConfirmAddOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Patient Addition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add {formData.name} to the patient registry?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddPatient}>
              Add Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddPatientDialog;
