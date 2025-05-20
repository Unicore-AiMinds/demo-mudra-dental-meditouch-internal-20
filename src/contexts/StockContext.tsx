import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { useStockDefinitions, StockDefinition } from '@/contexts/StockDefinitionsContext';

export interface StockItem {
  id: string;
  name: string;
  sub_item?: string;
  item_type: 'Consumable' | 'Inventory';
  dealer?: string;
  rate?: number; // Price/rate per unit
  description: string;
  unit: string;
  current_quantity: number;
  minimum_threshold: number;
  nearest_expiry_date?: string;
  created_at: string; // Date when the item was added to inventory
}



interface StockContextType {
  stockItems: StockItem[];
  isLoading: boolean;
  addStockItem: (item: Omit<StockItem, 'id' | 'created_at'>) => Promise<StockItem>;
  updateStockItem: (id: string, item: Partial<StockItem>) => Promise<StockItem>;
  deleteStockItem: (id: string) => Promise<void>;
  isLowStock: (item: StockItem) => boolean;
  isExpiringSoon: (item: StockItem) => boolean;
  isExpired: (item: StockItem) => boolean;
  getLowStockItems: () => StockItem[];
  getExpiredItems: () => StockItem[];
  getExpiringSoonItems: () => StockItem[];
  getStockDefinitionByName: (name: string) => StockDefinition | undefined;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const { stockDefinitions } = useStockDefinitions();

  // Fetch stock items from Supabase
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        setIsLoading(true);

        // For older Supabase versions, we need to use getAll with options
        const data = await supabase.from('stock_items').getAll({
          order: { column: 'created_at', ascending: false }
        });

        setStockItems(data as StockItem[] || []);
      } catch (error: unknown) {
        console.error('Error fetching stock items:', error);
        toast({
          title: 'Error',
          description: 'Failed to load stock items. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockItems();
  }, [supabase, toast]);

  // Add a new stock item
  const addStockItem = async (item: Omit<StockItem, 'id' | 'created_at'>): Promise<StockItem> => {
    try {
      // First insert the data
      const insertedItem = await supabase
        .from('stock_items')
        .insert(item);

      // Check if there was an error with the insert
      if (!insertedItem) {
        throw new Error('Failed to insert stock item');
      }

      // Then fetch the newly inserted data
      // For older Supabase versions, we need to use getAll with filters
      const fetchedData = await supabase.from('stock_items').getAll({
        filters: { name: item.name },
        order: { column: 'created_at', ascending: false },
        limit: 1
      }) as StockItem[];

      // Get the first item (most recently created)
      const data = fetchedData.length > 0 ? fetchedData[0] : null;
      const fetchError = !data ? new Error('Failed to fetch newly created item') : null;

      if (fetchError) {
        throw fetchError;
      }

      // Update local state
      setStockItems(prev => [data as StockItem, ...prev]);

      toast({
        title: 'Success',
        description: `${item.name} added to stock successfully.`,
      });

      return data as StockItem;
    } catch (error: unknown) {
      console.error('Error adding stock item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add stock item. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a stock item
  const updateStockItem = async (id: string, item: Partial<StockItem>): Promise<StockItem> => {
    try {
      // First update the data
      const updatedData = await supabase
        .from('stock_items')
        .update(id, item);

      // In older Supabase versions, update returns the updated data directly
      // If it's an array with data, use the first item
      let data: StockItem | null = null;
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        data = updatedData[0] as StockItem;
      } else if (!Array.isArray(updatedData) && updatedData) {
        // If it's a single object
        data = updatedData as StockItem;
      } else {
        // If no data was returned, fetch it
        data = await supabase.from('stock_items').getById(id) as StockItem;
      }

      const fetchError = !data ? new Error('Failed to fetch updated item') : null;

      if (fetchError) {
        throw fetchError;
      }

      // Update local state
      setStockItems(prev =>
        prev.map(i => i.id === id ? { ...i, ...(data as StockItem) } : i)
      );

      toast({
        title: 'Success',
        description: 'Stock item updated successfully.',
      });

      return data as StockItem;
    } catch (error: unknown) {
      console.error('Error updating stock item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock item. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a stock item
  const deleteStockItem = async (id: string): Promise<void> => {
    try {
      // Delete stock item from Supabase
      await supabase
        .from('stock_items')
        .delete(id);

      // Update local state
      setStockItems(prev => prev.filter(i => i.id !== id));

      toast({
        title: 'Success',
        description: 'Stock item deleted successfully.',
      });
    } catch (error: unknown) {
      console.error('Error deleting stock item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete stock item. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Check if item is low on stock
  const isLowStock = (item: StockItem) => item.current_quantity <= item.minimum_threshold;

  // Check if item is expiring soon (within 60 days)
  const isExpiringSoon = (item: StockItem) => {
    if (!item.nearest_expiry_date) return false;

    const expiryDate = new Date(item.nearest_expiry_date);
    const today = new Date();

    // Calculate the difference in days
    const differenceInTime = expiryDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    // Return true if expiring within 60 days but not expired yet
    return differenceInDays > 0 && differenceInDays <= 60;
  };

  // Check if item is expired (expiry date is today or in the past)
  const isExpired = (item: StockItem) => {
    if (!item.nearest_expiry_date) return false;

    const expiryDate = new Date(item.nearest_expiry_date);
    const today = new Date();

    // Set both dates to midnight to compare just the dates
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Return true if expiry date is today or in the past
    return expiryDate <= today;
  };

  // Get all low stock items
  const getLowStockItems = () => stockItems.filter(item => isLowStock(item));

  // Get all expired items
  const getExpiredItems = () => stockItems.filter(item => isExpired(item));

  // Get all items expiring soon
  const getExpiringSoonItems = () => stockItems.filter(item => isExpiringSoon(item) && !isExpired(item));

  // Get stock definition by name
  const getStockDefinitionByName = (name: string) => {
    return stockDefinitions.find(def => def.name === name);
  };

  return (
    <StockContext.Provider
      value={{
        stockItems,
        isLoading,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        isLowStock,
        isExpiringSoon,
        isExpired,
        getLowStockItems,
        getExpiredItems,
        getExpiringSoonItems,
        getStockDefinitionByName
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
