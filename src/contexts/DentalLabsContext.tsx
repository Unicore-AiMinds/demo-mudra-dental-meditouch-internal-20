import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { handleDatabaseError } from '@/utils/error-handler';
import { capitalizeFirstLetter } from '@/utils/string-utils';

// Define the DentalLab interface
export interface DentalLab {
  id: string;
  name: string;
  contact: string;
  address?: string;
  city?: string;
  pincode?: string;
  specialization?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the context type
interface DentalLabsContextType {
  dentalLabs: DentalLab[];
  isLoading: boolean;
  refreshLabs: () => Promise<void>;
  addLab: (lab: Omit<DentalLab, 'id' | 'created_at' | 'updated_at'>) => Promise<DentalLab>;
  updateLab: (id: string, lab: Partial<DentalLab>) => Promise<DentalLab>;
  deleteLab: (id: string) => Promise<void>;
  getLabById: (id: string) => DentalLab | undefined;
  getLabByName: (name: string) => DentalLab | undefined;
}

// Create the context
const DentalLabsContext = createContext<DentalLabsContextType | undefined>(undefined);

// Provider component
export const DentalLabsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dentalLabs, setDentalLabs] = useState<DentalLab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Function to refresh labs from Supabase
  const refreshLabs = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Fetching dental labs from Supabase...');

      // Fetch labs from Supabase
      const fetchedLabs = await supabase.from<DentalLab>('dental_labs').getAll({
        order: { column: 'name', ascending: true }
      });

      console.log('Fetched dental labs:', fetchedLabs);
      setDentalLabs(fetchedLabs);
    } catch (error) {
      console.error('Error fetching dental labs:', error);
      handleDatabaseError({
        error,
        toast,
        errorKey: 'dental_labs_fetch_error',
        customMessage: 'Failed to load dental labs. Please try again.',
        showToast: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize labs on component mount
  useEffect(() => {
    refreshLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Add a new lab
  const addLab = async (lab: Omit<DentalLab, 'id' | 'created_at' | 'updated_at'>): Promise<DentalLab> => {
    try {
      // Capitalize first letter of name, city, and address
      const processedLab = {
        ...lab,
        name: capitalizeFirstLetter(lab.name),
        city: lab.city ? capitalizeFirstLetter(lab.city) : lab.city,
        address: lab.address ? capitalizeFirstLetter(lab.address) : lab.address,
      };

      console.log('Adding new dental lab:', processedLab);

      // Add lab to Supabase
      const createdLab = await supabase.from<DentalLab>('dental_labs').insert(processedLab);

      if (!createdLab) {
        throw new Error('Failed to create dental lab');
      }

      console.log('Created dental lab:', createdLab);

      // Update local state
      setDentalLabs(prev => [...prev, createdLab]);

      toast({
        title: 'Success',
        description: `Dental lab ${lab.name} added successfully.`,
      });

      return createdLab;
    } catch (error) {
      console.error('Error adding dental lab:', error);
      handleDatabaseError({
        error,
        toast,
        errorKey: 'dental_lab_add_error',
        customMessage: 'Failed to add dental lab. Please try again.',
        showToast: true
      });
      throw error;
    }
  };

  // Update an existing lab
  const updateLab = async (id: string, lab: Partial<DentalLab>): Promise<DentalLab> => {
    try {
      // Capitalize first letter of name, city, and address if they exist
      const processedLab = {
        ...lab,
        name: lab.name ? capitalizeFirstLetter(lab.name) : lab.name,
        city: lab.city ? capitalizeFirstLetter(lab.city) : lab.city,
        address: lab.address ? capitalizeFirstLetter(lab.address) : lab.address,
      };

      console.log(`Updating dental lab ${id}:`, processedLab);

      // Update lab in Supabase
      const updatedLab = await supabase.from<DentalLab>('dental_labs').update(id, {
        ...processedLab,
        updated_at: new Date().toISOString()
      });

      if (!updatedLab) {
        throw new Error('Failed to update dental lab');
      }

      console.log('Updated dental lab:', updatedLab);

      // Update local state
      setDentalLabs(prev => prev.map(l => l.id === id ? updatedLab : l));

      toast({
        title: 'Success',
        description: `Dental lab ${lab.name || 'information'} updated successfully.`,
      });

      return updatedLab;
    } catch (error) {
      console.error('Error updating dental lab:', error);
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_lab_update_error_${id}`,
        customMessage: 'Failed to update dental lab. Please try again.',
        showToast: true
      });
      throw error;
    }
  };

  // Delete a lab
  const deleteLab = async (id: string): Promise<void> => {
    try {
      console.log(`Deleting dental lab ${id}`);

      // Delete lab from Supabase
      await supabase.from('dental_labs').delete(id);

      // Update local state
      setDentalLabs(prev => prev.filter(lab => lab.id !== id));

      toast({
        title: 'Success',
        description: 'Dental lab deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting dental lab:', error);
      handleDatabaseError({
        error,
        toast,
        errorKey: `dental_lab_delete_error_${id}`,
        customMessage: 'Failed to delete dental lab. Please try again.',
        showToast: true
      });
      throw error;
    }
  };

  // Get lab by ID
  const getLabById = (id: string): DentalLab | undefined => {
    return dentalLabs.find(lab => lab.id === id);
  };

  // Get lab by name
  const getLabByName = (name: string): DentalLab | undefined => {
    return dentalLabs.find(lab => lab.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <DentalLabsContext.Provider
      value={{
        dentalLabs,
        isLoading,
        refreshLabs,
        addLab,
        updateLab,
        deleteLab,
        getLabById,
        getLabByName
      }}
    >
      {children}
    </DentalLabsContext.Provider>
  );
};

// Custom hook to use the dental labs context
export const useDentalLabs = () => {
  const context = useContext(DentalLabsContext);
  if (context === undefined) {
    throw new Error('useDentalLabs must be used within a DentalLabsProvider');
  }
  return context;
};

export default DentalLabsContext;
