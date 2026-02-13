import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { useDentalLabs } from '@/contexts/DentalLabsContext';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { AuditLogTemplates } from '@/utils/auditLogger';
import { supabaseClient } from '@/lib/supabase-config';

// Define the LabJob interface
export interface LabJob {
  id: string;
  labJobId: string;
  patient: string;
  patient_id?: string;
  service: string;
  labWorkType: string;
  dateSent: string;
  assignedLab: string;
  lab_id?: string;
  expectedDelivery: string;
  paymentStatus: 'paid' | 'unpaid';
  status: 'pending-send' | 'sent' | 'received' | 'ready' | 'completed';
  materialSpecs?: string;
  notes?: string;
  createdAt: string;
}

// Define the type for adding a new lab job
export type NewLabJob = Omit<LabJob, 'id' | 'labJobId' | 'createdAt'> & {
  patient_id?: string;
  lab_id?: string;
};

// Define the context type
interface LabWorkContextType {
  labJobs: LabJob[];
  isLoading: boolean;
  addLabJob: (job: NewLabJob) => Promise<LabJob>;
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
  const [labJobs, setLabJobs] = useState<LabJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  // Try to use DentalLabsContext, but provide a fallback if it's not available
  let dentalLabsContext;
  try {
    dentalLabsContext = useDentalLabs();
  } catch (error) {
    console.warn('DentalLabsProvider not found, using empty array for dentalLabs');
    dentalLabsContext = { dentalLabs: [] };
  }

  const { dentalLabs } = dentalLabsContext;

  // Helper function to get patient info for audit logging
  const getPatientInfoForAudit = async (patientId?: string, patientName?: string): Promise<{ name: string, clinic: 'dental' | 'meditouch' | 'both' }> => {
    try {
      if (patientId) {
        const { data: patient, error } = await supabaseClient
          .from('patients')
          .select('name, clinic')
          .eq('id', patientId)
          .single();

        if (!error && patient) {
          return {
            name: patient.name || 'Unknown Patient',
            clinic: patient.clinic || 'dental'
          };
        }
      }

      // Fallback to provided patient name
      return {
        name: patientName || 'Unknown Patient',
        clinic: 'dental' // Default to dental for lab work
      };
    } catch (error) {
      console.error('Error fetching patient info for audit:', error);
      return { name: patientName || 'Unknown Patient', clinic: 'dental' };
    }
  };

  // Fetch lab jobs from Supabase
  useEffect(() => {
    const fetchLabJobs = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching lab jobs from Supabase...');

        // Fetch lab jobs from Supabase using direct client
        const { data: labJobsData, error } = await supabaseClient
          .from('lab_jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (labJobsData && labJobsData.length > 0) {
          // Transform the data to match our interface
          const transformedJobs: LabJob[] = labJobsData.map(job => ({
            id: job.id,
            labJobId: job.lab_job_id,
            patient: job.patient,
            patient_id: job.patient_id,
            service: job.service,
            labWorkType: job.lab_work_type,
            dateSent: job.date_sent,
            assignedLab: job.assigned_lab,
            lab_id: job.lab_id,
            expectedDelivery: job.expected_delivery,
            paymentStatus: job.payment_status as 'paid' | 'unpaid',
            status: job.status as 'pending-send' | 'sent' | 'received' | 'ready' | 'completed',
            materialSpecs: job.material_specs,
            notes: job.notes,
            createdAt: job.created_at
          }));

          setLabJobs(transformedJobs);
          console.log('Fetched lab jobs:', transformedJobs);
        } else {
          console.log('No lab jobs found in database');
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
  }, [toast]);

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
  const addLabJob = async (job: NewLabJob): Promise<LabJob> => {
    try {
      // Generate a unique lab job ID
      const newJobNumber = labJobs.length + 1;
      const labJobId = `LJ${String(newJobNumber).padStart(3, '0')}`;

      // Find the lab ID from the lab name
      let lab_id = job.lab_id;
      if (!lab_id && job.assignedLab) {
        const lab = dentalLabs.find(lab => lab.name === job.assignedLab);
        if (lab) {
          lab_id = lab.id;
        }
      }

      // Prepare the data for Supabase
      const labJobData = {
        lab_job_id: labJobId,
        patient: job.patient,
        patient_id: job.patient_id,
        service: job.service,
        lab_work_type: job.labWorkType,
        date_sent: job.dateSent,
        assigned_lab: job.assignedLab,
        lab_id: lab_id,
        expected_delivery: job.expectedDelivery,
        payment_status: job.paymentStatus,
        status: job.status,
        material_specs: job.materialSpecs,
        notes: job.notes
      };

      // Insert into Supabase using direct client
      const { data, error } = await supabaseClient
        .from('lab_jobs')
        .insert(labJobData)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned after insertion');
      }

      // Supabase returns an array, so we need to get the first item
      const insertedData = data[0];
      console.log('Inserted lab job data:', insertedData);

      // Transform the returned data to match our interface
      const newLabJob: LabJob = {
        id: insertedData.id,
        labJobId: insertedData.lab_job_id,
        patient: insertedData.patient,
        patient_id: insertedData.patient_id,
        service: insertedData.service,
        labWorkType: insertedData.lab_work_type,
        dateSent: insertedData.date_sent,
        assignedLab: insertedData.assigned_lab,
        lab_id: insertedData.lab_id,
        expectedDelivery: insertedData.expected_delivery,
        paymentStatus: insertedData.payment_status,
        status: insertedData.status,
        materialSpecs: insertedData.material_specs,
        notes: insertedData.notes,
        createdAt: insertedData.created_at
      };

      // Update local state and refresh data
      setLabJobs(prevJobs => [newLabJob, ...prevJobs]);

      // Log audit action for lab work creation
      try {
        const patientInfo = await getPatientInfoForAudit(job.patient_id, job.patient);
        const auditEntry = AuditLogTemplates.lab_work.create(
          newLabJob.id,
          newLabJob.labJobId,
          patientInfo.name,
          newLabJob.service,
          newLabJob.labWorkType,
          newLabJob.assignedLab,
          newLabJob.dateSent,
          newLabJob.expectedDelivery,
          newLabJob.status,
          newLabJob.paymentStatus,
          newLabJob.materialSpecs,
          newLabJob.notes
        );

        // Set clinic type based on patient's clinic registration
        if (patientInfo.clinic === 'both') {
          // Create audit log entries for both clinics
          await logAction({ ...auditEntry, clinic_type: 'dental' });
          await logAction({ ...auditEntry, clinic_type: 'meditouch' });
        } else {
          // Create single audit log entry
          const clinicType = patientInfo.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({ ...auditEntry, clinic_type: clinicType });
        }
      } catch (auditError) {
        console.error('Failed to log lab work creation audit:', auditError);
      }

      // Fetch all lab jobs again to ensure UI is in sync with database
      try {
        const { data: refreshedData, error: refreshError } = await supabaseClient
          .from('lab_jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!refreshError && refreshedData && refreshedData.length > 0) {
          // Transform the data to match our interface
          const transformedJobs: LabJob[] = refreshedData.map(job => ({
            id: job.id,
            labJobId: job.lab_job_id,
            patient: job.patient,
            patient_id: job.patient_id,
            service: job.service,
            labWorkType: job.lab_work_type,
            dateSent: job.date_sent,
            assignedLab: job.assigned_lab,
            lab_id: job.lab_id,
            expectedDelivery: job.expected_delivery,
            paymentStatus: job.payment_status as 'paid' | 'unpaid',
            status: job.status as 'pending-send' | 'sent' | 'received' | 'ready' | 'completed',
            materialSpecs: job.material_specs,
            notes: job.notes,
            createdAt: job.created_at
          }));

          setLabJobs(transformedJobs);
          console.log('Refreshed lab jobs after adding:', transformedJobs);
        }
      } catch (refreshErr) {
        console.error('Error refreshing lab jobs after add:', refreshErr);
      }

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
      // Find the job to update
      const existingJob = labJobs.find(job => job.id === id);
      if (!existingJob) {
        throw new Error('Lab job not found');
      }

      // Find the lab ID from the lab name if needed
      let lab_id = updatedJob.lab_id;
      if (!lab_id && updatedJob.assignedLab) {
        const lab = dentalLabs.find(lab => lab.name === updatedJob.assignedLab);
        if (lab) {
          lab_id = lab.id;
        }
      }

      // Prepare the data for Supabase
      const updateData: any = {};
      if (updatedJob.patient) updateData.patient = updatedJob.patient;
      if (updatedJob.patient_id) updateData.patient_id = updatedJob.patient_id;
      if (updatedJob.service) updateData.service = updatedJob.service;
      if (updatedJob.labWorkType) updateData.lab_work_type = updatedJob.labWorkType;
      if (updatedJob.dateSent) updateData.date_sent = updatedJob.dateSent;
      if (updatedJob.assignedLab) updateData.assigned_lab = updatedJob.assignedLab;
      if (lab_id) updateData.lab_id = lab_id;
      if (updatedJob.expectedDelivery) updateData.expected_delivery = updatedJob.expectedDelivery;
      if (updatedJob.paymentStatus) updateData.payment_status = updatedJob.paymentStatus;
      if (updatedJob.status) updateData.status = updatedJob.status;
      if (updatedJob.materialSpecs !== undefined) updateData.material_specs = updatedJob.materialSpecs;
      if (updatedJob.notes !== undefined) updateData.notes = updatedJob.notes;
      updateData.updated_at = new Date().toISOString();

      // Update in Supabase using direct client
      const { data, error } = await supabaseClient
        .from('lab_jobs')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      // Log the updated data for debugging
      console.log('Updated lab job data:', data);

      // Create updated job object
      const updatedJobFull = { ...existingJob, ...updatedJob, lab_id: lab_id || existingJob.lab_id };

      // Update local state
      setLabJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === id
            ? updatedJobFull
            : job
        )
      );

      // Log audit action for lab work update
      try {
        const patientInfo = await getPatientInfoForAudit(existingJob.patient_id, existingJob.patient);
        const auditEntry = AuditLogTemplates.lab_work.update(
          id,
          existingJob.labJobId,
          patientInfo.name,
          {
            before: existingJob,
            after: updatedJobFull
          }
        );

        // Set clinic type based on patient's clinic registration
        if (patientInfo.clinic === 'both') {
          // Create audit log entries for both clinics
          await logAction({ ...auditEntry, clinic_type: 'dental' });
          await logAction({ ...auditEntry, clinic_type: 'meditouch' });
        } else {
          // Create single audit log entry
          const clinicType = patientInfo.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({ ...auditEntry, clinic_type: clinicType });
        }
      } catch (auditError) {
        console.error('Failed to log lab work update audit:', auditError);
      }

      // Fetch all lab jobs again to ensure UI is in sync with database
      try {
        const { data: refreshedData, error: refreshError } = await supabaseClient
          .from('lab_jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!refreshError && refreshedData && refreshedData.length > 0) {
          // Transform the data to match our interface
          const transformedJobs: LabJob[] = refreshedData.map(job => ({
            id: job.id,
            labJobId: job.lab_job_id,
            patient: job.patient,
            patient_id: job.patient_id,
            service: job.service,
            labWorkType: job.lab_work_type,
            dateSent: job.date_sent,
            assignedLab: job.assigned_lab,
            lab_id: job.lab_id,
            expectedDelivery: job.expected_delivery,
            paymentStatus: job.payment_status as 'paid' | 'unpaid',
            status: job.status as 'pending-send' | 'sent' | 'received' | 'ready' | 'completed',
            materialSpecs: job.material_specs,
            notes: job.notes,
            createdAt: job.created_at
          }));

          setLabJobs(transformedJobs);
          console.log('Refreshed lab jobs after update:', transformedJobs);
        }
      } catch (refreshErr) {
        console.error('Error refreshing lab jobs after update:', refreshErr);
      }

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
      // Get the lab job record before deletion for audit logging
      const labJobToDelete = labJobs.find(job => job.id === id);
      if (!labJobToDelete) {
        throw new Error('Lab job not found');
      }

      // Delete from Supabase using direct client
      const { error } = await supabaseClient
        .from('lab_jobs')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setLabJobs(prevJobs => prevJobs.filter(job => job.id !== id));

      // Log audit action for lab work deletion
      try {
        const patientInfo = await getPatientInfoForAudit(labJobToDelete.patient_id, labJobToDelete.patient);
        const auditEntry = AuditLogTemplates.lab_work.delete(
          id,
          labJobToDelete.labJobId,
          patientInfo.name,
          labJobToDelete.service,
          labJobToDelete.labWorkType,
          labJobToDelete.assignedLab,
          labJobToDelete.status
        );

        // Set clinic type based on patient's clinic registration
        if (patientInfo.clinic === 'both') {
          // Create audit log entries for both clinics
          await logAction({ ...auditEntry, clinic_type: 'dental' });
          await logAction({ ...auditEntry, clinic_type: 'meditouch' });
        } else {
          // Create single audit log entry
          const clinicType = patientInfo.clinic === 'meditouch' ? 'meditouch' : 'dental';
          await logAction({ ...auditEntry, clinic_type: clinicType });
        }
      } catch (auditError) {
        console.error('Failed to log lab work deletion audit:', auditError);
      }

      // Fetch all lab jobs again to ensure UI is in sync with database
      try {
        const { data: refreshedData, error: refreshError } = await supabaseClient
          .from('lab_jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!refreshError && refreshedData) {
          // Transform the data to match our interface
          const transformedJobs: LabJob[] = refreshedData.map(job => ({
            id: job.id,
            labJobId: job.lab_job_id,
            patient: job.patient,
            patient_id: job.patient_id,
            service: job.service,
            labWorkType: job.lab_work_type,
            dateSent: job.date_sent,
            assignedLab: job.assigned_lab,
            lab_id: job.lab_id,
            expectedDelivery: job.expected_delivery,
            paymentStatus: job.payment_status as 'paid' | 'unpaid',
            status: job.status as 'pending-send' | 'sent' | 'received' | 'ready' | 'completed',
            materialSpecs: job.material_specs,
            notes: job.notes,
            createdAt: job.created_at
          }));

          setLabJobs(transformedJobs);
          console.log('Refreshed lab jobs after delete:', transformedJobs);
        }
      } catch (refreshErr) {
        console.error('Error refreshing lab jobs after delete:', refreshErr);
      }

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
