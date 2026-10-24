import { useEffect, useRef } from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { timeToMinutes } from './sortByTime';
import type { AppointmentType, DoctorOption, SlotAppointmentComponent } from './types';

interface CompactDailyViewProps {
  isDental: boolean;
  date: Date;
  doctors: DoctorOption[];
  hourlyTimeSlots: Record<string, string[]>;
  getAppointmentsForTimeSlot: (slot: string) => AppointmentType[];
  getBookedTimeSlots: () => Record<string, number>;
  getSlotsOccupied: (service: string) => number;
  onSlotTap: (slot: string) => void;
  onEditAppointment: (appointment: AppointmentType) => void;
  SlotAppointment: SlotAppointmentComponent;
}

// Daily view for phones/tablets: every 15-minute slot as a thin row under its hour.
// Booking rules (full slots, past times, double booking) come from onSlotTap, which is the
// desktop slot click logic; blocks are the desktop TimeSlotAppointment component.
const CompactDailyView = ({
  isDental,
  date,
  doctors,
  hourlyTimeSlots,
  getAppointmentsForTimeSlot,
  getBookedTimeSlots,
  getSlotsOccupied,
  onSlotTap,
  onEditAppointment,
  SlotAppointment,
}: CompactDailyViewProps) => {
  const nowRef = useRef<HTMLDivElement>(null);
  const slotCounts = getBookedTimeSlots();
  const maxAllowed = isDental ? 2 : 1;

  // When looking at today, start scrolled to the current time
  const allSlots = Object.values(hourlyTimeSlots).flat();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nowSlot = isToday(date) ? [...allSlots].reverse().find(s => timeToMinutes(s) <= nowMinutes) : undefined;

  useEffect(() => {
    if (nowRef.current) nowRef.current.scrollIntoView({ block: 'center' });
  }, [date]);

  return (
    <div className="w-full">
      <div className="border-b px-2 py-3 font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</div>
      {Object.entries(hourlyTimeSlots).map(([hour, slots]) => (
        <div key={hour}>
          <div className="px-2 pb-1 pt-3 text-sm font-bold text-gray-800">{hour}</div>
          {slots.map(slot => {
            const appointments = getAppointmentsForTimeSlot(slot);
            const isFullyBooked = (slotCounts[slot] || 0) >= maxAllowed;
            const showFull = appointments.length === 0 && isFullyBooked;

            return (
              <div
                key={slot}
                ref={slot === nowSlot ? nowRef : undefined}
                className={cn(
                  'flex min-h-[44px] cursor-pointer border-b border-dashed border-gray-200 bg-white',
                  showFull && 'bg-orange-50'
                )}
                onClick={() => onSlotTap(slot)}
              >
                <div className="w-14 flex-shrink-0 border-r px-1.5 py-3 text-xs text-gray-400">
                  {slot.replace(/ (AM|PM)$/, '')}
                </div>
                <div className="flex min-w-0 flex-1 gap-1 p-1">
                  {appointments.length === 0 ? (
                    <div className={cn('flex items-center pl-1 text-xs', showFull ? 'font-medium text-orange-500' : 'text-gray-400')}>
                      {slot}
                      {showFull && (
                        <span className="ml-1 rounded bg-orange-100 px-1 text-[8px] text-orange-700">Full</span>
                      )}
                    </div>
                  ) : (
                    appointments.map(appointment => {
                      const slotsOccupied = getSlotsOccupied(appointment.service);
                      return (
                        <div key={appointment.id} className="min-w-0 flex-1">
                          <SlotAppointment
                            appointment={appointment}
                            isDental={isDental}
                            isCompact={appointments.length > 1}
                            isMultiSlot={slotsOccupied > 1}
                            isFirstSlot={appointment.time === slot}
                            slotsOccupied={slotsOccupied}
                            doctorsList={doctors}
                            onClick={() => onEditAppointment(appointment)}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default CompactDailyView;
