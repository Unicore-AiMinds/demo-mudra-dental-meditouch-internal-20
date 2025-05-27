import React from 'react';
import { useAppointments } from '@/contexts/AppointmentContext';

const PopularServicesCount: React.FC = () => {
  const { meditouchAppointments } = useAppointments();

  // Count service frequencies from completed appointments
  const serviceCount = meditouchAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((acc, apt) => {
      const service = apt.service || 'Unknown Service';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Get the count of unique services that have been booked
  const uniqueServicesCount = Object.keys(serviceCount).length;

  return <>{uniqueServicesCount}</>;
};

export default PopularServicesCount;
