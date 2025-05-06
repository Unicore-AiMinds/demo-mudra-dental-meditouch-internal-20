import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the LabJob interface
export interface LabJob {
  id: string;
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
}

// Define the context type
interface LabWorkContextType {
  labJobs: LabJob[];
  setLabJobs: React.Dispatch<React.SetStateAction<LabJob[]>>;
  addLabJob: (job: Omit<LabJob, 'id'>) => void;
  updateLabJob: (id: string, updatedJob: Partial<LabJob>) => void;
  deleteLabJob: (id: string) => void;
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

// Initial demo data
const initialLabJobs: LabJob[] = [
  {
    id: "LJ001",
    patient: "Aarav Sharma",
    service: "Crown Placement",
    labWorkType: "PFM Crown",
    dateSent: "2023-10-15",
    assignedLab: "Precision Dental Lab",
    expectedDelivery: overdueDateStr, // Overdue
    paymentStatus: "unpaid",
    status: "pending-send"
  },
  {
    id: "LJ002",
    patient: "Priya Patel",
    service: "Complete Denture",
    labWorkType: "Acrylic Denture",
    dateSent: "2023-10-16",
    assignedLab: "Nova Dental Solutions",
    expectedDelivery: approachingDateStr, // Approaching delivery
    paymentStatus: "paid",
    status: "sent"
  },
  {
    id: "LJ003",
    patient: "Vikram Singh",
    service: "Bridge Procedure",
    labWorkType: "Ceramic Bridge",
    dateSent: "2023-10-10",
    assignedLab: "Dent Creations India",
    expectedDelivery: overdueDateStr, // Overdue
    paymentStatus: "unpaid",
    status: "sent"
  },
  {
    id: "LJ004",
    patient: "Neha Kapoor",
    service: "Removable Partial",
    labWorkType: "Cast Partial Framework",
    dateSent: "2023-09-28",
    assignedLab: "Precision Dental Lab",
    expectedDelivery: approachingDateStr, // Approaching delivery
    paymentStatus: "paid",
    status: "ready"
  },
  {
    id: "LJ005",
    patient: "Rajiv Malhotra",
    service: "Implant Restoration",
    labWorkType: "Custom Abutment",
    dateSent: "2023-10-03",
    assignedLab: "Implant Specialists",
    expectedDelivery: overdueDateStr, // Overdue
    paymentStatus: "unpaid",
    status: "received"
  },
  {
    id: "LJ006",
    patient: "Ananya Reddy",
    service: "Nightguard",
    labWorkType: "Hard Acrylic Splint",
    dateSent: "2023-10-12",
    assignedLab: "Nova Dental Solutions",
    expectedDelivery: "2023-12-22", // Future date
    paymentStatus: "paid",
    status: "completed"
  }
];

// Provider component
export const LabWorkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [labJobs, setLabJobs] = useState<LabJob[]>(initialLabJobs);

  // Load lab jobs from localStorage on initial load
  useEffect(() => {
    const savedLabJobs = localStorage.getItem('dentalLabJobs');
    if (savedLabJobs) {
      try {
        setLabJobs(JSON.parse(savedLabJobs));
      } catch (error) {
        console.error('Error parsing saved lab jobs:', error);
      }
    }
  }, []);

  // Save lab jobs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dentalLabJobs', JSON.stringify(labJobs));
  }, [labJobs]);

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
  const addLabJob = (job: Omit<LabJob, 'id'>) => {
    // Generate a unique ID
    const newId = `LJ${String(labJobs.length + 1).padStart(3, '0')}`;
    
    // Create new lab job with ID
    const newLabJob: LabJob = {
      id: newId,
      ...job
    };
    
    // Add to the list
    setLabJobs(prevJobs => [newLabJob, ...prevJobs]);
  };

  // Update an existing lab job
  const updateLabJob = (id: string, updatedJob: Partial<LabJob>) => {
    setLabJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === id
          ? { ...job, ...updatedJob }
          : job
      )
    );
  };

  // Delete a lab job
  const deleteLabJob = (id: string) => {
    setLabJobs(prevJobs => prevJobs.filter(job => job.id !== id));
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
        setLabJobs,
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
