import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReportsAnalytics } from '@/contexts/ReportsAnalyticsContext';
import { useToast } from '@/hooks/use-toast';
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
import TreatmentPieChart from '@/components/charts/TreatmentPieChart';
import AgeGroupChart from '@/components/charts/AgeGroupChart';
import GenderDistributionChart from '@/components/charts/GenderDistributionChart';
import WeeklyChart from '@/components/charts/WeeklyChart';

const Reports = () => {
  const { activeClinic, isDental } = useClinic();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    geographic,
    treatments,
    ageGroups,
    genders,
    weekly,
    isLoading
  } = useReportsAnalytics();


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
            />
            <GenderDistributionChart
              data={genders.genders}
              insight={genders.insight}
              isLoading={isLoading}
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
          />
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default Reports;