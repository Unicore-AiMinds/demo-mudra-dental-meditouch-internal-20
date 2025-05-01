import { useState, useMemo } from 'react';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
import { useClinic } from '@/contexts/ClinicContext';
import { format, isAfter, isBefore, parseISO, addMonths } from 'date-fns';
import { Calendar, Search, Filter, ArrowUpDown, Clock, AlarmClock, FileText } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  const { getPendingFollowUps, getSnoozedFollowUps, updateFollowUpStatus, snoozeFollowUp, updateFollowUpNotes } = useDentalHistory();
  const { activeClinic } = useClinic();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'overdue'>('all');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'snoozed'>('pending');

  // State for snooze dialog
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<TentativeFollowUp | null>(null);
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(undefined);
  const [snoozeNotes, setSnoozeNotes] = useState('');

  // Get all pending and snoozed follow-ups
  const pendingFollowUps = getPendingFollowUps();
  const snoozedFollowUps = getSnoozedFollowUps();

  // Filter and sort follow-ups
  const filteredAndSortedFollowUps = useMemo(() => {
    const today = new Date();

    // Select the appropriate follow-ups based on the active tab
    const followUpsToFilter = activeTab === 'pending' ? pendingFollowUps : snoozedFollowUps;

    // Filter by search term, status, and selected sequence
    const filtered = followUpsToFilter.filter(followUp => {
      const matchesSearch =
        followUp.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.suggestedServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.originalService.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.originalDoctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (followUp.specialNotes && followUp.specialNotes.toLowerCase().includes(searchTerm.toLowerCase()));

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
  }, [pendingFollowUps, snoozedFollowUps, activeTab, searchTerm, sortBy, sortOrder, filterStatus, selectedSequenceId]);

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

  // Open the snooze dialog for a follow-up
  const handleOpenSnoozeDialog = (followUp: TentativeFollowUp) => {
    setSelectedFollowUp(followUp);
    // Default to 1 month from now
    setSnoozeDate(addMonths(new Date(), 1));
    setSnoozeNotes(followUp.specialNotes || '');
    setIsSnoozeDialogOpen(true);
  };

  // Handle snoozing a follow-up
  const handleSnoozeFollowUp = () => {
    if (!selectedFollowUp || !snoozeDate) return;

    const formattedDate = format(snoozeDate, 'yyyy-MM-dd');

    // Check if this is part of a sequence with multiple steps
    const isPartOfSequence = selectedFollowUp.sequenceGroupId &&
                            selectedFollowUp.totalStepsInSequence > 1 &&
                            selectedFollowUp.followUpSequence < selectedFollowUp.totalStepsInSequence;

    // Snooze the follow-up
    snoozeFollowUp(selectedFollowUp.followUpId, formattedDate, snoozeNotes);

    // Show toast notification
    if (isPartOfSequence) {
      toast({
        title: "Follow-up Sequence Updated",
        description: `The follow-up for ${selectedFollowUp.patientName} has been snoozed until ${format(snoozeDate, 'dd MMM yyyy')}. All subsequent steps in this sequence have been rescheduled accordingly.`,
      });
    } else {
      toast({
        title: "Follow-up Snoozed",
        description: `The follow-up for ${selectedFollowUp.patientName} has been snoozed until ${format(snoozeDate, 'dd MMM yyyy')}.`,
      });
    }

    // Close the dialog
    setIsSnoozeDialogOpen(false);
    setSelectedFollowUp(null);
    setSnoozeDate(undefined);
    setSnoozeNotes('');
  };

  // Handle unsnoozing a follow-up
  const handleUnsnoozeFollowUp = (followUp: TentativeFollowUp) => {
    // Check if this is part of a sequence with multiple steps
    const isPartOfSequence = followUp.sequenceGroupId &&
                            followUp.totalStepsInSequence > 1 &&
                            followUp.followUpSequence < followUp.totalStepsInSequence;

    // Update the follow-up status back to Pending
    updateFollowUpStatus(followUp.followUpId, 'Pending');

    // Show toast notification
    if (isPartOfSequence) {
      toast({
        title: "Follow-up Activated",
        description: `The follow-up for ${followUp.patientName} has been moved back to the pending list. Note that subsequent steps in the sequence may still need to be adjusted.`,
      });
    } else {
      toast({
        title: "Follow-up Activated",
        description: `The follow-up for ${followUp.patientName} has been moved back to the pending list.`,
      });
    }
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tentative Follow-ups</CardTitle>
              <CardDescription>
                Patients due for follow-up appointments based on previous treatments
              </CardDescription>
            </div>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={activeTab === 'pending' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'pending' ? '' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingFollowUps.length})
              </Button>
              <Button
                variant={activeTab === 'snoozed' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'snoozed' ? '' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('snoozed')}
              >
                Snoozed ({snoozedFollowUps.length})
              </Button>
            </div>
          </div>
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
            {activeTab === 'pending' ? (
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
            ) : (
              <div className="w-full md:w-[180px] opacity-50">
                <Button variant="outline" disabled className="w-full justify-start text-left">
                  <Filter className="mr-2 h-4 w-4" />
                  <span className="text-muted-foreground">Status filters not applicable</span>
                </Button>
              </div>
            )}

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
                    <TableHead>Special Notes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedFollowUps.map((followUp) => {
                    const followUpDate = parseISO(followUp.tentativeDate);
                    // Only show as overdue if it's in the pending tab and the date is in the past
                    const isOverdue = activeTab === 'pending' && isBefore(followUpDate, new Date());

                    return (
                      <TableRow key={followUp.followUpId}>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{followUp.patientName}</span>
                            {followUp.sequenceGroupId && followUp.totalStepsInSequence > 1 && (
                              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                                Sequence
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {activeTab === 'snoozed' && followUp.snoozedUntil ? (
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <span className="text-muted-foreground text-xs">Original: </span>
                                  <span className="text-xs ml-1">{format(parseISO(followUp.tentativeDate), 'dd MMM yyyy')}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-amber-700 font-medium">Snoozed until: </span>
                                  <span className="ml-1">{format(parseISO(followUp.snoozedUntil), 'dd MMM yyyy')}</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span>{format(parseISO(followUp.tentativeDate), 'dd MMM yyyy')}</span>
                                {isOverdue && (
                                  <Badge variant="destructive" className="ml-2">Overdue</Badge>
                                )}
                              </>
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
                        <TableCell>
                          {followUp.specialNotes ? (
                            <div className="max-w-[200px] truncate text-sm">
                              {followUp.specialNotes}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No special notes</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {activeTab === 'pending' ? (
                              <>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenSnoozeDialog(followUp)}
                                >
                                  <AlarmClock className="mr-2 h-4 w-4" />
                                  Snooze
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnsnoozeFollowUp(followUp)}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Activate
                              </Button>
                            )}
                            {followUp.specialNotes && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="px-2 py-1 h-8"
                                onClick={() => {
                                  toast({
                                    title: "Special Notes",
                                    description: followUp.specialNotes,
                                  });
                                }}
                              >
                                <FileText className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-xs">Notes</span>
                              </Button>
                            )}
                          </div>
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
              <h3 className="text-lg font-medium">
                {activeTab === 'pending' ? 'No pending follow-ups' : 'No snoozed follow-ups'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {activeTab === 'pending'
                  ? 'There are no pending follow-ups that match your filters.'
                  : 'There are no snoozed follow-ups. When you snooze a follow-up, it will appear here.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snooze Dialog */}
      <Dialog open={isSnoozeDialogOpen} onOpenChange={setIsSnoozeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Snooze Follow-up</DialogTitle>
            <DialogDescription>
              Temporarily hide this follow-up until the patient is available.
              {selectedFollowUp && selectedFollowUp.sequenceGroupId && selectedFollowUp.totalStepsInSequence > 1 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                  <strong>Note:</strong> This follow-up is step {selectedFollowUp.followUpSequence} of {selectedFollowUp.totalStepsInSequence} in a sequence.
                  {selectedFollowUp.followUpSequence < selectedFollowUp.totalStepsInSequence && (
                    <span> All subsequent steps will also be rescheduled accordingly.</span>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="snooze-date">Snooze Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="snooze-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {snoozeDate ? format(snoozeDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={snoozeDate}
                    onSelect={setSnoozeDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="special-notes">Special Notes</Label>
              <Textarea
                id="special-notes"
                placeholder="Add notes about patient availability (e.g., 'Patient traveling until January')"
                value={snoozeNotes}
                onChange={(e) => setSnoozeNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSnoozeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSnoozeFollowUp} disabled={!snoozeDate}>
              Snooze Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecallList;
