import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsCompact } from '@/hooks/use-compact';
import { Implant, IncomingInput, pieces } from '@/lib/implants';
import { ConfirmDialog, FieldRow, FormDialog, MessageDialog } from './shared';
import { MessageState, closedMessage, formatCost, implantName, todayISO } from './utils';

interface Row {
  key: number;
  dealer: string;
  quantity: string;
  batchNumber: string;
  expiryDate: string;
  cost: string;
}

let rowKey = 0;
const newRow = (): Row => ({ key: ++rowKey, dealer: '', quantity: '', batchNumber: '', expiryDate: '', cost: '' });

// Record Incoming Stock: one implant, quantities from one or more dealers in one go
export default function ImplantIncomingDialog({
  open,
  onOpenChange,
  implant,
  dealerNames,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  implant: Implant;
  dealerNames: string[];
  onSave: (input: IncomingInput) => void;
}) {
  const isCompact = useIsCompact();
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [receivedDate, setReceivedDate] = useState(todayISO());
  const [message, setMessage] = useState<MessageState>(closedMessage);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows([newRow()]);
    setReceivedDate(todayISO());
  }, [open, implant.id]);

  const update = (key: number, field: keyof Omit<Row, 'key'>, value: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const filled = rows.filter((r) => r.dealer && Number(r.quantity) > 0);
  const total = filled.reduce((sum, r) => sum + Number(r.quantity), 0);
  const fail = (title: string, text: string) => setMessage({ isOpen: true, title, message: text });

  const handleSubmit = () => {
    for (const r of rows) {
      const who = r.dealer || 'this row';
      if (!r.dealer) return fail('Missing Information', 'Please select the dealer for each row.');
      if (!Number.isInteger(Number(r.quantity)) || Number(r.quantity) <= 0)
        return fail('Missing Information', `Please enter the quantity received from ${who}.`);
      if (!r.expiryDate) return fail('Missing Information', `Please select the expiry date for the stock from ${who}.`);
      if (r.expiryDate < todayISO())
        return fail('Record Received Stock', `Expiry date for ${who} cannot be in the past. Please select a future date.`);
      if (r.cost.trim() !== '' && !(Number(r.cost) > 0))
        return fail('Missing Information', `Cost per piece for ${who} must be a number above 0 (or leave it empty).`);
    }
    if (!receivedDate) return fail('Missing Information', 'Please select the date when this stock was received.');
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onSave({
      implantId: implant.id,
      receivedDate,
      rows: rows.map((r) => ({
        dealerId: r.dealer,
        dealerName: r.dealer,
        quantity: Number(r.quantity),
        batchNumber: r.batchNumber,
        expiryDate: r.expiryDate,
        costPerPiece: r.cost.trim() ? Number(r.cost) : undefined,
      })),
    });
  };

  const dealerSelect = (r: Row) => (
    <Select value={r.dealer} onValueChange={(v) => update(r.key, 'dealer', v)}>
      <SelectTrigger aria-label="Dealer">
        <SelectValue placeholder="Select Dealer" />
      </SelectTrigger>
      <SelectContent>
        {dealerNames.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const costInput = (r: Row) => (
    <Input
      type="number"
      min="0"
      step="0.01"
      inputMode="decimal"
      aria-label="Cost per piece"
      value={r.cost}
      onChange={(e) => update(r.key, 'cost', e.target.value)}
      placeholder="Optional"
    />
  );

  const removeButton = (r: Row) =>
    rows.length > 1 ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        aria-label="Remove dealer row"
        onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
      >
        <X className="h-4 w-4" />
      </Button>
    ) : (
      <span className="h-8 w-8" />
    );

  const req = <span className="text-red-500 ml-0.5">*</span>;

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Record Incoming Stock"
        description={`Add new stock for ${implantName(implant)}`}
        onSubmit={handleSubmit}
        wide
      >
        {isCompact ? (
          <div className="space-y-3">
            {rows.map((r, idx) => (
              <div key={r.key} className="rounded-md border p-3 space-y-3" data-testid="incoming-row">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dealer {idx + 1}</span>
                  {removeButton(r)}
                </div>
                <div className="space-y-1.5">
                  <Label>Dealer {req}</Label>
                  {dealerSelect(r)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Quantity Received {req}</Label>
                    <Input type="number" min="1" step="1" inputMode="numeric" aria-label="Quantity Received" value={r.quantity} onChange={(e) => update(r.key, 'quantity', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Batch Number</Label>
                    <Input aria-label="Batch Number" value={r.batchNumber} onChange={(e) => update(r.key, 'batchNumber', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Expiry Date {req}</Label>
                    <Input type="date" aria-label="Expiry Date" value={r.expiryDate} onChange={(e) => update(r.key, 'expiryDate', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cost / Piece (₹)</Label>
                    {costInput(r)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1.1fr_0.9fr_32px] gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Dealer {req}</span>
              <span>Quantity Received {req}</span>
              <span>Batch Number</span>
              <span>Expiry Date {req}</span>
              <span>Cost / Piece (₹)</span>
              <span />
            </div>
            {rows.map((r) => (
              <div key={r.key} className="grid grid-cols-[1.4fr_0.8fr_1fr_1.1fr_0.9fr_32px] items-center gap-2 border-t px-3 py-2" data-testid="incoming-row">
                {dealerSelect(r)}
                <Input type="number" min="1" step="1" aria-label="Quantity Received" value={r.quantity} onChange={(e) => update(r.key, 'quantity', e.target.value)} />
                <Input aria-label="Batch Number" value={r.batchNumber} onChange={(e) => update(r.key, 'batchNumber', e.target.value)} placeholder="Optional" />
                <Input type="date" aria-label="Expiry Date" value={r.expiryDate} onChange={(e) => update(r.key, 'expiryDate', e.target.value)} />
                {costInput(r)}
                {removeButton(r)}
              </div>
            ))}
          </div>
        )}

        <div>
          <Button type="button" variant="link" className="h-auto p-0 text-dental-primary" onClick={() => setRows((rs) => [...rs, newRow()])}>
            <Plus className="h-4 w-4 mr-1" />
            Add another dealer
          </Button>
        </div>

        <FieldRow label="Received Date" htmlFor="implant_received_date" required>
          <Input id="implant_received_date" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
        </FieldRow>

        {total > 0 && (
          <p className="text-sm text-muted-foreground" data-testid="incoming-total">
            Total: <span className="font-medium text-foreground">{pieces(total)}</span>
            {filled.length > 1 && ` (${filled.map((r) => `${r.dealer} ${r.quantity}`).join(', ')})`}
          </p>
        )}
      </FormDialog>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Confirm Stock Addition" onConfirm={handleConfirm}>
        <p>
          You are about to add <b>{pieces(total)}</b> of <b>{implantName(implant)}</b>:
        </p>
        <ul className="mt-1 list-disc pl-5">
          {rows.map((r) => (
            <li key={r.key}>
              {r.dealer}: {r.quantity}
              {r.batchNumber.trim() && ` (Batch ${r.batchNumber.trim()})`}
              {r.cost.trim() && ` at ${formatCost(Number(r.cost))} per piece`}
            </li>
          ))}
        </ul>
      </ConfirmDialog>

      <MessageDialog state={message} onClose={() => setMessage(closedMessage)} />
    </>
  );
}
