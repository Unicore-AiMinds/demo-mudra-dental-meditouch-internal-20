import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Implant,
  ImplantError,
  ImplantState,
  ReturnInput,
  batchLeft,
  dealerStock,
  isExpired,
  pieces,
  recordReturn,
  returnableBatches,
} from '@/lib/implants';
import { ConfirmDialog, DealerPicker, FieldRow, FormDialog, MessageDialog } from './shared';
import { MessageState, closedMessage, formatExpiry, implantName, todayISO } from './utils';

const ANY = 'any';

// Record Stock Return: unused pieces sent back to the dealer they came from
export default function ImplantReturnDialog({
  open,
  onOpenChange,
  implant,
  state,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  implant: Implant;
  state: ImplantState;
  onSave: (input: ReturnInput) => void; // throws ImplantError
}) {
  const today = todayISO();
  const [dealerId, setDealerId] = useState('');
  const [batchId, setBatchId] = useState(ANY);
  const [quantity, setQuantity] = useState('1');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<MessageState>(closedMessage);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dealers = useMemo(() => dealerStock(state, implant.id, today).filter((d) => d.left > 0), [state, implant.id, today]);
  const batches = useMemo(() => (dealerId ? returnableBatches(state, implant.id, dealerId) : []), [state, implant.id, dealerId]);

  useEffect(() => {
    if (!open) return;
    setDealerId(dealers.length === 1 ? dealers[0].dealerId : '');
    setBatchId(ANY);
    setQuantity('1');
    setDate(todayISO());
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, implant.id]);

  const dealer = dealers.find((d) => d.dealerId === dealerId);
  const chosenBatch = batches.find((b) => b.id === batchId);
  const maxReturn = chosenBatch ? batchLeft(chosenBatch) : dealer?.left ?? 0;
  const qty = Number(quantity);
  const fail = (title: string, text: string) => setMessage({ isOpen: true, title, message: text });

  const input = (): ReturnInput => ({
    implantId: implant.id,
    dealerId,
    batchId: batchId === ANY ? undefined : batchId,
    quantity: qty,
    date,
    notes,
  });

  const handleSubmit = () => {
    if (dealers.length === 0) return fail('No Stock Available', 'There are no pieces of this implant left to return.');
    if (!dealerId) return fail('Missing Information', 'Please select the dealer to return to.');
    if (!Number.isInteger(qty) || qty <= 0) return fail('Missing Information', 'Please enter a valid quantity to return.');
    if (!date) return fail('Missing Information', 'Please select the return date.');
    try {
      recordReturn(state, input()); // dry run: same rules as the save (nothing is stored)
    } catch (error) {
      if (error instanceof ImplantError) return fail(error.title, error.message);
      throw error;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    try {
      onSave(input());
    } catch (error) {
      if (error instanceof ImplantError) return fail(error.title, error.message);
      throw error;
    }
  };

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Record Stock Return"
        description={`Return ${implantName(implant)} to a dealer`}
        onSubmit={handleSubmit}
      >
        <FieldRow label="Dealer" required alignTop>
          <DealerPicker
            dealers={dealers}
            value={dealerId}
            onChange={(id) => {
              setDealerId(id);
              setBatchId(ANY);
            }}
            countOf={(d) => d.left}
            emptyText="No pieces left from any dealer."
          />
        </FieldRow>
        {batches.length > 0 && (
          <FieldRow label="Specific Batch">
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger aria-label="Specific Batch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any batch (first expiring first)</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batchNumber || 'Batch'} - {pieces(batchLeft(b))} (Exp: {formatExpiry(b.expiryDate)})
                    {isExpired(b, today) ? ' · Expired' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        )}
        <FieldRow label="Quantity Returned" htmlFor="implant_qty_returned" required>
          <Input id="implant_qty_returned" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          {dealer && (
            <p className="mt-1 text-xs text-muted-foreground">
              You can return up to {pieces(maxReturn)} to {dealer.dealerName}.
            </p>
          )}
        </FieldRow>
        <FieldRow label="Return Date" htmlFor="implant_return_date" required>
          <Input id="implant_return_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldRow>
        <FieldRow label="Notes" htmlFor="implant_return_notes" alignTop>
          <Textarea id="implant_return_notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Not needed, wrong size" />
        </FieldRow>
      </FormDialog>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Confirm Stock Return" onConfirm={handleConfirm}>
        <p>
          You are about to return <b>{pieces(qty || 0)}</b> of <b>{implantName(implant)}</b> to <b>{dealer?.dealerName}</b>.
          {dealer && ` ${dealer.dealerName} will have ${dealer.left - qty} left.`}
        </p>
      </ConfirmDialog>

      <MessageDialog state={message} onClose={() => setMessage(closedMessage)} />
    </>
  );
}
