import { useState, useMemo, useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useLabWork, LabJob, NewLabJob } from '@/contexts/LabWorkContext';
import { useDentalLabs, DentalLab } from '@/contexts/DentalLabsContext';
import { useLabWorkTypes, LabWorkType } from '@/contexts/LabWorkTypesContext';
import { useServices } from '@/contexts/ServiceContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { supabaseClient } from '@/lib/supabase-config';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Download,
  Plus,
  Search,
  Microscope,
  ArrowUpDown,
  CalendarDays,
  AlertTriangle,
  FlaskConical,
  CheckCircle,
  Clock
} from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { formatDateForExport, formatDateForFilename } from '@/utils/dateFormatter';



type StatusConfig = {
  [key in LabJob['status']]: {
    label: string;
    variant: "outline" | "secondary" | "default" | "destructive";
    className?: string;
  }
};

const statusConfig: StatusConfig = {
  'pending-send': { label: "Pending Send", variant: "outline" },
  sent: { label: "Sent to Lab", variant: "secondary" },
  received: { label: "Received", variant: "default", className: "bg-amber-500" },
  ready: { label: "Ready", variant: "default", className: "bg-green-500" },
  completed: { label: "Completed", variant: "default", className: "bg-gray-500 opacity-70" }
};

const getStatusConfig = (status: LabJob['status']) => {
  return statusConfig[status];
};

const getStatusBadge = (status: LabJob['status']) => {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};





const LabWork = () => {
  const { activeClinic } = useClinic();
  const { hasPermission } = usePermissions();
  const {
    labJobs,
    addLabJob,
    updateLabJob,
    deleteLabJob,
    isOverdue,
    isApproachingDelivery
  } = useLabWork();
  const { dentalLabs } = useDentalLabs();
  const { labWorkTypes } = useLabWorkTypes();
  const { dentalServices, getDentalServiceNames } = useServices();

  // State for patients and services
  const [patients, setPatients] = useState<{ id: string, name: string, patient_code: string }[]>([]);
  const [services, setServices] = useState<string[]>([]);

  // Fetch patients from Supabase
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('patients')
          .select('id, name, patient_code')
          .or('clinic.eq.dental,clinic.eq.both')
          .order('name');

        if (error) {
          console.error('Error fetching patients:', error);
          return;
        }

        if (data) {
          setPatients(data);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, []);

  // Get dental services
  useEffect(() => {
    // Get service names from the dental services
    const serviceNames = getDentalServiceNames();

    // If no services found, use default list
    if (serviceNames.length === 0) {
      const defaultServices = [
        'Crown Placement', 'Bridge Procedure', 'Complete Denture', 'Implant Restoration',
        'Root Canal Treatment', 'Orthodontic Treatment', 'Teeth Whitening', 'Dental Filling'
      ];
      setServices(defaultServices);
      console.log('No dental services found, using defaults:', defaultServices);
    } else {
      setServices(serviceNames);
      console.log('Dental services loaded:', serviceNames);
    }
  }, [dentalServices, getDentalServiceNames]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isNewLabDialogOpen, setIsNewLabDialogOpen] = useState(false);
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
  const [isEditLabDialogOpen, setIsEditLabDialogOpen] = useState(false);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedLab, setSelectedLab] = useState<string | undefined>(undefined);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first
  const [newStatusValue, setNewStatusValue] = useState<LabJob['status'] | null>(null);
  const [editingJob, setEditingJob] = useState<LabJob | null>(null);
  const { toast } = useToast();

  // Form state for new lab entry
  const [newPatient, setNewPatient] = useState<string>("");
  const [newPatientId, setNewPatientId] = useState<string>("");
  const [newService, setNewService] = useState<string>("");
  const [newLabWorkType, setNewLabWorkType] = useState<string>("");
  const [selectedLabWorkType, setSelectedLabWorkType] = useState<LabWorkType | null>(null);
  const [newAssignedLab, setNewAssignedLab] = useState<string>("");
  const [newLabId, setNewLabId] = useState<string>("");
  const [newDateSent, setNewDateSent] = useState<string>("");
  const [newExpectedDelivery, setNewExpectedDelivery] = useState<string>("");
  const [newStatus, setNewStatus] = useState<LabJob['status']>("pending-send");
  const [newPaymentStatus, setNewPaymentStatus] = useState<LabJob['paymentStatus']>("unpaid");
  const [newMaterialSpecs, setNewMaterialSpecs] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");

  // Form state for edit lab entry
  const [editPatient, setEditPatient] = useState<string>("");
  const [editPatientId, setEditPatientId] = useState<string>("");
  const [editService, setEditService] = useState<string>("");
  const [editLabWorkType, setEditLabWorkType] = useState<string>("");
  const [selectedEditLabWorkType, setSelectedEditLabWorkType] = useState<LabWorkType | null>(null);
  const [editAssignedLab, setEditAssignedLab] = useState<string>("");
  const [editLabId, setEditLabId] = useState<string>("");
  const [editDateSent, setEditDateSent] = useState<string>("");
  const [editExpectedDelivery, setEditExpectedDelivery] = useState<string>("");
  const [editStatus, setEditStatus] = useState<LabJob['status']>("pending-send");
  const [editPaymentStatus, setEditPaymentStatus] = useState<LabJob['paymentStatus']>("unpaid");
  const [editMaterialSpecs, setEditMaterialSpecs] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  // Define the sorting and filtering logic outside the conditional rendering
  const sortedAndFilteredLabJobs = useMemo(() => {
    // First filter the jobs
    const filtered = labJobs.filter(job => {
      const matchesSearch =
        !searchTerm ||
        job.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.assignedLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.labWorkType.toLowerCase().includes(searchTerm.toLowerCase());

      // Special handling for "overdue" status filter
      let statusMatch = true;
      if (selectedStatus === "overdue") {
        statusMatch = isOverdue(job);
      } else if (selectedStatus === "approaching") {
        statusMatch = isApproachingDelivery(job);
      } else {
        statusMatch = !selectedStatus || selectedStatus === "all" || job.status === selectedStatus;
      }

      const matchesLab = !selectedLab || selectedLab === "all" || job.assignedLab === selectedLab;
      const matchesPaymentStatus = !selectedPaymentStatus || selectedPaymentStatus === "all" || job.paymentStatus === selectedPaymentStatus;

      return matchesSearch && statusMatch && matchesLab && matchesPaymentStatus;
    });

    // Then sort the filtered jobs by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateSent).getTime();
      const dateB = new Date(b.dateSent).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [labJobs, searchTerm, selectedStatus, selectedLab, selectedPaymentStatus, sortOrder, isOverdue, isApproachingDelivery]);

  if (activeClinic !== 'dental') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <Microscope className="h-16 w-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Lab Work Module</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          The Lab Work tracking functionality is exclusive to Dental Metrix Clinic.
          Please switch to Dental Metrix context to access this feature.
        </p>
      </div>
    );
  }

  const uniqueLabs = Array.from(new Set(labJobs.map(job => job.assignedLab)));

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const openPaymentConfirmation = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsPaymentConfirmOpen(true);
  };

  const confirmPaymentStatusChange = () => {
    if (selectedJobId) {
      const job = labJobs.find(job => job.id === selectedJobId);
      if (job) {
        updateLabJob(selectedJobId, {
          paymentStatus: job.paymentStatus === 'paid' ? 'unpaid' : 'paid'
        });

        toast({
          title: "Payment Status Updated",
          description: "The payment status has been updated successfully.",
        });
      }

      // Reset state
      setIsPaymentConfirmOpen(false);
      setSelectedJobId(null);
    }
  };

  const cancelPaymentStatusChange = () => {
    setIsPaymentConfirmOpen(false);
    setSelectedJobId(null);
  };

  const openStatusConfirmation = (jobId: string, newStatus: LabJob['status']) => {
    setSelectedJobId(jobId);
    setNewStatusValue(newStatus);
    setIsStatusConfirmOpen(true);
  };

  const confirmStatusChange = () => {
    if (selectedJobId && newStatusValue) {
      updateLabJob(selectedJobId, { status: newStatusValue });

      toast({
        title: "Status Updated",
        description: "The lab work status has been updated successfully.",
      });

      // Reset state
      setIsStatusConfirmOpen(false);
      setSelectedJobId(null);
      setNewStatusValue(null);
    }
  };

  const cancelStatusChange = () => {
    setIsStatusConfirmOpen(false);
    setSelectedJobId(null);
    setNewStatusValue(null);
  };

  const exportToCSV = () => {
    // Create CSV content from the filtered and sorted data
    const headers = ['Patient', 'Service', 'Lab Work Type', 'Material/Shade Specifications', 'Date Sent', 'Laboratory', 'Notes', 'Expected Delivery', 'Delivery Status', 'Payment Status', 'Status'];

    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredLabJobs.map(job => {
        // Determine delivery status
        let deliveryStatus = "On Schedule";
        if (isOverdue(job)) {
          deliveryStatus = "Overdue";
        } else if (isApproachingDelivery(job)) {
          deliveryStatus = "Due Soon";
        }

        return [
          `"${job.patient}"`,
          `"${job.service}"`,
          `"${job.labWorkType}"`,
          `"${job.materialSpecs || ''}"`,
          `"${formatDateForExport(job.dateSent)}"`,
          `"${job.assignedLab}"`,
          `"${job.notes || ''}"`,
          `"${formatDateForExport(job.expectedDelivery)}"`,
          deliveryStatus,
          job.paymentStatus,
          job.status
        ].join(',');
      })
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    const filename = `lab_work_export_${formatDateForFilename()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${sortedAndFilteredLabJobs.length} records exported to CSV.`,
    });
  };

  const openCreateConfirmation = () => {
    // Validate required fields
    if (!newPatient || !newService || !newLabWorkType || !newAssignedLab || !newDateSent || !newExpectedDelivery) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Close the new lab dialog and open the confirmation dialog
    setIsNewLabDialogOpen(false);
    setIsCreateConfirmOpen(true);
  };

  const handleCreateLabEntry = async () => {
    try {
      // Create new lab job
      await addLabJob({
        patient: newPatient,
        patient_id: newPatientId,
        service: newService,
        labWorkType: newLabWorkType,
        dateSent: newDateSent,
        assignedLab: newAssignedLab,
        lab_id: newLabId,
        expectedDelivery: newExpectedDelivery,
        paymentStatus: newPaymentStatus,
        status: newStatus,
        materialSpecs: newMaterialSpecs,
        notes: newNotes
      });

      // Reset form fields
      setNewPatient("");
      setNewPatientId("");
      setNewService("");
      setNewLabWorkType("");
      setSelectedLabWorkType(null);
      setNewAssignedLab("");
      setNewLabId("");
      setNewDateSent("");
      setNewExpectedDelivery("");
      setNewStatus("pending-send");
      setNewPaymentStatus("unpaid");
      setNewMaterialSpecs("");
      setNewNotes("");

      // Close dialog and show success message
      setIsCreateConfirmOpen(false);
      toast({
        title: "Lab Entry Created",
        description: "The new lab work entry has been added successfully.",
      });
    } catch (error) {
      console.error("Error creating lab job:", error);
      toast({
        title: "Error",
        description: "Failed to create lab job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cancelCreate = () => {
    setIsCreateConfirmOpen(false);
    setIsNewLabDialogOpen(true); // Go back to create dialog
  };

  const openEditDialog = (job: LabJob) => {
    setEditingJob(job);

    // Set edit form state variables
    setEditPatient(job.patient);
    setEditPatientId(job.patient_id || "");
    setEditService(job.service);
    setEditLabWorkType(job.labWorkType);

    // Find the lab work type by name
    const selectedType = labWorkTypes.find(type => type.name === job.labWorkType);
    setSelectedEditLabWorkType(selectedType || null);

    setEditAssignedLab(job.assignedLab);
    setEditLabId(job.lab_id || "");
    setEditDateSent(job.dateSent);
    setEditExpectedDelivery(job.expectedDelivery);
    setEditStatus(job.status);
    setEditPaymentStatus(job.paymentStatus);
    setEditMaterialSpecs(job.materialSpecs || "");
    setEditNotes(job.notes || "");

    setIsEditLabDialogOpen(true);
  };

  const openUpdateConfirmation = () => {
    if (editingJob) {
      setIsEditLabDialogOpen(false);
      setIsUpdateConfirmOpen(true);
    }
  };

  const handleUpdateLabEntry = async () => {
    if (editingJob) {
      try {
        // Update the job with new values
        await updateLabJob(editingJob.id, {
          patient: editPatient,
          patient_id: editPatientId,
          service: editService,
          labWorkType: editLabWorkType,
          assignedLab: editAssignedLab,
          lab_id: editLabId,
          dateSent: editDateSent,
          expectedDelivery: editExpectedDelivery,
          status: editStatus,
          paymentStatus: editPaymentStatus,
          materialSpecs: editMaterialSpecs,
          notes: editNotes
        });

        setIsUpdateConfirmOpen(false);
        setEditingJob(null);
        setSelectedEditLabWorkType(null);

        toast({
          title: "Lab Entry Updated",
          description: "Lab work entry has been updated successfully.",
        });
      } catch (error) {
        console.error("Error updating lab job:", error);
        toast({
          title: "Error",
          description: "Failed to update lab job. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const cancelUpdate = () => {
    setIsUpdateConfirmOpen(false);
    setIsEditLabDialogOpen(true); // Go back to edit dialog
  };

  const openDeleteConfirmation = () => {
    if (editingJob) {
      setIsEditLabDialogOpen(false);
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleDeleteLabEntry = async () => {
    if (editingJob) {
      try {
        await deleteLabJob(editingJob.id);

        setIsDeleteConfirmOpen(false);
        setEditingJob(null);
        setSelectedEditLabWorkType(null);

        toast({
          title: "Lab Entry Deleted",
          description: "Lab work entry has been deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting lab job:", error);
        toast({
          title: "Error",
          description: "Failed to delete lab job. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setIsEditLabDialogOpen(true); // Go back to edit dialog
  };

  // Function to calculate expected delivery date based on date sent and lab work type
  const calculateExpectedDelivery = (dateSent: string, labWorkType: LabWorkType | null): string => {
    if (!dateSent || !labWorkType) return "";

    const sentDate = new Date(dateSent);

    // Parse turnaround duration and unit
    const duration = labWorkType.turnaround_duration;
    const unit = labWorkType.turnaround_unit;

    // Calculate expected delivery date
    const expectedDate = new Date(sentDate);

    if (unit === 'days') {
      expectedDate.setDate(expectedDate.getDate() + duration);
    } else if (unit === 'weeks') {
      expectedDate.setDate(expectedDate.getDate() + (duration * 7));
    } else if (unit === 'months') {
      expectedDate.setMonth(expectedDate.getMonth() + duration);
    }

    // Format as YYYY-MM-DD for input field
    return expectedDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Work Tracker</h1>
          <p className="text-muted-foreground">Manage and track dental laboratory orders</p>
        </div>
        {hasPermission('lab_work.create') && (
          <Button
            onClick={() => setIsNewLabDialogOpen(true)}
            className="bg-dental-primary hover:bg-dental-dark"
          >
            <Plus className="h-4 w-4 mr-2" /> Create New Lab Entry
          </Button>
        )}
      </div>

      {/* Lab Work Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-blue-50 p-2 rounded-full">
              <FlaskConical className="h-5 w-5 text-dental-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Jobs</div>
              <div className="text-2xl font-bold">{labJobs.length}</div>
              <div className="text-xs text-muted-foreground">All lab work entries</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-green-50 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold">{labJobs.filter(job => job.status === 'completed').length}</div>
              <div className="text-xs text-muted-foreground">Successfully finished</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-orange-50 p-2 rounded-full">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold">{labJobs.filter(job => job.status !== 'completed').length}</div>
              <div className="text-xs text-muted-foreground">In progress</div>
            </div>
          </div>
        </Card>

        <Card className="card-shadow">
          <div className="p-4 flex items-center space-x-4">
            <div className="bg-amber-50 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Overdue</div>
              <div className="text-2xl font-bold">{labJobs.filter(job => isOverdue(job)).length}</div>
              <div className="text-xs text-muted-foreground">Need immediate attention</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by patient, lab or work type..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="approaching">Approaching Delivery</SelectItem>
              <SelectItem value="pending-send">Pending Send</SelectItem>
              <SelectItem value="sent">Sent to Lab</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLab} onValueChange={setSelectedLab}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by Lab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labs</SelectItem>
              {uniqueLabs.map((lab) => (
                <SelectItem key={lab} value={lab}>{lab}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={toggleSortOrder} className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            Sort by Date
            <ArrowUpDown className="h-4 w-4 ml-1" />
          </Button>
          {hasPermission('lab_work.export') && (
            <Button variant="outline" size="icon" onClick={exportToCSV} title="Export to CSV">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Service</TableHead>
                <TableHead>Lab Work Type</TableHead>
                <TableHead className="hidden md:table-cell">Laboratory</TableHead>
                <TableHead className="hidden lg:table-cell">Date Sent</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Payment Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredLabJobs.length > 0 ? (
                sortedAndFilteredLabJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    className={`group ${isOverdue(job) ? "bg-red-50" : ""}`}
                  >
                    <TableCell className="font-medium">{job.patient}</TableCell>
                    <TableCell className="hidden md:table-cell">{job.service}</TableCell>
                    <TableCell>
                      <div className="cursor-help" title={job.materialSpecs ? `Material/Shade: ${job.materialSpecs}` : 'No material/shade specifications'}>
                        {job.labWorkType}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="cursor-help" title={job.notes ? `Notes: ${job.notes}` : 'No additional notes'}>
                        {job.assignedLab}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{job.dateSent}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={isOverdue(job) ? "text-red-600 font-medium" : ""}>
                          {job.expectedDelivery}
                        </span>
                        {isOverdue(job) && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600">Overdue</span>
                          </div>
                        )}
                        {isApproachingDelivery(job) && !isOverdue(job) && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-500">Due Soon</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={job.paymentStatus === 'paid' ? 'default' : 'outline'}
                        className={`${hasPermission('lab_work.change_status') ? 'cursor-pointer hover:opacity-80' : ''} ${job.paymentStatus === 'paid' ? 'bg-green-500' : ''}`}
                        onClick={hasPermission('lab_work.change_status') ? () => openPaymentConfirmation(job.id) : undefined}
                      >
                        {job.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getStatusBadge(job.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {hasPermission('lab_work.change_status') && (
                          <Select
                            onValueChange={(value) => openStatusConfirmation(job.id, value as LabJob['status'])}
                            value={job.status}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending-send">Pending Send</SelectItem>
                              <SelectItem value="sent">Sent to Lab</SelectItem>
                              <SelectItem value="received">Received</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(job)}
                          title="Edit Lab Entry"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No lab jobs found matching the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewLabDialogOpen} onOpenChange={setIsNewLabDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lab Entry</DialogTitle>
            <DialogDescription>
              Enter the details for the new lab work order. Fields marked with <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="patient">Patient Name <span className="text-red-500 ml-1">*</span></Label>
                <Select
                  value={newPatient}
                  onValueChange={(value) => {
                    setNewPatient(value);
                    // Find the patient by name to get the ID
                    const selectedPatient = patients.find(p => p.name === value);
                    if (selectedPatient) {
                      // Store patient_id for later use
                      setNewPatientId(selectedPatient.id);
                    } else {
                      setNewPatientId("");
                    }
                  }}
                >
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select Patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length > 0 ? (
                      patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.name}>
                          {patient.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-patients-found" disabled>No patients found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="service">Service <span className="text-red-500 ml-1">*</span></Label>
                <Select value={newService} onValueChange={setNewService}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="labWorkType">Lab Work Type <span className="text-red-500 ml-1">*</span></Label>
                <Select
                  value={newLabWorkType}
                  onValueChange={(value) => {
                    setNewLabWorkType(value);
                    // Find the lab work type by name
                    const selectedType = labWorkTypes.find(type => type.name === value);
                    setSelectedLabWorkType(selectedType || null);

                    // If date sent is already selected, calculate expected delivery date
                    if (newDateSent && selectedType) {
                      const calculatedDate = calculateExpectedDelivery(newDateSent, selectedType);
                      setNewExpectedDelivery(calculatedDate);
                    }
                  }}
                >
                  <SelectTrigger id="labWorkType">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {labWorkTypes.length > 0 ? (
                      labWorkTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-lab-work-types" disabled>No lab work types found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedLab">Assigned Lab <span className="text-red-500 ml-1">*</span></Label>
                <Select
                  value={newAssignedLab}
                  onValueChange={(value) => {
                    setNewAssignedLab(value);
                    // Find the lab by name to get the ID
                    const selectedLab = dentalLabs.find(lab => lab.name === value);
                    if (selectedLab) {
                      // Store lab_id for later use
                      setNewLabId(selectedLab.id);
                    } else {
                      setNewLabId("");
                    }
                  }}
                >
                  <SelectTrigger id="assignedLab">
                    <SelectValue placeholder="Select Lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentalLabs.length > 0 ? (
                      dentalLabs.map((lab) => (
                        <SelectItem key={lab.id} value={lab.name}>
                          {lab.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-labs-found" disabled>No labs found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateSent" className="flex items-center">
                  Date Sent <span className="text-red-500 ml-1">*</span>
                  {selectedLabWorkType && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (Turnaround: {selectedLabWorkType.turnaround_duration} {selectedLabWorkType.turnaround_unit})
                    </span>
                  )}
                </Label>
                <Input
                  type="date"
                  id="dateSent"
                  value={newDateSent}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setNewDateSent(newDate);

                    // If lab work type is already selected, calculate expected delivery date
                    if (newDate && selectedLabWorkType) {
                      const calculatedDate = calculateExpectedDelivery(newDate, selectedLabWorkType);
                      setNewExpectedDelivery(calculatedDate);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery" className="flex items-center">
                  Expected Delivery <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="date"
                  id="expectedDelivery"
                  value={newExpectedDelivery}
                  onChange={(e) => setNewExpectedDelivery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value: LabJob['status']) => setNewStatus(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending-send">Pending Send</SelectItem>
                    <SelectItem value="sent">Sent to Lab</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={newPaymentStatus}
                  onValueChange={(value: LabJob['paymentStatus']) => setNewPaymentStatus(value)}
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue placeholder="Select Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="materialSpecs">Material/Shade Specifications (Lab Work)</Label>
                <Input
                  id="materialSpecs"
                  placeholder="e.g., A2 Shade, Metal-free"
                  value={newMaterialSpecs}
                  onChange={(e) => setNewMaterialSpecs(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="notes">Notes (Laboratory)</Label>
                <Input
                  id="notes"
                  placeholder="Additional instructions for the lab"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLabDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={openCreateConfirmation}
              className="bg-dental-primary hover:bg-dental-dark">
              Create Lab Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateConfirmOpen} onOpenChange={setIsCreateConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Lab Entry Creation</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this lab work entry?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Patient:</span> {newPatient}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Service:</span> {newService}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Lab Work Type:</span> {newLabWorkType}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Assigned Lab:</span> {newAssignedLab}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date Sent:</span> {newDateSent}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Expected Delivery:</span> {newExpectedDelivery}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Status:</span> {getStatusConfig(newStatus).label}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Payment Status:</span> {newPaymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelCreate}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateLabEntry}
              className="bg-dental-primary hover:bg-dental-dark"
            >
              Create Lab Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentConfirmOpen} onOpenChange={setIsPaymentConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the payment status for this lab work?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedJobId && (
              <p className="text-sm text-muted-foreground">
                You are about to mark this lab work as
                <span className="font-semibold">
                  {labJobs.find(job => job.id === selectedJobId)?.paymentStatus === 'paid' ? ' Unpaid' : ' Paid'}
                </span>.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelPaymentStatusChange}>
              Cancel
            </Button>
            <Button
              onClick={confirmPaymentStatusChange}
              className={labJobs.find(job => job.id === selectedJobId)?.paymentStatus === 'paid'
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-green-600 hover:bg-green-700'}
            >
              {labJobs.find(job => job.id === selectedJobId)?.paymentStatus === 'paid'
                ? 'Mark as Unpaid'
                : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the status for this lab work?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedJobId && newStatusValue && (
              <p className="text-sm text-muted-foreground">
                You are about to change the status from
                <span className="font-semibold">
                  {' '}{getStatusConfig(labJobs.find(job => job.id === selectedJobId)?.status || 'pending-send').label}
                </span>
                {' '}to{' '}
                <span className="font-semibold">
                  {getStatusConfig(newStatusValue).label}
                </span>.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelStatusChange}>
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              className="bg-dental-primary hover:bg-dental-dark"
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLabDialogOpen} onOpenChange={setIsEditLabDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Entry</DialogTitle>
            <DialogDescription>
              Update the details for this lab work order. Fields marked with <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>
          {editingJob && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-patient">Patient Name <span className="text-red-500 ml-1">*</span></Label>
                  <Select
                    value={editPatient}
                    onValueChange={(value) => {
                      setEditPatient(value);
                      // Find the patient by name to get the ID
                      const selectedPatient = patients.find(p => p.name === value);
                      if (selectedPatient) {
                        // Store patient_id for later use
                        setEditPatientId(selectedPatient.id);
                      } else {
                        setEditPatientId("");
                      }
                    }}
                  >
                    <SelectTrigger id="edit-patient">
                      <SelectValue placeholder="Select Patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.length > 0 ? (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.name}>
                            {patient.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-patients-found" disabled>No patients found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-service">Service <span className="text-red-500 ml-1">*</span></Label>
                  <Select value={editService} onValueChange={setEditService}>
                    <SelectTrigger id="edit-service">
                      <SelectValue placeholder="Select Service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-labWorkType">Lab Work Type <span className="text-red-500 ml-1">*</span></Label>
                  <Select
                    value={editLabWorkType}
                    onValueChange={(value) => {
                      setEditLabWorkType(value);
                      // Find the lab work type by name
                      const selectedType = labWorkTypes.find(type => type.name === value);
                      setSelectedEditLabWorkType(selectedType || null);

                      // If date sent is already selected, calculate expected delivery date
                      if (editDateSent && selectedType) {
                        const calculatedDate = calculateExpectedDelivery(editDateSent, selectedType);
                        setEditExpectedDelivery(calculatedDate);
                      }
                    }}
                  >
                    <SelectTrigger id="edit-labWorkType">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {labWorkTypes.length > 0 ? (
                        labWorkTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-lab-work-types" disabled>No lab work types found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-assignedLab">Assigned Lab <span className="text-red-500 ml-1">*</span></Label>
                  <Select
                    value={editAssignedLab}
                    onValueChange={(value) => {
                      setEditAssignedLab(value);
                      // Find the lab by name to get the ID
                      const selectedLab = dentalLabs.find(lab => lab.name === value);
                      if (selectedLab) {
                        // Store lab_id for later use
                        setEditLabId(selectedLab.id);
                      } else {
                        setEditLabId("");
                      }
                    }}
                  >
                    <SelectTrigger id="edit-assignedLab">
                      <SelectValue placeholder="Select Lab" />
                    </SelectTrigger>
                    <SelectContent>
                      {dentalLabs.length > 0 ? (
                        dentalLabs.map((lab) => (
                          <SelectItem key={lab.id} value={lab.name}>
                            {lab.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-labs-found" disabled>No labs found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateSent" className="flex items-center">
                    Date Sent <span className="text-red-500 ml-1">*</span>
                    {selectedEditLabWorkType && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Turnaround: {selectedEditLabWorkType.turnaround_duration} {selectedEditLabWorkType.turnaround_unit})
                      </span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    id="edit-dateSent"
                    value={editDateSent}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditDateSent(newDate);

                      // If lab work type is already selected, calculate expected delivery date
                      if (newDate && selectedEditLabWorkType) {
                        const calculatedDate = calculateExpectedDelivery(newDate, selectedEditLabWorkType);
                        setEditExpectedDelivery(calculatedDate);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expectedDelivery" className="flex items-center">
                    Expected Delivery <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="edit-expectedDelivery"
                    value={editExpectedDelivery}
                    onChange={(e) => setEditExpectedDelivery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(value: LabJob['status']) => setEditStatus(value)}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending-send">Pending Send</SelectItem>
                      <SelectItem value="sent">Sent to Lab</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-paymentStatus">Payment Status</Label>
                  <Select
                    value={editPaymentStatus}
                    onValueChange={(value: LabJob['paymentStatus']) => setEditPaymentStatus(value)}
                  >
                    <SelectTrigger id="edit-paymentStatus">
                      <SelectValue placeholder="Select Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="edit-materialSpecs">Material/Shade Specifications (Lab Work)</Label>
                  <Input
                    id="edit-materialSpecs"
                    placeholder="e.g., A2 Shade, Metal-free"
                    value={editMaterialSpecs}
                    onChange={(e) => setEditMaterialSpecs(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="edit-notes">Notes (Laboratory)</Label>
                  <Input
                    id="edit-notes"
                    placeholder="Additional instructions for the lab"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            {hasPermission('lab_work.delete') && (
              <Button variant="destructive" onClick={openDeleteConfirmation}>
                Delete Entry
              </Button>
            )}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditLabDialogOpen(false)}>
                Cancel
              </Button>
              {hasPermission('lab_work.edit') && (
                <Button
                  onClick={openUpdateConfirmation}
                  className="bg-dental-primary hover:bg-dental-dark">
                  Update Lab Entry
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lab work entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingJob && (
              <p className="text-sm text-muted-foreground">
                You are about to delete the lab work entry for <span className="font-semibold">{editingJob.patient}</span> ({editingJob.labWorkType}).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLabEntry}
              variant="destructive"
            >
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateConfirmOpen} onOpenChange={setIsUpdateConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update this lab work entry?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingJob && (
              <p className="text-sm text-muted-foreground">
                You are about to update the lab work entry for <span className="font-semibold">{editingJob.patient}</span> ({editingJob.labWorkType}).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelUpdate}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLabEntry}
              className="bg-dental-primary hover:bg-dental-dark"
            >
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabWork;
