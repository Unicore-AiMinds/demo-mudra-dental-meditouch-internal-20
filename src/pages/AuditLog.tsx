import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

// Sample audit log data
const demoAuditLogs: AuditLogEntry[] = [
  {
    id: "AUD001",
    timestamp: "2023-10-15 09:32:15",
    user: "Dr. Rajan Khanna",
    userRole: "admin",
    actionCategory: "auth",
    actionType: "Login Success",
    targetEntity: "System",
    details: "Successful login from 192.168.1.105"
  },
  {
    id: "AUD002",
    timestamp: "2023-10-15 10:15:20",
    user: "Dr. Rajan Khanna",
    userRole: "admin",
    actionCategory: "appointment",
    actionType: "Create Appointment",
    targetEntity: "Aarav Sharma",
    details: "Created new appointment for dental checkup"
  },
  {
    id: "AUD003",
    timestamp: "2023-10-15 11:20:35",
    user: "Lakshmi Menon",
    userRole: "receptionist",
    actionCategory: "appointment",
    actionType: "Reschedule Appointment",
    targetEntity: "Priya Patel",
    details: "Rescheduled appointment from 16 Oct to 18 Oct",
    changes: {
      before: { date: "2023-10-16", time: "10:00 AM" },
      after: { date: "2023-10-18", time: "11:30 AM" }
    }
  },
  {
    id: "AUD004",
    timestamp: "2023-10-15 12:05:40",
    user: "Rajesh Sharma",
    userRole: "inventory",
    actionCategory: "stock",
    actionType: "Update Stock",
    targetEntity: "Dental Composite",
    details: "Added 25 units to inventory",
    changes: {
      before: { quantity: 15 },
      after: { quantity: 40 }
    }
  },
  {
    id: "AUD005",
    timestamp: "2023-10-15 13:45:10",
    user: "Dr. Priya Desai",
    userRole: "doctor",
    actionCategory: "lab",
    actionType: "Create Lab Work",
    targetEntity: "Vikram Singh",
    details: "Created new lab work order for PFM Crown"
  },
  {
    id: "AUD006",
    timestamp: "2023-10-15 14:30:25",
    user: "Dr. Rajan Khanna",
    userRole: "admin",
    actionCategory: "patient",
    actionType: "Create Patient",
    targetEntity: "Divya Menon",
    details: "Added new patient record"
  },
  {
    id: "AUD007",
    timestamp: "2023-10-15 15:20:55",
    user: "Dr. Rajan Khanna",
    userRole: "admin",
    actionCategory: "user",
    actionType: "Create User",
    targetEntity: "Arjun Kumar",
    details: "Created new user with Inventory Manager role"
  },
  {
    id: "AUD008",
    timestamp: "2023-10-15 16:45:30",
    user: "Dr. Rajan Khanna",
    userRole: "admin",
    actionCategory: "settings",
    actionType: "Update Settings",
    targetEntity: "Clinic Hours",
    details: "Updated clinic opening hours",
    changes: {
      before: { sunday: "Closed" },
      after: { sunday: "10:00 AM - 2:00 PM" }
    }
  },
  {
    id: "AUD009",
    timestamp: "2023-10-15 17:30:15",
    user: "Rajesh Sharma",
    userRole: "inventory",
    actionCategory: "stock",
    actionType: "Delete Stock Item",
    targetEntity: "Expired Anesthetic",
    details: "Removed expired stock"
  },
  {
    id: "AUD010",
    timestamp: "2023-10-15 18:00:40",
    user: "Lakshmi Menon",
    userRole: "receptionist",
    actionCategory: "auth",
    actionType: "Logout",
    targetEntity: "System",
    details: "User logged out"
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  
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
  
  // Get unique users for the filter
  const uniqueUsers = Array.from(new Set(demoAuditLogs.map(log => log.user)));
  
  // Filter logs based on search term and filters
  const filteredLogs = demoAuditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || log.actionCategory === selectedCategory;
    const matchesUser = !selectedUser || log.user === selectedUser;
    
    return matchesSearch && matchesCategory && matchesUser;
  });
  
  // Pagination logic
  const logsPerPage = 5;
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Track and monitor all system activities</p>
        </div>
        <Button variant="outline">
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
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.map((log) => (
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
