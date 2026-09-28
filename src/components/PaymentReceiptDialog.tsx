import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
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
import { DatePicker } from '@/components/ui/date-picker';
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
  const [dated, setDated] = useState<Date | undefined>(undefined);
  const [treatment, setTreatment] = useState('');

  // Prefill each time the dialog is opened for an appointment
  useEffect(() => {
    if (open && prefill) {
      setSrNo('');
      setDate(prefill.date || '');
      setReceivedFrom(prefill.patientName || '');
      setAmount('');
      setDdNo('');
      setDated(undefined);
      setTreatment(prefill.service || '');
    }
  }, [open, prefill]);

  const words = rupeesToWords(amount);
  const amountWords = words ? `${words} Only` : '';           // e.g. "One Thousand Five Hundred Only"
  const amountFigure = amount && amount.trim() ? `${amount.trim()}/-` : ''; // e.g. "1500/-"

  /** Build a WIDE A4-landscape receipt PDF (to match the paper) and download it. */
  const handleDownload = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;
    const cx = W / 2;
    const left = 22;
    const right = W - 22;
    const blank = '__________________';

    // Draw "label  value(bold)" starting at x; returns x after the value
    const field = (label: string, value: string, x: number, y: number, gap = 3) => {
      doc.setFont('times', 'normal');
      doc.text(label, x, y);
      const lw = doc.getTextWidth(label);
      doc.setFont('times', 'bold');
      doc.text(value || blank, x + lw + gap, y);
      const vw = doc.getTextWidth(value || blank);
      doc.setFont('times', 'normal');
      return x + lw + gap + vw;
    };

    // Header
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.text('Dr. Bhargavi Railkar - Kolhapure', cx, 24, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text('BDS, MDS   |   Prosthodontist & Implantologist   |   Regd. No.: A-14618', cx, 32, { align: 'center' });
    doc.setFontSize(10);
    doc.text('1495, Sadashiv Peth, Sahitya Samrat Apartment, Pratima Silk Lane, Off. Tilak Road, Pune 411 030.', cx, 39, { align: 'center' });
    doc.text('Tel : +91 20 2447 2227', cx, 45, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(left, 50, right, 50);

    // Body
    doc.setFontSize(13);
    field('Sr. No.:', srNo, left, 68);
    field('Date :', date, right - 60, 68);

    field('Received with thanks from', receivedFrom, left, 88);

    let x = field('the Sum of Rs.', amountFigure, left, 108);
    doc.setFont('times', 'normal');
    doc.text(`( Rupees ${amountWords || blank} )`, x + 8, 108);

    x = field('by Cash / Cheque / D. D. No.', ddNo, left, 128);
    field('dated', dated ? format(dated, 'dd/MM/yyyy') : '', x + 8, 128);

    doc.setFont('times', 'normal');
    doc.text('for the Treatment', left, 148);
    const tlw = doc.getTextWidth('for the Treatment');
    doc.setFont('times', 'bold');
    doc.text(doc.splitTextToSize(treatment || blank, right - (left + tlw + 4)), left + tlw + 4, 148);

    // Signature
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text('Dr. Bhargavi Railkar - Kolhapure', right, 190, { align: 'right' });

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
              <Label>dated</Label>
              <DatePicker date={dated} setDate={setDated} />
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
