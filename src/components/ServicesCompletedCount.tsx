import React from 'react';
import { useAppointments } from '@/contexts/AppointmentContext';

const ServicesCompletedCount: React.FC = () => {
  const { meditouchAppointments } = useAppointments();

  // Count completed appointments this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const completedThisMonth = meditouchAppointments.filter(apt => {
    if (apt.status !== 'completed') return false;
    
    const aptDate = new Date(apt.date);
    return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
  }).length;

  return <>{completedThisMonth}</>;
};

export default ServicesCompletedCount;
