import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';

// Define the LabJob interface
export interface LabJob {
  id: string;
  lab_job_id: string;
  patient: string;
  service: string;
  lab_work_type: string;
  date_sent: string;
  assigned_lab: string;
  expected_delivery: string;
  payment_status: 'paid' | 'unpaid';
  status: 'pending-send' | 'sent' | 'received' | 'ready' | 'completed';
  material_specs?: string;
  notes?: string;
  created_at: string;
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
    lab_job_id: "LJ001",
    patient: "Aarav Sharma",
    service: "Crown Placement",
    lab_work_type: "PFM Crown",
    date_sent: "2023-10-15",
    assigned_lab: "Precision Dental Lab",
    expected_delivery: overdueDateStr,
    payment_status: "unpaid" as const,
    status: "pending-send" as const,
    material_specs: "A2 Shade, Metal Occlusal",
    notes: "Patient has metal allergy, use non-precious alloy"
  },
  {
    lab_job_id: "LJ002",
    patient: "Priya Patel",
    service: "Complete Denture",
    lab_work_type: "Acrylic Denture",
    date_sent: "2023-10-16",
    assigned_lab: "Nova Dental Solutions",
    expected_delivery: approachingDateStr,
    payment_status: "paid" as const,
    status: "sent" as const,
    material_specs: "Lucitone 199, Medium Pink",
    notes: "Patient prefers natural-looking teeth"
  }
];

// Provider component
export const LabWorkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [labJobs, setLabJobs] = useState<LabJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch lab jobs from Supabase
  useEffect(() => {
    const fetchLabJobs = async () => {
      try {
        setIsLoading(true);

        // Fetch lab jobs from Supabase
        const fetchedJobs = await supabase.from<LabJob>('lab_jobs').getAll({
          order: { column: 'date_sent', ascending: false }
        });

        // If no lab jobs exist, create default ones
        if (fetchedJobs.length === 0) {
          for (const job of defaultLabJobs) {
            await supabase.from<LabJob>('lab_jobs').insert(job);
          }

          // Fetch the newly created lab jobs
          const newJobs = await supabase.from<LabJob>('lab_jobs').getAll({
            order: { column: 'date_sent', ascending: false }
          });
          setLabJobs(newJobs);
        } else {
          setLabJobs(fetchedJobs);
        }
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
    if (!job.expected_delivery || job.status === 'completed') return false;

    const expectedDate = new Date(job.expected_delivery);
    const today = new Date();

    // Set both dates to midnight to compare just the dates
    expectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Return true if expected delivery date is in the past
    return expectedDate < today;
  };

  // Check if a lab job is approaching its expected delivery date (within 3 days)
  const isApproachingDelivery = (job: LabJob) => {
    if (!job.expected_delivery || job.status === 'completed') return false;

    const expectedDate = new Date(job.expected_delivery);
    const today = new Date();

    // Calculate the difference in days
    const differenceInTime = expectedDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    // Return true if expected delivery is within 3 days but not overdue yet
    return differenceInDays > 0 && differenceInDays <= 3;
  };

  // Add a new lab job
  const addLabJob = async (job: Omit<LabJob, 'id' | 'lab_job_id' | 'created_at'>): Promise<LabJob> => {
    try {
      // Generate a unique lab job ID
      const existingJobs = await supabase.from<LabJob>('lab_jobs').getAll();
      const newJobNumber = existingJobs.length + 1;
      const labJobId = `LJ${String(newJobNumber).padStart(3, '0')}`;

      // Create new lab job with ID
      const newLabJob = {
        lab_job_id: labJobId,
        ...job
      };

      // Add to Supabase
      const createdJob = await supabase.from<LabJob>('lab_jobs').insert(newLabJob);

      // Update local state
      setLabJobs(prevJobs => [createdJob, ...prevJobs]);

      toast({
        title: 'Success',
        description: 'Lab job added successfully.',
      });

      return createdJob;
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
      // Update in Supabase
      const updated = await supabase.from<LabJob>('lab_jobs').update(id, updatedJob);

      // Update local state
      setLabJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === id
            ? { ...job, ...updatedJob }
            : job
        )
      );

      toast({
        title: 'Success',
        description: 'Lab job updated successfully.',
      });

      return updated;
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
      // Delete from Supabase
      await supabase.from<LabJob>('lab_jobs').delete(id);

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
