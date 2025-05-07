import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';

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

// Default stock items for initialization
const defaultStockItems = [
  {
    name: 'Dental Composite',
    sub_item: 'Filtek Supreme Ultra',
    item_type: 'Consumable' as const,
    dealer: 'Dental Depot',
    rate: 1250,
    description: 'A2 Shade - Universal',
    unit: 'syringe',
    current_quantity: 2,
    minimum_threshold: 5,
    nearest_expiry_date: '2025-08-15',
  },
  {
    name: 'Impression Material',
    sub_item: 'Jeltrate Plus',
    item_type: 'Consumable' as const,
    dealer: 'Henry Schein',
    rate: 850,
    description: 'Alginate - Medium Set',
    unit: 'pack',
    current_quantity: 3,
    minimum_threshold: 5,
    nearest_expiry_date: '2025-06-30',
  },
  {
    name: 'Orthodontic Wire',
    sub_item: 'Ormco NiTi',
    item_type: 'Inventory' as const,
    dealer: 'Ormco Direct',
    rate: 3200,
    description: '0.016 inch - NiTi',
    unit: 'spool',
    current_quantity: 4,
    minimum_threshold: 6,
  }
];

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
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Fetch stock items from Supabase
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        setIsLoading(true);

        // Fetch stock items from Supabase
        const fetchedItems = await supabase.from<StockItem>('stock_items').getAll({
          order: { column: 'name', ascending: true }
        });

        // If no stock items exist, create default ones
        if (fetchedItems.length === 0) {
          for (const item of defaultStockItems) {
            await supabase.from<StockItem>('stock_items').insert(item);
          }

          // Fetch the newly created stock items
          const newItems = await supabase.from<StockItem>('stock_items').getAll({
            order: { column: 'name', ascending: true }
          });
          setStockItems(newItems);
        } else {
          setStockItems(fetchedItems);
        }
      } catch (error) {
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
      // Add stock item to Supabase
      const newItem = await supabase.from<StockItem>('stock_items').insert(item);

      // Update local state
      setStockItems(prev => [...prev, newItem]);

      toast({
        title: 'Success',
        description: `${item.name} added to stock successfully.`,
      });

      return newItem;
    } catch (error) {
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
      // Update stock item in Supabase
      const updatedItem = await supabase.from<StockItem>('stock_items').update(id, item);

      // Update local state
      setStockItems(prev =>
        prev.map(i => i.id === id ? { ...i, ...item } : i)
      );

      toast({
        title: 'Success',
        description: 'Stock item updated successfully.',
      });

      return updatedItem;
    } catch (error) {
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
      await supabase.from<StockItem>('stock_items').delete(id);

      // Update local state
      setStockItems(prev => prev.filter(i => i.id !== id));

      toast({
        title: 'Success',
        description: 'Stock item deleted successfully.',
      });
    } catch (error) {
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
        getExpiringSoonItems
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
