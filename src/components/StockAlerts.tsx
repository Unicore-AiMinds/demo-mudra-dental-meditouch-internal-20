import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStock } from '@/contexts/StockContext';

const StockAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { getLowStockItems, getExpiredItems, getExpiringSoonItems } = useStock();

  const lowStockItems = getLowStockItems();
  const expiredItems = getExpiredItems();
  const expiringSoonItems = getExpiringSoonItems();

  // Combine all alerts, prioritizing expired items first, then low stock, then expiring soon
  const allAlerts = [
    ...expiredItems.map(item => ({ ...item, alertType: 'expired' as const })),
    ...lowStockItems.map(item => ({ ...item, alertType: 'low' as const })),
    ...expiringSoonItems.map(item => ({ ...item, alertType: 'expiring' as const }))
  ];

  // Limit to 5 items for display
  const displayAlerts = allAlerts.slice(0, 5);

  return (
    <Card className="card-shadow card-hover">
      <CardHeader>
        <CardTitle>Stock Alerts</CardTitle>
        <CardDescription>
          {expiredItems.length > 0 
            ? `${expiredItems.length} expired items, ${lowStockItems.length} below threshold` 
            : `Items below minimum threshold`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.length > 0 ? (
          <>
            {displayAlerts.map((item) => (
              <div 
                key={item.id}
                className={`flex justify-between items-center p-2 rounded-md ${
                  item.alertType === 'expired' 
                    ? 'bg-red-50 border border-red-100' 
                    : item.alertType === 'low' 
                      ? 'bg-amber-50 border border-amber-100'
                      : 'bg-blue-50 border border-blue-100'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">
                    {item.name} {item.subItem ? `(${item.subItem})` : ''}
                  </p>
                  {item.alertType === 'expired' ? (
                    <p className="text-xs text-muted-foreground">
                      Expired: {item.nearestExpiryDate}
                    </p>
                  ) : item.alertType === 'low' ? (
                    <p className="text-xs text-muted-foreground">
                      Current: {item.currentQuantity}, Min: {item.minimumThreshold}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Expires: {item.nearestExpiryDate}
                    </p>
                  )}
                </div>
                <div 
                  className={`text-xs ${
                    item.alertType === 'expired' 
                      ? 'bg-red-500' 
                      : item.alertType === 'low' 
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  } text-white px-2 py-1 rounded`}
                >
                  {item.alertType === 'expired' 
                    ? 'Expired' 
                    : item.alertType === 'low' 
                      ? 'Low'
                      : 'Expiring'}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No stock alerts at this time.
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full mt-2"
          onClick={() => navigate('/stock')}
        >
          Manage Stock
        </Button>
      </CardContent>
    </Card>
  );
};

export default StockAlerts;
