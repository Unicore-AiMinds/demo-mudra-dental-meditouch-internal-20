import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ConsumptionInput,
  Implant,
  ImplantError,
  ImplantState,
  batchLeft,
  dealerStock,
  pieces,
  recordConsumption,
  usableBatches,
} from '@/lib/implants';
import { ConfirmDialog, DealerPicker, FieldRow, FormDialog, MessageDialog } from './shared';
import { MessageState, closedMessage, formatExpiry, implantName, todayISO } from './utils';

const FEFO = 'fefo';

// Record Stock Consumption: an implant used for a patient, from one dealer
export default function ImplantConsumeDialog({
  open,
  onOpenChange,
  implant,
  state,
  patients,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  implant: Implant;
  state: ImplantState;
  patients: { value: string; label: string }[];
  onSave: (input: ConsumptionInput) => void; // throws ImplantError
}) {
  const today = todayISO();
  const [patientId, setPatientId] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [batchId, setBatchId] = useState(FEFO);
  const [quantity, setQuantity] = useState('1');
  const [toothNo, setToothNo] = useState('');
  const [date, setDate] = useState(today);
  const [message, setMessage] = useState<MessageState>(closedMessage);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dealers = useMemo(
    () => dealerStock(state, implant.id, today).filter((d) => d.usable > 0),
    [state, implant.id, today]
  );
  const batches = useMemo(
    () => (dealerId ? usableBatches(state, implant.id, dealerId, today) : []),
    [state, implant.id, dealerId, today]
  );

  useEffect(() => {
    if (!open) return;
    setPatientId('');
    setDealerId(dealers.length === 1 ? dealers[0].dealerId : '');
    setBatchId(FEFO);
    setQuantity('1');
    setToothNo('');
    setDate(todayISO());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, implant.id]);

  const patientName = patients.find((p) => p.value === patientId)?.label ?? '';
  const dealer = dealers.find((d) => d.dealerId === dealerId);
  const qty = Number(quantity);
  const fail = (title: string, text: string) => setMessage({ isOpen: true, title, message: text });

  const input = (): ConsumptionInput => ({
    implantId: implant.id,
    dealerId,
    batchId: batchId === FEFO ? undefined : batchId,
    quantity: qty,
    date,
    patientId,
    patientName,
    toothNo,
  });

  const handleSubmit = () => {
    if (dealers.length === 0) {
      return fail('No Stock Available', 'This implant is currently out of stock. No consumption can be recorded until new stock is received.');
    }
    if (!patientId) return fail('Missing Information', 'Please select the patient.');
    if (!dealerId) return fail('Missing Information', 'Please select the dealer whose implant was used.');
    if (!Number.isInteger(qty) || qty <= 0) return fail('Record Stock Usage', 'Please enter a valid quantity to consume.');
    if (!date) return fail('Missing Information', 'Please select the date when this implant was used.');
    try {
      recordConsumption(state, input(), today); // dry run: same rules as the save (nothing is stored)
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
        title="Record Stock Consumption"
        description={`Record use of ${implantName(implant)}`}
        onSubmit={handleSubmit}
      >
        <FieldRow label="Patient Name" required>
          <Combobox options={patients} value={patientId} onChange={setPatientId} placeholder="Select Patient" emptyMessage="No patients found" />
        </FieldRow>
        <FieldRow label="Dealer" required alignTop>
          <DealerPicker
            dealers={dealers}
            value={dealerId}
            onChange={(id) => {
              setDealerId(id);
              setBatchId(FEFO);
            }}
            countOf={(d) => d.usable}
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
                <SelectItem value={FEFO}>Use FEFO (First Expiry, First Out)</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batchNumber || 'Batch'} - {pieces(batchLeft(b))} (Exp: {formatExpiry(b.expiryDate)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        )}
        <FieldRow label="Quantity Used" htmlFor="implant_qty_used" required>
          <Input id="implant_qty_used" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </FieldRow>
        <FieldRow label="Tooth No." htmlFor="implant_tooth">
          <Input id="implant_tooth" value={toothNo} onChange={(e) => setToothNo(e.target.value)} placeholder="e.g., 36" />
        </FieldRow>
        <FieldRow label="Date Used" htmlFor="implant_date_used" required>
          <Input id="implant_date_used" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldRow>
      </FormDialog>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Confirm Stock Consumption" onConfirm={handleConfirm}>
        <p>
          You are about to record <b>{pieces(qty || 0)}</b> of <b>{implantName(implant)}</b> used for <b>{patientName}</b>, from{' '}
          <b>{dealer?.dealerName}</b>.
          {dealer && ` ${dealer.dealerName} will have ${dealer.left - qty} left.`}
        </p>
        {toothNo.trim() && <p className="mt-1">Tooth No.: {toothNo.trim()}</p>}
      </ConfirmDialog>

      <MessageDialog state={message} onClose={() => setMessage(closedMessage)} />
    </>
  );
}
