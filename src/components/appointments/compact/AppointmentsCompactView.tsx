import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import UnresolvedAppointmentsAlert from '@/components/UnresolvedAppointmentsAlert';
import AppointmentList from '@/components/AppointmentList';
import PendingTreatmentsView from '@/components/PendingTreatmentsView';
import { DentalChartingProvider } from '@/contexts/DentalChartingContext';
import CompactDailyView from './CompactDailyView';
import CompactWeeklyView from './CompactWeeklyView';
import CompactMonthlyView from './CompactMonthlyView';
import type { AppointmentType, CalendarItemComponent, DoctorOption, SlotAppointmentComponent } from './types';

export interface AppointmentsCompactViewProps {
  isDental: boolean;
  view: string;
  onViewChange: (view: string) => void;
  date: Date;
  setDate: (date: Date) => void;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  doctors: DoctorOption[];
  selectedDoctor: string | undefined;
  setSelectedDoctor: (doctor: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hourlyTimeSlots: Record<string, string[]>;
  getAppointmentsForTimeSlot: (slot: string) => AppointmentType[];
  getBookedTimeSlots: () => Record<string, number>;
  getSlotsOccupied: (service: string) => number;
  onSlotTap: (slot: string) => void;
  onEditAppointment: (appointment: AppointmentType) => void;
  weekDates: Date[];
  monthDates: Date[];
  getAppointmentsForDate: (date: Date) => AppointmentType[];
  getServiceDuration: (service: string) => number;
  SlotAppointment: SlotAppointmentComponent;
  CalendarItem: CalendarItemComponent;
}

// Appointments page layout for phones/tablets (< 1024px). Same controls, words and
// rules as the desktop page; all state and handlers come from pages/Appointments.tsx.
const AppointmentsCompactView = (props: AppointmentsCompactViewProps) => {
  const {
    isDental, view, onViewChange, date, setDate, popoverOpen, setPopoverOpen, onPrev, onNext,
    doctors, selectedDoctor, setSelectedDoctor, searchTerm, setSearchTerm,
  } = props;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Manage and schedule {isDental ? 'Dental Metrix' : 'Meditouch'} appointments
        </p>
      </div>

      <UnresolvedAppointmentsAlert />

      <Card className="w-full">
        <CardContent className="p-3">
          <Tabs value={view} onValueChange={onViewChange} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="w-max">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                {isDental && <TabsTrigger value="pending">Pending Treatments</TabsTrigger>}
              </TabsList>
            </div>
          </Tabs>

          {isDental && (
            <div className="mt-3 px-1 text-sm">
              <AppointmentList />
            </div>
          )}

          {view !== 'pending' && (
            <div className="mt-3 space-y-2 border-b pb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={onPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 min-w-max flex-1 justify-start px-2 text-left font-normal">
                      <CalendarIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{format(date, 'PPP')}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selected) => {
                        setDate(selected || new Date());
                        setPopoverOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={onNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="ml-auto h-9 flex-shrink-0 px-2.5" onClick={() => setDate(new Date())}>
                  Today
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Combobox
                  options={[{ value: 'all', label: 'All Doctors' }, ...doctors.map(doctor => ({ value: doctor.name, label: doctor.name }))]}
                  value={selectedDoctor || 'all'}
                  onChange={(value) => setSelectedDoctor(value)}
                  placeholder="All Doctors"
                />
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Patient"
                    className="pl-8"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-2">
            {view === 'daily' && (
              <CompactDailyView
                isDental={isDental}
                date={date}
                doctors={doctors}
                hourlyTimeSlots={props.hourlyTimeSlots}
                getAppointmentsForTimeSlot={props.getAppointmentsForTimeSlot}
                getBookedTimeSlots={props.getBookedTimeSlots}
                getSlotsOccupied={props.getSlotsOccupied}
                onSlotTap={props.onSlotTap}
                onEditAppointment={props.onEditAppointment}
                SlotAppointment={props.SlotAppointment}
              />
            )}
            {view === 'weekly' && (
              <CompactWeeklyView
                isDental={isDental}
                date={date}
                weekDates={props.weekDates}
                doctors={doctors}
                getAppointmentsForDate={props.getAppointmentsForDate}
                getServiceDuration={props.getServiceDuration}
                onOpenDay={(day) => { setDate(day); onViewChange('daily'); }}
                onEditAppointment={props.onEditAppointment}
                CalendarItem={props.CalendarItem}
              />
            )}
            {view === 'monthly' && (
              <CompactMonthlyView
                isDental={isDental}
                date={date}
                monthDates={props.monthDates}
                doctors={doctors}
                getAppointmentsForDate={props.getAppointmentsForDate}
                getServiceDuration={props.getServiceDuration}
                onOpenDay={(day) => { setDate(day); onViewChange('daily'); }}
                onEditAppointment={props.onEditAppointment}
                CalendarItem={props.CalendarItem}
              />
            )}
            {view === 'pending' && isDental && (
              <DentalChartingProvider>
                <PendingTreatmentsView />
              </DentalChartingProvider>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsCompactView;
