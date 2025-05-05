import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StockItem {
  id: string;
  name: string;
  subItem?: string;
  itemType: 'Consumable' | 'Inventory';
  dealer?: string;
  rate?: number; // Price/rate per unit
  description: string;
  unit: string;
  currentQuantity: number;
  minimumThreshold: number;
  nearestExpiryDate?: string;
  createdAt: string; // Date when the item was added to inventory
}

// Initial stock items
const initialStockItems: StockItem[] = [
  {
    id: '1',
    name: 'Dental Composite',
    subItem: 'Filtek Supreme Ultra',
    itemType: 'Consumable',
    dealer: 'Dental Depot',
    rate: 1250,
    description: 'A2 Shade - Universal',
    unit: 'syringe',
    currentQuantity: 2,
    minimumThreshold: 5,
    nearestExpiryDate: '2025-08-15',
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    name: 'Impression Material',
    subItem: 'Jeltrate Plus',
    itemType: 'Consumable',
    dealer: 'Henry Schein',
    rate: 850,
    description: 'Alginate - Medium Set',
    unit: 'pack',
    currentQuantity: 3,
    minimumThreshold: 5,
    nearestExpiryDate: '2025-06-30',
    createdAt: '2023-10-16',
  },
  {
    id: '3',
    name: 'Orthodontic Wire',
    subItem: 'Ormco NiTi',
    itemType: 'Inventory',
    dealer: 'Ormco Direct',
    rate: 3200,
    description: '0.016 inch - NiTi',
    unit: 'spool',
    currentQuantity: 4,
    minimumThreshold: 6,
    createdAt: '2023-10-10',
  },
  {
    id: '8',
    name: 'Disposable Gloves',
    subItem: 'Latex Free',
    itemType: 'Consumable',
    dealer: 'Dental Depot',
    rate: 450,
    description: 'Medium size - Powder free',
    unit: 'box',
    currentQuantity: 10,
    minimumThreshold: 5,
    nearestExpiryDate: '2023-10-15', // Expired item
    createdAt: '2023-08-01',
  },
  {
    id: '9',
    name: 'Dental Floss',
    subItem: 'Waxed',
    itemType: 'Consumable',
    dealer: 'GC India',
    rate: 120,
    description: 'Mint flavored',
    unit: 'pack',
    currentQuantity: 3,
    minimumThreshold: 5, // Low stock item
    nearestExpiryDate: '2024-01-20', // Expired item (assuming current date is after this)
    createdAt: '2023-07-15',
  },
  {
    id: '10',
    name: 'Dental Sealant',
    subItem: 'Light Cure',
    itemType: 'Consumable',
    dealer: 'Henry Schein',
    rate: 850,
    description: 'Clear - For pits and fissures',
    unit: 'syringe',
    currentQuantity: 8,
    minimumThreshold: 4,
    // Calculate a date that's 30 days from now for "expiring soon"
    nearestExpiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    createdAt: '2023-09-05',
  },
];

interface StockContextType {
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  isLowStock: (item: StockItem) => boolean;
  isExpiringSoon: (item: StockItem) => boolean;
  isExpired: (item: StockItem) => boolean;
  getLowStockItems: () => StockItem[];
  getExpiredItems: () => StockItem[];
  getExpiringSoonItems: () => StockItem[];
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);

  // Check if item is low on stock
  const isLowStock = (item: StockItem) => item.currentQuantity <= item.minimumThreshold;

  // Check if item is expiring soon (within 60 days)
  const isExpiringSoon = (item: StockItem) => {
    if (!item.nearestExpiryDate) return false;

    const expiryDate = new Date(item.nearestExpiryDate);
    const today = new Date();

    // Calculate the difference in days
    const differenceInTime = expiryDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    // Return true if expiring within 60 days but not expired yet
    return differenceInDays > 0 && differenceInDays <= 60;
  };

  // Check if item is expired (expiry date is today or in the past)
  const isExpired = (item: StockItem) => {
    if (!item.nearestExpiryDate) return false;

    const expiryDate = new Date(item.nearestExpiryDate);
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
        setStockItems,
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
