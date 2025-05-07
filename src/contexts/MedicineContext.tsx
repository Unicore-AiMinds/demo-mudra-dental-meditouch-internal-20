import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, defaultMedicines } from '@/types/medicines';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';

// Define the context type
interface MedicineContextType {
  medicines: Medicine[];
  isLoading: boolean;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) => Promise<Medicine>;
  updateMedicine: (id: string, updates: Partial<Omit<Medicine, 'id' | 'created_at' | 'updated_at'>>) => Promise<Medicine | null>;
  deleteMedicine: (id: string) => Promise<boolean>;
}

// Create the context
const MedicineContext = createContext<MedicineContextType | undefined>(undefined);

// Provider component
export const MedicineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch medicines from Supabase
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setIsLoading(true);

        // Fetch medicines from Supabase
        const fetchedMedicines = await supabase.from<Medicine>('medicines').getAll({
          order: { column: 'name', ascending: true }
        });

        // If no medicines exist, create default ones
        if (fetchedMedicines.length === 0) {
          for (const medicine of defaultMedicines) {
            await supabase.from<Medicine>('medicines').insert(medicine);
          }

          // Fetch the newly created medicines
          const newMedicines = await supabase.from<Medicine>('medicines').getAll({
            order: { column: 'name', ascending: true }
          });
          setMedicines(newMedicines);
        } else {
          setMedicines(fetchedMedicines);
        }
      } catch (error) {
        console.error('Error fetching medicines:', error);
        toast({
          title: 'Error',
          description: 'Failed to load medicines. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicines();
  }, [supabase, toast]);

  // Add a new medicine
  const addMedicine = async (medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>): Promise<Medicine> => {
    try {
      // Add medicine to Supabase
      const newMedicine = await supabase.from<Medicine>('medicines').insert(medicine);

      // Update local state
      setMedicines(prev => [...prev, newMedicine]);

      toast({
        title: 'Success',
        description: `${medicine.name} (${medicine.dosage}) added successfully.`,
      });

      return newMedicine;
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast({
        title: 'Error',
        description: 'Failed to add medicine. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing medicine
  const updateMedicine = async (id: string, updates: Partial<Omit<Medicine, 'id' | 'created_at' | 'updated_at'>>): Promise<Medicine | null> => {
    try {
      // Update medicine in Supabase
      const updatedMedicine = await supabase.from<Medicine>('medicines').update(id, updates);

      // Update local state
      setMedicines(prev => {
        const index = prev.findIndex(medicine => medicine.id === id);

        if (index === -1) return prev;

        return [
          ...prev.slice(0, index),
          updatedMedicine,
          ...prev.slice(index + 1)
        ];
      });

      toast({
        title: 'Success',
        description: 'Medicine updated successfully.',
      });

      return updatedMedicine;
    } catch (error) {
      console.error('Error updating medicine:', error);
      toast({
        title: 'Error',
        description: 'Failed to update medicine. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a medicine
  const deleteMedicine = async (id: string): Promise<boolean> => {
    try {
      // Delete medicine from Supabase
      await supabase.from<Medicine>('medicines').delete(id);

      // Update local state
      setMedicines(prev => prev.filter(medicine => medicine.id !== id));

      toast({
        title: 'Success',
        description: 'Medicine deleted successfully.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete medicine. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <MedicineContext.Provider value={{
      medicines,
      isLoading,
      addMedicine,
      updateMedicine,
      deleteMedicine
    }}>
      {children}
    </MedicineContext.Provider>
  );
};

// Custom hook to use the medicine context
export const useMedicines = () => {
  const context = useContext(MedicineContext);
  if (context === undefined) {
    throw new Error('useMedicines must be used within a MedicineProvider');
  }
  return context;
};
