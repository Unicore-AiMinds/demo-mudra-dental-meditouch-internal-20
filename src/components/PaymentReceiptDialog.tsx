import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';

export interface ReceiptPrefill {
  patientName: string;
  service: string;
  date: string; // dd/MM/yyyy
}

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill: ReceiptPrefill | null;
}

/** Convert a whole rupee amount to Indian-English words (e.g. 1250 -> "One Thousand Two Hundred Fifty"). */
function rupeesToWords(input: string): string {
  const n = Math.floor(Number(String(input).replace(/[^0-9.]/g, '')) || 0);
  if (n === 0) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (num: number): string => {
    if (num < 20) return ones[num];
    return `${tens[Math.floor(num / 10)]}${num % 10 ? ' ' + ones[num % 10] : ''}`;
  };
  const threeDigits = (num: number): string => {
    const h = Math.floor(num / 100);
    const rest = num % 100;
    return `${h ? ones[h] + ' Hundred' + (rest ? ' ' : '') : ''}${rest ? twoDigits(rest) : ''}`;
  };

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const PaymentReceiptDialog = ({ open, onOpenChange, prefill }: PaymentReceiptDialogProps) => {
  const [srNo, setSrNo] = useState('');
  const [date, setDate] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount] = useState('');
  const [ddNo, setDdNo] = useState('');
  const [dated, setDated] = useState('');
  const [treatment, setTreatment] = useState('');

  // Prefill each time the dialog is opened for an appointment
  useEffect(() => {
    if (open && prefill) {
      setSrNo('');
      setDate(prefill.date || '');
      setReceivedFrom(prefill.patientName || '');
      setAmount('');
      setDdNo('');
      setDated('');
      setTreatment(prefill.service || '');
    }
  }, [open, prefill]);

  const amountWords = rupeesToWords(amount);

  /** Build a compact A6-landscape receipt PDF and download it (no browser print chrome). */
  const handleDownload = () => {
    // 148mm x 105mm (A6 landscape) - a compact receipt slip, no wasted margins
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a6' });
    const W = 148;
    const cx = W / 2;
    const left = 12;
    const right = W - 12;

    // Header
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('Dr. Bhargavi Railkar - Kolhapure', cx, 13, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('BDS, MDS  |  Prosthodontist & Implantologist  |  Regd. No.: A-14618', cx, 18, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('1495, Sadashiv Peth, Sahitya Samrat Apartment, Pratima Silk Lane, Off. Tilak Road, Pune 411 030.', cx, 22.5, { align: 'center' });
    doc.text('Tel : +91 20 2447 2227', cx, 26, { align: 'center' });
    doc.setLineWidth(0.4);
    doc.line(left, 29, right, 29);

    // Body
    doc.setFontSize(10);
    const val = (s: string) => (s && s.trim() ? s : '____________');

    doc.setFont('times', 'normal');
    doc.text('Sr. No.:', left, 38);
    doc.setFont('times', 'bold');
    doc.text(val(srNo), left + 16, 38);
    doc.setFont('times', 'normal');
    doc.text('Date :', right - 32, 38);
    doc.setFont('times', 'bold');
    doc.text(val(date), right - 22, 38);

    doc.setFont('times', 'normal');
    doc.text('Received with thanks from', left, 47);
    doc.setFont('times', 'bold');
    doc.text(val(receivedFrom), left + 47, 47);

    doc.setFont('times', 'normal');
    doc.text('the Sum of Rs.', left, 56);
    doc.setFont('times', 'bold');
    doc.text(val(amount), left + 27, 56);
    doc.setFont('times', 'normal');
    const rupeesLabel = `( Rupees ${amountWords || '____________'} )`;
    doc.text(rupeesLabel, left + 45, 56);

    doc.setFont('times', 'normal');
    doc.text('by Cash / Cheque / D. D. No.', left, 65);
    doc.setFont('times', 'bold');
    doc.text(val(ddNo), left + 52, 65);
    doc.setFont('times', 'normal');
    doc.text('dated', left + 72, 65);
    doc.setFont('times', 'bold');
    doc.text(val(dated), left + 84, 65);

    doc.setFont('times', 'normal');
    doc.text('for the Treatment', left, 74);
    doc.setFont('times', 'bold');
    const treatmentLines = doc.splitTextToSize(val(treatment), right - (left + 32));
    doc.text(treatmentLines, left + 32, 74);

    // Signature
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text('Dr. Bhargavi Railkar - Kolhapure', right, 96, { align: 'right' });

    const safeName = (receivedFrom || 'receipt').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-');
    doc.save(`Receipt-${safeName || 'receipt'}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="receipt-srno">Sr. No.</Label>
              <Input id="receipt-srno" value={srNo} onChange={(e) => setSrNo(e.target.value)} placeholder="e.g. 361" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="receipt-date">Date</Label>
              <Input id="receipt-date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="receipt-from">Received with thanks from</Label>
            <Input id="receipt-from" value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="receipt-amount">Sum of Rs.</Label>
              <Input id="receipt-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1500" />
            </div>
            <div className="grid gap-1.5">
              <Label>Rupees (in words)</Label>
              <Input value={amountWords} readOnly tabIndex={-1} className="bg-muted text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="receipt-dd">Cash / Cheque / D.D. No.</Label>
              <Input id="receipt-dd" value={ddNo} onChange={(e) => setDdNo(e.target.value)} placeholder="Cash" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="receipt-dated">dated</Label>
              <Input id="receipt-dated" value={dated} onChange={(e) => setDated(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="receipt-treatment">for the Treatment</Label>
            <Input id="receipt-treatment" value={treatment} onChange={(e) => setTreatment(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleDownload} className="bg-dental-primary hover:bg-dental-dark">
            <Download className="h-4 w-4 mr-2" /> Download Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReceiptDialog;
