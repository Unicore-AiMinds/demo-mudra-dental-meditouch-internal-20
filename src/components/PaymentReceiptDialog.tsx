import { useState, useEffect } from 'react';
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
import { Printer } from 'lucide-react';

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

  const handlePrint = () => {
    const esc = (s: string) =>
      String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt${receivedFrom ? ' - ' + esc(receivedFrom) : ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A5 landscape; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; }
            body { font-family: 'Times New Roman', Georgia, serif; color: #111; }
            .receipt { width: 210mm; max-width: 210mm; padding: 16mm 18mm; }
            .head { text-align: center; border-bottom: 1.5px solid #111; padding-bottom: 8px; margin-bottom: 18px; }
            .name { font-size: 22px; font-weight: bold; letter-spacing: .3px; }
            .quals { font-size: 12px; margin-top: 2px; }
            .addr { font-size: 12px; margin-top: 6px; line-height: 1.4; }
            .row { display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 16px; }
            .line { font-size: 15px; margin-bottom: 16px; line-height: 1.8; }
            .fill { display: inline-block; border-bottom: 1px dotted #111; min-width: 60px; padding: 0 6px; font-weight: 600; }
            .fill.wide { min-width: 320px; }
            .fill.full { min-width: 100%; display: block; margin-top: 4px; }
            .sign { margin-top: 42px; text-align: right; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="head">
              <div class="name">Dr. Bhargavi Railkar - Kolhapure</div>
              <div class="quals">BDS, MDS &nbsp;|&nbsp; Prosthodontist &amp; Implantologist &nbsp;|&nbsp; Regd. No.: A-14618</div>
              <div class="addr">1495, Sadashiv Peth, Sahitya Samrat Apartment, Pratima Silk Lane, Off. Tilak Road, Pune 411 030.<br/>Tel : +91 20 2447 2227</div>
            </div>

            <div class="row">
              <div>Sr. No.: <span class="fill">${esc(srNo)}</span></div>
              <div>Date : <span class="fill">${esc(date)}</span></div>
            </div>

            <div class="line">Received with thanks from <span class="fill wide">${esc(receivedFrom)}</span></div>

            <div class="line">the Sum of Rs. <span class="fill">${esc(amount)}</span> ( Rupees <span class="fill wide">${esc(amountWords)}</span> )</div>

            <div class="line">by Cash / Cheque / D. D. No. <span class="fill">${esc(ddNo)}</span> dated <span class="fill">${esc(dated)}</span></div>

            <div class="line">for the Treatment <span class="fill full">${esc(treatment)}</span></div>

            <div class="sign">Dr. Bhargavi Railkar - Kolhapure</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1000);
      }
    }, 250);
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
          <Button onClick={handlePrint} className="bg-dental-primary hover:bg-dental-dark">
            <Printer className="h-4 w-4 mr-2" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReceiptDialog;
