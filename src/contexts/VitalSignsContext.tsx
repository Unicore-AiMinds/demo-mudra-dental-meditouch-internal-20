import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VitalSign, defaultVitalSigns } from '@/types/vital-signs';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface VitalSignsContextType {
  getPatientVitalSigns: (patientId: string) => Promise<VitalSign[]>;
  addVitalSign: (patientId: string, vitalSign: Omit<VitalSign, 'id' | 'vital_sign_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>) => Promise<VitalSign>;
  updateVitalSign: (vitalSignId: string, updates: Partial<Omit<VitalSign, 'id' | 'vital_sign_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>>) => Promise<VitalSign | null>;
  getLatestVitalSign: (patientId: string) => Promise<VitalSign | null>;
  isLoading: boolean;
}

const VitalSignsContext = createContext<VitalSignsContextType | undefined>(undefined);

export const VitalSignsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Initialize default vital signs if none exist
  useEffect(() => {
    const initializeVitalSigns = async () => {
      try {
        setIsLoading(true);

        // Check if any vital signs exist
        const existingVitalSigns = await supabase.from<VitalSign>('vital_signs').getAll({ limit: 1 });

        if (existingVitalSigns.length === 0) {
          // Create default vital signs
          for (const vitalSign of defaultVitalSigns) {
            await supabase.from<VitalSign>('vital_signs').insert(vitalSign);
          }
        }
      } catch (error) {
        console.error('Error initializing vital signs:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize vital signs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeVitalSigns();
  }, [supabase, toast]);

  // Get all vital signs for a patient
  const getPatientVitalSigns = async (patientId: string): Promise<VitalSign[]> => {
    try {
      const vitalSigns = await supabase.from<VitalSign>('vital_signs').getAll({
        filters: { patient_id: patientId },
        order: { column: 'date', ascending: false }
      });

      return vitalSigns;
    } catch (error) {
      console.error('Error fetching patient vital signs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vital signs. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Add a new vital sign record
  const addVitalSign = async (
    patientId: string,
    vitalSign: Omit<VitalSign, 'id' | 'vital_sign_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>
  ): Promise<VitalSign> => {
    try {
      // Generate a unique vital sign ID
      const vitalSignId = `VS${uuidv4().substring(0, 8)}`;

      // Create new vital sign
      const newVitalSign = {
        vital_sign_id: vitalSignId,
        patient_id: patientId,
        date: new Date().toISOString(),
        ...vitalSign
      };

      // Add to Supabase
      const createdVitalSign = await supabase.from<VitalSign>('vital_signs').insert(newVitalSign);

      toast({
        title: 'Success',
        description: 'Vital signs recorded successfully.',
      });

      return createdVitalSign;
    } catch (error) {
      console.error('Error adding vital sign:', error);
      toast({
        title: 'Error',
        description: 'Failed to record vital signs. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing vital sign record
  const updateVitalSign = async (
    vitalSignId: string,
    updates: Partial<Omit<VitalSign, 'id' | 'vital_sign_id' | 'patient_id' | 'date' | 'created_at' | 'updated_at'>>
  ): Promise<VitalSign | null> => {
    try {
      // Update in Supabase
      const updatedVitalSign = await supabase.from<VitalSign>('vital_signs').update(vitalSignId, updates);

      toast({
        title: 'Success',
        description: 'Vital signs updated successfully.',
      });

      return updatedVitalSign;
    } catch (error) {
      console.error('Error updating vital sign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vital signs. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Get the latest vital sign record for a patient
  const getLatestVitalSign = async (patientId: string): Promise<VitalSign | null> => {
    try {
      const vitalSigns = await supabase.from<VitalSign>('vital_signs').getAll({
        filters: { patient_id: patientId },
        order: { column: 'date', ascending: false },
        limit: 1
      });

      return vitalSigns.length > 0 ? vitalSigns[0] : null;
    } catch (error) {
      console.error('Error fetching latest vital sign:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch latest vital signs. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return (
    <VitalSignsContext.Provider
      value={{
        getPatientVitalSigns,
        addVitalSign,
        updateVitalSign,
        getLatestVitalSign,
        isLoading
      }}
    >
      {children}
    </VitalSignsContext.Provider>
  );
};

export const useVitalSigns = (): VitalSignsContextType => {
  const context = useContext(VitalSignsContext);
  if (context === undefined) {
    throw new Error('useVitalSigns must be used within a VitalSignsProvider');
  }
  return context;
};
