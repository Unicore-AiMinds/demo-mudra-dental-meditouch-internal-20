import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsCompact } from '@/hooks/use-compact';
import { COMPACT_FULLSCREEN_DIALOG, COMPACT_DIALOG_BODY } from '@/lib/compact';
import { cn } from '@/lib/utils';
import { Implant, ImplantState, ImplantTransaction, batchLeft, implantBatches, isExpired } from '@/lib/implants';
import { TypeBadge } from './shared';
import { formatDate, formatExpiry, implantName, todayISO } from './utils';

const details = (t: ImplantTransaction) => {
  if (t.type === 'Consumption') return [t.patientName, t.toothNo && `Tooth ${t.toothNo}`].filter(Boolean).join(' · ');
  if (t.type === 'Return') return t.notes || '—';
  return t.batchNumber ? `Batch ${t.batchNumber}` : '—';
};

const ExpiredTag = () => (
  <Badge variant="outline" className="ml-1 bg-red-100 text-red-700 border-red-300 text-[10px] px-1.5 py-0">
    Expired
  </Badge>
);

// View Batches & History: per dealer batch counts and every movement
export default function ImplantHistoryDialog({
  open,
  onOpenChange,
  implant,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  implant: Implant;
  state: ImplantState;
}) {
  const isCompact = useIsCompact();
  const today = todayISO();
  const [tab, setTab] = useState('batches');

  useEffect(() => {
    if (open) setTab('batches');
  }, [open, implant.id]);

  const batches = useMemo(
    () => implantBatches(state, implant.id).sort((a, b) => a.receivedDate.localeCompare(b.receivedDate)),
    [state, implant.id]
  );
  // Newest first; entries on the same day keep the order they were recorded in (latest first)
  const transactions = useMemo(
    () => state.transactions.filter((t) => t.implantId === implant.id).sort((a, b) => b.date.localeCompare(a.date)),
    [state.transactions, implant.id]
  );
  const sum = (key: 'received' | 'used' | 'returned') => batches.reduce((s, b) => s + b[key], 0);
  const totalLeft = batches.reduce((s, b) => s + batchLeft(b), 0);

  const empty = (text: string) => <div className="text-center py-4 text-muted-foreground">{text}</div>;

  const batchesView = isCompact ? (
    <div className="space-y-2">
      {batches.map((b) => (
        <div key={b.id} className={cn('rounded-md border p-3 text-sm', isExpired(b, today) && 'bg-red-50')} data-testid="batch-card">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium">{b.dealerName}</div>
            <div className="text-right font-semibold whitespace-nowrap">{batchLeft(b)} left</div>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Batch {b.batchNumber || '—'} · Received {formatDate(b.receivedDate)} · Exp {formatExpiry(b.expiryDate)}
            {isExpired(b, today) && <ExpiredTag />}
          </div>
          <div className="text-xs mt-1">
            Received {b.received} · Used {b.used} · Returned {b.returned}
          </div>
        </div>
      ))}
      <div className="rounded-md bg-muted/50 px-3 py-2 text-sm font-medium flex justify-between">
        <span>Total</span>
        <span>
          {sum('received')} received · {sum('used')} used · {sum('returned')} returned · {totalLeft} left
        </span>
      </div>
    </div>
  ) : (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dealer</TableHead>
            <TableHead>Batch #</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead className="text-right">Used</TableHead>
            <TableHead className="text-right">Returned</TableHead>
            <TableHead className="text-right">Left</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => (
            <TableRow key={b.id} className={isExpired(b, today) ? 'bg-red-50' : ''}>
              <TableCell className="font-medium">{b.dealerName}</TableCell>
              <TableCell>{b.batchNumber || '—'}</TableCell>
              <TableCell>{formatDate(b.receivedDate)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatExpiry(b.expiryDate)}
                {isExpired(b, today) && <ExpiredTag />}
              </TableCell>
              <TableCell className="text-right">{b.received}</TableCell>
              <TableCell className="text-right">{b.used}</TableCell>
              <TableCell className="text-right">{b.returned}</TableCell>
              <TableCell className="text-right font-semibold">{batchLeft(b)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">{sum('received')}</TableCell>
            <TableCell className="text-right">{sum('used')}</TableCell>
            <TableCell className="text-right">{sum('returned')}</TableCell>
            <TableCell className="text-right">{totalLeft}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );

  const transactionsView = isCompact ? (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div key={t.id} className="rounded-md border p-3 text-sm" data-testid="transaction-card">
          <div className="flex items-center justify-between gap-2">
            <TypeBadge type={t.type} />
            <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span className="font-medium">{t.dealerName}</span>
            <span className="font-semibold">{t.quantity}</span>
          </div>
          <div className="text-xs text-muted-foreground">{details(t)}</div>
        </div>
      ))}
    </div>
  ) : (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Dealer</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Patient / Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
              <TableCell>
                <TypeBadge type={t.type} />
              </TableCell>
              <TableCell>{t.dealerName}</TableCell>
              <TableCell className="text-right">{t.quantity}</TableCell>
              <TableCell>{details(t)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isCompact ? COMPACT_FULLSCREEN_DIALOG : 'sm:max-w-[760px] max-h-[80vh] overflow-y-auto'}>
        <DialogHeader className={isCompact ? 'px-4 pt-4 text-left' : undefined}>
          <DialogTitle>{implantName(implant)}</DialogTitle>
          <DialogDescription>View batch and transaction history</DialogDescription>
        </DialogHeader>
        <div className={isCompact ? COMPACT_DIALOG_BODY : undefined}>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batches">Batches</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="batches" className="mt-4">
              {batches.length === 0 ? empty('No batch information available.') : batchesView}
            </TabsContent>
            <TabsContent value="transactions" className="mt-4">
              {transactions.length === 0 ? empty('No transaction history available.') : transactionsView}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
