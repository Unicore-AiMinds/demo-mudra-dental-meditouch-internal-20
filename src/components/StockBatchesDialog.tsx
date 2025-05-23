import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StockBatch, StockTransaction } from '@/contexts/StockContext';
import { useStock } from '@/hooks/use-stock';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface StockBatchesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stockItemId: string;
  stockItemName: string;
}

const StockBatchesDialog: React.FC<StockBatchesDialogProps> = ({
  isOpen,
  onClose,
  stockItemId,
  stockItemName,
}) => {
  const { toast } = useToast();
  const { getBatchesForStockItem, getTransactionsForStockItem } = useStock();

  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('batches');

  // Fetch data when dialog opens
  useEffect(() => {
    const fetchData = async () => {
      if (isOpen && stockItemId) {
        setIsLoading(true);
        try {
          const [batchData, transactionData] = await Promise.all([
            getBatchesForStockItem(stockItemId),
            getTransactionsForStockItem(stockItemId)
          ]);

          setBatches(batchData);
          setTransactions(transactionData);
        } catch (error) {
          console.error('Error fetching stock data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load stock information.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [isOpen, stockItemId, getBatchesForStockItem, getTransactionsForStockItem, toast]);

  // Helper function to determine batch status
  const getBatchStatus = (batch: StockBatch) => {
    if (!batch.expiry_date) return { status: 'No Expiry', color: 'bg-gray-100 text-gray-800' };

    const today = new Date();
    const expiryDate = new Date(batch.expiry_date);
    const sixtyDaysFromNow = addDays(today, 60);

    if (isBefore(expiryDate, today)) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (isBefore(expiryDate, sixtyDaysFromNow)) {
      return { status: 'Expiring Soon', color: 'bg-amber-100 text-amber-800' };
    } else {
      return { status: 'Good', color: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Details: {stockItemName}</DialogTitle>
          <DialogDescription>
            View batch and transaction history
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="mt-4">
            {isLoading ? (
              <div className="text-center py-4">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No batch information available.
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch #</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const { status, color } = getBatchStatus(batch);
                      return (
                        <TableRow key={batch.id}>
                          <TableCell>{batch.batch_number || '-'}</TableCell>
                          <TableCell>{batch.received_date || '-'}</TableCell>
                          <TableCell>{batch.expiry_date || 'No Expiry'}</TableCell>
                          <TableCell>
                            {batch.current_quantity} / {batch.quantity_received}
                          </TableCell>
                          <TableCell>
                            <Badge className={color}>{status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            {isLoading ? (
              <div className="text-center py-4">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No transaction history available.
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Batch #</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Purpose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.transaction_date}</TableCell>
                        <TableCell>
                          <Badge
                            className={transaction.transaction_type === 'incoming'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {transaction.transaction_type === 'incoming' ? 'In' : 'Out'}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>
                          {transaction.batch_id
                            ? batches.find(b => b.id === transaction.batch_id)?.batch_number || '-'
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{transaction.performed_by || '-'}</TableCell>
                        <TableCell>{transaction.purpose || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StockBatchesDialog;
