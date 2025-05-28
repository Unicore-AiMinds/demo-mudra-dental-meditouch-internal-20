import React, { useMemo } from 'react';
import { useStock } from '@/hooks/use-stock';

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

  const isExpired = (item: any) => {
    if (!item.nearestExpiryDate) return false;
    const expiryDate = new Date(item.nearestExpiryDate);
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return expiryDate <= today;
  };

  const isExpiringSoon = (item: any) => {
    if (!item.nearestExpiryDate) return false;
    if (isOutOfStock(item) || isExpired(item)) return false;

    const expiryDate = new Date(item.nearestExpiryDate);
    const today = new Date();
    const differenceInTime = expiryDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);

    return differenceInDays > 0 && differenceInDays <= 60;
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
