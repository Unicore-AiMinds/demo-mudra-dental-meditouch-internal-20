import React from 'react';
import { useStock } from '@/hooks/use-stock';

const StockAlertsCount: React.FC = () => {
  const { getLowStockItems, getExpiredItems, getExpiringSoonItems } = useStock();

  const lowStockItems = getLowStockItems();
  const expiredItems = getExpiredItems();
  const expiringSoonItems = getExpiringSoonItems();

  // Count unique items that have any alert condition (avoid counting duplicates)
  const uniqueAlertItems = new Set([
    ...lowStockItems.map(item => item.id),
    ...expiredItems.map(item => item.id),
    ...expiringSoonItems.map(item => item.id)
  ]);

  const totalAlerts = uniqueAlertItems.size;

  return <>{totalAlerts}</>;
};

export default StockAlertsCount;
