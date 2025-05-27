import React from 'react';
import { useLabWork } from '@/contexts/LabWorkContext';

const LabWorkAnalytics: React.FC = () => {
  const { labJobs } = useLabWork();

  // Filter active lab jobs (not completed)
  const activeJobs = labJobs.filter(job => job.status !== 'completed');

  // Count different statuses
  const readyJobs = activeJobs.filter(job => job.status === 'ready');
  const overdueJobs = activeJobs.filter(job => {
    const today = new Date();
    const dueDate = new Date(job.expectedDelivery);
    return dueDate < today && job.status !== 'ready';
  });

  // Create analytical message
  const getAnalyticalMessage = () => {
    const parts = [];

    // Priority: Ready jobs first (immediate revenue)
    if (readyJobs.length > 0) {
      parts.push(`${readyJobs.length} ready for pickup`);
    }

    // Then overdue jobs (customer service priority)
    if (overdueJobs.length > 0 && parts.length === 0) {
      const maxOverdueDays = Math.max(...overdueJobs.map(job => {
        const today = new Date();
        const dueDate = new Date(job.expectedDelivery);
        return Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }));
      
      if (overdueJobs.length === 1) {
        parts.push(`1 overdue by ${maxOverdueDays} day${maxOverdueDays !== 1 ? 's' : ''}`);
      } else {
        parts.push(`${overdueJobs.length} overdue by ${maxOverdueDays}+ days`);
      }
    }

    // If no critical issues, show general status
    if (parts.length === 0) {
      if (activeJobs.length === 0) {
        return "All lab work completed";
      } else {
        return `${activeJobs.length} in progress`;
      }
    }

    return parts.join(', ');
  };

  return <>{getAnalyticalMessage()}</>;
};

export default LabWorkAnalytics;
