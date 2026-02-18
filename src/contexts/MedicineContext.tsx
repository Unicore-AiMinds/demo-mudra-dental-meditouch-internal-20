import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, defaultMedicines } from '@/types/medicines';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { AuditLogTemplates } from '@/utils/auditLogger';
import { useToast } from '@/hooks/use-toast';
import { capitalizeFirstLetter } from '@/utils/string-utils';

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
  const { logAction } = useAuditLog();
  const { toast } = useToast();

  // Fetch medicines from Supabase
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching medicines from Supabase...");

        // Check if the medicines table exists
        try {
          // Fetch medicines from Supabase
          const fetchedMedicines = await supabase.from<Medicine>('medicines').getAll({
            order: { column: 'name', ascending: true }
          });

          console.log(`Fetched ${fetchedMedicines.length} medicines from Supabase`);

          // No automatic creation of default medicines
          if (fetchedMedicines.length === 0) {
            console.log("No medicines found in database.");
            setMedicines([]);
          } else {
            console.log("Using existing medicines from database");
            // Apply capitalization to existing medicine names
            const processedMedicines = fetchedMedicines.map(med => ({
              ...med,
              name: capitalizeFirstLetter(med.name.trim()),
            }));
            setMedicines(processedMedicines);
          }
        } catch (tableError) {
          console.error("Error accessing medicines table:", tableError);

          // If the table doesn't exist or there's an error, use default medicines in memory
          console.log("Using default medicines in memory only");
          setMedicines(defaultMedicines.map((med, index) => ({
            ...med,
            id: `default-medicine-${index + 1}`
          })));

          toast({
            title: 'Database Setup Required',
            description: 'Using default medicines. Please set up the database for full functionality.',
            variant: 'destructive',
          });
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
      // Capitalize medicine name before saving
      const processedMedicine = {
        ...medicine,
        name: capitalizeFirstLetter(medicine.name.trim()),
      };

      console.log('Adding medicine to database:', processedMedicine);

      // Add medicine to Supabase
      const newMedicine = await supabase.from<Medicine>('medicines').insert(processedMedicine);

      console.log('Medicine added to database, response:', newMedicine);

      // Fetch all medicines to ensure we have the latest data
      // This is a workaround for the issue where the UI doesn't update immediately
      console.log('Fetching all medicines to refresh the state');
      const refreshedMedicines = await supabase.from<Medicine>('medicines').getAll({
        order: { column: 'name', ascending: true }
      });

      console.log(`Fetched ${refreshedMedicines.length} medicines after adding new one`);

      // Update local state with all medicines
      setMedicines(refreshedMedicines);

      // Log audit action for medicine creation
      try {
        await logAction(AuditLogTemplates.medicine.create(
          newMedicine.id,
          processedMedicine.name,
          processedMedicine.dosage,
          processedMedicine.description
        ));
      } catch (auditError) {
        console.error('Failed to log medicine creation audit:', auditError);
      }

      toast({
        title: 'Success',
        description: `${processedMedicine.name} (${processedMedicine.dosage}) added successfully.`,
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
      console.log('Updating medicine in database:', id, updates);

      // Get the existing medicine data for audit logging
      const existingMedicine = medicines.find(m => m.id === id);
      if (!existingMedicine) {
        throw new Error('Medicine not found');
      }

      // Capitalize medicine name if it's being updated
      const processedUpdates = {
        ...updates,
        ...(updates.name ? { name: capitalizeFirstLetter(updates.name.trim()) } : {}),
      };

      // Update medicine in Supabase
      const updatedMedicine = await supabase.from<Medicine>('medicines').update(id, processedUpdates);

      console.log('Medicine updated in database, response:', updatedMedicine);

      // Fetch all medicines to ensure we have the latest data
      // This is a workaround for the issue where the UI doesn't update immediately
      console.log('Fetching all medicines to refresh the state');
      const refreshedMedicines = await supabase.from<Medicine>('medicines').getAll({
        order: { column: 'name', ascending: true }
      });

      console.log(`Fetched ${refreshedMedicines.length} medicines after updating`);

      // Update local state with all medicines
      setMedicines(refreshedMedicines);

      // Log audit action for medicine update
      try {
        const afterMedicine = { ...existingMedicine, ...updates };
        await logAction(AuditLogTemplates.medicine.update(
          id,
          afterMedicine.name || existingMedicine.name,
          {
            before: existingMedicine,
            after: afterMedicine
          }
        ));
      } catch (auditError) {
        console.error('Failed to log medicine update audit:', auditError);
      }

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
      console.log('Deleting medicine from database:', id);

      // Get the existing medicine data for audit logging
      const existingMedicine = medicines.find(m => m.id === id);
      if (!existingMedicine) {
        throw new Error('Medicine not found');
      }

      // Delete medicine from Supabase
      await supabase.from<Medicine>('medicines').delete(id);

      console.log('Medicine deleted from database');

      // Fetch all medicines to ensure we have the latest data
      // This is a workaround for the issue where the UI doesn't update immediately
      console.log('Fetching all medicines to refresh the state');
      const refreshedMedicines = await supabase.from<Medicine>('medicines').getAll({
        order: { column: 'name', ascending: true }
      });

      console.log(`Fetched ${refreshedMedicines.length} medicines after deletion`);

      // Update local state with all medicines
      setMedicines(refreshedMedicines);

      // Log audit action for medicine deletion
      try {
        await logAction(AuditLogTemplates.medicine.delete(
          id,
          existingMedicine.name,
          existingMedicine.dosage,
          existingMedicine.description
        ));
      } catch (auditError) {
        console.error('Failed to log medicine deletion audit:', auditError);
      }

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
