import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStock } from '@/hooks/use-stock';

const StockAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { getLowStockItems, getExpiredItems, getExpiringSoonItems } = useStock();

  const lowStockItems = getLowStockItems();
  const expiredItems = getExpiredItems();
  const expiringSoonItems = getExpiringSoonItems();

  // Helper function to calculate days to expiry
  const getDaysToExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Enhanced priority system for compound conditions
  const getStockAlertPriority = (item: any) => {
    const isExpired = item.nearest_expiry_date && new Date(item.nearest_expiry_date) < new Date();
    const isExpiringSoon = item.nearest_expiry_date && getDaysToExpiry(item.nearest_expiry_date) <= 60 && getDaysToExpiry(item.nearest_expiry_date) > 0;
    const isLowStock = item.current_quantity <= item.minimum_threshold;
    const isOutOfStock = item.current_quantity === 0;

    // Compound conditions (highest priority)
    if (isOutOfStock && isExpired) {
      return {
        priority: 1000,
        type: 'critical' as const,
        label: 'Out of Stock & Expired',
        icon: '🚨',
        description: `Expired: ${item.nearest_expiry_date}`
      };
    }
    if (isOutOfStock && isExpiringSoon) {
      const days = getDaysToExpiry(item.nearest_expiry_date);
      return {
        priority: 950,
        type: 'critical' as const,
        label: 'Out of Stock & Expiring',
        icon: '🚨',
        description: `Expires in ${days} days`
      };
    }
    if (isLowStock && isExpired) {
      return {
        priority: 900,
        type: 'critical' as const,
        label: 'Low Stock & Expired',
        icon: '⚠️',
        description: `Current: ${item.current_quantity}, Expired: ${item.nearest_expiry_date}`
      };
    }
    if (isLowStock && isExpiringSoon) {
      const days = getDaysToExpiry(item.nearest_expiry_date);
      return {
        priority: 850,
        type: 'urgent' as const,
        label: 'Low Stock & Expiring',
        icon: '⚠️',
        description: `Current: ${item.current_quantity}, Expires in ${days} days`
      };
    }

    // Single conditions
    if (isExpired) {
      return {
        priority: 800,
        type: 'expired' as const,
        label: 'Expired',
        icon: '❌',
        description: `Expired: ${item.nearest_expiry_date}`
      };
    }
    if (isOutOfStock) {
      return {
        priority: 750,
        type: 'urgent' as const,
        label: 'Out of Stock',
        icon: '📉',
        description: 'No stock remaining'
      };
    }
    if (isLowStock) {
      return {
        priority: 500,
        type: 'low' as const,
        label: 'Low Stock',
        icon: '📉',
        description: `Current: ${item.current_quantity}, Min: ${item.minimum_threshold}`
      };
    }
    if (isExpiringSoon) {
      const days = getDaysToExpiry(item.nearest_expiry_date);
      return {
        priority: 300,
        type: 'expiring' as const,
        label: 'Expiring Soon',
        icon: '⏰',
        description: `Expires in ${days} days`
      };
    }

    return {
      priority: 0,
      type: 'normal' as const,
      label: 'Normal',
      icon: '✅',
      description: 'Stock level normal'
    };
  };

  // Get alert styling based on type
  const getAlertStyling = (alertType: string) => {
    switch (alertType) {
      case 'critical':
        return {
          bg: 'bg-red-100 border-red-200',
          badge: 'bg-red-600',
          textColor: 'text-red-800'
        };
      case 'urgent':
        return {
          bg: 'bg-orange-100 border-orange-200',
          badge: 'bg-orange-600',
          textColor: 'text-orange-800'
        };
      case 'expired':
        return {
          bg: 'bg-red-50 border-red-100',
          badge: 'bg-red-500',
          textColor: 'text-red-700'
        };
      case 'low':
        return {
          bg: 'bg-amber-50 border-amber-100',
          badge: 'bg-amber-500',
          textColor: 'text-amber-700'
        };
      case 'expiring':
        return {
          bg: 'bg-blue-50 border-blue-100',
          badge: 'bg-blue-500',
          textColor: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-100',
          badge: 'bg-gray-500',
          textColor: 'text-gray-700'
        };
    }
  };

  // Process all stock items with compound priority logic
  const processStockAlerts = () => {
    const allItems = [...lowStockItems, ...expiredItems, ...expiringSoonItems];

    // Remove duplicates and assign compound priorities
    const uniqueItems = allItems.reduce((acc: any[], item) => {
      const existing = acc.find(i => i.id === item.id);
      if (!existing) {
        const alertInfo = getStockAlertPriority(item);
        acc.push({ ...item, alertInfo });
      }
      return acc;
    }, []);

    // Sort by priority (highest first) and limit to 5
    return uniqueItems
      .sort((a, b) => b.alertInfo.priority - a.alertInfo.priority)
      .slice(0, 5);
  };

  const displayAlerts = processStockAlerts();

  return (
    <Card className="card-shadow card-hover flex flex-col">
      <CardHeader>
        <CardTitle>Stock Alerts</CardTitle>
        <CardDescription>
          {`${expiredItems.length} expired ${expiredItems.length === 1 ? 'item' : 'items'}, ${lowStockItems.length} below threshold`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-3 min-h-0">
          {displayAlerts.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {displayAlerts.map((item) => {
                const styling = getAlertStyling(item.alertInfo.type);
                return (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center p-2 rounded-md border ${styling.bg}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.alertInfo.icon}</span>
                        <p className={`text-sm font-medium ${styling.textColor}`}>
                          {item.name} {item.sub_item ? `(${item.sub_item})` : ''}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.alertInfo.description}
                      </p>
                    </div>
                    <div className={`text-xs ${styling.badge} text-white px-2 py-1 rounded ml-2 whitespace-nowrap`}>
                      {item.alertInfo.label}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">All stock levels are healthy! 🎉</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/stock')}
          >
            Manage Stock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockAlerts;
