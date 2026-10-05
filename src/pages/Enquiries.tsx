import { useCallback, useEffect, useMemo, useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { formatDateForDisplay, formatDateForFilename } from '@/utils/dateFormatter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Inbox,
} from 'lucide-react';

// A website contact-form submission ("enquiry").
interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  service_inquiry: string;
  message: string | null;
  clinic: 'dental_metrix' | 'meditouch';
  status: 'new' | 'contacted' | 'follow-up' | 'scheduled' | 'closed';
  submitted_at: string;
  updated_at: string;
}

const STATUS_OPTIONS: Enquiry['status'][] = [
  'new',
  'contacted',
  'follow-up',
  'scheduled',
  'closed',
];

const STATUS_STYLES: Record<Enquiry['status'], string> = {
  new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  contacted: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  'follow-up': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  scheduled: 'bg-green-100 text-green-800 hover:bg-green-100',
  closed: 'bg-gray-200 text-gray-700 hover:bg-gray-200',
};

const STATUS_LABEL: Record<Enquiry['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  'follow-up': 'Follow-up',
  scheduled: 'Scheduled',
  closed: 'Closed',
};

const PAGE_SIZES = [10, 15, 25, 50];

const Enquiries = () => {
  const { activeClinic } = useClinic();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();

  const canChangeStatus = hasPermission('enquiries.change_status');
  const canExport = hasPermission('enquiries.export');
  const canDelete = hasPermission('enquiries.delete');

  // The contact form stores the dental brand as 'dental_metrix'.
  const clinicValue: Enquiry['clinic'] =
    activeClinic === 'dental' ? 'dental_metrix' : 'meditouch';

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [enquiryToDelete, setEnquiryToDelete] = useState<Enquiry | null>(null);

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await supabase.from<Enquiry>('contact_submissions').getAll({
        order: { column: 'submitted_at', ascending: false },
        filters: { clinic: clinicValue },
      });
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading enquiries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enquiries. Please try again.',
        variant: 'destructive',
      });
      setEnquiries([]);
    } finally {
      setIsLoading(false);
    }
  }, [clinicValue, toast]);

  // Reload whenever the active clinic changes.
  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  // Reset to first page when filters / data change.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize, enquiries]);

  const filteredEnquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!q) return true;
      return [e.name, e.email, e.phone, e.service_inquiry, e.message || '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [enquiries, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredEnquiries.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleStatusChange = async (enquiry: Enquiry, next: Enquiry['status']) => {
    if (next === enquiry.status) return;
    setUpdatingId(enquiry.id);
    // Optimistic update.
    const previous = enquiry.status;
    setEnquiries((prev) =>
      prev.map((e) => (e.id === enquiry.id ? { ...e, status: next } : e))
    );
    try {
      await supabase.from<Enquiry>('contact_submissions').update(enquiry.id, {
        status: next,
      });
      toast({
        title: 'Status updated',
        description: `${enquiry.name} marked as "${STATUS_LABEL[next]}".`,
      });
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      // Roll back on failure.
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? { ...e, status: previous } : e))
      );
      toast({
        title: 'Error',
        description: 'Could not update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    const enquiry = enquiryToDelete;
    if (!enquiry) return;
    setEnquiryToDelete(null);
    const snapshot = enquiries;
    // Optimistic removal.
    setEnquiries((prev) => prev.filter((e) => e.id !== enquiry.id));
    try {
      await supabase.from<Enquiry>('contact_submissions').delete(enquiry.id);
      toast({ title: 'Enquiry deleted', description: `Removed ${enquiry.name}.` });
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      setEnquiries(snapshot);
      toast({
        title: 'Error',
        description: 'Could not delete the enquiry. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    const esc = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'Date',
      'Name',
      'Phone',
      'Email',
      'Service Inquiry',
      'Message',
      'Status',
    ];
    const header = headers.map(esc).join(',');
    const body = filteredEnquiries
      .map((e) =>
        [
          formatDateForDisplay(e.submitted_at),
          e.name,
          e.phone,
          e.email,
          e.service_inquiry,
          e.message || '',
          STATUS_LABEL[e.status],
        ]
          .map(esc)
          .join(',')
      )
      .join('\r\n');
    const csv = '﻿' + header + '\r\n' + body;
    const clinicTag = activeClinic === 'dental' ? 'dental_metrix' : 'meditouch';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries_${clinicTag}_${formatDateForFilename()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const newCount = enquiries.filter((e) => e.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Inbox className="h-7 w-7" /> Enquiries
            </h1>
            <p className="text-muted-foreground">
              Website contact-form submissions for{' '}
              {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'}
              {newCount > 0 && (
                <span className="ml-2 inline-flex">
                  <Badge className={STATUS_STYLES.new}>{newCount} new</Badge>
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadEnquiries} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            Search, filter by status, and update the progress of each enquiry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search name, phone, email, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full sm:w-72"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {filteredEnquiries.length} record(s)
              </span>
              {canExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={filteredEnquiries.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" /> Export (CSV)
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-md border">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading enquiries...</div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {enquiries.length === 0
                  ? 'No enquiries yet for this clinic.'
                  : 'No enquiries match your search / filter.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    {canDelete && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateForDisplay(e.submitted_at)}
                      </TableCell>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{e.phone}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={e.email}>
                        {e.email || '-'}
                      </TableCell>
                      <TableCell>{e.service_inquiry}</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={e.message || ''}>
                        {e.message || '-'}
                      </TableCell>
                      <TableCell>
                        {canChangeStatus ? (
                          <Select
                            value={e.status}
                            onValueChange={(v) => handleStatusChange(e, v as Enquiry['status'])}
                            disabled={updatingId === e.id}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_LABEL[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={STATUS_STYLES[e.status]}>
                            {STATUS_LABEL[e.status]}
                          </Badge>
                        )}
                      </TableCell>
                      {canDelete && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setEnquiryToDelete(e)}
                            title="Delete enquiry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {filteredEnquiries.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <AlertDialog
        open={enquiryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setEnquiryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the enquiry
              {enquiryToDelete && ` from ${enquiryToDelete.name}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Enquiries;
