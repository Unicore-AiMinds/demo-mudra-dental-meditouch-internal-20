import { useState } from 'react';
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
  AlertCircle,
  CheckCircle2,
  Clock,
  Microscope
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
  status: 'pending' | 'sent' | 'in-progress' | 'received' | 'ready' | 'delivered' | 'issue';
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
    status: "in-progress"
  },
  {
    id: "LJ002",
    patient: "Priya Patel",
    service: "Complete Denture",
    labWorkType: "Acrylic Denture",
    dateSent: "2023-10-16",
    assignedLab: "Nova Dental Solutions",
    expectedDelivery: "2023-10-30",
    status: "pending"
  },
  {
    id: "LJ003",
    patient: "Vikram Singh",
    service: "Bridge Procedure",
    labWorkType: "Ceramic Bridge",
    dateSent: "2023-10-10",
    assignedLab: "Dent Creations India",
    expectedDelivery: "2023-10-20",
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
    status: "issue"
  },
  {
    id: "LJ006",
    patient: "Ananya Reddy",
    service: "Nightguard",
    labWorkType: "Hard Acrylic Splint",
    dateSent: "2023-10-12",
    assignedLab: "Nova Dental Solutions",
    expectedDelivery: "2023-10-22",
    status: "delivered"
  }
];

type StatusConfig = {
  [key in LabJob['status']]: {
    label: string;
    variant: "outline" | "secondary" | "default" | "destructive";
    className?: string;
  }
};

const getStatusBadge = (status: LabJob['status']) => {
  const statusConfig: StatusConfig = {
    pending: { label: "Pending", variant: "outline" },
    sent: { label: "Sent to Lab", variant: "secondary" },
    "in-progress": { label: "In Progress", variant: "default", className: "bg-blue-500" },
    received: { label: "Received (QC)", variant: "default", className: "bg-purple-500" },
    ready: { label: "Ready", variant: "default", className: "bg-green-500" },
    delivered: { label: "Delivered", variant: "default", className: "bg-gray-500 opacity-70" },
    issue: { label: "Issue", variant: "destructive" }
  };

  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

const getStatusIcon = (status: LabJob['status']) => {
  switch (status) {
    case 'pending':
    case 'sent':
    case 'in-progress':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'received':
    case 'ready':
    case 'delivered':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'issue':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

const LabWork = () => {
  const { activeClinic } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewLabDialogOpen, setIsNewLabDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedLab, setSelectedLab] = useState<string | undefined>(undefined);
  const { toast } = useToast();

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

  const filteredLabJobs = demoLabJobs.filter(job => {
    const matchesSearch = 
      !searchTerm || 
      job.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.assignedLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.labWorkType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || selectedStatus === "all" || job.status === selectedStatus;
    const matchesLab = !selectedLab || selectedLab === "all" || job.assignedLab === selectedLab;
    
    return matchesSearch && matchesStatus && matchesLab;
  });
  
  const uniqueLabs = Array.from(new Set(demoLabJobs.map(job => job.assignedLab)));

  const handleCreateLabEntry = () => {
    setIsNewLabDialogOpen(false);
    toast({
      title: "Lab Entry Created",
      description: "The new lab work entry has been added successfully.",
    });
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent to Lab</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="received">Received (QC)</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="issue">Issue</SelectItem>
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
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Service</TableHead>
                <TableHead>Lab Work Type</TableHead>
                <TableHead className="hidden lg:table-cell">Date Sent</TableHead>
                <TableHead className="hidden md:table-cell">Laboratory</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLabJobs.length > 0 ? (
                filteredLabJobs.map((job) => (
                  <TableRow key={job.id} className="group">
                    <TableCell className="font-mono text-sm">{job.id}</TableCell>
                    <TableCell className="font-medium">{job.patient}</TableCell>
                    <TableCell className="hidden md:table-cell">{job.service}</TableCell>
                    <TableCell>{job.labWorkType}</TableCell>
                    <TableCell className="hidden lg:table-cell">{job.dateSent}</TableCell>
                    <TableCell className="hidden md:table-cell">{job.assignedLab}</TableCell>
                    <TableCell>{job.expectedDelivery}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        {getStatusBadge(job.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select>
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sent">Sent to Lab</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="received">Received (QC)</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="issue">Issue</SelectItem>
                        </SelectContent>
                      </Select>
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
    </div>
  );
};

export default LabWork;
