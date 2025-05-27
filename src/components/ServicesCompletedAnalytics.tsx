import React from 'react';
import { useAppointments } from '@/contexts/AppointmentContext';

const ServicesCompletedAnalytics: React.FC = () => {
  const { meditouchAppointments } = useAppointments();

  // Get current and previous month data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Count completed appointments for current month
  const completedThisMonth = meditouchAppointments.filter(apt => {
    if (apt.status !== 'completed') return false;
    const aptDate = new Date(apt.date);
    return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
  }).length;

  // Count completed appointments for previous month
  const completedLastMonth = meditouchAppointments.filter(apt => {
    if (apt.status !== 'completed') return false;
    const aptDate = new Date(apt.date);
    return aptDate.getMonth() === previousMonth && aptDate.getFullYear() === previousYear;
  }).length;

  // Create analytical message
  const getAnalyticalMessage = () => {
    if (completedThisMonth === 0) {
      return "No services completed this month";
    }

    if (completedLastMonth === 0) {
      return `${completedThisMonth} completed this month`;
    }

    const difference = completedThisMonth - completedLastMonth;
    
    if (difference > 0) {
      return `+${difference} vs last month`;
    } else if (difference < 0) {
      return `${difference} vs last month`;
    } else {
      return "Same as last month";
    }
  };

  return <>{getAnalyticalMessage()}</>;
};

export default ServicesCompletedAnalytics;
