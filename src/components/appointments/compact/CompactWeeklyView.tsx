import { format, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { countBadgeClass } from './countBadge';
import { sortByTime } from './sortByTime';
import type { AppointmentType, CalendarItemComponent, DoctorOption } from './types';

interface CompactWeeklyViewProps {
  isDental: boolean;
  date: Date;
  weekDates: Date[];
  doctors: DoctorOption[];
  getAppointmentsForDate: (date: Date) => AppointmentType[];
  getServiceDuration: (service: string) => number;
  onOpenDay: (day: Date) => void;
  onEditAppointment: (appointment: AppointmentType) => void;
  CalendarItem: CalendarItemComponent;
}

// Weekly view for phones/tablets: the 7 days stacked, each with its count badge and
// appointments (desktop shows them as 7 columns).
const CompactWeeklyView = ({
  isDental,
  date,
  weekDates,
  doctors,
  getAppointmentsForDate,
  getServiceDuration,
  onOpenDay,
  onEditAppointment,
  CalendarItem,
}: CompactWeeklyViewProps) => {
  return (
    <div className="space-y-2">
      {weekDates.map(day => {
        const dayAppointments = sortByTime(getAppointmentsForDate(day));
        const isCurrentDay = isToday(day);

        return (
          <div
            key={day.toISOString()}
            className={cn('rounded-lg border bg-white p-2', isCurrentDay && 'border-primary bg-primary/5', !isSameMonth(day, date) && 'opacity-50')}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                title="Click to view this day in daily view"
                className={cn(
                  'rounded-md px-2 py-0.5 text-sm font-medium',
                  isCurrentDay ? (isDental ? 'bg-dental-primary text-white' : 'bg-meditouch-primary text-white') : 'bg-muted'
                )}
              >
                {format(day, 'EEE d')}
              </button>
              {dayAppointments.length > 0 && (
                <span className={cn('rounded-full px-2 text-xs', countBadgeClass(dayAppointments.length, isDental))}>
                  {dayAppointments.length}
                </span>
              )}
            </div>
            {dayAppointments.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {dayAppointments.map(appointment => (
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
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CompactWeeklyView;
