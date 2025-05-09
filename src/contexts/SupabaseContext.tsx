import React, { createContext, useContext, ReactNode } from 'react';
import supabase from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

// Define the context type
interface SupabaseContextType {
  supabase: typeof supabase;
  // Helper functions for common operations
  fetchData: <T>(
    table: string,
    options?: {
      select?: string;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
      filters?: Record<string, any>;
    }
  ) => Promise<T[]>;
  getById: <T>(table: string, id: string | number, options?: { select?: string }) => Promise<T>;
  insertData: <T>(table: string, data: Partial<T>) => Promise<T>;
  updateData: <T>(table: string, id: string | number, data: Partial<T>) => Promise<T>;
  deleteData: (table: string, id: string | number) => Promise<void>;
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider component
export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // Helper function to fetch data with error handling
  const fetchData = async <T,>(
    table: string,
    options?: {
      select?: string;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
      filters?: Record<string, any>;
    }
  ): Promise<T[]> => {
    try {
      return await supabase.from<T>(table).getAll(options);
    } catch (error) {
      console.error(`Error fetching data from ${table}:`, error);
      toast({
        title: 'Error',
        description: `Failed to fetch data from ${table}. Please try again.`,
        variant: 'destructive',
      });
      return [];
    }
  };

  // Helper function to get a record by ID with error handling
  const getById = async <T,>(
    table: string,
    id: string | number,
    options?: { select?: string }
  ): Promise<T> => {
    try {
      return await supabase.from<T>(table).getById(id, options);
    } catch (error) {
      console.error(`Error fetching record from ${table}:`, error);
      toast({
        title: 'Error',
        description: `Failed to fetch record from ${table}. Please try again.`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Helper function to insert data with error handling
  const insertData = async <T,>(table: string, data: Partial<T>): Promise<T> => {
    try {
      const result = await supabase.from<T>(table).insert(data);
      toast({
        title: 'Success',
        description: `Record added successfully to ${table}.`,
      });
      return result;
    } catch (error) {
      console.error(`Error inserting data into ${table}:`, error);
      toast({
        title: 'Error',
        description: `Failed to add record to ${table}. Please try again.`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Helper function to update data with error handling
  const updateData = async <T,>(
    table: string,
    id: string | number,
    data: Partial<T>
  ): Promise<T> => {
    try {
      const result = await supabase.from<T>(table).update(id, data);
      toast({
        title: 'Success',
        description: `Record updated successfully in ${table}.`,
      });
      return result;
    } catch (error) {
      console.error(`Error updating data in ${table}:`, error);
      toast({
        title: 'Error',
        description: `Failed to update record in ${table}. Please try again.`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Helper function to delete data with error handling
  const deleteData = async (table: string, id: string | number): Promise<void> => {
    try {
      await supabase.from(table).delete(id);
      toast({
        title: 'Success',
        description: `Record deleted successfully from ${table}.`,
      });
    } catch (error) {
      console.error(`Error deleting data from ${table}:`, error);
      toast({
        title: 'Error',
        description: `Failed to delete record from ${table}. Please try again.`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        fetchData,
        getById,
        insertData,
        updateData,
        deleteData,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

// Custom hook to use the Supabase context
export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
