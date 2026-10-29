import { ReactNode } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateForDisplay } from '@/utils/dateFormatter';
import { cn } from '@/lib/utils';
import { Enquiry, STATUS_OPTIONS, STATUS_STYLES, STATUS_LABEL } from '@/components/enquiries/enquiry';

export interface EnquiryDetailsDialogProps {
  enquiry: Enquiry | null;
  isCompact: boolean;
  canChangeStatus: boolean;
  canConvert: boolean;
  updatingId: number | null;
  onStatusChange: (enquiry: Enquiry, next: Enquiry['status']) => void;
  onConvert: (enquiry: Enquiry) => void;
  onClose: () => void;
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <div className="text-sm font-medium text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm">{children}</div>
  </div>
);

// View: every detail of one enquiry, with the full message (like the website admin's
// "Submission Details"). Status changes still go through the Confirm Status Change popup.
const EnquiryDetailsDialog = ({
  enquiry,
  isCompact,
  canChangeStatus,
  canConvert,
  updatingId,
  onStatusChange,
  onConvert,
  onClose,
}: EnquiryDetailsDialogProps) => {
  const statusControl = enquiry && (canChangeStatus ? (
    <Select
      value={enquiry.status}
      onValueChange={(v) => onStatusChange(enquiry, v as Enquiry['status'])}
      disabled={updatingId === enquiry.id}
    >
      <SelectTrigger className="h-8 w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Badge className={STATUS_STYLES[enquiry.status]}>{STATUS_LABEL[enquiry.status]}</Badge>
  ));

  const message = enquiry && (
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere] rounded-md bg-muted/50 p-3">
      {enquiry.message || '-'}
    </p>
  );

  const closeButton = (className?: string) => (
    <Button variant="outline" onClick={onClose} className={className}>
      Close
    </Button>
  );

  const convertButton = (className?: string) =>
    enquiry && canConvert && (
      <Button
        className={cn('bg-dental-primary hover:bg-dental-dark', className)}
        onClick={() => onConvert(enquiry)}
        title="Create a patient from this enquiry"
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Convert
      </Button>
    );

  const header = (
    <DialogHeader>
      <DialogTitle>Enquiry Details</DialogTitle>
      <DialogDescription>Website contact-form submission</DialogDescription>
    </DialogHeader>
  );

  return (
    <Dialog open={enquiry !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      {isCompact ? (
        // Phones: a small centred popup like the app's other small popups. Label and value share a
        // line (as on the phone cards); only the details scroll, the buttons stay in view.
        <DialogContent className="max-h-[85vh] flex flex-col gap-3 p-5">
          {header}
          {enquiry && (
            <>
              {/* p-1/-m-1: room for the focus outline so the scroll box doesn't cut it */}
              <div className="min-h-0 flex-1 overflow-y-auto -m-1 p-1 text-sm">
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-x-2 gap-y-2">
                  <span className="text-muted-foreground">Status</span>
                  <div>{statusControl}</div>
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium [overflow-wrap:anywhere]">{enquiry.name}</span>
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDateForDisplay(enquiry.submitted_at)}</span>
                  <span className="text-muted-foreground">Phone</span>
                  <span>
                    {enquiry.phone ? (
                      <a href={`tel:${enquiry.phone.replace(/\s/g, '')}`} className="text-blue-600 underline">
                        {enquiry.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </span>
                  <span className="text-muted-foreground">Email</span>
                  <span className="[overflow-wrap:anywhere]">{enquiry.email || '-'}</span>
                  <span className="text-muted-foreground">Service</span>
                  <span className="[overflow-wrap:anywhere]">{enquiry.service_inquiry}</span>
                </div>
                <div className="mt-3">
                  <div className="text-muted-foreground">Message</div>
                  <div className="mt-1">{message}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {closeButton('flex-1')}
                {convertButton('flex-1')}
              </div>
            </>
          )}
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          {header}
          {enquiry && (
            <>
              <div className="space-y-4 py-2">
                <Field label="Status">{statusControl}</Field>

                <div className="grid gap-4 grid-cols-2">
                  <Field label="Name">
                    <span className="font-medium [overflow-wrap:anywhere]">{enquiry.name}</span>
                  </Field>
                  <Field label="Date">{formatDateForDisplay(enquiry.submitted_at)}</Field>
                  <Field label="Phone">{enquiry.phone || '-'}</Field>
                  <Field label="Email">
                    <span className="[overflow-wrap:anywhere]">{enquiry.email || '-'}</span>
                  </Field>
                </div>

                <Field label="Service">
                  <span className="[overflow-wrap:anywhere]">{enquiry.service_inquiry}</span>
                </Field>

                <Field label="Message">{message}</Field>
              </div>

              <DialogFooter>
                {closeButton()}
                {convertButton()}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
};

export default EnquiryDetailsDialog;
