import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ConsumeStockData, StockBatch } from '@/contexts/StockContext';
import { useStock } from '@/hooks/use-stock';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface ConsumeStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stockItemId: string;
  stockItemName: string;
  stockItemUnit: string;
  currentQuantity: number;
}

const ConsumeStockDialog: React.FC<ConsumeStockDialogProps> = ({
  isOpen,
  onClose,
  stockItemId,
  stockItemName,
  stockItemUnit,
  currentQuantity,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { recordStockConsumption, getBatchesForStockItem } = useStock();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState<ConsumeStockData>({
    quantity: 0,
    transaction_date: today,
    performed_by: user?.name || '',
    purpose: '',
    notes: '',
    specific_batch_id: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  // Fetch batches when dialog opens
  useEffect(() => {
    const fetchBatches = async () => {
      if (isOpen && stockItemId) {
        setIsLoadingBatches(true);
        try {
          const batchData = await getBatchesForStockItem(stockItemId);
          // Only show batches with stock
          setBatches(batchData.filter(batch => batch.current_quantity > 0));
        } catch (error) {
          console.error('Error fetching batches:', error);
          toast({
            title: 'Error',
            description: 'Failed to load batch information.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingBatches(false);
        }
      }
    };

    fetchBatches();
  }, [isOpen, stockItemId, getBatchesForStockItem, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === 'quantity') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.quantity || formData.quantity <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.quantity > currentQuantity) {
      toast({
        title: 'Validation Error',
        description: `Cannot consume more than available quantity (${currentQuantity} ${stockItemUnit}).`,
        variant: 'destructive',
      });
      return;
    }

    if (!formData.transaction_date) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a transaction date.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await recordStockConsumption(stockItemId, formData);

      // Reset form and close dialog
      setFormData({
        quantity: 0,
        transaction_date: today,
        performed_by: user?.name || '',
        purpose: '',
        notes: '',
        specific_batch_id: undefined,
      });

      onClose();
    } catch (error) {
      console.error('Error recording stock consumption:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Stock Consumption</DialogTitle>
          <DialogDescription>
            Record usage of {stockItemName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="quantity" className="text-right text-xs">
                Quantity Used *
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max={currentQuantity}
                  step="1"
                  value={formData.quantity || ''}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">{stockItemUnit}</span>
              </div>
            </div>

            {batches.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="specific_batch_id" className="text-right text-xs">
                  Specific Batch
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.specific_batch_id}
                    onValueChange={(value) => handleSelectChange('specific_batch_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use FEFO (First Expiry, First Out)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Use FEFO (First Expiry, First Out)</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batch_number || 'Batch'} - {batch.current_quantity} {stockItemUnit}
                          {batch.expiry_date ? ` (Exp: ${batch.expiry_date})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="transaction_date" className="text-right text-xs">
                Date Used *
              </Label>
              <div className="col-span-3">
                <Input
                  id="transaction_date"
                  name="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="performed_by" className="text-right text-xs">
                Used By
              </Label>
              <div className="col-span-3">
                <Input
                  id="performed_by"
                  name="performed_by"
                  value={formData.performed_by || ''}
                  onChange={handleChange}
                  placeholder="Person who used the item"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="purpose" className="text-right text-xs">
                Purpose
              </Label>
              <div className="col-span-3">
                <Input
                  id="purpose"
                  name="purpose"
                  value={formData.purpose || ''}
                  onChange={handleChange}
                  placeholder="Purpose of consumption"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="notes" className="text-right text-xs">
                Notes
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Optional notes about this consumption"
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-dental-primary hover:bg-dental-dark"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConsumeStockDialog;
