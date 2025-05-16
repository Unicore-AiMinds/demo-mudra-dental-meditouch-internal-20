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
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: '1',
      name: 'Dental Composite',
      sub_item: 'Filtek Supreme Ultra',
      item_type: 'Consumable',
      dealer: 'Dental Depot',
      rate: 2500,
      description: 'Light-cured restorative material',
      unit: 'syringe',
      current_quantity: 8,
      minimum_threshold: 5,
      nearest_expiry_date: '2025-04-15',
      created_at: '2025-05-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Impression Material',
      sub_item: 'Jeltrate Plus',
      item_type: 'Consumable',
      dealer: 'Henry Schein',
      rate: 1200,
      description: 'Alginate impression material',
      unit: 'pack',
      current_quantity: 3,
      minimum_threshold: 4,
      nearest_expiry_date: '2025-05-01',
      created_at: '2025-05-02T11:30:00Z'
    },
    {
      id: '3',
      name: 'Orthodontic Wire',
      sub_item: 'Ormco NiTi',
      item_type: 'Inventory',
      dealer: 'Ormco Direct',
      rate: 800,
      description: 'Nickel titanium archwires',
      unit: 'piece',
      current_quantity: 15,
      minimum_threshold: 6,
      created_at: '2025-05-03T09:15:00Z'
    },
    {
      id: '4',
      name: 'Dental Cement',
      sub_item: 'GC Fuji II LC',
      item_type: 'Consumable',
      dealer: 'GC India',
      rate: 1800,
      description: 'Light-cured glass ionomer cement',
      unit: 'kit',
      current_quantity: 2,
      minimum_threshold: 3,
      nearest_expiry_date: '2025-04-30',
      created_at: '2025-05-04T14:45:00Z'
    },
    {
      id: '5',
      name: 'Dental Burs',
      sub_item: 'Mani Diamond',
      item_type: 'Inventory',
      dealer: 'Mani Inc',
      rate: 300,
      description: 'Diamond dental burs',
      unit: 'piece',
      current_quantity: 25,
      minimum_threshold: 10,
      created_at: '2025-05-05T16:20:00Z'
    },
    {
      id: '6',
      name: 'Local Anesthetic',
      subItem: 'Lignocaine 2%',
      itemType: 'Consumable',
      dealer: 'Patterson Dental',
      rate: 950,
      description: 'Local anesthetic solution',
      unit: 'box',
      currentQuantity: 4,
      minimumThreshold: 5,
      nearestExpiryDate: '2025-07-01',
      createdAt: '2025-05-06T13:10:00Z'
    },
    {
      id: '7',
      name: 'Bonding Agent',
      subItem: '3M Single Bond',
      itemType: 'Consumable',
      dealer: '3M Healthcare',
      rate: 1500,
      description: 'Dental bonding agent',
      unit: 'bottle',
      currentQuantity: 6,
      minimumThreshold: 4,
      nearestExpiryDate: '2026-01-15',
      createdAt: '2025-05-07T15:30:00Z'
    }
  ]);
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
