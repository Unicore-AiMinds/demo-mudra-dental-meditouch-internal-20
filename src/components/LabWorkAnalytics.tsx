import React from 'react';
import { useLabWork } from '@/contexts/LabWorkContext';

const LabWorkAnalytics: React.FC = () => {
  const { labJobs } = useLabWork();

  // Filter active lab jobs (not completed) - same as dashboard display
  const activeJobs = labJobs.filter(job => job.status !== 'completed');

  // Priority-based status functions (same logic as lab work display)
  const getLabJobPriority = (job: any) => {
    const today = new Date();
    const dueDate = new Date(job.expectedDelivery);
    const isOverdue = dueDate < today && job.status !== 'ready';
    const isReady = job.status === 'ready';

    if (isReady) return { priority: 1000, type: 'ready' };
    if (isOverdue) return { priority: 900, type: 'overdue' };
    return { priority: 500, type: 'inprogress' };
  };

  // Process top 5 lab jobs exactly like lab work dashboard display
  const processTopLabJobs = () => {
    const jobsWithPriority = activeJobs.map(job => ({
      ...job,
      priorityInfo: getLabJobPriority(job)
    }));

    // Sort by priority (highest first) and take top 5 (same as dashboard display)
    return jobsWithPriority
      .sort((a, b) => b.priorityInfo.priority - a.priorityInfo.priority)
      .slice(0, 5);
  };

  // Create analytical message based on top 5 displayed items
  const getAnalyticalMessage = () => {
    const topJobs = processTopLabJobs();

    if (topJobs.length === 0) {
      return "All lab work completed";
    }

    // Count by status in top 5 jobs
    const statusCounts = topJobs.reduce((acc: any, job) => {
      const status = job.priorityInfo.type;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const parts = [];

    // Priority order for display
    if (statusCounts.ready > 0) {
      parts.push(`${statusCounts.ready} ready for pickup`);
    }
    if (statusCounts.overdue > 0) {
      parts.push(`${statusCounts.overdue} overdue`);
    }
    if (statusCounts.inprogress > 0 && parts.length === 0) {
      parts.push(`${statusCounts.inprogress} in progress`);
    }

    return parts.slice(0, 2).join(', '); // Show max 2 categories
  };

  return <>{getAnalyticalMessage()}</>;
};

export default LabWorkAnalytics;
