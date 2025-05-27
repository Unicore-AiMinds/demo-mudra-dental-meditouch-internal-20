import React from 'react';
import { useAppointments } from '@/contexts/AppointmentContext';

const PopularServicesAnalytics: React.FC = () => {
  const { meditouchAppointments } = useAppointments();

  // Count service frequencies from completed appointments
  const serviceCount = meditouchAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((acc, apt) => {
      const service = apt.service || 'Unknown Service';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Sort services by popularity and get the top one
  const sortedServices = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b - a);

  // Create analytical message
  const getAnalyticalMessage = () => {
    if (sortedServices.length === 0) {
      return "No services completed yet";
    }

    const [topService, topCount] = sortedServices[0];
    
    if (sortedServices.length === 1) {
      return `${topService} only service`;
    }

    // Show top service with its count
    return `${topService} leads (${topCount})`;
  };

  return <>{getAnalyticalMessage()}</>;
};

export default PopularServicesAnalytics;
