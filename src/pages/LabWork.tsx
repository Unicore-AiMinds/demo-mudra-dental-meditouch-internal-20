import { useState, useMemo } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useLabWork, LabJob } from '@/contexts/LabWorkContext';
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
  AlertTriangle
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
  const {
    labJobs,
    addLabJob,
    updateLabJob,
    deleteLabJob,
    isOverdue,
    isApproachingDelivery
  } = useLabWork();

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
  const [newService, setNewService] = useState<string>("");
  const [newLabWorkType, setNewLabWorkType] = useState<string>("");
  const [newAssignedLab, setNewAssignedLab] = useState<string>("");
  const [newDateSent, setNewDateSent] = useState<string>("");
  const [newExpectedDelivery, setNewExpectedDelivery] = useState<string>("");
  const [newStatus, setNewStatus] = useState<LabJob['status']>("pending-send");
  const [newPaymentStatus, setNewPaymentStatus] = useState<LabJob['paymentStatus']>("unpaid");
  const [newMaterialSpecs, setNewMaterialSpecs] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");

  // Form state for edit lab entry
  const [editPatient, setEditPatient] = useState<string>("");
  const [editService, setEditService] = useState<string>("");
  const [editLabWorkType, setEditLabWorkType] = useState<string>("");
  const [editAssignedLab, setEditAssignedLab] = useState<string>("");
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
          job.dateSent,
          `"${job.assignedLab}"`,
          `"${job.notes || ''}"`,
          job.expectedDelivery,
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
    const filename = `lab_work_export_${new Date().toISOString().split('T')[0]}.csv`;

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

  const handleCreateLabEntry = () => {
    // Create new lab job
    addLabJob({
      patient: newPatient,
      service: newService,
      labWorkType: newLabWorkType,
      dateSent: newDateSent,
      assignedLab: newAssignedLab,
      expectedDelivery: newExpectedDelivery,
      paymentStatus: newPaymentStatus,
      status: newStatus,
      materialSpecs: newMaterialSpecs,
      notes: newNotes
    });

    // Reset form fields
    setNewPatient("");
    setNewService("");
    setNewLabWorkType("");
    setNewAssignedLab("");
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
  };

  const cancelCreate = () => {
    setIsCreateConfirmOpen(false);
    setIsNewLabDialogOpen(true); // Go back to create dialog
  };

  const openEditDialog = (job: LabJob) => {
    setEditingJob(job);

    // Set edit form state variables
    setEditPatient(job.patient);
    setEditService(job.service);
    setEditLabWorkType(job.labWorkType);
    setEditAssignedLab(job.assignedLab);
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

  const handleUpdateLabEntry = () => {
    if (editingJob) {
      // Update the job with new values
      updateLabJob(editingJob.id, {
        patient: editPatient,
        service: editService,
        labWorkType: editLabWorkType,
        assignedLab: editAssignedLab,
        dateSent: editDateSent,
        expectedDelivery: editExpectedDelivery,
        status: editStatus,
        paymentStatus: editPaymentStatus,
        materialSpecs: editMaterialSpecs,
        notes: editNotes
      });

      setIsUpdateConfirmOpen(false);
      setEditingJob(null);

      toast({
        title: "Lab Entry Updated",
        description: "Lab work entry has been updated successfully.",
      });
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

  const handleDeleteLabEntry = () => {
    if (editingJob) {
      deleteLabJob(editingJob.id);

      setIsDeleteConfirmOpen(false);
      setEditingJob(null);

      toast({
        title: "Lab Entry Deleted",
        description: "Lab work entry has been deleted successfully.",
      });
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setIsEditLabDialogOpen(true); // Go back to edit dialog
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Work Tracker</h1>
          <p className="text-muted-foreground">Manage and track dental laboratory orders</p>
        </div>
        <Button
          onClick={() => setIsNewLabDialogOpen(true)}
          className="bg-dental-primary hover:bg-dental-dark"
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Lab Entry
        </Button>
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
          <Button variant="outline" size="icon" onClick={exportToCSV} title="Export to CSV">
            <Download className="h-4 w-4" />
          </Button>
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
                <TableHead className="hidden lg:table-cell">Date Sent</TableHead>
                <TableHead className="hidden md:table-cell">Laboratory</TableHead>
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
                    <TableCell className="hidden lg:table-cell">{job.dateSent}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="cursor-help" title={job.notes ? `Notes: ${job.notes}` : 'No additional notes'}>
                        {job.assignedLab}
                      </div>
                    </TableCell>
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
                        className={`cursor-pointer hover:opacity-80 ${job.paymentStatus === 'paid' ? 'bg-green-500' : ''}`}
                        onClick={() => openPaymentConfirmation(job.id)}
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
              Enter the details for the new lab work order. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="patient">Patient Name *</Label>
                <Select value={newPatient} onValueChange={setNewPatient}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select Patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aarav Sharma">Aarav Sharma</SelectItem>
                    <SelectItem value="Priya Patel">Priya Patel</SelectItem>
                    <SelectItem value="Vikram Singh">Vikram Singh</SelectItem>
                    <SelectItem value="Neha Kapoor">Neha Kapoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="service">Service *</Label>
                <Select value={newService} onValueChange={setNewService}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crown Placement">Crown Placement</SelectItem>
                    <SelectItem value="Bridge Procedure">Bridge Procedure</SelectItem>
                    <SelectItem value="Complete Denture">Complete Denture</SelectItem>
                    <SelectItem value="Implant Restoration">Implant Restoration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="labWorkType">Lab Work Type *</Label>
                <Select value={newLabWorkType} onValueChange={setNewLabWorkType}>
                  <SelectTrigger id="labWorkType">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PFM Crown">PFM Crown</SelectItem>
                    <SelectItem value="Ceramic Bridge">Ceramic Bridge</SelectItem>
                    <SelectItem value="Acrylic Denture">Acrylic Denture</SelectItem>
                    <SelectItem value="Custom Abutment">Custom Abutment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedLab">Assigned Lab *</Label>
                <Select value={newAssignedLab} onValueChange={setNewAssignedLab}>
                  <SelectTrigger id="assignedLab">
                    <SelectValue placeholder="Select Lab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Precision Dental Lab">Precision Dental Lab</SelectItem>
                    <SelectItem value="Nova Dental Solutions">Nova Dental Solutions</SelectItem>
                    <SelectItem value="Dent Creations India">Dent Creations India</SelectItem>
                    <SelectItem value="Implant Specialists">Implant Specialists</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateSent">Date Sent *</Label>
                <Input
                  type="date"
                  id="dateSent"
                  value={newDateSent}
                  onChange={(e) => setNewDateSent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery">Expected Delivery *</Label>
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
              Update the details for this lab work order. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {editingJob && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-patient">Patient Name *</Label>
                  <Select value={editPatient} onValueChange={setEditPatient}>
                    <SelectTrigger id="edit-patient">
                      <SelectValue placeholder="Select Patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aarav Sharma">Aarav Sharma</SelectItem>
                      <SelectItem value="Priya Patel">Priya Patel</SelectItem>
                      <SelectItem value="Vikram Singh">Vikram Singh</SelectItem>
                      <SelectItem value="Neha Kapoor">Neha Kapoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-service">Service *</Label>
                  <Select value={editService} onValueChange={setEditService}>
                    <SelectTrigger id="edit-service">
                      <SelectValue placeholder="Select Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Crown Placement">Crown Placement</SelectItem>
                      <SelectItem value="Bridge Procedure">Bridge Procedure</SelectItem>
                      <SelectItem value="Complete Denture">Complete Denture</SelectItem>
                      <SelectItem value="Implant Restoration">Implant Restoration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-labWorkType">Lab Work Type *</Label>
                  <Select value={editLabWorkType} onValueChange={setEditLabWorkType}>
                    <SelectTrigger id="edit-labWorkType">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PFM Crown">PFM Crown</SelectItem>
                      <SelectItem value="Ceramic Bridge">Ceramic Bridge</SelectItem>
                      <SelectItem value="Acrylic Denture">Acrylic Denture</SelectItem>
                      <SelectItem value="Custom Abutment">Custom Abutment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-assignedLab">Assigned Lab *</Label>
                  <Select value={editAssignedLab} onValueChange={setEditAssignedLab}>
                    <SelectTrigger id="edit-assignedLab">
                      <SelectValue placeholder="Select Lab" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Precision Dental Lab">Precision Dental Lab</SelectItem>
                      <SelectItem value="Nova Dental Solutions">Nova Dental Solutions</SelectItem>
                      <SelectItem value="Dent Creations India">Dent Creations India</SelectItem>
                      <SelectItem value="Implant Specialists">Implant Specialists</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateSent">Date Sent *</Label>
                  <Input
                    type="date"
                    id="edit-dateSent"
                    value={editDateSent}
                    onChange={(e) => setEditDateSent(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expectedDelivery">Expected Delivery *</Label>
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
            <Button variant="destructive" onClick={openDeleteConfirmation}>
              Delete Entry
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditLabDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={openUpdateConfirmation}
                className="bg-dental-primary hover:bg-dental-dark">
                Update Lab Entry
              </Button>
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
