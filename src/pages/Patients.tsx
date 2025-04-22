
import React, { useState, useMemo } from 'react';
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
  getPaginationRowModel,
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
  email: string | null;
  phone: string;
  address: string;
  clinic: 'dental' | 'meditouch' | 'both';
  lastVisit: string | '';
}

const demoPatients: Patient[] = [
  {
    id: "PT001",
    name: "Aarav Sharma",
    gender: "male",
    age: 34,
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    address: "123 Modi Street, Mumbai",
    clinic: "both",
    lastVisit: "2023-10-15"
  },
  {
    id: "PT002",
    name: "Priya Patel",
    gender: "female",
    age: 28,
    email: "priya.patel@example.com",
    phone: "+91 87654 32109",
    address: "456 Gandhi Road, Delhi",
    clinic: "meditouch",
    lastVisit: "2023-10-12"
  },
  {
    id: "PT003",
    name: "Vikram Singh",
    gender: "male",
    age: 45,
    email: null,
    phone: "+91 76543 21098",
    address: "789 Nehru Avenue, Chennai",
    clinic: "dental",
    lastVisit: "2023-10-08"
  },
  {
    id: "PT004",
    name: "Neha Kapoor",
    gender: "female",
    age: 31,
    email: "neha.kapoor@example.com",
    phone: "+91 65432 10987",
    address: "234 Tagore Lane, Bangalore",
    clinic: "dental",
    lastVisit: "2023-09-30"
  },
  {
    id: "PT005",
    name: "Rajiv Malhotra",
    gender: "male",
    age: 52,
    email: "rajiv.malhotra@example.com",
    phone: "+91 54321 09876",
    address: "567 Bose Street, Hyderabad",
    clinic: "both",
    lastVisit: "2023-10-02"
  },
  {
    id: "PT006",
    name: "Ananya Reddy",
    gender: "female",
    age: 25,
    email: "ananya.reddy@example.com",
    phone: "+91 43210 98765",
    address: "890 Raman Road, Pune",
    clinic: "meditouch",
    lastVisit: "2023-10-10"
  },
  {
    id: "PT007",
    name: "Arjun Nair",
    gender: "male",
    age: 38,
    email: null,
    phone: "+91 32109 87654",
    address: "123 Krishnan Street, Kochi",
    clinic: "dental",
    lastVisit: "2023-09-25"
  },
  {
    id: "PT008",
    name: "Divya Menon",
    gender: "female",
    age: 29,
    email: "divya.menon@example.com",
    phone: "+91 21098 76543",
    address: "456 Patel Road, Ahmedabad",
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
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [isEditPatientDialogOpen, setIsEditPatientDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [currentEditPatient, setCurrentEditPatient] = useState<Patient | null>(null);
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState("+91");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [currentTab, setCurrentTab] = useState<string>("all");
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>(demoPatients);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [searchValue, setSearchValue] = useState("");

  // Monitor patients state changes
  React.useEffect(() => {
    console.log('Patients state updated:', patients);
  }, [patients]);

  // Apply search filter when searchValue changes
  React.useEffect(() => {
    console.log('Search value changed:', searchValue);
    // Log the first few patients to see their structure
    if (patients.length > 0) {
      console.log('Sample patient data:', patients[0]);
    }
  }, [searchValue, patients]);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    email: '',
    phone: '',
    address: '',
    clinic: '',
    lastVisit: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    gender: '',
    age: '',
    email: '',
    phone: '',
    address: '',
    clinic: '',
    lastVisit: ''
  });

  // Direct function to reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      gender: '',
      age: '',
      email: '',
      phone: '',
      address: '',
      clinic: '',
      lastVisit: ''
    });
  };

  // Direct function to reset edit form data
  const resetEditFormData = () => {
    setEditFormData({
      name: '',
      gender: '',
      age: '',
      email: '',
      phone: '',
      address: '',
      clinic: '',
      lastVisit: ''
    });
    setCurrentEditPatient(null);
    setEditPhoneCountryCode("+91");
  };

  // Direct function to handle edit patient click
  const handleEditPatientClick = (patient: Patient) => {
    console.log('Editing patient:', patient);
    setCurrentEditPatient(patient);

    // Extract country code and phone number
    const phoneMatch = patient.phone.match(/^(\+\d+)\s+(.*)$/);
    let countryCode = "+91";
    let phoneNumber = patient.phone;

    if (phoneMatch && phoneMatch.length >= 3) {
      countryCode = phoneMatch[1];
      phoneNumber = phoneMatch[2];
    }

    setEditPhoneCountryCode(countryCode);

    setEditFormData({
      name: patient.name,
      gender: patient.gender,
      age: patient.age.toString(),
      email: patient.email || '',
      phone: phoneNumber,
      address: patient.address,
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

    if (!editFormData.name || !editFormData.gender || !editFormData.age || !editFormData.phone || !editFormData.clinic) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirmUpdateOpen(true);
  };

  // Direct function to update a patient
  const confirmUpdatePatient = () => {
    if (!currentEditPatient) return;

    const updatedPatient: Patient = {
      ...currentEditPatient,
      name: editFormData.name,
      gender: editFormData.gender as 'male' | 'female' | 'other',
      age: Number(editFormData.age),
      email: editFormData.email || null,
      phone: `${editPhoneCountryCode} ${editFormData.phone}`,
      address: editFormData.address,
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

  // Direct function to handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Direct function to add a patient without memoization
  const handleAddPatient = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!formData.name || !formData.gender || !formData.age || !formData.phone || !formData.clinic) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create new patient object
    const newPatient: Patient = {
      id: `PT${String(patients.length + 1).padStart(3, '0')}`,
      name: formData.name,
      gender: formData.gender as 'male' | 'female' | 'other',
      age: Number(formData.age),
      email: formData.email || null,
      phone: `${phoneCountryCode} ${formData.phone}`,
      address: formData.address,
      clinic: formData.clinic as 'dental' | 'meditouch' | 'both',
      lastVisit: formData.lastVisit || ''
    };

    console.log('Adding new patient:', newPatient);

    // Directly update the patients array
    const updatedPatients = [...patients, newPatient];
    setPatients(updatedPatients);
    console.log('Updated patients array:', updatedPatients);

    // Close the dialog and show success message
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

  // Direct function to handle search
  const handleSearch = (value: string) => {
    console.log('handleSearch called with:', value);
    setSearchValue(value);
  };

  // Memoize the filtered patients to prevent unnecessary recalculations
  const filteredPatients = React.useMemo(() => {
    console.log('Filtering patients:', patients);
    console.log('Current tab:', currentTab);
    console.log('Active clinic:', activeClinic);
    console.log('Search value:', searchValue);

    // First filter by clinic/tab
    let filtered = patients.filter(patient => {
      const passesClinicFilter = currentTab === "all" ?
        (patient.clinic === activeClinic || patient.clinic === 'both') :
        (patient.clinic === currentTab || patient.clinic === 'both');

      return passesClinicFilter;
    });

    // Then apply search filter if there's a search value
    if (searchValue.trim() !== '') {
      const searchLower = searchValue.toLowerCase().trim();
      console.log('Applying search filter with term:', searchLower);

      filtered = filtered.filter(patient => {
        // Safely check each field
        const nameMatch = patient.name ? patient.name.toLowerCase().includes(searchLower) : false;
        const phoneMatch = patient.phone ? patient.phone.toLowerCase().includes(searchLower) : false;
        const emailMatch = patient.email ? patient.email.toLowerCase().includes(searchLower) : false;
        const addressMatch = patient.address ? patient.address.toLowerCase().includes(searchLower) : false;
        const genderMatch = patient.gender ? patient.gender.toLowerCase().includes(searchLower) : false;
        const ageMatch = patient.age ? String(patient.age).includes(searchLower) : false;
        const lastVisitMatch = patient.lastVisit ? patient.lastVisit.toLowerCase().includes(searchLower) : false;

        const matches = nameMatch || phoneMatch || emailMatch || addressMatch || genderMatch || ageMatch || lastVisitMatch;

        // Log detailed matching info for debugging
        if (matches) {
          console.log(`Patient ${patient.id} (${patient.name}) matches search: ${searchLower}`);
          console.log(`  Name match: ${nameMatch}, Phone match: ${phoneMatch}, Email match: ${emailMatch}`);
          console.log(`  Address match: ${addressMatch}, Gender match: ${genderMatch}, Age match: ${ageMatch}`);
          console.log(`  Last Visit match: ${lastVisitMatch}`);
        }

        return matches;
      });

      console.log(`Found ${filtered.length} matches for search term: ${searchLower}`);
    }

    console.log('Filtered patients after search:', filtered);
    return filtered;
  }, [patients, currentTab, activeClinic, searchValue]);

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
          {row.getValue("phone")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email");
        return email ? (
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            {email as string}
          </div>
        ) : (
          <div className="text-muted-foreground italic">Not provided</div>
        );
      },
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
          {row.getValue("lastVisit")}
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
            <DropdownMenuItem onClick={() => console.log("View", row.original.id)}>
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
  ], [activeClinic]); // Only depend on activeClinic

  // Memoize the table options to prevent unnecessary re-renders
  const tableOptions = useMemo(() => ({
    data: filteredPatients, // We're already filtering the data before it gets to the table
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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

      <div className="flex items-center py-4 overflow-x-auto">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search patients by name, phone, email..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(searchValue);
                }
              }}
            />
            {searchValue && (
              <Button
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => handleSearch('')}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            type="button"
            onClick={() => handleSearch(searchValue)}
            className={activeClinic === 'dental'
              ? "bg-dental-primary hover:bg-dental-dark"
              : "bg-meditouch-primary hover:bg-meditouch-dark"}
          >
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="dental">Dental Metrix</TabsTrigger>
          <TabsTrigger value="meditouch">Meditouch</TabsTrigger>
        </TabsList>

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
              {/* Memoize the table rendering to prevent unnecessary re-renders */}
              {useMemo(() => (
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
              ), [table, columns.length])}
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
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="flex">
                    <Select
                      defaultValue="+91"
                      value={phoneCountryCode}
                      onValueChange={setPhoneCountryCode}
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
                      id="phone"
                      className="rounded-l-none"
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={handleFormChange}
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter patient's address"
                    value={formData.address}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastVisit">Last Visit</Label>
                  <Input
                    id="lastVisit"
                    type="date"
                    value={formData.lastVisit}
                    onChange={handleFormChange}
                    max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
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
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter age"
                      value={editFormData.age}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="flex">
                      <Select
                        defaultValue="+91"
                        value={editPhoneCountryCode}
                        onValueChange={setEditPhoneCountryCode}
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
                        id="phone"
                        className="rounded-l-none"
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
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@example.com"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="Enter patient's address"
                      value={editFormData.address}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastVisit">Last Visit</Label>
                    <Input
                      id="lastVisit"
                      type="date"
                      value={editFormData.lastVisit}
                      onChange={handleEditFormChange}
                      max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
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
    </div>
  );
};

export default Patients;
