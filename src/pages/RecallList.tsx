import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFollowUps, FollowUp } from '@/contexts/FollowUpContext';
import { useClinic } from '@/contexts/ClinicContext';
import { format, isAfter, isBefore, parseISO, addMonths } from 'date-fns';
import { Calendar, Search, Filter, ArrowUpDown, Clock, AlarmClock, FileText, Info, RefreshCw } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { useAppointments } from '@/contexts/AppointmentContext';
import { useSupabase } from '@/contexts/SupabaseContext';

const RecallList = () => {
  const {
    followUps,
    isLoading,
    fetchFollowUps,
    snoozeFollowUp,
    activateFollowUp,
    getPendingFollowUps,
    getSnoozedFollowUps,
    getWaitingFollowUps,
    scheduleFollowUp,
    createMissingFollowUps
  } = useFollowUps();
  const { activeClinic } = useClinic();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { supabase } = useSupabase();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default to ascending (earliest first)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'overdue'>('all');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'snoozed' | 'waiting'>('pending');

  // State for snooze dialog
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(undefined);
  const [snoozeNotes, setSnoozeNotes] = useState('');

  // State for details dialog
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsFollowUp, setDetailsFollowUp] = useState<FollowUp | null>(null);

  // Refresh data when tab changes
  useEffect(() => {
    console.log('Tab changed, fetching follow-ups...');
    fetchFollowUps();
  }, [activeTab, fetchFollowUps]);

  // Refresh data when component mounts and set up polling
  useEffect(() => {
    console.log('RecallList component mounted, fetching follow-ups...');

    // Initial data load
    const loadData = async () => {
      console.log('Initial data load...');
      await fetchFollowUps();

      // If we don't have any follow-ups, try to create missing ones
      if (followUps.length === 0) {
        console.log('No follow-ups found, trying to create missing ones...');
        await createMissingFollowUps();
        await fetchFollowUps();
      }
    };

    loadData();

    // Set up polling to refresh data every 15 seconds
    const intervalId = setInterval(() => {
      console.log('Polling for follow-ups...');
      fetchFollowUps();
    }, 15000);

    // Listen for custom refresh event
    const handleRefreshEvent = () => {
      console.log('Received refresh-follow-ups event, refreshing data...');
      fetchFollowUps();
    };

    // Add event listener for custom refresh event
    document.addEventListener('refresh-follow-ups', handleRefreshEvent);

    // Clean up interval and event listener on unmount
    return () => {
      console.log('Cleaning up polling interval and event listener');
      clearInterval(intervalId);
      document.removeEventListener('refresh-follow-ups', handleRefreshEvent);
    };
  }, [fetchFollowUps, createMissingFollowUps, followUps.length]);

  // Helper function to deduplicate follow-ups
  const deduplicateFollowUps = (followUps: FollowUp[]): FollowUp[] => {
    // Create a map to track unique follow-ups by patient and appointment
    const uniqueMap = new Map<string, FollowUp>();

    // Sort by created_at (newest first) so we keep the most recent entries
    const sortedFollowUps = [...followUps].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      // If created_at dates are the same, use ID as a tiebreaker for stable sorting
      if (dateA === dateB) {
        return (a.id || '').localeCompare(b.id || '');
      }

      return dateB - dateA; // Newest first
    });

    // Process each follow-up
    for (const followUp of sortedFollowUps) {
      // Create a unique key based on patient_id, based_on_appointment_id, and suggested_service_name
      const key = `${followUp.patient_id}|${followUp.based_on_appointment_id || ''}|${followUp.suggested_service_name}`;

      // Only add if we haven't seen this combination before
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, followUp);
      }
    }

    // Get unique follow-ups
    const uniqueFollowUps = Array.from(uniqueMap.values());

    // Sort the deduplicated follow-ups by tentative_date for stable display order
    return uniqueFollowUps.sort((a, b) => {
      // Primary sort by tentative_date
      const dateA = new Date(a.tentative_date).getTime();
      const dateB = new Date(b.tentative_date).getTime();

      if (dateA !== dateB) {
        return dateA - dateB; // Earliest first
      }

      // Secondary sort by patient name
      if (a.patient_name !== b.patient_name) {
        return a.patient_name.localeCompare(b.patient_name);
      }

      // Tertiary sort by service name
      if (a.suggested_service_name !== b.suggested_service_name) {
        return a.suggested_service_name.localeCompare(b.suggested_service_name);
      }

      // Final sort by ID for absolute stability
      return (a.id || '').localeCompare(b.id || '');
    });
  };

  // State for directly queried waiting follow-ups
  const [directWaitingFollowUps, setDirectWaitingFollowUps] = useState<FollowUp[]>([]);

  // Function to directly query waiting follow-ups
  const fetchWaitingFollowUpsDirectly = async () => {
    try {
      console.log('Directly querying waiting follow-ups...');
      // Use the custom Supabase client implementation with getAll
      const waitingData = await supabase.from<FollowUp>('follow_ups').getAll({
        filters: { status: 'Waiting' },
        order: { column: 'tentative_date', ascending: true }
      });

      console.log(`Directly fetched ${waitingData?.length || 0} waiting follow-ups`);
      if (waitingData && waitingData.length > 0) {
        console.log('Direct waiting follow-ups:', waitingData.map(f => ({
          id: f.id,
          patient: f.patient_name,
          status: f.status,
          sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
          date: f.tentative_date
        })));
        setDirectWaitingFollowUps(waitingData);
      } else {
        console.log('No waiting follow-ups found directly');
        setDirectWaitingFollowUps([]);
      }
    } catch (error) {
      console.error('Exception fetching waiting follow-ups directly:', error);
    }
  };

  // Fetch waiting follow-ups when tab changes
  useEffect(() => {
    if (activeTab === 'waiting') {
      fetchWaitingFollowUpsDirectly();
    }
  }, [activeTab, fetchWaitingFollowUpsDirectly]);

  // Filter and sort follow-ups
  const filteredAndSortedFollowUps = useMemo(() => {
    const today = new Date();
    console.log('Filtering and sorting follow-ups...');

    // Select the appropriate follow-ups based on the active tab
    let followUpsToFilter;
    if (activeTab === 'pending') {
      followUpsToFilter = getPendingFollowUps();
    } else if (activeTab === 'snoozed') {
      followUpsToFilter = getSnoozedFollowUps();
    } else if (activeTab === 'waiting') {
      // Use directly queried waiting follow-ups if available, otherwise fall back to context
      followUpsToFilter = directWaitingFollowUps.length > 0
        ? directWaitingFollowUps
        : getWaitingFollowUps();
    } else {
      followUpsToFilter = getPendingFollowUps(); // Default to pending
    }

    // Deduplicate follow-ups
    followUpsToFilter = deduplicateFollowUps(followUpsToFilter);
    console.log(`Selected ${followUpsToFilter.length} deduplicated follow-ups for filtering based on tab: ${activeTab}`);

    // Filter by search term
    let filtered = followUpsToFilter.filter(followUp => {
      const searchLower = searchTerm.toLowerCase();
      return (
        followUp.patient_name.toLowerCase().includes(searchLower) ||
        followUp.suggested_service_name.toLowerCase().includes(searchLower) ||
        followUp.original_service.toLowerCase().includes(searchLower) ||
        followUp.original_doctor.toLowerCase().includes(searchLower) ||
        (followUp.special_notes && followUp.special_notes.toLowerCase().includes(searchLower))
      );
    });

    // Filter by status (only for pending tab)
    if (activeTab === 'pending' && filterStatus !== 'all') {
      filtered = filtered.filter(followUp => {
        const followUpDate = parseISO(followUp.tentative_date);
        if (filterStatus === 'upcoming') {
          return isAfter(followUpDate, today) || format(followUpDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        } else if (filterStatus === 'overdue') {
          return isBefore(followUpDate, today) && format(followUpDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd');
        }
        return true;
      });
    }

    // Filter by sequence group if selected
    if (selectedSequenceId) {
      filtered = filtered.filter(followUp => followUp.sequence_group_id === selectedSequenceId);
    }

    // Sort the filtered follow-ups with multiple stable sort criteria
    console.log(`Sorting by ${sortBy} in ${sortOrder} order`);

    return filtered.sort((a, b) => {
      // Primary sort by the selected column
      if (sortBy === 'date') {
        const dateA = parseISO(a.tentative_date);
        const dateB = parseISO(b.tentative_date);

        if (dateA.getTime() !== dateB.getTime()) {
          // For date sorting: asc = earliest first, desc = latest first
          return sortOrder === 'asc'
            ? dateA.getTime() - dateB.getTime() // Ascending: earliest dates first
            : dateB.getTime() - dateA.getTime(); // Descending: latest dates first
        }
      } else {
        // Sort by patient name
        const nameCompare = a.patient_name.localeCompare(b.patient_name);
        if (nameCompare !== 0) {
          return sortOrder === 'asc'
            ? nameCompare // A to Z
            : -nameCompare; // Z to A
        }
      }

      // Secondary sort criteria (if primary criteria are equal)

      // If we're sorting by patient, use date as secondary
      if (sortBy === 'patient') {
        const dateA = parseISO(a.tentative_date);
        const dateB = parseISO(b.tentative_date);

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime(); // Always earliest first for secondary
        }
      }

      // If we're sorting by date, use patient name as secondary
      if (sortBy === 'date') {
        const nameCompare = a.patient_name.localeCompare(b.patient_name);
        if (nameCompare !== 0) {
          return nameCompare; // Always A-Z for secondary
        }
      }

      // Tertiary sort by service name
      const serviceCompare = a.suggested_service_name.localeCompare(b.suggested_service_name);
      if (serviceCompare !== 0) {
        return serviceCompare;
      }

      // Final sort by ID for absolute stability
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [
    activeTab,
    getPendingFollowUps,
    getSnoozedFollowUps,
    getWaitingFollowUps,
    directWaitingFollowUps,
    searchTerm,
    filterStatus,
    selectedSequenceId,
    sortBy,
    sortOrder
  ]);

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

  // Handle scheduling an appointment for a follow-up
  const handleScheduleAppointment = (followUp: FollowUp) => {
    // Navigate to appointment creation page with pre-filled data
    navigate(`/appointments/create?patientId=${followUp.patient_id}&patientName=${followUp.patient_name}&service=${followUp.suggested_service_name}&followUpId=${followUp.id}`);
  };

  // Handle viewing details of a follow-up
  const handleViewDetails = (followUp: FollowUp) => {
    setDetailsFollowUp(followUp);
    setIsDetailsDialogOpen(true);
  };

  // Handle opening the snooze dialog
  const handleOpenSnoozeDialog = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setSnoozeDate(addMonths(new Date(), 1)); // Default to 1 month from now
    setSnoozeNotes(followUp.special_notes || '');
    setIsSnoozeDialogOpen(true);
  };

  // Handle snoozing a follow-up
  const handleSnoozeFollowUp = async () => {
    if (!selectedFollowUp || !snoozeDate) return;

    try {
      const formattedDate = format(snoozeDate, 'yyyy-MM-dd');
      await snoozeFollowUp(selectedFollowUp.id, formattedDate, snoozeNotes);

      // Check if this is part of a sequence
      const isPartOfSequence = selectedFollowUp.sequence_group_id &&
                              selectedFollowUp.total_steps_in_sequence > 1 &&
                              selectedFollowUp.follow_up_sequence < selectedFollowUp.total_steps_in_sequence;

      // Show appropriate toast message
      if (isPartOfSequence) {
        toast({
          title: "Follow-up Sequence Updated",
          description: `Follow-up for ${selectedFollowUp.patient_name} has been snoozed until ${format(snoozeDate, 'MMM d, yyyy')}. All subsequent steps in this sequence have been rescheduled accordingly.`,
        });
      } else {
        toast({
          title: "Follow-up Snoozed",
          description: `Follow-up for ${selectedFollowUp.patient_name} has been snoozed until ${format(snoozeDate, 'MMM d, yyyy')}.`,
        });
      }

      setIsSnoozeDialogOpen(false);
      fetchFollowUps();
    } catch (error) {
      console.error('Error snoozing follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to snooze follow-up. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle unsnoozing a follow-up
  const handleUnsnoozeFollowUp = async (followUp: FollowUp) => {
    try {
      await activateFollowUp(followUp.id);

      // Check if this is part of a sequence
      const isPartOfSequence = followUp.sequence_group_id &&
                              followUp.total_steps_in_sequence > 1 &&
                              followUp.follow_up_sequence < followUp.total_steps_in_sequence;

      // Show appropriate toast message
      if (isPartOfSequence) {
        toast({
          title: "Follow-up Activated",
          description: `Follow-up for ${followUp.patient_name} has been moved back to the pending list. Note that subsequent steps in the sequence may still need to be adjusted.`,
        });
      } else {
        toast({
          title: "Follow-up Activated",
          description: `Follow-up for ${followUp.patient_name} has been moved back to the pending list.`,
        });
      }

      fetchFollowUps();
    } catch (error) {
      console.error('Error activating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate follow-up. Please try again.',
        variant: 'destructive'
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              toast({
                title: "Refreshing Follow-ups",
                description: "Loading follow-ups from database...",
              });

              // Refresh all follow-ups
              await fetchFollowUps();

              // Also directly fetch waiting follow-ups
              await fetchWaitingFollowUpsDirectly();

              // Debug: Log follow-ups by status
              const statusCounts = {};
              followUps.forEach(f => {
                statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
              });
              console.log('Follow-ups by status:', statusCounts);

              // Check for any with Waiting status
              const waitingFollowUps = followUps.filter(f => f.status === 'Waiting');
              console.log(`Found ${waitingFollowUps.length} follow-ups with Waiting status in context:`,
                waitingFollowUps.map(f => ({
                  id: f.id,
                  patient: f.patient_name,
                  sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
                  date: f.tentative_date
                }))
              );

              console.log(`Found ${directWaitingFollowUps.length} waiting follow-ups directly from database`);

              toast({
                title: "Follow-ups Refreshed",
                description: `Found ${followUps.length} follow-ups (${directWaitingFollowUps.length} waiting).`,
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Follow-ups
          </Button>


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
                Pending ({getPendingFollowUps().length})
              </Button>
              <Button
                variant={activeTab === 'waiting' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'waiting' ? '' : 'hover:bg-gray-100'}`}
                onClick={async () => {
                  console.log('Switching to waiting tab');

                  // Directly fetch waiting follow-ups
                  await fetchWaitingFollowUpsDirectly();

                  // Debug: Log all follow-ups to see what we have
                  console.log('All follow-ups:', followUps.map(f => ({
                    id: f.id,
                    patient: f.patient_name,
                    status: f.status,
                    sequence: `${f.follow_up_sequence}/${f.total_steps_in_sequence}`,
                    date: f.tentative_date
                  })));

                  // Debug: Log waiting follow-ups specifically
                  const waitingFollowUps = followUps.filter(f => f.status === 'Waiting');
                  console.log('Waiting follow-ups count in context:', waitingFollowUps.length);

                  // Debug: Check direct waiting follow-ups
                  console.log('Direct waiting follow-ups count:', directWaitingFollowUps.length);

                  setActiveTab('waiting');
                }}
              >
                Waiting ({directWaitingFollowUps.length || getWaitingFollowUps().length})
              </Button>
              <Button
                variant={activeTab === 'snoozed' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'snoozed' ? '' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('snoozed')}
              >
                Snoozed ({getSnoozedFollowUps().length})
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
                        Patient {sortBy === 'patient' && (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort('date')}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Tentative Date {sortBy === 'date' && (sortOrder === 'asc' ? '(Earliest First)' : '(Latest First)')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Suggested Service</TableHead>
                    <TableHead>Original Service</TableHead>
                    <TableHead>Original Doctor</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedFollowUps.map((followUp) => {
                    const followUpDate = parseISO(followUp.tentative_date);
                    // Only show as overdue if it's in the pending tab and the date is in the past
                    const isOverdue = activeTab === 'pending' && isBefore(followUpDate, new Date());

                    // Create a stable compound key for the row
                    const stableKey = `${followUp.id}-${followUp.patient_id}-${followUp.tentative_date}`;

                    return (
                      <TableRow key={stableKey}>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{followUp.patient_name}</span>
                            {followUp.sequence_group_id && followUp.total_steps_in_sequence > 1 && (
                              <Badge
                                variant={followUp.status === 'Waiting' ? 'secondary' : 'outline'}
                                className={`ml-2 ${
                                  followUp.status === 'Waiting'
                                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                Step {followUp.follow_up_sequence}/{followUp.total_steps_in_sequence}
                                {followUp.status === 'Waiting' && ' (Waiting)'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {format(followUpDate, 'MMM d, yyyy')}
                            </span>
                            {isOverdue && (
                              <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                                Overdue
                              </Badge>
                            )}
                            {activeTab === 'snoozed' && followUp.snoozed_until && (
                              <div className="ml-2 text-xs text-muted-foreground">
                                Snoozed until {format(parseISO(followUp.snoozed_until), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{followUp.suggested_service_name}</TableCell>
                        <TableCell>{followUp.original_service}</TableCell>
                        <TableCell>{followUp.original_doctor}</TableCell>
                        <TableCell>
                          {followUp.special_notes ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Notes</h4>
                                  <p className="text-sm">{followUp.special_notes}</p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(followUp)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
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
                            ) : activeTab === 'waiting' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Activate the waiting follow-up
                                  activateFollowUp(followUp.id).then(() => {
                                    toast({
                                      title: "Follow-up Activated",
                                      description: `Step ${followUp.follow_up_sequence} for ${followUp.patient_name} has been activated and moved to the pending list.`,
                                    });
                                    fetchFollowUps();
                                  });
                                }}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Activate Early
                              </Button>
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
                {activeTab === 'pending'
                  ? 'No pending follow-ups'
                  : activeTab === 'waiting'
                    ? 'No waiting follow-ups'
                    : 'No snoozed follow-ups'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {activeTab === 'pending'
                  ? 'There are no pending follow-ups that match your filters.'
                  : activeTab === 'waiting'
                    ? 'There are no waiting follow-ups. Waiting follow-ups are future steps in a sequence that will become active when previous steps are completed.'
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
              {selectedFollowUp && selectedFollowUp.sequence_group_id && selectedFollowUp.total_steps_in_sequence > 1 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                  <strong>Note:</strong> This follow-up is step {selectedFollowUp.follow_up_sequence} of {selectedFollowUp.total_steps_in_sequence} in a sequence.
                  {selectedFollowUp.follow_up_sequence < selectedFollowUp.total_steps_in_sequence && (
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

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Follow-up Details</DialogTitle>
          </DialogHeader>
          {detailsFollowUp && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Patient</h4>
                  <p>{detailsFollowUp.patient_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                  <p>{format(parseISO(detailsFollowUp.tentative_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Suggested Service</h4>
                  <p>{detailsFollowUp.suggested_service_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Original Service</h4>
                  <p>{detailsFollowUp.original_service}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Original Doctor</h4>
                  <p>{detailsFollowUp.original_doctor}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p>{detailsFollowUp.status}</p>
                </div>
                {detailsFollowUp.follow_up_type && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                    <p>{detailsFollowUp.follow_up_type}</p>
                  </div>
                )}
                {detailsFollowUp.sequence_group_id && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Sequence</h4>
                    <p>Step {detailsFollowUp.follow_up_sequence} of {detailsFollowUp.total_steps_in_sequence}</p>
                  </div>
                )}
                {detailsFollowUp.snoozed_until && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Snoozed Until</h4>
                    <p>{format(parseISO(detailsFollowUp.snoozed_until), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>
              {detailsFollowUp.special_notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="text-sm mt-1">{detailsFollowUp.special_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecallList;
