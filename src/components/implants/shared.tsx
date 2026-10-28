// Shared pieces of the Implant Tracker popups (POC). Same look and words as the Stock Tracker
// dialogs; on phones/tablets (< 1024px) the popups open full screen like the other ERP pages.
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIsCompact } from '@/hooks/use-compact';
import { COMPACT_FULLSCREEN_DIALOG, COMPACT_DIALOG_BODY, COMPACT_STICKY_FOOTER } from '@/lib/compact';
import { cn } from '@/lib/utils';
import { BatchStatus, DealerStock, ImplantStatus, ImplantTransactionType } from '@/lib/implants';
import { MessageState } from './utils';

// Popup with a form: title, fields, Cancel / Save
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  wide = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onSubmit: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const isCompact = useIsCompact();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={isCompact ? COMPACT_FULLSCREEN_DIALOG : cn('max-h-[90vh] overflow-y-auto', wide ? 'sm:max-w-[640px]' : 'sm:max-w-[500px]')}
      >
        <DialogHeader className={isCompact ? 'px-4 pt-4 text-left' : undefined}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={isCompact ? 'flex min-h-0 flex-1 flex-col' : undefined}
        >
          <div className={isCompact ? `grid content-start gap-4 ${COMPACT_DIALOG_BODY}` : 'grid gap-4 py-4'}>{children}</div>
          <DialogFooter className={isCompact ? cn(COMPACT_STICKY_FOOTER, 'flex-col-reverse sm:flex-col-reverse') : undefined}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-dental-primary hover:bg-dental-dark">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// One field: label on the left (desktop, like Stock Tracker) or above (phone)
export function FieldRow({
  label,
  htmlFor,
  required = false,
  alignTop = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  alignTop?: boolean;
  children: ReactNode;
}) {
  const isCompact = useIsCompact();
  const text = (
    <>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </>
  );
  if (isCompact) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={htmlFor}>{text}</Label>
        {children}
      </div>
    );
  }
  return (
    <div className={cn('grid grid-cols-4 gap-2', alignTop ? 'items-start' : 'items-center')}>
      <Label htmlFor={htmlFor} className={cn('text-right text-xs', alignTop && 'pt-2.5')}>
        {text}
      </Label>
      <div className="col-span-3">{children}</div>
    </div>
  );
}

// Dealer choice with "N left" for each dealer
export function DealerPicker({
  dealers,
  value,
  onChange,
  countOf,
  emptyText,
}: {
  dealers: DealerStock[];
  value: string;
  onChange: (dealerId: string) => void;
  countOf: (dealer: DealerStock) => number;
  emptyText: string;
}) {
  if (dealers.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{emptyText}</p>;
  }
  return (
    <div role="radiogroup" className="grid gap-2">
      {dealers.map((d) => {
        const selected = d.dealerId === value;
        return (
          <button
            key={d.dealerId}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(d.dealerId)}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
              selected ? 'border-dental-primary bg-blue-50 font-medium' : 'border-input hover:bg-accent'
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-dental-primary' : 'border-muted-foreground/50'
                )}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-dental-primary" />}
              </span>
              {d.dealerName}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{countOf(d)} left</span>
          </button>
        );
      })}
    </div>
  );
}

// Validation / error popup with OK (Stock Tracker style)
export function MessageDialog({ state, onClose }: { state: MessageState; onClose: () => void }) {
  return (
    <AlertDialog open={state.isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          <AlertDialogDescription>{state.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// "Are you sure" step before saving
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{children}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-dental-primary hover:bg-dental-dark">
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const STATUS_CLASS: Record<ImplantStatus, string> = {
  'Out of Stock': 'bg-red-100 text-red-700 border-red-300 font-medium',
  Expired: 'bg-red-100 text-red-700 border-red-300 font-medium',
  'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200',
  'Expiring Soon': 'bg-orange-50 text-orange-700 border-orange-200',
  Normal: 'bg-green-50 text-green-700 border-green-200',
};

export function StatusBadge({ status }: { status: ImplantStatus }) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', STATUS_CLASS[status])}>
      {status}
    </Badge>
  );
}

const TYPE_CLASS: Record<ImplantTransactionType, string> = {
  Incoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Consumption: 'bg-violet-50 text-violet-700 border-violet-200',
  Return: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function TypeBadge({ type }: { type: ImplantTransactionType }) {
  return (
    <Badge variant="outline" className={TYPE_CLASS[type]}>
      {type}
    </Badge>
  );
}

// Same colours as Stock Tracker's batch list
const BATCH_CLASS: Record<BatchStatus, string> = {
  'Out of Stock': 'bg-red-100 hover:bg-red-100 text-red-800',
  Expired: 'bg-red-100 hover:bg-red-100 text-red-800',
  'Expiring Soon': 'bg-amber-100 hover:bg-amber-100 text-amber-800',
  Good: 'bg-green-100 hover:bg-green-100 text-green-800',
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return <Badge className={cn('whitespace-nowrap', BATCH_CLASS[status])}>{status}</Badge>;
}
