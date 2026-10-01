import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReportsAnalytics } from '@/contexts/ReportsAnalyticsContext';
import type { Patient } from '@/contexts/PatientContext';
import type { Appointment } from '@/contexts/AppointmentContext';
import { useToast } from '@/hooks/use-toast';
import {
  getAreaFromPincode,
  groupByAgeRange,
  getDayName,
  sortByValue,
} from '@/utils/reportsUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  MapPin,
  Activity,
  Users,
  Calendar,
} from "lucide-react";

// Import chart components
import GeographicChart from '@/components/charts/GeographicChart';
import TreatmentPieChart, { TREATMENT_OTHERS_KEY } from '@/components/charts/TreatmentPieChart';
import AgeGroupChart from '@/components/charts/AgeGroupChart';
import GenderDistributionChart from '@/components/charts/GenderDistributionChart';
import WeeklyChart from '@/components/charts/WeeklyChart';
import DrillDownDialog, { type DrillDownColumn } from '@/components/reports/DrillDownDialog';

// Column definitions for the drill-down tables
const patientColumns: DrillDownColumn<Patient>[] = [
  { key: 'patient_code', header: 'Patient ID', render: (p) => p.patient_code || '-', csv: (p) => p.patient_code || '' },
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
  { key: 'gender', header: 'Gender' },
  { key: 'area', header: 'Area', render: (p) => getAreaFromPincode(p.pincode || ''), csv: (p) => getAreaFromPincode(p.pincode || '') },
  { key: 'city', header: 'City', render: (p) => p.city || '-', csv: (p) => p.city || '' },
  { key: 'phone', header: 'Phone' },
  { key: 'blood_group', header: 'Blood Group', render: (p) => p.blood_group || '-', csv: (p) => p.blood_group || '' },
  { key: 'clinic', header: 'Clinic' },
];

const Reports = () => {
  const { activeClinic, isDental } = useClinic();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    geographic,
    treatments,
    ageGroups,
    genders,
    weekly,
    isLoading,
    filteredPatients,
    allAppointments,
    completedAppointments,
  } = useReportsAnalytics();

  // Drill-down dialog state
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillMode, setDrillMode] = useState<'patient' | 'appointment'>('patient');
  const [patientRows, setPatientRows] = useState<Patient[]>([]);
  const [appointmentRows, setAppointmentRows] = useState<Appointment[]>([]);

  // Map patient id -> name to resolve appointment patient labels
  const patientNameById = new Map(filteredPatients.map((p) => [p.id, p.name]));

  const appointmentColumns: DrillDownColumn<Appointment>[] = [
    {
      key: 'patient',
      header: 'Patient',
      render: (a) => a.patient_name || patientNameById.get(a.patient_id) || a.patient_id || '-',
      csv: (a) => a.patient_name || patientNameById.get(a.patient_id) || a.patient_id || '',
    },
    { key: 'date', header: 'Date' },
    { key: 'time', header: 'Time', render: (a) => a.time || '-', csv: (a) => a.time || '' },
    { key: 'service', header: 'Service', render: (a) => a.service || 'Unknown Service', csv: (a) => a.service || 'Unknown Service' },
    { key: 'doctor', header: 'Doctor', render: (a) => a.doctor || '-', csv: (a) => a.doctor || '' },
    { key: 'status', header: 'Status' },
    { key: 'payment_status', header: 'Payment', render: (a) => a.payment_status || '-', csv: (a) => a.payment_status || '' },
  ];

  const openPatientDrill = (title: string, rows: Patient[]) => {
    setDrillMode('patient');
    setDrillTitle(title);
    setPatientRows(rows);
    setDrillOpen(true);
  };

  const openAppointmentDrill = (title: string, rows: Appointment[]) => {
    setDrillMode('appointment');
    setDrillTitle(title);
    setAppointmentRows(rows);
    setDrillOpen(true);
  };

  // Patient-based chart drill-downs
  const handleGeographicClick = (key: string) => {
    const rows = filteredPatients.filter((p) => getAreaFromPincode(p.pincode || '') === key);
    openPatientDrill(`Patients in ${key}`, rows);
  };

  const handleAgeClick = (key: string) => {
    const rows = filteredPatients.filter((p) => groupByAgeRange(p.age || 0) === key);
    openPatientDrill(`Patients aged ${key}`, rows);
  };

  const handleGenderClick = (key: string) => {
    const rows = filteredPatients.filter((p) => (p.gender || 'Not Specified') === key);
    openPatientDrill(`${key} patients`, rows);
  };

  // Appointment-based chart drill-downs
  const handleTreatmentClick = (key: string) => {
    if (key === TREATMENT_OTHERS_KEY) {
      const top6 = new Set(
        sortByValue(treatments.treatments).slice(0, 6).map(([name]) => name)
      );
      const rows = completedAppointments.filter(
        (a) => !top6.has(a.service || 'Unknown Service')
      );
      openAppointmentDrill('Treatment: Others', rows);
    } else {
      const rows = completedAppointments.filter((a) => (a.service || 'Unknown Service') === key);
      openAppointmentDrill(`Treatment: ${key}`, rows);
    }
  };

  const handleWeeklyClick = (key: string) => {
    const rows = allAppointments.filter((a) => getDayName(a.date) === key);
    openAppointmentDrill(`Appointments on ${key}`, rows);
  };


  // Restrict access to admin and super_admin only
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl font-bold text-gray-300 mb-4">
          <FileText className="h-16 w-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          The Reports module is only accessible to administrators.
          Please contact your system administrator if you need access.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics for {activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch'} Clinic
          </p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="demographics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demographics" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Demographics</span>
          </TabsTrigger>
          <TabsTrigger value="geographic" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Geography</span>
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Treatments</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
        </TabsList>

        {/* Geographic Analytics Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Patient Geographic Distribution</h2>
          </div>
          <GeographicChart
            data={geographic.areas}
            insight={geographic.insight}
            isLoading={isLoading}
            onSegmentClick={handleGeographicClick}
          />
        </TabsContent>

        {/* Treatment Analytics Tab */}
        <TabsContent value="treatments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Treatment Distribution</h2>
          </div>
          <TreatmentPieChart
            data={treatments.treatments}
            insight={treatments.insight}
            total={treatments.total}
            isLoading={isLoading}
            onSegmentClick={handleTreatmentClick}
          />
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Patient Demographics</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgeGroupChart
              data={ageGroups.ageGroups}
              insight={ageGroups.insight}
              total={ageGroups.total}
              isLoading={isLoading}
              onSegmentClick={handleAgeClick}
            />
            <GenderDistributionChart
              data={genders.genders}
              insight={genders.insight}
              isLoading={isLoading}
              onSegmentClick={handleGenderClick}
            />
          </div>
        </TabsContent>


        {/* Schedule Analytics Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Weekly Appointment Patterns</h2>
          </div>
          <WeeklyChart
            data={weekly.days}
            insight={weekly.insight}
            isLoading={isLoading}
            onSegmentClick={handleWeeklyClick}
          />
        </TabsContent>


      </Tabs>

      {/* Drill-down detail dialog */}
      {drillMode === 'patient' ? (
        <DrillDownDialog<Patient>
          open={drillOpen}
          onOpenChange={setDrillOpen}
          title={drillTitle}
          description={`${patientRows.length} patient${patientRows.length !== 1 ? 's' : ''} - click a row to view the patient`}
          columns={patientColumns}
          rows={patientRows}
          onRowClick={(p) => {
            setDrillOpen(false);
            navigate(`/patients/${p.id}`);
          }}
          emptyMessage="No patients found for this selection."
          exportFileName={drillTitle}
        />
      ) : (
        <DrillDownDialog<Appointment>
          open={drillOpen}
          onOpenChange={setDrillOpen}
          title={drillTitle}
          description={`${appointmentRows.length} appointment${appointmentRows.length !== 1 ? 's' : ''}`}
          columns={appointmentColumns}
          rows={appointmentRows}
          emptyMessage="No appointments found for this selection."
          filterKey="status"
          filterLabel="Status"
          exportFileName={drillTitle}
        />
      )}
    </div>
  );
};

export default Reports;