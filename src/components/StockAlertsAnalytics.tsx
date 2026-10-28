import React from 'react';
import { useStock } from '@/hooks/use-stock';
import { isPastExpiry } from '@/lib/stockExpiry';

const StockAlertsAnalytics: React.FC = () => {
  const { stockItems } = useStock();

  // Check if item is out of stock
  const isOutOfStock = (item: any) => item.current_quantity === 0;

  // Check if item is expired (the expiry day itself is still usable)
  const isExpired = (item: any) => {
    if (!item.nearest_expiry_date) return false;
    return isPastExpiry(item.nearest_expiry_date);
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
