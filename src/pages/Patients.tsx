
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinic } from '@/contexts/ClinicContext';
import { usePatients, Patient } from '@/contexts/PatientContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
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
import { Skeleton } from '@/components/ui/skeleton';
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
  getPaginationRowModel,
  PaginationState,
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
  Download,
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
import { formatDateForExport, formatDateForFilename } from '@/utils/dateFormatter';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Patient interface is imported from PatientContext

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
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [isEditPatientDialogOpen, setIsEditPatientDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmAddOpen, setIsConfirmAddOpen] = useState(false);
  const [currentEditPatient, setCurrentEditPatient] = useState<Patient | null>(null);
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState("+91");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true } // Sort by creation date descending to show newest records first
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [currentTab, setCurrentTab] = useState<string>("all");
  const { toast } = useToast();
  const { patients, isLoading, addPatient, updatePatient, deletePatient, searchPatients } = usePatients();
  const [filteredPatientsList, setFilteredPatientsList] = useState<Patient[]>([]);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [searchValue, setSearchValue] = useState("");
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [editHasWhatsApp, setEditHasWhatsApp] = useState(false);

  // Effect to filter patients based on search and tab
  useEffect(() => {
    const filterPatients = async () => {
      console.log('Filtering patients with:', {
        totalPatients: patients.length,
        searchValue,
        currentTab
      });

      // Process patients to ensure all required fields are present
      const processedPatients = patients.map(patient => ({
        ...patient,
        // Ensure all fields are properly set for display
        id: patient.id,
        patient_code: patient.patient_code || `PT${Date.now().toString().slice(-6)}`,
        name: patient.name || 'Unknown',
        gender: patient.gender || 'other',
        age: patient.age || 0,
        date_of_birth: patient.date_of_birth,
        email: patient.email,
        phone: patient.phone || '',
        alt_phone: patient.alt_phone,
        address: patient.address,
        city: patient.city,
        pincode: patient.pincode,
        blood_group: patient.blood_group,
        referred_by: patient.referred_by,
        clinic: patient.clinic || 'dental',
        last_visit: patient.last_visit
      }));

      // Start with all patients if no search term
      if (!searchValue.trim()) {
        // Apply tab filtering
        if (currentTab !== "all") {
          const filtered = processedPatients.filter(patient =>
            patient.clinic === currentTab || patient.clinic === 'both'
          );
          console.log(`Filtered to ${filtered.length} patients for tab ${currentTab}`);
          setFilteredPatientsList(filtered);
        } else {
          console.log(`Using all ${processedPatients.length} patients`);
          setFilteredPatientsList(processedPatients);
        }
        return;
      }

      // If there's a search term, use the searchPatients function
      try {
        const searchResults = await searchPatients(searchValue);
        console.log(`Search returned ${searchResults.length} results`);

        // Process search results to ensure all fields are present
        const processedResults = searchResults.map(patient => ({
          ...patient,
          // Ensure all fields are properly set for display
          id: patient.id,
          patient_code: patient.patient_code || `PT${Date.now().toString().slice(-6)}`,
          name: patient.name || 'Unknown',
          gender: patient.gender || 'other',
          age: patient.age || 0,
          date_of_birth: patient.date_of_birth,
          email: patient.email,
          phone: patient.phone || '',
          alt_phone: patient.alt_phone,
          address: patient.address,
          city: patient.city,
          pincode: patient.pincode,
          blood_group: patient.blood_group,
          referred_by: patient.referred_by,
          clinic: patient.clinic || 'dental',
          last_visit: patient.last_visit
        }));

        // Apply tab filtering to search results
        if (currentTab !== "all") {
          const filtered = processedResults.filter(patient =>
            patient.clinic === currentTab || patient.clinic === 'both'
          );
          console.log(`Filtered search results to ${filtered.length} patients for tab ${currentTab}`);
          setFilteredPatientsList(filtered);
        } else {
          console.log(`Using all ${processedResults.length} search results`);
          setFilteredPatientsList(processedResults);
        }
      } catch (error) {
        console.error('Error searching patients:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to search patients. Please try again.',
          variant: 'destructive',
        });
      }
    };

    filterPatients();
  }, [patients, searchValue, currentTab, searchPatients, toast]);

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
    hasWhatsApp: false, // Added WhatsApp field
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
    hasWhatsApp: false, // Added WhatsApp field
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
      hasWhatsApp: false, // Added WhatsApp field
      address: '',
      city: '',
      pincode: '',
      bloodGroup: '',
      referredBy: '',
      clinic: '',
      lastVisit: ''
    });
    setUseAgeInput(true); // Reset to age input by default
    setHasWhatsApp(false); // Reset WhatsApp checkbox
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
      hasWhatsApp: false, // Added WhatsApp field
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
    setEditHasWhatsApp(false); // Reset WhatsApp checkbox
  };

  // Export patients to CSV
  const exportToCSV = () => {
    // Create CSV content from the filtered patients data
    const headers = ['Patient Code', 'Name', 'Gender', 'Age', 'Date of Birth', 'Email', 'Phone', 'Alt Phone', 'Address', 'City', 'Pincode', 'Blood Group', 'Referred By', 'Clinic', 'Last Visit', 'Created Date'];

    const csvContent = [
      headers.join(','),
      ...filteredPatientsList.map(patient => {
        return [
          `"${patient.patient_code || ''}"`,
          `"${patient.name || ''}"`,
          `"${patient.gender || ''}"`,
          patient.age || 0,
          `"${patient.date_of_birth ? formatDateForExport(patient.date_of_birth) : ''}"`,
          `"${patient.email || ''}"`,
          `"${patient.phone || ''}"`,
          `"${patient.alt_phone || ''}"`,
          `"${patient.address || ''}"`,
          `"${patient.city || ''}"`,
          `"${patient.pincode || ''}"`,
          `"${patient.blood_group || ''}"`,
          `"${patient.referred_by || ''}"`,
          `"${patient.clinic || ''}"`,
          `"${patient.last_visit ? formatDateForExport(patient.last_visit) : ''}"`,
          `"${patient.created_at ? formatDateForExport(patient.created_at) : ''}"`
        ].join(',');
      })
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    const filename = `patients_export_${formatDateForFilename()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${filteredPatientsList.length} patient records exported to CSV.`,
    });
  };

  // Direct function to handle edit patient click
  const handleEditPatientClick = (patient: Patient) => {
    console.log('Editing patient:', patient);
    setCurrentEditPatient(patient);

    // Set default country code
    setEditPhoneCountryCode("+91");

    // Determine if we should use age or DOB based on available data
    const hasDateOfBirth = !!patient.date_of_birth;
    setEditUseAgeInput(!hasDateOfBirth);
    
    // Set WhatsApp checkbox state
    setEditHasWhatsApp(patient.has_whatsapp || false);

    console.log('Editing patient with data:', patient);

    setEditFormData({
      name: patient.name || '',
      gender: patient.gender || 'male',
      age: patient.age ? patient.age.toString() : '0',
      dateOfBirth: patient.date_of_birth || '',
      email: patient.email || '',
      phone: patient.phone || '',
      altPhone: patient.alt_phone || '', // Added alternative phone
      hasWhatsApp: patient.has_whatsapp || false, // Added WhatsApp field
      address: patient.address || '',
      city: patient.city || '',
      pincode: patient.pincode || '',
      bloodGroup: patient.blood_group || '',
      referredBy: patient.referred_by || '',
      clinic: patient.clinic || 'dental',
      lastVisit: patient.last_visit || ''
    });

    console.log('Edit form data initialized with:', {
      name: patient.name || '',
      gender: patient.gender || 'male',
      age: patient.age ? patient.age.toString() : '0',
      dateOfBirth: patient.date_of_birth || '',
      email: patient.email || '',
      phone: patient.phone || '',
      altPhone: patient.alt_phone || '',
      address: patient.address || '',
      city: patient.city || '',
      pincode: patient.pincode || '',
      bloodGroup: patient.blood_group || '',
      referredBy: patient.referred_by || '',
      clinic: patient.clinic || 'dental',
      lastVisit: patient.last_visit || ''
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
  const confirmUpdatePatient = async () => {
    if (!currentEditPatient) return;

    try {
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

      // Validate date fields
      if (editFormData.dateOfBirth === '') {
        console.log('Empty date of birth field detected, setting to null');
        editFormData.dateOfBirth = null;
      }

      if (editFormData.lastVisit === '') {
        console.log('Empty last visit field detected, setting to null');
        editFormData.lastVisit = null;
      }

      // Validate phone number
      if (!editFormData.phone || editFormData.phone.trim() === '') {
        throw new Error('Phone number is required');
      }

      // Ensure phone number is properly formatted
      const phoneNumber = editFormData.phone.trim();
      console.log('Phone number before formatting:', phoneNumber);

      // Ensure gender and clinic are lowercase and match the allowed values
      const gender = editFormData.gender.toLowerCase();
      const clinic = editFormData.clinic.toLowerCase();

      // Validate gender
      if (!['male', 'female', 'other'].includes(gender)) {
        throw new Error('Gender must be one of: male, female, other');
      }

      // Validate clinic
      if (!['dental', 'meditouch', 'both'].includes(clinic)) {
        throw new Error('Clinic must be one of: dental, meditouch, both');
      }

      // Create updated patient object with Supabase field names
      const updatedPatientData = {
        name: editFormData.name.trim(),
        gender: gender as 'male' | 'female' | 'other',
        age: calculatedAge,
        date_of_birth: !editUseAgeInput ? editFormData.dateOfBirth : null,
        email: editFormData.email && editFormData.email.trim() !== '' ? editFormData.email.trim() : null,
        phone: phoneNumber,
        alt_phone: editFormData.altPhone && editFormData.altPhone.trim() !== '' ? editFormData.altPhone.trim() : null,
        has_whatsapp: editFormData.hasWhatsApp || false,
        address: editFormData.address && editFormData.address.trim() !== '' ? editFormData.address.trim() : null,
        city: editFormData.city && editFormData.city.trim() !== '' ? editFormData.city.trim() : null,
        pincode: editFormData.pincode && editFormData.pincode.trim() !== '' ? editFormData.pincode.trim() : null,
        blood_group: editFormData.bloodGroup && editFormData.bloodGroup.trim() !== '' ? editFormData.bloodGroup.trim() : null,
        referred_by: editFormData.referredBy && editFormData.referredBy.trim() !== '' ? editFormData.referredBy.trim() : null,
        clinic: clinic as 'dental' | 'meditouch' | 'both',
        last_visit: editFormData.lastVisit && editFormData.lastVisit.trim() !== '' ? editFormData.lastVisit.trim() : null
      };

      console.log('Formatted update data:', updatedPatientData);

      // Update patient using PatientContext
      await updatePatient(currentEditPatient.id, updatedPatientData);

      // Close dialogs and show success message
      setIsEditPatientDialogOpen(false);
      setIsConfirmUpdateOpen(false);

      toast({
        title: "Patient Updated",
        description: `${editFormData.name}'s information has been updated.`,
      });

      resetEditFormData();
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: "Failed to update patient. Please try again.",
        variant: "destructive",
      });
    }
  };



  // Direct function to delete a patient
  const confirmDeletePatient = async () => {
    if (!currentEditPatient) return;

    try {
      // Delete patient using PatientContext
      await deletePatient(currentEditPatient.id);

      // Close dialogs and show success message
      setIsEditPatientDialogOpen(false);
      setIsConfirmDeleteOpen(false);

      toast({
        title: "Patient Deleted",
        description: `${currentEditPatient.name} has been removed from the patient registry.`,
      });

      resetEditFormData();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient. Please try again.",
        variant: "destructive",
      });
    }
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
  const confirmAddPatient = async () => {
    try {
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

      // Validate date fields
      if (formData.dateOfBirth === '') {
        console.log('Empty date of birth field detected, setting to null');
        formData.dateOfBirth = null;
      }

      if (formData.lastVisit === '') {
        console.log('Empty last visit field detected, setting to null');
        formData.lastVisit = null;
      }

      // Validate phone number
      if (!formData.phone || formData.phone.trim() === '') {
        throw new Error('Phone number is required');
      }

      // Ensure phone number is properly formatted
      const phoneNumber = formData.phone.trim();
      console.log('Phone number before formatting:', phoneNumber);

      // Create new patient object with Supabase field names
      // Ensure gender and clinic are lowercase and match the allowed values
      const gender = formData.gender.toLowerCase();
      const clinic = formData.clinic.toLowerCase();

      // Validate gender
      if (!['male', 'female', 'other'].includes(gender)) {
        throw new Error('Gender must be one of: male, female, other');
      }

      // Validate clinic
      if (!['dental', 'meditouch', 'both'].includes(clinic)) {
        throw new Error('Clinic must be one of: dental, meditouch, both');
      }

      const newPatient = {
        name: formData.name,
        gender: gender as 'male' | 'female' | 'other',
        age: calculatedAge,
        date_of_birth: !useAgeInput && formData.dateOfBirth ? formData.dateOfBirth : null,
        email: formData.email || null,
        phone: phoneNumber, // Use the validated phone number
        alt_phone: formData.altPhone || null,
        has_whatsapp: formData.hasWhatsApp || false,
        address: formData.address || null,
        city: formData.city || null,
        pincode: formData.pincode || null,
        blood_group: formData.bloodGroup || null,
        referred_by: formData.referredBy || null,
        clinic: clinic as 'dental' | 'meditouch' | 'both',
        last_visit: formData.lastVisit ? formData.lastVisit : null
      };

      // Add patient using PatientContext
      await addPatient(newPatient);

      // Close dialogs and show success message
      setIsConfirmAddOpen(false);
      setIsAddPatientDialogOpen(false);
      toast({
        title: "Patient Added",
        description: `${formData.name} has been added to the patient registry.`,
      });

      // Reset the form
      resetFormData();
    } catch (error) {
      console.error('Error adding patient in Patients.tsx:', error);

      // Log the form data for debugging
      console.error('Form data that failed to save:', formData);

      // Check if the error is a specific type
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: `Failed to add patient: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add patient. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Direct function to handle dialog close
  const handleDialogClose = () => {
    setIsAddPatientDialogOpen(false);
    resetFormData();
  };

  // Use the filteredPatientsList state that's updated by the useEffect

  // Log the filtered patients list for debugging
  useEffect(() => {
    console.log('Filtered patients list:', filteredPatientsList);
  }, [filteredPatientsList]);

  // Import the dental history context
  const { getPatientHistory } = useDentalHistory();

  // State to store the latest visit dates for each patient
  const [patientLastVisitDates, setPatientLastVisitDates] = useState<Record<string, string>>({});

  // Function to get the latest visit dates for all patients
  const fetchAllPatientLastVisitDates = useCallback(async () => {
    const visitDates: Record<string, string> = {};

    // Process patients in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < filteredPatientsList.length; i += batchSize) {
      const batch = filteredPatientsList.slice(i, i + batchSize);

      // Process each patient in the batch
      await Promise.all(batch.map(async (patient) => {
        try {
          // Get dental history for the patient
          const history = await getPatientHistory(patient.id);

          // If there's history, store the date of the most recent entry
          if (history && history.length > 0) {
            // History is already sorted by date in descending order
            visitDates[patient.id] = history[0].date;
          }
        } catch (error) {
          console.error(`Error getting latest visit date for patient ${patient.id}:`, error);
        }
      }));
    }

    setPatientLastVisitDates(visitDates);
  }, [filteredPatientsList, getPatientHistory]);

  // Fetch the latest visit dates when the filtered patients list changes
  useEffect(() => {
    fetchAllPatientLastVisitDates();
  }, [fetchAllPatientLastVisitDates]);

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
      cell: ({ row }) => {
        const phone = row.getValue("phone");
        return (
          <div className="flex items-center">
            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
            {phone ? `+91 ${phone}` : "Not provided"}
          </div>
        );
      },
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
      accessorKey: "blood_group",
      header: "Blood Group",
      cell: ({ row }) => (
        <div>{row.getValue("blood_group") || "Not provided"}</div>
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
      cell: ({ row }) => {
        // Get the patient ID
        const patientId = row.original.id;

        // Get the latest visit date from our state
        const lastVisitDate = patientLastVisitDates[patientId] || '';

        return (
          <div className="flex items-center">
            <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
            {lastVisitDate ? new Date(lastVisitDate).toLocaleDateString() : "No visits"}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Added On",
      cell: ({ row }) => {
        const createdAt = row.getValue("created_at") as string;
        return createdAt ? new Date(createdAt).toLocaleDateString() : "Unknown";
      },
      enableHiding: true, // Allow hiding this column
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
            {hasPermission('patients.edit') && (
              <DropdownMenuItem onClick={() => handleEditPatientClick(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Patient
              </DropdownMenuItem>
            )}
            {hasPermission('patients.delete') && (
              <>
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
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [activeClinic, handleViewDetails, patientLastVisitDates, hasPermission]); // Depend on activeClinic, handleViewDetails, patientLastVisitDates, and hasPermission

  // Memoize the table options to prevent unnecessary re-renders
  const tableOptions = useMemo(() => ({
    data: filteredPatientsList, // Use the filtered patients list from state
    columns,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination,
    },
  }), [filteredPatientsList, columns, sorting, pagination]);

  // Create the table instance with memoized options
  const table = useReactTable(tableOptions);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage patient records and information</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('patients.export') && (
            <Button
              variant="outline"
              onClick={exportToCSV}
              title="Export Patients to CSV"
            >
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          )}
          {hasPermission('patients.create') && (
            <Button
              onClick={() => setIsAddPatientDialogOpen(true)}
              className={activeClinic === 'dental'
                ? "bg-dental-primary hover:bg-dental-dark"
                : "bg-meditouch-primary hover:bg-meditouch-dark"}
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Patient
            </Button>
          )}
        </div>
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
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {Array(columns.length).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      {Array(columns.length).fill(0).map((_, j) => (
                        <Skeleton key={j} className="h-12 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
          
          {/* Pagination */}
          {!isLoading && filteredPatientsList.length > 0 && (
            <div className="flex items-center justify-between space-x-6 lg:space-x-8 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value))
                  }}
                  className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  {[10, 20, 25, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  {table.getFilteredRowModel().rows.length > 0 && (
                    <>
                      {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}{" "}
                      of {table.getFilteredRowModel().rows.length}
                    </>
                  )}
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        Previous
                      </Button>
                    </PaginationItem>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                      const currentPage = table.getState().pagination.pageIndex;
                      const totalPages = table.getPageCount();
                      
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i;
                      } else if (currentPage < 3) {
                        pageNumber = i;
                      } else if (currentPage > totalPages - 4) {
                        pageNumber = totalPages - 5 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      if (pageNumber < 0 || pageNumber >= totalPages) return null;
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => table.setPageIndex(pageNumber)}
                            isActive={pageNumber === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNumber + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        Next
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
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
                    <div className="flex items-center gap-3">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="whatsapp"
                          checked={formData.hasWhatsApp}
                          onCheckedChange={(checked) => {
                            setFormData({...formData, hasWhatsApp: checked as boolean});
                            setHasWhatsApp(checked as boolean);
                          }}
                        />
                        <Label htmlFor="whatsapp" className="text-sm font-normal cursor-pointer">
                          WhatsApp
                        </Label>
                      </div>
                    </div>
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
                        onBlur={(e) => {
                          // Validate on blur - ensure we have a valid phone number
                          if (e.target.value.trim() === '') {
                            toast({
                              title: "Phone Number Required",
                              description: "Please enter a valid phone number",
                              variant: "destructive",
                            });
                          }
                        }}
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
                      <div className="flex items-center gap-3">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="editWhatsapp"
                            checked={editFormData.hasWhatsApp}
                            onCheckedChange={(checked) => {
                              setEditFormData({...editFormData, hasWhatsApp: checked as boolean});
                              setEditHasWhatsApp(checked as boolean);
                            }}
                          />
                          <Label htmlFor="editWhatsapp" className="text-sm font-normal cursor-pointer">
                            WhatsApp
                          </Label>
                        </div>
                      </div>
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
