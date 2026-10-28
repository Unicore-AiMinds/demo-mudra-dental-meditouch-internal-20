// Implant Tracker (POC): quantity rules for implants received from several dealers.
// A batch is one delivery from one dealer; left = received − used − returned.

export interface Implant {
  id: string;
  item: string;
  subItem: string;
  unit: string;
  minThreshold: number;
  description: string;
}

export interface ImplantBatch {
  id: string;
  implantId: string;
  dealerId: string;
  dealerName: string;
  batchNumber: string;
  expiryDate: string; // yyyy-MM-dd
  receivedDate: string; // yyyy-MM-dd
  received: number;
  used: number;
  returned: number;
}

export type ImplantTransactionType = 'Incoming' | 'Consumption' | 'Return';

export interface ImplantTransaction {
  id: string;
  implantId: string;
  type: ImplantTransactionType;
  date: string; // yyyy-MM-dd
  dealerName: string;
  quantity: number;
  batchNumber?: string;
  patientId?: string;
  patientName?: string;
  toothNo?: string;
  notes?: string;
}

export interface ImplantState {
  implants: Implant[];
  batches: ImplantBatch[];
  transactions: ImplantTransaction[];
}

export type ImplantStatus = 'Out of Stock' | 'Expired' | 'Expiring Soon' | 'Low Stock' | 'Normal';

export interface DealerStock {
  dealerId: string;
  dealerName: string;
  left: number;
  usable: number; // left in batches that have not expired
}

// Error with the popup title to show (Stock Tracker style)
export class ImplantError extends Error {
  constructor(public title: string, message: string) {
    super(message);
  }
}

const EXPIRING_DAYS = 60;

export const pieces = (n: number) => `${n} ${n === 1 ? 'Piece' : 'Pieces'}`;

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);

// The expiry date itself is still usable; the batch is expired from the next day
export const isExpired = (batch: ImplantBatch, today: string) => batch.expiryDate < today;

export const batchLeft = (batch: ImplantBatch) => batch.received - batch.used - batch.returned;

const byExpiry = (a: ImplantBatch, b: ImplantBatch) => a.expiryDate.localeCompare(b.expiryDate);

export const implantBatches = (state: ImplantState, implantId: string) =>
  state.batches.filter((b) => b.implantId === implantId);

export const dealerStock = (state: ImplantState, implantId: string, today?: string): DealerStock[] => {
  const map = new Map<string, DealerStock>();
  for (const b of implantBatches(state, implantId)) {
    const entry = map.get(b.dealerId) ?? { dealerId: b.dealerId, dealerName: b.dealerName, left: 0, usable: 0 };
    entry.left += batchLeft(b);
    if (!isExpired(b, today ?? new Date().toISOString().slice(0, 10))) entry.usable += batchLeft(b);
    map.set(b.dealerId, entry);
  }
  return [...map.values()];
};

export const implantTotal = (state: ImplantState, implantId: string) =>
  implantBatches(state, implantId).reduce((sum, b) => sum + batchLeft(b), 0);

const isExpiringSoon = (batch: ImplantBatch, today: string) =>
  !isExpired(batch, today) && daysBetween(today, batch.expiryDate) <= EXPIRING_DAYS;

// One status per implant, same order as Stock Tracker:
// Out of Stock → Expired → Expiring Soon → Low Stock (at or below Min. Threshold) → Normal
export const implantStatus = (state: ImplantState, implantId: string, today: string): ImplantStatus => {
  const implant = state.implants.find((i) => i.id === implantId);
  const total = implantTotal(state, implantId);
  if (total <= 0) return 'Out of Stock';
  const withPieces = implantBatches(state, implantId).filter((b) => batchLeft(b) > 0);
  if (withPieces.some((b) => isExpired(b, today))) return 'Expired';
  if (withPieces.some((b) => isExpiringSoon(b, today))) return 'Expiring Soon';
  if (implant && total <= implant.minThreshold) return 'Low Stock';
  return 'Normal';
};

export interface NearestExpiry {
  date: string;
  pieces: number; // pieces left in the batches with this date
  expired: boolean;
  expiringSoon: boolean;
}

// Earliest expiry among batches that still have pieces (empty batches are ignored)
export const nearestExpiry = (state: ImplantState, implantId: string, today: string): NearestExpiry | null => {
  const withPieces = implantBatches(state, implantId).filter((b) => batchLeft(b) > 0).sort(byExpiry);
  if (withPieces.length === 0) return null;
  const first = withPieces[0];
  return {
    date: first.expiryDate,
    pieces: withPieces.filter((b) => b.expiryDate === first.expiryDate).reduce((sum, b) => sum + batchLeft(b), 0),
    expired: isExpired(first, today),
    expiringSoon: isExpiringSoon(first, today),
  };
};

export type BatchStatus = 'Out of Stock' | 'Expired' | 'Expiring Soon' | 'Good';

// Status of one batch (words of Stock Tracker's batch list)
export const batchStatus = (batch: ImplantBatch, today: string): BatchStatus => {
  if (batchLeft(batch) <= 0) return 'Out of Stock';
  if (isExpired(batch, today)) return 'Expired';
  if (isExpiringSoon(batch, today)) return 'Expiring Soon';
  return 'Good';
};

// Batches a consumption can take from: not expired, pieces left, earliest expiry first (FEFO)
export const usableBatches = (state: ImplantState, implantId: string, dealerId: string, today: string) =>
  implantBatches(state, implantId)
    .filter((b) => b.dealerId === dealerId && batchLeft(b) > 0 && !isExpired(b, today))
    .sort(byExpiry);

// Batches a return can take from: pieces left (expired included), earliest expiry first
export const returnableBatches = (state: ImplantState, implantId: string, dealerId: string) =>
  implantBatches(state, implantId)
    .filter((b) => b.dealerId === dealerId && batchLeft(b) > 0)
    .sort(byExpiry);

// Split a quantity over batches in order; returns [batchId, qty][]
const allocate = (batches: ImplantBatch[], quantity: number) => {
  const parts: [string, number][] = [];
  let remaining = quantity;
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batchLeft(b), remaining);
    if (take > 0) parts.push([b.id, take]);
    remaining -= take;
  }
  return parts;
};

const formatExpiry = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

export interface IncomingInput {
  implantId: string;
  receivedDate: string;
  rows: { dealerId: string; dealerName: string; quantity: number; batchNumber: string; expiryDate: string }[];
}

export const recordIncoming = (state: ImplantState, input: IncomingInput): ImplantState => {
  const newBatches: ImplantBatch[] = input.rows.map((r) => ({
    id: newId('b'),
    implantId: input.implantId,
    dealerId: r.dealerId,
    dealerName: r.dealerName,
    batchNumber: r.batchNumber.trim(),
    expiryDate: r.expiryDate,
    receivedDate: input.receivedDate,
    received: r.quantity,
    used: 0,
    returned: 0,
  }));
  const newTransactions: ImplantTransaction[] = newBatches.map((b) => ({
    id: newId('t'),
    implantId: input.implantId,
    type: 'Incoming',
    date: input.receivedDate,
    dealerName: b.dealerName,
    quantity: b.received,
    batchNumber: b.batchNumber || undefined,
  }));
  return { ...state, batches: [...state.batches, ...newBatches], transactions: [...newTransactions, ...state.transactions] };
};

export interface ConsumptionInput {
  implantId: string;
  dealerId: string;
  batchId?: string;
  quantity: number;
  date: string;
  patientId: string;
  patientName: string;
  toothNo?: string;
}

export const recordConsumption = (state: ImplantState, input: ConsumptionInput, today: string): ImplantState => {
  let source = usableBatches(state, input.implantId, input.dealerId, today);
  if (input.batchId) {
    const chosen = state.batches.find((b) => b.id === input.batchId && b.dealerId === input.dealerId);
    if (chosen && isExpired(chosen, today)) {
      throw new ImplantError('Batch Expired', `This batch has expired (${formatExpiry(chosen.expiryDate)}). Please choose another batch.`);
    }
    source = chosen ? [chosen] : [];
  }
  const available = source.reduce((sum, b) => sum + batchLeft(b), 0);
  if (available <= 0) {
    throw new ImplantError('No Stock Available', 'This implant is currently out of stock. No consumption can be recorded until new stock is received.');
  }
  if (input.quantity > available) {
    throw new ImplantError('Insufficient Stock', `Insufficient stock available. You can consume up to ${pieces(available)}.`);
  }
  const parts = allocate(source, input.quantity);
  const batches = state.batches.map((b) => {
    const part = parts.find(([id]) => id === b.id);
    return part ? { ...b, used: b.used + part[1] } : b;
  });
  const first = state.batches.find((b) => b.id === parts[0][0])!;
  const transaction: ImplantTransaction = {
    id: newId('t'),
    implantId: input.implantId,
    type: 'Consumption',
    date: input.date,
    dealerName: first.dealerName,
    quantity: input.quantity,
    batchNumber: first.batchNumber || undefined,
    patientId: input.patientId,
    patientName: input.patientName,
    toothNo: input.toothNo?.trim() || undefined,
  };
  return { ...state, batches, transactions: [transaction, ...state.transactions] };
};

export interface ReturnInput {
  implantId: string;
  dealerId: string;
  batchId?: string;
  quantity: number;
  date: string;
  notes?: string;
}

export const recordReturn = (state: ImplantState, input: ReturnInput): ImplantState => {
  let source = returnableBatches(state, input.implantId, input.dealerId);
  if (input.batchId) source = source.filter((b) => b.id === input.batchId);
  const available = source.reduce((sum, b) => sum + batchLeft(b), 0);
  const dealerName = state.batches.find((b) => b.dealerId === input.dealerId)?.dealerName ?? '';
  if (available <= 0) {
    throw new ImplantError('No Stock Available', `There are no pieces left from ${dealerName} to return.`);
  }
  if (input.quantity > available) {
    throw new ImplantError('Insufficient Stock', `${dealerName} has only ${pieces(available)}. You can return up to ${pieces(available)}.`);
  }
  const parts = allocate(source, input.quantity);
  const batches = state.batches.map((b) => {
    const part = parts.find(([id]) => id === b.id);
    return part ? { ...b, returned: b.returned + part[1] } : b;
  });
  const first = state.batches.find((b) => b.id === parts[0][0])!;
  const transaction: ImplantTransaction = {
    id: newId('t'),
    implantId: input.implantId,
    type: 'Return',
    date: input.date,
    dealerName,
    quantity: input.quantity,
    batchNumber: first.batchNumber || undefined,
    notes: input.notes?.trim() || undefined,
  };
  return { ...state, batches, transactions: [transaction, ...state.transactions] };
};
