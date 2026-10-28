// Sample data for the Implant Tracker demo (no database yet). Dates are counted from today so
// the "Expiring Soon" example stays valid whenever the demo is shown.
// In the demo a dealer is identified by its name (dealerId = dealer name).
import { format, addDays, addMonths } from 'date-fns';
import { ImplantBatch, ImplantState, ImplantTransaction } from './implants';

const day = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd');
const month = (offset: number) => format(addMonths(new Date(), offset), 'yyyy-MM-dd');

let seq = 0;
const batch = (implantId: string, dealer: string, batchNumber: string, receivedDate: string, expiryDate: string, received: number, used = 0, returned = 0): ImplantBatch => ({
  id: `sample-b${++seq}`,
  implantId,
  dealerId: dealer,
  dealerName: dealer,
  batchNumber,
  expiryDate,
  receivedDate,
  received,
  used,
  returned,
});

const tx = (b: ImplantBatch, type: ImplantTransaction['type'], date: string, quantity: number, extra: Partial<ImplantTransaction> = {}): ImplantTransaction => ({
  id: `sample-t${++seq}`,
  implantId: b.implantId,
  type,
  date,
  dealerName: b.dealerName,
  quantity,
  batchNumber: b.batchNumber || undefined,
  ...extra,
});

export const createSampleImplantState = (): ImplantState => {
  const b1 = batch('i1', 'Rahul Adin', 'OS2410A', day(-26), month(36), 4, 1, 0);
  const b2 = batch('i1', 'Samarth Dental', '', day(-23), month(29), 3, 0, 1);
  const b3 = batch('i2', 'Rahul Adin', 'OS2411B', day(-40), month(30), 2, 1, 0);
  const b4 = batch('i3', 'Rahul Adin', 'AD771', day(-60), month(24), 2, 2, 0);
  const b5 = batch('i3', 'Nitin GC', 'AD802', day(-35), month(26), 1, 0, 1);
  const b6 = batch('i4', 'Samarth Dental', 'DS5521', day(-200), day(45), 4, 0, 0);
  const b7 = batch('i5', 'Chintamani Surgical', 'SB1093', day(-18), month(40), 2, 0, 0);
  const b8 = batch('i5', 'Phoneix Surgical', 'SB1101', day(-15), month(42), 3, 1, 0);
  const b9 = batch('i5', 'Chintamani Surgical', 'SB0950', day(-400), day(-20), 1, 0, 0); // expired, 1 left

  const transactions: ImplantTransaction[] = [
    tx(b8, 'Consumption', day(-3), 1, { patientName: 'Anjali Railkar', toothNo: '36' }),
    tx(b2, 'Return', day(-8), 1, { batchNumber: undefined, notes: 'Wrong size' }),
    tx(b1, 'Consumption', day(-13), 1, { patientName: 'Swati Gode', toothNo: '46' }),
    tx(b3, 'Consumption', day(-14), 1, { patientName: 'Swati Gode' }),
    tx(b5, 'Return', day(-20), 1, { notes: 'Not needed' }),
    tx(b8, 'Incoming', day(-15), 3),
    tx(b4, 'Consumption', day(-22), 2, { patientName: 'Anjali Railkar', toothNo: '14, 15' }),
    tx(b2, 'Incoming', day(-23), 3),
    tx(b1, 'Incoming', day(-26), 4),
    tx(b7, 'Incoming', day(-18), 2),
    tx(b5, 'Incoming', day(-35), 1),
    tx(b3, 'Incoming', day(-40), 2),
    tx(b4, 'Incoming', day(-60), 2),
    tx(b6, 'Incoming', day(-200), 4),
    tx(b9, 'Incoming', day(-400), 1),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    implants: [
      { id: 'i1', item: 'Osstem TS III', subItem: '4.0 × 10 mm', unit: 'Piece', minThreshold: 2, description: 'Bone level, regular platform' },
      { id: 'i2', item: 'Osstem TS III', subItem: '4.5 × 11.5 mm', unit: 'Piece', minThreshold: 2, description: '' },
      { id: 'i3', item: 'Adin Touareg-S', subItem: '3.75 × 10 mm', unit: 'Piece', minThreshold: 1, description: '' },
      { id: 'i4', item: 'Dentium SuperLine', subItem: '4.0 × 10 mm', unit: 'Piece', minThreshold: 2, description: '' },
      { id: 'i5', item: 'Straumann BLT', subItem: '4.1 × 10 mm', unit: 'Piece', minThreshold: 1, description: 'Bone level tapered' },
    ],
    batches: [b1, b2, b3, b4, b5, b6, b7, b8, b9],
    transactions,
  };
};
