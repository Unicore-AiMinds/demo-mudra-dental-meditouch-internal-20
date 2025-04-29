import { useState, useMemo } from 'react';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
import { useClinic } from '@/contexts/ClinicContext';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { Calendar, Search, Filter, ArrowUpDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TentativeFollowUp } from '@/types/dental-history';
import { useToast } from '@/components/ui/use-toast';

const RecallList = () => {
  const { getPendingFollowUps, updateFollowUpStatus } = useDentalHistory();
  const { activeClinic } = useClinic();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'overdue'>('all');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);

  // Get all pending follow-ups
  const pendingFollowUps = getPendingFollowUps();

  // Filter and sort follow-ups
  const filteredAndSortedFollowUps = useMemo(() => {
    const today = new Date();

    // Filter by search term, status, and selected sequence
    const filtered = pendingFollowUps.filter(followUp => {
      const matchesSearch =
        followUp.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.suggestedServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.originalService.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.originalDoctor.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status (upcoming or overdue)
      if (filterStatus !== 'all') {
        const followUpDate = parseISO(followUp.tentativeDate);
        if (filterStatus === 'upcoming' && isBefore(followUpDate, today)) {
          return false;
        }
        if (filterStatus === 'overdue' && isAfter(followUpDate, today)) {
          return false;
        }
      }

      // Filter by selected sequence
      if (selectedSequenceId && followUp.sequenceGroupId !== selectedSequenceId) {
        return false;
      }

      return matchesSearch;
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.tentativeDate);
        const dateB = new Date(b.tentativeDate);
        return sortOrder === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else {
        return sortOrder === 'asc'
          ? a.patientName.localeCompare(b.patientName)
          : b.patientName.localeCompare(a.patientName);
      }
    });
  }, [pendingFollowUps, searchTerm, sortBy, sortOrder, filterStatus, selectedSequenceId]);

  // Toggle sort order
  const toggleSort = (field: 'date' | 'patient') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle viewing all follow-ups in a sequence
  const handleViewSequence = (sequenceGroupId: string) => {
    setSelectedSequenceId(sequenceGroupId);

    // Show toast notification
    toast({
      title: "Sequence Filter Applied",
      description: "Showing all follow-ups in this sequence. Click 'Clear Sequence Filter' to show all follow-ups again.",
    });
  };

  // Handle clearing the sequence filter
  const handleClearSequenceFilter = () => {
    setSelectedSequenceId(null);

    // Show toast notification
    toast({
      title: "Sequence Filter Cleared",
      description: "Showing all follow-ups.",
    });
  };

  // Handle scheduling an appointment from a follow-up
  const handleScheduleAppointment = (followUp: TentativeFollowUp) => {
    // Update the follow-up status to 'Scheduled'
    updateFollowUpStatus(followUp.followUpId, 'Scheduled');

    // Show toast notification
    toast({
      title: "Follow-up Scheduled",
      description: `The follow-up for ${followUp.patientName} has been marked as scheduled.`,
    });

    // Dispatch custom event to open the new appointment form with pre-filled data
    const event = new CustomEvent('openNewAppointmentFormWithData', {
      detail: {
        patientName: followUp.patientName,
        patientId: followUp.patientId,
        serviceName: followUp.suggestedServiceName,
        date: followUp.tentativeDate,
        followUpId: followUp.followUpId
      }
    });
    window.dispatchEvent(event);

    // Navigate to appointments page
    window.location.href = '/appointments';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Recall List</h1>
          <p className="text-muted-foreground">
            Manage follow-up appointments and patient recalls
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tentative Follow-ups</CardTitle>
          <CardDescription>
            Patients due for follow-up appointments based on previous treatments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients, services..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value: string) => setFilterStatus(value as 'all' | 'upcoming' | 'overdue')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Follow-ups</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {selectedSequenceId && (
              <Button
                variant="outline"
                onClick={handleClearSequenceFilter}
                className="w-full md:w-auto"
              >
                Clear Sequence Filter
              </Button>
            )}
          </div>

          {filteredAndSortedFollowUps.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort('patient')}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Patient
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort('date')}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Tentative Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Suggested Service</TableHead>
                    <TableHead>Follow-up Step</TableHead>
                    <TableHead>Original Procedure</TableHead>
                    <TableHead>Original Doctor</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedFollowUps.map((followUp) => {
                    const followUpDate = parseISO(followUp.tentativeDate);
                    const isOverdue = isBefore(followUpDate, new Date());

                    return (
                      <TableRow key={followUp.followUpId}>
                        <TableCell className="font-medium">{followUp.patientName}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{format(parseISO(followUp.tentativeDate), 'dd MMM yyyy')}</span>
                            {isOverdue && (
                              <Badge variant="destructive" className="ml-2">Overdue</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{followUp.suggestedServiceName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center">
                              <Badge
                                variant={followUp.totalStepsInSequence > 1 ? "outline" : "secondary"}
                                className="mr-2"
                              >
                                {followUp.followUpSequence} of {followUp.totalStepsInSequence}
                              </Badge>
                            </div>

                            {followUp.totalStepsInSequence > 1 && !selectedSequenceId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2 py-1 w-fit"
                                onClick={() => handleViewSequence(followUp.sequenceGroupId || '')}
                              >
                                View All Steps
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{followUp.originalService}</TableCell>
                        <TableCell>{followUp.originalDoctor}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`${
                              activeClinic === 'dental'
                                ? 'text-dental-primary hover:bg-dental-50 hover:text-dental-dark'
                                : 'text-meditouch-primary hover:bg-meditouch-50 hover:text-meditouch-dark'
                            }`}
                            onClick={() => handleScheduleAppointment(followUp)}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No pending follow-ups</h3>
              <p className="text-muted-foreground mt-2">
                There are no pending follow-ups that match your filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecallList;
