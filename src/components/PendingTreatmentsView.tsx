import { useState, useMemo, useEffect } from 'react';
import { format, addDays, isBefore } from 'date-fns';
import { Search, Calendar, Clock, AlarmClock, ArrowUpDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChartingEntry } from '@/types/dental-charting';
import { useDentalCharting } from '@/contexts/DentalChartingContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { handleDatabaseError } from '@/utils/error-handler';

// Helper component to render patient name asynchronously
const PatientName: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { getPatientName } = useDentalCharting();
  const { toast } = useToast();
  const [name, setName] = useState<string>('Unknown');

  useEffect(() => {
    const fetchName = async () => {
      try {
        // Handle both camelCase and snake_case field names
        const id = patientId || '';
        if (!id) {
          setName('Unknown');
          return;
        }

        const patientName = await getPatientName(id);
        setName(typeof patientName === 'string' ? patientName : 'Unknown');
      } catch (error) {
        console.error('Error fetching patient name:', error);
        // Use the global error handler but don't show a toast
        handleDatabaseError({
          error,
          toast,
          errorKey: `patient_name_error_${patientId}`,
          showToast: false
        });
        setName('Unknown');
      }
    };

    fetchName();
  }, [patientId, getPatientName, toast]);

  return <>{name}</>;
};

// No props needed for this component
const PendingTreatmentsView: React.FC = () => {
  const { toast } = useToast();
  const { getPlannedChartingEntries, getPatientName, snoozeChartingEntry } = useDentalCharting();
  const { supabase } = useSupabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ChartingEntry | null>(null);
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(undefined);
  const [snoozeNotes, setSnoozeNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'snoozed'>('pending');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default to alphabetical order

  // State to store planned charting entries
  const [allPlannedEntries, setAllPlannedEntries] = useState<ChartingEntry[]>([]);

  // State to track if there was an error loading entries
  const [loadError, setLoadError] = useState<string | null>(null);

  // Function to fetch planned entries
  const fetchPlannedEntries = async () => {
    try {
      console.log('Fetching planned entries...');
      const entries = await getPlannedChartingEntries();
      console.log('Fetched planned entries:', entries);
      setAllPlannedEntries(entries);
      setLoadError(null);
    } catch (error) {
      console.error('Error fetching planned entries:', error);
      setAllPlannedEntries([]);

      // Use the global error handler
      const wasHandled = handleDatabaseError({
        error,
        toast,
        errorKey: 'pending_treatments_fetch_error',
        customMessage: 'Dental charting data will be available after setup is complete.',
        // Don't show toast here since we're displaying the error in the UI
        showToast: false
      });

      // Only set error for non-database errors
      if (!wasHandled) {
        setLoadError('Failed to load dental charting entries. Please try again.');
      } else {
        setLoadError(null);
      }
    }
  };

  // Fetch planned charting entries when component mounts
  useEffect(() => {
    fetchPlannedEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up an interval to refresh the data every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing pending treatments');
      fetchPlannedEntries();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate entries into pending and snoozed
  const pendingEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log('Filtering pending entries from', allPlannedEntries.length, 'total entries');

    const filtered = allPlannedEntries.filter(entry => {
      // Get field values with fallbacks
      const status = entry.status;
      const scheduledAppointmentId = entry.scheduled_appointment_id;
      const snoozedUntil = entry.snoozed_until;

      // Log entries that might be problematic
      if (status === 'Completed') {
        console.log('Filtering out completed entry:', entry);
      }

      if (scheduledAppointmentId) {
        console.log('Filtering out entry with scheduled appointment:', entry);
      }

      // Only show entries that:
      // 1. Are not completed
      // 2. Don't have a scheduled appointment
      // 3. Are not snoozed or the snooze date has passed
      const shouldInclude = status !== 'Completed' &&
        !scheduledAppointmentId &&
        (!snoozedUntil || snoozedUntil < today);

      return shouldInclude;
    });

    console.log('Filtered to', filtered.length, 'pending entries');
    return filtered;
  }, [allPlannedEntries]);

  const snoozedEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return allPlannedEntries.filter(entry => {
      // Get field values with fallbacks
      const status = entry.status;
      const scheduledAppointmentId = entry.scheduled_appointment_id;
      const snoozedUntil = entry.snoozed_until;

      // Only show entries that:
      // 1. Are not completed
      // 2. Don't have a scheduled appointment
      // 3. Are snoozed and the snooze date has not passed
      return status !== 'Completed' &&
        !scheduledAppointmentId &&
        snoozedUntil && snoozedUntil >= today;
    });
  }, [allPlannedEntries]);

  // Toggle sort order
  const toggleSort = () => {
    // Just toggle the order
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    // Select the appropriate entries based on the active tab
    const entriesToFilter = activeTab === 'pending' ? pendingEntries : snoozedEntries;

    // Filter by search term if provided
    if (!searchTerm) {
      return entriesToFilter;
    }

    // Filter by search term
    return entriesToFilter.filter(entry => {
      // Get field values with fallbacks
      const service = entry.service || '';
      const toothNumbers = entry.tooth_numbers || [];
      const notes = entry.notes || '';
      const doctor = entry.doctor || '';

      const teethString = Array.isArray(toothNumbers)
        ? toothNumbers.join(', ')
        : String(toothNumbers || '');

      const searchTermLower = searchTerm.toLowerCase();

      return (
        service.toLowerCase().includes(searchTermLower) ||
        teethString.includes(searchTermLower) ||
        notes.toLowerCase().includes(searchTermLower) ||
        doctor.toLowerCase().includes(searchTermLower)
      );
    });
  }, [activeTab, pendingEntries, snoozedEntries, searchTerm]);

  // Sort entries
  const filteredAndSortedEntries = useMemo(() => {
    // Sort the filtered entries
    return [...filteredEntries].sort((a, b) => {
      // For patient sorting, we'll use the entry_id or id as a fallback
      // since we can't do async sorting with patient names
      const idA = ((a.entry_id || a.id || '') as string).toString();
      const idB = ((b.entry_id || b.id || '') as string).toString();

      return sortOrder === 'asc'
        ? idA.localeCompare(idB)
        : idB.localeCompare(idA);
    });
  }, [filteredEntries, sortOrder]);

  // Handle scheduling an appointment from a pending treatment
  const handleScheduleAppointment = async (entry: ChartingEntry) => {
    try {
      // Handle both camelCase and snake_case field names
      const patientId = entry.patient_id || '';
      const service = entry.service || '';
      const doctor = entry.doctor || '';
      const entryId = entry.entry_id || '';
      const toothNumbers = entry.tooth_numbers || [];
      const notes = entry.notes || '';

      // Get patient name
      let patientName = 'Unknown';
      try {
        const name = await getPatientName(patientId);
        patientName = typeof name === 'string' ? name : 'Unknown';
      } catch (err) {
        console.error('Error getting patient name:', err);
      }

      // Convert tooth numbers to string
      const teethString = Array.isArray(toothNumbers)
        ? toothNumbers.join(', ')
        : String(toothNumbers || '');

      // Log the entry we're scheduling
      console.log('Scheduling appointment for dental charting entry:', {
        entryId,
        patientId,
        patientName,
        service,
        doctor,
        teeth: teethString,
        notes
      });

      // Get the current user
      const { user } = JSON.parse(localStorage.getItem('mudraUser') || '{}');

      if (user?.id) {
        // Store the treatment details in Supabase
        try {
          const { data, error } = await supabase.from('pending_treatments').insert({
            user_id: user.id,
            patient_id: patientId,
            patient_name: patientName,
            service_name: service,
            doctor_name: doctor,
            charting_entry_id: entryId,
            teeth: teethString,
            notes: notes,
            status: 'pending',
            created_at: new Date().toISOString()
          }).select();

          if (error) {
            console.error('Error inserting pending treatment:', error);
          } else {
            console.log('Successfully inserted pending treatment:', data);
          }
        } catch (supabaseError) {
          // Use the global error handler
          handleDatabaseError({
            error: supabaseError,
            toast,
            errorKey: 'pending_treatments_insert_error',
            customMessage: 'Could not save treatment details to database, but will continue with scheduling.',
            showToast: true
          });
        }
      }

      // Always set in sessionStorage as a fallback
      const pendingTreatmentData = {
        patientId: patientId,
        patientName: patientName,
        serviceName: service,
        doctorName: doctor,
        chartingEntryId: entryId,
        teeth: teethString,
        notes: notes
      };

      sessionStorage.setItem('pendingTreatment', JSON.stringify(pendingTreatmentData));
      console.log('Stored pending treatment in sessionStorage:', pendingTreatmentData);

      // Show toast notification
      toast({
        title: "Navigating to Appointments",
        description: `Opening appointments page to schedule treatment for ${patientName}.`,
      });

      // Navigate to the appointments page with daily view
      // Use window.location.href for a full page reload to ensure the URL parameters are processed
      window.location.href = '/appointments?view=daily';
    } catch (error) {
      console.error('Error in handleScheduleAppointment:', error);

      // Show toast notification
      toast({
        title: "Navigating to Appointments",
        description: `Opening appointments page to schedule treatment.`,
      });

      // Navigate to the appointments page with daily view
      window.location.href = '/appointments?view=daily';
    }
  };

  // Handle opening the snooze dialog
  const handleSnoozeEntry = (entry: ChartingEntry) => {
    setSelectedEntry(entry);
    // Set default snooze date to 2 weeks from now
    setSnoozeDate(addDays(new Date(), 14));
    setSnoozeNotes('');
    setIsSnoozeDialogOpen(true);
  };

  // Handle confirming the snooze
  const handleConfirmSnooze = async () => {
    if (!selectedEntry || !snoozeDate) {
      toast({
        title: "Missing Information",
        description: "Please select a date to snooze until.",
        variant: "destructive",
      });
      return;
    }

    const snoozeUntilDate = format(snoozeDate, 'yyyy-MM-dd');
    const entryId = selectedEntry.entry_id || '';

    try {
      // Call the context function to snooze the entry
      await snoozeChartingEntry(entryId, snoozeUntilDate, snoozeNotes);

      // Close dialog and show success message
      setIsSnoozeDialogOpen(false);
      toast({
        title: "Treatment Snoozed",
        description: `The treatment has been snoozed until ${format(snoozeDate, 'dd/MM/yyyy')}.`,
      });
    } catch (error) {
      console.error('Error snoozing treatment:', error);
      toast({
        title: "Error",
        description: "Failed to snooze treatment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle unsnoozing a treatment
  const handleUnsnoozeTreatment = async (entry: ChartingEntry) => {
    const entryId = entry.entry_id || '';
    const patientId = entry.patient_id || '';

    try {
      // Remove the snooze date
      await snoozeChartingEntry(entryId, '', '');

      // Get patient name
      let patientName = 'Unknown';
      try {
        const name = await getPatientName(patientId);
        patientName = typeof name === 'string' ? name : 'Unknown';
      } catch (err) {
        console.error('Error getting patient name:', err);
      }

      // Show toast notification
      toast({
        title: "Treatment Activated",
        description: `The treatment for ${patientName} has been moved back to pending.`,
      });
    } catch (error) {
      console.error('Error unsnoozing treatment:', error);
      toast({
        title: "Error",
        description: "Failed to activate treatment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Planned Treatments</CardTitle>
              <CardDescription>
                Treatments planned in dental charting that need to be scheduled
              </CardDescription>
            </div>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={activeTab === 'pending' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'pending' ? '' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingEntries.length})
              </Button>
              <Button
                variant={activeTab === 'snoozed' ? 'default' : 'ghost'}
                className={`rounded-none ${activeTab === 'snoozed' ? '' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('snoozed')}
              >
                Snoozed ({snoozedEntries.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search bar and refresh button */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients, services, teeth..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: "Refreshing",
                  description: "Refreshing pending treatments list...",
                });
                fetchPlannedEntries();
              }}
              className="whitespace-nowrap"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh List
            </Button>
          </div>

          {/* Display error message if there was an error loading entries */}
          {loadError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-red-500">{loadError}</h3>
              <p className="text-muted-foreground mt-2">
                Please refresh the page or try again later.
              </p>
            </div>
          ) : filteredAndSortedEntries.length > 0 ? (
            /* Table of treatments */
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={toggleSort}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Patient
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Teeth</TableHead>
                    <TableHead>Service</TableHead>
                    {/* Doctor column removed as requested */}
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map((entry) => {
                    // Handle both camelCase and snake_case field names
                    const entryId = entry.entry_id || '';
                    const patientId = entry.patient_id || '';
                    const toothNumbers = entry.tooth_numbers || [];
                    const service = entry.service || '';
                    const notes = entry.notes || '';

                    // Convert tooth numbers to string
                    const teethString = Array.isArray(toothNumbers)
                      ? toothNumbers.join(', ')
                      : String(toothNumbers || '');

                    return (
                      <TableRow key={entryId}>
                        <TableCell>
                          <div className="font-medium">
                            {/* Use a function to render the patient name asynchronously */}
                            <PatientName patientId={patientId} />
                          </div>
                        </TableCell>
                        <TableCell>{teethString}</TableCell>
                        <TableCell>{service}</TableCell>
                        <TableCell>{notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {activeTab === 'pending' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-dental-primary hover:bg-dental-50 hover:text-dental-dark"
                                  onClick={() => handleScheduleAppointment(entry as ChartingEntry)}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Schedule
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSnoozeEntry(entry as ChartingEntry)}
                                >
                                  <AlarmClock className="mr-2 h-4 w-4" />
                                  Snooze
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnsnoozeTreatment(entry as ChartingEntry)}
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
                {activeTab === 'pending' ? 'No pending treatments' : 'No snoozed treatments'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {activeTab === 'pending'
                  ? 'There are no planned treatments that need to be scheduled.'
                  : 'There are no snoozed treatments. When you snooze a treatment, it will appear here.'}
              </p>
              {activeTab === 'pending' && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    To add treatments, go to a patient's record and add dental charting entries with status "Planned".
                  </p>
                  <Button
                    onClick={() => window.location.href = '/patients'}
                    className="bg-dental-primary hover:bg-dental-dark text-white"
                  >
                    Go to Patients
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snooze Dialog */}
      <Dialog open={isSnoozeDialogOpen} onOpenChange={setIsSnoozeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Snooze Treatment</DialogTitle>
            <DialogDescription>
              Temporarily hide this treatment until the patient is available.
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
                    disabled={(date) => isBefore(date, new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="snooze-notes">Special Notes</Label>
              <Textarea
                id="snooze-notes"
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
            <Button onClick={handleConfirmSnooze} disabled={!snoozeDate}>
              Snooze Treatment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingTreatmentsView;
