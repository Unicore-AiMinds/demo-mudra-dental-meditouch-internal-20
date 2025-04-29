import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DentalHistoryEntry, TentativeFollowUp, ServiceWithFollowUp } from '../types/dental-history';
import { demoDentalHistory, initialTentativeFollowUps, demoServicesWithFollowUp } from '../data/demo-dental-history';
import { addDays, format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface DentalHistoryContextType {
  dentalHistory: Record<string, DentalHistoryEntry[]>;
  tentativeFollowUps: TentativeFollowUp[];
  servicesWithFollowUp: ServiceWithFollowUp[];
  getPatientHistory: (patientId: string) => DentalHistoryEntry[];
  updateServiceFollowUpConfig: (serviceId: number, config: Partial<ServiceWithFollowUp>) => void;
  markAppointmentCompleted: (
    appointmentId: string,
    patientId: string,
    patientName: string,
    service: string,
    doctor: string,
    date: string
  ) => void;
  updateFollowUpStatus: (followUpId: string, status: TentativeFollowUp['status']) => void;
  getPendingFollowUps: () => TentativeFollowUp[];
}

const DentalHistoryContext = createContext<DentalHistoryContextType | undefined>(undefined);

export const DentalHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dentalHistory, setDentalHistory] = useState<Record<string, DentalHistoryEntry[]>>(demoDentalHistory);
  const [tentativeFollowUps, setTentativeFollowUps] = useState<TentativeFollowUp[]>(initialTentativeFollowUps);
  const [servicesWithFollowUp, setServicesWithFollowUp] = useState<ServiceWithFollowUp[]>(demoServicesWithFollowUp);
  const { toast } = useToast();

  // Get dental history for a specific patient
  const getPatientHistory = (patientId: string): DentalHistoryEntry[] => {
    return dentalHistory[patientId] || [];
  };

  // Update service follow-up configuration
  const updateServiceFollowUpConfig = (serviceId: number, config: Partial<ServiceWithFollowUp>) => {
    setServicesWithFollowUp(prevServices => 
      prevServices.map(service => 
        service.id === serviceId ? { ...service, ...config } : service
      )
    );
  };

  // Mark an appointment as completed and generate follow-up if needed
  const markAppointmentCompleted = (
    appointmentId: string,
    patientId: string,
    patientName: string,
    service: string,
    doctor: string,
    date: string
  ) => {
    // Find the service configuration
    const serviceConfig = servicesWithFollowUp.find(s => s.name === service);
    
    // Add to dental history
    const newHistoryEntry: DentalHistoryEntry = {
      appointmentId,
      patientId,
      date,
      service,
      doctor,
      procedurePerformedNotes: "Procedure completed successfully."
    };

    // Update dental history
    setDentalHistory(prev => {
      const patientHistory = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [...patientHistory, newHistoryEntry]
      };
    });

    // Check if follow-up is required
    if (serviceConfig && serviceConfig.requiresFollowUp && serviceConfig.defaultFollowUpIntervalDays > 0) {
      // Calculate tentative follow-up date
      const appointmentDate = new Date(date);
      const followUpDate = addDays(appointmentDate, serviceConfig.defaultFollowUpIntervalDays);
      const tentativeDate = format(followUpDate, 'yyyy-MM-dd');

      // Create follow-up
      const newFollowUp: TentativeFollowUp = {
        followUpId: `FU${Date.now()}`,
        patientId,
        patientName,
        basedOnAppointmentId: appointmentId,
        tentativeDate,
        followUpSequence: 1,
        suggestedServiceName: serviceConfig.followUpServiceName,
        originalService: service,
        originalDoctor: doctor,
        status: 'Pending'
      };

      // Add to tentative follow-ups
      setTentativeFollowUps(prev => [...prev, newFollowUp]);

      // Show toast notification
      toast({
        title: "Follow-up Reminder Created",
        description: `Follow-up reminder created for ${patientName} due around ${tentativeDate}.`,
      });
    }
  };

  // Update follow-up status
  const updateFollowUpStatus = (followUpId: string, status: TentativeFollowUp['status']) => {
    setTentativeFollowUps(prev => 
      prev.map(followUp => 
        followUp.followUpId === followUpId ? { ...followUp, status } : followUp
      )
    );
  };

  // Get pending follow-ups
  const getPendingFollowUps = (): TentativeFollowUp[] => {
    return tentativeFollowUps.filter(followUp => followUp.status === 'Pending');
  };

  return (
    <DentalHistoryContext.Provider
      value={{
        dentalHistory,
        tentativeFollowUps,
        servicesWithFollowUp,
        getPatientHistory,
        updateServiceFollowUpConfig,
        markAppointmentCompleted,
        updateFollowUpStatus,
        getPendingFollowUps
      }}
    >
      {children}
    </DentalHistoryContext.Provider>
  );
};

export const useDentalHistory = (): DentalHistoryContextType => {
  const context = useContext(DentalHistoryContext);
  if (context === undefined) {
    throw new Error('useDentalHistory must be used within a DentalHistoryProvider');
  }
  return context;
};
