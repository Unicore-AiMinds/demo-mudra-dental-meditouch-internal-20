import React, { useMemo } from 'react';
import { useStock } from '@/hooks/use-stock';
import { isPastExpiry, isWithinExpiryWindow } from '@/lib/stockExpiry';

const StockAlertsCount: React.FC = () => {
  const { stockItems } = useStock();

  // Transform data to match Stock Tracker format (same as Stock Tracker page)
  const transformedStockItems = useMemo(() => {
    return stockItems.map(item => ({
      id: item.id,
      name: item.name,
      subItem: item.sub_item,
      description: item.description,
      itemType: item.item_type,
      dealer: item.dealer,
      rate: item.rate,
      unit: item.unit,
      currentQuantity: item.current_quantity,        // ← Transform to component format
      minimumThreshold: item.minimum_threshold,
      nearestExpiryDate: item.nearest_expiry_date,   // ← Transform to component format
      createdAt: item.created_at
    }));
  }, [stockItems]);

  // Use same logic as Stock Tracker page (with component format properties)
  const isOutOfStock = (item: any) => item.currentQuantity === 0;
  const isLowStock = (item: any) => item.currentQuantity > 0 && item.currentQuantity <= item.minimumThreshold;

  // The expiry day itself is still usable; expired from the next day
  const isExpired = (item: any) => {
    if (!item.nearestExpiryDate) return false;
    return isPastExpiry(item.nearestExpiryDate);
  };

  const isExpiringSoon = (item: any) => {
    if (!item.nearestExpiryDate) return false;
    if (isOutOfStock(item) || isExpired(item)) return false;
    return isWithinExpiryWindow(item.nearestExpiryDate);
  };

  const getPrimaryStatus = (item: any) => {
    if (isOutOfStock(item)) return 'outofstock';
    if (isExpired(item)) return 'expired';
    if (isExpiringSoon(item)) return 'expiring';
    if (isLowStock(item)) return 'low';
    return 'normal';
  };

  // Show total stock items count (same as Stock Tracker page)
  const totalStockItems = transformedStockItems.length;

  return <>{totalStockItems}</>;
};

export default StockAlertsCount;
