import React from 'react';
import { useStock } from '@/hooks/use-stock';

const StockAlertsAnalytics: React.FC = () => {
  const { stockItems } = useStock();

  // Check if item is out of stock
  const isOutOfStock = (item: any) => item.current_quantity === 0;

  // Check if item is expired
  const isExpired = (item: any) => {
    if (!item.nearest_expiry_date) return false;

    const expiryDate = new Date(item.nearest_expiry_date);
    const today = new Date();

    // Set both dates to midnight to compare just the dates
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Return true if expiry date is today or in the past
    return expiryDate <= today;
  };

  // Create analytical message based on out of stock and expired items only
  const getAnalyticalMessage = () => {
    const totalItems = stockItems.length;
    const outOfStockCount = stockItems.filter(isOutOfStock).length;
    const expiredCount = stockItems.filter(isExpired).length;

    if (totalItems === 0) {
      return "No stock items";
    }

    // Only show out of stock and expired information
    return `${outOfStockCount} out of stock, ${expiredCount} expired`;
  };

  return <>{getAnalyticalMessage()}</>;
};

export default StockAlertsAnalytics;
