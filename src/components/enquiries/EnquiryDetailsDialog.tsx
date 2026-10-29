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
import { COMPACT_FULLSCREEN_DIALOG, COMPACT_DIALOG_BODY, COMPACT_STICKY_FOOTER } from '@/lib/compact';
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
}: EnquiryDetailsDialogProps) => (
  <Dialog open={enquiry !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className={isCompact ? COMPACT_FULLSCREEN_DIALOG : 'sm:max-w-[560px] max-h-[85vh] overflow-y-auto'}>
      <DialogHeader className={isCompact ? 'px-4 pt-4 text-left' : undefined}>
        <DialogTitle>Enquiry Details</DialogTitle>
        <DialogDescription>Website contact-form submission</DialogDescription>
      </DialogHeader>

      {enquiry && (
        <>
          <div className={cn('space-y-4', isCompact ? COMPACT_DIALOG_BODY : 'py-2')}>
            <Field label="Status">
              {canChangeStatus ? (
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
              )}
            </Field>

            <div className={cn('grid gap-4', isCompact ? 'grid-cols-1' : 'grid-cols-2')}>
              <Field label="Name">
                <span className="font-medium [overflow-wrap:anywhere]">{enquiry.name}</span>
              </Field>
              <Field label="Date">{formatDateForDisplay(enquiry.submitted_at)}</Field>
              <Field label="Phone">
                {isCompact && enquiry.phone ? (
                  <a href={`tel:${enquiry.phone.replace(/\s/g, '')}`} className="text-blue-600 underline">
                    {enquiry.phone}
                  </a>
                ) : (
                  enquiry.phone || '-'
                )}
              </Field>
              <Field label="Email">
                <span className="[overflow-wrap:anywhere]">{enquiry.email || '-'}</span>
              </Field>
            </div>

            <Field label="Service">
              <span className="[overflow-wrap:anywhere]">{enquiry.service_inquiry}</span>
            </Field>

            <Field label="Message">
              <p className="whitespace-pre-wrap [overflow-wrap:anywhere] rounded-md bg-muted/50 p-3">
                {enquiry.message || '-'}
              </p>
            </Field>
          </div>

          <DialogFooter className={isCompact ? cn(COMPACT_STICKY_FOOTER, 'flex-col-reverse sm:flex-col-reverse') : undefined}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {canConvert && (
              <Button
                className="bg-dental-primary hover:bg-dental-dark"
                onClick={() => onConvert(enquiry)}
                title="Create a patient from this enquiry"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Convert
              </Button>
            )}
          </DialogFooter>
        </>
      )}
    </DialogContent>
  </Dialog>
);

export default EnquiryDetailsDialog;
