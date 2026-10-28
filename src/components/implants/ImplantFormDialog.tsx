import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Implant } from '@/lib/implants';
import { FieldRow, FormDialog, MessageDialog } from './shared';
import { MessageState, closedMessage, todayISO } from './utils';

export type ImplantFormValues = Omit<Implant, 'id'>;

// Stock already in the clinic when the implant is added (Add only; saved as an Incoming batch)
export interface OpeningStock {
  dealer: string;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  costPerPiece?: number;
}

const EMPTY: ImplantFormValues = { item: '', subItem: '', unit: 'Piece', minThreshold: 1, description: '' };
const EMPTY_OPENING = { quantity: '', dealer: '', batchNumber: '', expiryDate: '', cost: '' };

// Add New Implant / Edit Implant (like Stock Tracker's "Add New Item"). The quantity can only be
// entered when adding; after that it changes only through Incoming / Consume / Return.
export default function ImplantFormDialog({
  open,
  onOpenChange,
  implant,
  existing,
  dealerNames,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  implant: Implant | null; // null = add
  existing: Implant[];
  dealerNames: string[];
  onSave: (values: ImplantFormValues, opening?: OpeningStock) => void;
}) {
  const [values, setValues] = useState<ImplantFormValues>(EMPTY);
  const [threshold, setThreshold] = useState('1');
  const [opening, setOpening] = useState(EMPTY_OPENING);
  const [message, setMessage] = useState<MessageState>(closedMessage);

  useEffect(() => {
    if (!open) return;
    const start = implant ? { ...implant } : EMPTY;
    setValues(start);
    setThreshold(String(start.minThreshold));
    setOpening(EMPTY_OPENING);
  }, [open, implant]);

  const set = (key: keyof ImplantFormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));
  const setOpen = (key: keyof typeof EMPTY_OPENING, value: string) => setOpening((o) => ({ ...o, [key]: value }));
  const fail = (title: string, text: string) => setMessage({ isOpen: true, title, message: text });
  const hasOpening = !implant && Number(opening.quantity) > 0;

  const handleSubmit = () => {
    const item = values.item.trim();
    const subItem = values.subItem.trim();
    const min = Number(threshold);
    if (!item || !subItem || threshold.trim() === '') {
      setMessage({ isOpen: true, title: 'Missing Information', message: 'Please fill in Item, Sub-item and Min. Threshold.' });
      return;
    }
    if (!Number.isInteger(min) || min < 0) {
      setMessage({ isOpen: true, title: 'Missing Information', message: 'Min. Threshold must be a whole number (0 or more).' });
      return;
    }
    const duplicate = existing.some(
      (i) => i.id !== implant?.id && i.item.toLowerCase() === item.toLowerCase() && i.subItem.toLowerCase() === subItem.toLowerCase()
    );
    if (duplicate) {
      setMessage({ isOpen: true, title: 'Implant Already Exists', message: `${item} (${subItem}) is already in the list.` });
      return;
    }
    const saved: ImplantFormValues = { item, subItem, unit: 'Piece', minThreshold: min, description: values.description.trim() };
    if (implant || opening.quantity.trim() === '') return onSave(saved);

    const qty = Number(opening.quantity);
    if (!Number.isInteger(qty) || qty < 0)
      return fail('Missing Information', 'Opening stock quantity must be a whole number (or leave it empty).');
    if (qty === 0) return onSave(saved);
    if (!opening.dealer) return fail('Missing Information', 'Please select the dealer for the opening stock.');
    if (!opening.expiryDate) return fail('Missing Information', 'Please select the expiry date for the opening stock.');
    if (opening.expiryDate < todayISO())
      return fail('Add New Implant', 'Expiry date of the opening stock cannot be in the past. Please select a future date.');
    if (opening.cost.trim() !== '' && !(Number(opening.cost) > 0))
      return fail('Missing Information', 'Cost per piece must be a number above 0 (or leave it empty).');
    onSave(saved, {
      dealer: opening.dealer,
      quantity: qty,
      batchNumber: opening.batchNumber.trim(),
      expiryDate: opening.expiryDate,
      costPerPiece: opening.cost.trim() ? Number(opening.cost) : undefined,
    });
  };

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={implant ? 'Edit Implant' : 'Add New Implant'}
        description={
          <>
            {implant ? 'Update the implant details.' : 'Enter details for the new implant.'} Fields marked with{' '}
            <span className="text-red-500">*</span> are required.
          </>
        }
        onSubmit={handleSubmit}
      >
        <FieldRow label="Item" htmlFor="implant_item" required>
          <Input id="implant_item" value={values.item} onChange={(e) => set('item', e.target.value)} placeholder="e.g., Osstem TS III" />
        </FieldRow>
        <FieldRow label="Sub-item" htmlFor="implant_subitem" required>
          <Input id="implant_subitem" value={values.subItem} onChange={(e) => set('subItem', e.target.value)} placeholder="e.g., 4.0 × 10 mm" />
        </FieldRow>
        <FieldRow label="Unit" htmlFor="implant_unit">
          {/* Implants are always counted per piece */}
          <Input id="implant_unit" value="Piece" disabled />
        </FieldRow>
        <FieldRow label="Min. Threshold" htmlFor="implant_min" required>
          <Input id="implant_min" type="number" min="0" step="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </FieldRow>
        <FieldRow label="Description" htmlFor="implant_desc" alignTop>
          <Textarea
            id="implant_desc"
            rows={2}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g., Bone level, regular platform"
          />
        </FieldRow>

        {!implant && (
          <>
            <div className="border-t pt-3" data-testid="opening-stock">
              <p className="text-sm font-medium">Opening stock (optional)</p>
              <p className="text-xs text-muted-foreground">Fill this if these implants are already in the clinic.</p>
            </div>
            <FieldRow label="Quantity" htmlFor="implant_open_qty">
              <Input
                id="implant_open_qty"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={opening.quantity}
                onChange={(e) => setOpen('quantity', e.target.value)}
                placeholder="Leave empty if no stock yet"
              />
            </FieldRow>
            <FieldRow label="Dealer" required={hasOpening}>
              <Select value={opening.dealer} onValueChange={(v) => setOpen('dealer', v)}>
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
            </FieldRow>
            <FieldRow label="Batch Number" htmlFor="implant_open_batch">
              <Input id="implant_open_batch" value={opening.batchNumber} onChange={(e) => setOpen('batchNumber', e.target.value)} placeholder="Optional" />
            </FieldRow>
            <FieldRow label="Expiry Date" htmlFor="implant_open_expiry" required={hasOpening}>
              <Input id="implant_open_expiry" type="date" value={opening.expiryDate} onChange={(e) => setOpen('expiryDate', e.target.value)} />
            </FieldRow>
            <FieldRow label="Cost / Piece (₹)" htmlFor="implant_open_cost">
              <Input
                id="implant_open_cost"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={opening.cost}
                onChange={(e) => setOpen('cost', e.target.value)}
                placeholder="Optional"
              />
            </FieldRow>
          </>
        )}
      </FormDialog>
      <MessageDialog state={message} onClose={() => setMessage(closedMessage)} />
    </>
  );
}
