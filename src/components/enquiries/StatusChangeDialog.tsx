import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ClinicType } from '@/contexts/ClinicContext';
import { Enquiry, STATUS_LABEL } from '@/components/enquiries/enquiry';

export interface PendingStatusChange {
  enquiry: Enquiry;
  next: Enquiry['status'];
}

interface StatusChangeDialogProps {
  pending: PendingStatusChange | null;
  activeClinic?: ClinicType;
  onConfirm: (enquiry: Enquiry, next: Enquiry['status']) => void;
  onCancel: () => void;
}

// Asks before an enquiry's status is changed, worded like the Lab Work status confirmation.
const StatusChangeDialog = ({ pending, activeClinic = 'dental', onConfirm, onCancel }: StatusChangeDialogProps) => (
  <Dialog open={pending !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogDescription>
          Are you sure you want to update the status for this enquiry?
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        {pending && (
          <p className="text-sm text-muted-foreground">
            You are about to change the status from
            <span className="font-semibold">
              {' '}{STATUS_LABEL[pending.enquiry.status]}
            </span>
            {' '}to{' '}
            <span className="font-semibold">
              {STATUS_LABEL[pending.next]}
            </span>.
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => pending && onConfirm(pending.enquiry, pending.next)}
          className={activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
        >
          Update Status
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default StatusChangeDialog;
