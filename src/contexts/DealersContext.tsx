import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';

// Define the Dealer interface
export interface Dealer {
  id: string;
  name: string;
  email: string | null;
  contact: string;
  address: string | null;
  city: string | null;
  pincode: string | null;
  created_at: string;
  updated_at: string;
}

// Define the context type
interface DealersContextType {
  dealers: Dealer[];
  isLoading: boolean;
  refreshDealers: () => Promise<void>;
  addDealer: (dealer: Omit<Dealer, 'id' | 'created_at' | 'updated_at'>) => Promise<Dealer>;
  updateDealer: (id: string, dealer: Partial<Dealer>) => Promise<Dealer>;
  deleteDealer: (id: string) => Promise<void>;
  getDealerById: (id: string) => Dealer | undefined;
  getDealerByName: (name: string) => Dealer | undefined;
}

// Create the context
const DealersContext = createContext<DealersContextType | undefined>(undefined);

// Provider component
export const DealersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch dealers from Supabase
  const fetchDealers = async () => {
    try {
      setIsLoading(true);
      
      // For older Supabase versions, we need to use getAll with options
      const data = await supabase.from('dealers').getAll({
        order: { column: 'created_at', ascending: false }
      });

      setDealers(data || []);
    } catch (error) {
      console.error('Error fetching dealers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dealers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDealers();
  }, []);

  // Add a new dealer
  const addDealer = async (
    dealer: Omit<Dealer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Dealer> => {
    try {
      // First insert the data
      const { error: insertError } = await supabase
        .from('dealers')
        .insert(dealer);

      if (insertError) {
        throw insertError;
      }

      // Then fetch the newly inserted data
      // For older Supabase versions, we need to use getAll with filters
      const fetchedData = await supabase.from('dealers').getAll({
        filters: { name: dealer.name },
        order: { column: 'created_at', ascending: false },
        limit: 1
      });
      
      // Get the first item (most recently created)
      const data = fetchedData.length > 0 ? fetchedData[0] : null;
      const fetchError = !data ? new Error('Failed to fetch newly created dealer') : null;

      if (fetchError) {
        throw fetchError;
      }

      // Update local state
      setDealers(prev => [data, ...prev]);

      toast({
        title: 'Success',
        description: `${dealer.name} added successfully.`,
      });

      return data;
    } catch (error) {
      console.error('Error adding dealer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add dealer. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a dealer
  const updateDealer = async (
    id: string,
    dealer: Partial<Dealer>
  ): Promise<Dealer> => {
    try {
      // For older Supabase versions, we need to use update with id as first parameter
      const updatedData = await supabase
        .from('dealers')
        .update(id, { ...dealer, updated_at: new Date().toISOString() });

      // In older Supabase versions, update returns the updated data directly
      // If it's an array with data, use the first item
      let data;
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        data = updatedData[0];
      } else if (!Array.isArray(updatedData) && updatedData) {
        // If it's a single object
        data = updatedData;
      } else {
        // If no data was returned, fetch it
        data = await supabase.from('dealers').getById(id);
      }
      
      const fetchError = !data ? new Error('Failed to fetch updated dealer') : null;

      if (fetchError) {
        throw fetchError;
      }

      // Update local state
      setDealers(prev =>
        prev.map(item => (item.id === id ? data : item))
      );

      toast({
        title: 'Success',
        description: 'Dealer updated successfully.',
      });

      return data;
    } catch (error) {
      console.error('Error updating dealer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update dealer. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a dealer
  const deleteDealer = async (id: string): Promise<void> => {
    try {
      // For older Supabase versions, we need to use delete with id as parameter
      const error = await supabase
        .from('dealers')
        .delete(id);

      if (error) {
        throw error;
      }

      // Update local state
      setDealers(prev => prev.filter(item => item.id !== id));

      toast({
        title: 'Success',
        description: 'Dealer deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting dealer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dealer. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Refresh dealers
  const refreshDealers = async (): Promise<void> => {
    await fetchDealers();
  };

  // Get dealer by ID
  const getDealerById = (id: string): Dealer | undefined => {
    return dealers.find(dealer => dealer.id === id);
  };

  // Get dealer by name
  const getDealerByName = (name: string): Dealer | undefined => {
    return dealers.find(dealer => dealer.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <DealersContext.Provider
      value={{
        dealers,
        isLoading,
        refreshDealers,
        addDealer,
        updateDealer,
        deleteDealer,
        getDealerById,
        getDealerByName
      }}
    >
      {children}
    </DealersContext.Provider>
  );
};

// Custom hook to use the dealers context
export const useDealers = () => {
  const context = useContext(DealersContext);
  if (context === undefined) {
    throw new Error('useDealers must be used within a DealersProvider');
  }
  return context;
};

export default DealersContext;
