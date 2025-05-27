import React from 'react';
import { useStock } from '@/hooks/use-stock';

const StockAlertsAnalytics: React.FC = () => {
  const { getLowStockItems, getExpiredItems, getExpiringSoonItems } = useStock();

  const lowStockItems = getLowStockItems();
  const expiredItems = getExpiredItems();
  const expiringSoonItems = getExpiringSoonItems();

  // Count different types of alerts
  const outOfStockItems = lowStockItems.filter(item => item.current_quantity === 0);
  const lowButNotOutItems = lowStockItems.filter(item => item.current_quantity > 0);

  // Create analytical message
  const getAnalyticalMessage = () => {
    const parts = [];

    // Priority: Expired items first
    if (expiredItems.length > 0) {
      parts.push(`${expiredItems.length} expired`);
    }

    // Then out of stock
    if (outOfStockItems.length > 0) {
      parts.push(`${outOfStockItems.length} out of stock`);
    }

    // Then low stock (but not out of stock)
    if (lowButNotOutItems.length > 0 && parts.length < 2) {
      parts.push(`${lowButNotOutItems.length} low stock`);
    }

    // If no critical issues, show expiring soon
    if (parts.length === 0 && expiringSoonItems.length > 0) {
      parts.push(`${expiringSoonItems.length} expiring soon`);
    }

    // If no alerts at all
    if (parts.length === 0) {
      return "All stock levels healthy";
    }

    return parts.join(', ');
  };

  return <>{getAnalyticalMessage()}</>;
};

export default StockAlertsAnalytics;
