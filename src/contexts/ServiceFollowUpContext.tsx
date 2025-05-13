import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useServices, ServiceWithFollowUp } from '@/contexts/ServiceContext';

// Define the follow-up interface
export interface FollowUp {
  id: string;
  patient_id: string;
  patient_name: string;
  service_id: string;
  service_name: string;
  follow_up_date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'snoozed';
  notes?: string;
  snooze_until?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the context type
interface ServiceFollowUpContextType {
  followUps: FollowUp[];
  isLoading: boolean;
  addFollowUp: (followUp: Omit<FollowUp, 'id' | 'created_at' | 'updated_at'>) => Promise<FollowUp>;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => Promise<FollowUp>;
  deleteFollowUp: (id: string) => Promise<void>;
  getFollowUpsForPatient: (patientId: string) => FollowUp[];
  getPendingFollowUps: () => FollowUp[];
  snoozeFollowUp: (id: string, snoozeUntil: string, notes?: string) => Promise<FollowUp>;
  completeFollowUp: (id: string, notes?: string) => Promise<FollowUp>;
  cancelFollowUp: (id: string, notes?: string) => Promise<FollowUp>;
  generateFollowUpsForCompletedService: (
    patientId: string,
    patientName: string,
    serviceName: string,
    completionDate: string
  ) => Promise<FollowUp[]>;
}

// Create the context
const ServiceFollowUpContext = createContext<ServiceFollowUpContextType | undefined>(undefined);

// Provider component
export const ServiceFollowUpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const { servicesWithFollowUp } = useServices();

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch follow-ups from Supabase
  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        setIsLoading(true);

        // Fetch follow-ups from Supabase
        const { data, error } = await supabase
          .from('follow_ups')
          .select('*')
          .order('follow_up_date', { ascending: true });

        if (error) throw error;

        setFollowUps(data || []);
      } catch (error) {
        console.error('Error fetching follow-ups:', error);
        toast({
          title: 'Error',
          description: 'Failed to load follow-ups. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowUps();
  }, [supabase, toast]);

  // Add a new follow-up
  const addFollowUp = async (followUp: Omit<FollowUp, 'id' | 'created_at' | 'updated_at'>): Promise<FollowUp> => {
    try {
      // Add follow-up to Supabase
      const { data, error } = await supabase
        .from('follow_ups')
        .insert(followUp)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create follow-up');

      const newFollowUp = data as FollowUp;

      // Update local state
      setFollowUps(prev => [...prev, newFollowUp]);

      toast({
        title: 'Success',
        description: 'Follow-up has been scheduled.',
      });

      return newFollowUp;
    } catch (error) {
      console.error('Error adding follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule follow-up. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a follow-up
  const updateFollowUp = async (id: string, updates: Partial<FollowUp>): Promise<FollowUp> => {
    try {
      // Update follow-up in Supabase
      const { data, error } = await supabase
        .from('follow_ups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update follow-up');

      const updatedFollowUp = data as FollowUp;

      // Update local state
      setFollowUps(prev => prev.map(f => f.id === id ? updatedFollowUp : f));

      toast({
        title: 'Success',
        description: 'Follow-up has been updated.',
      });

      return updatedFollowUp;
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow-up. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a follow-up
  const deleteFollowUp = async (id: string): Promise<void> => {
    try {
      // Delete follow-up from Supabase
      const { error } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setFollowUps(prev => prev.filter(f => f.id !== id));

      toast({
        title: 'Success',
        description: 'Follow-up has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete follow-up. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get follow-ups for a specific patient
  const getFollowUpsForPatient = (patientId: string): FollowUp[] => {
    return followUps.filter(f => f.patient_id === patientId);
  };

  // Get all pending follow-ups
  const getPendingFollowUps = (): FollowUp[] => {
    return followUps.filter(f => f.status === 'pending');
  };

  // Snooze a follow-up
  const snoozeFollowUp = async (id: string, snoozeUntil: string, notes?: string): Promise<FollowUp> => {
    return updateFollowUp(id, {
      status: 'snoozed',
      snooze_until: snoozeUntil,
      notes: notes
    });
  };

  // Mark a follow-up as completed
  const completeFollowUp = async (id: string, notes?: string): Promise<FollowUp> => {
    return updateFollowUp(id, {
      status: 'completed',
      notes: notes
    });
  };

  // Cancel a follow-up
  const cancelFollowUp = async (id: string, notes?: string): Promise<FollowUp> => {
    return updateFollowUp(id, {
      status: 'cancelled',
      notes: notes
    });
  };

  // Generate follow-ups for a completed service
  const generateFollowUpsForCompletedService = async (
    patientId: string,
    patientName: string,
    serviceName: string,
    completionDate: string
  ): Promise<FollowUp[]> => {
    try {
      // Find the service with follow-up configuration
      const serviceConfig = servicesWithFollowUp.find(s => s.name === serviceName);

      // If no follow-up is required, return empty array
      if (!serviceConfig || !serviceConfig.requires_follow_up) {
        return [];
      }

      const createdFollowUps: FollowUp[] = [];

      // Calculate the number of follow-ups to create
      const numFollowUps = serviceConfig.number_of_follow_ups || 1;
      const intervalDays = serviceConfig.default_follow_up_interval_days || 180; // Default to 6 months

      // Create follow-ups
      for (let i = 0; i < numFollowUps; i++) {
        // Calculate follow-up date
        const completionDateTime = new Date(completionDate);
        completionDateTime.setDate(completionDateTime.getDate() + intervalDays * (i + 1));
        const followUpDate = completionDateTime.toISOString().split('T')[0];

        // Create follow-up object
        const followUp: Omit<FollowUp, 'id' | 'created_at' | 'updated_at'> = {
          patient_id: patientId,
          patient_name: patientName,
          service_id: serviceConfig.id,
          service_name: serviceConfig.follow_up_service_name || serviceName,
          follow_up_date: followUpDate,
          status: 'pending'
        };

        // Add follow-up
        const newFollowUp = await addFollowUp(followUp);
        createdFollowUps.push(newFollowUp);
      }

      return createdFollowUps;
    } catch (error) {
      console.error('Error generating follow-ups:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate follow-ups. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <ServiceFollowUpContext.Provider value={{
      followUps,
      isLoading,
      addFollowUp,
      updateFollowUp,
      deleteFollowUp,
      getFollowUpsForPatient,
      getPendingFollowUps,
      snoozeFollowUp,
      completeFollowUp,
      cancelFollowUp,
      generateFollowUpsForCompletedService
    }}>
      {children}
    </ServiceFollowUpContext.Provider>
  );
};

// Custom hook to use the service follow-up context
export const useServiceFollowUps = () => {
  const context = useContext(ServiceFollowUpContext);
  if (context === undefined) {
    throw new Error('useServiceFollowUps must be used within a ServiceFollowUpProvider');
  }
  return context;
};
