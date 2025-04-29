import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Edit } from 'lucide-react';
import PatientDentalHistory from '@/components/PatientDentalHistory';
import DentalChartingComponent from '@/components/DentalChartingComponent';

// Import the Patient interface and demo data
interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  email: string | null;
  phone: string;
  altPhone?: string | null;
  address: string;
  clinic: 'dental' | 'meditouch' | 'both';
  lastVisit: string | '';
}

const demoPatients: Patient[] = [
  {
    id: "PT001",
    name: "Aarav Sharma",
    gender: "male",
    age: 34,
    email: "aarav.sharma@example.com",
    phone: "9876543210",
    altPhone: "9876543211",
    address: "123 Modi Street, Mumbai",
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
    address: "456 Gandhi Road, Delhi",
    clinic: "meditouch",
    lastVisit: "2023-10-12"
  },
  {
    id: "PT003",
    name: "Vikram Singh",
    gender: "male",
    age: 45,
    email: null,
    phone: "7654321098",
    altPhone: "7654321099",
    address: "789 Nehru Avenue, Chennai",
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
    address: "234 Tagore Lane, Bangalore",
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
    address: "567 Bose Street, Hyderabad",
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
    address: "890 Raman Road, Pune",
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
    address: "123 Krishnan Street, Kochi",
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
    address: "456 Patel Road, Ahmedabad",
    clinic: "both",
    lastVisit: "2023-10-05"
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

const PatientDetails = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { activeClinic } = useClinic();
  const [patient, setPatient] = useState<Patient | null>(null);

  // Find the patient data when the component mounts
  useEffect(() => {
    if (patientId) {
      const foundPatient = demoPatients.find(p => p.id === patientId);
      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        // If patient not found, navigate back to patients list
        navigate('/patients');
      }
    }
  }, [patientId, navigate]);

  // Handle edit patient click
  const handleEditPatient = () => {
    // For now, just navigate back to patients list
    // In a real implementation, this would open the edit form
    navigate('/patients');
  };

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p>Loading patient details...</p>
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
            <p className="text-muted-foreground">
              Patient ID: {patient.id}
            </p>
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

      {/* Patient Information Card */}
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
            <div className="md:col-span-2 lg:col-span-3">
              <h3 className="font-medium text-sm text-muted-foreground">Address</h3>
              <p className="text-base">{patient.address}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Registered Clinic</h3>
              <div className="mt-1">
                {getClinicBadge(patient.clinic, activeClinic)}
              </div>
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

      {/* Dental History - Only show for dental patients */}
      {(patient.clinic === 'dental' || patient.clinic === 'both') && (
        <PatientDentalHistoryWrapper patientId={patient.id} />
      )}
      
      {/* Dental Charting - Only show for dental patients */}
      {(patient.clinic === 'dental' || patient.clinic === 'both') && (
        <DentalChartingComponent patientId={patient.id} />
      )}
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
