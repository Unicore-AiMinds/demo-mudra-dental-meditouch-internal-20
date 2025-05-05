import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { ArrowLeft, Edit } from 'lucide-react';
import PatientDentalHistory from '@/components/PatientDentalHistory';
import DentalChartingComponent from '@/components/DentalChartingComponent';
import PatientUpcomingAppointments from '@/components/PatientUpcomingAppointments';
import VitalSignsComponent from '@/components/VitalSignsComponent';
import PrescriptionComponent from '@/components/PrescriptionComponent';

// Import the Patient interface and demo data
interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  dateOfBirth?: string; // Added DOB field
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
  // Vital signs will be stored separately but referenced by patientId
}

const demoPatients: Patient[] = [
  {
    id: "PT001",
    name: "Aarav Sharma",
    gender: "male",
    age: 34,
    dateOfBirth: "1989-05-15", // Added DOB
    email: "aarav.sharma@example.com",
    phone: "9876543210",
    altPhone: "9876543211",
    address: "123 Modi Street",
    city: "Mumbai",
    pincode: "400001",
    bloodGroup: "O+",
    referredBy: "Dr. Khanna",
    clinic: "both",
    lastVisit: "2023-10-15"
  },
  {
    id: "PT002",
    name: "Priya Patel",
    gender: "female",
    age: 28,
    email: "priya.patel@example.com",
    phone: "8765432109",
    altPhone: null,
    address: "456 Gandhi Road",
    city: "Delhi",
    pincode: "110001",
    bloodGroup: "A+",
    referredBy: "Dr. Sharma",
    clinic: "meditouch",
    lastVisit: "2023-10-12"
  },
  {
    id: "PT003",
    name: "Vikram Singh",
    gender: "male",
    age: 45,
    dateOfBirth: "1978-09-23", // Added DOB
    email: null,
    phone: "7654321098",
    altPhone: "7654321099",
    address: "789 Nehru Avenue",
    city: "Chennai",
    pincode: "600001",
    bloodGroup: "B-",
    referredBy: "Patient Referral",
    clinic: "dental",
    lastVisit: "2023-10-08"
  },
  {
    id: "PT004",
    name: "Neha Kapoor",
    gender: "female",
    age: 31,
    email: "neha.kapoor@example.com",
    phone: "6543210987",
    address: "234 Tagore Lane",
    city: "Bangalore",
    pincode: "560001",
    bloodGroup: "AB+",
    referredBy: "Website",
    clinic: "dental",
    lastVisit: "2023-09-30"
  },
  {
    id: "PT005",
    name: "Rajiv Malhotra",
    gender: "male",
    age: 52,
    email: "rajiv.malhotra@example.com",
    phone: "5432109876",
    altPhone: "5432109877",
    address: "567 Bose Street",
    city: "Hyderabad",
    pincode: "500001",
    bloodGroup: "A-",
    referredBy: "Dr. Patel",
    clinic: "both",
    lastVisit: "2023-10-02"
  },
  {
    id: "PT006",
    name: "Ananya Reddy",
    gender: "female",
    age: 25,
    email: "ananya.reddy@example.com",
    phone: "4321098765",
    address: "890 Raman Road",
    city: "Pune",
    pincode: "411001",
    bloodGroup: "O-",
    referredBy: "Family Member",
    clinic: "meditouch",
    lastVisit: "2023-10-10"
  },
  {
    id: "PT007",
    name: "Arjun Nair",
    gender: "male",
    age: 38,
    email: null,
    phone: "3210987654",
    altPhone: "3210987655",
    address: "123 Krishnan Street",
    city: "Kochi",
    pincode: "682001",
    bloodGroup: "B+",
    referredBy: "Social Media",
    clinic: "dental",
    lastVisit: "2023-09-25"
  },
  {
    id: "PT008",
    name: "Divya Menon",
    gender: "female",
    age: 29,
    email: "divya.menon@example.com",
    phone: "2109876543",
    address: "456 Patel Road",
    city: "Ahmedabad",
    pincode: "380001",
    bloodGroup: "AB-",
    referredBy: "Dr. Sharma",
    clinic: "both",
    lastVisit: "2023-10-05"
  },
  // Additional patients referenced in the Dashboard
  {
    id: "123",
    name: "Aisha Khan",
    gender: "female",
    age: 27,
    email: "aisha.khan@example.com",
    phone: "9876543212",
    address: "789 Jinnah Road",
    city: "Mumbai",
    pincode: "400002",
    bloodGroup: "O+",
    referredBy: "Online Advertisement",
    clinic: "meditouch",
    lastVisit: "2023-10-14"
  },
  {
    id: "124",
    name: "Rajiv Malhotra",
    gender: "male",
    age: 42,
    email: "rajiv.malhotra2@example.com",
    phone: "9876543213",
    address: "101 Gandhi Street, Delhi",
    clinic: "meditouch",
    lastVisit: "2023-10-13"
  },
  {
    id: "125",
    name: "Priya Sharma",
    gender: "female",
    age: 31,
    email: "priya.sharma@example.com",
    phone: "9876543214",
    address: "202 Nehru Avenue, Bangalore",
    clinic: "meditouch",
    lastVisit: "2023-10-12"
  },
  {
    id: "126",
    name: "Karan Kapoor",
    gender: "male",
    age: 35,
    email: "karan.kapoor@example.com",
    phone: "9876543215",
    address: "303 Tagore Lane, Chennai",
    clinic: "meditouch",
    lastVisit: "2023-10-12"
  }
];

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
  const [patient, setPatient] = useState<Patient | null>(null);

  // Get the tab parameter from the URL query string
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');

  // State to track the active tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Find the patient data when the component mounts
  useEffect(() => {
    if (patientId) {
      // Add a small delay to simulate loading from a database
      const timer = setTimeout(() => {
        const foundPatient = demoPatients.find(p => p.id === patientId);
        if (foundPatient) {
          setPatient(foundPatient);
        } else {
          // If patient not found, navigate back to patients list
          console.error(`Patient with ID ${patientId} not found`);
          navigate('/patients');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [patientId, navigate]);

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

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-primary mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading patient details...</p>
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
  const { getPatientHistory } = useDentalHistory();
  const patientHistory = getPatientHistory(patientId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Dental History</CardTitle>
      </CardHeader>
      <CardContent>
        {patientHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Date</th>
                  <th className="text-left py-2 px-4 font-medium">Service</th>
                  <th className="text-left py-2 px-4 font-medium">Doctor</th>
                </tr>
              </thead>
              <tbody>
                {patientHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
                  .map((entry) => (
                    <tr key={entry.appointmentId} className="border-b">
                      <td className="py-2 px-4">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="py-2 px-4">{entry.service}</td>
                      <td className="py-2 px-4">{entry.doctor}</td>
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
  );
};

export default PatientDetails;
