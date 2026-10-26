import { format, isBefore, parseISO } from 'date-fns';
import { AlarmClock, Clock, Info, Trash2 } from 'lucide-react';
import type { FollowUp } from '@/contexts/FollowUpContext';
import type { ClinicType } from '@/contexts/ClinicContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TapNote from '@/components/compact/TapNote';

export interface RecallCardListProps {
  followUps: FollowUp[];
  activeTab: 'pending' | 'snoozed' | 'waiting';
  activeClinic: ClinicType;
  canDelete: boolean;
  onViewDetails: (followUp: FollowUp) => void;
  onSchedule: (followUp: FollowUp) => void;
  onSnooze: (followUp: FollowUp) => void;
  onActivateEarly: (followUp: FollowUp) => void;
  onActivate: (followUp: FollowUp) => void;
  onDelete: (followUp: FollowUp) => void;
}

// Recall List on phones/tablets: one card per row of the desktop table, with the same
// fields (desktop column names as labels) and the same buttons per tab.
const RecallCardList = ({
  followUps,
  activeTab,
  activeClinic,
  canDelete,
  onViewDetails,
  onSchedule,
  onSnooze,
  onActivateEarly,
  onActivate,
  onDelete,
}: RecallCardListProps) => (
  <div className="space-y-3">
    {followUps.map((followUp) => {
      const followUpDate = parseISO(followUp.tentative_date);
      // Same rule as the desktop table: only the pending tab shows past dates as overdue
      const isOverdue = activeTab === 'pending' && isBefore(followUpDate, new Date());

      return (
        <div
          key={`${followUp.id}-${followUp.patient_id}-${followUp.tentative_date}`}
          className="rounded-md border bg-background p-3 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 font-medium [overflow-wrap:anywhere]">{followUp.patient_name}</span>
            {followUp.sequence_group_id && followUp.total_steps_in_sequence > 1 && (
              <Badge
                variant={followUp.status === 'Waiting' ? 'secondary' : 'outline'}
                className={
                  followUp.status === 'Waiting'
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }
              >
                Step {followUp.follow_up_sequence}/{followUp.total_steps_in_sequence}
                {followUp.status === 'Waiting' && ' (Waiting)'}
              </Badge>
            )}
          </div>

          <div className="mt-2 grid grid-cols-[8rem_minmax(0,1fr)] gap-x-2 gap-y-1">
            <span className="text-muted-foreground">Tentative Date</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  {format(followUpDate, 'MMM d, yyyy')}
                </span>
                {isOverdue && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Overdue
                  </Badge>
                )}
              </div>
              {activeTab === 'snoozed' && followUp.snoozed_until && (
                <div className="text-xs text-muted-foreground">
                  Snoozed until {format(parseISO(followUp.snoozed_until), 'MMM d, yyyy')}
                </div>
              )}
            </div>
            <span className="text-muted-foreground">Suggested Service</span>
            <span className="[overflow-wrap:anywhere]">{followUp.suggested_service_name}</span>
            <span className="text-muted-foreground">Original Service</span>
            <span className="[overflow-wrap:anywhere]">{followUp.original_service}</span>
            <span className="text-muted-foreground">Original Doctor</span>
            <span className="[overflow-wrap:anywhere]">{followUp.original_doctor}</span>
            <span className="text-muted-foreground">Notes</span>
            <div className="min-w-0 [overflow-wrap:anywhere]">
              {followUp.special_notes ? (
                <TapNote text={followUp.special_notes} maxChars={40} />
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <Button variant="outline" size="sm" aria-label="Details" className="w-8 px-0" onClick={() => onViewDetails(followUp)}>
              <Info className="h-4 w-4" />
            </Button>
            {activeTab === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex-1 px-1.5 ${
                    activeClinic === 'dental'
                      ? 'text-dental-primary hover:bg-dental-50 hover:text-dental-dark'
                      : 'text-meditouch-primary hover:bg-meditouch-50 hover:text-meditouch-dark'
                  }`}
                  onClick={() => onSchedule(followUp)}
                >
                  <Clock className="mr-1 h-4 w-4" />
                  Schedule
                </Button>
                <Button variant="outline" size="sm" className="flex-1 px-1.5" onClick={() => onSnooze(followUp)}>
                  <AlarmClock className="mr-1 h-4 w-4" />
                  Snooze
                </Button>
              </>
            ) : activeTab === 'waiting' ? (
              <Button variant="outline" size="sm" className="flex-1 px-1.5" onClick={() => onActivateEarly(followUp)}>
                <Clock className="mr-1 h-4 w-4" />
                Activate Early
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="flex-1 px-1.5" onClick={() => onActivate(followUp)}>
                <Clock className="mr-1 h-4 w-4" />
                Activate
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                aria-label="Delete"
                className="w-8 px-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onDelete(followUp)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default RecallCardList;
