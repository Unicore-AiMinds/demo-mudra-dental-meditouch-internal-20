import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/components/ui/use-toast';
import { capitalizeFirstLetter } from '@/utils/string-utils';
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client
const SUPABASE_URL = 'https://cqtloiklvpvafeoiyyhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGxvaWtsdnB2YWZlb2l5eWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE1MjAsImV4cCI6MjA2Mjk2NzUyMH0.iaGIQNydn1xK8SQXidXLHya6X2qUtQGq0lVqGw8OZbw';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Define the LabWorkType interface
export interface LabWorkType {
  id: string;
  name: string;
  turnaround_duration: number;
  turnaround_unit: 'days' | 'weeks' | 'months';
  created_at?: string;
  updated_at?: string;
}

// Define the context type
interface LabWorkTypesContextType {
  labWorkTypes: LabWorkType[];
  isLoading: boolean;
  addLabWorkType: (labWorkType: Omit<LabWorkType, 'id' | 'created_at' | 'updated_at'>) => Promise<LabWorkType>;
  updateLabWorkType: (id: string, labWorkType: Partial<LabWorkType>) => Promise<LabWorkType>;
  deleteLabWorkType: (id: string) => Promise<void>;
  refreshLabWorkTypes: () => Promise<void>;
}

// Create the context
const LabWorkTypesContext = createContext<LabWorkTypesContextType | undefined>(undefined);

// Provider component
export const LabWorkTypesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [labWorkTypes, setLabWorkTypes] = useState<LabWorkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch lab work types from Supabase
  const fetchLabWorkTypes = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching lab work types from Supabase...');

      const { data, error } = await supabaseClient
        .from('lab_work_types')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (data) {
        setLabWorkTypes(data);
        console.log('Fetched lab work types:', data);
      }
    } catch (error) {
      console.error('Error fetching lab work types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lab work types. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLabWorkTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new lab work type
  const addLabWorkType = async (labWorkType: Omit<LabWorkType, 'id' | 'created_at' | 'updated_at'>): Promise<LabWorkType> => {
    try {
      // Capitalize first letter of name
      const processedLabWorkType = {
        ...labWorkType,
        name: capitalizeFirstLetter(labWorkType.name),
        // Ensure turnaround_duration is a number
        turnaround_duration: Number(labWorkType.turnaround_duration)
      };

      console.log('Adding new lab work type:', processedLabWorkType);

      // Add lab work type to Supabase using direct client
      const { data, error } = await supabaseClient
        .from('lab_work_types')
        .insert(processedLabWorkType)
        .select();

      if (error) {
        throw error;
      }

      const insertedData = data?.[0];

      if (!insertedData) {
        throw new Error('Failed to create lab work type');
      }

      // Update local state
      setLabWorkTypes(prev => [insertedData, ...prev]);

      toast({
        title: 'Success',
        description: 'Lab work type added successfully.',
      });

      return data;
    } catch (error) {
      console.error('Error adding lab work type:', error);
      toast({
        title: 'Error',
        description: 'Failed to add lab work type. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing lab work type
  const updateLabWorkType = async (id: string, labWorkType: Partial<LabWorkType>): Promise<LabWorkType> => {
    try {
      // Process the data
      const processedLabWorkType: any = {
        ...labWorkType,
        updated_at: new Date().toISOString(),
      };

      // Capitalize name if it exists
      if (labWorkType.name) {
        processedLabWorkType.name = capitalizeFirstLetter(labWorkType.name);
      }

      // Ensure turnaround_duration is a number if it exists
      if (labWorkType.turnaround_duration !== undefined) {
        processedLabWorkType.turnaround_duration = Number(labWorkType.turnaround_duration);
      }

      console.log(`Updating lab work type ${id}:`, processedLabWorkType);

      // Update lab work type in Supabase using direct client
      const { data, error } = await supabaseClient
        .from('lab_work_types')
        .update(processedLabWorkType)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      const updatedData = data?.[0];

      if (!updatedData) {
        throw new Error('Failed to update lab work type');
      }

      // Update local state
      setLabWorkTypes(prev =>
        prev.map(item => item.id === id ? updatedData : item)
      );

      toast({
        title: 'Success',
        description: 'Lab work type updated successfully.',
      });

      return data;
    } catch (error) {
      console.error('Error updating lab work type:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lab work type. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a lab work type
  const deleteLabWorkType = async (id: string): Promise<void> => {
    try {
      console.log(`Deleting lab work type ${id}`);

      // Delete lab work type from Supabase using direct client
      const { error } = await supabaseClient
        .from('lab_work_types')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setLabWorkTypes(prev => prev.filter(item => item.id !== id));

      toast({
        title: 'Success',
        description: 'Lab work type deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting lab work type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lab work type. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Refresh lab work types
  const refreshLabWorkTypes = async (): Promise<void> => {
    await fetchLabWorkTypes();
  };

  return (
    <LabWorkTypesContext.Provider
      value={{
        labWorkTypes,
        isLoading,
        addLabWorkType,
        updateLabWorkType,
        deleteLabWorkType,
        refreshLabWorkTypes,
      }}
    >
      {children}
    </LabWorkTypesContext.Provider>
  );
};

// Custom hook to use the lab work types context
export const useLabWorkTypes = () => {
  const context = useContext(LabWorkTypesContext);
  if (context === undefined) {
    throw new Error('useLabWorkTypes must be used within a LabWorkTypesProvider');
  }
  return context;
};
