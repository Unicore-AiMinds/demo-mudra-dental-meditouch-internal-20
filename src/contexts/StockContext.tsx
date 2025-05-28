import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { useStockDefinitions, StockDefinition } from '@/contexts/StockDefinitionsContext';
import { format } from 'date-fns';

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

export interface StockBatch {
  id: string;
  stock_item_id: string;
  batch_number?: string;
  quantity_received: number;
  current_quantity: number;
  expiry_date?: string;
  received_date: string;
  cost_per_unit?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  stock_item_id: string;
  batch_id?: string;
  transaction_type: 'incoming' | 'outgoing';
  quantity: number;
  remaining_quantity: number;
  transaction_date: string;
  performed_by?: string;
  purpose?: string;
  notes?: string;
  created_at: string;
  // Note: updated_at is not included in the database schema
}

export interface IncomingStockData {
  quantity_received: number;
  expiry_date?: string;
  batch_number?: string;
  received_date: string;
  cost_per_unit?: number;
  performed_by?: string;
  notes?: string;
}

export interface ConsumeStockData {
  quantity: number;
  transaction_date: string;
  performed_by?: string;
  purpose?: string;
  notes?: string;
  specific_batch_id?: string; // Optional: to consume from a specific batch
}


export interface StockContextType {
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

  // Batch management
  getBatchesForStockItem: (stockItemId: string) => Promise<StockBatch[]>;
  getTransactionsForStockItem: (stockItemId: string) => Promise<StockTransaction[]>;
  recordIncomingStock: (stockItemId: string, data: IncomingStockData) => Promise<void>;
  recordStockConsumption: (stockItemId: string, data: ConsumeStockData) => Promise<void>;
}

export const StockContext = createContext<StockContextType | undefined>(undefined);

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

      // Create an initial batch record for the stock if quantity > 0
      if (item.current_quantity > 0) {
        try {
          // Create a batch record for the initial stock
          await supabase.from('stock_batches').insert({
            stock_item_id: data.id,
            batch_number: null, // No batch number for initial stock
            quantity_received: item.current_quantity,
            current_quantity: item.current_quantity,
            expiry_date: item.nearest_expiry_date,
            received_date: new Date().toISOString().split('T')[0], // Today's date
            cost_per_unit: item.rate,
            notes: 'Initial stock entry'
          });

          // Create a transaction record for the initial stock
          await supabase.from('stock_transactions').insert({
            stock_item_id: data.id,
            batch_id: null, // Will be updated after we get the batch ID
            transaction_type: 'incoming',
            quantity: item.current_quantity,
            remaining_quantity: item.current_quantity,
            transaction_date: new Date().toISOString().split('T')[0],
            performed_by: 'System',
            purpose: 'Initial Stock Entry',
            notes: 'Initial stock entry when item was created'
          });

          // Get the newly created batch to update the transaction with batch_id
          const batches = await supabase.from('stock_batches').getAll({
            filters: { stock_item_id: data.id },
            order: { column: 'created_at', ascending: false },
            limit: 1
          });

          if (batches.length > 0) {
            const newBatch = batches[0] as StockBatch;

            // Update the transaction with the correct batch_id
            const transactions = await supabase.from('stock_transactions').getAll({
              filters: { stock_item_id: data.id, batch_id: null },
              order: { column: 'created_at', ascending: false },
              limit: 1
            });

            if (transactions.length > 0) {
              await supabase.from('stock_transactions').update(transactions[0].id, {
                batch_id: newBatch.id
              });
            }
          }
        } catch (batchError) {
          console.error('Error creating initial batch record:', batchError);
          // Don't throw here - the stock item was created successfully
          // Just log the error and continue
        }
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

  // Priority-based status functions to avoid logical conflicts
  const isOutOfStock = (item: StockItem) => item.current_quantity === 0;
  const isLowStock = (item: StockItem) => item.current_quantity > 0 && item.current_quantity <= item.minimum_threshold;

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

  // Check if item is expiring soon (within 60 days) - only if not out of stock or expired
  const isExpiringSoon = (item: StockItem) => {
    if (!item.nearest_expiry_date || isOutOfStock(item) || isExpired(item)) return false;

    const expiryDate = new Date(item.nearest_expiry_date);
    const today = new Date();

    // Calculate the difference in days
    const differenceInTime = expiryDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    // Return true if expiring within 60 days but not expired yet
    return differenceInDays > 0 && differenceInDays <= 60;
  };

  // Get items by priority-based status (no overlapping categories)
  const getLowStockItems = () => stockItems.filter(item => {
    const primaryStatus = getPrimaryStatus(item);
    return primaryStatus === 'low';
  });

  const getExpiredItems = () => stockItems.filter(item => {
    const primaryStatus = getPrimaryStatus(item);
    return primaryStatus === 'expired';
  });

  const getExpiringSoonItems = () => stockItems.filter(item => {
    const primaryStatus = getPrimaryStatus(item);
    return primaryStatus === 'expiring';
  });

  // Get primary status for an item (priority-based, only one status)
  const getPrimaryStatus = (item: StockItem) => {
    if (isOutOfStock(item)) return 'outofstock';
    if (isExpired(item)) return 'expired';
    if (isExpiringSoon(item)) return 'expiring';
    if (isLowStock(item)) return 'low';
    return 'normal';
  };

  // Get stock definition by name
  const getStockDefinitionByName = (name: string) => {
    return stockDefinitions.find(def => def.name === name);
  };

  // Get all batches for a specific stock item
  const getBatchesForStockItem = async (stockItemId: string): Promise<StockBatch[]> => {
    try {
      const data = await supabase.from('stock_batches').getAll({
        filters: { stock_item_id: stockItemId },
        order: { column: 'expiry_date', ascending: true }
      });
      return data as StockBatch[] || [];
    } catch (error) {
      console.error('Error fetching stock batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stock batches. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Get all transactions for a specific stock item
  const getTransactionsForStockItem = async (stockItemId: string): Promise<StockTransaction[]> => {
    try {
      const data = await supabase.from('stock_transactions').getAll({
        filters: { stock_item_id: stockItemId },
        order: { column: 'created_at', ascending: false }
      });
      return data as StockTransaction[] || [];
    } catch (error) {
      console.error('Error fetching stock transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stock transactions. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Record incoming stock
  const recordIncomingStock = async (stockItemId: string, data: IncomingStockData): Promise<void> => {
    try {
      // 1. Create a new batch record
      const { error: batchError } = await supabase.from('stock_batches').insert({
        stock_item_id: stockItemId,
        batch_number: data.batch_number,
        quantity_received: data.quantity_received,
        current_quantity: data.quantity_received, // Initially, current quantity equals received quantity
        expiry_date: data.expiry_date,
        received_date: data.received_date,
        cost_per_unit: data.cost_per_unit,
        notes: data.notes
      });

      if (batchError) throw batchError;

      // 2. Get the newly created batch to get its ID
      const batches = await supabase.from('stock_batches').getAll({
        filters: { stock_item_id: stockItemId },
        order: { column: 'created_at', ascending: false },
        limit: 1
      });

      const newBatch = batches[0] as StockBatch;

      // 3. Create a transaction record
      const { error: transactionError } = await supabase.from('stock_transactions').insert({
        stock_item_id: stockItemId,
        batch_id: newBatch.id,
        transaction_type: 'incoming',
        quantity: data.quantity_received,
        remaining_quantity: data.quantity_received,
        transaction_date: data.received_date,
        performed_by: data.performed_by || '',
        purpose: 'Stock Addition',
        notes: data.notes
      });

      if (transactionError) throw transactionError;

      // 4. Update the stock item's current quantity and nearest expiry date
      const stockItem = stockItems.find(item => item.id === stockItemId);
      if (stockItem) {
        const newQuantity = stockItem.current_quantity + data.quantity_received;

        // Get all batches to determine the nearest expiry date
        const allBatches = await getBatchesForStockItem(stockItemId);
        const validExpiryBatches = allBatches.filter(batch =>
          batch.expiry_date && batch.current_quantity > 0
        );

        // Sort by expiry date to find the earliest
        validExpiryBatches.sort((a, b) => {
          if (!a.expiry_date) return 1;
          if (!b.expiry_date) return -1;
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        });

        const nearestExpiryDate = validExpiryBatches.length > 0 ? validExpiryBatches[0].expiry_date : undefined;

        await updateStockItem(stockItemId, {
          current_quantity: newQuantity,
          nearest_expiry_date: nearestExpiryDate
        });
      }

      toast({
        title: 'Stock Updated',
        description: `Successfully recorded incoming stock of ${data.quantity_received} units.`,
      });
    } catch (error) {
      console.error('Error recording incoming stock:', error);
      // Don't show toast for validation errors - let the component handle them
      // Only show toast for actual system errors
      if (error instanceof Error &&
          !error.message.includes('validation') &&
          !error.message.includes('required')) {
        toast({
          title: 'Error',
          description: 'Failed to record incoming stock. Please try again.',
          variant: 'destructive',
        });
      }
      throw error;
    }
  };

  // Record stock consumption (FEFO - First Expiry, First Out)
  const recordStockConsumption = async (stockItemId: string, data: ConsumeStockData): Promise<void> => {
    try {
      // Get the stock item
      const stockItem = stockItems.find(item => item.id === stockItemId);
      if (!stockItem) {
        throw new Error('Stock item not found');
      }

      // Get all batches for this stock item to calculate actual available quantity
      const allBatches = await getBatchesForStockItem(stockItemId);
      const totalAvailableQuantity = allBatches.reduce((total, batch) => total + batch.current_quantity, 0);

      // Handle case where no batches exist but main stock has quantity (legacy data or failed batch creation)
      if (allBatches.length === 0 && stockItem.current_quantity > 0) {
        console.warn(`No batches found for stock item ${stockItemId} but main stock shows ${stockItem.current_quantity}. Creating emergency batch.`);

        // Create an emergency batch for the existing stock
        try {
          await supabase.from('stock_batches').insert({
            stock_item_id: stockItemId,
            batch_number: null,
            quantity_received: stockItem.current_quantity,
            current_quantity: stockItem.current_quantity,
            expiry_date: stockItem.nearest_expiry_date,
            received_date: new Date().toISOString().split('T')[0],
            cost_per_unit: stockItem.rate || 0,
            notes: 'Emergency batch created for existing stock without batches'
          });

          // Re-fetch batches after creating the emergency batch
          const updatedBatches = await getBatchesForStockItem(stockItemId);
          const updatedTotalQuantity = updatedBatches.reduce((total, batch) => total + batch.current_quantity, 0);

          console.log(`Emergency batch created. Updated total quantity: ${updatedTotalQuantity}`);
        } catch (batchError) {
          console.error('Failed to create emergency batch:', batchError);
          // Continue with consumption using main stock quantity as fallback
        }
      }

      // Re-calculate total available quantity after potential emergency batch creation
      const finalBatches = await getBatchesForStockItem(stockItemId);
      const finalTotalQuantity = finalBatches.reduce((total, batch) => total + batch.current_quantity, 0);

      // Check if there's enough stock (use main stock quantity as fallback if no batches)
      const availableQuantity = finalBatches.length > 0 ? finalTotalQuantity : stockItem.current_quantity;

      if (availableQuantity < data.quantity) {
        throw new Error(`Insufficient stock available. Only ${availableQuantity} units remaining. (Requested: ${data.quantity}, Available: ${availableQuantity})`);
      }

      // Debug logging to help identify discrepancies
      if (finalTotalQuantity !== stockItem.current_quantity && finalBatches.length > 0) {
        console.warn(`Stock quantity mismatch for item ${stockItemId}: Main stock shows ${stockItem.current_quantity}, but batches total ${finalTotalQuantity}`);
      }

      let remainingToConsume = data.quantity;
      const transactionRecords = [];

      // If a specific batch is specified, consume from that batch first
      if (data.specific_batch_id) {
        const specificBatch = (await getBatchesForStockItem(stockItemId))
          .find(batch => batch.id === data.specific_batch_id);

        if (!specificBatch) {
          throw new Error('The selected batch could not be found. Please choose a different batch.');
        }

        if (specificBatch.current_quantity < data.quantity) {
          throw new Error(`Insufficient stock in selected batch. Only ${specificBatch.current_quantity} units available.`);
        }

        if (specificBatch && specificBatch.current_quantity > 0) {
          const consumeAmount = Math.min(specificBatch.current_quantity, remainingToConsume);

          // Update the batch
          try {
            await supabase.from('stock_batches').update(specificBatch.id, {
              current_quantity: specificBatch.current_quantity - consumeAmount
            });
          } catch (error) {
            console.error('Error updating batch:', error);
            throw error;
          }

          // Create transaction record
          transactionRecords.push({
            stock_item_id: stockItemId,
            batch_id: specificBatch.id,
            transaction_type: 'outgoing',
            quantity: consumeAmount,
            remaining_quantity: specificBatch.current_quantity - consumeAmount,
            transaction_date: data.transaction_date,
            performed_by: data.performed_by,
            purpose: data.purpose,
            notes: data.notes
          });

          remainingToConsume -= consumeAmount;
        }
      }

      // If we still have quantity to consume, follow FEFO
      if (remainingToConsume > 0) {
        // Get all batches with stock, sorted by expiry date (FEFO)
        const batches = (await getBatchesForStockItem(stockItemId))
          .filter(batch => batch.current_quantity > 0)
          .sort((a, b) => {
            // Sort by expiry date (null/undefined dates go last)
            if (!a.expiry_date) return 1;
            if (!b.expiry_date) return -1;
            return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
          });

        if (batches.length === 0 && remainingToConsume > 0) {
          // No batches available but we still need to consume - this shouldn't happen after emergency batch creation
          // But as a final fallback, create a transaction without a batch
          console.warn(`No batches available for consumption, creating transaction without batch for ${remainingToConsume} units`);

          transactionRecords.push({
            stock_item_id: stockItemId,
            batch_id: null, // No batch available
            transaction_type: 'outgoing',
            quantity: remainingToConsume,
            remaining_quantity: stockItem.current_quantity - remainingToConsume,
            transaction_date: data.transaction_date,
            performed_by: data.performed_by,
            purpose: data.purpose,
            notes: `${data.notes} (No batch available - emergency consumption)`
          });

          remainingToConsume = 0;
        } else {
          // Consume from batches in FEFO order
          for (const batch of batches) {
            if (remainingToConsume <= 0) break;

            // Skip the specific batch if it was already processed
            if (data.specific_batch_id && batch.id === data.specific_batch_id) continue;

            const consumeAmount = Math.min(batch.current_quantity, remainingToConsume);

            // Update the batch
            try {
              await supabase.from('stock_batches').update(batch.id, {
                current_quantity: batch.current_quantity - consumeAmount
              });
            } catch (error) {
              console.error('Error updating batch:', error);
              throw error;
            }

            // Create transaction record
            transactionRecords.push({
              stock_item_id: stockItemId,
              batch_id: batch.id,
              transaction_type: 'outgoing',
              quantity: consumeAmount,
              remaining_quantity: batch.current_quantity - consumeAmount,
              transaction_date: data.transaction_date,
              performed_by: data.performed_by,
              purpose: data.purpose,
              notes: data.notes
            });

            remainingToConsume -= consumeAmount;
          }
        }
      }

      // Insert all transaction records
      for (const record of transactionRecords) {
        try {
          await supabase.from('stock_transactions').insert(record);
        } catch (error) {
          console.error('Error inserting transaction record:', error);
          throw error;
        }
      }

      // Update the stock item's current quantity and nearest expiry date
      const newQuantity = stockItem.current_quantity - data.quantity;

      // Get all batches to determine the nearest expiry date
      const updatedBatches = await getBatchesForStockItem(stockItemId);
      const validExpiryBatches = updatedBatches.filter(batch =>
        batch.expiry_date && batch.current_quantity > 0
      );

      // Sort by expiry date to find the earliest
      validExpiryBatches.sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });

      const nearestExpiryDate = validExpiryBatches.length > 0 ? validExpiryBatches[0].expiry_date : undefined;

      await updateStockItem(stockItemId, {
        current_quantity: newQuantity,
        nearest_expiry_date: nearestExpiryDate
      });

      toast({
        title: 'Stock Updated',
        description: `Successfully recorded consumption of ${data.quantity} units.`,
      });
    } catch (error) {
      console.error('Error recording stock consumption:', error);
      // Don't show toast for validation errors - let the component handle them
      // Only show toast for actual system errors
      if (error instanceof Error &&
          !error.message.includes('Insufficient stock') &&
          !error.message.includes('batch')) {
        toast({
          title: 'Error',
          description: 'Failed to record stock consumption. Please try again.',
          variant: 'destructive',
        });
      }
      throw error;
    }
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
        getStockDefinitionByName,
        getBatchesForStockItem,
        getTransactionsForStockItem,
        recordIncomingStock,
        recordStockConsumption
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

// useStock hook moved to src/hooks/use-stock.ts
