import { useState, useMemo } from 'react';
import { format, parseISO, addDays, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, AlarmClock, ArrowUpDown } from 'lucide-react';
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// No props needed for this component
const PendingTreatmentsView: React.FC = () => {
  const { toast } = useToast();
  const { getPlannedChartingEntries, getPatientName, snoozeChartingEntry } = useDentalCharting();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ChartingEntry | null>(null);
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(undefined);
  const [snoozeNotes, setSnoozeNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'snoozed'>('pending');
  const [sortBy, setSortBy] = useState<'doctor' | 'patient'>('patient');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default to alphabetical order

  // Get all planned charting entries
  const allPlannedEntries = getPlannedChartingEntries();

  // Separate entries into pending and snoozed
  const pendingEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return allPlannedEntries.filter(entry =>
      // Only show entries that:
      // 1. Are not completed
      // 2. Don't have a scheduled appointment
      // 3. Are not snoozed or the snooze date has passed
      entry.status !== 'Completed' &&
      !entry.scheduledAppointmentId &&
      (!entry.snoozedUntil || entry.snoozedUntil < today)
    );
  }, [allPlannedEntries]);

  const snoozedEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return allPlannedEntries.filter(entry =>
      // Only show entries that:
      // 1. Are not completed
      // 2. Don't have a scheduled appointment
      // 3. Are snoozed and the snooze date has not passed
      entry.status !== 'Completed' &&
      !entry.scheduledAppointmentId &&
      entry.snoozedUntil && entry.snoozedUntil >= today
    );
  }, [allPlannedEntries]);

  // Toggle sort order
  const toggleSort = (field: 'doctor' | 'patient') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    // Select the appropriate entries based on the active tab
    const entriesToFilter = activeTab === 'pending' ? pendingEntries : snoozedEntries;

    // Filter by search term
    const filtered = entriesToFilter.filter(entry => {
      const patientName = getPatientName(entry.patientId) || '';
      return (
        patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.toothNumbers.join(', ').includes(searchTerm) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

    // Sort the filtered entries
    return filtered.sort((a, b) => {
      if (sortBy === 'doctor') {
        const doctorA = a.doctor || 'Not assigned';
        const doctorB = b.doctor || 'Not assigned';
        return sortOrder === 'asc'
          ? doctorA.localeCompare(doctorB)
          : doctorB.localeCompare(doctorA);
      } else { // sortBy === 'patient'
        const patientA = getPatientName(a.patientId) || '';
        const patientB = getPatientName(b.patientId) || '';
        return sortOrder === 'asc'
          ? patientA.localeCompare(patientB)
          : patientB.localeCompare(patientA);
      }
    });
  }, [activeTab, pendingEntries, snoozedEntries, searchTerm, sortBy, sortOrder, getPatientName]);

  // Handle scheduling an appointment from a pending treatment
  const handleScheduleAppointment = (entry: ChartingEntry) => {
    // Store the treatment details in sessionStorage to be retrieved in the appointments page
    sessionStorage.setItem('pendingTreatment', JSON.stringify({
      patientId: entry.patientId,
      patientName: getPatientName(entry.patientId),
      serviceName: entry.service,
      doctorName: entry.doctor,
      chartingEntryId: entry.entryId,
      teeth: entry.toothNumbers.join(', '),
      notes: entry.notes
    }));

    // Show toast notification
    toast({
      title: "Navigating to Appointments",
      description: `Opening appointments page to schedule treatment for ${getPatientName(entry.patientId)}.`,
    });

    // Navigate to the appointments page with daily view
    // Use window.location.href for a full page reload to ensure the URL parameters are processed
    window.location.href = '/appointments?view=daily';
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
  const handleConfirmSnooze = () => {
    if (!selectedEntry || !snoozeDate) {
      toast({
        title: "Missing Information",
        description: "Please select a date to snooze until.",
        variant: "destructive",
      });
      return;
    }

    const snoozeUntilDate = format(snoozeDate, 'yyyy-MM-dd');

    // Call the context function to snooze the entry
    snoozeChartingEntry(selectedEntry.entryId, snoozeUntilDate, snoozeNotes);

    // Close dialog and show success message
    setIsSnoozeDialogOpen(false);
    toast({
      title: "Treatment Snoozed",
      description: `The treatment has been snoozed until ${format(snoozeDate, 'dd/MM/yyyy')}.`,
    });
  };

  // Handle unsnoozing a treatment
  const handleUnsnoozeTreatment = (entry: ChartingEntry) => {
    // Remove the snooze date
    snoozeChartingEntry(entry.entryId, '', '');

    // Show toast notification
    toast({
      title: "Treatment Activated",
      description: `The treatment for ${getPatientName(entry.patientId)} has been moved back to pending.`,
    });
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
          {/* Search bar */}
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
          </div>

          {/* Table of treatments */}
          {filteredAndSortedEntries.length > 0 ? (
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
                    <TableHead>Teeth</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort('doctor')}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Doctor
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map(entry => (
                    <TableRow key={entry.entryId}>
                      <TableCell>
                        <div className="font-medium">{getPatientName(entry.patientId)}</div>
                      </TableCell>
                      <TableCell>{entry.toothNumbers.join(', ')}</TableCell>
                      <TableCell>{entry.service}</TableCell>
                      <TableCell>
                        {entry.doctor || "Not assigned"}
                      </TableCell>
                      <TableCell>{entry.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {activeTab === 'pending' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-dental-primary hover:bg-dental-50 hover:text-dental-dark"
                                onClick={() => handleScheduleAppointment(entry)}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Schedule
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSnoozeEntry(entry)}
                              >
                                <AlarmClock className="mr-2 h-4 w-4" />
                                Snooze
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnsnoozeTreatment(entry)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
