
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuditLog } from '@/contexts/AuditLogContext';
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
  Search,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Settings,
  PackageOpen,
  Microscope,
  LogIn,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { formatDateForExport, formatDateForFilename } from '@/utils/dateFormatter';

// Use the AuditLog interface from the context
import { AuditLog as AuditLogEntry } from '@/contexts/AuditLogContext';



// Get icon for action category
const getActionIcon = (category: AuditLogEntry['action_category']) => {
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
    case 'doctor':
      return <User className="h-4 w-4" />;
    case 'service':
      return <FileText className="h-4 w-4" />;
    case 'prescription':
      return <FileText className="h-4 w-4" />;
    case 'dental_history':
      return <FileText className="h-4 w-4" />;
    case 'dental_charting':
      return <FileText className="h-4 w-4" />;
    case 'vital_signs':
      return <FileText className="h-4 w-4" />;
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
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const { auditLogs, isLoading, fetchAuditLogs } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first

  // Date range state - default to today
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [dateRangePreset, setDateRangePreset] = useState<string>('today');

  // Fetch audit logs on component mount
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Date range preset handler
  const handleDateRangePreset = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    setDateRangePreset(preset);

    switch (preset) {
      case 'today': {
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      }
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setStartDate(yesterdayStr);
        setEndDate(yesterdayStr);
        break;
      }
      case 'last7days': {
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        setStartDate(last7Days.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'last30days': {
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        setStartDate(last30Days.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'thismonth': {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'all': {
        setStartDate('');
        setEndDate('');
        break;
      }
      default:
        break;
    }
  };



  // Check if the user has permission to view audit logs
  if (!hasPermission('audit_logs.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <AlertCircle className="h-16 w-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          You don't have permission to view audit logs.
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
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.user_name)));

  // Filter logs based on search term, filters, and date range
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    // Fixed filtering logic - when "all" is selected or nothing is selected, show all items
    const matchesCategory = !selectedCategory || selectedCategory === "all" || log.action_category === selectedCategory;
    const matchesUser = !selectedUser || selectedUser === "all" || log.user_name === selectedUser;

    // Date range filtering
    let matchesDateRange = true;
    if (startDate || endDate) {
      const logDate = new Date(log.timestamp);
      const logDateStr = logDate.toISOString().split('T')[0];

      if (startDate && logDateStr < startDate) {
        matchesDateRange = false;
      }
      if (endDate && logDateStr > endDate) {
        matchesDateRange = false;
      }
    }

    return matchesSearch && matchesCategory && matchesUser && matchesDateRange;
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
  const logsPerPage = 25;
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = sortedLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);

  // For results summary
  const startIndex = indexOfFirstLog;
  const endIndex = indexOfLastLog;

  // Export function
  const exportToExcel = () => {
    // Create CSV content from the filtered logs
    const headers = ['Timestamp', 'User', 'Role', 'Action Category', 'Action Type', 'Target', 'Details'];

    const csvContent = [
      headers.join(','),
      ...sortedLogs.map((log) => [
        `"${formatDateForExport(log.timestamp)}"`,
        `"${log.user_name}"`,
        `"${log.user_role}"`,
        `"${log.action_category}"`,
        `"${log.action_type}"`,
        `"${log.target_entity}"`,
        `"${log.details}"`
      ].join(','))
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    const filename = `dental_audit_log_${formatDateForFilename()}.csv`;

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
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Track and monitor all system activities</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('audit_logs.export') && (
            <Button
              variant="outline"
              onClick={exportToExcel}
            >
              <Download className="mr-2 h-4 w-4" /> Export Log
            </Button>
          )}
        </div>
      </div>

      {/* Filters and search */}
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by user, action, or details..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date range and filters */}
        <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-x-2 lg:space-y-0">
          {/* Date range presets */}
          <div className="flex items-center space-x-2">
            <Select value={dateRangePreset} onValueChange={handleDateRangePreset}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thismonth">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom date inputs - show when custom is selected */}
            {dateRangePreset === 'custom' && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[140px]"
                  placeholder="Start Date"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[140px]"
                  placeholder="End Date"
                />
              </>
            )}
          </div>

          {/* Other filters */}
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
                <SelectItem value="doctor">Doctors</SelectItem>
                <SelectItem value="service">Services</SelectItem>
                <SelectItem value="prescription">Prescriptions</SelectItem>
                <SelectItem value="dental_history">Dental History</SelectItem>
                <SelectItem value="dental_charting">Dental Charting</SelectItem>
                <SelectItem value="vital_signs">Vital Signs</SelectItem>
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
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
          </p>
          {(startDate || endDate) && (
            <p className="text-xs text-muted-foreground">
              {startDate && endDate && startDate === endDate
                ? `Date: ${new Date(startDate).toLocaleDateString()}`
                : startDate && endDate
                ? `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                : startDate
                ? `From: ${new Date(startDate).toLocaleDateString()}`
                : `Until: ${new Date(endDate).toLocaleDateString()}`
              }
            </p>
          )}
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
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user_name}</span>
                        <span className="text-xs text-muted-foreground">{log.user_role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_category)}
                        {getActionBadge(log.action_type)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate cursor-help">
                            {log.target_entity}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{log.target_entity}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate cursor-help">
                            {log.details}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <p className="whitespace-pre-wrap">{log.details}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>

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
    </TooltipProvider>
  );
};

export default AuditLog;
