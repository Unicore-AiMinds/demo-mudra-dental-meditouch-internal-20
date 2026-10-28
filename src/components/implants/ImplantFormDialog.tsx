import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Implant } from '@/lib/implants';
import { FieldRow, FormDialog, MessageDialog } from './shared';
import { MessageState, closedMessage } from './utils';

export type ImplantFormValues = Omit<Implant, 'id'>;

const EMPTY: ImplantFormValues = { item: '', subItem: '', unit: 'Piece', minThreshold: 1, description: '' };

// Add New Implant / Edit Implant (like Stock Tracker's "Add New Item", without Rate)
export default function ImplantFormDialog({
  open,
  onOpenChange,
  implant,
  existing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  implant: Implant | null; // null = add
  existing: Implant[];
  onSave: (values: ImplantFormValues) => void;
}) {
  const [values, setValues] = useState<ImplantFormValues>(EMPTY);
  const [threshold, setThreshold] = useState('1');
  const [message, setMessage] = useState<MessageState>(closedMessage);

  useEffect(() => {
    if (!open) return;
    const start = implant ? { ...implant } : EMPTY;
    setValues(start);
    setThreshold(String(start.minThreshold));
  }, [open, implant]);

  const set = (key: keyof ImplantFormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

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
    onSave({ item, subItem, unit: 'Piece', minThreshold: min, description: values.description.trim() });
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
      </FormDialog>
      <MessageDialog state={message} onClose={() => setMessage(closedMessage)} />
    </>
  );
}
