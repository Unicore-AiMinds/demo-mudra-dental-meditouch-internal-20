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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    performed_by: user?.name || 'System',
    purpose: 'Stock consumption',
    notes: 'Stock consumption',
    specific_batch_id: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [validationDialog, setValidationDialog] = useState<{isOpen: boolean, title: string, message: string}>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Debug logging
  console.log('ConsumeStockDialog props:', { isOpen, stockItemId, stockItemName, stockItemUnit, currentQuantity });

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
    // Convert "FEFO" back to undefined for the backend
    const actualValue = value === "FEFO" ? undefined : value;
    setFormData(prev => ({ ...prev, [name]: actualValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.quantity || formData.quantity <= 0) {
      setValidationDialog({
        isOpen: true,
        title: 'Record Stock Usage',
        message: 'Please enter a valid quantity to consume.'
      });
      return;
    }

    if (formData.quantity > currentQuantity) {
      setValidationDialog({
        isOpen: true,
        title: 'Insufficient Stock',
        message: `Insufficient stock available. You can consume up to ${currentQuantity} ${stockItemUnit}.`
      });
      return;
    }

    if (!formData.transaction_date) {
      setValidationDialog({
        isOpen: true,
        title: 'Record Stock Usage',
        message: 'Please select the date when this stock was consumed.'
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
      await recordStockConsumption(stockItemId, formData);

      // Reset form and close dialog
      setFormData({
        quantity: 0,
        transaction_date: today,
        performed_by: user?.name || 'System',
        purpose: 'Stock consumption',
        notes: 'Stock consumption',
        specific_batch_id: undefined,
      });

      onClose();
    } catch (error) {
      console.error('Error recording stock consumption:', error);
      // Show error in validation dialog with appropriate title
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while recording stock consumption.';
      let title = 'Unable to Process Request';

      if (errorMessage.includes('Insufficient stock')) {
        title = 'Insufficient Stock';
      } else if (errorMessage.includes('batch')) {
        title = 'Issue with Batch Details';
      }

      setValidationDialog({
        isOpen: true,
        title: title,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if essential props are missing
  if (!stockItemId || !stockItemName || !stockItemUnit || currentQuantity === undefined) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Stock Consumption</DialogTitle>
          <DialogDescription>
            Record usage of {stockItemName} (Current: {currentQuantity} {stockItemUnit})
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
                    value={formData.specific_batch_id || "FEFO"}
                    onValueChange={(value) => handleSelectChange('specific_batch_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use FEFO (First Expiry, First Out)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEFO">Use FEFO (First Expiry, First Out)</SelectItem>
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
          <AlertDialogTitle>Confirm Stock Consumption</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to consume {formData.quantity} {stockItemUnit} of {stockItemName}?
            <br />Method: {formData.specific_batch_id ?
              (() => {
                const batch = batches.find(b => b.id === formData.specific_batch_id);
                return batch ?
                  (batch.batch_number || `Exp: ${batch.expiry_date}` || 'Specific batch') :
                  'Specific batch';
              })() :
              'FEFO (First Expiry, First Out)'
            }
            <br />Date: {formData.transaction_date}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            className="bg-dental-primary hover:bg-dental-dark"
          >
            {isSubmitting ? 'Consuming...' : 'Confirm'}
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

export default ConsumeStockDialog;
