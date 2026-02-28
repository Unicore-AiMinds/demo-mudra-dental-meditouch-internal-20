
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDentalHistory } from '@/contexts/DentalHistoryContext';
import { useDoctors } from '@/contexts/DoctorContext';
import { usePatients } from '@/contexts/PatientContext';
import { useAppointments, Appointment, DentalAppointment, MeditouchAppointment } from '@/contexts/AppointmentContext';
import { DentalChartingProvider, useDentalCharting } from '@/contexts/DentalChartingContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useServices } from '@/contexts/ServiceContext';
import AppointmentCompletionDialog from '@/components/AppointmentCompletionDialog';
import UnresolvedAppointmentsAlert from '@/components/UnresolvedAppointmentsAlert';
import { getLighterColor } from '@/utils/doctorColors';
import PendingTreatmentsView from '@/components/PendingTreatmentsView';
import { Skeleton } from '@/components/ui/skeleton';
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
  MoreVertical,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
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
import AddPatientDialog from '@/components/AddPatientDialog';
import AppointmentList from '@/components/AppointmentList';
import {
  sendAppointmentScheduledMessage,
  sendAppointmentRescheduledMessage,
  sendAppointmentCancelledMessage,
} from '@/services/whatsapp-service';

// Patients will be fetched from PatientContext

// Using DoctorContext instead of hardcoded doctors array

// Services are fetched from the ServiceContext

const timeSlots = [
  '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
  '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM',
  '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
  '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM',
  '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM',
  '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM',
  '6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM',
  '7:00 PM', '7:15 PM', '7:30 PM', '7:45 PM'
];

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

// Using appointment types from AppointmentContext
type AppointmentType = DentalAppointment | MeditouchAppointment;

const AppointmentCard = ({
  time,
  patient_name,
  service,
  doctor,
  status,
  second_patient_name = null,
  isDental = true,
  onEdit,
  onReschedule,
  onCancel,
  onComplete,
  hasPermission
}: {
  time: string;
  patient_name: string;
  service: string;
  doctor?: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  second_patient_name?: string | null;
  isDental?: boolean;
  onEdit: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onComplete?: () => void;
  hasPermission: (permission: string) => boolean;
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
            {hasPermission('appointments.edit') && (
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            )}
            {hasPermission('appointments.edit') && (
              <DropdownMenuItem onClick={onReschedule}>Reschedule</DropdownMenuItem>
            )}
            {status !== 'completed' && onComplete && hasPermission('appointments.edit') && (
              <DropdownMenuItem
                onClick={() => {
                  console.log("Mark as Completed clicked in dropdown menu");
                  onComplete();
                }}
                className="text-green-600"
              >
                Mark as Completed
              </DropdownMenuItem>
            )}
            {hasPermission('appointments.delete') && (
              <DropdownMenuItem onClick={onCancel} className="text-red-500">
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-1">
        <div className="text-sm font-medium">{patient_name}</div>
        {second_patient_name && <div className="text-sm font-medium">{second_patient_name}</div>}
        <div className="text-xs text-muted-foreground">{service}</div>
        {doctor && <div className="text-xs font-medium mt-1 text-dental-primary">{doctor}</div>}
      </div>
    </div>
  );
};

const CalendarAppointmentItem = ({
  appointment,
  isDental,
  onClick,
  isCompact = false,
  doctorsList,
  getServiceDuration
}: {
  appointment: DentalAppointment | MeditouchAppointment,
  isDental: boolean,
  onClick: () => void,
  isCompact?: boolean,
  doctorsList: { id: string; name: string; color?: string }[],
  getServiceDuration: (serviceName: string) => number
}) => {
  // Default colors
  const bgColor = isDental ? 'bg-dental-light' : 'bg-meditouch-light';
  const borderColor = isDental ? 'border-dental-primary' : 'border-meditouch-primary';
  const textColor = isDental ? 'text-dental-primary' : 'text-meditouch-primary';

  // Custom styles for inline styling with provider colors
  let customStyles = {};

  // Get the provider name (doctor for dental, therapist for meditouch)
  let providerName = '';
  if (isDental && 'doctor' in appointment) {
    providerName = appointment.doctor;
  } else if (!isDental && 'therapist' in appointment && appointment.therapist) {
    providerName = appointment.therapist;
  }

  // Find the provider in the doctors array passed as prop
  const provider = doctorsList.find(d => d.name === providerName);
  if (provider && provider.color) {
    // Use the provider's color for styling
    const providerColor = provider.color;
    customStyles = {
      backgroundColor: getLighterColor(providerColor, 0.15),
      borderLeftColor: providerColor,
      color: providerColor
    };
  }

  // Create tooltip content for appointment details
  const tooltipContent = (
    <div className="text-xs">
      <div className="font-bold">{appointment.patient_name}</div>
      <div>{appointment.service}</div>
      {providerName && (
        <div>Doctor: {providerName}</div>
      )}
      <div>Time: {appointment.time}</div>
      <div>Duration: {getServiceDuration(appointment.service)} min</div>
    </div>
  );

  const appointmentContent = (
    <div
      className={`px-1.5 py-0.5 text-xs rounded mb-0.5 border-l-2 cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation(); // Stop event from bubbling up to parent
        onClick();
      }}
      style={{
        backgroundColor: isDental ? 'rgba(74, 144, 226, 0.15)' : 'rgba(22, 160, 133, 0.15)',
        borderLeftColor: isDental ? '#4A90E2' : '#16A085',
        color: isDental ? '#4A90E2' : '#16A085',
        ...customStyles
      }}
    >
      {isCompact ? (
        // Compact view - show service and patient name
        <>
          <div className="font-medium truncate">{appointment.service}</div>
          <div className="text-xs truncate">{appointment.patient_name}</div>
        </>
      ) : (
        // Full view - show time, service and patient
        <>
          <div className="font-medium truncate">{appointment.time} | {appointment.service}</div>
          <div className="text-xs truncate">{appointment.patient_name}</div>
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

const TimeSlotAppointment = ({
  appointment,
  isDental,
  onClick,
  isCompact = false,
  isMultiSlot = false,
  isFirstSlot = true,
  slotsOccupied = 1,
  doctorsList
}: {
  appointment: DentalAppointment | MeditouchAppointment,
  isDental: boolean,
  onClick: () => void,
  isCompact?: boolean,
  isMultiSlot?: boolean,
  isFirstSlot?: boolean,
  slotsOccupied?: number,
  doctorsList: { id: string; name: string; color?: string }[]
}) => {
  // Get doctor color from the doctors array if it's a dental appointment
  const bgColor = isDental ? 'bg-dental-primary' : 'bg-meditouch-primary';

  // Get the provider name (doctor for dental, therapist for meditouch)
  let providerName = '';
  if (isDental && 'doctor' in appointment) {
    providerName = appointment.doctor;
  } else if (!isDental) {
    // For Meditouch, check if therapist exists
    if ('therapist' in appointment && appointment.therapist) {
      providerName = appointment.therapist;
    }
    // Log for debugging
    console.log('Meditouch appointment:', appointment);
  }

  // Find the provider in the doctors array passed as prop
  const provider = doctorsList.find(d => d.name === providerName);
  // We'll use inline styles instead of Tailwind classes for provider colors
  // Just keep the default bgColor for the className

  // Create tooltip content with complete appointment details
  const tooltipContent = (
    <div className="text-xs">
      <div className="font-bold">{appointment.patient_name}</div>
      <div><span className="font-medium">Service:</span> {appointment.service}</div>
      {isMultiSlot && (
        <div><span className="font-medium">Duration:</span> {slotsOccupied * 15} min</div>
      )}
      {providerName && (
        <div><span className="font-medium">Doctor:</span> {providerName}</div>
      )}
      <div><span className="font-medium">Time:</span> {appointment.time}</div>
    </div>
  );

  // Only show content if this is the first slot of the appointment or if we're showing all slots
  const appointmentContent = (
    <div
      className={`text-white rounded p-1 text-xs cursor-pointer hover:opacity-90 transition-opacity h-full w-full relative`}
      onClick={(e) => {
        e.stopPropagation(); // Stop event from bubbling up to parent
        onClick();
      }}
      style={{
        backgroundColor: provider?.color || (isDental ? '#4A90E2' : '#16A085')
      }}
    >
      <div className="font-medium truncate">{appointment.service}</div>
      <div className="text-white/90 text-[10px] truncate font-bold">
        {appointment.patient_name}
      </div>
      {!isCompact && providerName && (
        <div className="text-white/90 text-[10px] font-medium truncate">{providerName}</div>
      )}

      {/* Show continuation indicator for multi-slot appointments */}
      {isMultiSlot && (
        <div className="absolute bottom-0 right-0 left-0 flex justify-center">
          <div className="bg-white/30 h-1 w-6 rounded-full"></div>
        </div>
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
  const { hasPermission } = usePermissions();
  const { doctors } = useDoctors(); // Get doctors from context
  const { patients } = usePatients(); // Get patients from context
  const {
    dentalAppointments,
    meditouchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    markAppointmentCompleted
  } = useAppointments(); // Get appointments from context
  const { dentalServices, meditouchServices } = useServices(); // Get services from context

  // Local loading state for UI operations
  const [isLoading, setIsLoading] = useState(false);

  // Combine dental and meditouch appointments
  const appointments = useMemo(() => {
    console.log('Combining appointments:', {
      dental: dentalAppointments.length,
      meditouch: meditouchAppointments.length
    });
    return isDental ? dentalAppointments : meditouchAppointments;
  }, [dentalAppointments, meditouchAppointments, isDental]);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get view from URL parameters, default to 'daily'
  const getInitialView = () => {
    return searchParams.get('view') || 'daily';
  };

  const [view, setView] = useState(getInitialView());
  
  // Sync view with URL changes (e.g. from pending treatments)
  useEffect(() => {
    const urlView = searchParams.get('view') || 'daily';
    if (urlView !== view) {
      console.log('URL parameter changed, updating view to:', urlView);
      setView(urlView);
    }
  }, [searchParams, view]); // Watch for changes to search parameters
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentType | null>(null);
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const [appointmentPatient, setAppointmentPatient] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<{id: string, name: string}[]>([]);
  const [appointmentService, setAppointmentService] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDoctor, setAppointmentDoctor] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [pendingChartingEntryId, setPendingChartingEntryId] = useState<string | undefined>(undefined);
  const [pendingFollowUpId, setPendingFollowUpId] = useState<string | undefined>(undefined);
  const [appointmentFollowUpService, setAppointmentFollowUpService] = useState("");

  // State for WhatsApp confirmation popup
  const [isWhatsAppConfirmOpen, setIsWhatsAppConfirmOpen] = useState(false);
  const [whatsAppConfirmData, setWhatsAppConfirmData] = useState<{
    phone: string;
    patientName: string;
    doctor: string;
    date: string;
    time: string;
    service: string;
    followUpService?: string;
    actionType: 'scheduled' | 'rescheduled' | 'cancelled';
  } | null>(null);

  // State for expanded days in weekly and monthly views
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedMonthDay, setExpandedMonthDay] = useState<string | null>(null);

  // State for appointment creation confirmation dialog
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false);
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [pendingAppointment, setPendingAppointment] = useState<{
    patient?: string;
    patient_name?: string;
    service: string;
    time: string;
    date: Date | undefined;
    doctor?: string;
    notes?: string;
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

  // Effect to filter patients based on search term and clinic type
  useEffect(() => {
    if (patients.length > 0) {
      // First filter patients by clinic type
      const clinicPatients = patients.filter(p =>
        p.clinic === activeClinic || p.clinic === 'both'
      );

      if (!searchTerm) {
        // If no search term, show all patients for this clinic
        setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));
      } else {
        // Filter patients based on search term and clinic type
        const filtered = clinicPatients.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPatients(filtered.map(p => ({ id: p.id, name: p.name })));
      }
    }
  }, [patients, searchTerm, activeClinic]);

  // Use appointments from AppointmentContext instead of local state

  // Function to refresh appointments for the selected date
  const fetchAppointmentsForSelectedDate = useCallback(async () => {
    try {
      console.log('Refreshing appointments for date:', format(date, 'yyyy-MM-dd'));
      // This will trigger a re-render with the latest appointments
      // The appointments are already being fetched from the context
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }, [date]);

  // Memoize the getAppointmentsForDate function to avoid recalculating on every render
  const getAppointmentsForDate = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');

    // Get all active appointments for this date (not cancelled or completed)
    const allAppointmentsForDate = appointments.filter(app =>
      app.date === dateString &&
      app.status !== 'cancelled' &&
      app.status !== 'completed'
    );

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
        (app.patient_name && app.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.service && app.service.toLowerCase().includes(searchTerm.toLowerCase()));

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
      const matchesSearch = !searchTerm ||
        (app.patient_name && app.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (isDental && app.second_patient_name ? app.second_patient_name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (app.service && app.service.toLowerCase().includes(searchTerm.toLowerCase()));

      // Handle doctor filtering properly
      const matchesDoctor =
        selectedDoctor === 'all' || // Always match if 'all' is selected
        !selectedDoctor || // Always match if no doctor is selected
        (isDental && 'doctor' in app && (app as DentalAppointment).doctor === selectedDoctor); // Match specific doctor

      const isActive = app.status !== 'cancelled' && app.status !== 'completed';

      if (view === 'daily') {
        return matchesDate && matchesSearch && matchesDoctor && isActive;
      } else {
        return matchesSearch && matchesDoctor && isActive;
      }
    });

    console.log(`Filtered ${appointments.length} appointments down to ${filtered.length}`);
    return filtered;
  }, [appointments, date, searchTerm, selectedDoctor, isDental, view]);

  // Function to get the duration of a service in minutes based on the current clinic
  const getServiceDuration = (serviceName: string) => {
    if (!serviceName) return 15; // Default to 15 minutes if no service name provided

    const serviceList = isDental ? dentalServices : meditouchServices;
    const service = serviceList.find(s => s.name === serviceName);
    return service?.duration || 15; // Default to 15 minutes if service not found
  };

  // Function to calculate how many 15-minute slots a service occupies based on the current clinic
  const getSlotsOccupied = (serviceName: string) => {
    const duration = getServiceDuration(serviceName);
    return Math.ceil(duration / 15);
  };

  // Function to get the duration of a service in minutes based on the specific clinic type
  const getDurationForSpecificClinic = (serviceName: string, clinicType: 'dental' | 'meditouch') => {
    if (!serviceName) return 15; // Default to 15 minutes if no service name provided

    const serviceList = clinicType === 'dental' ? dentalServices : meditouchServices;
    const service = serviceList.find(s => s.name === serviceName);
    return service?.duration || 15; // Default to 15 minutes if service not found
  };

  // Function to calculate how many 15-minute slots a service occupies based on the specific clinic type
  const getSlotsOccupiedForSpecificClinic = (serviceName: string, clinicType: 'dental' | 'meditouch') => {
    const duration = getDurationForSpecificClinic(serviceName, clinicType);
    return Math.ceil(duration / 15);
  };

  // Function to get the duration for a specific appointment
  const getDurationForSpecificAppointment = (appointment: Appointment) => {
    if (appointment.duration_minutes) {
      return appointment.duration_minutes; // Use the appointment's duration if available
    }
    return getDurationForSpecificClinic(appointment.service, appointment.clinic_type);
  };

  // Function to get slots occupied for a specific appointment
  const getSlotsForSpecificAppointment = (appointment: Appointment) => {
    const duration = getDurationForSpecificAppointment(appointment);
    return Math.ceil(duration / 15);
  };

  // Get all appointments that affect a specific time slot
  const getAppointmentsForTimeSlot = useCallback((timeSlot: string) => {
    // First, get appointments that start at this exact time slot
    const directAppointments = filteredAppointments.filter(app => app.time === timeSlot);

    // Then, find appointments that started earlier but extend into this slot
    const extendedAppointments = filteredAppointments.filter(app => {
      // Skip appointments that start at this slot (already included)
      if (app.time === timeSlot) return false;

      // Calculate how many slots this appointment occupies
      const slotsOccupied = getSlotsOccupied(app.service);
      if (slotsOccupied <= 1) return false; // Only occupies one slot

      // Find the index of the appointment's start time and the current slot
      const appStartIndex = timeSlots.indexOf(app.time);
      const currentSlotIndex = timeSlots.indexOf(timeSlot);

      // If we couldn't find the indices, skip this appointment
      if (appStartIndex === -1 || currentSlotIndex === -1) return false;

      // Check if this appointment extends into the current slot
      return (
        appStartIndex < currentSlotIndex &&
        appStartIndex + slotsOccupied > currentSlotIndex
      );
    });

    // Combine direct and extended appointments
    const allAppointments = [...directAppointments, ...extendedAppointments];

    // Sort appointments by ID (as a proxy for creation time)
    // Lower ID numbers were created first
    return allAppointments.sort((a, b) => {
      // Extract numeric part from ID (e.g., 'd1' -> 1, 'd10' -> 10)
      const idA = parseInt(a.id.replace(/\D/g, ''));
      const idB = parseInt(b.id.replace(/\D/g, ''));
      return idA - idB; // Sort in ascending order (oldest first)
    });
  }, [filteredAppointments, getSlotsOccupied]);

  const getBookedTimeSlots = () => {
    // Get all active appointments for the current date (not cancelled or completed)
    const dateAppointments = appointments
      .filter(app =>
        app.date === format(date, 'yyyy-MM-dd') &&
        app.status !== 'cancelled' &&
        app.status !== 'completed'
      );

    // Count appointments per time slot, accounting for multi-slot appointments
    const slotCounts: Record<string, number> = {};

    // Initialize all slots with 0 count
    timeSlots.forEach(slot => {
      slotCounts[slot] = 0;
    });

    // For each appointment, increment count for all slots it occupies
    dateAppointments.forEach(app => {
      const startSlot = app.time;
      const slotsOccupied = getSlotsOccupied(app.service);

      // Find the starting index of this appointment
      const startIndex = timeSlots.indexOf(startSlot);
      if (startIndex === -1) return;

      // Increment count for each slot this appointment occupies
      for (let i = 0; i < slotsOccupied; i++) {
        const slotIndex = startIndex + i;
        if (slotIndex < timeSlots.length) {
          const slot = timeSlots[slotIndex];
          slotCounts[slot] = (slotCounts[slot] || 0) + 1;
        }
      }
    });

    return slotCounts;
  };

  // Function to check if a doctor is already booked in the other clinic type for a specific time slot
  const isDoctorBookedInOtherClinic = (doctorName: string, timeSlot: string, serviceToCheck?: string) => {
    // Get all appointments for the current date (not cancelled or completed)
    // We need to check both dental and meditouch appointments, regardless of current clinic type
    const allAppointments = [...dentalAppointments, ...meditouchAppointments]
      .filter(app =>
        app.date === format(date, 'yyyy-MM-dd') &&
        app.status !== 'cancelled' &&
        app.status !== 'completed'
      );

    // Get the time slot index
    const timeSlotIndex = timeSlots.indexOf(timeSlot);
    if (timeSlotIndex === -1) return false;

    // Calculate how many slots the new appointment would occupy
    // If serviceToCheck is provided, use it, otherwise use the currently selected service
    const newAppointmentService = serviceToCheck || appointmentService;
    const newAppointmentSlotsOccupied = newAppointmentService ? getSlotsOccupied(newAppointmentService) : 1;
    const newAppointmentEndIndex = timeSlotIndex + newAppointmentSlotsOccupied - 1;

    // Filter appointments to only include those from the other clinic type
    const otherClinicType = isDental ? 'meditouch' : 'dental';
    const otherClinicAppointments = allAppointments.filter(app => app.clinic_type === otherClinicType);

    // Log for debugging
    console.log(`Checking if doctor ${doctorName} is booked at ${timeSlot} in the ${otherClinicType} clinic`);
    console.log(`Found ${otherClinicAppointments.length} appointments in the ${otherClinicType} clinic`);
    console.log(`New appointment would occupy ${newAppointmentSlotsOccupied} slots, from index ${timeSlotIndex} to ${newAppointmentEndIndex}`);

    // Create arrays of all time slot indices that would be occupied by the new appointment
    const newAppSlots = [];
    for (let i = 0; i < newAppointmentSlotsOccupied; i++) {
      newAppSlots.push(timeSlotIndex + i);
    }

    // Get the actual time slots for better understanding
    const newAppTimeSlots = newAppSlots.map(index => timeSlots[index]);
    console.log(`New appointment would occupy these time slots: ${newAppTimeSlots.join(', ')}`);

    // Find overlapping appointments
    const overlappingAppointments = otherClinicAppointments.filter(app => {
      // Get the doctor/therapist name from the appointment
      const appDoctorName = 'doctor' in app ? app.doctor :
                         ('therapist' in app && app.therapist) ? app.therapist : '';

      // If not the same doctor, no conflict
      if (appDoctorName !== doctorName) return false;

      // Get the appointment's time slot index
      const appTimeSlotIndex = timeSlots.indexOf(app.time);
      if (appTimeSlotIndex === -1) return false;

      // Calculate how many slots this appointment occupies
      // Use duration_minutes if available, otherwise look up service duration
      const slotsOccupied = app.duration_minutes
        ? Math.ceil(app.duration_minutes / 15)
        : getSlotsOccupiedForSpecificClinic(app.service, app.clinic_type); // Use service lookup as fallback
      const appointmentEndIndex = appTimeSlotIndex + slotsOccupied - 1;

      // Log for debugging
      console.log(`Found appointment for doctor ${appDoctorName} at ${app.time} in ${app.clinic_type} clinic`);
      console.log(`Service: ${app.service}, Duration: ${app.duration_minutes || 15} minutes`);
      console.log(`Slots occupied: ${slotsOccupied}, ends at index: ${appointmentEndIndex}`);

      // Create arrays of all time slot indices occupied by this appointment
      const existingAppSlots = [];
      for (let i = 0; i < slotsOccupied; i++) {
        existingAppSlots.push(appTimeSlotIndex + i);
      }

      // Get the actual time slots for better understanding
      const existingAppTimeSlots = existingAppSlots.map(index => timeSlots[index]);
      console.log(`Existing appointment occupies these time slots: ${existingAppTimeSlots.join(', ')}`);

      // Check if any slot in the new appointment is also in the existing appointment
      const overlaps = newAppSlots.some(slot => existingAppSlots.includes(slot));
      console.log(`Overlap detected: ${overlaps}`);

      if (overlaps) {
        // Calculate the end time of the existing appointment for better logging
        const endTimeSlot = timeSlots[appointmentEndIndex] || 'end of session';
        console.log(`OVERLAP DETECTED: Doctor ${doctorName} is already booked from ${app.time} to ${endTimeSlot} in the ${app.clinic_type} clinic`);

        // Calculate the end time of the new appointment for better logging
        const newEndTimeSlot = timeSlots[newAppointmentEndIndex] || 'end of session';
        console.log(`New appointment would be from ${timeSlot} to ${newEndTimeSlot}`);
      }

      return overlaps;
    });

    // If we found any overlapping appointments, show a warning and return true
    if (overlappingAppointments.length > 0) {
      // Get the first overlapping appointment for the warning message
      const overlappingApp = overlappingAppointments[0];

      // Calculate the end time of the overlapping appointment
      const appTimeSlotIndex = timeSlots.indexOf(overlappingApp.time);
      // Always use service lookup to ensure correct duration
      const slotsOccupied = getSlotsOccupiedForSpecificClinic(overlappingApp.service, overlappingApp.clinic_type);
      const endSlotIndex = appTimeSlotIndex + slotsOccupied - 1;
      const endTimeSlot = timeSlots[endSlotIndex] || 'end of session';

      // Show the warning message
      handleDoctorDoubleBookingWarning(doctorName, timeSlot);
      return true;
    }

    return false;
  };

  const getAvailableTimeSlots = () => {
    // Get all active appointments for the current date
    const dateAppointments = appointments
      .filter(app =>
        app.date === format(date, 'yyyy-MM-dd') &&
        app.status !== 'cancelled' &&
        app.status !== 'completed'
      );

    // Create a map of slot availability
    const slotAvailability: Record<string, number> = {};

    // Get current date and time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isToday = date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

    // Initialize all slots with max capacity
    timeSlots.forEach(slot => {
      // Always set normal capacity for all slots
      slotAvailability[slot] = isDental ? 2 : 1; // Dental allows 2 per slot, Meditouch only 1
    });

    // For each appointment, reduce availability of all slots it occupies
    dateAppointments.forEach(app => {
      const startSlot = app.time;
      const slotsOccupied = getSlotsOccupied(app.service);

      // Find the starting index of this appointment
      const startIndex = timeSlots.indexOf(startSlot);
      if (startIndex === -1) return;

      // Reduce availability for each slot this appointment occupies
      for (let i = 0; i < slotsOccupied; i++) {
        const slotIndex = startIndex + i;
        if (slotIndex < timeSlots.length) {
          const slot = timeSlots[slotIndex];
          slotAvailability[slot] = Math.max(0, (slotAvailability[slot] || 0) - 1);
        }
      }
    });

    // Filter out past time slots if we're looking at today
    if (isToday) {
      return timeSlots.filter(slot => {
        // Parse the time slot
        const [timeStr, modifier] = slot.split(' ');
        let hours = parseInt(timeStr.split(':')[0]);
        const minutes = parseInt(timeStr.split(':')[1]);

        // Convert to 24-hour format
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        // Create a date object for this time slot
        const slotTime = new Date(today);
        slotTime.setHours(hours, minutes, 0, 0);

        // Only include future time slots
        return slotTime > now;
      });
    }

    // Return all time slots, regardless of availability
    // This is the key change - we no longer filter out fully booked slots
    return timeSlots;
  };

  const handleNewAppointmentForTimeSlot = (time: string) => {
    // Check if the time slot is in the past
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isToday = date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

    if (isToday) {
      // Parse the time slot
      const [timeStr, modifier] = time.split(' ');
      let hours = parseInt(timeStr.split(':')[0]);
      const minutes = parseInt(timeStr.split(':')[1]);

      // Convert to 24-hour format
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      // Create a date object for this time slot
      const slotTime = new Date(today);
      slotTime.setHours(hours, minutes, 0, 0);

      // If the slot is in the past, prevent creating an appointment
      if (slotTime <= now) {
        toast({
          title: "Time Slot Unavailable",
          description: "Cannot create appointments for times that have already passed. Please select a future time.",
          variant: "destructive"
        });
        return;
      }
    }

    // Check if the service will require multiple slots and if those slots are available
    if (appointmentService) {
      const requiredSlots = getSlotsOccupied(appointmentService);
      if (requiredSlots > 1) {
        // Check if all required slots are available
        const startIndex = timeSlots.indexOf(time);
        let hasConflict = false;
        const slotCounts = getBookedTimeSlots();
        const maxAllowed = isDental ? 2 : 1;

        for (let i = 0; i < requiredSlots; i++) {
          const slotIndex = startIndex + i;
          if (slotIndex >= timeSlots.length) {
            hasConflict = true;
            break;
          }

          const slot = timeSlots[slotIndex];
          if (slotCounts[slot] >= maxAllowed) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) {
          setWarningMessage(`This service requires ${requiredSlots} consecutive time slots (${requiredSlots * 15} minutes), and some slots are already fully booked. This may cause scheduling conflicts. Do you want to continue?`);
          setIsWarningDialogOpen(true);
          return; // Wait for user confirmation before proceeding
        }
      }
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

    // Reset filtered patients list - only show patients for current clinic
    const clinicPatients = patients.filter(p =>
      p.clinic === activeClinic || p.clinic === 'both'
    );
    setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));

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
    setAppointmentPatient(appointment.patient_name);
    setAppointmentService(appointment.service);
    setAppointmentTime(appointment.time);
    setAppointmentNotes(appointment.notes || "");

    // Parse and set the date
    if (appointment.date) {
      const parsedDate = new Date(appointment.date);
      setAppointmentDate(parsedDate);
    }

    // Set doctor/therapist field
    if (isDental && 'doctor' in appointment) {
      setAppointmentDoctor((appointment as DentalAppointment).doctor);
    } else if (!isDental && 'therapist' in appointment && appointment.therapist) {
      setAppointmentDoctor(appointment.therapist);
    }

    // Reset filtered patients list for the search - only show patients for current clinic
    const clinicPatients = patients.filter(p =>
      p.clinic === activeClinic || p.clinic === 'both'
    );
    setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));

    // Set the editing appointment object
    setEditingAppointment(appointment);

    // Open the dialog
    setIsEditAppointmentOpen(true);

    console.log('Edit form opened with values:', {
      patient: appointment.patient_name,
      service: appointment.service,
      time: appointment.time,
      date: appointment.date,
      doctor: isDental && 'doctor' in appointment ? appointment.doctor : 'N/A'
    });
  };

  const handleReschedule = (appointment: AppointmentType) => {
    setEditingAppointment(appointment);
    setAppointmentPatient(appointment.patient_name);
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
        patient: appointment.patient_name,
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

  const handleDirectCancel = async (appointment: AppointmentType) => {
    try {
      // Update the appointment status to cancelled in Supabase
      await updateAppointment(appointment.id, { status: 'cancelled' });

      toast({
        title: "Appointment Cancelled",
        description: `${appointment.patient_name}'s appointment has been cancelled.`
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openUpdateConfirmation = () => {
    if (editingAppointment) {
      setIsEditAppointmentOpen(false);
      setIsConfirmUpdateOpen(true);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (editingAppointment) {
      try {
        // Prepare the update data
        const updateData: Partial<Appointment> = {
          time: appointmentTime,
          service: appointmentService,
          date: appointmentDate ? format(appointmentDate, 'yyyy-MM-dd') : editingAppointment.date,
          notes: appointmentNotes
        };

        // Add doctor for dental appointments or therapist for meditouch
        if (isDental) {
          updateData.doctor = appointmentDoctor;
        } else {
          updateData.therapist = appointmentDoctor;
        }

        // Update the appointment in Supabase
        await updateAppointment(
          editingAppointment.id || editingAppointment.appointment_id,
          updateData
        );

        toast({
          title: "Appointment Rescheduled",
          description: `${editingAppointment.patient_name}'s appointment has been rescheduled to ${format(appointmentDate || new Date(), 'PP')} at ${appointmentTime}`
        });

        // Show WhatsApp confirmation popup
        const updatedDate = appointmentDate ? format(appointmentDate, 'yyyy-MM-dd') : editingAppointment.date;
        openWhatsAppConfirm({
          patientId: editingAppointment.patient_id,
          patientName: editingAppointment.patient_name || 'Patient',
          doctor: appointmentDoctor || editingAppointment.doctor || editingAppointment.therapist || '',
          date: updatedDate,
          time: appointmentTime,
          service: appointmentService,
          actionType: 'rescheduled',
        });

        setIsConfirmUpdateOpen(false);
        setEditingAppointment(null);
      } catch (error) {
        console.error('Error rescheduling appointment:', error);
        toast({
          title: "Error",
          description: "Failed to reschedule appointment. Please try again.",
          variant: "destructive"
        });
      }
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

  const handleCancelAppointment = async () => {
    if (editingAppointment) {
      try {
        // Update the appointment status to cancelled in Supabase
        await updateAppointment(
          editingAppointment.id || editingAppointment.appointment_id,
          { status: 'cancelled' }
        );

        toast({
          title: "Appointment Cancelled",
          description: `${editingAppointment.patient_name}'s appointment has been cancelled`
        });

        // Show WhatsApp confirmation popup
        openWhatsAppConfirm({
          patientId: editingAppointment.patient_id,
          patientName: editingAppointment.patient_name || 'Patient',
          doctor: editingAppointment.doctor || editingAppointment.therapist || '',
          date: editingAppointment.date,
          time: editingAppointment.time,
          service: editingAppointment.service,
          actionType: 'cancelled',
        });

        setIsConfirmCancelOpen(false);
        setEditingAppointment(null);
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        toast({
          title: "Error",
          description: "Failed to cancel appointment. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const cancelCancel = () => {
    setIsConfirmCancelOpen(false);
    setIsEditAppointmentOpen(true); // Go back to edit dialog
  };

  // Open WhatsApp confirmation popup
  const openWhatsAppConfirm = (data: {
    patientId: string;
    patientName: string;
    doctor: string;
    date: string;
    time: string;
    service: string;
    followUpService?: string;
    actionType: 'scheduled' | 'rescheduled' | 'cancelled';
  }) => {
    const patient = patients.find(p => p.id === data.patientId);
    // Only show WhatsApp popup if patient has WhatsApp enabled
    if (!patient?.has_whatsapp) return;
    const phone = patient?.phone || '';
    if (!phone) {
      console.warn('No phone number found for patient:', data.patientName);
      return;
    }
    setWhatsAppConfirmData({
      phone,
      patientName: data.patientName,
      doctor: data.doctor,
      date: data.date,
      time: data.time,
      service: data.service,
      followUpService: data.followUpService,
      actionType: data.actionType,
    });
    setIsWhatsAppConfirmOpen(true);
  };

  // Handle WhatsApp send
  const handleWhatsAppSend = async () => {
    if (!whatsAppConfirmData) return;
    const { phone, patientName, date, time, service, followUpService, actionType } = whatsAppConfirmData;
    // Close dialog immediately
    setIsWhatsAppConfirmOpen(false);
    setWhatsAppConfirmData(null);
    try {
      let result;
      switch (actionType) {
        case 'scheduled':
          result = await sendAppointmentScheduledMessage(phone, patientName, date, time, service, followUpService);
          break;
        case 'rescheduled':
          result = await sendAppointmentRescheduledMessage(phone, patientName, date, time, service);
          break;
        case 'cancelled':
          result = await sendAppointmentCancelledMessage(phone, patientName, date, service);
          break;
      }
      if (result?.success) {
        toast({ title: 'WhatsApp Message Sent', description: `Message sent to ${phone}` });
      } else {
        toast({ title: 'WhatsApp Failed', description: result?.error || 'Failed to send message', variant: 'destructive' });
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      toast({ title: 'Error', description: 'Failed to send WhatsApp message', variant: 'destructive' });
    }
  };

  // Handle warning dialog confirmation
  const handleWarningConfirm = () => {
    setIsWarningDialogOpen(false);

    // Check if we're in the appointment creation form or time slot click
    if (isNewAppointmentOpen) {
      // We're in the appointment creation form, proceed with creating the appointment
      // Store the pending appointment data and open confirmation dialog
      setPendingAppointment({
        patient_name: appointmentPatient,
        service: appointmentService,
        time: appointmentTime,
        date: appointmentDate,
        doctor: isDental ? appointmentDoctor : undefined,
        notes: appointmentNotes
      });

      // Close the new appointment form and open the confirmation dialog
      setIsNewAppointmentOpen(false);
      setIsConfirmCreateOpen(true);
    } else {
      // We're clicking on a time slot, open the new appointment form
      // Make sure we're not already editing and close any open new appointment dialog
      setIsNewAppointmentOpen(false);

      // Reset all form fields
      resetAppointmentForm();

      // Set only the time and date from the clicked slot
      // Note: appointmentTime is already set when the warning dialog was opened
      setAppointmentDate(date);

      // Debug log
      console.log('Setting appointment date from warning dialog:', format(date, 'yyyy-MM-dd'));

      // Reset filtered patients list - only show patients for current clinic
      const clinicPatients = patients.filter(p =>
        p.clinic === activeClinic || p.clinic === 'both'
      );
      setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));

      // Open the dialog
      setTimeout(() => {
        setIsNewAppointmentOpen(true);
        console.log('Opening new appointment form after warning confirmation');
      }, 50);
    }
  };

  // Handle warning dialog cancellation
  const handleWarningCancel = () => {
    setIsWarningDialogOpen(false);
  };

  // Function to handle doctor double-booking warning
  const handleDoctorDoubleBookingWarning = (doctorName: string, timeSlot: string) => {
    // Find the overlapping appointment in the other clinic
    const otherClinicType = isDental ? 'meditouch' : 'dental';
    const otherClinicAppointments = (isDental ? meditouchAppointments : dentalAppointments)
      .filter(app =>
        app.date === format(date, 'yyyy-MM-dd') &&
        app.status !== 'cancelled' &&
        app.status !== 'completed'
      );

    // Find the doctor's appointments in the other clinic
    const doctorAppointments = otherClinicAppointments.filter(app => {
      const appDoctorName = 'doctor' in app ? app.doctor :
                           ('therapist' in app && app.therapist) ? app.therapist : '';
      return appDoctorName === doctorName;
    });

    // Get the time slot index
    const timeSlotIndex = timeSlots.indexOf(timeSlot);

    // Calculate how many slots the new appointment would occupy
    const newAppointmentSlotsOccupied = appointmentService ? getSlotsOccupied(appointmentService) : 1;
    const newAppointmentEndIndex = timeSlotIndex + newAppointmentSlotsOccupied - 1;

    // Create arrays of all time slot indices that would be occupied by the new appointment
    const newAppointmentSlots = [];
    for (let i = 0; i < newAppointmentSlotsOccupied; i++) {
      newAppointmentSlots.push(timeSlotIndex + i);
    }

    // Log the time slots for debugging
    console.log(`Checking for doctor ${doctorName} at time slot ${timeSlot} (index ${timeSlotIndex})`);
    console.log(`New appointment would occupy slots:`, newAppointmentSlots.map(idx => timeSlots[idx]));

    // Find all overlapping appointments using the slot-based approach
    const overlappingAppointments = doctorAppointments.filter(app => {
      const appTimeSlotIndex = timeSlots.indexOf(app.time);

      // Calculate how many slots this appointment occupies
      // Use duration_minutes if available, otherwise look up service duration
      const slotsOccupied = app.duration_minutes
        ? Math.ceil(app.duration_minutes / 15)
        : getSlotsOccupiedForSpecificClinic(app.service, app.clinic_type); // Use service lookup as fallback

      // Create arrays of all time slot indices occupied by this appointment
      const existingAppSlots = [];
      for (let i = 0; i < slotsOccupied; i++) {
        existingAppSlots.push(appTimeSlotIndex + i);
      }

      // Log the existing appointment slots for debugging
      console.log(`Existing appointment at ${app.time} (${app.service}) occupies slots:`,
        existingAppSlots.map(idx => timeSlots[idx]));
      console.log(`Service: ${app.service}, Duration: ${app.duration_minutes || 15} minutes`);

      // Check if any slot in the new appointment is also in the existing appointment
      const hasOverlap = newAppointmentSlots.some(slot => existingAppSlots.includes(slot));
      if (hasOverlap) {
        console.log(`OVERLAP DETECTED with appointment at ${app.time}`);
      }
      return hasOverlap;
    });

    // If no overlapping appointments found, return
    if (overlappingAppointments.length === 0) {
      console.log(`No overlapping appointments found for doctor ${doctorName} at time ${timeSlot}`);
      return;
    }

    // Get the first overlapping appointment for the warning message
    const overlappingAppointment = overlappingAppointments[0];

    // Create a simple warning message without time details
    const warningMsg = `Doctor ${doctorName} is already booked in the ${isDental ? 'Meditouch' : 'Dental'} clinic for ${overlappingAppointment.service}. You can still proceed with booking, but be aware that the doctor will have appointments in both clinics at overlapping times.`;

    setWarningMessage(warningMsg);
    setIsWarningDialogOpen(true);
  };

  // Handle marking an appointment as completed
  const { markAppointmentCompleted: markAppointmentCompletedInHistory } = useDentalHistory();
  const { updateChartingEntryStatus } = useDentalCharting();
  const { supabase } = useSupabase();
  const [completedAppointment, setCompletedAppointment] = useState<AppointmentType | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  const handleCompleteAppointment = async (appointment: AppointmentType) => {
    try {
      console.log('=== HANDLING COMPLETE APPOINTMENT ===');
      console.log('Appointment:', appointment);

      // Update the appointment status to completed in Supabase
      await markAppointmentCompleted(appointment.id || appointment.appointment_id);
      console.log('Appointment marked as completed in Supabase');

      // Get patient ID from the patient_id field
      const patientId = appointment.patient_id;
      console.log('Patient ID:', patientId);

      // Add to dental history and generate follow-up if needed
      // For Meditouch appointments, use therapist field instead of doctor field
      const doctorOrTherapist = isDental
        ? (appointment as DentalAppointment).doctor || 'Unknown Doctor'
        : (appointment as MeditouchAppointment).therapist || 'Unknown Therapist';

      await markAppointmentCompletedInHistory(
        appointment.id || appointment.appointment_id,
        patientId,
        appointment.patient_name,
        appointment.service,
        doctorOrTherapist,
        appointment.date || format(new Date(), 'yyyy-MM-dd'),
        isDental ? 'dental' : 'meditouch', // Pass the clinic type
        appointment.follow_up_id // Pass the follow-up ID
      );
      console.log('Appointment added to dental history');

      // If this is a dental appointment and it's related to a planned treatment, update the charting entry
      if (isDental && appointment.charting_entry_id) {
        console.log('This is a dental appointment with charting entry ID:', appointment.charting_entry_id);

        try {
          // First try to directly update the charting entry status using the context function
          console.log('Directly updating charting entry status...');
          await updateChartingEntryStatus(appointment.charting_entry_id, 'Completed');
          console.log('Successfully updated charting entry status directly');

          // Also update any pending_treatments entries
          try {
            console.log('Updating pending_treatments entries...');
            const { data, error } = await supabase
              .from('pending_treatments')
              .update({ status: 'completed' })
              .eq('charting_entry_id', appointment.charting_entry_id)
              .select();

            if (error) {
              console.error('Error updating pending_treatments:', error);
            } else {
              console.log('Successfully updated pending_treatments:', data);
            }
          } catch (pendingError) {
            console.error('Error updating pending_treatments:', pendingError);
          }
        } catch (chartingError) {
          console.error('Error directly updating charting entry status:', chartingError);

          // Try a direct database update as a second fallback
          try {
            console.log('Trying direct database update...');

            // First try to find the entry by entry_id
            const { data: entriesByEntryId, error: entryIdError } = await supabase
              .from('dental_charting')
              .select('*')
              .eq('entry_id', appointment.charting_entry_id);

            if (entryIdError) {
              console.error('Error fetching by entry_id:', entryIdError);
              throw entryIdError;
            }

            if (entriesByEntryId && entriesByEntryId.length > 0) {
              // Found by entry_id, update it
              const entry = entriesByEntryId[0];
              console.log('Found entry by entry_id:', entry);

              const { error: updateError } = await supabase
                .from('dental_charting')
                .update({ status: 'Completed' })
                .eq('id', entry.id);

              if (updateError) {
                console.error('Error updating entry:', updateError);
                throw updateError;
              }

              console.log('Successfully updated entry directly in database');

              // Also update any pending_treatments entries
              try {
                console.log('Updating pending_treatments entries...');
                const { data, error } = await supabase
                  .from('pending_treatments')
                  .update({ status: 'completed' })
                  .eq('charting_entry_id', appointment.charting_entry_id)
                  .select();

                if (error) {
                  console.error('Error updating pending_treatments:', error);
                } else {
                  console.log('Successfully updated pending_treatments:', data);
                }
              } catch (pendingError) {
                console.error('Error updating pending_treatments:', pendingError);
              }
            } else {
              // Try to find by id as a fallback
              const { data: entriesById, error: idError } = await supabase
                .from('dental_charting')
                .select('*')
                .eq('id', appointment.charting_entry_id);

              if (idError) {
                console.error('Error fetching by id:', idError);
                throw idError;
              }

              if (entriesById && entriesById.length > 0) {
                // Found by id, update it
                const entry = entriesById[0];
                console.log('Found entry by id:', entry);

                const { error: updateError } = await supabase
                  .from('dental_charting')
                  .update({ status: 'Completed' })
                  .eq('id', entry.id);

                if (updateError) {
                  console.error('Error updating entry:', updateError);
                  throw updateError;
                }

                console.log('Successfully updated entry directly in database');

                // Also update any pending_treatments entries
                try {
                  console.log('Updating pending_treatments entries...');
                  const { data, error } = await supabase
                    .from('pending_treatments')
                    .update({ status: 'completed' })
                    .eq('charting_entry_id', appointment.charting_entry_id)
                    .select();

                  if (error) {
                    console.error('Error updating pending_treatments:', error);
                  } else {
                    console.log('Successfully updated pending_treatments:', data);
                  }
                } catch (pendingError) {
                  console.error('Error updating pending_treatments:', pendingError);
                }
              } else {
                throw new Error('Entry not found by either entry_id or id');
              }
            }
          } catch (dbError) {
            console.error('Error with direct database update:', dbError);

            // Fall back to using the event system as a last resort
            console.log('Falling back to event system...');

            // Create a custom event to update the charting entry status to Completed
            const event = new CustomEvent('updateChartingEntryStatus', {
              detail: {
                entryId: appointment.charting_entry_id,
                appointmentId: appointment.id || appointment.appointment_id,
                status: 'Completed'
              }
            });

            console.log('Dispatching updateChartingEntryStatus event with details:', {
              entryId: appointment.charting_entry_id,
              appointmentId: appointment.id || appointment.appointment_id,
              status: 'Completed'
            });

            document.dispatchEvent(event);
            console.log('Event dispatched');

            // Also update any pending_treatments entries
            try {
              console.log('Updating pending_treatments entries...');
              const { data, error } = await supabase
                .from('pending_treatments')
                .update({ status: 'completed' })
                .eq('charting_entry_id', appointment.charting_entry_id)
                .select();

              if (error) {
                console.error('Error updating pending_treatments:', error);
              } else {
                console.log('Successfully updated pending_treatments:', data);
              }
            } catch (pendingError) {
              console.error('Error updating pending_treatments:', pendingError);
            }
          }
        }

        // Show additional toast notification
        toast({
          title: "Treatment Completed",
          description: "The planned treatment has been marked as completed and will be removed from the pending treatments list."
        });
      } else {
        console.log('This is not a dental appointment or does not have a charting entry ID');
      }

      // Prepare the appointment data for the completion dialog
      const appointmentWithPatientId = {
        ...appointment,
        patientId,
        paymentStatus: 'unpaid' as const
      };

      // Show the completion dialog instead of a toast notification
      console.log("Setting completed appointment:", appointmentWithPatientId);
      setCompletedAppointment(appointmentWithPatientId);
      setIsCompletionDialogOpen(true);
      console.log("Dialog should be open now");
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Error",
        description: "Failed to mark appointment as completed. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (appointmentId: string, status: 'paid' | 'unpaid') => {
    try {
      // Get the current appointment details for audit logging
      const currentAppointment = appointments.find(apt => apt.id === appointmentId || apt.appointment_id === appointmentId);
      const oldStatus = currentAppointment?.payment_status || 'unpaid';

      // Update the appointment payment status in Supabase
      await updateAppointment(appointmentId, { payment_status: status });

      // Also update the payment status in dental history if this appointment has a corresponding history entry
      try {
        // First, find the dental history entry for this appointment
        const historyEntries = await supabase.from<{id: string, appointment_id: string, payment_status: string}>('dental_history').getAll({
          filters: { appointment_id: appointmentId }
        });

        if (historyEntries && historyEntries.length > 0) {
          // Update each matching history entry (should typically be just one)
          for (const entry of historyEntries) {
            await supabase.from<{id: string, payment_status: string}>('dental_history').update(entry.id, { payment_status: status });
            console.log(`Updated payment status in dental history for appointment ${appointmentId}, entry ${entry.id}`);
          }
        } else {
          console.log(`No dental history entry found for appointment ${appointmentId}`);
        }
      } catch (historyUpdateError) {
        console.warn('Error updating dental history payment status:', historyUpdateError);
        // Don't fail the whole operation if dental history update fails
      }

      // If the completed appointment is currently displayed, update it
      if (completedAppointment && (completedAppointment.id === appointmentId || completedAppointment.appointment_id === appointmentId)) {
        setCompletedAppointment({
          ...completedAppointment,
          paymentStatus: status
        });
      }

      // Note: Audit logging is now handled automatically in the updateAppointment function

      // Dispatch custom event to notify other components about the payment status update
      const paymentUpdateEvent = new CustomEvent('payment-status-updated', {
        detail: {
          appointmentId,
          patientId: completedAppointment?.patientId,
          status
        }
      });
      document.dispatchEvent(paymentUpdateEvent);

      toast({
        title: `Payment Status: ${status === 'paid' ? 'Paid' : 'Unpaid'}`,
        description: `The appointment payment status has been updated to ${status}.`
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePatientSearch = (value: string) => {
    // First filter patients by clinic type
    const clinicPatients = patients.filter(p =>
      p.clinic === activeClinic || p.clinic === 'both'
    );

    // If value is empty or undefined, show all patients for this clinic
    if (!value || value.trim() === '') {
      setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));
      return;
    }

    // Convert to lowercase for case-insensitive search
    const searchTerm = value.toLowerCase().trim();

    // Filter patients whose name contains the search term and match clinic type
    const filtered = clinicPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm)
    );

    console.log(`Found ${filtered.length} patients matching "${searchTerm}" for clinic ${activeClinic}`);
    setFilteredPatients(filtered.map(p => ({ id: p.id, name: p.name })));
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

    // Prevent creating appointments with past dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (appointmentDate < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot create appointments for past dates. Please select a current or future date.",
        variant: "destructive"
      });
      return;
    }

    // If the appointment is for today, check if the time has already passed
    if (appointmentDate.getFullYear() === today.getFullYear() &&
        appointmentDate.getMonth() === today.getMonth() &&
        appointmentDate.getDate() === today.getDate()) {

      // Parse the appointment time
      const [time, modifier] = appointmentTime.split(' ');
      let hours = parseInt(time.split(':')[0]);
      const minutes = parseInt(time.split(':')[1]);

      // Convert to 24-hour format
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      // Create a date object for this time slot
      const appointmentDateTime = new Date(today);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // Check if the appointment time has already passed
      if (appointmentDateTime < now) {
        toast({
          title: "Invalid Time",
          description: "Cannot create appointments for times that have already passed. Please select a future time.",
          variant: "destructive"
        });
        return;
      }
    }

    // Use the chartingEntryId from state if it exists
    const chartingEntryId = pendingChartingEntryId;

    // Get the number of slots this service requires
    const requiredSlots = getSlotsOccupied(appointmentService);

    // Get all active appointments for the current date
    const formattedDate = format(appointmentDate, 'yyyy-MM-dd');
    const dateAppointments = appointments.filter(app =>
      app.date === formattedDate &&
      app.status !== 'cancelled' &&
      app.status !== 'completed'
    );

    // Create a map of slot availability
    const slotAvailability: Record<string, number> = {};

    // Initialize all slots with max capacity
    timeSlots.forEach(slot => {
      slotAvailability[slot] = isDental ? 2 : 1; // Dental allows 2 per slot, Meditouch only 1
    });

    // For each appointment, reduce availability of all slots it occupies
    dateAppointments.forEach(app => {
      const startSlot = app.time;
      const slotsOccupied = getSlotsOccupied(app.service);

      // Find the starting index of this appointment
      const startIndex = timeSlots.indexOf(startSlot);
      if (startIndex === -1) return;

      // Reduce availability for each slot this appointment occupies
      for (let i = 0; i < slotsOccupied; i++) {
        const slotIndex = startIndex + i;
        if (slotIndex < timeSlots.length) {
          const slot = timeSlots[slotIndex];
          slotAvailability[slot] = Math.max(0, (slotAvailability[slot] || 0) - 1);
        }
      }
    });

    // Check if all required slots are available
    const startIndex = timeSlots.indexOf(appointmentTime);
    let hasConflict = false;

    for (let i = 0; i < requiredSlots; i++) {
      const slotIndex = startIndex + i;
      if (slotIndex >= timeSlots.length) {
        hasConflict = true;
        break;
      }

      const slot = timeSlots[slotIndex];
      if (slotAvailability[slot] <= 0) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      // Show warning dialog instead of toast
      setWarningMessage(`This service requires ${requiredSlots} consecutive time slots (${requiredSlots * 15} minutes), and some slots are already fully booked. This may cause scheduling conflicts. Do you want to continue?`);
      setIsWarningDialogOpen(true);
      return; // Wait for user confirmation before proceeding
    }

    // Get the service duration
    const serviceDuration = getSlotsOccupied(appointmentService) * 15;

    // Store the pending appointment data and open confirmation dialog
    setPendingAppointment({
      patient_name: appointmentPatient,
      service: appointmentService,
      time: appointmentTime,
      date: appointmentDate,
      doctor: isDental ? appointmentDoctor : undefined,
      notes: appointmentNotes,
      duration_minutes: serviceDuration // Add the duration in minutes
    });

    // Close the new appointment form and open the confirmation dialog
    setIsNewAppointmentOpen(false);
    setIsConfirmCreateOpen(true);
  };

  // Function to actually create the appointment after confirmation
  const confirmCreateAppointment = async () => {
    // ...
    if (!pendingAppointment || !pendingAppointment.date) return;

    // Double-check to prevent creating appointments with past dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (pendingAppointment.date < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot create appointments for past dates. Please select a current or future date.",
        variant: "destructive"
      });
      setIsConfirmCreateOpen(false);
      setIsNewAppointmentOpen(true);
      return;
    }

    // If the appointment is for today, check if the time has already passed
    if (pendingAppointment.date.getFullYear() === today.getFullYear() &&
        pendingAppointment.date.getMonth() === today.getMonth() &&
        pendingAppointment.date.getDate() === today.getDate()) {

      // Parse the appointment time
      const [time, modifier] = pendingAppointment.time.split(' ');
      let hours = parseInt(time.split(':')[0]);
      const minutes = parseInt(time.split(':')[1]);

      // Convert to 24-hour format
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      // Create a date object for this time slot
      const appointmentDateTime = new Date(today);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // Check if the appointment time has already passed
      if (appointmentDateTime < now) {
        toast({
          title: "Invalid Time",
          description: "Cannot create appointments for times that have already passed. Please select a future time.",
          variant: "destructive"
        });
        setIsConfirmCreateOpen(false);
        setIsNewAppointmentOpen(true);
        return;
      }
    }

    // Debug logs
    console.log('Creating confirmed appointment:', pendingAppointment);

    const formattedDate = format(pendingAppointment.date, 'yyyy-MM-dd');

    // Find the patient ID from the patient name
    const patient = patients.find(p => p.name === (pendingAppointment.patient_name || pendingAppointment.patient));
    const patientId = patient?.id || '';

    if (!patientId) {
      console.error('Patient ID not found for name:', pendingAppointment.patient_name);
      toast({
        title: 'Error',
        description: 'Patient not found in database. Please select a valid patient.',
        variant: 'destructive',
      });
      return;
    }

    // Find the doctor ID if in dental mode
    let doctorId = '';
    if (isDental && pendingAppointment.doctor) {
      const doctor = doctors.find(d => d.name === pendingAppointment.doctor);
      doctorId = doctor?.id || '';
    }

    try {
      setIsLoading(true);

      if (isDental) {
        const newAppointment = {
          time: pendingAppointment.time,
          patient_name: pendingAppointment.patient_name || pendingAppointment.patient || '',
          patient_id: patientId,
          service: pendingAppointment.service || 'Dental Checkup',
          doctor: pendingAppointment.doctor || 'Dr. Khanna',
          doctor_id: doctorId,
          date: formattedDate,
          status: 'confirmed' as const,
          payment_status: 'unpaid' as const,
          clinic_type: 'dental' as const,
          // If this appointment is for a planned treatment, link it to the charting entry
          charting_entry_id: pendingChartingEntryId,
          // If this appointment is for a follow-up, link it to the follow-up entry
          follow_up_id: pendingFollowUpId,
          notes: pendingAppointment.notes || '',
          duration_minutes: pendingAppointment.duration_minutes // Include the calculated duration
        };

        // Log the appointment we're creating
        console.log('Creating dental appointment with charting entry ID:', pendingChartingEntryId);
        console.log('Creating dental appointment:', JSON.stringify(newAppointment, null, 2));
        await addAppointment(newAppointment);

        toast({
          title: 'Success',
          description: 'Dental appointment scheduled successfully.',
        });
      } else {
        const newAppointment = {
          time: pendingAppointment.time,
          patient_name: pendingAppointment.patient_name || pendingAppointment.patient || '',
          patient_id: patientId,
          service: pendingAppointment.service || 'General Consultation',
          date: formattedDate,
          status: 'confirmed' as const,
          payment_status: 'unpaid' as const,
          clinic_type: 'meditouch' as const,
          therapist: appointmentDoctor || pendingAppointment.doctor || '', // Use doctor field for therapist
          // If this appointment is for a follow-up, link it to the follow-up entry
          follow_up_id: pendingFollowUpId,
          notes: pendingAppointment.notes || '',
          duration_minutes: pendingAppointment.duration_minutes // Include the calculated duration
        };
        console.log('Creating meditouch appointment:', JSON.stringify(newAppointment, null, 2));
        await addAppointment(newAppointment);

        toast({
          title: 'Success',
          description: 'Meditouch appointment scheduled successfully.',
        });
      }

      // Get the service duration
      const requiredSlots = getSlotsOccupied(pendingAppointment.service);
      const durationMinutes = requiredSlots * 15;

      // Show success toast with duration info
      toast({
        title: "Appointment Created",
        description: `New appointment for ${pendingAppointment.patient_name || pendingAppointment.patient} on ${format(pendingAppointment.date, 'PP')} at ${pendingAppointment.time}${
          requiredSlots > 1 ? ` (${durationMinutes} minutes)` : ''
        }`
      });

      // If this appointment is for a planned treatment, update the charting entry
      if (isDental && pendingChartingEntryId) {
        // Create a custom event to update the charting entry
        const event = new CustomEvent('updateChartingEntryStatus', {
          detail: {
            entryId: pendingChartingEntryId,
            appointmentId: uuidv4(), // Generate a new UUID since we don't have newId anymore
            status: 'Scheduled'
          }
        });
        document.dispatchEvent(event);

        // Show additional toast notification
        toast({
          title: "Planned Treatment Scheduled",
          description: "The planned treatment has been linked to this appointment."
        });
      }

      // Show WhatsApp confirmation popup
      openWhatsAppConfirm({
        patientId: patientId,
        patientName: pendingAppointment.patient_name || pendingAppointment.patient || 'Patient',
        doctor: pendingAppointment.doctor || appointmentDoctor || '',
        date: formattedDate,
        time: pendingAppointment.time,
        service: pendingAppointment.service,
        followUpService: appointmentFollowUpService || undefined,
        actionType: 'scheduled',
      });

      // Close the confirmation dialog and reset form
      setIsConfirmCreateOpen(false);
      setPendingAppointment(null);
      setPendingChartingEntryId(undefined);
      setPendingFollowUpId(undefined);
      resetAppointmentForm();

      // Update the UI date to match the appointment date
      setDate(pendingAppointment.date);
    } catch (error) {
      console.error('Error creating appointment:', error);
      const isDuplicate = error instanceof Error && error.message.includes('already scheduled');
      if (!isDuplicate) {
        toast({
          title: 'Error',
          description: 'Failed to schedule appointment. An appointment with the same details already exists.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }

    // Toast is already shown in the try block

    // Everything is already handled in the try block
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
    setAppointmentNotes("");
    setAppointmentDate(undefined);
    setPendingChartingEntryId(undefined);
    setPendingFollowUpId(undefined);
    setAppointmentFollowUpService("");
  }, []);

  const goToNewAppointment = () => {
    navigate('/appointments/new');
  };

  // Function to open the add patient dialog
  const openAddPatientDialog = () => {
    setIsAddPatientDialogOpen(true);
  };

  // Handle newly added patient
  const handlePatientAdded = (newPatient: { id: string; name: string }) => {
    // Select the newly added patient
    setAppointmentPatient(newPatient.name);

    // Update filtered patients list
    setFilteredPatients(prev => [
      { id: newPatient.id, name: newPatient.name },
      ...prev
    ]);
  };

  // Listen for the custom event to open the new appointment form
  useEffect(() => {
    const handleOpenNewAppointmentForm = () => {
      // Reset all form fields
      resetAppointmentForm();

      // Set the date to the current UI date
      setAppointmentDate(date);

      // Reset filtered patients list - only show patients for current clinic
      const clinicPatients = patients.filter(p =>
        p.clinic === activeClinic || p.clinic === 'both'
      );
      setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));

      // Open the dialog
      setIsNewAppointmentOpen(true);
    };

    // Add event listener
    window.addEventListener('openNewAppointmentForm', handleOpenNewAppointmentForm);

    // Clean up
    return () => {
      window.removeEventListener('openNewAppointmentForm', handleOpenNewAppointmentForm);
    };
  }, [date, resetAppointmentForm, patients, activeClinic]);

  // Removed the URL update effect to prevent circular dependency

  // Check for pending treatments in Supabase when the component mounts
  useEffect(() => {
    const checkPendingTreatments = async () => {
      try {
        // Get the current user
        const { user } = JSON.parse(localStorage.getItem('mudraUser') || '{}');

        if (user?.id) {
          // Check for pending treatments in Supabase
          const { data: pendingTreatments } = await supabase
            .from('pending_treatments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .limit(1);

          if (pendingTreatments && pendingTreatments.length > 0) {
            const pendingTreatment = pendingTreatments[0];

            // Set the view to daily
            setView('daily');

            // Create a custom event with the pending treatment data
            const event = new CustomEvent('openNewAppointmentFormWithData', {
              detail: {
                patientName: pendingTreatment.patient_name,
                patientId: pendingTreatment.patient_id,
                serviceName: pendingTreatment.service_name,
                doctorName: pendingTreatment.doctor_name,
                chartingEntryId: pendingTreatment.charting_entry_id,
                teeth: pendingTreatment.teeth,
                notes: pendingTreatment.notes
              }
            });

            // Dispatch the event to open the appointment form
            document.dispatchEvent(event);

            // Mark the pending treatment as processed
            await supabase
              .from('pending_treatments')
              .update({ status: 'processed' })
              .eq('id', pendingTreatment.id);
          }
        }
      } catch (error) {
        console.error('Error checking pending treatments:', error);
      }
    };

    // Also check sessionStorage for backward compatibility
    const pendingTreatmentJson = sessionStorage.getItem('pendingTreatment');
    if (pendingTreatmentJson) {
      try {
        // Parse the pending treatment data
        const pendingTreatment = JSON.parse(pendingTreatmentJson);

        // Set the view to daily
        setView('daily');

        // Create a custom event with the pending treatment data
        const event = new CustomEvent('openNewAppointmentFormWithData', {
          detail: pendingTreatment
        });

        // Dispatch the event to open the appointment form
        document.dispatchEvent(event);

        // Remove the pending treatment from sessionStorage
        sessionStorage.removeItem('pendingTreatment');
      } catch (error) {
        console.error('Error parsing pending treatment data:', error);
      }
    } else {
      // If no pending treatment in sessionStorage, check Supabase
      checkPendingTreatments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Listen for the custom event to open the new appointment form with pre-filled data
  useEffect(() => {
    console.log('🎯 Setting up event listener for openNewAppointmentFormWithData');

    const handleOpenNewAppointmentFormWithData = (event: Event) => {
      console.log('🎯 Event received!', event);

      const customEvent = event as CustomEvent<{
        patientName: string;
        patientId: string;
        serviceName: string;
        suggestedServiceName?: string;
        doctorName?: string;
        date?: string;
        followUpId?: string;
        chartingEntryId?: string;
        teeth?: string;
        notes?: string;
      }>;

      // Get the data from the event
      const { patientName, patientId, serviceName, suggestedServiceName, doctorName, date, followUpId, chartingEntryId, teeth, notes } = customEvent.detail;

      console.log('🎯 Received openNewAppointmentFormWithData event with data:', customEvent.detail);

      // Reset form first
      resetAppointmentForm();

      // Set the form fields with the data from the event
      setAppointmentPatient(patientName);
      setAppointmentService(serviceName);

      // Set the follow-up service name if provided (only for recall list appointments)
      if (suggestedServiceName) {
        setAppointmentFollowUpService(suggestedServiceName);
      }

      // Set the doctor if provided
      if (doctorName) {
        setAppointmentDoctor(doctorName);
      }

      // Set notes if provided
      if (notes) {
        setAppointmentNotes(notes);
      }

      // Store the chartingEntryId if provided
      if (chartingEntryId) {
        console.log('Setting pending charting entry ID:', chartingEntryId);
        setPendingChartingEntryId(chartingEntryId);
      }

      // Store the followUpId if provided
      if (followUpId) {
        console.log('Setting pending follow-up ID:', followUpId);
        setPendingFollowUpId(followUpId);
      }

      // Parse the date if provided
      if (date) {
        const parsedDate = parseISO(date);
        setAppointmentDate(parsedDate);
        setDate(parsedDate); // Also update the UI date
      } else {
        // If no date provided, use current UI date
        setAppointmentDate(new Date());
      }

      // Reset filtered patients list
      setFilteredPatients(patients.map(p => ({ id: p.id, name: p.name })));

      // Show appropriate toast notification
      if (chartingEntryId) {
        toast({
          title: "Planned Treatment Appointment",
          description: `Creating appointment for ${patientName} based on planned treatment.`,
        });
      } else if (followUpId) {
        toast({
          title: "Follow-up Appointment",
          description: `Creating appointment for ${patientName} based on a follow-up reminder.`,
        });
      } else {
        toast({
          title: "New Appointment",
          description: `Creating appointment for ${patientName}.`,
        });
      }

      // Open the dialog
      setIsNewAppointmentOpen(true);
    };

    // Add event listener
    window.addEventListener('openNewAppointmentFormWithData', handleOpenNewAppointmentFormWithData);

    // Clean up
    return () => {
      window.removeEventListener('openNewAppointmentFormWithData', handleOpenNewAppointmentFormWithData);
    };
  }, [resetAppointmentForm, patients]);

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

      {/* Alert for unresolved past appointments - only shown on appointments page */}
      <UnresolvedAppointmentsAlert />

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex justify-center items-center mb-4">
                <Tabs
                  value={view}
                  onValueChange={(newView) => {
                    resetExpandedStates();
                    setView(newView);
                    // Update URL when tab changes
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set('view', newView);
                      return newParams;
                    }, { replace: true });
                  }}
                  className="w-full">
                  <TabsList className="mx-auto">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    {isDental && <TabsTrigger value="pending">Pending Treatments</TabsTrigger>}
                    {isDental && (
                      <div className="ml-4 px-2 py-1 text-sm">
                        <AppointmentList />
                      </div>
                    )}
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
                        <div className={`absolute left-0 top-0 bottom-0 w-16 border-r flex flex-col ${isMobile ? 'hidden' : ''}`}>
                          <div className="h-16 border-b"></div>
                          {Object.keys(hourlyTimeSlots).map(hour => (
                            <div key={hour} className="h-16 border-b flex items-start justify-end pr-2 text-xs text-gray-500 font-medium">
                              {hour}
                            </div>
                          ))}
                        </div>

                        <div className={`${isMobile ? 'ml-0' : 'ml-16'} overflow-y-auto`}>
                          <div className="h-16 border-b flex items-center px-2 font-medium">
                            {format(date, 'EEEE, MMMM d, yyyy')}
                          </div>

                          {isMobile ? (
                            // Mobile: Flexible hour rows with vertically stacked slots
                            <div>
                              {Object.entries(hourlyTimeSlots).map(([hour, slots]) => (
                                <div key={hour} className="flex border-b border-gray-200 py-3">
                                  {/* Hour label on the left */}
                                  <div className="w-16 flex-shrink-0 flex items-start justify-end pr-3 pt-1">
                                    <span className="text-sm font-bold text-gray-800">{hour}</span>
                                  </div>
                                  
                                  {/* Slots area on the right - vertically stacked */}
                                  <div className="flex-1 space-y-2 max-w-[calc(100vw-6rem)] overflow-hidden">
                                    {slots.map(slot => {
                                      const appointments = getAppointmentsForTimeSlot(slot);
                                      const slotCounts = getBookedTimeSlots();
                                      const currentCount = slotCounts[slot] || 0;
                                      const maxAllowed = isDental ? 2 : 1;
                                      const isFullyBooked = currentCount >= maxAllowed;

                                      return (
                                        <div
                                          key={slot}
                                          className={`p-2 border rounded min-h-[80px] ${
                                            appointments.length === 0
                                              ? isFullyBooked
                                                ? 'border-dashed border-orange-200 bg-orange-50'
                                                : 'border-dashed border-gray-200'
                                              : 'border-solid border-blue-200 bg-blue-50'
                                          }`}
                                          onClick={() => {
                                            // Only allow new appointment creation if slot is empty
                                            if (appointments.length === 0) {
                                              const slotCounts = getBookedTimeSlots();
                                              const currentCount = slotCounts[slot] || 0;
                                              const maxAllowed = isDental ? 2 : 1;
                                              const isFullyBooked = currentCount >= maxAllowed;

                                              setAppointmentTime(slot);

                                              if (isFullyBooked) {
                                                setWarningMessage(`This time slot already has ${currentCount} appointment(s). Adding more may cause scheduling conflicts. Do you want to continue?`);
                                                setIsWarningDialogOpen(true);
                                                return;
                                              }

                                              if (selectedDoctor && selectedDoctor !== 'all') {
                                                const serviceToCheck = appointmentService || (services && services.length > 0 ? services[0].name : '');
                                                
                                                if (isDoctorBookedInOtherClinic(selectedDoctor, slot, serviceToCheck)) {
                                                  setWarningMessage(`Dr. ${selectedDoctor} is already booked in the ${isDental ? 'Meditouch' : 'Dental'} clinic at ${slot}. This may cause scheduling conflicts. Do you want to continue?`);
                                                  setIsWarningDialogOpen(true);
                                                  return;
                                                }
                                              }

                                              handleNewAppointmentForTimeSlot(slot);
                                            }
                                          }}
                                        >
                                          {/* Time slot header */}
                                          <div className="font-medium text-gray-700 text-sm mb-2">{slot}</div>
                                          
                                          {/* Show appointments like desktop */}
                                          {appointments.length === 0 ? (
                                            <div className="text-center text-gray-400 text-xs py-2 cursor-pointer hover:bg-gray-50">
                                              {isFullyBooked ? 'Full' : 'Available'}
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                              {appointments.map(appointment => {
                                                const isFirstSlot = appointment.time === slot;
                                                const slotsOccupied = getSlotsOccupied(appointment.service);
                                                return (
                                                  <div key={appointment.id} className="max-w-full">
                                                    <div className="max-w-full overflow-hidden">
                                                      <TimeSlotAppointment
                                                      appointment={appointment}
                                                      isDental={isDental}
                                                      isCompact={true}
                                                      isMultiSlot={slotsOccupied > 1}
                                                      isFirstSlot={isFirstSlot}
                                                      slotsOccupied={slotsOccupied}
                                                      doctorsList={doctors}
                                                      onClick={() => {
                                                        handleEditAppointment(appointment);
                                                      }}
                                                    />
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Desktop: Original hourly grid layout
                            Object.entries(hourlyTimeSlots).map(([hour, slots]) => (
                            <div key={hour} className="h-16 border-b relative">
                              <div className="absolute inset-0 grid grid-cols-4 divide-x">
                                {slots.map(slot => {
                                  const appointments = getAppointmentsForTimeSlot(slot);
                                  // Get the booking status for this slot
                                  const slotCounts = getBookedTimeSlots();
                                  const currentCount = slotCounts[slot] || 0;
                                  const maxAllowed = isDental ? 2 : 1;
                                  const isFullyBooked = currentCount >= maxAllowed;

                                  return (
                                    <div
                                      key={slot}
                                      className={`p-1 cursor-pointer hover:bg-gray-50 h-full ${
                                        appointments.length === 0
                                          ? isFullyBooked
                                            ? 'border-dashed border-orange-200 border bg-orange-50'
                                            : 'border-dashed border-gray-200 border'
                                          : ''
                                      }`}
                                      onClick={() => {
                                        // Check if the slot is fully booked
                                        const slotCounts = getBookedTimeSlots();
                                        const currentCount = slotCounts[slot] || 0;
                                        const maxAllowed = isDental ? 2 : 1;
                                        const isFullyBooked = currentCount >= maxAllowed;

                                        // Set the appointment time
                                        setAppointmentTime(slot);

                                        // If fully booked, show warning dialog
                                        if (isFullyBooked) {
                                          setWarningMessage(`This time slot already has ${currentCount} appointment(s). Adding more may cause scheduling conflicts. Do you want to continue?`);
                                          setIsWarningDialogOpen(true);
                                          return;
                                        }

                                        // If a doctor is already selected, check if they're double-booked in the other clinic
                                        if (selectedDoctor && selectedDoctor !== 'all') {
                                          // Get the service that would be selected (use default service if none selected)
                                          const defaultService = isDental ? 'Dental Checkup' : 'General Consultation';
                                          const serviceToCheck = appointmentService || defaultService;

                                          if (isDoctorBookedInOtherClinic(selectedDoctor, slot, serviceToCheck)) {
                                            handleDoctorDoubleBookingWarning(selectedDoctor, slot);
                                            return;
                                          }
                                        }

                                        // Otherwise, proceed with normal flow
                                        handleNewAppointmentForTimeSlot(slot);
                                      }}
                                    >
                                      {appointments.length === 0 ? (
                                        <div className="h-full w-full flex items-center justify-center">
                                          <div className={`text-xs ${isFullyBooked ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                                            {slot}
                                            {isFullyBooked && (
                                              <span className="ml-1 text-[8px] bg-orange-100 text-orange-700 px-1 rounded">
                                                Full
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="h-full">
                                          <div className="flex flex-row gap-1 h-full">
                                            {appointments.map(appointment => {
                                              // Check if this is the first slot of a multi-slot appointment
                                              const isFirstSlot = appointment.time === slot;
                                              // Get the number of slots this appointment occupies
                                              const slotsOccupied = getSlotsOccupied(appointment.service);
                                              // Only show appointments that start in this slot or are extended from previous slots
                                              return (
                                                <div key={appointment.id} className="flex-1 min-w-0">
                                                  <TimeSlotAppointment
                                                    appointment={appointment}
                                                    isDental={isDental}
                                                    isCompact={appointments.length > 1}
                                                    isMultiSlot={slotsOccupied > 1}
                                                    isFirstSlot={isFirstSlot}
                                                    slotsOccupied={slotsOccupied}
                                                    doctorsList={doctors}
                                                    onClick={() => {
                                                      handleEditAppointment(appointment);
                                                    }}
                                                  />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                          )}
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
                    <div className="grid grid-cols-7 gap-1 h-[700px]">
                      {weekDates.map((day, idx) => {
                        const dayAppointments = getAppointmentsForDate(day);
                        const isCurrentDay = isToday(day);

                        // State for expanded view (using local variable since this is inside a map function)
                        const isExpanded = expandedDay === format(day, 'yyyy-MM-dd');

                        // Determine how many appointments to show initially - based on space analysis
                        const initialAppointmentsToShow = 30; // Show up to 30 appointments by default
                        const hasMoreAppointments = dayAppointments.length > initialAppointmentsToShow;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "border rounded-lg h-full p-1 relative overflow-hidden flex flex-col",
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
                            <div className="flex items-center justify-between mb-1 sticky top-0 bg-white z-10 flex-shrink-0">
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
                              isExpanded ? "max-h-[500px]" : "max-h-[500px]", // Make container taller to show more appointments
                              "h-[calc(100%-30px)]" // Subtract header height to ensure proper scrolling
                            )}>
                              {/* Show all appointments if expanded, otherwise show limited number */}
                              {(isExpanded ? dayAppointments : dayAppointments.slice(0, initialAppointmentsToShow)).map(appointment => (
                                <CalendarAppointmentItem
                                  key={appointment.id}
                                  appointment={appointment}
                                  isDental={isDental}
                                  isCompact={dayAppointments.length > 1} // Use compact view if multiple appointments
                                  onClick={() => handleEditAppointment(appointment)}
                                  doctorsList={doctors}
                                  getServiceDuration={getServiceDuration}
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
                              "border rounded-lg min-h-[100px] p-1 relative overflow-hidden flex flex-col",
                              isCurrentDay && "border-primary bg-primary/5",
                              expandedMonthDay === format(day, 'yyyy-MM-dd') && "max-h-[350px] z-10 shadow-lg bg-white",
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
                            <div className="flex items-center justify-between mb-1 sticky top-0 bg-white z-10 flex-shrink-0">
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
                              "space-y-0.5 mt-1 overflow-y-auto pr-1 flex-grow",
                              expandedMonthDay === format(day, 'yyyy-MM-dd') ? "max-h-[300px]" : "max-h-[70px]",
                              "h-[calc(100%-30px)]" // Subtract header height to ensure proper scrolling
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
                                  doctorsList={doctors}
                                  getServiceDuration={getServiceDuration}
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

                  {isDental && (
                    <TabsContent value="pending" className="m-0 mt-4">
                      <DentalChartingProvider>
                        <PendingTreatmentsView />
                      </DentalChartingProvider>
                    </TabsContent>
                  )}
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
            // Reset filtered patients - only show patients for current clinic
            const clinicPatients = patients.filter(p =>
              p.clinic === activeClinic || p.clinic === 'both'
            );
            setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));
          }
        }}
      >
        <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'sm:max-w-[500px]'} max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Add a new appointment for a registered patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="patient">Patient</Label>
                  <Select
                    value={appointmentPatient}
                    onValueChange={setAppointmentPatient}
                    // Keep the dropdown open when clicking inside it
                    onOpenChange={(open) => {
                      if (open) {
                        // When opening, reset the filtered patients - only show patients for current clinic
                        const clinicPatients = patients.filter(p =>
                          p.clinic === activeClinic || p.clinic === 'both'
                        );
                        setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));
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

                <Button
                  type="button"
                  onClick={openAddPatientDialog}
                  className={`w-full ${
                    isDental
                      ? 'bg-dental-primary hover:bg-dental-dark'
                      : 'bg-meditouch-primary hover:bg-meditouch-dark'
                  }`}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Patient
                </Button>
              </div>

              <div className={appointmentFollowUpService ? "grid grid-cols-2 gap-3" : ""}>
                <div className="space-y-1">
                  <Label htmlFor="service">Service</Label>
                  <Select value={appointmentService} onValueChange={setAppointmentService}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {isDental ? (
                        dentalServices.length > 0 ? (
                          dentalServices.map(service => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                            No services found. Please add services in Settings.
                          </div>
                        )
                      ) : (
                        meditouchServices.length > 0 ? (
                          meditouchServices.map(service => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                            No services found. Please add services in Settings.
                          </div>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {appointmentFollowUpService && (
                  <div className="space-y-1">
                    <Label htmlFor="follow-up-service">Follow-up Service</Label>
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                      {appointmentFollowUpService}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
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
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label htmlFor="time">Time Slot</Label>
                <Select
                  value={appointmentTime}
                  onValueChange={(value) => {
                    setAppointmentTime(value);

                    // If a doctor is already selected, check if they're double-booked
                    if (appointmentDoctor && appointmentService && isDoctorBookedInOtherClinic(appointmentDoctor, value, appointmentService)) {
                      handleDoctorDoubleBookingWarning(appointmentDoctor, value);
                    }
                  }}
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
              </div>

              <div className="space-y-1">
                <Label htmlFor="doctor">Doctor</Label>
                <Select
                  value={appointmentDoctor}
                  onValueChange={(value) => {
                    setAppointmentDoctor(value);

                    // Check if this doctor is already booked in the other clinic type
                    if (value && appointmentTime && appointmentService && isDoctorBookedInOtherClinic(value, appointmentTime, appointmentService)) {
                      handleDoctorDoubleBookingWarning(value, appointmentTime);
                    }
                  }}
                >
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

              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special requirements or information"
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex space-x-2 ml-auto">
              {hasPermission('appointments.create') && (
                <Button
                  onClick={handleCreateAppointment}
                  className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                >
                  Create Appointment
                </Button>
              )}
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
            // Reset filtered patients when opening the dialog - only show patients for current clinic
            const clinicPatients = patients.filter(p =>
              p.clinic === activeClinic || p.clinic === 'both'
            );
            setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));
          } else {
            // When closing, make sure we don't open the new appointment dialog
            setEditingAppointment(null);
          }
        }}
      >
        <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh] overflow-y-auto' : 'sm:max-w-[500px]'}`}>
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
                      dentalServices.length > 0 ? (
                        dentalServices.map(service => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                          No services found. Please add services in Settings.
                        </div>
                      )
                    ) : (
                      meditouchServices.length > 0 ? (
                        meditouchServices.map(service => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                          No services found. Please add services in Settings.
                        </div>
                      )
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
                  onValueChange={(value) => {
                    setAppointmentTime(value);

                    // If a doctor is already selected, check if they're double-booked
                    if (appointmentDoctor && appointmentService && isDoctorBookedInOtherClinic(appointmentDoctor, value, appointmentService)) {
                      handleDoctorDoubleBookingWarning(appointmentDoctor, value);
                    }
                  }}
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
                  onValueChange={(value) => {
                    setAppointmentDoctor(value);

                    // Check if this doctor is already booked in the other clinic type
                    if (value && appointmentTime && appointmentService && isDoctorBookedInOtherClinic(value, appointmentTime, appointmentService)) {
                      handleDoctorDoubleBookingWarning(value, appointmentTime);
                    }
                  }}
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

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Add any special requirements or information"
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div className="space-x-2">
              {hasPermission('appointments.edit') && (
                <Button
                  onClick={openUpdateConfirmation}
                  className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
                >
                  Update
                </Button>
              )}
              {editingAppointment && editingAppointment.status !== 'completed' && hasPermission('appointments.edit') && (
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => {
                    if (editingAppointment) {
                      console.log("Mark as Completed button clicked in edit dialog");
                      handleCompleteAppointment(editingAppointment);
                      setIsEditAppointmentOpen(false);
                    }
                  }}
                >
                  Mark as Completed
                </Button>
              )}
              {hasPermission('appointments.delete') && (
                <Button variant="destructive" onClick={openCancelConfirmation}>
                  Cancel
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsEditAppointmentOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Confirmation Dialog */}
      <Dialog open={isConfirmUpdateOpen} onOpenChange={setIsConfirmUpdateOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'sm:max-w-[425px]'}`}>
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update this appointment?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingAppointment && (
              <p className="text-sm text-muted-foreground">
                You are about to update the appointment for <span className="font-semibold">{editingAppointment.patient_name}</span> on {format(appointmentDate || new Date(), 'PP')} at {appointmentTime}.
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
        <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'sm:max-w-[425px]'}`}>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingAppointment && (
              <p className="text-sm text-muted-foreground">
                You are about to cancel the appointment for <span className="font-semibold">{editingAppointment.patient_name}</span> on {format(new Date(editingAppointment.date), 'PP')} at {editingAppointment.time}.
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
        <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'sm:max-w-[425px]'}`}>
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
                  <span className="font-semibold">Patient:</span> {pendingAppointment.patient_name || pendingAppointment.patient}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Service:</span> {pendingAppointment.service}
                  {pendingAppointment.service && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({getSlotsOccupied(pendingAppointment.service) * 15} min)
                    </span>
                  )}
                </p>
                {appointmentFollowUpService && (
                  <p className="text-sm">
                    <span className="font-semibold">Follow-up Service:</span> {appointmentFollowUpService}
                  </p>
                )}
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
                {pendingAppointment.notes && (
                  <p className="text-sm">
                    <span className="font-semibold">Notes:</span> {pendingAppointment.notes}
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

      {/* Appointment Completion Dialog */}
      {completedAppointment && (
        <AppointmentCompletionDialog
          isOpen={isCompletionDialogOpen}
          onClose={() => setIsCompletionDialogOpen(false)}
          appointment={completedAppointment}
          onPaymentStatusChange={handlePaymentStatusChange}
        />
      )}

      {/* Add Patient Dialog */}
      <AddPatientDialog
        isOpen={isAddPatientDialogOpen}
        onClose={() => setIsAddPatientDialogOpen(false)}
        onPatientAdded={handlePatientAdded}
      />

      {/* Warning Dialog for Fully Booked Slots */}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'sm:max-w-[425px]'}`}>
          <DialogHeader>
            <DialogTitle>Warning: Time Slot Conflict</DialogTitle>
            <DialogDescription>
              {warningMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleWarningCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleWarningConfirm}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Confirmation Dialog */}
      <Dialog open={isWhatsAppConfirmOpen} onOpenChange={(open) => {
        if (!open) {
          setIsWhatsAppConfirmOpen(false);
          setWhatsAppConfirmData(null);
        }
      }}>
        <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'sm:max-w-[425px]'}`}>
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
            <DialogDescription>
              Do you want to send a WhatsApp message to this patient?
            </DialogDescription>
          </DialogHeader>
          {whatsAppConfirmData && (
            <div className="py-4 space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Phone Number:</span> {whatsAppConfirmData.phone}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Doctor:</span> {whatsAppConfirmData.doctor || '-'}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date:</span> {whatsAppConfirmData.date}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Time:</span> {whatsAppConfirmData.time}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Service:</span> {whatsAppConfirmData.service}
              </p>
              {whatsAppConfirmData.followUpService && (
                <p className="text-sm">
                  <span className="font-semibold">Follow-up Service:</span> {whatsAppConfirmData.followUpService}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsWhatsAppConfirmOpen(false);
              setWhatsAppConfirmData(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleWhatsAppSend}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;

