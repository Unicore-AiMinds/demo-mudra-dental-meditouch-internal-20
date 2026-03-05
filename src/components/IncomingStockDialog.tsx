import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const { recordIncomingStock } = useStock();
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState<IncomingStockData>({
    quantity_received: 0,
    expiry_date: '',
    batch_number: '',
    received_date: today,
    cost_per_unit: undefined,
    performed_by: user?.name || 'System',
    notes: 'Stock addition',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [validationDialog, setValidationDialog] = useState<{isOpen: boolean, title: string, message: string}>({
    isOpen: false,
    title: '',
    message: ''
  });

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
      setValidationDialog({
        isOpen: true,
        title: 'Record Received Stock',
        message: 'Please enter the quantity of stock received.'
      });
      return;
    }

    if (!formData.received_date) {
      setValidationDialog({
        isOpen: true,
        title: 'Record Received Stock',
        message: 'Please select the date when this stock was received.'
      });
      return;
    }

    if (!formData.expiry_date) {
      setValidationDialog({
        isOpen: true,
        title: 'Record Received Stock',
        message: 'Please select the expiry date for this stock batch.'
      });
      return;
    }

    // Check if expiry date is in the past
    const expiryDate = new Date(formData.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (expiryDate < today) {
      setValidationDialog({
        isOpen: true,
        title: 'Record Received Stock',
        message: 'Expiry date cannot be in the past. Please select a future date.'
      });
      return;
    }

    // Show confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      setIsConfirmDialogOpen(false);
      await recordIncomingStock(stockItemId, formData);

      // Reset form and close dialog
      setFormData({
        quantity_received: 0,
        expiry_date: '',
        batch_number: '',
        received_date: today,
        cost_per_unit: undefined,
        performed_by: user?.name || 'System',
        notes: 'Stock addition',
      });

      onClose();
    } catch (error) {
      console.error('Error recording incoming stock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
                Quantity Received <span className="text-red-500 ml-1">*</span>
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
                Expiry Date <span className="text-red-500 ml-1">*</span>
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
                Received Date <span className="text-red-500 ml-1">*</span>
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

    <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Stock Addition</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to add {formData.quantity_received} {stockItemUnit} of {stockItemName} to the inventory?
            {formData.batch_number && (
              <><br />Batch: {formData.batch_number}</>
            )}
            {formData.expiry_date && (
              <><br />Expiry: {formData.expiry_date}</>
            )}
            {formData.cost_per_unit && (
              <><br />Cost: ₹{formData.cost_per_unit} per unit</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            className="bg-dental-primary hover:bg-dental-dark"
          >
            {isSubmitting ? 'Adding...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={validationDialog.isOpen} onOpenChange={(open) => setValidationDialog({...validationDialog, isOpen: open})}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{validationDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {validationDialog.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setValidationDialog({...validationDialog, isOpen: false})}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default IncomingStockDialog;
