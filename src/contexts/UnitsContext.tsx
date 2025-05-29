import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';

export interface Unit {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface UnitsContextType {
  units: Unit[];
  isLoading: boolean;
  addUnit: (name: string) => Promise<Unit>;
  deleteUnit: (id: string) => Promise<void>;
  refreshUnits: () => Promise<void>;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};

export const UnitsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Default units to initialize if table is empty
  const defaultUnits = [
    'Piece', 'Pack', 'Box', 'Bottle', 'Jar', 'Tube', 'Syringe', 'Cartridge', 'Roll', 'Kit'
  ];

  // Fetch units from Supabase
  const fetchUnits = async () => {
    try {
      setIsLoading(true);

      // Try to fetch from database
      const data = await supabase.from('units').getAll({
        order: { column: 'name', ascending: true }
      });

      if (data && data.length > 0) {
        setUnits(data);
      } else {
        // Initialize with default units if table is empty
        await initializeDefaultUnits();
      }
    } catch (error) {
      console.error('Error fetching units:', error);

      // If table doesn't exist, create default units in memory
      const defaultUnitsData = defaultUnits.map((name, index) => ({
        id: `default-${index}`,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setUnits(defaultUnitsData);

      toast({
        title: "Database Setup Required",
        description: "Using default units. Please set up the database for full functionality.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize default units in database
  const initializeDefaultUnits = async () => {
    try {
      const unitsToInsert = defaultUnits.map(name => ({ name }));

      const { error } = await supabase
        .from('units')
        .insert(unitsToInsert);

      if (error) {
        throw error;
      }

      // Fetch the newly inserted units
      await fetchUnits();
    } catch (error) {
      console.error('Error initializing default units:', error);

      // Fallback to in-memory units
      const defaultUnitsData = defaultUnits.map((name, index) => ({
        id: `default-${index}`,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setUnits(defaultUnitsData);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnits();
  }, []);

  // Add a new unit
  const addUnit = async (name: string): Promise<Unit> => {
    try {
      // Check if unit already exists
      const existingUnit = units.find(unit => unit.name.toLowerCase() === name.toLowerCase());
      if (existingUnit) {
        throw new Error('Unit already exists');
      }

      // Insert into database using the custom Supabase client pattern
      const { error: insertError } = await supabase
        .from('units')
        .insert({ name });

      if (insertError) {
        throw insertError;
      }

      // Fetch the newly inserted unit
      const fetchedData = await supabase.from('units').getAll({
        filters: { name },
        order: { column: 'created_at', ascending: false },
        limit: 1
      });

      if (!fetchedData || fetchedData.length === 0) {
        throw new Error('Failed to fetch newly created unit');
      }

      const newUnit = fetchedData[0];
      setUnits(prev => [...prev, newUnit].sort((a, b) => a.name.localeCompare(b.name)));

      toast({
        title: "Unit Added",
        description: `Unit "${name}" has been added successfully.`
      });

      return newUnit;
    } catch (error) {
      console.error('Error adding unit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add unit';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  };

  // Delete a unit
  const deleteUnit = async (id: string): Promise<void> => {
    try {
      const unitToDelete = units.find(unit => unit.id === id);
      if (!unitToDelete) {
        throw new Error('Unit not found');
      }

      // Delete from database using the custom Supabase client pattern
      const error = await supabase
        .from('units')
        .delete(id);

      if (error) {
        throw error;
      }

      // Update local state
      setUnits(prev => prev.filter(unit => unit.id !== id));

      toast({
        title: "Unit Deleted",
        description: `Unit "${unitToDelete.name}" has been deleted successfully.`
      });
    } catch (error) {
      console.error('Error deleting unit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete unit';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  };

  // Refresh units
  const refreshUnits = async (): Promise<void> => {
    await fetchUnits();
  };

  return (
    <UnitsContext.Provider
      value={{
        units,
        isLoading,
        addUnit,
        deleteUnit,
        refreshUnits
      }}
    >
      {children}
    </UnitsContext.Provider>
  );
};
