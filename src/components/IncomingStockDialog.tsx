import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { IncomingStockData } from '@/contexts/StockContext';
import { useStock } from '@/hooks/use-stock';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface IncomingStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stockItemId: string;
  stockItemName: string;
  stockItemUnit: string;
}

const IncomingStockDialog: React.FC<IncomingStockDialogProps> = ({
  isOpen,
  onClose,
  stockItemId,
  stockItemName,
  stockItemUnit,
}) => {
  const { toast } = useToast();
  const { recordIncomingStock } = useStock();
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState<IncomingStockData>({
    quantity_received: 0,
    expiry_date: '',
    batch_number: '',
    received_date: today,
    cost_per_unit: undefined,
    performed_by: user?.name || '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === 'quantity_received' || name === 'cost_per_unit') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.quantity_received || formData.quantity_received <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.received_date) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a received date.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await recordIncomingStock(stockItemId, formData);

      // Reset form and close dialog
      setFormData({
        quantity_received: 0,
        expiry_date: '',
        batch_number: '',
        received_date: today,
        cost_per_unit: undefined,
        performed_by: user?.name || '',
        notes: '',
      });

      onClose();
    } catch (error) {
      console.error('Error recording incoming stock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Incoming Stock</DialogTitle>
          <DialogDescription>
            Add new stock for {stockItemName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="quantity_received" className="text-right text-xs">
                Quantity Received *
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="quantity_received"
                  name="quantity_received"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity_received || ''}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">{stockItemUnit}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="batch_number" className="text-right text-xs">
                Batch Number
              </Label>
              <div className="col-span-3">
                <Input
                  id="batch_number"
                  name="batch_number"
                  value={formData.batch_number || ''}
                  onChange={handleChange}
                  placeholder="Optional batch identifier"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="expiry_date" className="text-right text-xs">
                Expiry Date
              </Label>
              <div className="col-span-3">
                <Input
                  id="expiry_date"
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="received_date" className="text-right text-xs">
                Received Date *
              </Label>
              <div className="col-span-3">
                <Input
                  id="received_date"
                  name="received_date"
                  type="date"
                  value={formData.received_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="cost_per_unit" className="text-right text-xs">
                Cost Per Unit
              </Label>
              <div className="col-span-3">
                <Input
                  id="cost_per_unit"
                  name="cost_per_unit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_per_unit || ''}
                  onChange={handleChange}
                  placeholder="Optional cost per unit"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="performed_by" className="text-right text-xs">
                Received By
              </Label>
              <div className="col-span-3">
                <Input
                  id="performed_by"
                  name="performed_by"
                  value={formData.performed_by || ''}
                  onChange={handleChange}
                  placeholder="Person who received the stock"
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
                  placeholder="Optional notes about this stock"
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

export default IncomingStockDialog;
