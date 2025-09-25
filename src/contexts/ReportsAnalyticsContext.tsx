import React, { createContext, useContext, useMemo } from 'react';
import { usePatients } from './PatientContext';
import { useAppointments } from './AppointmentContext';
import { useClinic } from './ClinicContext';
import {
  getAreaFromPincode,
  groupByAgeRange,
  getDayName,
  getMonthName,
  generateGeographicInsight,
  generateTreatmentInsight,
  generateAgeInsight,
  generateWeeklyInsight,
  generateDoctorInsight,
  sortByValue,
  calculatePercentage
} from '@/utils/reportsUtils';

// Types for analytics data
export interface GeographicData {
  areas: Record<string, number>;
  insight: string;
  topArea: string;
  topAreaCount: number;
}

export interface TreatmentData {
  treatments: Record<string, number>;
  insight: string;
  total: number;
}

export interface AgeGroupData {
  ageGroups: Record<string, number>;
  insight: string;
  total: number;
}

export interface WeeklyData {
  days: Record<string, number>;
  insight: string;
  busiestDay: string;
}

export interface DoctorData {
  doctors: Record<string, number>;
  insight: string;
  topDoctor: string;
}

export interface GrowthData {
  months: { month: string; count: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  totalGrowth: number;
}

export interface ReportsAnalyticsData {
  geographic: GeographicData;
  treatments: TreatmentData;
  ageGroups: AgeGroupData;
  weekly: WeeklyData;
  doctors: DoctorData;
  growth: GrowthData;
  isLoading: boolean;
}

const ReportsAnalyticsContext = createContext<ReportsAnalyticsData | undefined>(undefined);

export const ReportsAnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { patients, isLoading: patientsLoading } = usePatients();
  const { dentalAppointments, meditouchAppointments, isLoading: appointmentsLoading } = useAppointments();
  const { activeClinic, isDental } = useClinic();

  // Filter data based on active clinic
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      if (activeClinic === 'dental') {
        return patient.clinic === 'dental' || patient.clinic === 'both';
      } else {
        return patient.clinic === 'meditouch' || patient.clinic === 'both';
      }
    });
  }, [patients, activeClinic]);

  const allAppointments = useMemo(() => {
    return isDental ? dentalAppointments : meditouchAppointments;
  }, [dentalAppointments, meditouchAppointments, isDental]);

  const completedAppointments = useMemo(() => {
    return allAppointments.filter(appointment => appointment.status === 'completed');
  }, [allAppointments]);

  // Geographic Analytics (reverted to original synchronous version)
  const geographic = useMemo<GeographicData>(() => {
    const areas: Record<string, number> = {};

    filteredPatients.forEach(patient => {
      const area = getAreaFromPincode(patient.pincode || '');
      areas[area] = (areas[area] || 0) + 1;
    });

    const sorted = sortByValue(areas);
    const topArea = sorted.length > 0 ? sorted[0][0] : '';
    const topAreaCount = sorted.length > 0 ? sorted[0][1] : 0;

    return {
      areas,
      insight: generateGeographicInsight(areas),
      topArea,
      topAreaCount
    };
  }, [filteredPatients]);

  // Treatment Analytics
  const treatments = useMemo<TreatmentData>(() => {
    const treatmentCounts: Record<string, number> = {};

    completedAppointments.forEach(appointment => {
      const treatment = appointment.service || 'Unknown Service';
      treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
    });

    const total = Object.values(treatmentCounts).reduce((sum, count) => sum + count, 0);

    return {
      treatments: treatmentCounts,
      insight: generateTreatmentInsight(treatmentCounts),
      total
    };
  }, [completedAppointments]);

  // Age Group Analytics
  const ageGroups = useMemo<AgeGroupData>(() => {
    const ageCounts: Record<string, number> = {};

    filteredPatients.forEach(patient => {
      const ageGroup = groupByAgeRange(patient.age || 0);
      ageCounts[ageGroup] = (ageCounts[ageGroup] || 0) + 1;
    });

    const total = Object.values(ageCounts).reduce((sum, count) => sum + count, 0);

    return {
      ageGroups: ageCounts,
      insight: generateAgeInsight(ageCounts),
      total
    };
  }, [filteredPatients]);

  // Weekly Pattern Analytics
  const weekly = useMemo<WeeklyData>(() => {
    const dayCounts: Record<string, number> = {};

    allAppointments.forEach(appointment => {
      const dayName = getDayName(appointment.date);
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    const sorted = sortByValue(dayCounts);
    const busiestDay = sorted.length > 0 ? sorted[0][0] : '';

    return {
      days: dayCounts,
      insight: generateWeeklyInsight(dayCounts),
      busiestDay
    };
  }, [allAppointments]);

  // Doctor Workload Analytics (for dental clinic only)
  const doctors = useMemo<DoctorData>(() => {
    const doctorCounts: Record<string, number> = {};

    if (isDental) {
      allAppointments.forEach(appointment => {
        const doctor = (appointment as any).doctor || 'Unknown Doctor';
        doctorCounts[doctor] = (doctorCounts[doctor] || 0) + 1;
      });
    }

    const sorted = sortByValue(doctorCounts);
    const topDoctor = sorted.length > 0 ? sorted[0][0] : '';

    return {
      doctors: doctorCounts,
      insight: generateDoctorInsight(doctorCounts),
      topDoctor
    };
  }, [allAppointments, isDental]);

  // Growth Analytics (last 6 months)
  const growth = useMemo<GrowthData>(() => {
    const monthCounts: Record<string, number> = {};

    // Get last 6 months
    const currentDate = new Date();
    const months: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = 0;
    }

    // Count patients by month
    filteredPatients.forEach(patient => {
      if (patient.created_at) {
        const patientDate = new Date(patient.created_at);
        const monthKey = `${patientDate.getFullYear()}-${String(patientDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthCounts[monthKey] !== undefined) {
          monthCounts[monthKey]++;
        }
      }
    });

    // Convert to array format for charts
    Object.keys(monthCounts).forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = getMonthName(`${year}-${month}-01`);
      months.push({
        month: `${monthName} ${year}`,
        count: monthCounts[monthKey]
      });
    });

    // Calculate trend
    const values = months.map(m => m.count);
    const firstHalf = values.slice(0, 3).reduce((sum, val) => sum + val, 0);
    const secondHalf = values.slice(3).reduce((sum, val) => sum + val, 0);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const difference = secondHalf - firstHalf;
    if (Math.abs(difference) > 2) {
      trend = difference > 0 ? 'increasing' : 'decreasing';
    }

    return {
      months,
      trend,
      totalGrowth: values.reduce((sum, val) => sum + val, 0)
    };
  }, [filteredPatients]);

  const isLoading = patientsLoading || appointmentsLoading;

  const value: ReportsAnalyticsData = {
    geographic,
    treatments,
    ageGroups,
    weekly,
    doctors,
    growth,
    isLoading
  };

  return (
    <ReportsAnalyticsContext.Provider value={value}>
      {children}
    </ReportsAnalyticsContext.Provider>
  );
};

export const useReportsAnalytics = (): ReportsAnalyticsData => {
  const context = useContext(ReportsAnalyticsContext);
  if (!context) {
    throw new Error('useReportsAnalytics must be used within a ReportsAnalyticsProvider');
  }
  return context;
};