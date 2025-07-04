import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  ChartingEntry,
  permanentTeethList,
  primaryTeethList,
  surfacesList,
  servicesList, // Fallback services list
  statusOptions
} from '@/types/dental-charting';
import { useDentalCharting } from '@/contexts/DentalChartingContext';
import { useServices } from '@/contexts/ServiceContext'; // Import the ServiceContext
import { usePermissions } from '@/contexts/PermissionContext';
import VisualToothChart from './VisualToothChart';
import ToothIndicator from './ToothIndicator';
import SurfaceIndicator from './SurfaceIndicator';
import { generateFollowUpsFromChartingEntry } from '@/services/integration-service';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';

interface DentalChartingComponentProps {
  patientId: string;
  patientAge?: number; // Optional age parameter
}

const DentalChartingComponent: React.FC<DentalChartingComponentProps> = ({ patientId, patientAge }) => {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const { addTentativeFollowUps, getPatientName } = useDentalHistory();
  const { getDentalServiceNames, dentalServices, isLoading: isServicesLoading } = useServices(); // Get dental services from context

  const {
    getPatientChartingHistory,
    addChartingEntry: addChartingEntryToContext,
    updateChartingEntryStatus
  } = useDentalCharting();

  // State for the patient's charting history
  const [patientChartingHistory, setPatientChartingHistory] = useState<ChartingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if we should show primary teeth by default based on patient age
  const isChildPatient = patientAge !== undefined && patientAge >= 0 && patientAge <= 12;

  // State for the form inputs
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'Existing' | 'Planned' | 'Completed'>('Existing');
  const [currentNotes, setCurrentNotes] = useState<string>('');
  const [showPrimaryTeeth, setShowPrimaryTeeth] = useState<boolean>(isChildPatient);
  const [currentTeethList, setCurrentTeethList] = useState<string[]>(isChildPatient ? primaryTeethList : permanentTeethList);

  // Get patient name for follow-ups
  const patientName = getPatientName(patientId) || "Unknown Patient";

  // Handle toggling the status of a charting entry
  const handleStatusToggle = async (entry: ChartingEntry) => {
    try {
      // Only allow toggling for Planned entries
      if (entry.status !== 'Planned') return;

      // Show loading toast
      toast({
        title: "Updating Status",
        description: "Changing status from Planned to Completed...",
      });

      // Update the status in the database
      await updateChartingEntryStatus(entry.entry_id, 'Completed');

      // Update the local state
      setPatientChartingHistory(prev =>
        prev.map(e =>
          e.entry_id === entry.entry_id
            ? { ...e, status: 'Completed' }
            : e
        )
      );

      // Show success toast
      toast({
        title: "Status Updated",
        description: "Treatment has been marked as completed.",
      });
    } catch (error) {
      console.error('Error updating charting entry status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load the patient's charting history when the component mounts or patientId changes
  useEffect(() => {
    const fetchChartingHistory = async () => {
      try {
        setIsLoading(true);
        const history = await getPatientChartingHistory(patientId);
        setPatientChartingHistory(history);
      } catch (error) {
        console.error('Error fetching patient charting history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dental charting history. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartingHistory();
  }, [patientId, getPatientChartingHistory, toast]);

  // Listen for teeth type change events from the VisualToothChart component
  useEffect(() => {
    const handleTeethTypeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ showPrimaryTeeth: boolean }>;
      toggleTeethType(customEvent.detail.showPrimaryTeeth);
    };

    // Add event listener
    document.addEventListener('teethTypeChanged', handleTeethTypeChange);

    // Clean up
    return () => {
      document.removeEventListener('teethTypeChanged', handleTeethTypeChange);
    };
  }, []);

  // Handle tooth selection
  const handleToothSelection = (toothNumber: string) => {
    setSelectedTeeth(prev =>
      prev.includes(toothNumber)
        ? prev.filter(t => t !== toothNumber)
        : [...prev, toothNumber]
    );
  };

  // Toggle between primary and permanent teeth
  const toggleTeethType = (showPrimary: boolean) => {
    setShowPrimaryTeeth(showPrimary);
    setCurrentTeethList(showPrimary ? primaryTeethList : permanentTeethList);

    // Clear selected teeth when switching between primary and permanent
    // This prevents confusion when teeth numbers overlap
    setSelectedTeeth([]);
  };

  // Handle surface selection
  const handleSurfaceSelection = (surface: string) => {
    setSelectedSurfaces(prev =>
      prev.includes(surface)
        ? prev.filter(s => s !== surface)
        : [...prev, surface]
    );
  };

  // Handle adding a new charting entry
  const handleAddChartingEntry = async () => {
    // Validate required fields
    if (selectedTeeth.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one tooth.",
        variant: "destructive",
      });
      return;
    }

    // Validate based on status
    if (selectedStatus === 'Existing' && !selectedFinding) {
      toast({
        title: "Validation Error",
        description: "Please select a finding for the existing condition.",
        variant: "destructive",
      });
      return;
    }

    if ((selectedStatus === 'Planned' || selectedStatus === 'Completed') && !selectedService) {
      toast({
        title: "Validation Error",
        description: `Please select a service for the ${selectedStatus.toLowerCase()} treatment.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a new charting entry with Supabase field names
      const newEntry: Omit<ChartingEntry, 'id' | 'entry_id' | 'created_at' | 'updated_at'> = {
        patient_id: patientId,
        date_recorded: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        tooth_numbers: [...selectedTeeth].sort((a, b) => parseInt(a) - parseInt(b)),
        status: selectedStatus,
        follow_up_ids: [], // Initialize empty array for follow-up references
      };

      // Add finding or service based on status
      if (selectedStatus === 'Existing') {
        newEntry.finding = selectedFinding;
      } else {
        newEntry.service = selectedService;
      }

      // Add surfaces if selected
      if (selectedSurfaces.length > 0) {
        newEntry.surfaces = [...selectedSurfaces];
      }

      // Add notes if provided
      if (currentNotes.trim()) {
        newEntry.notes = currentNotes.trim();
      }

      // Add the entry to Supabase via context
      const savedEntry = await addChartingEntryToContext(newEntry);

      // Generate follow-ups if this is a planned treatment
      if (selectedStatus === 'Planned' && newEntry.service) {
        try {
          // Get the patient name as a string
          const patientNameStr = typeof patientName === 'string'
            ? patientName
            : await patientName;

          // Generate follow-ups using the integration service
          const followUps = generateFollowUpsFromChartingEntry(savedEntry, patientNameStr);

          if (followUps.length > 0) {
            // Add the follow-ups to the dental history context
            await addTentativeFollowUps(followUps);

            // Show a message about the follow-ups
            toast({
              title: "Follow-ups Generated",
              description: `${followUps.length} follow-up(s) have been added to the recall list.`,
            });
          }
        } catch (error) {
          console.error('Error generating follow-ups:', error);
          toast({
            title: "Warning",
            description: "Entry saved but failed to generate follow-ups.",
            variant: "destructive",
          });
        }
      }

      // Refresh the patient's charting history
      const updatedHistory = await getPatientChartingHistory(patientId);
      setPatientChartingHistory(updatedHistory);

      // Reset the form
      resetForm();

      // Show success message
      toast({
        title: "Success",
        description: "Charting entry added successfully.",
      });
    } catch (error) {
      console.error('Error adding charting entry:', error);
      toast({
        title: "Error",
        description: "Failed to add charting entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset the form inputs
  const resetForm = () => {
    setSelectedTeeth([]);
    setSelectedSurfaces([]);
    setSelectedFinding('');
    setSelectedService('');
    setSelectedStatus('Existing');
    setCurrentNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dental Charting</CardTitle>
        <CardDescription>Record and view dental findings and treatments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Area */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Add New Charting Entry</h3>

          {/* Tooth Selection */}
          <div className="space-y-2">
            <Label className="font-medium">Tooth Selection *</Label>

            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual">Visual Chart</TabsTrigger>
                <TabsTrigger value="grid">Checkbox Grid</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="mt-4">
                <VisualToothChart
                  selectedTeeth={selectedTeeth}
                  onToothSelect={handleToothSelection}
                  showPrimaryTeeth={showPrimaryTeeth}
                />
              </TabsContent>

              <TabsContent value="grid" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={!showPrimaryTeeth ? "default" : "outline"}
                      onClick={() => toggleTeethType(false)}
                      className="text-sm"
                    >
                      Full Mouth (Permanent Teeth)
                    </Button>
                    <Button
                      variant={showPrimaryTeeth ? "default" : "outline"}
                      onClick={() => toggleTeethType(true)}
                      className="text-sm"
                    >
                      Show Child Teeth (Primary)
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="teeth-toggle-grid"
                      checked={showPrimaryTeeth}
                      onCheckedChange={toggleTeethType}
                    />
                    <Label htmlFor="teeth-toggle-grid" className="text-sm">
                      {showPrimaryTeeth ? "Primary Teeth" : "Permanent Teeth"}
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-8 gap-2">
                  {currentTeethList.map(tooth => (
                    <div key={tooth} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tooth-${tooth}`}
                        checked={selectedTeeth.includes(tooth)}
                        onCheckedChange={() => handleToothSelection(tooth)}
                      />
                      <Label
                        htmlFor={`tooth-${tooth}`}
                        className="text-sm cursor-pointer"
                      >
                        {tooth}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Surface Selection */}
          <div className="space-y-2">
            <Label className="font-medium">Surface Selection (Optional)</Label>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Visual Surface Selector */}
              <div className="flex flex-col items-center gap-2">
                <SurfaceIndicator
                  surfaces={selectedSurfaces}
                  size="lg"
                  interactive={true}
                  onSurfaceClick={handleSurfaceSelection}
                />
                <span className="text-xs text-muted-foreground">
                  Visual representation of selected surfaces
                </span>
              </div>

              {/* Checkbox Surface Selector */}
              <div className="flex flex-wrap gap-4">
                {surfacesList.map(surface => (
                  <div key={surface} className="flex items-center space-x-2">
                    <Checkbox
                      id={`surface-${surface}`}
                      checked={selectedSurfaces.includes(surface)}
                      onCheckedChange={() => handleSurfaceSelection(surface)}
                    />
                    <Label
                      htmlFor={`surface-${surface}`}
                      className="text-sm cursor-pointer"
                    >
                      {surface === 'B/F' ? 'Buccal/Facial' :
                       surface === 'M' ? 'Mesial' :
                       surface === 'O' ? 'Occlusal' :
                       surface === 'D' ? 'Distal' :
                       surface === 'L' ? 'Lingual' : surface}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="font-medium">Status *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: 'Existing' | 'Planned' | 'Completed') => setSelectedStatus(value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Finding Input - Only shown for Existing status */}
          {selectedStatus === 'Existing' && (
            <div className="space-y-2">
              <Label htmlFor="finding" className="font-medium">Finding/Condition *</Label>
              <input
                id="finding"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter the finding or condition (e.g., Caries, Fractured Tooth, etc.)"
                value={selectedFinding}
                onChange={(e) => setSelectedFinding(e.target.value)}
              />
            </div>
          )}

          {/* Service Selection - Only shown for Planned or Completed status */}
          {(selectedStatus === 'Planned' || selectedStatus === 'Completed') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="service" className="font-medium">Service *</Label>
                {isServicesLoading && (
                  <span className="text-xs text-muted-foreground">Loading services...</span>
                )}
                {!isServicesLoading && dentalServices.length === 0 && (
                  <span className="text-xs text-amber-600">
                    No services found. Add services in Settings → Services tab.
                  </span>
                )}
              </div>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
                disabled={isServicesLoading}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder={isServicesLoading ? "Loading services..." : "Select a service"} />
                </SelectTrigger>
                <SelectContent>
                  {/* Use services from context if available, otherwise use fallback */}
                  {getDentalServiceNames().length > 0 ? (
                    getDentalServiceNames().map(item => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))
                  ) : !isServicesLoading ? (
                    <div className="px-2 py-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No services found. Please add services in the Settings → Services tab.
                      </p>
                    </div>
                  ) : (
                    <div className="px-2 py-4 text-center">
                      <p className="text-sm text-muted-foreground">Loading services...</p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedStatus === 'Planned' && dentalServices.length === 0 && !isServicesLoading && (
                <p className="text-xs text-amber-600 mt-1">
                  To add planned treatments, first add services in Settings → Services tab.
                </p>
              )}
            </div>
          )}



          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder={selectedStatus === 'Existing'
                ? "Add notes about the existing condition (e.g., 'Present since 2 years', 'Sensitive to cold')"
                : selectedStatus === 'Planned'
                  ? "Add notes about the treatment plan or patient availability (e.g., 'Part of mouth rehabilitation - Step 1', 'Patient not available until January')"
                  : "Add notes about the treatment (e.g., 'Part of mouth rehabilitation - Step 1', 'Follow-up needed in 2 weeks')"
              }
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              className="min-h-[80px]"
            />
            {selectedStatus === 'Planned' && (
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> If the patient has scheduling constraints, please add them here.
                These notes will be visible to staff in the recall list when scheduling follow-ups.
              </p>
            )}
          </div>

          {/* Add Entry Button */}
          {hasPermission('patients.edit_dental_chart') && (
            <Button
              onClick={handleAddChartingEntry}
              className="w-full md:w-auto"
              disabled={
                selectedTeeth.length === 0 ||
                (selectedStatus === 'Existing' && !selectedFinding) ||
                ((selectedStatus === 'Planned' || selectedStatus === 'Completed') && !selectedService)
              }
            >
              Add Charting Entry
            </Button>
          )}
        </div>

        {/* Display Area - History Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Charting History</h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-dental-primary border-t-transparent"></div>
            </div>
          ) : patientChartingHistory.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Recorded</TableHead>
                    <TableHead>Teeth</TableHead>
                    <TableHead>Tooth #</TableHead>
                    <TableHead>Surface(s)</TableHead>
                    <TableHead>Finding/Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientChartingHistory.map(entry => (
                    <TableRow key={entry.entry_id}>
                      <TableCell>
                        {new Date(entry.date_recorded).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <ToothIndicator toothNumbers={entry.tooth_numbers} />
                      </TableCell>
                      <TableCell>
                        {entry.tooth_numbers.join(', ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {entry.surfaces ? (
                            <>
                              <SurfaceIndicator surfaces={entry.surfaces} />
                              <span className="text-xs text-muted-foreground">
                                {entry.surfaces.join(', ')}
                              </span>
                            </>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.status === 'Existing'
                          ? <span className="text-amber-600">{entry.finding}</span>
                          : <span className="text-blue-600">{entry.service}</span>
                        }
                      </TableCell>
                      <TableCell>
                        {entry.status === 'Planned' ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Planned</Badge>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`status-toggle-${entry.entry_id}`}
                                checked={false}
                                onCheckedChange={() => handleStatusToggle(entry)}
                              />
                              <span className="text-xs text-muted-foreground">Mark Completed</span>
                            </div>
                          </div>
                        ) : (
                          <Badge
                            variant={
                              entry.status === 'Completed' ? 'default' : 'secondary'
                            }
                          >
                            {entry.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] group relative">
                        <div className={`truncate cursor-help ${entry.notes && entry.notes.length > 30 ? 'flex items-center' : ''}`}>
                          {entry.notes || 'N/A'}
                          {entry.notes && entry.notes.length > 30 && (
                            <span className="ml-1 text-xs text-blue-500 inline-flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                              </svg>
                            </span>
                          )}
                        </div>
                        {entry.notes && entry.notes.length > 0 && (
                          <div className="absolute z-50 invisible group-hover:visible bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-md whitespace-normal break-words left-0 right-0 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 mt-1 text-sm">
                            {entry.notes}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md">
              <p className="text-muted-foreground">No charting entries recorded for this patient.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DentalChartingComponent;
