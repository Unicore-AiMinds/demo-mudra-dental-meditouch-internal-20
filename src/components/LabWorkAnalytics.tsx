import React from 'react';
import { useLabWork } from '@/contexts/LabWorkContext';

const LabWorkAnalytics: React.FC = () => {
  const { labJobs, isOverdue } = useLabWork();

  // Get the analytical message for the lab work card
  const getAnalyticalMessage = () => {
    // Filter active jobs (not completed)
    const activeJobs = labJobs.filter(job => job.status !== 'completed');
    
    if (activeJobs.length === 0) {
      return "All lab work completed";
    }

    // Count ready jobs
    const readyJobs = activeJobs.filter(job => job.status === 'ready');
    const readyCount = readyJobs.length;
    
    // Count overdue jobs using the context's isOverdue function
    const overdueJobs = activeJobs.filter(job => isOverdue(job));
    const overdueCount = overdueJobs.length;
    
    // Count in-progress jobs (not ready and not overdue)
    const inProgressJobs = activeJobs.filter(
      job => job.status !== 'ready' && !isOverdue(job)
    );
    const inProgressCount = inProgressJobs.length;

    // Build the message parts
    const parts = [];
    
    // Priority order for display
    if (readyCount > 0) {
      parts.push(`${readyCount} ready for pickup`);
    }
    
    if (overdueCount > 0) {
      parts.push(`${overdueCount} overdue`);
    }
    
    if (inProgressCount > 0 && parts.length === 0) {
      parts.push(`${inProgressCount} in progress`);
    }

    // Return at most 2 parts
    return parts.slice(0, 2).join(', ');
  };

  return <>{getAnalyticalMessage()}</>;
};

export default LabWorkAnalytics;
