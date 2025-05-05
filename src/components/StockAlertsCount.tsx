import React from 'react';
import { useStock } from '@/contexts/StockContext';

const StockAlertsCount: React.FC = () => {
  const { getLowStockItems, getExpiredItems, getExpiringSoonItems } = useStock();

  const lowStockItems = getLowStockItems();
  const expiredItems = getExpiredItems();
  const expiringSoonItems = getExpiringSoonItems();

  // Total count of all alerts
  const totalAlerts = lowStockItems.length + expiredItems.length + expiringSoonItems.length;

  return <>{totalAlerts}</>;
};

export default StockAlertsCount;
