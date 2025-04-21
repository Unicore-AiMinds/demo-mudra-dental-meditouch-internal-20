import { useState, useMemo } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
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
  CheckCircle2,
  Clock,
  Microscope,
  ArrowUpDown,
  CalendarDays
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

interface LabJob {
  id: string;
  patient: string;
  service: string;
  labWorkType: string;
  dateSent: string;
  assignedLab: string;
  expectedDelivery: string;
  paymentStatus: 'paid' | 'unpaid';
  status: 'pending-send' | 'sent' | 'received' | 'ready' | 'completed';
}

const demoLabJobs: LabJob[] = [
  {
    id: "LJ001",
    patient: "Aarav Sharma",
    service: "Crown Placement",
    labWorkType: "PFM Crown",
    dateSent: "2023-10-15",
    assignedLab: "Precision Dental Lab",
    expectedDelivery: "2023-10-25",
    paymentStatus: "unpaid",
    status: "pending-send"
  },
  {
    id: "LJ002",
    patient: "Priya Patel",
    service: "Complete Denture",
    labWorkType: "Acrylic Denture",
    dateSent: "2023-10-16",
    assignedLab: "Nova Dental Solutions",
    expectedDelivery: "2023-10-30",
    paymentStatus: "paid",
    status: "sent"
  },
  {
    id: "LJ003",
    patient: "Vikram Singh",
    service: "Bridge Procedure",
    labWorkType: "Ceramic Bridge",
    dateSent: "2023-10-10",
    assignedLab: "Dent Creations India",
    expectedDelivery: "2023-10-20",
    paymentStatus: "unpaid",
    status: "sent"
  },
  {
    id: "LJ004",
    patient: "Neha Kapoor",
    service: "Removable Partial",
    labWorkType: "Cast Partial Framework",
    dateSent: "2023-09-28",
    assignedLab: "Precision Dental Lab",
    expectedDelivery: "2023-10-18",
    paymentStatus: "paid",
    status: "ready"
  },
  {
    id: "LJ005",
    patient: "Rajiv Malhotra",
    service: "Implant Restoration",
    labWorkType: "Custom Abutment",
    dateSent: "2023-10-03",
    assignedLab: "Implant Specialists",
    expectedDelivery: "2023-10-10",
    paymentStatus: "unpaid",
    status: "received"
  },
  {
    id: "LJ006",
    patient: "Ananya Reddy",
    service: "Nightguard",
    labWorkType: "Hard Acrylic Splint",
    dateSent: "2023-10-12",
    assignedLab: "Nova Dental Solutions",
    expectedDelivery: "2023-10-22",
    paymentStatus: "paid",
    status: "completed"
  }
];

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

const getStatusIcon = (status: LabJob['status']) => {
  switch (status) {
    case 'pending-send':
      return <Clock className="h-4 w-4 text-gray-400" />;
    case 'sent':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'received':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'ready':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const LabWork = () => {
  const { activeClinic } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewLabDialogOpen, setIsNewLabDialogOpen] = useState(false);
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
  const [labJobs, setLabJobs] = useState<LabJob[]>(demoLabJobs);
  const [newStatusValue, setNewStatusValue] = useState<LabJob['status'] | null>(null);
  const [editingJob, setEditingJob] = useState<LabJob | null>(null);
  const { toast } = useToast();

  // Define the sorting and filtering logic outside the conditional rendering
  const sortedAndFilteredLabJobs = useMemo(() => {
    // First filter the jobs
    const filtered = labJobs.filter(job => {
      const matchesSearch =
        !searchTerm ||
        job.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.assignedLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.labWorkType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !selectedStatus || selectedStatus === "all" || job.status === selectedStatus;
      const matchesLab = !selectedLab || selectedLab === "all" || job.assignedLab === selectedLab;
      const matchesPaymentStatus = !selectedPaymentStatus || selectedPaymentStatus === "all" || job.paymentStatus === selectedPaymentStatus;

      return matchesSearch && matchesStatus && matchesLab && matchesPaymentStatus;
    });

    // Then sort the filtered jobs by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateSent).getTime();
      const dateB = new Date(b.dateSent).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [labJobs, searchTerm, selectedStatus, selectedLab, selectedPaymentStatus, sortOrder]);

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
      setLabJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === selectedJobId
            ? { ...job, paymentStatus: job.paymentStatus === 'paid' ? 'unpaid' : 'paid' }
            : job
        )
      );

      toast({
        title: "Payment Status Updated",
        description: "The payment status has been updated successfully.",
      });

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
      setLabJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === selectedJobId
            ? { ...job, status: newStatusValue }
            : job
        )
      );

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
    const headers = ['Patient', 'Service', 'Lab Work Type', 'Date Sent', 'Laboratory', 'Expected Delivery', 'Payment Status', 'Status'];

    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredLabJobs.map(job => {
        return [
          `"${job.patient}"`,
          `"${job.service}"`,
          `"${job.labWorkType}"`,
          job.dateSent,
          `"${job.assignedLab}"`,
          job.expectedDelivery,
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

  const handleCreateLabEntry = () => {
    setIsNewLabDialogOpen(false);
    toast({
      title: "Lab Entry Created",
      description: "The new lab work entry has been added successfully.",
    });
  };

  const openEditDialog = (job: LabJob) => {
    setEditingJob(job);
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
      // In a real app, we would update the job with form values
      setLabJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === editingJob.id ? editingJob : job
        )
      );

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
      setLabJobs(prevJobs => prevJobs.filter(job => job.id !== editingJob.id));

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
                  <TableRow key={job.id} className="group">
                    <TableCell className="font-medium">{job.patient}</TableCell>
                    <TableCell className="hidden md:table-cell">{job.service}</TableCell>
                    <TableCell>{job.labWorkType}</TableCell>
                    <TableCell className="hidden lg:table-cell">{job.dateSent}</TableCell>
                    <TableCell className="hidden md:table-cell">{job.assignedLab}</TableCell>
                    <TableCell>{job.expectedDelivery}</TableCell>
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
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Lab Entry</DialogTitle>
            <DialogDescription>
              Enter the details for the new lab work order. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient Name *</Label>
                <Select>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select Patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aarav-sharma">Aarav Sharma</SelectItem>
                    <SelectItem value="priya-patel">Priya Patel</SelectItem>
                    <SelectItem value="vikram-singh">Vikram Singh</SelectItem>
                    <SelectItem value="neha-kapoor">Neha Kapoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crown-placement">Crown Placement</SelectItem>
                    <SelectItem value="bridge-procedure">Bridge Procedure</SelectItem>
                    <SelectItem value="complete-denture">Complete Denture</SelectItem>
                    <SelectItem value="implant-restoration">Implant Restoration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="labWorkType">Lab Work Type *</Label>
                <Select>
                  <SelectTrigger id="labWorkType">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pfm-crown">PFM Crown</SelectItem>
                    <SelectItem value="ceramic-bridge">Ceramic Bridge</SelectItem>
                    <SelectItem value="acrylic-denture">Acrylic Denture</SelectItem>
                    <SelectItem value="custom-abutment">Custom Abutment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedLab">Assigned Lab *</Label>
                <Select>
                  <SelectTrigger id="assignedLab">
                    <SelectValue placeholder="Select Lab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="precision-dental-lab">Precision Dental Lab</SelectItem>
                    <SelectItem value="nova-dental-solutions">Nova Dental Solutions</SelectItem>
                    <SelectItem value="dent-creations-india">Dent Creations India</SelectItem>
                    <SelectItem value="implant-specialists">Implant Specialists</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateSent">Date Sent *</Label>
                <Input type="date" id="dateSent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery">Expected Delivery *</Label>
                <Input type="date" id="expectedDelivery" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="pending-send">
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
                <Select defaultValue="unpaid">
                  <SelectTrigger id="paymentStatus">
                    <SelectValue placeholder="Select Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="materialSpecs">Material/Shade Specifications</Label>
                <Input id="materialSpecs" placeholder="e.g., A2 Shade, Metal-free" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" placeholder="Additional instructions for the lab" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLabDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleCreateLabEntry}
              className="bg-dental-primary hover:bg-dental-dark">
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Lab Entry</DialogTitle>
            <DialogDescription>
              Update the details for this lab work order. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {editingJob && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-patient">Patient Name *</Label>
                  <Select defaultValue={editingJob.patient}>
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
                <div className="space-y-2">
                  <Label htmlFor="edit-service">Service *</Label>
                  <Select defaultValue={editingJob.service}>
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
                  <Select defaultValue={editingJob.labWorkType}>
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
                  <Select defaultValue={editingJob.assignedLab}>
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
                  <Input type="date" id="edit-dateSent" defaultValue={editingJob.dateSent} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expectedDelivery">Expected Delivery *</Label>
                  <Input type="date" id="edit-expectedDelivery" defaultValue={editingJob.expectedDelivery} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select defaultValue={editingJob.status}>
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
                  <Select defaultValue={editingJob.paymentStatus}>
                    <SelectTrigger id="edit-paymentStatus">
                      <SelectValue placeholder="Select Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-materialSpecs">Material/Shade Specifications</Label>
                  <Input id="edit-materialSpecs" placeholder="e.g., A2 Shade, Metal-free" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input id="edit-notes" placeholder="Additional instructions for the lab" />
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
