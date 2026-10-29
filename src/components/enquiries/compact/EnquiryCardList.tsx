import { Eye, Trash2, UserPlus } from 'lucide-react';
import { formatDateForDisplay } from '@/utils/dateFormatter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TapNote from '@/components/compact/TapNote';
import { Enquiry, STATUS_OPTIONS, STATUS_STYLES, STATUS_LABEL } from '@/components/enquiries/enquiry';

export interface EnquiryCardListProps {
  enquiries: Enquiry[];
  canChangeStatus: boolean;
  canConvert: boolean;
  canDelete: boolean;
  updatingId: number | null;
  onStatusChange: (enquiry: Enquiry, next: Enquiry['status']) => void;
  onView: (enquiry: Enquiry) => void;
  onConvert: (enquiry: Enquiry) => void;
  onDelete: (enquiry: Enquiry) => void;
}

// Enquiries on phones/tablets: one card per row of the desktop table, with the same fields
// (desktop column names as labels), the same status control and the same buttons.
const EnquiryCardList = ({
  enquiries,
  canChangeStatus,
  canConvert,
  canDelete,
  updatingId,
  onStatusChange,
  onView,
  onConvert,
  onDelete,
}: EnquiryCardListProps) => (
  <div className="space-y-3">
    {enquiries.map((e) => (
      <div key={e.id} className="rounded-md border bg-background p-3 text-sm">
        <div className="font-medium [overflow-wrap:anywhere]">{e.name}</div>

        <div className="mt-2 grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-x-2 gap-y-1">
          <span className="text-muted-foreground">Date</span>
          <span>{formatDateForDisplay(e.submitted_at)}</span>
          <span className="text-muted-foreground">Phone</span>
          <span>
            {e.phone && (
              <a href={`tel:${e.phone.replace(/\s/g, '')}`} className="text-blue-600 underline">
                {e.phone}
              </a>
            )}
          </span>
          <span className="text-muted-foreground">Email</span>
          <span className="[overflow-wrap:anywhere]">{e.email || '-'}</span>
          <span className="text-muted-foreground">Service</span>
          <span className="[overflow-wrap:anywhere]">{e.service_inquiry}</span>
          <span className="text-muted-foreground">Message</span>
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <TapNote text={e.message || ''} maxChars={40} fallback="-" />
          </div>
          <span className="text-muted-foreground">Status</span>
          <div>
            {canChangeStatus ? (
              <Select
                value={e.status}
                onValueChange={(v) => onStatusChange(e, v as Enquiry['status'])}
                disabled={updatingId === e.id}
              >
                <SelectTrigger className="h-8 w-[140px]">
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
              <Badge className={STATUS_STYLES[e.status]}>{STATUS_LABEL[e.status]}</Badge>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(e)} title="View enquiry details">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {canConvert && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onConvert(e)}
              title="Create a patient from this enquiry"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Convert
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Delete enquiry"
              className="w-9 px-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(e)}
              title="Delete enquiry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    ))}
  </div>
);

export default EnquiryCardList;
