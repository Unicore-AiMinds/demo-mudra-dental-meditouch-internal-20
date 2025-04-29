
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useNavigate } from 'react-router-dom';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  UserPlus,
  Edit,
  X,
  Clock,
  CalendarRange,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const registeredPatients = [{
  id: 'p1',
  name: 'Aarav Sharma'
}, {
  id: 'p2',
  name: 'Priya Patel'
}, {
  id: 'p3',
  name: 'Arjun Singh'
}, {
  id: 'p4',
  name: 'Neha Singh'
}, {
  id: 'p5',
  name: 'Rohan Gupta'
}, {
  id: 'p6',
  name: 'Ishaan Desai'
}, {
  id: 'p7',
  name: 'Sanjay Patel'
}, {
  id: 'p8',
  name: 'Meera Joshi'
}, {
  id: 'p9',
  name: 'Ravi Kumar'
}, {
  id: 'p10',
  name: 'Vikram Mehta'
}, {
  id: 'p11',
  name: 'Neha Kapoor'
}, {
  id: 'p12',
  name: 'Aisha Khan'
}];

const doctors = [{
  id: 'dr1',
  name: 'Dr. Khanna'
}, {
  id: 'dr2',
  name: 'Dr. Sharma'
}, {
  id: 'dr3',
  name: 'Dr. Desai'
}];

const timeSlots = ['9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM', '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM', '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM', '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM', '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM', '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM', '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM', '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM'];

// Group time slots by hour for the timeline display
// Move this inside the component to fix the "Invalid hook call" error
// const hourlyTimeSlots = useMemo(() => {
//   const grouped = {};
//   timeSlots.forEach(slot => {
//     const hour = slot.split(':')[0] + (slot.includes('PM') && slot.split(':')[0] !== '12' ? ' PM' : slot.includes('PM') ? ' PM' : ' AM');
//     if (!grouped[hour]) {
//       grouped[hour] = [];
//     }
//     grouped[hour].push(slot);
//   });
//   return grouped;
// }, []);

type DentalAppointment = {
  id: string;
  time: string;
  patient: string;
  service: string;
  doctor: string;
  date?: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  secondPatient?: string;
};

type MeditouchAppointment = {
  id: string;
  time: string;
  patient: string;
  service: string;
  date?: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
};

type AppointmentType = DentalAppointment | MeditouchAppointment;

const AppointmentCard = ({
  time,
  patient,
  service,
  doctor,
  status,
  secondPatient = null,
  isDental = true,
  onEdit,
  onReschedule,
  onCancel,
  onComplete
}: {
  time: string;
  patient: string;
  service: string;
  doctor?: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  secondPatient?: string | null;
  isDental?: boolean;
  onEdit: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onComplete?: () => void;
}) => {
  if (status === 'cancelled') {
    return null;
  }
  return (
    <div className="border rounded-md p-2 mb-1 card-shadow bg-white hover:bg-gray-50 cursor-pointer">
      <div className="flex justify-between items-center">
        <div className="font-medium text-sm">{time}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onReschedule}>Reschedule</DropdownMenuItem>
            {status !== 'completed' && onComplete && (
              <DropdownMenuItem onClick={onComplete} className="text-green-600">
                Mark as Completed
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onCancel} className="text-red-500">
              Cancel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-1">
        <div className="text-sm font-medium">{patient}</div>
        {secondPatient && <div className="text-sm font-medium">{secondPatient}</div>}
        <div className="text-xs text-muted-foreground">{service}</div>
        {doctor && <div className="text-xs font-medium mt-1 text-dental-primary">{doctor}</div>}
      </div>
    </div>
  );
};

const CalendarAppointmentItem = ({ appointment, isDental, onClick, isCompact = false }: {
  appointment: DentalAppointment | MeditouchAppointment,
  isDental: boolean,
  onClick: () => void,
  isCompact?: boolean
}) => {
  const bgColor = isDental ? 'bg-dental-light' : 'bg-meditouch-light';
  const borderColor = isDental ? 'border-dental-primary' : 'border-meditouch-primary';
  const textColor = isDental ? 'text-dental-primary' : 'text-meditouch-primary';

  // Create tooltip content for appointment details
  const tooltipContent = (
    <div className="text-xs">
      <div className="font-bold">{appointment.patient}</div>
      <div>{appointment.service}</div>
      {isDental && (appointment as DentalAppointment).doctor && (
        <div>Doctor: {(appointment as DentalAppointment).doctor}</div>
      )}
      <div>Time: {appointment.time}</div>
    </div>
  );

  const appointmentContent = (
    <div
      className={`px-1.5 py-0.5 text-xs rounded mb-0.5 border-l-2 ${bgColor} ${borderColor} ${textColor} cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation(); // Stop event from bubbling up to parent
        onClick();
      }}
    >
      {isCompact ? (
        // Compact view - only show patient name
        <div className="font-medium truncate">{appointment.patient}</div>
      ) : (
        // Full view - show time and patient
        <div className="font-medium truncate">{appointment.time} | {appointment.patient}</div>
      )}
    </div>
  );

  // If compact, wrap in tooltip, otherwise just return the content
  return isCompact ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {appointmentContent}
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : appointmentContent;
};

const TimeSlotAppointment = ({ appointment, isDental, onClick, isCompact = false }: {
  appointment: DentalAppointment | MeditouchAppointment,
  isDental: boolean,
  onClick: () => void,
  isCompact?: boolean
}) => {
  const bgColor = isDental ? 'bg-dental-primary' : 'bg-meditouch-primary';

  // Create tooltip content for compact view
  const tooltipContent = (
    <div className="text-xs">
      <div className="font-bold">{appointment.patient}</div>
      <div>{appointment.service}</div>
      {isDental && (appointment as DentalAppointment).doctor && (
        <div>Doctor: {(appointment as DentalAppointment).doctor}</div>
      )}
      <div>Time: {appointment.time}</div>
    </div>
  );

  const appointmentContent = (
    <div
      className={`${bgColor} text-white rounded p-1 text-xs cursor-pointer hover:opacity-90 transition-opacity mb-1`}
      onClick={(e) => {
        e.stopPropagation(); // Stop event from bubbling up to parent
        onClick();
      }}
    >
      <div className="font-medium">{appointment.patient}</div>
      {!isCompact && (
        <>
          <div className="text-white/90 text-[10px]">{appointment.service}</div>
          {isDental && (appointment as DentalAppointment).doctor && (
            <div className="text-white/90 text-[10px] font-medium">{(appointment as DentalAppointment).doctor}</div>
          )}
        </>
      )}
    </div>
  );

  // If compact, wrap in tooltip, otherwise just return the content
  return isCompact ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {appointmentContent}
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : appointmentContent;
};

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekDaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Appointments = () => {
  const { activeClinic, isDental } = useClinic();
  const navigate = useNavigate();
  const [view, setView] = useState('daily');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentType | null>(null);
  const isMobile = useIsMobile();

  const [appointmentPatient, setAppointmentPatient] = useState("");
  const [filteredPatients, setFilteredPatients] = useState(registeredPatients);
  const [appointmentService, setAppointmentService] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDoctor, setAppointmentDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);

  // State for expanded days in weekly and monthly views
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedMonthDay, setExpandedMonthDay] = useState<string | null>(null);

  // State for appointment creation confirmation dialog
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState<{
    patient: string;
    service: string;
    time: string;
    date: Date | undefined;
    doctor?: string;
  } | null>(null);

  // Group time slots by hour for the timeline display - moved inside component
  const hourlyTimeSlots = useMemo(() => {
    const grouped: Record<string, string[]> = {}; // Add proper type here
    timeSlots.forEach(slot => {
      const hour = slot.split(':')[0] + (slot.includes('PM') && slot.split(':')[0] !== '12' ? ' PM' : slot.includes('PM') ? ' PM' : ' AM');
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(slot);
    });
    return grouped;
  }, []);

  const [dentalAppointments, setDentalAppointments] = useState<DentalAppointment[]>([
    {
      id: 'd1',
      time: '9:00 AM',
      patient: 'Aarav Sharma',
      service: 'Dental Checkup',
      doctor: 'Dr. Khanna',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'confirmed'
    },
    {
      id: 'd2',
      time: '9:15 AM',
      patient: 'Priya Patel',
      service: 'Root Canal',
      doctor: 'Dr. Khanna',
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      status: 'confirmed'
    },
    {
      id: 'd3',
      time: '10:30 AM',
      patient: 'Arjun Singh',
      service: 'Teeth Cleaning',
      doctor: 'Dr. Khanna',
      date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      status: 'confirmed',
      secondPatient: 'Neha Singh'
    },
    {
      id: 'd4',
      time: '11:45 AM',
      patient: 'Rohan Gupta',
      service: 'Crown Fitting',
      doctor: 'Dr. Sharma',
      date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      status: 'arrived'
    },
    {
      id: 'd5',
      time: '2:00 PM',
      patient: 'Ishaan Desai',
      service: 'Dental Filling',
      doctor: 'Dr. Sharma',
      date: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
      status: 'cancelled'
    },
    {
      id: 'd6',
      time: '3:30 PM',
      patient: 'Sanjay Patel',
      service: 'Denture Adjustment',
      doctor: 'Dr. Desai',
      date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
      status: 'confirmed'
    }
  ]);

  const [meditouchAppointments, setMeditouchAppointments] = useState<MeditouchAppointment[]>([
    {
      id: 'm1',
      time: '9:15 AM',
      patient: 'Meera Joshi',
      service: 'Skin Consultation',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'confirmed'
    },
    {
      id: 'm2',
      time: '10:00 AM',
      patient: 'Ravi Kumar',
      service: 'Hair Treatment',
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      status: 'arrived'
    },
    {
      id: 'm3',
      time: '12:45 PM',
      patient: 'Vikram Mehta',
      service: 'Hair Treatment',
      date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      status: 'confirmed'
    },
    {
      id: 'm4',
      time: '2:30 PM',
      patient: 'Neha Kapoor',
      service: 'Facial',
      date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      status: 'cancelled'
    },
    {
      id: 'm5',
      time: '3:30 PM',
      patient: 'Aisha Khan',
      service: 'Facial',
      date: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
      status: 'confirmed'
    }
  ]);

  const appointments = isDental ? dentalAppointments : meditouchAppointments;

  // Memoize the getAppointmentsForDate function to avoid recalculating on every render
  const getAppointmentsForDate = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');

    // Get all appointments for this date
    const allAppointmentsForDate = appointments.filter(app => app.date === dateString && app.status !== 'cancelled');

    // Apply doctor filter if needed
    const filteredByDoctor = allAppointmentsForDate.filter(app => {
      // Check if the doctor matches (or if 'all' is selected)
      const matchesDoctor =
        selectedDoctor === 'all' || // Always match if 'all' is selected
        !selectedDoctor || // Always match if no doctor is selected
        (isDental && 'doctor' in app && (app as DentalAppointment).doctor === selectedDoctor); // Match specific doctor

      return matchesDoctor;
    });

    // Apply search filter if needed
    const filteredBySearch = filteredByDoctor.filter(app => {
      // Check if the search term matches
      const matchesSearch = !searchTerm ||
        app.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Log filtering results for debugging
    if (allAppointmentsForDate.length > 0) {
      console.log(`Date ${dateString}: ${allAppointmentsForDate.length} appointments → ${filteredByDoctor.length} after doctor filter → ${filteredBySearch.length} after search filter`);
    }

    return filteredBySearch;
  }, [appointments, selectedDoctor, searchTerm, isDental]);

  const filteredAppointments = useMemo(() => {
    console.log('Filtering appointments with selectedDoctor:', selectedDoctor);

    const filtered = appointments.filter(app => {
      const matchesDate = app.date === format(date, 'yyyy-MM-dd');
      const matchesSearch = !searchTerm || app.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (isDental && 'secondPatient' in app && app.secondPatient ? app.secondPatient.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        app.service.toLowerCase().includes(searchTerm.toLowerCase());

      // Handle doctor filtering properly
      const matchesDoctor =
        selectedDoctor === 'all' || // Always match if 'all' is selected
        !selectedDoctor || // Always match if no doctor is selected
        (isDental && 'doctor' in app && (app as DentalAppointment).doctor === selectedDoctor); // Match specific doctor

      const isNotCancelled = app.status !== 'cancelled';

      if (view === 'daily') {
        return matchesDate && matchesSearch && matchesDoctor && isNotCancelled;
      } else {
        return matchesSearch && matchesDoctor && isNotCancelled;
      }
    });

    console.log(`Filtered ${appointments.length} appointments down to ${filtered.length}`);
    return filtered;
  }, [appointments, date, searchTerm, selectedDoctor, isDental, view]);

  const getAppointmentsForTimeSlot = useCallback((timeSlot: string) => {
    return filteredAppointments.filter(app => app.time === timeSlot);
  }, [filteredAppointments]);

  const getBookedTimeSlots = () => {
    // Get all appointments for the current date that aren't cancelled
    const dateAppointments = appointments
      .filter(app => app.date === format(date, 'yyyy-MM-dd') && app.status !== 'cancelled');

    // Count appointments per time slot
    const slotCounts: Record<string, number> = {};
    dateAppointments.forEach(app => {
      if (!slotCounts[app.time]) {
        slotCounts[app.time] = 0;
      }
      slotCounts[app.time]++;
    });

    return slotCounts;
  };

  const getAvailableTimeSlots = () => {
    const slotCounts = getBookedTimeSlots();

    // Filter time slots based on clinic type and current booking count
    return timeSlots.filter(time => {
      const currentCount = slotCounts[time] || 0;

      // For Dental Metrix: allow up to 2 appointments per slot
      // For Meditouch: allow only 1 appointment per slot
      const maxAllowed = isDental ? 2 : 1;

      return currentCount < maxAllowed;
    });
  };

  const handleNewAppointmentForTimeSlot = (time: string) => {
    // Check if the slot is available based on clinic type
    const slotCounts = getBookedTimeSlots();
    const currentCount = slotCounts[time] || 0;
    const maxAllowed = isDental ? 2 : 1;

    if (currentCount >= maxAllowed) {
      // Slot is already fully booked
      toast({
        title: "Time Slot Unavailable",
        description: `This time slot is already fully booked. Please select another time.`,
        variant: "destructive"
      });
      return;
    }

    // Make sure we're not already editing and close any open new appointment dialog
    setIsNewAppointmentOpen(false);

    // Reset all form fields
    resetAppointmentForm();

    // Set only the time and date from the clicked slot
    setAppointmentTime(time);
    setAppointmentDate(date);

    // Debug log
    console.log('Setting appointment date from time slot:', format(date, 'yyyy-MM-dd'));

    // Reset filtered patients list
    setFilteredPatients(registeredPatients);

    // Open the dialog
    setTimeout(() => {
      setIsNewAppointmentOpen(true);
      console.log('Opening new appointment form with reset fields');
    }, 50);
  };

  const handleEditAppointment = (appointment: AppointmentType) => {
    console.log('Editing appointment:', appointment);

    // Close the new appointment form if it's open
    setIsNewAppointmentOpen(false);

    // Pre-fill form fields with appointment data
    setAppointmentPatient(appointment.patient);
    setAppointmentService(appointment.service);
    setAppointmentTime(appointment.time);

    // Parse and set the date
    if (appointment.date) {
      const parsedDate = new Date(appointment.date);
      setAppointmentDate(parsedDate);
    }

    // Set doctor for dental appointments
    if (isDental && 'doctor' in appointment) {
      setAppointmentDoctor((appointment as DentalAppointment).doctor);
    }

    // Reset filtered patients list for the search
    setFilteredPatients(registeredPatients);

    // Set the editing appointment object
    setEditingAppointment(appointment);

    // Open the dialog
    setIsEditAppointmentOpen(true);

    console.log('Edit form opened with values:', {
      patient: appointment.patient,
      service: appointment.service,
      time: appointment.time,
      date: appointment.date,
      doctor: isDental && 'doctor' in appointment ? appointment.doctor : 'N/A'
    });
  };

  const handleReschedule = (appointment: AppointmentType) => {
    setEditingAppointment(appointment);
    setAppointmentPatient(appointment.patient);
    setAppointmentService(appointment.service);
    setAppointmentTime(appointment.time);
    if (appointment.date) {
      const parsedDate = new Date(appointment.date);
      setAppointmentDate(parsedDate);
    }
    if (isDental && 'doctor' in appointment) {
      setAppointmentDoctor(appointment.doctor);
    }

    navigate('/appointments/new', {
      state: {
        reschedule: true,
        appointmentId: appointment.id,
        patient: appointment.patient,
        service: appointment.service,
        time: appointment.time,
        date: appointment.date,
        doctor: isDental ? appointment.doctor : undefined
      }
    });
  };

  const handleDirectReschedule = (appointment: AppointmentType) => {
    // Use the edit appointment function directly
    handleEditAppointment(appointment);
  };

  const handleDirectCancel = (appointment: AppointmentType) => {
    if (isDental) {
      setDentalAppointments(dentalAppointments.map(app =>
        app.id === appointment.id ? { ...app, status: 'cancelled' as const } : app
      ));
    } else {
      setMeditouchAppointments(meditouchAppointments.map(app =>
        app.id === appointment.id ? { ...app, status: 'cancelled' as const } : app
      ));
    }
    toast({
      title: "Appointment Cancelled",
      description: `${appointment.patient}'s appointment has been cancelled.`
    });
  };

  const openUpdateConfirmation = () => {
    if (editingAppointment) {
      setIsEditAppointmentOpen(false);
      setIsConfirmUpdateOpen(true);
    }
  };

  const handleRescheduleSubmit = () => {
    if (editingAppointment) {
      const updatedAppointments = isDental
        ? dentalAppointments.map(app =>
            app.id === editingAppointment.id
              ? {
                  ...app,
                  time: appointmentTime,
                  service: appointmentService,
                  doctor: appointmentDoctor,
                  date: appointmentDate ? format(appointmentDate, 'yyyy-MM-dd') : app.date
                }
              : app
          )
        : meditouchAppointments.map(app =>
            app.id === editingAppointment.id
              ? {
                  ...app,
                  time: appointmentTime,
                  service: appointmentService,
                  date: appointmentDate ? format(appointmentDate, 'yyyy-MM-dd') : app.date
                }
              : app
          );

      if (isDental) {
        setDentalAppointments(updatedAppointments as DentalAppointment[]);
      } else {
        setMeditouchAppointments(updatedAppointments as MeditouchAppointment[]);
      }

      toast({
        title: "Appointment Rescheduled",
        description: `${editingAppointment.patient}'s appointment has been rescheduled to ${format(appointmentDate || new Date(), 'PP')} at ${appointmentTime}`
      });

      setIsConfirmUpdateOpen(false);
      setEditingAppointment(null);
    }
  };

  const cancelUpdate = () => {
    setIsConfirmUpdateOpen(false);
    setIsEditAppointmentOpen(true); // Go back to edit dialog
  };

  const openCancelConfirmation = () => {
    if (editingAppointment) {
      setIsEditAppointmentOpen(false);
      setIsConfirmCancelOpen(true);
    }
  };

  const handleCancelAppointment = () => {
    if (editingAppointment) {
      const updatedAppointments = isDental
        ? dentalAppointments.map(app =>
            app.id === editingAppointment.id ? { ...app, status: 'cancelled' as const } : app
          )
        : meditouchAppointments.map(app =>
            app.id === editingAppointment.id ? { ...app, status: 'cancelled' as const } : app
          );

      if (isDental) {
        setDentalAppointments(updatedAppointments as DentalAppointment[]);
      } else {
        setMeditouchAppointments(updatedAppointments as MeditouchAppointment[]);
      }

      toast({
        title: "Appointment Cancelled",
        description: `${editingAppointment.patient}'s appointment has been cancelled`
      });

      setIsConfirmCancelOpen(false);
      setEditingAppointment(null);
    }
  };

  const cancelCancel = () => {
    setIsConfirmCancelOpen(false);
    setIsEditAppointmentOpen(true); // Go back to edit dialog
  };

  // Handle marking an appointment as completed
  const { markAppointmentCompleted } = useDentalHistory();

  const handleCompleteAppointment = (appointment: AppointmentType) => {
    // Update the appointment status to completed
    if (isDental) {
      setDentalAppointments(dentalAppointments.map(app =>
        app.id === appointment.id ? { ...app, status: 'completed' as const } : app
      ));
    } else {
      setMeditouchAppointments(meditouchAppointments.map(app =>
        app.id === appointment.id ? { ...app, status: 'completed' as const } : app
      ));
    }

    // Get patient ID from the patient name (in a real app, this would be stored with the appointment)
    // For demo purposes, we'll extract the ID from the demo patients array
    const patientId = `PT00${appointment.patient.charAt(0)}`;

    // Add to dental history and generate follow-up if needed
    markAppointmentCompleted(
      appointment.id,
      patientId,
      appointment.patient,
      appointment.service,
      isDental ? (appointment as DentalAppointment).doctor || 'Unknown Doctor' : 'Unknown Doctor',
      appointment.date || format(new Date(), 'yyyy-MM-dd')
    );

    toast({
      title: "Appointment Completed",
      description: `${appointment.patient}'s appointment has been marked as completed.`
    });
  };

  const handlePatientSearch = (value: string) => {
    // If value is empty or undefined, show all patients
    if (!value || value.trim() === '') {
      setFilteredPatients(registeredPatients);
      return;
    }

    // Convert to lowercase for case-insensitive search
    const searchTerm = value.toLowerCase().trim();

    // Filter patients whose name contains the search term
    const filtered = registeredPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm)
    );

    console.log(`Found ${filtered.length} patients matching "${searchTerm}"`);
    setFilteredPatients(filtered);
  };

  const handleCreateAppointment = () => {
    if (!appointmentPatient || !appointmentService || !appointmentTime || !appointmentDate) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if the slot is still available (in case it was booked while the form was open)
    const formattedDate = format(appointmentDate, 'yyyy-MM-dd');
    const dateAppointments = appointments.filter(app =>
      app.date === formattedDate &&
      app.time === appointmentTime &&
      app.status !== 'cancelled'
    );

    const slotCount = dateAppointments.length;
    const maxAllowed = isDental ? 2 : 1;

    if (slotCount >= maxAllowed) {
      toast({
        title: "Time Slot No Longer Available",
        description: `This time slot has been booked while you were filling the form. Please select another time.`,
        variant: "destructive"
      });
      return;
    }

    // Store the pending appointment data and open confirmation dialog
    setPendingAppointment({
      patient: appointmentPatient,
      service: appointmentService,
      time: appointmentTime,
      date: appointmentDate,
      doctor: isDental ? appointmentDoctor : undefined
    });

    // Close the new appointment form and open the confirmation dialog
    setIsNewAppointmentOpen(false);
    setIsConfirmCreateOpen(true);
  };

  // Function to actually create the appointment after confirmation
  const confirmCreateAppointment = () => {
    if (!pendingAppointment || !pendingAppointment.date) return;

    // Debug logs
    console.log('Creating confirmed appointment:', pendingAppointment);

    const formattedDate = format(pendingAppointment.date, 'yyyy-MM-dd');
    const newId = `${isDental ? 'd' : 'm'}${Math.floor(Math.random() * 10000)}`;

    if (isDental) {
      const newAppointment: DentalAppointment = {
        id: newId,
        time: pendingAppointment.time,
        patient: pendingAppointment.patient,
        service: pendingAppointment.service,
        doctor: pendingAppointment.doctor || 'Dr. Khanna',
        date: formattedDate,
        status: 'confirmed'
      };
      setDentalAppointments([...dentalAppointments, newAppointment]);
    } else {
      const newAppointment: MeditouchAppointment = {
        id: newId,
        time: pendingAppointment.time,
        patient: pendingAppointment.patient,
        service: pendingAppointment.service,
        date: formattedDate,
        status: 'confirmed'
      };
      setMeditouchAppointments([...meditouchAppointments, newAppointment]);
    }

    toast({
      title: "Appointment Created",
      description: `New appointment for ${pendingAppointment.patient} on ${format(pendingAppointment.date, 'PP')} at ${pendingAppointment.time}`
    });

    // Update the UI date to match the appointment date
    setDate(pendingAppointment.date);

    // Close the confirmation dialog and reset form
    setIsConfirmCreateOpen(false);
    setPendingAppointment(null);
    resetAppointmentForm();

    // Log that we've updated the UI date
    console.log('Updated UI date to match appointment date:', format(pendingAppointment.date, 'yyyy-MM-dd'));
  };

  // Function to cancel appointment creation
  const cancelCreateAppointment = () => {
    setIsConfirmCreateOpen(false);
    setPendingAppointment(null);
    // Reopen the new appointment form
    setIsNewAppointmentOpen(true);
  };

  const resetAppointmentForm = useCallback(() => {
    setAppointmentPatient("");
    setAppointmentService("");
    setAppointmentTime("");
    setAppointmentDoctor("");
    setAppointmentDate(undefined);
  }, []);

  const goToNewAppointment = () => {
    navigate('/appointments/new');
  };

  // Listen for the custom event to open the new appointment form
  useEffect(() => {
    const handleOpenNewAppointmentForm = () => {
      // Reset all form fields
      resetAppointmentForm();

      // Set the date to the current UI date
      setAppointmentDate(date);

      // Reset filtered patients list
      setFilteredPatients(registeredPatients);

      // Open the dialog
      setIsNewAppointmentOpen(true);
    };

    // Add event listener
    window.addEventListener('openNewAppointmentForm', handleOpenNewAppointmentForm);

    // Clean up
    return () => {
      window.removeEventListener('openNewAppointmentForm', handleOpenNewAppointmentForm);
    };
  }, [date, resetAppointmentForm]);

  // Listen for the custom event to open the new appointment form with pre-filled data
  useEffect(() => {
    const handleOpenNewAppointmentFormWithData = (event: Event) => {
      const customEvent = event as CustomEvent<{
        patientName: string;
        patientId: string;
        serviceName: string;
        date: string;
        followUpId: string;
      }>;

      // Get the data from the event
      const { patientName, serviceName, date, followUpId } = customEvent.detail;

      // Reset form first
      resetAppointmentForm();

      // Set the form fields with the data from the event
      setAppointmentPatient(patientName);
      setAppointmentService(serviceName);

      // Parse the date
      if (date) {
        const parsedDate = parseISO(date);
        setAppointmentDate(parsedDate);
        setDate(parsedDate); // Also update the UI date
      }

      // Reset filtered patients list
      setFilteredPatients(registeredPatients);

      // Show toast notification
      toast({
        title: "Follow-up Appointment",
        description: `Creating appointment for ${patientName} based on a follow-up reminder.`,
      });

      // Open the dialog
      setIsNewAppointmentOpen(true);
    };

    // Add event listener
    window.addEventListener('openNewAppointmentFormWithData', handleOpenNewAppointmentFormWithData);

    // Clean up
    return () => {
      window.removeEventListener('openNewAppointmentFormWithData', handleOpenNewAppointmentFormWithData);
    };
  }, [resetAppointmentForm]);

  // Helper function to reset expanded states
  const resetExpandedStates = () => {
    setExpandedDay(null);
    setExpandedMonthDay(null);
  };

  const handlePreviousClick = () => {
    // Reset expanded states when navigating
    resetExpandedStates();

    if (view === 'daily') {
      setDate(prev => addDays(prev, -1));
    } else if (view === 'weekly') {
      setDate(prev => addDays(prev, -7));
    } else if (view === 'monthly') {
      setDate(prev => {
        const prevMonth = new Date(prev);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        return prevMonth;
      });
    }
  };

  const handleNextClick = () => {
    // Reset expanded states when navigating
    resetExpandedStates();

    if (view === 'daily') {
      setDate(prev => addDays(prev, 1));
    } else if (view === 'weekly') {
      setDate(prev => addDays(prev, 7));
    } else if (view === 'monthly') {
      setDate(prev => {
        const nextMonth = new Date(prev);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      });
    }
  };

  // Memoize the week dates to avoid recalculating them on every render
  const weekDates = useMemo(() => {
    console.log('Recalculating week dates');
    const start = startOfWeek(date);
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [date]);

  // Memoize the month dates to avoid recalculating them on every render
  const monthDates = useMemo(() => {
    console.log('Recalculating month dates');
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  }, [date]);

  // Group appointments by time of day (not currently used but kept for future features)
  const groupAppointmentsByTimeOfDay = () => {
    const morning = filteredAppointments.filter(a => {
      const hour = parseInt(a.time.split(':')[0]);
      const isPM = a.time.includes('PM');
      return !isPM || hour === 12;
    });

    const afternoon = filteredAppointments.filter(a => {
      const hour = parseInt(a.time.split(':')[0]);
      const isPM = a.time.includes('PM');
      return isPM && hour !== 12;
    });

    return { morning, afternoon };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage and schedule {isDental ? 'Dental Metrix' : 'Meditouch'} appointments
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex justify-center items-center mb-4">
                <Tabs
                  defaultValue="daily"
                  value={view}
                  onValueChange={(newView) => {
                    resetExpandedStates();
                    setView(newView);
                  }}
                  className="w-full">
                  <TabsList className="mx-auto">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>

                  <TabsContent value="daily" className="m-0 w-full">
                    <div className="mt-4 mb-4 border-b pb-3">
                      <div className="flex items-center justify-between gap-4 divide-x">
                        <div className="flex items-center pr-4 space-x-2">
                          <Button variant="outline" size="icon" onClick={handlePreviousClick}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal min-w-[150px]">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(date) => {
                                  setDate(date || new Date());
                                  setPopoverOpen(false);
                                }}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <Button variant="outline" size="icon" onClick={handleNextClick}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                            Today
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 pl-4">
                          <div className="w-48">
                            <Select
                              value={selectedDoctor || 'all'}
                              onValueChange={(value) => {
                                console.log('Doctor selection changed to:', value);
                                setSelectedDoctor(value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All Doctors" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Doctors</SelectItem>
                                {doctors.map(doctor => (
                                  <SelectItem key={doctor.id} value={doctor.name}>{doctor.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-48 relative">
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
                    </div>
                    <div className="w-full">
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-16 border-r flex flex-col">
                          <div className="h-16 border-b"></div>
                          {Object.keys(hourlyTimeSlots).map(hour => (
                            <div key={hour} className="h-16 border-b flex items-start justify-end pr-2 text-xs text-gray-500 font-medium">
                              {hour}
                            </div>
                          ))}
                        </div>

                        <div className="ml-16 overflow-y-auto">
                          <div className="h-16 border-b flex items-center px-2 font-medium">
                            {format(date, 'EEEE, MMMM d, yyyy')}
                          </div>

                          {Object.entries(hourlyTimeSlots).map(([hour, slots]) => (
                            <div key={hour} className="h-16 border-b relative">
                              <div className="absolute inset-0 grid grid-cols-4 divide-x">
                                {slots.map(slot => {
                                  const appointments = getAppointmentsForTimeSlot(slot);
                                  return (
                                    <div
                                      key={slot}
                                      className={`p-1 cursor-pointer hover:bg-gray-50 h-full ${appointments.length === 0 ? 'border-dashed border-gray-200 border' : ''}`}
                                      onClick={() => {
                                        // Only open new appointment dialog if there are no appointments for this slot
                                        if (appointments.length === 0) {
                                          handleNewAppointmentForTimeSlot(slot);
                                        }
                                        // Otherwise, the click will be handled by the appointment item
                                      }}
                                    >
                                      {appointments.length === 0 ? (
                                        <div className="h-full w-full flex items-center justify-center">
                                          <div className="text-xs text-gray-400">{slot}</div>
                                        </div>
                                      ) : (
                                        <div className="h-full">
                                          {appointments.map(appointment => (
                                            <TimeSlotAppointment
                                              key={appointment.id}
                                              appointment={appointment}
                                              isDental={isDental}
                                              isCompact={appointments.length > 1}
                                              onClick={() => {
                                                handleEditAppointment(appointment);
                                              }}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="weekly" className="m-0 mt-4">
                    <div className="mt-4 mb-4 border-b pb-3">
                      <div className="flex items-center justify-between gap-4 divide-x">
                        <div className="flex items-center space-x-2 pr-4">
                          <Button variant="outline" size="icon" onClick={handlePreviousClick}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal min-w-[150px]">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(date) => {
                                  setDate(date || new Date());
                                  setPopoverOpen(false);
                                }}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <Button variant="outline" size="icon" onClick={handleNextClick}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                            Today
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 pl-4">
                          <div className="w-48">
                            <Select
                              value={selectedDoctor || 'all'}
                              onValueChange={(value) => {
                                console.log('Doctor selection changed to:', value);
                                setSelectedDoctor(value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All Doctors" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Doctors</SelectItem>
                                {doctors.map(doctor => (
                                  <SelectItem key={doctor.id} value={doctor.name}>{doctor.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-48 relative">
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
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center border-b pb-2 mb-2">
                      {weekDaysShort.map((day) => (
                        <div key={day} className="text-xs font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 h-[600px]">
                      {weekDates.map((day, idx) => {
                        const dayAppointments = getAppointmentsForDate(day);
                        const isCurrentDay = isToday(day);

                        // State for expanded view (using local variable since this is inside a map function)
                        const isExpanded = expandedDay === format(day, 'yyyy-MM-dd');

                        // Determine how many appointments to show initially - based on space analysis
                        const initialAppointmentsToShow = 12; // Show up to 12 appointments before needing to expand
                        const hasMoreAppointments = dayAppointments.length > initialAppointmentsToShow;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "border rounded-lg h-full p-1 relative",
                              isCurrentDay && "border-primary bg-primary/5",
                              !isSameMonth(day, date) && "opacity-50"
                            )}
                            onClick={() => {
                              // Toggle expand/collapse for this day
                              if (isExpanded) {
                                setExpandedDay(null);
                              } else {
                                setExpandedDay(format(day, 'yyyy-MM-dd'));
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-1 sticky top-0 bg-white z-10">
                              <div
                                className={cn(
                                  "text-xs font-medium p-1 text-center rounded-md flex-grow cursor-pointer",
                                  isCurrentDay ? isDental ? "bg-dental-primary text-white" : "bg-meditouch-primary text-white" : "bg-muted"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent the day cell click handler from firing
                                  setDate(day);
                                  setView('daily');
                                }}
                                title="Click to view this day in daily view"
                              >
                                {format(day, 'd')}
                              </div>

                              {/* Capacity indicator */}
                              {dayAppointments.length > 0 && (
                                <div
                                  className={cn(
                                    "text-xs px-1 rounded-full ml-1",
                                    dayAppointments.length >= (isDental ? 10 : 5) ? "bg-red-100 text-red-800" :
                                    dayAppointments.length >= (isDental ? 5 : 3) ? "bg-yellow-100 text-yellow-800" :
                                    "bg-green-100 text-green-800"
                                  )}
                                  title={`${dayAppointments.length} appointment${dayAppointments.length !== 1 ? 's' : ''}`}
                                >
                                  {dayAppointments.length}
                                </div>
                              )}
                            </div>

                            {/* Scrollable container for appointments */}
                            <div className={cn(
                              "space-y-1 overflow-y-auto pr-1",
                              isExpanded ? "max-h-[300px]" : "max-h-[180px]" // Taller container in weekly view
                            )}>
                              {/* Show all appointments if expanded, otherwise show limited number */}
                              {(isExpanded ? dayAppointments : dayAppointments.slice(0, initialAppointmentsToShow)).map(appointment => (
                                <CalendarAppointmentItem
                                  key={appointment.id}
                                  appointment={appointment}
                                  isDental={isDental}
                                  isCompact={dayAppointments.length > 1} // Use compact view if multiple appointments
                                  onClick={() => handleEditAppointment(appointment)}
                                />
                              ))}

                              {/* Show More / Show Less button */}
                              {hasMoreAppointments && (
                                <div className="flex justify-center mt-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs py-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isExpanded) {
                                        setExpandedDay(null);
                                      } else {
                                        setExpandedDay(format(day, 'yyyy-MM-dd'));
                                      }
                                    }}
                                  >
                                    {isExpanded ? 'Collapse' : `+${dayAppointments.length - initialAppointmentsToShow} more`}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="monthly" className="m-0 mt-4">
                    <div className="mt-4 mb-4 border-b pb-3">
                      <div className="flex items-center justify-between gap-4 divide-x">
                        <div className="flex items-center space-x-2 pr-4">
                          <Button variant="outline" size="icon" onClick={handlePreviousClick}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal min-w-[150px]">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(date) => {
                                  setDate(date || new Date());
                                  setPopoverOpen(false);
                                }}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <Button variant="outline" size="icon" onClick={handleNextClick}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                            Today
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 pl-4">
                          <div className="w-48">
                            <Select
                              value={selectedDoctor || 'all'}
                              onValueChange={(value) => {
                                console.log('Doctor selection changed to:', value);
                                setSelectedDoctor(value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All Doctors" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Doctors</SelectItem>
                                {doctors.map(doctor => (
                                  <SelectItem key={doctor.id} value={doctor.name}>{doctor.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-48 relative">
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
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center border-b pb-2 mb-2">
                      {weekDaysShort.map((day) => (
                        <div key={day} className="text-xs font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                      {Array.from({ length: new Date(date.getFullYear(), date.getMonth(), 1).getDay() }).map((_, i) => (
                        <div key={`empty-start-${i}`} className="border border-dashed rounded-lg bg-gray-50/50"></div>
                      ))}

                      {monthDates.map((day, idx) => {
                        const dayAppointments = getAppointmentsForDate(day);
                        const isCurrentDay = isToday(day);

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "border rounded-lg min-h-[100px] p-1 relative",
                              isCurrentDay && "border-primary bg-primary/5",
                              expandedMonthDay === format(day, 'yyyy-MM-dd') && "max-h-[250px] z-10 shadow-lg bg-white",
                              !expandedMonthDay && "max-h-[120px]"
                            )}
                            onClick={() => {
                              // Toggle expand/collapse for this day
                              if (expandedMonthDay === format(day, 'yyyy-MM-dd')) {
                                setExpandedMonthDay(null);
                              } else {
                                setExpandedMonthDay(format(day, 'yyyy-MM-dd'));
                              }
                            }}
                          >
                            {/* Day header with capacity indicator */}
                            <div className="flex items-center justify-between mb-1">
                              <div
                                className={cn(
                                  "text-xs font-medium p-1 text-center rounded-md flex-grow cursor-pointer",
                                  isCurrentDay ? isDental ? "bg-dental-primary text-white" : "bg-meditouch-primary text-white" : ""
                                )}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent the day cell click handler from firing
                                  setDate(day);
                                  setView('daily');
                                }}
                                title="Click to view this day in daily view"
                              >
                                {format(day, 'd')}
                              </div>

                              {/* Capacity indicator */}
                              {dayAppointments.length > 0 && (
                                <div
                                  className={cn(
                                    "text-xs px-1 rounded-full ml-1",
                                    dayAppointments.length >= (isDental ? 10 : 5) ? "bg-red-100 text-red-800" :
                                    dayAppointments.length >= (isDental ? 5 : 3) ? "bg-yellow-100 text-yellow-800" :
                                    "bg-green-100 text-green-800"
                                  )}
                                  title={`${dayAppointments.length} appointment${dayAppointments.length !== 1 ? 's' : ''}`}
                                >
                                  {dayAppointments.length}
                                </div>
                              )}
                            </div>

                            {/* Scrollable appointments container */}
                            <div className={cn(
                              "space-y-0.5 mt-1 overflow-y-auto pr-1",
                              expandedMonthDay === format(day, 'yyyy-MM-dd') ? "max-h-[200px]" : "max-h-[70px]"
                            )}>
                              {/* Show all appointments if expanded, otherwise show limited number */}
                              {(expandedMonthDay === format(day, 'yyyy-MM-dd') ?
                                dayAppointments :
                                dayAppointments.slice(0, 3)
                              ).map(appointment => (
                                <CalendarAppointmentItem
                                  key={appointment.id}
                                  appointment={appointment}
                                  isDental={isDental}
                                  isCompact={dayAppointments.length > 1} // Use compact view if multiple appointments
                                  onClick={() => {
                                    // We need to handle this in a way that stops propagation
                                    // but the CalendarAppointmentItem component expects a function with no parameters
                                    setTimeout(() => {
                                      handleEditAppointment(appointment);
                                    }, 0);
                                  }}
                                />
                              ))}

                              {/* Show more/less button */}
                              {dayAppointments.length > 3 && !expandedMonthDay && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-xs py-0 mt-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedMonthDay(format(day, 'yyyy-MM-dd'));
                                  }}
                                >
                                  +{dayAppointments.length - 3} more
                                </Button>
                              )}

                              {/* Show collapse button when expanded */}
                              {expandedMonthDay === format(day, 'yyyy-MM-dd') && (
                                <div className="flex justify-center mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs py-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedMonthDay(null);
                                    }}
                                  >
                                    Collapse
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {Array.from({
                        length: 6 * 7 - monthDates.length - new Date(date.getFullYear(), date.getMonth(), 1).getDay()
                      }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="border border-dashed rounded-lg bg-gray-50/50"></div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={isNewAppointmentOpen}
        onOpenChange={(open) => {
          setIsNewAppointmentOpen(open);
          if (!open) {
            // Reset when dialog closes
            resetAppointmentForm();
            setFilteredPatients(registeredPatients);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Add a new appointment for a registered patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select
                  value={appointmentPatient}
                  onValueChange={setAppointmentPatient}
                  // Keep the dropdown open when clicking inside it
                  onOpenChange={(open) => {
                    if (open) {
                      // When opening, reset the filtered patients
                      setFilteredPatients(registeredPatients);
                    }
                  }}
                >
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Input
                          placeholder="Search patients..."
                          className="mb-2 pr-8"
                          onChange={(e) => {
                            // Immediately filter as the user types
                            const value = e.target.value;
                            console.log('Searching for:', value);
                            handlePatientSearch(value);
                          }}
                          // Add autofocus to automatically focus the search input when dropdown opens
                          autoFocus
                          id="patient-search"
                          // Prevent the dropdown from closing when typing
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            // Prevent the dropdown from closing when pressing keys
                            e.stopPropagation();
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={(e) => {
                            // Prevent the dropdown from closing
                            e.stopPropagation();

                            // Clear the search input
                            const input = document.getElementById('patient-search') as HTMLInputElement;
                            if (input) {
                              input.value = '';
                              handlePatientSearch('');
                              // Re-focus the input after clearing
                              input.focus();
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {filteredPatients.length === 0 ? (
                      <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                        No patient found
                      </div>
                    ) : (
                      // Wrap in a div to prevent event propagation issues
                      <div onClick={(e) => e.stopPropagation()}>
                        {filteredPatients.map(patient => (
                          <SelectItem
                            key={patient.id}
                            value={patient.name}
                            // Prevent the dropdown from closing immediately
                            onSelect={(e) => {
                              // This ensures the value is set but the dropdown doesn't close immediately
                              e.preventDefault();
                              setAppointmentPatient(patient.name);
                            }}
                          >
                            {patient.name}
                          </SelectItem>
                        ))}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select value={appointmentService} onValueChange={setAppointmentService}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {isDental ? (
                      <>
                        <SelectItem value="Dental Checkup">Dental Checkup</SelectItem>
                        <SelectItem value="Root Canal">Root Canal</SelectItem>
                        <SelectItem value="Teeth Cleaning">Teeth Cleaning</SelectItem>
                        <SelectItem value="Crown Fitting">Crown Fitting</SelectItem>
                        <SelectItem value="Dental Filling">Dental Filling</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Skin Consultation">Skin Consultation</SelectItem>
                        <SelectItem value="Hair Treatment">Hair Treatment</SelectItem>
                        <SelectItem value="Facial">Facial</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Appointment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !appointmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {appointmentDate ? format(appointmentDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={appointmentDate}
                      onSelect={setAppointmentDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time Slot</Label>
                <Select
                  value={appointmentTime}
                  onValueChange={setAppointmentTime}
                  onOpenChange={(open) => {
                    if (open && appointmentDate) {
                      // When opening, make sure we're using the current date for available slots
                      console.log('Opening time slot dropdown with date:', format(appointmentDate, 'yyyy-MM-dd'));
                    }
                  }}
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeSlots().map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                    {getAvailableTimeSlots().length === 0 && (
                      <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                        No available time slots for this date
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select value={appointmentDoctor} onValueChange={setAppointmentDoctor}>
                  <SelectTrigger id="doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.name}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex space-x-2 ml-auto">
              <Button
                onClick={handleCreateAppointment}
                className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
              >
                Create Appointment
              </Button>
              <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditAppointmentOpen}
        onOpenChange={(open) => {
          setIsEditAppointmentOpen(open);
          if (open) {
            // Reset filtered patients when opening the dialog
            setFilteredPatients(registeredPatients);
          } else {
            // When closing, make sure we don't open the new appointment dialog
            setEditingAppointment(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Reschedule or cancel the appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-patient">Patient</Label>
                <Select
                  value={appointmentPatient || ''}
                  onValueChange={setAppointmentPatient}
                  defaultValue={appointmentPatient || ''}
                >
                  <SelectTrigger id="edit-patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Input
                          placeholder="Search patients..."
                          className="mb-2 pr-8"
                          onChange={(e) => {
                            // Immediately filter as the user types
                            const value = e.target.value;
                            console.log('Searching for:', value);
                            handlePatientSearch(value);
                          }}
                          // Add autofocus to automatically focus the search input when dropdown opens
                          autoFocus
                          id="edit-patient-search"
                          // Prevent the dropdown from closing when typing
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            // Prevent the dropdown from closing when pressing keys
                            e.stopPropagation();
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={(e) => {
                            // Prevent the dropdown from closing
                            e.stopPropagation();

                            // Clear the search input
                            const input = document.getElementById('edit-patient-search') as HTMLInputElement;
                            if (input) {
                              input.value = '';
                              handlePatientSearch('');
                              // Re-focus the input after clearing
                              input.focus();
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {filteredPatients.length === 0 ? (
                      <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                        No patient found
                      </div>
                    ) : (
                      // Wrap in a div to prevent event propagation issues
                      <div onClick={(e) => e.stopPropagation()}>
                        {filteredPatients.map(patient => (
                          <SelectItem
                            key={patient.id}
                            value={patient.name}
                            // Prevent the dropdown from closing immediately
                            onSelect={(e) => {
                              // This ensures the value is set but the dropdown doesn't close immediately
                              e.preventDefault();
                              setAppointmentPatient(patient.name);
                            }}
                          >
                            {patient.name}
                          </SelectItem>
                        ))}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service">Service</Label>
                <Select
                  value={appointmentService || ''}
                  onValueChange={setAppointmentService}
                  defaultValue={appointmentService || ''}
                >
                  <SelectTrigger id="edit-service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {isDental ? (
                      <>
                        <SelectItem value="Dental Checkup">Dental Checkup</SelectItem>
                        <SelectItem value="Root Canal">Root Canal</SelectItem>
                        <SelectItem value="Teeth Cleaning">Teeth Cleaning</SelectItem>
                        <SelectItem value="Crown Fitting">Crown Fitting</SelectItem>
                        <SelectItem value="Dental Filling">Dental Filling</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Skin Consultation">Skin Consultation</SelectItem>
                        <SelectItem value="Hair Treatment">Hair Treatment</SelectItem>
                        <SelectItem value="Facial">Facial</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Appointment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !appointmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {appointmentDate ? format(appointmentDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={appointmentDate}
                      onSelect={setAppointmentDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">Time Slot</Label>
                <Select
                  value={appointmentTime || ''}
                  onValueChange={setAppointmentTime}
                  defaultValue={appointmentTime || ''}
                  onOpenChange={(open) => {
                    if (open && appointmentDate) {
                      // When opening, make sure we're using the current date for available slots
                      console.log('Opening time slot dropdown with date:', format(appointmentDate, 'yyyy-MM-dd'));
                    }
                  }}
                >
                  <SelectTrigger id="edit-time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Always show the current time slot */}
                    {appointmentTime && (
                      <SelectItem value={appointmentTime}>
                        {appointmentTime} (Current)
                      </SelectItem>
                    )}

                    {/* Show available time slots */}
                    {getAvailableTimeSlots()
                      .filter(time => time !== appointmentTime) // Filter out current time to avoid duplication
                      .map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))
                    }

                    {/* Show message if no available slots */}
                    {getAvailableTimeSlots().length === 0 && !appointmentTime && (
                      <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                        No available time slots for this date
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-doctor">Doctor</Label>
                <Select
                  value={appointmentDoctor || ''}
                  onValueChange={setAppointmentDoctor}
                  defaultValue={appointmentDoctor || ''}
                >
                  <SelectTrigger id="edit-doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.name}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div className="space-x-2">
              <Button
                onClick={openUpdateConfirmation}
                className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
              >
                Update
              </Button>
              {editingAppointment && editingAppointment.status !== 'completed' && (
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => {
                    if (editingAppointment) {
                      handleCompleteAppointment(editingAppointment);
                      setIsEditAppointmentOpen(false);
                    }
                  }}
                >
                  Mark as Completed
                </Button>
              )}
              <Button variant="destructive" onClick={openCancelConfirmation}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setIsEditAppointmentOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Confirmation Dialog */}
      <Dialog open={isConfirmUpdateOpen} onOpenChange={setIsConfirmUpdateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update this appointment?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingAppointment && (
              <p className="text-sm text-muted-foreground">
                You are about to update the appointment for <span className="font-semibold">{editingAppointment.patient}</span> on {format(appointmentDate || new Date(), 'PP')} at {appointmentTime}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelUpdate}>
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
            >
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isConfirmCancelOpen} onOpenChange={setIsConfirmCancelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingAppointment && (
              <p className="text-sm text-muted-foreground">
                You are about to cancel the appointment for <span className="font-semibold">{editingAppointment.patient}</span> on {format(new Date(editingAppointment.date), 'PP')} at {editingAppointment.time}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelCancel}>
              Go Back
            </Button>
            <Button
              onClick={handleCancelAppointment}
              variant="destructive"
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Creation Confirmation Dialog */}
      <Dialog open={isConfirmCreateOpen} onOpenChange={setIsConfirmCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Please confirm that you want to schedule this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {pendingAppointment && (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Patient:</span> {pendingAppointment.patient}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Service:</span> {pendingAppointment.service}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Date:</span> {pendingAppointment.date ? format(pendingAppointment.date, 'PP') : ''}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Time:</span> {pendingAppointment.time}
                </p>
                {isDental && pendingAppointment.doctor && (
                  <p className="text-sm">
                    <span className="font-semibold">Doctor:</span> {pendingAppointment.doctor}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelCreateAppointment}>
              Back
            </Button>
            <Button
              onClick={confirmCreateAppointment}
              className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
            >
              Confirm Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;

