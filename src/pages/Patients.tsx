
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinic } from '@/contexts/ClinicContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useToast } from "@/hooks/use-toast";
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

import {
  Plus,
  Phone,
  Mail,
  CalendarRange,
  Eye,
  Edit,
  Trash,
  ArrowUpDown,
  ChevronDown,
  X,
  Search,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  dateOfBirth?: string; // Store DOB as string in YYYY-MM-DD format
  email: string | null;
  phone: string;
  altPhone?: string | null; // Alternative phone number (optional)
  address?: string; // Now optional as we'll use structured address
  city?: string;
  pincode?: string;
  bloodGroup?: string;
  referredBy?: string;
  clinic: 'dental' | 'meditouch' | 'both';
  lastVisit: string | '';
}

const demoPatients: Patient[] = [
  {
    id: "PT001",
    name: "Aarav Sharma",
    gender: "male",
    age: 34,
    dateOfBirth: "1989-05-15", // Added DOB
    email: "aarav.sharma@example.com",
    phone: "9876543210",
    altPhone: "9876543211",
    address: "123 Modi Street",
    city: "Mumbai",
    pincode: "400001",
    bloodGroup: "O+",
    referredBy: "Dr. Khanna",
    clinic: "both",
    lastVisit: "2023-10-15"
  },
  {
    id: "PT002",
    name: "Priya Patel",
    gender: "female",
    age: 28,
    email: "priya.patel@example.com",
    phone: "8765432109",
    altPhone: null,
    address: "456 Gandhi Road",
    city: "Delhi",
    pincode: "110001",
    bloodGroup: "A+",
    referredBy: "Dr. Sharma",
    clinic: "meditouch",
    lastVisit: "2023-10-12"
  },
  {
    id: "PT003",
    name: "Vikram Singh",
    gender: "male",
    age: 45,
    dateOfBirth: "1978-09-23", // Added DOB
    email: null,
    phone: "7654321098",
    altPhone: "7654321099",
    address: "789 Nehru Avenue",
    city: "Chennai",
    pincode: "600001",
    bloodGroup: "B-",
    referredBy: "Patient Referral",
    clinic: "dental",
    lastVisit: "2023-10-08"
  },
  {
    id: "PT004",
    name: "Neha Kapoor",
    gender: "female",
    age: 31,
    email: "neha.kapoor@example.com",
    phone: "6543210987",
    address: "234 Tagore Lane",
    city: "Bangalore",
    pincode: "560001",
    bloodGroup: "AB+",
    referredBy: "Website",
    clinic: "dental",
    lastVisit: "2023-09-30"
  },
  {
    id: "PT005",
    name: "Rajiv Malhotra",
    gender: "male",
    age: 52,
    email: "rajiv.malhotra@example.com",
    phone: "5432109876",
    altPhone: "5432109877",
    address: "567 Bose Street",
    city: "Hyderabad",
    pincode: "500001",
    bloodGroup: "A-",
    referredBy: "Dr. Patel",
    clinic: "both",
    lastVisit: "2023-10-02"
  },
  {
    id: "PT006",
    name: "Ananya Reddy",
    gender: "female",
    age: 25,
    email: "ananya.reddy@example.com",
    phone: "4321098765",
    address: "890 Raman Road",
    city: "Pune",
    pincode: "411001",
    bloodGroup: "O-",
    referredBy: "Family Member",
    clinic: "meditouch",
    lastVisit: "2023-10-10"
  },
  {
    id: "PT007",
    name: "Arjun Nair",
    gender: "male",
    age: 38,
    email: null,
    phone: "3210987654",
    altPhone: "3210987655",
    address: "123 Krishnan Street",
    city: "Kochi",
    pincode: "682001",
    bloodGroup: "B+",
    referredBy: "Social Media",
    clinic: "dental",
    lastVisit: "2023-09-25"
  },
  {
    id: "PT008",
    name: "Divya Menon",
    gender: "female",
    age: 29,
    email: "divya.menon@example.com",
    phone: "2109876543",
    address: "456 Patel Road",
    city: "Ahmedabad",
    pincode: "380001",
    bloodGroup: "AB-",
    referredBy: "Dr. Sharma",
    clinic: "both",
    lastVisit: "2023-10-05"
  }
];

const getClinicBadge = (clinic: Patient['clinic'], activeClinic: 'dental' | 'meditouch') => {
  if (clinic === 'both') {
    return (
      <Badge variant="outline" className="border-purple-400 text-purple-600">
        Both Clinics
      </Badge>
    );
  }

  if (clinic === 'dental') {
    return (
      <Badge variant="outline" className={activeClinic === 'dental' ? 'border-dental-primary text-dental-primary' : ''}>
        Dental Metrix
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={activeClinic === 'meditouch' ? 'border-meditouch-primary text-meditouch-primary' : ''}>
      Meditouch
    </Badge>
  );
};



const Patients = () => {
  const { activeClinic } = useClinic();
  const navigate = useNavigate();
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [isEditPatientDialogOpen, setIsEditPatientDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmAddOpen, setIsConfirmAddOpen] = useState(false);
  const [currentEditPatient, setCurrentEditPatient] = useState<Patient | null>(null);
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState("+91");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "id", desc: true } // Sort by ID descending to show newest records first
  ]);
  const [currentTab, setCurrentTab] = useState<string>("all");
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>(demoPatients);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [searchValue, setSearchValue] = useState("");

  // These useEffect hooks were used for debugging and have been removed

  // State to track whether to use DOB or Age input
  const [useAgeInput, setUseAgeInput] = useState(true);
  const [editUseAgeInput, setEditUseAgeInput] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    altPhone: '', // Added alternative phone
    address: '',
    city: '',
    pincode: '',
    bloodGroup: '',
    referredBy: '',
    clinic: '',
    lastVisit: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    gender: '',
    age: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    altPhone: '', // Added alternative phone
    address: '',
    city: '',
    pincode: '',
    bloodGroup: '',
    referredBy: '',
    clinic: '',
    lastVisit: ''
  });

  // Direct function to reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      gender: '',
      age: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      altPhone: '', // Added alternative phone
      address: '',
      city: '',
      pincode: '',
      bloodGroup: '',
      referredBy: '',
      clinic: '',
      lastVisit: ''
    });
    setUseAgeInput(true); // Reset to age input by default
  };

  // Direct function to reset edit form data
  const resetEditFormData = () => {
    setEditFormData({
      name: '',
      gender: '',
      age: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      altPhone: '', // Added alternative phone
      address: '',
      city: '',
      pincode: '',
      bloodGroup: '',
      referredBy: '',
      clinic: '',
      lastVisit: ''
    });
    setCurrentEditPatient(null);
    setEditPhoneCountryCode("+91");
    setEditUseAgeInput(true); // Reset to age input by default
  };

  // Direct function to handle edit patient click
  const handleEditPatientClick = (patient: Patient) => {
    console.log('Editing patient:', patient);
    setCurrentEditPatient(patient);

    // Set default country code
    setEditPhoneCountryCode("+91");

    // Determine if we should use age or DOB based on available data
    const hasDateOfBirth = !!patient.dateOfBirth;
    setEditUseAgeInput(!hasDateOfBirth);

    setEditFormData({
      name: patient.name,
      gender: patient.gender,
      age: patient.age.toString(),
      dateOfBirth: patient.dateOfBirth || '',
      email: patient.email || '',
      phone: patient.phone,
      altPhone: patient.altPhone || '', // Added alternative phone
      address: patient.address || '',
      city: patient.city || '',
      pincode: patient.pincode || '',
      bloodGroup: patient.bloodGroup || '',
      referredBy: patient.referredBy || '',
      clinic: patient.clinic,
      lastVisit: patient.lastVisit || ''
    });

    setIsEditPatientDialogOpen(true);
  };

  // Direct function to handle edit form change
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditFormData(prev => ({ ...prev, [id]: value }));
  };

  // Direct function to handle update patient
  const handleUpdatePatient = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!currentEditPatient) return;

    // Check required fields based on whether we're using age or DOB
    if (!editFormData.name || !editFormData.gender || !editFormData.phone || !editFormData.clinic) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check age or DOB based on the selected option
    if (editUseAgeInput && !editFormData.age) {
      toast({
        title: "Missing Age",
        description: "Please enter the patient's age.",
        variant: "destructive",
      });
      return;
    }

    if (!editUseAgeInput && !editFormData.dateOfBirth) {
      toast({
        title: "Missing Date of Birth",
        description: "Please enter the patient's date of birth.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirmUpdateOpen(true);
  };

  // Direct function to update a patient
  const confirmUpdatePatient = () => {
    if (!currentEditPatient) return;

    // Calculate age from DOB if DOB is used
    let calculatedAge = Number(editFormData.age);

    if (!editUseAgeInput && editFormData.dateOfBirth) {
      const birthDate = new Date(editFormData.dateOfBirth);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    const updatedPatient: Patient = {
      ...currentEditPatient,
      name: editFormData.name,
      gender: editFormData.gender as 'male' | 'female' | 'other',
      age: calculatedAge,
      dateOfBirth: !editUseAgeInput ? editFormData.dateOfBirth : undefined,
      email: editFormData.email || null,
      phone: editFormData.phone,
      altPhone: editFormData.altPhone || null, // Added alternative phone
      address: editFormData.address,
      city: editFormData.city,
      pincode: editFormData.pincode,
      bloodGroup: editFormData.bloodGroup,
      referredBy: editFormData.referredBy,
      clinic: editFormData.clinic as 'dental' | 'meditouch' | 'both',
      lastVisit: editFormData.lastVisit || ''
    };

    console.log('Updating patient:', updatedPatient);

    // Create a new array with the updated patient
    const updatedPatients = patients.map(p =>
      p.id === currentEditPatient.id ? updatedPatient : p
    );

    // Update the state
    setPatients(updatedPatients);
    console.log('Updated patients array after edit:', updatedPatients);

    // Close dialogs and show success message
    setIsEditPatientDialogOpen(false);
    setIsConfirmUpdateOpen(false);

    toast({
      title: "Patient Updated",
      description: `${editFormData.name}'s information has been updated.`,
    });

    resetEditFormData();
  };



  // Direct function to delete a patient
  const confirmDeletePatient = () => {
    if (!currentEditPatient) return;

    console.log('Deleting patient:', currentEditPatient);

    // Create a new array without the deleted patient
    const updatedPatients = patients.filter(p => p.id !== currentEditPatient.id);

    // Update the state
    setPatients(updatedPatients);
    console.log('Updated patients array after delete:', updatedPatients);

    // Close dialogs and show success message
    setIsEditPatientDialogOpen(false);
    setIsConfirmDeleteOpen(false);

    toast({
      title: "Patient Deleted",
      description: `${currentEditPatient.name} has been removed from the patient registry.`,
    });

    resetEditFormData();
  };

  // Direct function to handle edit dialog close
  const handleEditDialogClose = () => {
    setIsEditPatientDialogOpen(false);
    resetEditFormData();
  };

  // Function to handle viewing patient details
  const handleViewDetails = useCallback((patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  }, [navigate]);

  // We're using the onOpenChange prop of Dialog component instead of a separate close function

  // Direct function to handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Function to handle the add patient form submission
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
    const newPatient: Patient = {
      id: `PT${String(patients.length + 1).padStart(3, '0')}`,
      name: formData.name,
      gender: formData.gender as 'male' | 'female' | 'other',
      age: calculatedAge,
      dateOfBirth: !useAgeInput ? formData.dateOfBirth : undefined,
      email: formData.email || null,
      phone: formData.phone,
      altPhone: formData.altPhone || null, // Added alternative phone
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      bloodGroup: formData.bloodGroup,
      referredBy: formData.referredBy,
      clinic: formData.clinic as 'dental' | 'meditouch' | 'both',
      lastVisit: formData.lastVisit || ''
    };

    // Add to the beginning of the array to show newest first
    const updatedPatients = [newPatient, ...patients];
    setPatients(updatedPatients);

    // Close dialogs and show success message
    setIsConfirmAddOpen(false);
    setIsAddPatientDialogOpen(false);
    toast({
      title: "Patient Added",
      description: `${formData.name} has been added to the patient registry.`,
    });

    // Reset the form
    resetFormData();
  };

  // Direct function to handle dialog close
  const handleDialogClose = () => {
    setIsAddPatientDialogOpen(false);
    resetFormData();
  };

  // Memoize the filtered patients to prevent unnecessary recalculations
  const filteredPatients = React.useMemo(() => {
    // Start with all patients
    let filtered = [...patients];

    // Apply tab filtering
    if (currentTab !== "all") {
      filtered = filtered.filter(patient =>
        patient.clinic === currentTab || patient.clinic === 'both'
      );
    }

    // Apply search filtering
    const searchTerm = searchValue ? searchValue.trim() : '';
    if (searchTerm !== '') {
      const searchLower = searchTerm.toLowerCase();

      filtered = filtered.filter(patient => {
        // Format phone numbers with country code for searching
        const formattedPhone = `+91 ${patient.phone}`;
        const formattedAltPhone = patient.altPhone ? `+91 ${patient.altPhone}` : '';

        // Check each field for a match
        return (
          (patient.name && patient.name.toLowerCase().includes(searchLower)) ||
          (patient.phone && patient.phone.includes(searchLower)) ||
          (formattedPhone && formattedPhone.includes(searchLower)) ||
          (patient.altPhone && patient.altPhone.includes(searchLower)) ||
          (formattedAltPhone && formattedAltPhone.includes(searchLower)) ||
          (patient.email && patient.email?.toLowerCase().includes(searchLower)) ||
          (patient.address && patient.address.toLowerCase().includes(searchLower)) ||
          (patient.city && patient.city.toLowerCase().includes(searchLower)) ||
          (patient.pincode && patient.pincode.toLowerCase().includes(searchLower)) ||
          (patient.bloodGroup && patient.bloodGroup.toLowerCase().includes(searchLower)) ||
          (patient.referredBy && patient.referredBy.toLowerCase().includes(searchLower)) ||
          (patient.gender && patient.gender.toLowerCase().includes(searchLower)) ||
          (patient.age && String(patient.age).includes(searchLower)) ||
          (patient.lastVisit && patient.lastVisit.toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  }, [patients, currentTab, searchValue]);

  // Memoize the columns definition to prevent recreating it on every render
  const columns = useMemo<ColumnDef<Patient>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </div>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <div className="capitalize">{row.getValue("gender")}</div>,
    },
    {
      accessorKey: "age",
      header: ({ column }) => (
        <div onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Age <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          {`+91 ${row.getValue("phone")}`}
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate" title={row.getValue("city")}>
          {row.getValue("city") || "Not provided"}
        </div>
      ),
    },
    {
      accessorKey: "bloodGroup",
      header: "Blood Group",
      cell: ({ row }) => (
        <div>{row.getValue("bloodGroup") || "Not provided"}</div>
      ),
    },
    {
      accessorKey: "clinic",
      header: "Clinic",
      cell: ({ row }) => getClinicBadge(row.getValue("clinic") as Patient['clinic'], activeClinic),
    },
    {
      accessorKey: "lastVisit",
      header: ({ column }) => (
        <div onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Last Visit <ArrowUpDown className="ml-2 h-4 w-4 inline" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.getValue("lastVisit") || "No visits"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditPatientClick(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Patient
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                console.log('Delete clicked for patient:', row.original);
                setCurrentEditPatient(row.original);
                setIsConfirmDeleteOpen(true);
              }}
              className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete Patient
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [activeClinic, handleViewDetails]); // Depend on activeClinic and handleViewDetails

  // Memoize the table options to prevent unnecessary re-renders
  const tableOptions = useMemo(() => ({
    data: filteredPatients, // We're already filtering the data before it gets to the table
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // No pagination - show all records
    state: {
      sorting,
    },
  }), [filteredPatients, columns, sorting]);

  // Create the table instance with memoized options
  const table = useReactTable(tableOptions);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage patient records and information</p>
        </div>
        <Button
          onClick={() => setIsAddPatientDialogOpen(true)}
          className={activeClinic === 'dental'
            ? "bg-dental-primary hover:bg-dental-dark"
            : "bg-meditouch-primary hover:bg-meditouch-dark"}
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Patient
        </Button>
      </div>

      <Tabs
        defaultValue="all"
        className="w-full"
        value={currentTab}
        onValueChange={(value) => {
          setCurrentTab(value);
          // Clear search when changing tabs
          setSearchValue('');
        }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="all">All Patients</TabsTrigger>
            <TabsTrigger value="dental">Dental Metrix</TabsTrigger>
            <TabsTrigger value="meditouch">Meditouch</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Input
              placeholder="Search patients by name, phone, email..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            {searchValue && (
              <Button
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => setSearchValue('')}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Single table component for all tabs */}
        <div className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>
                {currentTab === 'all' ? 'Patient Registry' :
                 currentTab === 'dental' ? 'Dental Metrix Patients' : 'Meditouch Patients'}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {/* Render the table directly without useMemo */}
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      <Dialog open={isAddPatientDialogOpen} onOpenChange={handleDialogClose}>
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
                        onChange={(e) => {
                          // Only allow digits
                          const numericValue = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, phone: numericValue});
                        }}
                        required
                        pattern="\d+"
                        title="Please enter only digits"
                      />
                    </div>
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
                    <option value="dental">Dental Metrix</option>
                    <option value="meditouch">Meditouch</option>
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

      {/* Edit Patient Dialog */}
      <Dialog open={isEditPatientDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update the patient details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {currentEditPatient && (
            <form onSubmit={handleUpdatePatient}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter patient's full name"
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <select
                      id="gender"
                      className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editFormData.gender}
                      onChange={handleEditFormChange}
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
                          id="editUseAge"
                          name="editAgeOrDob"
                          checked={editUseAgeInput}
                          onChange={() => setEditUseAgeInput(true)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="editUseAge" className="cursor-pointer">Age</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="editUseDob"
                          name="editAgeOrDob"
                          checked={!editUseAgeInput}
                          onChange={() => setEditUseAgeInput(false)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="editUseDob" className="cursor-pointer">DOB</Label>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="space-y-2 flex-1">
                        {editUseAgeInput ? (
                          <>
                            <Label htmlFor="age">Age *</Label>
                            <Input
                              id="age"
                              type="number"
                              placeholder="Enter age"
                              value={editFormData.age}
                              onChange={handleEditFormChange}
                              required={editUseAgeInput}
                              className="h-10 w-full"
                            />
                          </>
                        ) : (
                          <>
                            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={editFormData.dateOfBirth}
                              onChange={handleEditFormChange}
                              required={!editUseAgeInput}
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
                          value={editFormData.email}
                          onChange={handleEditFormChange}
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
                          value={editPhoneCountryCode}
                          onValueChange={setEditPhoneCountryCode}
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
                          value={editFormData.phone}
                          onChange={(e) => {
                            // Only allow digits
                            const numericValue = e.target.value.replace(/\D/g, '');
                            setEditFormData({...editFormData, phone: numericValue});
                          }}
                          required
                          pattern="\d+"
                          title="Please enter only digits"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="altPhone">Alternative Phone Number</Label>
                      <div className="flex">
                        <Select
                          defaultValue="+91"
                          value={editPhoneCountryCode}
                          onValueChange={setEditPhoneCountryCode}
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
                          value={editFormData.altPhone}
                          onChange={(e) => {
                            // Only allow digits
                            const numericValue = e.target.value.replace(/\D/g, '');
                            setEditFormData({...editFormData, altPhone: numericValue});
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
                      value={editFormData.address}
                      onChange={handleEditFormChange}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Enter city"
                      value={editFormData.city}
                      onChange={handleEditFormChange}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="Enter pincode"
                      value={editFormData.pincode}
                      onChange={handleEditFormChange}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <select
                      id="bloodGroup"
                      className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editFormData.bloodGroup}
                      onChange={handleEditFormChange}
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
                      value={editFormData.referredBy}
                      onChange={handleEditFormChange}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinic">Registered For *</Label>
                    <select
                      id="clinic"
                      className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editFormData.clinic}
                      onChange={handleEditFormChange}
                      required
                    >
                      <option value="">Select Clinic</option>
                      <option value="dental">Dental Metrix</option>
                      <option value="meditouch">Meditouch</option>
                      <option value="both">Both Clinics</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastVisit">Last Visit</Label>
                    <Input
                      id="lastVisit"
                      type="date"
                      value={editFormData.lastVisit}
                      onChange={handleEditFormChange}
                      max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleEditDialogClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={activeClinic === 'dental'
                    ? "bg-dental-primary hover:bg-dental-dark"
                    : "bg-meditouch-primary hover:bg-meditouch-dark"}
                >
                  Update Patient
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient
              {currentEditPatient && ` ${currentEditPatient.name}`} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePatient} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Update Dialog */}
      <AlertDialog open={isConfirmUpdateOpen} onOpenChange={setIsConfirmUpdateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the patient information?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdatePatient}>
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Add Dialog */}
      <AlertDialog open={isConfirmAddOpen} onOpenChange={setIsConfirmAddOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Add Patient</AlertDialogTitle>
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
    </div>
  );
};

export default Patients;
