import { useEffect, useState } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { previewList } from '@/lib/compact';
import { countBadgeClass } from './countBadge';
import { sortByTime } from './sortByTime';
import type { AppointmentType, CalendarItemComponent, DoctorOption } from './types';

const weekDaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CompactMonthlyViewProps {
  isDental: boolean;
  date: Date;
  monthDates: Date[];
  doctors: DoctorOption[];
  getAppointmentsForDate: (date: Date) => AppointmentType[];
  getServiceDuration: (service: string) => number;
  onOpenDay: (day: Date) => void;
  onEditAppointment: (appointment: AppointmentType) => void;
  CalendarItem: CalendarItemComponent;
}

// Monthly view for phones/tablets: a month grid with count badges; tapping a day lists its
// appointments below (3 first, then "+N more" / "Collapse", like the desktop month cells).
const CompactMonthlyView = ({
  isDental,
  date,
  monthDates,
  doctors,
  getAppointmentsForDate,
  getServiceDuration,
  onOpenDay,
  onEditAppointment,
  CalendarItem,
}: CompactMonthlyViewProps) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Changing month clears the selection
  useEffect(() => {
    setSelectedDay(null);
    setExpanded(false);
  }, [date.getFullYear(), date.getMonth()]);

  const leadingBlanks = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const selectedAppointments = selectedDay ? sortByTime(getAppointmentsForDate(selectedDay)) : [];
  const { visible, hiddenCount } = previewList(selectedAppointments, expanded);
  const primaryBg = isDental ? 'bg-dental-primary text-white' : 'bg-meditouch-primary text-white';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDaysShort.map(day => (
          <div key={day} className="text-xs font-medium text-muted-foreground">{day}</div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="rounded-lg border border-dashed bg-gray-50/50" />
        ))}
        {monthDates.map(day => {
          const count = getAppointmentsForDate(day).length;
          const isSelected = !!selectedDay && isSameDay(day, selectedDay);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => { setSelectedDay(day); setExpanded(false); }}
              className={cn(
                'flex h-12 flex-col items-center justify-start gap-0.5 rounded-lg border bg-white p-1 text-xs',
                isToday(day) && 'border-primary bg-primary/5',
                isSelected && (isDental ? 'border-2 border-dental-primary' : 'border-2 border-meditouch-primary')
              )}
            >
              <span className={cn('rounded px-1 font-medium', isToday(day) && primaryBg)}>{format(day, 'd')}</span>
              {count > 0 && <span className={cn('rounded-full px-1.5 text-[10px]', countBadgeClass(count, isDental))}>{count}</span>}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="rounded-lg border bg-white p-2">
          <div className="mb-1 flex items-center gap-2">
            <span className={cn('rounded-md px-2 py-0.5 text-sm font-medium', primaryBg)}>{format(selectedDay, 'EEE d')}</span>
            {selectedAppointments.length > 0 && (
              <span className={cn('rounded-full px-2 text-xs', countBadgeClass(selectedAppointments.length, isDental))}>
                {selectedAppointments.length}
              </span>
            )}
            <Button variant="link" size="sm" className="ml-auto h-auto p-0" onClick={() => onOpenDay(selectedDay)}>
              Open in Daily ›
            </Button>
          </div>
          <div className="space-y-1">
            {visible.map(appointment => (
              <CalendarItem
                key={appointment.id}
                appointment={appointment}
                isDental={isDental}
                isCompact={false}
                onClick={() => onEditAppointment(appointment)}
                doctorsList={doctors}
                getServiceDuration={getServiceDuration}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <div className="mt-1 flex justify-center">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(true)}>
                +{hiddenCount} more
              </Button>
            </div>
          )}
          {expanded && (
            <div className="mt-1 flex justify-center">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(false)}>
                Collapse
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactMonthlyView;
