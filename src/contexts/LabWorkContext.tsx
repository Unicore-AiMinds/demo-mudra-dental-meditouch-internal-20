import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';

// Define the LabJob interface
export interface LabJob {
  id: string;
  labJobId: string;
  patient: string;
  service: string;
  labWorkType: string;
  dateSent: string;
  assignedLab: string;
  expectedDelivery: string;
  paymentStatus: 'paid' | 'unpaid';
  status: 'pending-send' | 'sent' | 'received' | 'ready' | 'completed';
  materialSpecs?: string;
  notes?: string;
  createdAt: string;
}

// Define the context type
interface LabWorkContextType {
  labJobs: LabJob[];
  isLoading: boolean;
  addLabJob: (job: Omit<LabJob, 'id' | 'lab_job_id' | 'created_at'>) => Promise<LabJob>;
  updateLabJob: (id: string, updatedJob: Partial<LabJob>) => Promise<LabJob>;
  deleteLabJob: (id: string) => Promise<void>;
  isOverdue: (job: LabJob) => boolean;
  isApproachingDelivery: (job: LabJob) => boolean;
  getOverdueCount: () => number;
  getPendingCount: () => number;
}

// Create the context
const LabWorkContext = createContext<LabWorkContextType | undefined>(undefined);

// Calculate a date 2 days from now for "approaching delivery"
const approachingDate = new Date();
approachingDate.setDate(approachingDate.getDate() + 2);
const approachingDateStr = approachingDate.toISOString().split('T')[0];

// Calculate a date 10 days ago for "overdue"
const overdueDate = new Date();
overdueDate.setDate(overdueDate.getDate() - 10);
const overdueDateStr = overdueDate.toISOString().split('T')[0];

// Default lab jobs for initialization
const defaultLabJobs = [
  {
    labJobId: "LJ001",
    patient: "Aarav Sharma",
    service: "Crown Placement",
    labWorkType: "PFM Crown",
    dateSent: "2023-10-15",
    assignedLab: "Precision Dental Lab",
    expectedDelivery: overdueDateStr,
    paymentStatus: "unpaid" as const,
    status: "pending-send" as const,
    materialSpecs: "A2 Shade, Metal Occlusal",
    notes: "Patient has metal allergy, use non-precious alloy"
  },
  {
    labJobId: "LJ002",
    patient: "Priya Patel",
    service: "Complete Denture",
    labWorkType: "Acrylic Denture",
    dateSent: "2023-10-16",
    assignedLab: "Nova Dental Solutions",
    expectedDelivery: approachingDateStr,
    paymentStatus: "paid" as const,
    status: "sent" as const,
    materialSpecs: "Lucitone 199, Medium Pink",
    notes: "Patient prefers natural-looking teeth"
  }
];

// Provider component
export const LabWorkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [labJobs, setLabJobs] = useState<LabJob[]>([
    {
      id: '1',
      labJobId: 'LJ001',
      patient: 'John Smith',
      service: 'Crown',
      labWorkType: 'PFM Crown',
      assignedLab: 'Dental Arts Lab',
      dateSent: '2025-05-10',
      expectedDelivery: '2025-05-20',
      status: 'sent',
      paymentStatus: 'unpaid',
      materialSpecs: 'A2 Shade, Metal-free',
      notes: 'Please ensure proper occlusal contacts',
      createdAt: '2025-05-10T10:00:00Z'
    },
    {
      id: '2',
      labJobId: 'LJ002',
      patient: 'Sarah Johnson',
      service: 'Bridge',
      labWorkType: '3-Unit Bridge',
      assignedLab: 'Crown Masters',
      dateSent: '2025-05-08',
      expectedDelivery: '2025-05-22',
      status: 'received',
      paymentStatus: 'paid',
      materialSpecs: 'Zirconia, B1 Shade',
      notes: 'Patient has metal allergy',
      createdAt: '2025-05-08T14:30:00Z'
    },
    {
      id: '3',
      labJobId: 'LJ003',
      patient: 'Michael Brown',
      service: 'Denture',
      labWorkType: 'Complete Denture',
      assignedLab: 'Prosthetic Solutions',
      dateSent: '2025-05-15',
      expectedDelivery: '2025-05-25',
      status: 'pending-send',
      paymentStatus: 'unpaid',
      materialSpecs: 'High Impact Acrylic',
      notes: 'Try-in required before final processing',
      createdAt: '2025-05-15T09:15:00Z'
    },
    {
      id: '4',
      labJobId: 'LJ004',
      patient: 'Emily Davis',
      service: 'Implant',
      labWorkType: 'Implant Crown',
      assignedLab: 'Dental Arts Lab',
      dateSent: '2025-05-01',
      expectedDelivery: '2025-05-16',
      status: 'ready',
      paymentStatus: 'paid',
      materialSpecs: 'Screw-retained, D2 Shade',
      notes: 'Use provided implant components',
      createdAt: '2025-05-01T11:45:00Z'
    },
    {
      id: '5',
      labJobId: 'LJ005',
      patient: 'David Wilson',
      service: 'Crown',
      labWorkType: 'Zirconia Crown',
      assignedLab: 'Crown Masters',
      dateSent: '2025-04-25',
      expectedDelivery: '2025-05-10',
      status: 'completed',
      paymentStatus: 'paid',
      materialSpecs: 'Full Zirconia, A3 Shade',
      notes: 'Patient satisfied with final result',
      createdAt: '2025-04-25T16:20:00Z'
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch lab jobs from Supabase
  useEffect(() => {
    const fetchLabJobs = async () => {
      try {
        setIsLoading(true);
        // Skip Supabase operations for demo
        // The demo data is already set in the initial state
      } catch (error) {
        console.error('Error fetching lab jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load lab jobs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabJobs();
  }, [supabase, toast]);

  // Check if a lab job is overdue (expected delivery date is in the past)
  const isOverdue = (job: LabJob) => {
    if (!job.expectedDelivery || job.status === 'completed') return false;

    const expectedDate = new Date(job.expectedDelivery);
    const today = new Date();

    // Set both dates to midnight to compare just the dates
    expectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Return true if expected delivery date is in the past
    return expectedDate < today;
  };

  // Check if a lab job is approaching its expected delivery date (within 3 days)
  const isApproachingDelivery = (job: LabJob) => {
    if (!job.expectedDelivery || job.status === 'completed') return false;

    const expectedDate = new Date(job.expectedDelivery);
    const today = new Date();

    // Calculate the difference in days
    const differenceInTime = expectedDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    // Return true if expected delivery is within 3 days but not overdue yet
    return differenceInDays > 0 && differenceInDays <= 3;
  };

  // Add a new lab job
  const addLabJob = async (job: Omit<LabJob, 'id' | 'labJobId' | 'createdAt'>): Promise<LabJob> => {
    try {
      // Generate a unique lab job ID
      const newJobNumber = labJobs.length + 1;
      const labJobId = `LJ${String(newJobNumber).padStart(3, '0')}`;

      // Create new lab job with ID
      const newLabJob = {
        id: String(newJobNumber),
        lab_job_id: labJobId,
        created_at: new Date().toISOString(),
        ...job
      };

      // Update local state
      setLabJobs(prevJobs => [newLabJob, ...prevJobs]);

      toast({
        title: 'Success',
        description: 'Lab job added successfully.',
      });

      return newLabJob;
    } catch (error) {
      console.error('Error adding lab job:', error);
      toast({
        title: 'Error',
        description: 'Failed to add lab job. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing lab job
  const updateLabJob = async (id: string, updatedJob: Partial<LabJob>): Promise<LabJob> => {
    try {
      // Update local state
      const updatedJobFull = { ...labJobs.find(job => job.id === id), ...updatedJob };
      setLabJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === id
            ? updatedJobFull
            : job
        )
      );

      toast({
        title: 'Success',
        description: 'Lab job updated successfully.',
      });

      return updatedJobFull;
    } catch (error) {
      console.error('Error updating lab job:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lab job. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a lab job
  const deleteLabJob = async (id: string): Promise<void> => {
    try {
      // Update local state
      setLabJobs(prevJobs => prevJobs.filter(job => job.id !== id));

      toast({
        title: 'Success',
        description: 'Lab job deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting lab job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lab job. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get count of overdue lab jobs
  const getOverdueCount = () => {
    return labJobs.filter(job => isOverdue(job)).length;
  };

  // Get count of pending lab jobs (not completed and not overdue)
  const getPendingCount = () => {
    return labJobs.filter(job =>
      job.status !== 'completed' &&
      !isOverdue(job)
    ).length;
  };

  return (
    <LabWorkContext.Provider
      value={{
        labJobs,
        isLoading,
        addLabJob,
        updateLabJob,
        deleteLabJob,
        isOverdue,
        isApproachingDelivery,
        getOverdueCount,
        getPendingCount
      }}
    >
      {children}
    </LabWorkContext.Provider>
  );
};

// Custom hook to use the lab work context
export const useLabWork = () => {
  const context = useContext(LabWorkContext);
  if (context === undefined) {
    throw new Error('useLabWork must be used within a LabWorkProvider');
  }
  return context;
};
