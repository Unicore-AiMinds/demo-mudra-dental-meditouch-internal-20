import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  toothNumbersList,
  surfacesList,
  servicesList,
  statusOptions
} from '@/types/dental-charting';
import { demoChartingHistory } from '@/data/demo-dental-charting';
import VisualToothChart from './VisualToothChart';
import ToothIndicator from './ToothIndicator';
import SurfaceIndicator from './SurfaceIndicator';
import { generateFollowUpsFromChartingEntry } from '@/services/integration-service';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';

interface DentalChartingComponentProps {
  patientId: string;
}

const DentalChartingComponent: React.FC<DentalChartingComponentProps> = ({ patientId }) => {
  const { toast } = useToast();
  const { addTentativeFollowUps, getPatientName } = useDentalHistory();

  // State for the patient's charting history
  const [patientChartingHistory, setPatientChartingHistory] = useState<ChartingEntry[]>([]);

  // State for the form inputs
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'Existing' | 'Planned' | 'Completed'>('Existing');
  const [currentNotes, setCurrentNotes] = useState<string>('');

  // Get patient name for follow-ups
  const patientName = getPatientName(patientId) || "Unknown Patient";

  // Load the patient's charting history when the component mounts or patientId changes
  useEffect(() => {
    const filteredHistory = demoChartingHistory.filter(entry => entry.patientId === patientId);
    // Sort by date, newest first
    filteredHistory.sort((a, b) =>
      new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime()
    );
    setPatientChartingHistory(filteredHistory);
  }, [patientId]);

  // Handle tooth selection
  const handleToothSelection = (toothNumber: string) => {
    setSelectedTeeth(prev =>
      prev.includes(toothNumber)
        ? prev.filter(t => t !== toothNumber)
        : [...prev, toothNumber]
    );
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
  const handleAddChartingEntry = () => {
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

    // Create a new charting entry
    const newEntry: ChartingEntry = {
      entryId: `CE${uuidv4().substring(0, 8)}`,
      patientId,
      dateRecorded: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      toothNumbers: [...selectedTeeth].sort((a, b) => parseInt(a) - parseInt(b)),
      status: selectedStatus,
      followUpIds: [], // Initialize empty array for follow-up references
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

    // Add the new entry to the history
    setPatientChartingHistory(prev => [newEntry, ...prev]);

    // Generate follow-ups if this is a planned treatment
    if (selectedStatus === 'Planned' && newEntry.service) {
      // Generate follow-ups using the integration service
      const followUps = generateFollowUpsFromChartingEntry(newEntry, patientName);

      if (followUps.length > 0) {
        // Store the follow-up IDs in the charting entry
        newEntry.followUpIds = followUps.map(fu => fu.followUpId);

        // Add the follow-ups to the dental history context
        addTentativeFollowUps(followUps);

        // Show a message about the follow-ups
        toast({
          title: "Follow-ups Generated",
          description: `${followUps.length} follow-up(s) have been added to the recall list.`,
        });
      }
    }

    // Reset the form
    resetForm();

    // Show success message
    toast({
      title: "Success",
      description: "Charting entry added successfully.",
    });
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
                />
              </TabsContent>

              <TabsContent value="grid" className="mt-4">
                <div className="grid grid-cols-8 gap-2">
                  {toothNumbersList.map(tooth => (
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
              <Label htmlFor="service" className="font-medium">Service *</Label>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {servicesList.map(item => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </div>

        {/* Display Area - History Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Charting History</h3>

          {patientChartingHistory.length > 0 ? (
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
                    <TableRow key={entry.entryId}>
                      <TableCell>
                        {new Date(entry.dateRecorded).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <ToothIndicator toothNumbers={entry.toothNumbers} />
                      </TableCell>
                      <TableCell>
                        {entry.toothNumbers.join(', ')}
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
                        <Badge
                          variant={
                            entry.status === 'Completed' ? 'default' :
                            entry.status === 'Planned' ? 'outline' :
                            'secondary'
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {entry.notes || 'N/A'}
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
