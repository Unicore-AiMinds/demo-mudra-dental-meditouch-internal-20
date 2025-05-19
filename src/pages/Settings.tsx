import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { useClinicInfo } from '@/contexts/ClinicInfoContext';
import { useDoctors } from '@/contexts/DoctorContext';
import { useMedicines } from '@/contexts/MedicineContext';
import { useServices, ServiceWithFollowUp } from '@/contexts/ServiceContext';
import { useServiceFollowUps } from '@/contexts/ServiceFollowUpContext';
import { useServiceFollowUpRules } from '@/contexts/ServiceFollowUpRuleContext';
import { useDentalLabs } from '@/contexts/DentalLabsContext';
import { useLabWorkTypes } from '@/contexts/LabWorkTypesContext';
import { fixDocumentUrl, createDownloadLink } from '@/lib/supabase-storage';
import LabsTab from '@/components/settings/LabsTab';
import LabWorkTypesTab from '@/components/settings/LabWorkTypesTab';

import { ServiceFollowUpRule, FollowUpStep } from '@/types/dental-history';
import { demoFollowUpRules } from '@/data/demo-dental-history';
import { getRandomDentalColor } from '@/utils/doctorColors';
import { Medicine } from '@/types/medicines';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import {
  Settings as SettingsIcon,
  User,
  UserPlus,
  MapPin,
  Phone,
  Mail,
  Clock,
  Edit,
  Trash2,
  Save,
  Plus,
  AlertCircle,
  FileText,
  Microscope,
  RefreshCw,
  Package,
  Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const clinicDetails = {
  dental: {
    name: "Dental Metrix Clinic",
    address: "Manas apartment, infront of Ambience hotel",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411016",
    phone: "094209 35899",
    email: "contact@dentalmetrix.com",
    operatingHours: {
      monday: "10 am–7 pm",
      tuesday: "10 am–7 pm",
      wednesday: "10 am–7 pm",
      thursday: "10 am–7 pm",
      friday: "10 am–7 pm",
      saturday: "10 am–7 pm",
      sunday: "Closed"
    }
  },
  meditouch: {
    name: "Meditouch Clinic",
    address: "Manas apartment, infront of Ambience hotel",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411016",
    phone: "094209 35899",
    email: "care@meditouchclinic.com",
    operatingHours: {
      monday: "10 am–7 pm",
      tuesday: "10 am–7 pm",
      wednesday: "10 am–7 pm",
      thursday: "10 am–7 pm",
      friday: "10 am–7 pm",
      saturday: "10 am–7 pm",
      sunday: "Closed"
    }
  }
};

// Doctor data is now managed by DoctorContext

// Services are now managed by ServiceContext

const initialDentalLabs = [
  { id: 1, name: "Precision Dental Lab", contact: "+91 98765 43210", address: "123 Dental Street", city: "Mumbai", pincode: "400001", specialization: "Crowns & Bridges" },
  { id: 2, name: "Nova Dental Solutions", contact: "+91 87654 32109", address: "456 Lab Avenue", city: "Delhi", pincode: "110001", specialization: "Dentures" },
  { id: 3, name: "Dent Creations India", contact: "+91 76543 21098", address: "789 Implant Road", city: "Bangalore", pincode: "560001", specialization: "Implants" },
  { id: 4, name: "Implant Specialists", contact: "+91 65432 10987", address: "321 Crown Lane", city: "Chennai", pincode: "600001", specialization: "Custom Abutments" }
];

const initialDealers = [
  { id: 1, name: "Dental Supplies Co.", email: "contact@dentalsupplies.com", contact: "+91 98765 43210", address: "123 Supplier Street", city: "Mumbai", pincode: "400001" },
  { id: 2, name: "MediDent Distributors", email: "info@medident.com", contact: "+91 87654 32109", address: "456 Distributor Lane", city: "Delhi", pincode: "110001" },
  { id: 3, name: "Prime Dental Products", email: "sales@primedentalproducts.com", contact: "+91 76543 21098", address: "789 Product Road", city: "Bangalore", pincode: "560001" },
  { id: 4, name: "Dental Depot", email: "support@dentaldepot.com", contact: "+91 65432 10987", address: "321 Depot Avenue", city: "Chennai", pincode: "600001" }
];

const initialLabWorkTypes = [
  { id: 1, name: "PFM Crown", turnaround: "7-10 days" },
  { id: 2, name: "Ceramic Bridge", turnaround: "8-12 days" },
  { id: 3, name: "Acrylic Denture", turnaround: "10-14 days" },
  { id: 4, name: "Cast Partial Framework", turnaround: "12-15 days" },
  { id: 5, name: "Custom Abutment", turnaround: "5-7 days" },
  { id: 6, name: "Hard Acrylic Splint", turnaround: "3-5 days" }
];

const initialStockItems = [
  { id: 1, name: "Dental Composite", subItem: "Filtek Supreme Ultra", description: "Light-cured restorative material for anterior and posterior restorations", itemType: "Consumable", minimumThreshold: 5 },
  { id: 2, name: "Impression Material", subItem: "Jeltrate Plus", description: "Alginate impression material for preliminary impressions", itemType: "Consumable", minimumThreshold: 3 },
  { id: 3, name: "Orthodontic Wire", subItem: "Ormco NiTi", description: "Nickel titanium archwires for orthodontic treatment", itemType: "Inventory", minimumThreshold: 2 },
  { id: 4, name: "Dental Cement", subItem: "GC Fuji II LC", description: "Light-cured glass ionomer restorative cement", itemType: "Consumable", minimumThreshold: 4 },
  { id: 5, name: "Dental Burs", subItem: "Mani Diamond", description: "Diamond dental burs for cavity preparation", itemType: "Inventory", minimumThreshold: 10 }
];

const systemUsers = [
  { id: 1, name: "Dr. Rajan Khanna", email: "rajan.khanna@mudraclinic.com", role: "admin", status: "active" },
  { id: 2, name: "Lakshmi Menon", email: "lakshmi.menon@mudraclinic.com", role: "receptionist", status: "active" },
  { id: 3, name: "Dr. Priya Desai", email: "priya.desai@mudraclinic.com", role: "doctor", status: "active" },
  { id: 4, name: "Rajesh Sharma", email: "rajesh.sharma@mudraclinic.com", role: "inventory", status: "active" },
  { id: 5, name: "Arjun Kumar", email: "arjun.kumar@mudraclinic.com", role: "doctor", status: "inactive" }
];

const Settings = () => {
  const { user } = useAuth();
  const { activeClinic } = useClinic();
  const { currentClinicInfo } = useClinicInfo();
  // Add dialogs
  const [isAddDoctorDialogOpen, setIsAddDoctorDialogOpen] = useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isAddLabDialogOpen, setIsAddLabDialogOpen] = useState(false);
  const [isAddLabWorkTypeDialogOpen, setIsAddLabWorkTypeDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddStockItemDialogOpen, setIsAddStockItemDialogOpen] = useState(false);
  const [isAddDealerDialogOpen, setIsAddDealerDialogOpen] = useState(false);
  const [isAddMedicineDialogOpen, setIsAddMedicineDialogOpen] = useState(false);
  const [isAddFollowUpRuleDialogOpen, setIsAddFollowUpRuleDialogOpen] = useState(false);

  // Edit dialogs
  const [isEditDoctorDialogOpen, setIsEditDoctorDialogOpen] = useState(false);
  const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false);
  const [isEditLabDialogOpen, setIsEditLabDialogOpen] = useState(false);
  const [isEditLabWorkTypeDialogOpen, setIsEditLabWorkTypeDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isEditStockItemDialogOpen, setIsEditStockItemDialogOpen] = useState(false);
  const [isEditDealerDialogOpen, setIsEditDealerDialogOpen] = useState(false);
  const [isEditMedicineDialogOpen, setIsEditMedicineDialogOpen] = useState(false);
  const [isEditFollowUpRuleDialogOpen, setIsEditFollowUpRuleDialogOpen] = useState(false);

  // Confirmation dialogs
  const [isConfirmDeleteDoctorOpen, setIsConfirmDeleteDoctorOpen] = useState(false);
  const [isConfirmDeleteServiceOpen, setIsConfirmDeleteServiceOpen] = useState(false);
  const [isConfirmDeleteLabOpen, setIsConfirmDeleteLabOpen] = useState(false);
  const [isConfirmDeleteLabWorkTypeOpen, setIsConfirmDeleteLabWorkTypeOpen] = useState(false);
  const [isConfirmDeleteUserOpen, setIsConfirmDeleteUserOpen] = useState(false);
  const [isConfirmDeleteStockItemOpen, setIsConfirmDeleteStockItemOpen] = useState(false);
  const [isConfirmDeleteDealerOpen, setIsConfirmDeleteDealerOpen] = useState(false);
  const [isConfirmDeleteMedicineOpen, setIsConfirmDeleteMedicineOpen] = useState(false);
  const [isConfirmDeleteFollowUpRuleOpen, setIsConfirmDeleteFollowUpRuleOpen] = useState(false);

  const [isConfirmUpdateDoctorOpen, setIsConfirmUpdateDoctorOpen] = useState(false);
  const [isConfirmUpdateServiceOpen, setIsConfirmUpdateServiceOpen] = useState(false);
  const [isConfirmUpdateLabOpen, setIsConfirmUpdateLabOpen] = useState(false);
  const [isConfirmUpdateLabWorkTypeOpen, setIsConfirmUpdateLabWorkTypeOpen] = useState(false);
  const [isConfirmUpdateUserOpen, setIsConfirmUpdateUserOpen] = useState(false);
  const [isConfirmUpdateStockItemOpen, setIsConfirmUpdateStockItemOpen] = useState(false);
  const [isConfirmUpdateDealerOpen, setIsConfirmUpdateDealerOpen] = useState(false);
  const [isConfirmUpdateMedicineOpen, setIsConfirmUpdateMedicineOpen] = useState(false);
  const [isConfirmUpdateFollowUpRuleOpen, setIsConfirmUpdateFollowUpRuleOpen] = useState(false);

  // Define types for our data
  interface Doctor {
    id: string;
    name: string;
    specialization: string;
    email: string;
    phone: string;
    color: string;
    aadhar_doc?: string;
    pan_doc?: string;
  }

  interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
    description?: string;
  }

  // Current edit items
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [currentMedicine, setCurrentMedicine] = useState<Medicine | null>(null);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialization, setNewDoctorSpecialization] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+91');
  // Using DoctorContext instead of local state
  const { doctors: dentalDoctors, addDoctor, updateDoctor, deleteDoctor, updateDoctorColor, isLoading: doctorsLoading } = useDoctors();

  // Debug log the doctors data
  console.log('Settings component - dentalDoctors:', dentalDoctors);
  console.log('Settings component - doctorsLoading:', doctorsLoading);

  // Function to handle document downloads
  const handleDocumentDownload = useCallback(async (docUrl: string | undefined, docType: string) => {
    if (!docUrl) {
      toast({
        title: "Error",
        description: `No ${docType} document available.`,
        variant: "destructive"
      });
      return;
    }

    // Show a loading toast
    toast({
      title: "Processing",
      description: `Preparing ${docType} document for download...`,
    });

    try {
      console.log(`Original ${docType} URL:`, docUrl);

      // First try to fix the URL format
      const fixedUrl = fixDocumentUrl(docUrl);
      console.log(`Fixed ${docType} URL:`, fixedUrl);

      if (!fixedUrl) {
        console.error(`Failed to fix ${docType} document URL`);
        toast({
          title: "Error",
          description: `Invalid ${docType} document URL format.`,
          variant: "destructive"
        });
        return;
      }

      // Create a download link
      console.log(`Creating download link for ${docType} document...`);
      const downloadUrl = await createDownloadLink(fixedUrl);
      console.log(`${docType} download URL:`, downloadUrl);

      if (downloadUrl) {
        // Success toast
        toast({
          title: "Success",
          description: `${docType} document ready. Opening in new tab...`,
        });

        // Open the download URL in a new tab
        window.open(downloadUrl, '_blank');
      } else {
        console.error(`Failed to generate download link for ${docType} document`);

        // Try opening the original URL as a fallback
        console.log(`Trying to open original URL as fallback: ${docUrl}`);
        window.open(docUrl, '_blank');

        toast({
          title: "Warning",
          description: `Using direct link for ${docType} document. If it doesn't work, please contact support.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error(`Error downloading ${docType} document:`, error);

      // Try opening the original URL as a fallback
      console.log(`Trying to open original URL after error: ${docUrl}`);
      window.open(docUrl, '_blank');

      toast({
        title: "Error",
        description: `Error processing ${docType} document. Trying direct link instead.`,
        variant: "destructive"
      });
    }
  }, []);

  // State for file uploads
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [editAadharFile, setEditAadharFile] = useState<File | null>(null);
  const [editPanFile, setEditPanFile] = useState<File | null>(null);
  // Using MedicineContext
  const { medicines, addMedicine, updateMedicine, deleteMedicine } = useMedicines();

  // Color picker state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedDoctorForColor, setSelectedDoctorForColor] = useState<Doctor | null>(null);
  const [tempColor, setTempColor] = useState("");
  const [stockItems, setStockItems] = useState(initialStockItems);
  const [dealers, setDealers] = useState(initialDealers);
  // Use services from ServiceContext
  const { dentalServices, meditouchServices, servicesWithFollowUp, addService, updateService, deleteService, addServiceWithFollowUp, updateServiceWithFollowUp, deleteServiceWithFollowUp } = useServices();

  // Use service follow-ups from ServiceFollowUpContext
  const { generateFollowUpsForCompletedService } = useServiceFollowUps();
  // Use service follow-up rules from ServiceFollowUpRuleContext
  const { followUpRules, addFollowUpRule, updateFollowUpRule, deleteFollowUpRule, cleanupDuplicateRules, isLoading: isLoadingRules } = useServiceFollowUpRules();
  const [dentalLabs, setDentalLabs] = useState(initialDentalLabs);
  const [labWorkTypes, setLabWorkTypes] = useState(initialLabWorkTypes);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [currentLab, setCurrentLab] = useState(null);
  const [currentLabWorkType, setCurrentLabWorkType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStockItem, setCurrentStockItem] = useState(null);
  const [currentDealer, setCurrentDealer] = useState(null);
  const [currentFollowUpRule, setCurrentFollowUpRule] = useState<ServiceFollowUpRule | null>(null);
  const [currentServiceWithFollowUp, setCurrentServiceWithFollowUp] = useState<ServiceWithFollowUp | null>(null);

  // Follow-up rule form states
  const [newTriggeringService, setNewTriggeringService] = useState('');
  const [newFollowUpSteps, setNewFollowUpSteps] = useState<FollowUpStep[]>([
    { sequence: 1, interval_days: 180, suggested_service_name: '', notes: '' }
  ]);

  // Service with follow-up form states
  const [newServiceWithFollowUp, setNewServiceWithFollowUp] = useState<Omit<ServiceWithFollowUp, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    duration: 30,
    price: 0,
    description: '',
    requires_follow_up: true,
    default_follow_up_interval_days: 180,
    number_of_follow_ups: 1,
    follow_up_service_name: ''
  });

  // Stock item form states
  const [newStockItemName, setNewStockItemName] = useState('');
  const [newStockItemSubItem, setNewStockItemSubItem] = useState('');
  const [newStockItemDescription, setNewStockItemDescription] = useState('');
  const [newStockItemType, setNewStockItemType] = useState('Consumable');
  const [newStockItemMinThreshold, setNewStockItemMinThreshold] = useState<number>(0);

  // Dealer form states
  const [newDealerName, setNewDealerName] = useState('');
  const [newDealerEmail, setNewDealerEmail] = useState('');
  const [newDealerContact, setNewDealerContact] = useState('');
  const [newDealerContactCountryCode, setNewDealerContactCountryCode] = useState('+91');
  const [newDealerAddress, setNewDealerAddress] = useState('');
  const [newDealerCity, setNewDealerCity] = useState('');
  const [newDealerPincode, setNewDealerPincode] = useState('');

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <SettingsIcon className="h-16 w-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          The Settings module is only accessible to administrators.
          Please contact your system administrator if you need access.
        </p>
      </div>
    );
  }

  // Using the ClinicInfoContext instead of local clinicDetails
  // const currentClinicDetails = activeClinic === 'dental'
  //   ? clinicDetails.dental
  //   : clinicDetails.meditouch;

  const currentServices = activeClinic === 'dental'
    ? dentalServices
    : meditouchServices;

  // Helper function to capitalize the first letter of each word
  const capitalizeWords = (str: string): string => {
    if (!str) return '';
    return str
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSaveClinicDetails = () => {
    toast({
      title: "Settings Updated",
      description: `${activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} clinic details have been updated.`,
    });
  };

  // Doctor handlers
  const handleEditDoctor = (doctor: Doctor) => {
    setCurrentDoctor(doctor);
    // Extract country code from phone number if it exists
    if (doctor.phone && doctor.phone.startsWith('+')) {
      const parts = doctor.phone.split(' ');
      const countryCode = parts[0];
      if (['+91', '+1', '+44', '+61', '+971', '+65'].includes(countryCode)) {
        setEditPhoneCountryCode(countryCode);
      }
    }
    setIsEditDoctorDialogOpen(true);
  };

  const handleUpdateDoctorConfirm = () => {
    setIsConfirmUpdateDoctorOpen(true);
  };

  const handleUpdateDoctor = async () => {
    if (currentDoctor) {
      // Get updated values from form fields
      const updatedName = document.getElementById('editDoctorName') as HTMLInputElement;
      const updatedSpecialization = document.getElementById('editDoctorSpecialization') as HTMLInputElement;
      const updatedEmail = document.getElementById('editDoctorEmail') as HTMLInputElement;
      const updatedPhone = document.getElementById('editDoctorPhone') as HTMLInputElement;
      const updatedAadhar = document.getElementById('editAadharUpload') as HTMLInputElement;
      const updatedPan = document.getElementById('editPanUpload') as HTMLInputElement;

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      const isEmailValid = emailRegex.test(updatedEmail.value);

      // Validate phone number (only digits allowed)
      const phoneRegex = /^\d+$/;
      const isPhoneValid = phoneRegex.test(updatedPhone.value);

      if (!isEmailValid) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }

      if (!isPhoneValid) {
        toast({
          title: "Invalid Phone Number",
          description: "Phone number should contain only digits.",
          variant: "destructive"
        });
        return;
      }

      if (updatedName && updatedSpecialization && updatedEmail && updatedPhone) {
        // Update doctor using the DoctorContext with file uploads
        await updateDoctor(
          currentDoctor.id,
          {
            name: updatedName.value,
            specialization: updatedSpecialization.value,
            email: updatedEmail.value,
            phone: `${editPhoneCountryCode} ${updatedPhone.value}`
          },
          editAadharFile || undefined,
          editPanFile || undefined
        );

        toast({
          title: "Doctor Updated",
          description: `${updatedName.value}'s information has been updated successfully.`,
        });
      } else {
        toast({
          title: "Update Failed",
          description: "Could not update doctor information.",
          variant: "destructive"
        });
      }

      setIsConfirmUpdateDoctorOpen(false);
      setIsEditDoctorDialogOpen(false);
      setCurrentDoctor(null);
      setEditAadharFile(null);
      setEditPanFile(null);
    }
  };

  // Handle opening the color picker for a doctor
  const handleOpenColorPicker = (doctor: Doctor) => {
    setSelectedDoctorForColor(doctor);
    setTempColor(doctor.color);
    setIsColorPickerOpen(true);
  };

  // Handle color change confirmation
  const handleColorChange = () => {
    if (selectedDoctorForColor && tempColor) {
      // Update the doctor's color in the context
      updateDoctorColor(selectedDoctorForColor.id, tempColor);

      toast({
        title: "Color Updated",
        description: `${selectedDoctorForColor.name}'s color has been updated.`,
      });

      // Close the color picker dialog
      setIsColorPickerOpen(false);
      setSelectedDoctorForColor(null);
    }
  };

  const handleDeleteDoctor = async () => {
    if (currentDoctor) {
      try {
        // Delete doctor using the DoctorContext
        await deleteDoctor(currentDoctor.id);

        toast({
          title: "Doctor Removed",
          description: `${currentDoctor.name} has been removed from the system.`,
        });
      } catch (error) {
        console.error('Error deleting doctor:', error);
        toast({
          title: "Error",
          description: "Failed to delete doctor. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsConfirmDeleteDoctorOpen(false);
        setIsEditDoctorDialogOpen(false);
        setCurrentDoctor(null);
      }
    }
  };

  // Service handlers
  interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
    description?: string;
    clinic_type: 'dental' | 'meditouch';
  }

  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setIsEditServiceDialogOpen(true);
  };

  const handleUpdateServiceConfirm = () => {
    setIsConfirmUpdateServiceOpen(true);
  };

  const handleUpdateService = async () => {
    if (currentService) {
      // Get updated values from form fields
      const updatedName = document.getElementById('editServiceName') as HTMLInputElement;
      const updatedDuration = document.getElementById('editServiceDuration') as HTMLInputElement;
      const updatedPrice = document.getElementById('editServicePrice') as HTMLInputElement;
      const updatedDescription = document.getElementById('editServiceDescription') as HTMLTextAreaElement;

      // Validate required fields
      if (!updatedName.value.trim()) {
        toast({
          title: "Error",
          description: "Service name is required.",
          variant: "destructive"
        });
        return;
      }

      if (!updatedDuration.value || parseInt(updatedDuration.value) <= 0) {
        toast({
          title: "Error",
          description: "Duration must be a positive number.",
          variant: "destructive"
        });
        return;
      }

      const priceValue = parseFloat(updatedPrice.value);
      if (!updatedPrice.value || isNaN(priceValue) || priceValue < 0) {
        toast({
          title: "Error",
          description: "Price must be a valid non-negative number.",
          variant: "destructive"
        });
        return;
      }

      try {
        // Update the service using the ServiceContext
        await updateService(currentService.id, {
          name: capitalizeWords(updatedName.value.trim()),
          duration: parseInt(updatedDuration.value),
          price: parseFloat(updatedPrice.value),
          description: updatedDescription?.value?.trim() || ''
        });

        // Toast is already shown by the context
        setIsConfirmUpdateServiceOpen(false);
        setIsEditServiceDialogOpen(false);
        setCurrentService(null);
      } catch (error) {
        console.error('Error updating service:', error);
        toast({
          title: "Error",
          description: "Failed to update service. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteService = async () => {
    if (currentService) {
      try {
        // Delete the service using the ServiceContext
        await deleteService(currentService.id);

        // Toast is already shown by the context
        setIsConfirmDeleteServiceOpen(false);
        setIsEditServiceDialogOpen(false);
        setCurrentService(null);
      } catch (error) {
        console.error('Error deleting service:', error);
        toast({
          title: "Error",
          description: "Failed to delete service. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Lab handlers
  interface Lab {
    id: number;
    name: string;
    contact: string;
    address: string;
    city: string;
    pincode: string;
    specialization: string;
  }

  const handleEditLab = (lab: Lab) => {
    setCurrentLab(lab);
    setIsEditLabDialogOpen(true);
  };

  const handleUpdateLabConfirm = () => {
    setIsConfirmUpdateLabOpen(true);
  };

  const handleUpdateLab = () => {
    if (currentLab) {
      // Get updated values from form fields
      const updatedName = document.getElementById('editLabName') as HTMLInputElement;
      const updatedContact = document.getElementById('editLabContact') as HTMLInputElement;
      const updatedAddress = document.getElementById('editLabAddress') as HTMLInputElement;
      const updatedCity = document.getElementById('editLabCity') as HTMLInputElement;
      const updatedPincode = document.getElementById('editLabPincode') as HTMLInputElement;
      const updatedSpecialization = document.getElementById('editLabSpecialization') as HTMLInputElement;

      // Validate required fields
      if (!updatedName.value.trim()) {
        toast({
          title: "Error",
          description: "Laboratory name is required.",
          variant: "destructive"
        });
        return;
      }

      if (!updatedContact.value.trim()) {
        toast({
          title: "Error",
          description: "Contact number is required.",
          variant: "destructive"
        });
        return;
      }

      if (!updatedCity.value.trim()) {
        toast({
          title: "Error",
          description: "City is required.",
          variant: "destructive"
        });
        return;
      }

      // Get the country code from the temporary element
      let countryCode = '+91';
      const tempElement = document.getElementById('tempLabContactCountryCode');
      if (tempElement) {
        countryCode = tempElement.getAttribute('data-value') || '+91';
        tempElement.remove();
      }

      // Format the contact number with country code
      const formattedContact = `${countryCode} ${updatedContact.value.trim()}`;

      // Update the labs state
      setDentalLabs(prevLabs =>
        prevLabs.map(lab =>
          lab.id === currentLab.id
            ? {
                ...lab,
                name: capitalizeWords(updatedName.value.trim()),
                contact: formattedContact,
                address: capitalizeWords(updatedAddress.value.trim()),
                city: capitalizeWords(updatedCity.value.trim()),
                pincode: updatedPincode.value.trim(),
                specialization: capitalizeWords(updatedSpecialization.value.trim())
              }
            : lab
        )
      );

      toast({
        title: "Laboratory Updated",
        description: `${capitalizeWords(updatedName.value.trim())} information has been updated successfully.`,
      });
      setIsConfirmUpdateLabOpen(false);
      setIsEditLabDialogOpen(false);
      setCurrentLab(null);
    }
  };

  const handleDeleteLab = () => {
    if (currentLab) {
      // Remove the lab from the labs state
      setDentalLabs(prevLabs =>
        prevLabs.filter(lab => lab.id !== currentLab.id)
      );

      toast({
        title: "Laboratory Removed",
        description: `${currentLab.name} has been removed from the system.`,
      });
      setIsConfirmDeleteLabOpen(false);
      setIsEditLabDialogOpen(false);
      setCurrentLab(null);
    }
  };

  // Lab Work Type handlers
  interface LabWorkType {
    id: number;
    name: string;
    turnaround: string;
  }

  const handleEditLabWorkType = (workType: LabWorkType) => {
    setCurrentLabWorkType(workType);
    setIsEditLabWorkTypeDialogOpen(true);
  };

  const handleUpdateLabWorkTypeConfirm = () => {
    setIsConfirmUpdateLabWorkTypeOpen(true);
  };

  const handleUpdateLabWorkType = () => {
    if (currentLabWorkType) {
      // Get updated values from form fields
      const updatedName = document.getElementById('editWorkTypeName') as HTMLInputElement;
      const updatedTurnaround = document.getElementById('editTurnaroundTime') as HTMLInputElement;

      // Validate required fields
      if (!updatedName.value.trim()) {
        toast({
          title: "Error",
          description: "Work type name is required.",
          variant: "destructive"
        });
        return;
      }

      if (!updatedTurnaround.value.trim()) {
        toast({
          title: "Error",
          description: "Turnaround time is required.",
          variant: "destructive"
        });
        return;
      }

      // Update the lab work types state
      setLabWorkTypes(prevTypes =>
        prevTypes.map(type =>
          type.id === currentLabWorkType.id
            ? {
                ...type,
                name: capitalizeWords(updatedName.value.trim()),
                turnaround: updatedTurnaround.value.trim()
              }
            : type
        )
      );

      toast({
        title: "Lab Work Type Updated",
        description: `${capitalizeWords(updatedName.value.trim())} has been updated successfully.`,
      });
      setIsConfirmUpdateLabWorkTypeOpen(false);
      setIsEditLabWorkTypeDialogOpen(false);
      setCurrentLabWorkType(null);
    }
  };

  const handleDeleteLabWorkType = () => {
    if (currentLabWorkType) {
      // Remove the lab work type from the state
      setLabWorkTypes(prevTypes =>
        prevTypes.filter(type => type.id !== currentLabWorkType.id)
      );

      toast({
        title: "Lab Work Type Removed",
        description: `${currentLabWorkType.name} has been removed from the system.`,
      });
      setIsConfirmDeleteLabWorkTypeOpen(false);
      setIsEditLabWorkTypeDialogOpen(false);
      setCurrentLabWorkType(null);
    }
  };

  // User handlers
  interface SystemUser {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  }

  const handleEditUser = (user: SystemUser) => {
    setCurrentUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUserConfirm = () => {
    setIsConfirmUpdateUserOpen(true);
  };

  const handleUpdateUser = () => {
    // Update user logic would go here
    toast({
      title: "User Updated",
      description: `${currentUser.name}'s account has been updated successfully.`,
    });
    setIsConfirmUpdateUserOpen(false);
    setIsEditUserDialogOpen(false);
    setCurrentUser(null);
  };

  const handleDeleteUserConfirm = () => {
    setIsConfirmDeleteUserOpen(true);
  };

  const handleDeleteUser = () => {
    // Delete user logic would go here
    toast({
      title: "User Removed",
      description: `${currentUser.name}'s account has been removed from the system.`,
    });
    setIsConfirmDeleteUserOpen(false);
    setIsEditUserDialogOpen(false);
    setCurrentUser(null);
  };

  // Stock Item handlers
  interface StockItem {
    id: number;
    name: string;
    subItem?: string;
    description?: string;
    itemType: string;
    minimumThreshold: number;
  }

  const handleEditStockItem = (item: StockItem) => {
    setCurrentStockItem(item);
    setIsEditStockItemDialogOpen(true);
  };

  const handleUpdateStockItemConfirm = () => {
    setIsConfirmUpdateStockItemOpen(true);
  };

  const handleUpdateStockItem = () => {
    if (currentStockItem) {
      // Get updated values from form fields
      const updatedName = document.getElementById('editStockItemName') as HTMLInputElement;
      const updatedSubItem = document.getElementById('editStockItemSubItem') as HTMLInputElement;
      const updatedDescription = document.getElementById('editStockItemDescription') as HTMLTextAreaElement;
      const updatedMinThreshold = document.getElementById('editStockItemMinThreshold') as HTMLInputElement;

      // For the Select component, we need to get the value differently
      // We'll use the current item type as a fallback if we can't get the updated value
      let updatedItemType = currentStockItem.itemType;

      // Try to get the selected value from our temporary element
      const tempElement = document.getElementById('tempEditStockItemType');
      if (tempElement) {
        updatedItemType = tempElement.getAttribute('data-value') || currentStockItem.itemType;
        // Clean up the temporary element
        tempElement.remove();
      }

      if (!updatedName.value.trim()) {
        toast({
          title: "Error",
          description: "Item name is required.",
          variant: "destructive"
        });
        return;
      }

      if (!updatedMinThreshold.value || parseInt(updatedMinThreshold.value) < 0) {
        toast({
          title: "Error",
          description: "Minimum threshold is required and must be a positive number.",
          variant: "destructive"
        });
        return;
      }

      // Update the stock items state
      setStockItems(prevItems =>
        prevItems.map(item =>
          item.id === currentStockItem.id
            ? {
                ...item,
                name: updatedName.value,
                subItem: updatedSubItem.value,
                description: updatedDescription.value,
                itemType: updatedItemType,
                minimumThreshold: parseInt(updatedMinThreshold.value)
              }
            : item
        )
      );

      toast({
        title: "Stock Item Updated",
        description: `${updatedName.value} has been updated successfully.`,
      });
      setIsConfirmUpdateStockItemOpen(false);
      setIsEditStockItemDialogOpen(false);
      setCurrentStockItem(null);
    }
  };

  const handleDeleteStockItem = () => {
    if (currentStockItem) {
      // Remove the item from the stock items state
      setStockItems(prevItems =>
        prevItems.filter(item => item.id !== currentStockItem.id)
      );

      toast({
        title: "Stock Item Removed",
        description: `${currentStockItem.name} has been removed from the system.`,
      });
      setIsConfirmDeleteStockItemOpen(false);
      setIsEditStockItemDialogOpen(false);
      setCurrentStockItem(null);
    }
  };

  // Dealer handlers
  interface Dealer {
    id: number;
    name: string;
    email: string;
    contact: string;
    address: string;
    city: string;
    pincode: string;
  }

  const handleEditDealer = (dealer: Dealer) => {
    setCurrentDealer(dealer);
    setIsEditDealerDialogOpen(true);

    // Extract country code from contact number if it exists
    if (dealer.contact && dealer.contact.startsWith('+')) {
      const parts = dealer.contact.split(' ');
      if (parts.length > 1) {
        setNewDealerContactCountryCode(parts[0]);
        setNewDealerContact(parts.slice(1).join(' '));
      } else {
        setNewDealerContact(dealer.contact);
      }
    } else {
      setNewDealerContact(dealer.contact || '');
      setNewDealerContactCountryCode('+91');
    }
  };

  const handleUpdateDealerConfirm = () => {
    setIsConfirmUpdateDealerOpen(true);
  };

  const handleUpdateDealer = () => {
    if (currentDealer) {
      // Get updated values from form fields
      const updatedName = document.getElementById('editDealerName') as HTMLInputElement;
      const updatedEmail = document.getElementById('editDealerEmail') as HTMLInputElement;
      const updatedContact = document.getElementById('editDealerContact') as HTMLInputElement;
      const updatedAddress = document.getElementById('editDealerAddress') as HTMLInputElement;
      const updatedCity = document.getElementById('editDealerCity') as HTMLInputElement;
      const updatedPincode = document.getElementById('editDealerPincode') as HTMLInputElement;

      // Validate required fields
      if (!updatedName.value.trim()) {
        toast({
          title: "Error",
          description: "Dealer name is required.",
          variant: "destructive"
        });
        return;
      }

      if (!updatedContact.value.trim()) {
        toast({
          title: "Error",
          description: "Contact number is required.",
          variant: "destructive"
        });
        return;
      }

      if (!updatedCity.value.trim()) {
        toast({
          title: "Error",
          description: "City is required.",
          variant: "destructive"
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (updatedEmail.value.trim() && !emailRegex.test(updatedEmail.value.trim())) {
        toast({
          title: "Error",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }

      // Get the country code from the temporary element
      let countryCode = '+91';
      const tempElement = document.getElementById('tempDealerCountryCode');
      if (tempElement) {
        countryCode = tempElement.getAttribute('data-value') || '+91';
        tempElement.remove();
      }

      // Format the contact number with country code
      const formattedContact = `${countryCode} ${updatedContact.value.trim()}`;

      // Update the dealers state
      setDealers(prevDealers =>
        prevDealers.map(dealer =>
          dealer.id === currentDealer.id
            ? {
                ...dealer,
                name: capitalizeWords(updatedName.value.trim()),
                email: updatedEmail.value.trim(),
                contact: formattedContact,
                address: capitalizeWords(updatedAddress.value.trim()),
                city: capitalizeWords(updatedCity.value.trim()),
                pincode: updatedPincode.value.trim()
              }
            : dealer
        )
      );

      toast({
        title: "Dealer Updated",
        description: `${updatedName.value} has been updated successfully.`,
      });
      setIsConfirmUpdateDealerOpen(false);
      setIsEditDealerDialogOpen(false);
      setCurrentDealer(null);
    }
  };

  const handleDeleteDealer = () => {
    if (currentDealer) {
      // Remove the dealer from the dealers state
      setDealers(prevDealers =>
        prevDealers.filter(dealer => dealer.id !== currentDealer.id)
      );

      toast({
        title: "Dealer Removed",
        description: `${currentDealer.name} has been removed from the system.`,
      });
      setIsConfirmDeleteDealerOpen(false);
      setIsEditDealerDialogOpen(false);
      setCurrentDealer(null);
    }
  };

  // Medicine handlers
  const handleEditMedicine = (medicine: Medicine): void => {
    setCurrentMedicine(medicine);
    setIsEditMedicineDialogOpen(true);
  };

  const handleUpdateMedicineConfirm = () => {
    setIsConfirmUpdateMedicineOpen(true);
  };

  const handleUpdateMedicine = async () => {
    if (currentMedicine) {
      const nameInput = document.getElementById('editMedicineName') as HTMLInputElement;
      const dosageInput = document.getElementById('editMedicineDosage') as HTMLInputElement;
      const descriptionInput = document.getElementById('editMedicineDescription') as HTMLTextAreaElement;

      if (nameInput && dosageInput) {
        const updatedName = nameInput.value.trim();
        const updatedDosage = dosageInput.value.trim();
        const updatedDescription = descriptionInput ? descriptionInput.value.trim() : '';

        if (!updatedName || !updatedDosage) {
          toast({
            title: "Missing Required Fields",
            description: "Please fill in all required fields.",
            variant: "destructive"
          });
          return;
        }

        try {
          // Show loading toast
          toast({
            title: "Updating Medicine",
            description: "Please wait while the medicine is being updated...",
          });

          // Update medicine - make sure to await the Promise
          const updated = await updateMedicine(currentMedicine.id, {
            name: updatedName,
            dosage: updatedDosage,
            description: updatedDescription || undefined
          });

          console.log("Medicine updated successfully:", updated);

          if (updated) {
            toast({
              title: "Medicine Updated",
              description: `${updatedName} has been updated successfully.`,
            });
          } else {
            toast({
              title: "Update Failed",
              description: "Could not update medicine information.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error updating medicine:", error);
          toast({
            title: "Error",
            description: "Failed to update medicine. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsConfirmUpdateMedicineOpen(false);
          setIsEditMedicineDialogOpen(false);
          setCurrentMedicine(null);
        }
      }
    }
  };

  const handleDeleteMedicine = async () => {
    if (currentMedicine) {
      try {
        // Show loading toast
        toast({
          title: "Removing Medicine",
          description: "Please wait while the medicine is being removed...",
        });

        // Delete medicine - make sure to await the Promise
        const success = await deleteMedicine(currentMedicine.id);

        console.log("Medicine delete result:", success);

        if (success) {
          toast({
            title: "Medicine Removed",
            description: `${currentMedicine.name} has been removed from the system.`,
          });
        } else {
          toast({
            title: "Removal Failed",
            description: "Could not remove the medicine.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error deleting medicine:", error);
        toast({
          title: "Error",
          description: "Failed to delete medicine. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsConfirmDeleteMedicineOpen(false);
        setIsEditMedicineDialogOpen(false);
        setCurrentMedicine(null);
      }
    }
  };

  const handleAddMedicine = async () => {
    const nameInput = document.getElementById('newMedicineName') as HTMLInputElement;
    const dosageInput = document.getElementById('newMedicineDosage') as HTMLInputElement;
    const descriptionInput = document.getElementById('newMedicineDescription') as HTMLTextAreaElement;

    if (nameInput && dosageInput) {
      const name = nameInput.value.trim();
      const dosage = dosageInput.value.trim();
      const description = descriptionInput ? descriptionInput.value.trim() : '';

      if (!name || !dosage) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      try {
        // Show loading toast
        toast({
          title: "Adding Medicine",
          description: "Please wait while the medicine is being added...",
        });

        // Add new medicine - make sure to await the Promise
        const newMedicine = await addMedicine({
          name,
          dosage,
          description: description || undefined
        });

        console.log("Medicine added successfully:", newMedicine);

        toast({
          title: "Medicine Added",
          description: `${name} has been added successfully.`,
        });

        // Reset form and close dialog
        nameInput.value = '';
        dosageInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        setIsAddMedicineDialogOpen(false);
      } catch (error) {
        console.error("Error adding medicine:", error);
        toast({
          title: "Error",
          description: "Failed to add medicine. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Service with follow-up handlers
  const handleEditServiceWithFollowUp = (service: ServiceWithFollowUp) => {
    setCurrentServiceWithFollowUp(service);
    setIsEditFollowUpRuleDialogOpen(true);
  };

  const handleUpdateServiceWithFollowUpConfirm = () => {
    setIsConfirmUpdateFollowUpRuleOpen(true);
  };

  const handleUpdateServiceWithFollowUp = async () => {
    if (currentServiceWithFollowUp) {
      // Get updated values from form fields
      const nameInput = document.getElementById('editServiceWithFollowUpName') as HTMLInputElement;
      const durationInput = document.getElementById('editServiceWithFollowUpDuration') as HTMLInputElement;
      const priceInput = document.getElementById('editServiceWithFollowUpPrice') as HTMLInputElement;
      const descriptionInput = document.getElementById('editServiceWithFollowUpDescription') as HTMLTextAreaElement;
      const requiresFollowUpInput = document.getElementById('editRequiresFollowUp') as HTMLInputElement;
      const intervalDaysInput = document.getElementById('editFollowUpIntervalDays') as HTMLInputElement;
      const numFollowUpsInput = document.getElementById('editNumberOfFollowUps') as HTMLInputElement;
      const followUpServiceInput = document.getElementById('editFollowUpServiceName') as HTMLSelectElement;

      // Validate required fields
      if (!nameInput.value.trim()) {
        toast({
          title: "Error",
          description: "Service name is required.",
          variant: "destructive"
        });
        return;
      }

      if (!durationInput.value || parseInt(durationInput.value) <= 0) {
        toast({
          title: "Error",
          description: "Duration must be greater than 0.",
          variant: "destructive"
        });
        return;
      }

      const priceValue = parseFloat(priceInput.value);
      if (!priceInput.value || isNaN(priceValue) || priceValue < 0) {
        toast({
          title: "Error",
          description: "Price must be a valid non-negative number.",
          variant: "destructive"
        });
        return;
      }

      // Create updated service object
      const updatedService: Partial<ServiceWithFollowUp> = {
        name: nameInput.value,
        duration: parseInt(durationInput.value),
        price: parseFloat(priceInput.value),
        description: descriptionInput.value,
        requires_follow_up: requiresFollowUpInput.checked,
      };

      // Add follow-up specific fields if follow-up is required
      if (requiresFollowUpInput.checked) {
        if (!intervalDaysInput.value || parseInt(intervalDaysInput.value) <= 0) {
          toast({
            title: "Error",
            description: "Follow-up interval days must be greater than 0.",
            variant: "destructive"
          });
          return;
        }

        if (!numFollowUpsInput.value || parseInt(numFollowUpsInput.value) <= 0) {
          toast({
            title: "Error",
            description: "Number of follow-ups must be greater than 0.",
            variant: "destructive"
          });
          return;
        }

        if (!followUpServiceInput.value) {
          toast({
            title: "Error",
            description: "Please select a follow-up service.",
            variant: "destructive"
          });
          return;
        }

        updatedService.default_follow_up_interval_days = parseInt(intervalDaysInput.value);
        updatedService.number_of_follow_ups = parseInt(numFollowUpsInput.value);
        updatedService.follow_up_service_name = followUpServiceInput.value;
      }

      try {
        // Update service with follow-up in Supabase
        await updateServiceWithFollowUp(currentServiceWithFollowUp.id, updatedService);

        toast({
          title: "Service Updated",
          description: `${nameInput.value} has been updated with follow-up configuration.`,
        });

        setIsConfirmUpdateFollowUpRuleOpen(false);
        setIsEditFollowUpRuleDialogOpen(false);
        setCurrentServiceWithFollowUp(null);
      } catch (error) {
        console.error('Error updating service with follow-up:', error);
        toast({
          title: "Error",
          description: "Failed to update service with follow-up. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteServiceWithFollowUp = async () => {
    if (currentServiceWithFollowUp) {
      try {
        // Delete service with follow-up from Supabase
        await deleteServiceWithFollowUp(currentServiceWithFollowUp.id);

        toast({
          title: "Service Removed",
          description: `${currentServiceWithFollowUp.name} has been removed from services with follow-up.`,
        });

        setIsConfirmDeleteFollowUpRuleOpen(false);
        setIsEditFollowUpRuleDialogOpen(false);
        setCurrentServiceWithFollowUp(null);
      } catch (error) {
        console.error('Error deleting service with follow-up:', error);
        toast({
          title: "Error",
          description: "Failed to delete service with follow-up. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddServiceWithFollowUp = async () => {
    // Validate inputs
    if (!newServiceWithFollowUp.name) {
      toast({
        title: "Error",
        description: "Service name is required.",
        variant: "destructive"
      });
      return;
    }

    if (newServiceWithFollowUp.duration <= 0) {
      toast({
        title: "Error",
        description: "Duration must be greater than 0.",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(newServiceWithFollowUp.price) || newServiceWithFollowUp.price < 0) {
      toast({
        title: "Error",
        description: "Price must be a valid non-negative number.",
        variant: "destructive"
      });
      return;
    }

    // Validate follow-up specific fields if follow-up is required
    if (newServiceWithFollowUp.requires_follow_up) {
      if (!newServiceWithFollowUp.default_follow_up_interval_days || newServiceWithFollowUp.default_follow_up_interval_days <= 0) {
        toast({
          title: "Error",
          description: "Follow-up interval days must be greater than 0.",
          variant: "destructive"
        });
        return;
      }

      if (!newServiceWithFollowUp.number_of_follow_ups || newServiceWithFollowUp.number_of_follow_ups <= 0) {
        toast({
          title: "Error",
          description: "Number of follow-ups must be greater than 0.",
          variant: "destructive"
        });
        return;
      }

      if (!newServiceWithFollowUp.follow_up_service_name) {
        toast({
          title: "Error",
          description: "Please select a follow-up service.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      // Add service with follow-up to Supabase
      await addServiceWithFollowUp(newServiceWithFollowUp);

      toast({
        title: "Service Added",
        description: `${newServiceWithFollowUp.name} has been added with follow-up configuration.`,
      });

      // Reset form
      setNewServiceWithFollowUp({
        name: '',
        duration: 30,
        price: 0,
        description: '',
        requires_follow_up: true,
        default_follow_up_interval_days: 180,
        number_of_follow_ups: 1,
        follow_up_service_name: ''
      });

      setIsAddFollowUpRuleDialogOpen(false);
    } catch (error) {
      console.error('Error adding service with follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to add service with follow-up. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Follow-up rule handlers
  const handleAddFollowUpRule = async () => {
    // Validate required fields
    if (!newTriggeringService) {
      toast({
        title: "Error",
        description: "Triggering service name is required.",
        variant: "destructive"
      });
      return;
    }

    if (newFollowUpSteps.length === 0) {
      toast({
        title: "Error",
        description: "At least one follow-up step is required.",
        variant: "destructive"
      });
      return;
    }

    // Make a deep copy of the steps to ensure we don't modify the state directly
    const processedSteps = newFollowUpSteps.map(step => {
      // Check if the step has a suggested_service_name
      if (!step.suggested_service_name) {
        toast({
          title: "Error",
          description: "Follow-up name is required for all steps.",
          variant: "destructive"
        });
        return null;
      }

      if (step.interval_days <= 0) {
        toast({
          title: "Error",
          description: "Interval days must be a positive number for all steps.",
          variant: "destructive"
        });
        return null;
      }

      // Return a clean copy of the step with the correct field names
      return {
        sequence: step.sequence,
        interval_days: step.interval_days,
        suggested_service_name: step.suggested_service_name,
        notes: step.notes || ''
      };
    });

    // Check if any step validation failed
    if (processedSteps.includes(null)) {
      return;
    }

    // Check if a rule for this service already exists
    const existingRule = followUpRules.find(
      rule => rule.triggering_service_name.toLowerCase() === newTriggeringService.toLowerCase()
    );

    if (existingRule) {
      toast({
        title: "Error",
        description: `A follow-up rule for ${newTriggeringService} already exists.`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the new rule object
      const newRule = {
        triggering_service_name: newTriggeringService,
        followUps: processedSteps.map((step, index) => {
          console.log(`Step ${index + 1} suggested_service_name:`, step.suggested_service_name);

          return {
            ...step,
            sequence: index + 1
          };
        })
      };

      console.log('New rule to be added:', newRule);

      // Add the rule using the context
      await addFollowUpRule(newRule);

      // Reset form
      setNewTriggeringService('');
      setNewFollowUpSteps([{ sequence: 1, interval_days: 180, suggested_service_name: '', notes: '' }]);
      setIsAddFollowUpRuleDialogOpen(false);
    } catch (error) {
      console.error('Error adding follow-up rule:', error);
    }
  };

  const handleEditFollowUpRule = (rule: ServiceFollowUpRule) => {
    setCurrentFollowUpRule(rule);
    setNewTriggeringService(rule.triggering_service_name);
    setNewFollowUpSteps([...rule.followUps]);
    setIsEditFollowUpRuleDialogOpen(true);
  };

  const handleUpdateFollowUpRuleConfirm = () => {
    setIsConfirmUpdateFollowUpRuleOpen(true);
  };

  const handleUpdateFollowUpRule = async () => {
    if (currentFollowUpRule) {
      // Validate required fields
      if (!newTriggeringService) {
        toast({
          title: "Error",
          description: "Triggering service name is required.",
          variant: "destructive"
        });
        return;
      }

      if (newFollowUpSteps.length === 0) {
        toast({
          title: "Error",
          description: "At least one follow-up step is required.",
          variant: "destructive"
        });
        return;
      }

      // Make a deep copy of the steps to ensure we don't modify the state directly
      const processedSteps = newFollowUpSteps.map(step => {
        // Check if the step has a suggested_service_name
        if (!step.suggested_service_name) {
          toast({
            title: "Error",
            description: "Follow-up name is required for all steps.",
            variant: "destructive"
          });
          return null;
        }

        if (step.interval_days <= 0) {
          toast({
            title: "Error",
            description: "Interval days must be a positive number for all steps.",
            variant: "destructive"
          });
          return null;
        }

        // Return a clean copy of the step with the correct field names
        return {
          sequence: step.sequence,
          interval_days: step.interval_days,
          suggested_service_name: step.suggested_service_name,
          notes: step.notes || ''
        };
      });

      // Check if any step validation failed
      if (processedSteps.includes(null)) {
        return;
      }

      try {
        // Create the updated rule object
        const updatedRule = {
          triggering_service_name: newTriggeringService,
          followUps: processedSteps.map((step, index) => {
            console.log(`Step ${index + 1} suggested_service_name:`, step.suggested_service_name);

            return {
              ...step,
              sequence: index + 1
            };
          })
        };

        console.log('Updated rule:', updatedRule);

        // Update the rule using the context
        await updateFollowUpRule(currentFollowUpRule.id, updatedRule);

        // Reset form and close dialogs
        setIsConfirmUpdateFollowUpRuleOpen(false);
        setIsEditFollowUpRuleDialogOpen(false);
        setCurrentFollowUpRule(null);
        setNewTriggeringService('');
        setNewFollowUpSteps([{ sequence: 1, interval_days: 180, suggested_service_name: '', notes: '' }]);
      } catch (error) {
        console.error('Error updating follow-up rule:', error);
      }
    }
  };

  const handleDeleteFollowUpRule = async () => {
    if (currentFollowUpRule) {
      try {
        // Delete the rule using the context
        await deleteFollowUpRule(currentFollowUpRule.id);

        // Close dialogs and reset state
        setIsConfirmDeleteFollowUpRuleOpen(false);
        setIsEditFollowUpRuleDialogOpen(false);
        setCurrentFollowUpRule(null);
      } catch (error) {
        console.error('Error deleting follow-up rule:', error);
      }
    }
  };

  const handleAddFollowUpStep = () => {
    setNewFollowUpSteps(prevSteps => [
      ...prevSteps,
      {
        sequence: prevSteps.length + 1,
        interval_days: 180,
        suggested_service_name: '',
        notes: ''
      }
    ]);
  };

  const handleRemoveFollowUpStep = (index: number) => {
    if (newFollowUpSteps.length > 1) {
      setNewFollowUpSteps(prevSteps => {
        const updatedSteps = prevSteps.filter((_, i) => i !== index);
        // Update sequences
        return updatedSteps.map((step, i) => ({
          ...step,
          sequence: i + 1
        }));
      });
    } else {
      toast({
        title: "Error",
        description: "At least one follow-up step is required.",
        variant: "destructive"
      });
    }
  };

  const handleFollowUpStepChange = (index: number, field: string, value: string | number) => {
    console.log(`Updating step ${index}, field: ${field}, value: ${value}`);

    setNewFollowUpSteps(prevSteps =>
      prevSteps.map((step, i) => {
        if (i === index) {
          const updatedStep = { ...step };

          // Map the field names to the correct property names
          if (field === 'intervalDays') {
            updatedStep.interval_days = value as number;
          } else if (field === 'suggestedServiceName' || field === 'suggested_service_name') {
            // Always set the suggested_service_name field
            updatedStep.suggested_service_name = value as string;

            // Log the update for debugging
            console.log(`Updated step ${index} suggested_service_name to: ${updatedStep.suggested_service_name}`);
          } else {
            updatedStep[field] = value;
          }

          // Log the entire updated step for debugging
          console.log(`Updated step ${index}:`, updatedStep);

          return updatedStep;
        }
        return step;
      })
    );
  };

  console.log("Rendering Settings page", { activeClinic, user });

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure and manage system settings</p>
        </div>
      </div>

      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clinic">Clinic Details</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          {activeClinic === 'dental' && <TabsTrigger value="service-followups">Service Follow-ups</TabsTrigger>}
          {activeClinic === 'dental' && <TabsTrigger value="labs">Labs</TabsTrigger>}
          {activeClinic === 'dental' && <TabsTrigger value="labwork">Lab Work Types</TabsTrigger>}
          {activeClinic === 'dental' && <TabsTrigger value="stock">Stock</TabsTrigger>}
          {activeClinic === 'dental' && <TabsTrigger value="dealers">Dealers</TabsTrigger>}
          <TabsTrigger value="medicines">Medicines</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic Information
              </CardTitle>
              <CardDescription>
                Basic information and operating hours for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name</Label>
                    <Input
                      id="clinicName"
                      defaultValue={currentClinicInfo.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Address</Label>
                    <Input
                      id="clinicAddress"
                      defaultValue={currentClinicInfo.address}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicCity">City</Label>
                    <Input
                      id="clinicCity"
                      defaultValue={currentClinicInfo.city}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicState">State</Label>
                    <Input
                      id="clinicState"
                      defaultValue={currentClinicInfo.state}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPincode">Pincode</Label>
                    <Input
                      id="clinicPincode"
                      defaultValue={currentClinicInfo.pincode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone">Phone Number</Label>
                    <Input
                      id="clinicPhone"
                      defaultValue={currentClinicInfo.phone}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicEmail">Email</Label>
                    <Input
                      id="clinicEmail"
                      type="email"
                      defaultValue={currentClinicInfo.email}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mondayHours">Monday</Label>
                    <Input
                      id="mondayHours"
                      defaultValue={currentClinicInfo.operatingHours.monday}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tuesdayHours">Tuesday</Label>
                    <Input
                      id="tuesdayHours"
                      defaultValue={currentClinicInfo.operatingHours.tuesday}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wednesdayHours">Wednesday</Label>
                    <Input
                      id="wednesdayHours"
                      defaultValue={currentClinicInfo.operatingHours.wednesday}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thursdayHours">Thursday</Label>
                    <Input
                      id="thursdayHours"
                      defaultValue={currentClinicInfo.operatingHours.thursday}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fridayHours">Friday</Label>
                    <Input
                      id="fridayHours"
                      defaultValue={currentClinicInfo.operatingHours.friday}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturdayHours">Saturday</Label>
                    <Input
                      id="saturdayHours"
                      defaultValue={currentClinicInfo.operatingHours.saturday}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sundayHours">Sunday</Label>
                    <Input
                      id="sundayHours"
                      defaultValue={currentClinicInfo.operatingHours.sunday}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className={`${activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}`}
                onClick={handleSaveClinicDetails}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Manage Doctors
                  </CardTitle>
                  <CardDescription>
                    Add and manage doctors for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddDoctorDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Doctor
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact Number</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-dental-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Loading doctors...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : dentalDoctors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-sm text-muted-foreground mb-2">No doctors found</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAddDoctorDialogOpen(true)}
                              className="text-xs"
                            >
                              <UserPlus className="h-3 w-3 mr-1" /> Add Doctor
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dentalDoctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-medium">{doctor.name}</TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell>{doctor.email}</TableCell>
                          <TableCell>{doctor.phone}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {doctor.aadhar_doc && (
                                <button
                                  className="text-blue-600 hover:underline flex items-center"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDocumentDownload(doctor.aadhar_doc, 'Aadhar');
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" /> Aadhar
                                </button>
                              )}
                              {doctor.pan_doc && (
                                <button
                                  className="text-blue-600 hover:underline flex items-center"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDocumentDownload(doctor.pan_doc, 'PAN');
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" /> PAN
                                </button>
                              )}
                              {!doctor.aadhar_doc && !doctor.pan_doc && (
                                <span className="text-gray-400 text-sm">No documents</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:border-dental-primary hover:shadow-sm transition-all"
                                style={{ backgroundColor: doctor.color }}
                                title="Click to change color"
                                onClick={() => handleOpenColorPicker(doctor)}
                              ></div>
                              <span className="text-xs text-muted-foreground">Click to edit</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditDoctor(doctor)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setCurrentDoctor(doctor);
                                  setIsConfirmDeleteDoctorOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Add Doctor Dialog */}
            <Dialog open={isAddDoctorDialogOpen} onOpenChange={setIsAddDoctorDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new doctor. All fields are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="doctorName" className="flex items-center">
                        Full Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="doctorName"
                        placeholder="Dr. Full Name"
                        required
                        value={newDoctorName}
                        onChange={(e) => setNewDoctorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="doctorSpecialization" className="flex items-center">
                        Specialization <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="doctorSpecialization"
                        placeholder="e.g., Orthodontics"
                        required
                        value={newDoctorSpecialization}
                        onChange={(e) => setNewDoctorSpecialization(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="doctorEmail" className="flex items-center">
                        Email <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="doctorEmail"
                        type="email"
                        placeholder="doctor@example.com"
                        required
                        pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}"
                        title="Please enter a valid email address"
                        value={newDoctorEmail}
                        onChange={(e) => setNewDoctorEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="doctorPhone" className="flex items-center">
                        Contact Number <span className="text-red-500 ml-1">*</span>
                      </Label>
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
                          id="doctorPhone"
                          className="rounded-l-none"
                          placeholder="Contact Number"
                          required
                          pattern="\d+"
                          title="Please enter only digits"
                          value={newDoctorPhone}
                          onChange={(e) => setNewDoctorPhone(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-1">
                    <Label className="text-base font-medium">Document Upload</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="aadharUpload" className="flex items-center text-sm">
                          <FileText className="h-3 w-3 mr-1" /> Aadhar Card
                        </Label>
                        <Input
                          id="aadharUpload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="text-sm"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAadharFile(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="panUpload" className="flex items-center text-sm">
                          <FileText className="h-3 w-3 mr-1" /> PAN Card
                        </Label>
                        <Input
                          id="panUpload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="text-sm"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPanFile(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDoctorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-dental-primary hover:bg-dental-dark"
                    onClick={async () => {
                      // Validate email format
                      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                      const isEmailValid = emailRegex.test(newDoctorEmail);

                      // Validate phone number (only digits allowed)
                      const phoneRegex = /^\d+$/;
                      const isPhoneValid = phoneRegex.test(newDoctorPhone);

                      if (!isEmailValid) {
                        toast({
                          title: "Invalid Email",
                          description: "Please enter a valid email address.",
                          variant: "destructive"
                        });
                        return;
                      }

                      if (!isPhoneValid) {
                        toast({
                          title: "Invalid Phone Number",
                          description: "Phone number should contain only digits.",
                          variant: "destructive"
                        });
                        return;
                      }

                      if (newDoctorName && newDoctorSpecialization && newDoctorEmail && newDoctorPhone) {
                        // Add new doctor using the DoctorContext with file uploads
                        const newDoctor = {
                          name: newDoctorName,
                          specialization: newDoctorSpecialization,
                          email: newDoctorEmail,
                          phone: `${phoneCountryCode} ${newDoctorPhone}`,
                          color: getRandomDentalColor() // Assign a random dental-themed color
                        };

                        // Pass the doctor data and files to the addDoctor function
                        await addDoctor(newDoctor, aadharFile || undefined, panFile || undefined);

                        // Reset form fields
                        setNewDoctorName('');
                        setNewDoctorSpecialization('');
                        setNewDoctorEmail('');
                        setNewDoctorPhone('');
                        setAadharFile(null);
                        setPanFile(null);

                        // Reset file input elements
                        const aadharInput = document.getElementById('aadharUpload') as HTMLInputElement;
                        const panInput = document.getElementById('panUpload') as HTMLInputElement;
                        if (aadharInput) aadharInput.value = '';
                        if (panInput) panInput.value = '';

                        toast({
                          title: "Doctor Added",
                          description: "The new doctor has been successfully added.",
                        });
                        setIsAddDoctorDialogOpen(false);
                      } else {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in all required fields.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Add Doctor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Doctor Dialog */}
            <Dialog open={isEditDoctorDialogOpen} onOpenChange={setIsEditDoctorDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Doctor</DialogTitle>
                  <DialogDescription>
                    Update doctor information or upload new documents.
                  </DialogDescription>
                </DialogHeader>
                {currentDoctor && (
                  <div className="grid gap-3 py-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="editDoctorName">Full Name</Label>
                        <Input
                          id="editDoctorName"
                          defaultValue={currentDoctor.name}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editDoctorSpecialization">Specialization</Label>
                        <Input
                          id="editDoctorSpecialization"
                          defaultValue={currentDoctor.specialization}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editDoctorPhone">Contact Number</Label>
                        <div className="flex">
                          <Select
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
                            id="editDoctorPhone"
                            className="rounded-l-none"
                            pattern="\d+"
                            title="Please enter only digits"
                            defaultValue={currentDoctor.phone.split(' ').slice(1).join(' ')}
                            onInput={(e) => {
                              const input = e.target as HTMLInputElement;
                              input.value = input.value.replace(/\D/g, '');
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editDoctorEmail">Email</Label>
                        <Input
                          id="editDoctorEmail"
                          type="email"
                          pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}"
                          title="Please enter a valid email address"
                          defaultValue={currentDoctor.email}
                        />
                      </div>

                    </div>

                    <div className="space-y-2 mt-1">
                      <Label className="text-base font-medium">Document Upload</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="editAadharUpload" className="flex items-center text-sm">
                              <FileText className="h-3 w-3 mr-1" /> Aadhar Card
                            </Label>
                            {currentDoctor.aadhar_doc && (
                              <button
                                className="text-blue-600 hover:underline text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDocumentDownload(currentDoctor.aadhar_doc, 'Aadhar');
                                }}
                              >
                                View Current
                              </button>
                            )}
                          </div>
                          <Input
                            id="editAadharUpload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="text-sm"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setEditAadharFile(e.target.files[0]);
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="editPanUpload" className="flex items-center text-sm">
                              <FileText className="h-3 w-3 mr-1" /> PAN Card
                            </Label>
                            {currentDoctor.pan_doc && (
                              <button
                                className="text-blue-600 hover:underline text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDocumentDownload(currentDoctor.pan_doc, 'PAN');
                                }}
                              >
                                View Current
                              </button>
                            )}
                          </div>
                          <Input
                            id="editPanUpload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="text-sm"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setEditPanFile(e.target.files[0]);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDoctorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={handleUpdateDoctorConfirm}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <Dialog open={isConfirmDeleteDoctorOpen} onOpenChange={setIsConfirmDeleteDoctorOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this doctor? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {currentDoctor && (
                  <div className="py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{currentDoctor.name}</p>
                      <div
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: currentDoctor.color }}
                        title={currentDoctor.color}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentDoctor.specialization}</p>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmDeleteDoctorOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteDoctor}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isConfirmUpdateDoctorOpen} onOpenChange={setIsConfirmUpdateDoctorOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Update</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to save these changes?
                  </DialogDescription>
                </DialogHeader>
                {currentDoctor && (
                  <div className="py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">Doctor:</p>
                      <p>{(document.getElementById('editDoctorName') as HTMLInputElement)?.value || currentDoctor.name}</p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmUpdateDoctorOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateDoctor}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Color Picker Dialog */}
            <Dialog open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Change Doctor Color</DialogTitle>
                  <DialogDescription>
                    {selectedDoctorForColor && `Select a new color for ${selectedDoctorForColor.name}`}
                  </DialogDescription>
                </DialogHeader>
                {selectedDoctorForColor && (
                  <div className="py-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full border border-gray-200"
                          style={{ backgroundColor: selectedDoctorForColor.color }}
                          title="Current color"
                        ></div>
                        <span className="text-xl">→</span>
                        <div
                          className="w-10 h-10 rounded-full border border-gray-200"
                          style={{ backgroundColor: tempColor }}
                          title="New color"
                        ></div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <Label htmlFor="doctorColorPicker">Choose a color</Label>
                        <Input
                          id="doctorColorPicker"
                          type="color"
                          value={tempColor}
                          onChange={(e) => setTempColor(e.target.value)}
                          className="w-full h-10 cursor-pointer"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground text-center mt-2">
                        This color will be used to identify the doctor in the appointment calendar
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsColorPickerOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={handleColorChange}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Color
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Manage Services
                </CardTitle>
                <CardDescription>
                  Add and manage services for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddServiceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Duration (mins)</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.duration}</TableCell>
                      <TableCell>₹{service.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              setCurrentService(service);
                              setIsConfirmDeleteServiceOpen(true);
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
            </CardContent>
          </Card>

          {/* Add Service Dialog */}
          <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Enter the details for the new service offering.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input id="serviceName" placeholder="Enter service name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceDuration">Duration (minutes)</Label>
                    <Input id="serviceDuration" type="number" placeholder="e.g., 30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servicePrice">Price (₹)</Label>
                    <Input id="servicePrice" type="number" placeholder="e.g., 1500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceDescription">Description (Optional)</Label>
                    <Textarea id="serviceDescription" placeholder="Brief description of the service" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddServiceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className={activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                  onClick={async () => {
                    // Get values from form fields
                    const serviceName = document.getElementById('serviceName') as HTMLInputElement;
                    const serviceDuration = document.getElementById('serviceDuration') as HTMLInputElement;
                    const servicePrice = document.getElementById('servicePrice') as HTMLInputElement;
                    const serviceDescription = document.getElementById('serviceDescription') as HTMLTextAreaElement;

                    // Validate required fields
                    if (!serviceName.value.trim()) {
                      toast({
                        title: "Error",
                        description: "Service name is required.",
                        variant: "destructive"
                      });
                      return;
                    }

                    if (!serviceDuration.value || parseInt(serviceDuration.value) <= 0) {
                      toast({
                        title: "Error",
                        description: "Duration must be a positive number.",
                        variant: "destructive"
                      });
                      return;
                    }

                    const priceValue = parseFloat(servicePrice.value);
                    if (!servicePrice.value || isNaN(priceValue) || priceValue < 0) {
                      toast({
                        title: "Error",
                        description: "Price must be a valid non-negative number.",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      // Create new service object
                      const newService = {
                        name: capitalizeWords(serviceName.value.trim()),
                        duration: parseInt(serviceDuration.value),
                        price: parseFloat(servicePrice.value),
                        description: serviceDescription?.value?.trim() || '',
                        clinic_type: activeClinic as 'dental' | 'meditouch'
                      };

                      // Add the new service using the ServiceContext
                      await addService(newService);

                      // Reset form fields
                      serviceName.value = '';
                      serviceDuration.value = '';
                      servicePrice.value = '';
                      if (serviceDescription) serviceDescription.value = '';

                      setIsAddServiceDialogOpen(false);

                      // Toast is already shown by the context
                    } catch (error) {
                      console.error('Error adding service:', error);
                      toast({
                        title: "Error",
                        description: "Failed to add service. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Add Service
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Service Dialog */}
          <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Service</DialogTitle>
                <DialogDescription>
                  Update service details.
                </DialogDescription>
              </DialogHeader>
              {currentService && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editServiceName">Service Name</Label>
                      <Input
                        id="editServiceName"
                        defaultValue={currentService.name}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editServiceDuration">Duration (minutes)</Label>
                      <Input
                        id="editServiceDuration"
                        type="number"
                        defaultValue={currentService.duration}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editServicePrice">Price (₹)</Label>
                      <Input
                        id="editServicePrice"
                        type="number"
                        defaultValue={currentService.price}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editServiceDescription">Description (Optional)</Label>
                      <Textarea
                        id="editServiceDescription"
                        defaultValue={currentService.description || ''}
                        placeholder="Brief description of the service"
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditServiceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className={activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                  onClick={handleUpdateServiceConfirm}
                >
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirmation Dialogs */}
          <Dialog open={isConfirmDeleteServiceOpen} onOpenChange={setIsConfirmDeleteServiceOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this service? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {currentService && (
                <div className="py-4">
                  <p className="font-medium">{currentService.name}</p>
                  <p className="text-sm text-muted-foreground">₹{currentService.price} - {currentService.duration} mins</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDeleteServiceOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteService}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isConfirmUpdateServiceOpen} onOpenChange={setIsConfirmUpdateServiceOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogDescription>
                  Are you sure you want to save these changes?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmUpdateServiceOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateService}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {activeClinic === 'dental' && (
          <TabsContent value="service-followups" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Service Follow-ups
                  </CardTitle>
                  <CardDescription>
                    Configure follow-up protocols for dental services
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      cleanupDuplicateRules();
                      toast({
                        title: "Cleaning Up Duplicates",
                        description: "Removing duplicate follow-up rules...",
                      });
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clean Up Duplicates
                  </Button>
                  <Button onClick={() => setIsAddFollowUpRuleDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Follow-up Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Triggering Service</TableHead>
                      <TableHead>Follow-up Steps</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRules ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading follow-up rules...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      followUpRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.triggering_service_name}</TableCell>
                          <TableCell>
                            {rule.followUps.map((step, index) => {

                              // Create a local copy of the step to avoid modifying the original
                              const displayStep = { ...step };

                              // Ensure suggested_service_name is set
                              if (!displayStep.suggested_service_name && (displayStep as any).suggestedServiceName) {
                                displayStep.suggested_service_name = (displayStep as any).suggestedServiceName;
                              }

                              // If still not set, use a default
                              if (!displayStep.suggested_service_name) {
                                displayStep.suggested_service_name = `Follow-up ${index + 1}`;
                              }

                              return (
                                <div key={index} className="mb-1 last:mb-0">
                                  <Badge variant="outline" className="mr-2">
                                    {index + 1}
                                  </Badge>
                                  {displayStep.interval_days} days
                                  <span className="mx-1">→</span>
                                  <span className="font-medium">
                                    {displayStep.suggested_service_name}
                                  </span>
                                  {displayStep.notes && (
                                    <span className="ml-2 text-gray-500 text-sm italic">
                                      ({displayStep.notes})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditFollowUpRule(rule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setCurrentFollowUpRule(rule);
                                  setIsConfirmDeleteFollowUpRuleOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {followUpRules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          No follow-up rules defined
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Add Follow-up Rule Dialog */}
            <Dialog open={isAddFollowUpRuleDialogOpen} onOpenChange={setIsAddFollowUpRuleDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Follow-up Rule</DialogTitle>
                  <DialogDescription>
                    Define a follow-up protocol for a dental service
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="triggeringService">Triggering Service *</Label>
                    <Select
                      value={newTriggeringService}
                      onValueChange={setNewTriggeringService}
                    >
                      <SelectTrigger id="triggeringService">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {dentalServices.map(service => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Follow-up Steps</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddFollowUpStep}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Step
                      </Button>
                    </div>

                    {newFollowUpSteps.map((step, index) => (
                      <div key={index} className="space-y-3 p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Step {index + 1}</h4>
                          {newFollowUpSteps.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveFollowUpStep(index)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Remove
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`interval-${index}`}>Interval (days) *</Label>
                          <Input
                            id={`interval-${index}`}
                            type="number"
                            min="1"
                            value={step.interval_days}
                            onChange={(e) => handleFollowUpStepChange(index, 'intervalDays', parseInt(e.target.value) || 0)}
                            placeholder="e.g., 180 for 6 months"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`followup-name-${index}`}>Follow-up Name *</Label>
                          <Input
                            id={`followup-name-${index}`}
                            value={step.suggested_service_name || ''}
                            onChange={(e) => handleFollowUpStepChange(index, 'suggested_service_name', e.target.value)}
                            placeholder="Enter follow-up name"
                            required
                            className={!step.suggested_service_name ? 'border-red-500' : ''}
                          />
                          {!step.suggested_service_name && (
                            <p className="text-sm text-red-500 mt-1">Follow-up name is required</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${index}`}>Notes (Optional)</Label>
                          <Textarea
                            id={`notes-${index}`}
                            value={step.notes || ''}
                            onChange={(e) => handleFollowUpStepChange(index, 'notes', e.target.value)}
                            placeholder="Additional instructions for staff"
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddFollowUpRuleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={handleAddFollowUpRule}
                  >
                    Add Follow-up Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Follow-up Rule Dialog */}
            <Dialog open={isEditFollowUpRuleDialogOpen} onOpenChange={setIsEditFollowUpRuleDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Follow-up Rule</DialogTitle>
                  <DialogDescription>
                    Update follow-up protocol for a dental service
                  </DialogDescription>
                </DialogHeader>
                {currentFollowUpRule && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editTriggeringService">Triggering Service *</Label>
                      <Select
                        value={newTriggeringService}
                        onValueChange={setNewTriggeringService}
                      >
                        <SelectTrigger id="editTriggeringService">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {dentalServices.map(service => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Follow-up Steps</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddFollowUpStep}
                          className="h-8"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Step
                        </Button>
                      </div>

                      {newFollowUpSteps.map((step, index) => (
                        <div key={index} className="space-y-3 p-3 border rounded-md">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Step {index + 1}</h4>
                            {newFollowUpSteps.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-red-500 hover:text-red-700"
                                onClick={() => handleRemoveFollowUpStep(index)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Remove
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-interval-${index}`}>Interval (days) *</Label>
                            <Input
                              id={`edit-interval-${index}`}
                              type="number"
                              min="1"
                              value={step.interval_days}
                              onChange={(e) => handleFollowUpStepChange(index, 'intervalDays', parseInt(e.target.value) || 0)}
                              placeholder="e.g., 180 for 6 months"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-followup-name-${index}`}>Follow-up Name *</Label>
                            <Input
                              id={`edit-followup-name-${index}`}
                              value={step.suggested_service_name || ''}
                              onChange={(e) => handleFollowUpStepChange(index, 'suggested_service_name', e.target.value)}
                              placeholder="Enter follow-up name"
                              required
                              className={!step.suggested_service_name ? 'border-red-500' : ''}
                            />
                            {!step.suggested_service_name && (
                              <p className="text-sm text-red-500 mt-1">Follow-up name is required</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-notes-${index}`}>Notes (Optional)</Label>
                            <Textarea
                              id={`edit-notes-${index}`}
                              value={step.notes || ''}
                              onChange={(e) => handleFollowUpStepChange(index, 'notes', e.target.value)}
                              placeholder="Additional instructions for staff"
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditFollowUpRuleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={handleUpdateFollowUpRuleConfirm}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <Dialog open={isConfirmDeleteFollowUpRuleOpen} onOpenChange={setIsConfirmDeleteFollowUpRuleOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this follow-up rule? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {currentFollowUpRule && (
                  <div className="py-4">
                    <p className="font-medium">{currentFollowUpRule.triggering_service_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentFollowUpRule.followUps.length} follow-up step(s)
                    </p>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmDeleteFollowUpRuleOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteFollowUpRule}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isConfirmUpdateFollowUpRuleOpen} onOpenChange={setIsConfirmUpdateFollowUpRuleOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Update</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to save these changes?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmUpdateFollowUpRuleOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateFollowUpRule}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        {activeClinic === 'dental' && (
          <TabsContent value="labs" className="space-y-6">
            <LabsTab />
          </TabsContent>
        )}

        {activeClinic === 'dental' && (
          <TabsContent value="labwork" className="space-y-6">
            <LabWorkTypesTab />
          </TabsContent>
        )}

        {activeClinic === 'dental' && (
          <TabsContent value="dealers" className="space-y-6">
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
                <Button onClick={() => setIsAddDealerDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Dealer
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Pincode</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...dealers]
                      .sort((a, b) => b.id - a.id) // Sort by ID in descending order (newest first)
                      .map((dealer) => (
                        <TableRow key={dealer.id}>
                          <TableCell className="font-medium">{dealer.name}</TableCell>
                          <TableCell>{dealer.email || '-'}</TableCell>
                          <TableCell>{dealer.contact}</TableCell>
                          <TableCell>{dealer.address}</TableCell>
                          <TableCell>{dealer.city}</TableCell>
                          <TableCell>{dealer.pincode}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditDealer(dealer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setCurrentDealer(dealer);
                                  setIsConfirmDeleteDealerOpen(true);
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
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="medicines" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Manage Medicines
                  </CardTitle>
                  <CardDescription>
                    Add and manage medicines for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddMedicineDialogOpen(true)}
                  className={activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Medicine
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-medium">{medicine.name}</TableCell>
                        <TableCell>{medicine.dosage}</TableCell>
                        <TableCell>{medicine.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMedicine(medicine)}
                              className={activeClinic === 'dental' ? 'hover:text-dental-primary' : 'hover:text-meditouch-primary'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                setCurrentMedicine(medicine);
                                setIsConfirmDeleteMedicineOpen(true);
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
              </CardContent>
            </Card>

            {/* Add Medicine Dialog */}
            <Dialog open={isAddMedicineDialogOpen} onOpenChange={setIsAddMedicineDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Medicine</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new medicine for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic. Name and dosage are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newMedicineName" className="flex items-center">
                        Medicine Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="newMedicineName"
                        placeholder="e.g., Amoxicillin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newMedicineDosage" className="flex items-center">
                        Dosage <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="newMedicineDosage"
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newMedicineDescription">
                        Description
                      </Label>
                      <Textarea
                        id="newMedicineDescription"
                        placeholder="e.g., Antibiotic used to treat bacterial infections"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddMedicineDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className={activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                    onClick={handleAddMedicine}
                  >
                    Add Medicine
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Medicine Dialog */}
            <Dialog open={isEditMedicineDialogOpen} onOpenChange={setIsEditMedicineDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Medicine</DialogTitle>
                  <DialogDescription>
                    Update medicine information for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic.
                  </DialogDescription>
                </DialogHeader>
                {currentMedicine && (
                  <div className="grid gap-3 py-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="editMedicineName" className="flex items-center">
                          Medicine Name <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="editMedicineName"
                          defaultValue={currentMedicine.name}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editMedicineDosage" className="flex items-center">
                          Dosage <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="editMedicineDosage"
                          defaultValue={currentMedicine.dosage}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editMedicineDescription">Description</Label>
                        <Textarea
                          id="editMedicineDescription"
                          defaultValue={currentMedicine.description || ''}
                          placeholder="Enter medicine description"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditMedicineDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className={activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                    onClick={handleUpdateMedicineConfirm}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <Dialog open={isConfirmDeleteMedicineOpen} onOpenChange={setIsConfirmDeleteMedicineOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this medicine? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {currentMedicine && (
                  <div className="py-4">
                    <p className="font-medium">{currentMedicine.name}</p>
                    <p className="text-sm text-muted-foreground">{currentMedicine.dosage}</p>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmDeleteMedicineOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteMedicine}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isConfirmUpdateMedicineOpen} onOpenChange={setIsConfirmUpdateMedicineOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Update</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to save these changes?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmUpdateMedicineOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateMedicine}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Dealer Dialog */}
            <Dialog open={isAddDealerDialogOpen} onOpenChange={setIsAddDealerDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Dealer</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new dealer. Name and contact number are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dealerName" className="flex items-center">
                        Dealer Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="dealerName"
                        placeholder="e.g., Dental Supplies Co."
                        value={newDealerName}
                        onChange={(e) => setNewDealerName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealerEmail">
                        Email
                      </Label>
                      <Input
                        id="dealerEmail"
                        type="email"
                        placeholder="e.g., contact@dentalsupplies.com"
                        value={newDealerEmail}
                        onChange={(e) => setNewDealerEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealerContact" className="flex items-center">
                        Contact Number <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="flex">
                        <Select
                          defaultValue="+91"
                          value={newDealerContactCountryCode}
                          onValueChange={setNewDealerContactCountryCode}
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
                          id="dealerContact"
                          className="rounded-l-none"
                          placeholder="Contact Number"
                          required
                          pattern="\d+"
                          title="Please enter only digits"
                          value={newDealerContact}
                          onChange={(e) => setNewDealerContact(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealerAddress">
                        Address
                      </Label>
                      <Input
                        id="dealerAddress"
                        placeholder="Enter street address"
                        value={newDealerAddress}
                        onChange={(e) => setNewDealerAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealerCity">
                        City
                      </Label>
                      <Input
                        id="dealerCity"
                        placeholder="Enter city"
                        value={newDealerCity}
                        onChange={(e) => setNewDealerCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealerPincode">
                        Pincode
                      </Label>
                      <Input
                        id="dealerPincode"
                        placeholder="Enter pincode"
                        value={newDealerPincode}
                        onChange={(e) => setNewDealerPincode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDealerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={() => {
                      // Validate required fields
                      if (!newDealerName.trim()) {
                        toast({
                          title: "Error",
                          description: "Dealer name is required.",
                          variant: "destructive"
                        });
                        return;
                      }

                      if (!newDealerContact.trim()) {
                        toast({
                          title: "Error",
                          description: "Contact number is required.",
                          variant: "destructive"
                        });
                        return;
                      }

                      // Validate email format if provided
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (newDealerEmail.trim() && !emailRegex.test(newDealerEmail.trim())) {
                        toast({
                          title: "Error",
                          description: "Please enter a valid email address.",
                          variant: "destructive"
                        });
                        return;
                      }

                      // Generate a new ID
                      const newId = Math.max(...dealers.map(dealer => dealer.id)) + 1;

                      // Format the contact number with country code
                      const formattedContact = `${newDealerContactCountryCode} ${newDealerContact.trim()}`;

                      // Add the new dealer to the dealers state
                      setDealers(prevDealers => [
                        {
                          id: newId,
                          name: capitalizeWords(newDealerName.trim()),
                          email: newDealerEmail.trim(),
                          contact: formattedContact,
                          address: capitalizeWords(newDealerAddress.trim()),
                          city: capitalizeWords(newDealerCity.trim()),
                          pincode: newDealerPincode.trim()
                        },
                        ...prevDealers
                      ]);

                      toast({
                        title: "Dealer Added",
                        description: "The new dealer has been successfully added.",
                      });
                      setNewDealerName('');
                      setNewDealerEmail('');
                      setNewDealerContact('');
                      setNewDealerAddress('');
                      setNewDealerCity('');
                      setNewDealerPincode('');
                      setNewDealerContactCountryCode('+91');
                      setIsAddDealerDialogOpen(false);
                    }}
                  >
                    Add Dealer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dealer Dialog */}
            <Dialog open={isEditDealerDialogOpen} onOpenChange={setIsEditDealerDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Dealer</DialogTitle>
                  <DialogDescription>
                    Update dealer information.
                  </DialogDescription>
                </DialogHeader>
                {currentDealer && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editDealerName" className="flex items-center">
                          Dealer Name <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="editDealerName"
                          defaultValue={currentDealer.name}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDealerEmail">
                          Email
                        </Label>
                        <Input
                          id="editDealerEmail"
                          type="email"
                          defaultValue={currentDealer.email || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDealerContact" className="flex items-center">
                          Contact Number <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <div className="flex">
                          <Select
                            defaultValue="+91"
                            onValueChange={(value) => {
                              // Create a temporary element to store the selected value
                              const tempElement = document.createElement('div');
                              tempElement.id = 'tempDealerCountryCode';
                              tempElement.setAttribute('data-value', value);
                              document.body.appendChild(tempElement);
                            }}
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
                            id="editDealerContact"
                            className="rounded-l-none"
                            defaultValue={newDealerContact}
                            pattern="\d+"
                            title="Please enter only digits"
                            onInput={(e) => {
                              const input = e.target as HTMLInputElement;
                              input.value = input.value.replace(/\D/g, '');
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDealerAddress">
                          Address
                        </Label>
                        <Input
                          id="editDealerAddress"
                          defaultValue={currentDealer.address || ''}
                          placeholder="Enter street address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDealerCity">
                          City
                        </Label>
                        <Input
                          id="editDealerCity"
                          defaultValue={currentDealer.city || ''}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDealerPincode">
                          Pincode
                        </Label>
                        <Input
                          id="editDealerPincode"
                          defaultValue={currentDealer.pincode || ''}
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDealerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={handleUpdateDealerConfirm}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <Dialog open={isConfirmDeleteDealerOpen} onOpenChange={setIsConfirmDeleteDealerOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this dealer? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {currentDealer && (
                  <div className="py-4">
                    <p className="font-medium">{currentDealer.name}</p>
                    <p className="text-sm text-muted-foreground">{currentDealer.contact}</p>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmDeleteDealerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteDealer}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isConfirmUpdateDealerOpen} onOpenChange={setIsConfirmUpdateDealerOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Update</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to save these changes?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmUpdateDealerOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateDealer}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

        {activeClinic === 'dental' && (
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Manage Stock Items
                  </CardTitle>
                  <CardDescription>
                    Configure stock items, sub-items, and item types for Dental Metrix Clinic
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddStockItemDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Stock Item
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Sub-item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Item Type</TableHead>
                      <TableHead>Min Threshold</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...stockItems]
                      .sort((a, b) => b.id - a.id) // Sort by ID in descending order (newest first)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.subItem || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate" title={item.description}>
                            {item.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={item.itemType === 'Consumable' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-teal-50 text-teal-700 border-teal-200'}>
                              {item.itemType}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.minimumThreshold || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditStockItem(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setCurrentStockItem(item);
                                  setIsConfirmDeleteStockItemOpen(true);
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
              </CardContent>
            </Card>

            {/* Add Stock Item Dialog */}
            <Dialog open={isAddStockItemDialogOpen} onOpenChange={setIsAddStockItemDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Stock Item</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new stock item. Item name is required.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stockItemName" className="flex items-center">
                        Item Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="stockItemName"
                        placeholder="e.g., Dental Composite"
                        value={newStockItemName}
                        onChange={(e) => setNewStockItemName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockItemSubItem">Sub-item</Label>
                      <Input
                        id="stockItemSubItem"
                        placeholder="e.g., Filtek Supreme Ultra"
                        value={newStockItemSubItem}
                        onChange={(e) => setNewStockItemSubItem(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockItemDescription">Description</Label>
                      <Textarea
                        id="stockItemDescription"
                        placeholder="e.g., Light-cured restorative material for anterior and posterior restorations"
                        value={newStockItemDescription}
                        onChange={(e) => setNewStockItemDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockItemType" className="flex items-center">
                        Item Type <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select
                        value={newStockItemType}
                        onValueChange={setNewStockItemType}
                      >
                        <SelectTrigger id="stockItemType">
                          <SelectValue placeholder="Select Item Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consumable">Consumable</SelectItem>
                          <SelectItem value="Inventory">Inventory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockItemMinThreshold" className="flex items-center">
                        Minimum Threshold <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="stockItemMinThreshold"
                        type="number"
                        min="0"
                        placeholder="Minimum quantity to maintain"
                        value={newStockItemMinThreshold}
                        onChange={(e) => setNewStockItemMinThreshold(parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Items will be marked as low stock when quantity falls below this threshold
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddStockItemDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={() => {
                      if (!newStockItemName.trim()) {
                        toast({
                          title: "Error",
                          description: "Item name is required.",
                          variant: "destructive"
                        });
                        return;
                      }

                      // Generate a new ID (in a real app, this would come from the backend)
                      const newId = Math.max(...stockItems.map(item => item.id)) + 1;

                      // Validate minimum threshold
                      if (!newStockItemMinThreshold || newStockItemMinThreshold < 0) {
                        toast({
                          title: "Error",
                          description: "Minimum threshold is required and must be a positive number.",
                          variant: "destructive"
                        });
                        return;
                      }

                      // Add the new item to the stock items state
                      // New item is added to the array, and will appear at the top due to our sorting
                      setStockItems(prevItems => [
                        {
                          id: newId,
                          name: newStockItemName,
                          subItem: newStockItemSubItem,
                          description: newStockItemDescription,
                          itemType: newStockItemType,
                          minimumThreshold: newStockItemMinThreshold
                        },
                        ...prevItems
                      ]);

                      toast({
                        title: "Stock Item Added",
                        description: "The new stock item has been successfully added.",
                      });
                      setNewStockItemName('');
                      setNewStockItemSubItem('');
                      setNewStockItemDescription('');
                      setNewStockItemType('Consumable');
                      setNewStockItemMinThreshold(0);
                      setIsAddStockItemDialogOpen(false);
                    }}
                  >
                    Add Stock Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Stock Item Dialog */}
            <Dialog open={isEditStockItemDialogOpen} onOpenChange={setIsEditStockItemDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Stock Item</DialogTitle>
                  <DialogDescription>
                    Update stock item information.
                  </DialogDescription>
                </DialogHeader>
                {currentStockItem && (
                  <div className="grid gap-3 py-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="editStockItemName" className="flex items-center">
                          Item Name <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="editStockItemName"
                          defaultValue={currentStockItem.name}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editStockItemSubItem">Sub-item</Label>
                        <Input
                          id="editStockItemSubItem"
                          defaultValue={currentStockItem.subItem || ''}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editStockItemDescription">Description</Label>
                        <Textarea
                          id="editStockItemDescription"
                          defaultValue={currentStockItem.description || ''}
                          placeholder="Enter item description"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editStockItemType" className="flex items-center">
                          Item Type <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select
                          defaultValue={currentStockItem.itemType}
                          onValueChange={(value) => {
                            // Create a temporary element to store the selected value
                            const tempElement = document.createElement('div');
                            tempElement.id = 'tempEditStockItemType';
                            tempElement.setAttribute('data-value', value);
                            document.body.appendChild(tempElement);
                          }}
                        >
                          <SelectTrigger id="editStockItemType">
                            <SelectValue placeholder="Select Item Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consumable">Consumable</SelectItem>
                            <SelectItem value="Inventory">Inventory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editStockItemMinThreshold" className="flex items-center">
                          Minimum Threshold <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="editStockItemMinThreshold"
                          type="number"
                          min="0"
                          defaultValue={currentStockItem.minimumThreshold}
                          placeholder="Minimum quantity to maintain"
                        />
                        <p className="text-xs text-muted-foreground">
                          Items will be marked as low stock when quantity falls below this threshold
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditStockItemDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-dental-primary hover:bg-dental-dark"
                    onClick={handleUpdateStockItemConfirm}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <Dialog open={isConfirmDeleteStockItemOpen} onOpenChange={setIsConfirmDeleteStockItemOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this stock item? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {currentStockItem && (
                  <div className="py-4">
                    <p className="font-medium">{currentStockItem.name}</p>
                    <p className="text-sm text-muted-foreground">{currentStockItem.subItem || ''}</p>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmDeleteStockItemOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteStockItem}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isConfirmUpdateStockItemOpen} onOpenChange={setIsConfirmUpdateStockItemOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Update</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to save these changes?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmUpdateStockItemOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStockItem}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure automated notifications for patients and staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Appointment Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Appointment Confirmation</h4>
                      <p className="text-sm text-muted-foreground">Send confirmation after booking an appointment</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="confirmation-email" />
                      <Label htmlFor="confirmation-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="confirmation-whatsapp" />
                      <Label htmlFor="confirmation-whatsapp">WhatsApp</Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Appointment Reminder</h4>
                      <p className="text-sm text-muted-foreground">Send reminder before scheduled appointment</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="reminder-email" defaultChecked />
                      <Label htmlFor="reminder-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="reminder-whatsapp" defaultChecked />
                      <Label htmlFor="reminder-whatsapp">WhatsApp</Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Appointment Changes</h4>
                      <p className="text-sm text-muted-foreground">Notify when appointment is rescheduled or cancelled</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="changes-email" defaultChecked />
                      <Label htmlFor="changes-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="changes-whatsapp" defaultChecked />
                      <Label htmlFor="changes-whatsapp">WhatsApp</Label>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold pt-4">Staff Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Daily Schedule</h4>
                      <p className="text-sm text-muted-foreground">Send daily appointment schedule to staff</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="schedule-email" />
                      <Label htmlFor="schedule-email">Email</Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Stock Alerts</h4>
                      <p className="text-sm text-muted-foreground">Notify when inventory items are low</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="stock-email" defaultChecked />
                      <Label htmlFor="stock-email">Email</Label>
                    </div>
                  </div>

                  {activeClinic === 'dental' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Lab Work Updates</h4>
                        <p className="text-sm text-muted-foreground">Notify staff about lab work status changes</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="labwork-email" defaultChecked />
                        <Label htmlFor="labwork-email">Email</Label>
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold pt-4">Template Customization</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Customize the message templates for various notifications.
                    You can use placeholders like {`{patient_name}`}, {`{appointment_date}`}, etc.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentConfirmationTemplate">Appointment Confirmation Template</Label>
                    <Textarea
                      id="appointmentConfirmationTemplate"
                      rows={3}
                      defaultValue={`Dear {patient_name}, your appointment at {clinic_name} has been confirmed for {appointment_date} at {appointment_time}. Thank you for choosing us!`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className={`${activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}`}
                onClick={() => {
                  toast({
                    title: "Notification Settings Updated",
                    description: "Your notification preferences have been saved.",
                  });
                }}
              >
                <Save className="mr-2 h-4 w-4" /> Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Add, edit, and manage system users and their permissions
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              setCurrentUser(user);
                              setIsConfirmDeleteUserOpen(true);
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
            </CardContent>
          </Card>

          {/* Add User Dialog */}
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with appropriate role and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Full Name</Label>
                    <Input id="userName" placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Email</Label>
                    <Input id="userEmail" type="email" placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userRole">Role</Label>
                    <Select>
                      <SelectTrigger id="userRole">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="inventory">Inventory Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">Temporary Password</Label>
                    <Input id="userPassword" type="password" placeholder="Enter temporary password" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="requirePasswordChange" defaultChecked />
                    <Label htmlFor="requirePasswordChange">Require password change on first login</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "User Created",
                    description: "The new user account has been created successfully.",
                  });
                  setIsAddUserDialogOpen(false);
                }}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user account information and permissions.
                </DialogDescription>
              </DialogHeader>
              {currentUser && (
                <div className="grid gap-3 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="editUserName">Full Name</Label>
                      <Input
                        id="editUserName"
                        defaultValue={currentUser.name}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editUserEmail">Email</Label>
                      <Input
                        id="editUserEmail"
                        type="email"
                        defaultValue={currentUser.email}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editUserRole">Role</Label>
                      <Select defaultValue={currentUser.role}>
                        <SelectTrigger id="editUserRole">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="inventory">Inventory Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editUserStatus">Status</Label>
                      <Select defaultValue={currentUser.status}>
                        <SelectTrigger id="editUserStatus">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="resetPassword" />
                      <Label htmlFor="resetPassword">Reset password and require change on next login</Label>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUserConfirm}
                >
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirmation Dialogs */}
          <Dialog open={isConfirmDeleteUserOpen} onOpenChange={setIsConfirmDeleteUserOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {currentUser && (
                <div className="py-4">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <Badge variant="outline" className="mt-2 capitalize">{currentUser.role}</Badge>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDeleteUserOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isConfirmUpdateUserOpen} onOpenChange={setIsConfirmUpdateUserOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogDescription>
                  Are you sure you want to save these changes?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmUpdateUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default Settings;
