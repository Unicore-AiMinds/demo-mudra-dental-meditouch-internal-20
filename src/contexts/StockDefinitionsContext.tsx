import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { useClinic } from '@/contexts/ClinicContext';
import { AuditLogTemplates } from '@/utils/auditLogger';

export interface StockDefinition {
  id: string;
  name: string;
  sub_item?: string;
  description: string;
  item_type: 'Consumable' | 'Inventory';
  minimum_threshold: number;
  unit?: string;
  clinic_type?: 'dental' | 'meditouch' | 'both';
  created_at?: string;
  updated_at?: string;
}

interface StockDefinitionsContextType {
  stockDefinitions: StockDefinition[];
  isLoading: boolean;
  addStockDefinition: (definition: Omit<StockDefinition, 'id' | 'created_at' | 'updated_at'>) => Promise<StockDefinition>;
  updateStockDefinition: (id: string, definition: Partial<StockDefinition>) => Promise<StockDefinition>;
  deleteStockDefinition: (id: string) => Promise<void>;
  refreshStockDefinitions: () => Promise<void>;
}

const StockDefinitionsContext = createContext<StockDefinitionsContextType | undefined>(undefined);

export const useStockDefinitions = () => {
  const context = useContext(StockDefinitionsContext);
  if (!context) {
    throw new Error('useStockDefinitions must be used within a StockDefinitionsProvider');
  }
  return context;
};

export const StockDefinitionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allStockDefinitions, setAllStockDefinitions] = useState<StockDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const { activeClinic } = useClinic();
  const { logAction } = useAuditLog();

  // Filter stock definitions based on current clinic
  const stockDefinitions = React.useMemo(() => {
    if (activeClinic === 'dental' || activeClinic === 'meditouch') {
      return allStockDefinitions.filter(def => 
        def.clinic_type === activeClinic || def.clinic_type === 'both'
      );
    }
    return allStockDefinitions;
  }, [allStockDefinitions, activeClinic]);

  // Fetch stock definitions from Supabase
  const fetchStockDefinitions = async () => {
    try {
      setIsLoading(true);

      // Fetch all stock definitions using custom getAll method
      const data = await supabase.from('stock_item_definitions').getAll({
        order: { column: 'name', ascending: true }
      });

      setAllStockDefinitions(data || []);
    } catch (error) {
      console.error('Error fetching stock definitions:', error);
      toast({
        title: "Error",
        description: "Failed to load stock items. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStockDefinitions();
  }, []);

  // Add a new stock definition
  const addStockDefinition = async (
    definition: Omit<StockDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<StockDefinition> => {
    try {
      // Check for duplicate stock item (same name and sub_item with overlapping clinic_type)
      const duplicateItem = allStockDefinitions.find(existing => {
        const nameMatch = existing.name.trim().toLowerCase() === definition.name.trim().toLowerCase();
        const subItemMatch = (existing.sub_item || '').trim().toLowerCase() === (definition.sub_item || '').trim().toLowerCase();
        // Check clinic_type overlap: either one is 'both', or they match
        const clinicOverlap =
          existing.clinic_type === 'both' ||
          definition.clinic_type === 'both' ||
          existing.clinic_type === definition.clinic_type;
        return nameMatch && subItemMatch && clinicOverlap;
      });

      if (duplicateItem) {
        const subItemLabel = duplicateItem.sub_item ? ` (${duplicateItem.sub_item})` : '';
        throw new Error(
          `A stock item "${duplicateItem.name}${subItemLabel}" already exists for the selected clinic.`
        );
      }

      // First insert the data
      const { error: insertError } = await supabase
        .from('stock_item_definitions')
        .insert(definition);

      if (insertError) {
        throw insertError;
      }

      // Then fetch the newly inserted data using custom getAll method
      const fetchedData = await supabase.from('stock_item_definitions').getAll({
        filters: { name: definition.name },
        order: { column: 'created_at', ascending: false },
        limit: 1
      });
      
      // Get the first item (most recently created)
      const data = fetchedData && fetchedData.length > 0 ? fetchedData[0] : null;
      if (!data) {
        throw new Error('Failed to fetch newly created item');
      }

      // Update local state
      setAllStockDefinitions(prev => [...prev, data]);

      // Log audit action for stock definition creation
      try {
        const auditEntry = AuditLogTemplates.stock_definition.create(
          data.id,
          data.name,
          data.sub_item,
          data.item_type,
          data.description,
          data.unit || '',
          data.minimum_threshold,
          data.clinic_type
        );

        // Use the active clinic type for audit logging
        await logAction({ ...auditEntry, clinic_type: activeClinic });
      } catch (auditError) {
        console.error('Failed to log stock definition creation audit:', auditError);
      }

      toast({
        title: "Stock Item Added",
        description: `${definition.name}${definition.sub_item ? ` (${definition.sub_item})` : ''} has been added successfully.`,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Error adding stock definition:', error);
      toast({
        title: "Error",
        description: "Failed to add stock item. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update a stock definition
  const updateStockDefinition = async (
    id: string,
    definition: Partial<StockDefinition>
  ): Promise<StockDefinition> => {
    try {
      // Get the existing definition for audit logging
      const existingDefinition = stockDefinitions.find(def => def.id === id);
      if (!existingDefinition) {
        throw new Error('Stock definition not found');
      }

      // For older Supabase versions, we need to use update with id as first parameter
      const updatedData = await supabase
        .from('stock_item_definitions')
        .update(id, { ...definition, updated_at: new Date().toISOString() });

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
        data = await supabase.from('stock_item_definitions').getById(id);
      }

      const fetchError = !data ? new Error('Failed to fetch updated item') : null;

      if (fetchError) {
        throw fetchError;
      }

      // Create the updated definition object for comparison
      const updatedDefinition = { ...existingDefinition, ...definition };

      // Update local state
      setAllStockDefinitions(prev =>
        prev.map(item => (item.id === id ? data : item))
      );

      // Log audit action for stock definition update
      try {
        const auditEntry = AuditLogTemplates.stock_definition.update(
          id,
          existingDefinition.name,
          existingDefinition.sub_item,
          {
            before: existingDefinition,
            after: updatedDefinition
          }
        );

        // Use the active clinic type for audit logging
        await logAction({ ...auditEntry, clinic_type: activeClinic });
      } catch (auditError) {
        console.error('Failed to log stock definition update audit:', auditError);
      }

      toast({
        title: "Stock Item Updated",
        description: `${data.name}${data.sub_item ? ` (${data.sub_item})` : ''} has been updated successfully.`,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Error updating stock definition:', error);
      toast({
        title: "Error",
        description: "Failed to update stock item. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Delete a stock definition
  const deleteStockDefinition = async (id: string): Promise<void> => {
    try {
      // For older Supabase versions, we need to use delete with id as parameter
      const error = await supabase
        .from('stock_item_definitions')
        .delete(id);

      if (error) {
        throw error;
      }

      // Get the item before removing it from state
      const itemToDelete = stockDefinitions.find(item => item.id === id);
      if (!itemToDelete) {
        throw new Error('Stock definition not found');
      }

      // Update local state
      setAllStockDefinitions(prev => prev.filter(item => item.id !== id));

      // Log audit action for stock definition deletion
      try {
        const auditEntry = AuditLogTemplates.stock_definition.delete(
          id,
          itemToDelete.name,
          itemToDelete.sub_item,
          itemToDelete.item_type,
          itemToDelete.unit || '',
          itemToDelete.minimum_threshold,
          itemToDelete.description
        );

        // Use the active clinic type for audit logging
        await logAction({ ...auditEntry, clinic_type: activeClinic });
      } catch (auditError) {
        console.error('Failed to log stock definition deletion audit:', auditError);
      }

      toast({
        title: "Stock Item Deleted",
        description: `${itemToDelete?.name}${itemToDelete?.sub_item ? ` (${itemToDelete.sub_item})` : ''} has been deleted successfully.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting stock definition:', error);
      toast({
        title: "Error",
        description: "Failed to delete stock item. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Refresh stock definitions
  const refreshStockDefinitions = async (): Promise<void> => {
    await fetchStockDefinitions();
  };

  return (
    <StockDefinitionsContext.Provider
      value={{
        stockDefinitions,
        isLoading,
        addStockDefinition,
        updateStockDefinition,
        deleteStockDefinition,
        refreshStockDefinitions,
      }}
    >
      {children}
    </StockDefinitionsContext.Provider>
  );
};
