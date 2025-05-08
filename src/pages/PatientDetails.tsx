import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
import { DentalHistoryEntry } from '@/types/dental-history';
import { usePatients, Patient } from '@/contexts/PatientContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Edit } from 'lucide-react';
import DentalChartingComponent from '@/components/DentalChartingComponent';
import PatientUpcomingAppointments from '@/components/PatientUpcomingAppointments';
import VitalSignsComponent from '@/components/VitalSignsComponent';
import PrescriptionComponent from '@/components/PrescriptionComponent';

// Import Patient type from PatientContext but create a local interface for UI compatibility
// This helps us bridge between the Supabase field names and the UI component's expected field names
interface LocalPatient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  dateOfBirth?: string;
  email: string | null;
  phone: string;
  altPhone?: string | null;
  address?: string;
  city?: string;
  pincode?: string;
  bloodGroup?: string;
  referredBy?: string;
  clinic: 'dental' | 'meditouch' | 'both';
  lastVisit: string | '';
}

// Helper function to get clinic badge
const getClinicBadge = (clinic: Patient['clinic'], activeClinic: 'dental' | 'meditouch') => {
  if (clinic === 'both') {
    return (
      <Badge variant="outline" className="border-purple-400 text-purple-600">
        Both Clinics
      </Badge>
    );
  }

  if (clinic === 'dental') {
    return (
      <Badge variant="outline" className={activeClinic === 'dental' ? 'border-dental-primary text-dental-primary' : ''}>
        Dental Metrix
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={activeClinic === 'meditouch' ? 'border-meditouch-primary text-meditouch-primary' : ''}>
      Meditouch
    </Badge>
  );
};

// Helper function to check if a tab is valid for a patient based on their clinic
const isValidTab = (tab: string, clinic: string): boolean => {
  const allTabs = ['overview', 'appointments', 'vital-signs', 'prescriptions'];
  const dentalTabs = ['dental-history', 'dental-charting'];

  if (allTabs.includes(tab)) {
    return true;
  }

  if (dentalTabs.includes(tab) && (clinic === 'dental' || clinic === 'both')) {
    return true;
  }

  return false;
};

const PatientDetails = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeClinic } = useClinic();
  const [patient, setPatient] = useState<LocalPatient | null>(null);

  // Get the tab parameter from the URL query string
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');

  // State to track the active tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  const { getPatientById, isLoading } = usePatients();
  const { toast } = useToast();

  // Find the patient data when the component mounts
  useEffect(() => {
    const fetchPatient = async () => {
      if (patientId) {
        try {
          const foundPatient = await getPatientById(patientId);
          if (foundPatient) {
            // Convert Supabase field names to component's expected format
            const formattedPatient: LocalPatient = {
              id: foundPatient.id,
              name: foundPatient.name,
              gender: foundPatient.gender,
              age: foundPatient.age,
              dateOfBirth: foundPatient.date_of_birth,
              email: foundPatient.email,
              phone: foundPatient.phone,
              altPhone: foundPatient.alt_phone,
              address: foundPatient.address,
              city: foundPatient.city,
              pincode: foundPatient.pincode,
              bloodGroup: foundPatient.blood_group,
              referredBy: foundPatient.referred_by,
              clinic: foundPatient.clinic,
              lastVisit: foundPatient.last_visit || ''
            };
            setPatient(formattedPatient);
          } else {
            // If patient not found, navigate back to patients list
            toast({
              title: "Patient Not Found",
              description: `Patient with ID ${patientId} could not be found.`,
              variant: "destructive"
            });
            navigate('/patients');
          }
        } catch (error) {
          console.error(`Error fetching patient with ID ${patientId}:`, error);
          toast({
            title: "Error",
            description: "Failed to load patient details. Please try again.",
            variant: "destructive"
          });
          navigate('/patients');
        }
      }
    };

    fetchPatient();
  }, [patientId, navigate, getPatientById, toast]);

  // Set the active tab based on the URL parameter when the component mounts or URL changes
  useEffect(() => {
    if (patient && tabFromUrl && isValidTab(tabFromUrl, patient.clinic)) {
      setActiveTab(tabFromUrl);
    }
  }, [patient, tabFromUrl]);

  // Handle edit patient click
  const handleEditPatient = () => {
    // For now, just navigate back to patients list
    // In a real implementation, this would open the edit form
    navigate('/patients');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-primary mb-4"></div>
        <p className="text-lg text-muted-foreground">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/patients')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">{patient.name}</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Patient ID: {patient.id}
              </p>
              {getClinicBadge(patient.clinic, activeClinic)}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleEditPatient}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Patient
        </Button>
      </div>

      {/* Tabbed Interface for Patient Information */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap">
          <TabsTrigger value="overview">Patient Info</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          {(patient.clinic === 'dental' || patient.clinic === 'both') && (
            <TabsTrigger value="dental-charting">Dental Charting</TabsTrigger>
          )}
          {(patient.clinic === 'dental' || patient.clinic === 'both') && (
            <TabsTrigger value="dental-history">Dental History</TabsTrigger>
          )}
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="vital-signs">Vital Signs</TabsTrigger>
        </TabsList>

        {/* Patient Info Tab - Personal Information */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Full Name</h3>
                  <p className="text-base">{patient.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Gender</h3>
                  <p className="text-base capitalize">{patient.gender}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Age</h3>
                  <p className="text-base">{patient.age} years</p>
                </div>
                {patient.dateOfBirth && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Date of Birth</h3>
                    <p className="text-base">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                  <p className="text-base">{patient.email || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Phone</h3>
                  <p className="text-base">+91 {patient.phone}</p>
                </div>
                {patient.altPhone && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Alternative Phone</h3>
                    <p className="text-base">+91 {patient.altPhone}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Address</h3>
                  <p className="text-base">{patient.address}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">City</h3>
                  <p className="text-base">{patient.city || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Pincode</h3>
                  <p className="text-base">{patient.pincode || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Blood Group</h3>
                  <p className="text-base">{patient.bloodGroup || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Referred By</h3>
                  <p className="text-base">{patient.referredBy || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Last Visit</h3>
                  <p className="text-base">
                    {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'No previous visits'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab - Dental Only */}
        <TabsContent value="appointments" className="mt-6">
          <PatientUpcomingAppointments
            patientId={patient.id}
            patientName={patient.name}
            clinic={patient.clinic}
            title="Upcoming Dental Appointments"
            dentalOnly={true}
          />
        </TabsContent>

        {/* Dental Charting Tab */}
        {(patient.clinic === 'dental' || patient.clinic === 'both') && (
          <TabsContent value="dental-charting" className="mt-6">
            <DentalChartingComponent patientId={patient.id} patientAge={patient.age} />
          </TabsContent>
        )}

        {/* Dental History Tab */}
        {(patient.clinic === 'dental' || patient.clinic === 'both') && (
          <TabsContent value="dental-history" className="mt-6">
            <PatientDentalHistoryWrapper patientId={patient.id} />
          </TabsContent>
        )}

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="mt-6">
          <PrescriptionComponent
            patientId={patient.id}
            patientName={patient.name}
            patientAge={patient.age}
            patientDOB={patient.dateOfBirth}
          />
        </TabsContent>

        {/* Vital Signs Tab */}
        <TabsContent value="vital-signs" className="mt-6">
          <VitalSignsComponent
            patientId={patient.id}
            patientName={patient.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrapper for PatientDentalHistory to avoid importing it directly from Patients.tsx
const PatientDentalHistoryWrapper = ({ patientId }: { patientId: string }) => {
  const { getPatientHistory, updatePaymentStatus } = useDentalHistory();
  const [patientHistory, setPatientHistory] = useState<DentalHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DentalHistoryEntry | null>(null);
  const { toast } = useToast();

  // Fetch patient history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const history = await getPatientHistory(patientId);
        setPatientHistory(history);
      } catch (error) {
        console.error('Error fetching dental history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dental history. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [patientId, getPatientHistory, toast]);

  const handlePaymentStatusClick = (entry: DentalHistoryEntry) => {
    setSelectedEntry(entry);
    setIsPaymentConfirmOpen(true);
  };

  const confirmPaymentStatusChange = () => {
    if (selectedEntry) {
      // Toggle the payment status
      const newStatus = selectedEntry.payment_status === 'paid' ? 'unpaid' : 'paid';
      updatePaymentStatus(patientId, selectedEntry.appointment_id, newStatus);
      setIsPaymentConfirmOpen(false);
      setSelectedEntry(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Dental History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : patientHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium">Date</th>
                    <th className="text-left py-2 px-4 font-medium">Service</th>
                    <th className="text-left py-2 px-4 font-medium">Doctor</th>
                    <th className="text-left py-2 px-4 font-medium">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patientHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
                    .map((entry) => (
                      <tr key={entry.appointment_id} className="border-b">
                        <td className="py-2 px-4">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="py-2 px-4">{entry.service}</td>
                        <td className="py-2 px-4">{entry.doctor}</td>
                        <td className="py-2 px-4">
                          <Badge
                            variant={entry.payment_status === 'paid' ? 'default' : 'outline'}
                            className={`cursor-pointer hover:opacity-80 ${entry.payment_status === 'paid' ? 'bg-green-500' : ''}`}
                            onClick={() => handlePaymentStatusClick(entry)}
                          >
                            {entry.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No completed appointment history found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status Confirmation Dialog */}
      <Dialog open={isPaymentConfirmOpen} onOpenChange={setIsPaymentConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the payment status for this service?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedEntry && (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Service:</span> {selectedEntry.service}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Date:</span> {new Date(selectedEntry.date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Doctor:</span> {selectedEntry.doctor}
                </p>
                <p className="text-sm text-muted-foreground">
                  You are about to mark this service as
                  <span className="font-semibold">
                    {selectedEntry.payment_status === 'paid' ? ' Unpaid' : ' Paid'}
                  </span>.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmPaymentStatusChange}
              className={selectedEntry?.payment_status === 'paid'
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-green-600 hover:bg-green-700'}
            >
              {selectedEntry?.payment_status === 'paid'
                ? 'Mark as Unpaid'
                : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientDetails;
