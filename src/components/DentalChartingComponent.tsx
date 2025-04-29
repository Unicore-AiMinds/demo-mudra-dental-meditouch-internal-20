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
  findingsTreatmentsList,
  statusOptions
} from '@/types/dental-charting';
import { demoChartingHistory } from '@/data/demo-dental-charting';
import VisualToothChart from './VisualToothChart';
import ToothIndicator from './ToothIndicator';
import SurfaceIndicator from './SurfaceIndicator';

interface DentalChartingComponentProps {
  patientId: string;
}

const DentalChartingComponent: React.FC<DentalChartingComponentProps> = ({ patientId }) => {
  const { toast } = useToast();

  // State for the patient's charting history
  const [patientChartingHistory, setPatientChartingHistory] = useState<ChartingEntry[]>([]);

  // State for the form inputs
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'Existing' | 'Planned' | 'Completed'>('Existing');
  const [currentNotes, setCurrentNotes] = useState<string>('');

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

    if (!selectedFinding) {
      toast({
        title: "Validation Error",
        description: "Please select a finding or treatment.",
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
      findingTreatment: selectedFinding,
      status: selectedStatus,
    };

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

          {/* Finding/Treatment Selection */}
          <div className="space-y-2">
            <Label htmlFor="finding-treatment" className="font-medium">Finding/Treatment *</Label>
            <Select
              value={selectedFinding}
              onValueChange={setSelectedFinding}
            >
              <SelectTrigger id="finding-treatment">
                <SelectValue placeholder="Select a finding or treatment" />
              </SelectTrigger>
              <SelectContent>
                {findingsTreatmentsList.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes here..."
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Add Entry Button */}
          <Button
            onClick={handleAddChartingEntry}
            className="w-full md:w-auto"
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
                    <TableHead>Finding/Treatment</TableHead>
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
                      <TableCell>{entry.findingTreatment}</TableCell>
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
                      <TableCell className="max-w-[200px] truncate">
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
