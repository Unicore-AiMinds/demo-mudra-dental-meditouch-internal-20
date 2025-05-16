
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowDownUp,
  Download,
  Filter,
  Search,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Settings,
  PackageOpen,
  Microscope,
  Eye,
  LogIn,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  actionCategory: 'auth' | 'appointment' | 'stock' | 'lab' | 'patient' | 'user' | 'settings';
  actionType: string;
  targetEntity: string;
  details: string;
  changes?: {
    before: any;
    after: any;
  };
}

// Demo audit log data
const demoAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: '2025-05-16 10:30:15',
    user: 'Dr. Sharma',
    userRole: 'Doctor',
    actionCategory: 'appointment',
    actionType: 'Create Appointment',
    targetEntity: 'Appointment #APT123',
    details: 'Created new appointment for patient Rahul Patel - Dental Checkup',
  },
  {
    id: '2',
    timestamp: '2025-05-16 10:15:00',
    user: 'Dr. Sharma',
    userRole: 'Doctor',
    actionCategory: 'patient',
    actionType: 'Update Patient',
    targetEntity: 'Patient #PT456',
    details: 'Updated medical history for Priya Singh',
  },
  {
    id: '3',
    timestamp: '2025-05-16 09:45:22',
    user: 'Neha Kapoor',
    userRole: 'Receptionist',
    actionCategory: 'auth',
    actionType: 'User Login',
    targetEntity: 'System',
    details: 'Successful login from Mumbai office IP',
  },
  {
    id: '4',
    timestamp: '2025-05-16 09:30:00',
    user: 'Dr. Patel',
    userRole: 'Doctor',
    actionCategory: 'lab',
    actionType: 'Create Lab Work',
    targetEntity: 'Lab Work #LW789',
    details: 'Created new lab work order for patient Amit Shah - Crown preparation',
  },
  {
    id: '5',
    timestamp: '2025-05-15 18:45:10',
    user: 'Admin',
    userRole: 'Administrator',
    actionCategory: 'stock',
    actionType: 'Update Stock',
    targetEntity: 'Stock Item #ST101',
    details: 'Updated quantity for Dental Composite (Filtek Supreme Ultra)',
  },
  {
    id: '6',
    timestamp: '2025-05-15 17:30:00',
    user: 'Dr. Sharma',
    userRole: 'Doctor',
    actionCategory: 'appointment',
    actionType: 'Reschedule Appointment',
    targetEntity: 'Appointment #APT120',
    details: 'Rescheduled appointment for Sonia Verma from 2025-05-17 to 2025-05-20',
  },
  {
    id: '7',
    timestamp: '2025-05-15 16:20:15',
    user: 'Neha Kapoor',
    userRole: 'Receptionist',
    actionCategory: 'patient',
    actionType: 'Create Patient',
    targetEntity: 'Patient #PT789',
    details: 'Created new patient record for Rajesh Kumar',
  },
  {
    id: '8',
    timestamp: '2025-05-15 15:45:30',
    user: 'Dr. Patel',
    userRole: 'Doctor',
    actionCategory: 'lab',
    actionType: 'Update Lab Work',
    targetEntity: 'Lab Work #LW785',
    details: 'Updated status to Ready for patient Meera Reddy',
  },
  {
    id: '9',
    timestamp: '2025-05-15 14:30:00',
    user: 'Admin',
    userRole: 'Administrator',
    actionCategory: 'settings',
    actionType: 'Update Settings',
    targetEntity: 'System Settings',
    details: 'Updated clinic working hours for weekends',
  },
  {
    id: '10',
    timestamp: '2025-05-15 14:15:45',
    user: 'Dr. Sharma',
    userRole: 'Doctor',
    actionCategory: 'patient',
    actionType: 'Delete Patient',
    targetEntity: 'Patient #PT445',
    details: 'Deleted inactive patient record for John Doe',
  }
];

// Get icon for action category
const getActionIcon = (category: AuditLogEntry['actionCategory']) => {
  switch (category) {
    case 'auth':
      return <LogIn className="h-4 w-4" />;
    case 'appointment':
      return <Calendar className="h-4 w-4" />;
    case 'stock':
      return <PackageOpen className="h-4 w-4" />;
    case 'lab':
      return <Microscope className="h-4 w-4" />;
    case 'patient':
      return <User className="h-4 w-4" />;
    case 'user':
      return <User className="h-4 w-4" />;
    case 'settings':
      return <Settings className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

// Get badge for action type
const getActionBadge = (actionType: string) => {
  if (actionType.includes('Create')) {
    return <Badge className="bg-green-500"><Plus className="h-3 w-3 mr-1" /> {actionType}</Badge>;
  } else if (actionType.includes('Update')) {
    return <Badge className="bg-blue-500"><Edit className="h-3 w-3 mr-1" /> {actionType}</Badge>;
  } else if (actionType.includes('Delete')) {
    return <Badge className="bg-red-500"><Trash2 className="h-3 w-3 mr-1" /> {actionType}</Badge>;
  } else if (actionType.includes('Login')) {
    return <Badge className="bg-purple-500"><LogIn className="h-3 w-3 mr-1" /> {actionType}</Badge>;
  } else if (actionType.includes('Logout')) {
    return <Badge variant="outline"><LogIn className="h-3 w-3 mr-1" /> {actionType}</Badge>;
  } else if (actionType.includes('Reschedule')) {
    return <Badge className="bg-amber-500"><Calendar className="h-3 w-3 mr-1" /> {actionType}</Badge>;
  } else {
    return <Badge className="bg-gray-500">{actionType}</Badge>;
  }
};

const AuditLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with demo data
  useEffect(() => {
    const loadDemoData = async () => {
      try {
        setIsLoading(true);
        setAuditLogs(demoAuditLogs);
      } catch (error) {
        console.error('Error loading demo audit logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load audit logs',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDemoData();
  }, [supabase, toast]);

  // Check if the user is an admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <AlertCircle className="h-16 w-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          The Audit Log is only accessible to administrators.
          Please contact your system administrator if you need access.
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <div className="animate-spin h-16 w-16 mx-auto mb-4 border-4 border-dental-primary border-t-transparent rounded-full"></div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading Audit Logs</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          Please wait while we fetch the audit logs from the database.
        </p>
      </div>
    );
  }

  // Get unique users for the filter
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.user)));

  // Filter logs based on search term and filters
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    // Fixed filtering logic - when "all" is selected or nothing is selected, show all items
    const matchesCategory = !selectedCategory || selectedCategory === "all" || log.actionCategory === selectedCategory;
    const matchesUser = !selectedUser || selectedUser === "all" || log.user === selectedUser;

    return matchesSearch && matchesCategory && matchesUser;
  });

  // Sort logs by timestamp based on sort order
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Toggle sort order function
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Pagination logic
  const logsPerPage = 5;
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = sortedLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Track and monitor all system activities</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            // Create CSV content from the filtered logs
            const headers = ['Timestamp', 'User', 'Role', 'Action Category', 'Action Type', 'Target', 'Details'];

            const csvContent = [
              headers.join(','),
              ...sortedLogs.map((log) => [
                `"${log.timestamp}"`,
                `"${log.user}"`,
                `"${log.userRole}"`,
                `"${log.actionCategory}"`,
                `"${log.actionType}"`,
                `"${log.targetEntity}"`,
                `"${log.details}"`
              ].join(','))
            ].join('\n');

            // Create a blob and download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            const filename = `dental_audit_log_${new Date().toISOString().split('T')[0]}.csv`;

            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
              title: "Export Successful",
              description: `${sortedLogs.length} audit log entries exported to CSV.`,
            });
          }}
        >
          <Download className="mr-2 h-4 w-4" /> Export Log
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by user, action, or details..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Action Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="appointment">Appointments</SelectItem>
              <SelectItem value="stock">Stock Management</SelectItem>
              <SelectItem value="lab">Lab Work</SelectItem>
              <SelectItem value="patient">Patients</SelectItem>
              <SelectItem value="user">User Management</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>{user}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={toggleSortOrder} className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Sort by Date
            <ArrowDownUp className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>Comprehensive record of all actions performed in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>

              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user}</span>
                        <span className="text-xs text-muted-foreground">{log.userRole}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.actionCategory)}
                        {getActionBadge(log.actionType)}
                      </div>
                    </TableCell>
                    <TableCell>{log.targetEntity}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">{log.details}</TableCell>

                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No matching logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
