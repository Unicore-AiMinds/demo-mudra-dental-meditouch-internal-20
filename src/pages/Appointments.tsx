import { useState, useMemo } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useNavigate } from 'react-router-dom';
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
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
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
  onCancel
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

const CalendarAppointmentItem = ({ appointment, isDental, onClick }: { 
  appointment: DentalAppointment | MeditouchAppointment,
  isDental: boolean,
  onClick: () => void
}) => {
  const bgColor = isDental ? 'bg-dental-light' : 'bg-meditouch-light';
  const borderColor = isDental ? 'border-dental-primary' : 'border-meditouch-primary';
  const textColor = isDental ? 'text-dental-primary' : 'text-meditouch-primary';
  
  return (
    <div 
      className={`px-1.5 py-0.5 text-xs rounded mb-0.5 border-l-2 ${bgColor} ${borderColor} ${textColor} cursor-pointer`}
      onClick={onClick}
    >
      <div className="font-medium truncate">{appointment.time} | {appointment.patient}</div>
    </div>
  );
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
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  const [appointmentPatient, setAppointmentPatient] = useState("");
  const [appointmentService, setAppointmentService] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDoctor, setAppointmentDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);

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

  const getAppointmentsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return appointments.filter(app => app.date === dateString && app.status !== 'cancelled');
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesDate = app.date === format(date, 'yyyy-MM-dd');
      const matchesSearch = !searchTerm || app.patient.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (app as any).secondPatient?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.service.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDoctor = !selectedDoctor || isDental && (app as DentalAppointment).doctor === selectedDoctor;
      const isNotCancelled = app.status !== 'cancelled';
      
      if (view === 'daily') {
        return matchesDate && matchesSearch && matchesDoctor && isNotCancelled;
      } else {
        return matchesSearch && matchesDoctor && isNotCancelled;
      }
    });
  }, [appointments, date, searchTerm, selectedDoctor, isDental, view]);

  const getBookedTimeSlots = () => {
    const bookedSlots = appointments
      .filter(app => app.date === format(date, 'yyyy-MM-dd') && app.status !== 'cancelled')
      .map(app => app.time);
    return bookedSlots;
  };

  const getAvailableTimeSlots = () => {
    const bookedSlots = getBookedTimeSlots();
    return timeSlots.filter(time => !bookedSlots.includes(time));
  };

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setAppointmentPatient(appointment.patient);
    setAppointmentService(appointment.service);
    setAppointmentTime(appointment.time);
    if (appointment.date) {
      const parsedDate = new Date(appointment.date);
      setAppointmentDate(parsedDate);
    }
    if (isDental && 'doctor' in appointment) {
      setAppointmentDoctor((appointment as DentalAppointment).doctor);
    }
    setIsEditAppointmentOpen(true);
  };

  const handleReschedule = (appointment: any) => {
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

  const handleDirectReschedule = (appointment: any) => {
    handleReschedule(appointment);
  };

  const handleDirectCancel = (appointment: any) => {
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
      
      setIsEditAppointmentOpen(false);
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
      
      setIsEditAppointmentOpen(false);
    }
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
    
    const newId = `${isDental ? 'd' : 'm'}${Math.floor(Math.random() * 10000)}`;
    
    if (isDental) {
      const newAppointment: DentalAppointment = {
        id: newId,
        time: appointmentTime,
        patient: appointmentPatient,
        service: appointmentService,
        doctor: appointmentDoctor || 'Dr. Khanna',
        date: format(appointmentDate, 'yyyy-MM-dd'),
        status: 'confirmed'
      };
      setDentalAppointments([...dentalAppointments, newAppointment]);
    } else {
      const newAppointment: MeditouchAppointment = {
        id: newId,
        time: appointmentTime,
        patient: appointmentPatient,
        service: appointmentService,
        date: format(appointmentDate, 'yyyy-MM-dd'),
        status: 'confirmed'
      };
      setMeditouchAppointments([...meditouchAppointments, newAppointment]);
    }
    
    toast({
      title: "Appointment Created",
      description: `New appointment for ${appointmentPatient} on ${format(appointmentDate, 'PP')} at ${appointmentTime}`
    });
    
    setIsNewAppointmentOpen(false);
    resetAppointmentForm();
  };

  const resetAppointmentForm = () => {
    setAppointmentPatient("");
    setAppointmentService("");
    setAppointmentTime("");
    setAppointmentDoctor("");
    setAppointmentDate(undefined);
  };

  const goToNewAppointment = () => {
    navigate('/appointments/new');
  };

  const handlePreviousClick = () => {
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

  const weekDates = useMemo(() => {
    const start = startOfWeek(date);
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [date]);

  const monthDates = useMemo(() => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  }, [date]);

  const morningAppointments = filteredAppointments.filter(a => {
    const hour = parseInt(a.time.split(':')[0]);
    const isPM = a.time.includes('PM');
    return !isPM || hour === 12;
  });
  
  const afternoonAppointments = filteredAppointments.filter(a => {
    const hour = parseInt(a.time.split(':')[0]);
    const isPM = a.time.includes('PM');
    return isPM && hour !== 12;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage and schedule {isDental ? 'Dental Metrix' : 'Meditouch'} appointments
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            className={`${
              activeClinic === 'dental' 
                ? 'bg-dental-primary hover:bg-dental-dark text-white' 
                : 'bg-meditouch-primary hover:bg-meditouch-dark text-white'
            }`}
            onClick={() => setIsNewAppointmentOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-64 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
              </div>
              
              {isDental && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Doctor</label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
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
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-8" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={goToNewAppointment}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Patient & Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={handlePreviousClick}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="font-medium">
                    {view === 'daily' && format(date, 'MMMM d, yyyy')}
                    {view === 'weekly' && (
                      <>
                        {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
                      </>
                    )}
                    {view === 'monthly' && format(date, 'MMMM yyyy')}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleNextClick}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setDate(new Date())}>
                    Today
                  </Button>
                </div>
                
                <Tabs defaultValue="daily" value={view} onValueChange={setView} className="w-full">
                  <TabsList className="ml-auto">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="daily" className="m-0 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full mt-4">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Morning</h3>
                        <div className="space-y-1">
                          {morningAppointments.length > 0 ? morningAppointments.map(appointment => (
                            <AppointmentCard 
                              key={appointment.id} 
                              time={appointment.time} 
                              patient={appointment.patient} 
                              service={appointment.service} 
                              doctor={isDental ? (appointment as DentalAppointment).doctor : undefined} 
                              status={appointment.status} 
                              secondPatient={(appointment as any).secondPatient} 
                              isDental={isDental} 
                              onEdit={() => handleEditAppointment(appointment)} 
                              onReschedule={() => handleDirectReschedule(appointment)} 
                              onCancel={() => handleDirectCancel(appointment)} 
                            />
                          )) : (
                            <p className="text-sm text-muted-foreground">No morning appointments</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-3">Afternoon</h3>
                        <div className="space-y-1">
                          {afternoonAppointments.length > 0 ? afternoonAppointments.map(appointment => (
                            <AppointmentCard 
                              key={appointment.id} 
                              time={appointment.time} 
                              patient={appointment.patient} 
                              service={appointment.service} 
                              doctor={isDental ? (appointment as DentalAppointment).doctor : undefined} 
                              status={appointment.status} 
                              secondPatient={(appointment as any).secondPatient} 
                              isDental={isDental} 
                              onEdit={() => handleEditAppointment(appointment)} 
                              onReschedule={() => handleDirectReschedule(appointment)} 
                              onCancel={() => handleDirectCancel(appointment)} 
                            />
                          )) : (
                            <p className="text-sm text-muted-foreground">No afternoon appointments</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                      
                  <TabsContent value="weekly" className="m-0 mt-4">
                    <div className="grid grid-cols-7 gap-1 text-center border-b pb-2 mb-2">
                      {weekDaysShort.map((day, index) => (
                        <div key={day} className="text-xs font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 h-[500px]">
                      {weekDates.map((day, idx) => {
                        const dayAppointments = getAppointmentsForDate(day);
                        const isCurrentDay = isToday(day);
                        return (
                          <div 
                            key={idx} 
                            className={cn(
                              "border rounded-lg h-full overflow-y-auto p-1",
                              isCurrentDay && "border-primary bg-primary/5",
                              !isSameMonth(day, date) && "opacity-50"
                            )}
                          >
                            <div className={cn(
                              "text-xs font-medium p-1 text-center rounded-md mb-1",
                              isCurrentDay ? isDental ? "bg-dental-primary text-white" : "bg-meditouch-primary text-white" : "bg-muted"
                            )}>
                              {format(day, 'd')}
                            </div>
                            <div className="space-y-1">
                              {dayAppointments.map(appointment => (
                                <CalendarAppointmentItem 
                                  key={appointment.id}
                                  appointment={appointment}
                                  isDental={isDental}
                                  onClick={() => handleEditAppointment(appointment)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                      
                  <TabsContent value="monthly" className="m-0 mt-4">
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
                              "border rounded-lg min-h-[100px] max-h-[120px] overflow-y-auto p-1",
                              isCurrentDay && "border-primary bg-primary/5"
                            )}
                            onClick={() => {
                              setDate(day);
                              setView('daily');
                            }}
                          >
                            <div className={cn(
                              "text-xs font-medium p-1 text-center rounded-md",
                              isCurrentDay ? isDental ? "bg-dental-primary text-white" : "bg-meditouch-primary text-white" : ""
                            )}>
                              {format(day, 'd')}
                            </div>
                            <div className="space-y-0.5 mt-1">
                              {dayAppointments.slice(0, 3).map(appointment => (
                                <CalendarAppointmentItem 
                                  key={appointment.id}
                                  appointment={appointment}
                                  isDental={isDental}
                                  onClick={() => {
                                    handleEditAppointment(appointment);
                                  }}
                                />
                              ))}
                              {dayAppointments.length > 3 && (
                                <div className="text-xs text-center text-muted-foreground pt-1">
                                  +{dayAppointments.length - 3} more
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

      <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
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
                <Select value={appointmentPatient} onValueChange={setAppointmentPatient}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {registeredPatients.map(patient => (
                      <SelectItem key={patient.id} value={patient.name}>
                        {patient.name}
                      </SelectItem>
                    ))}
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
                <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isDental && (
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
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppointment} 
              className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
            >
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditAppointmentOpen} onOpenChange={setIsEditAppointmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Reschedule or cancel the appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Patient</Label>
                <p className="font-medium mt-1">{appointmentPatient}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-service">Service</Label>
                <Select value={appointmentService} onValueChange={setAppointmentService}>
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
                <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                  <SelectTrigger id="edit-time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={appointmentTime}>
                      {appointmentTime} (Current)
                    </SelectItem>
                    {timeSlots.map(time => 
                      time !== appointmentTime && (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {isDental && (
                <div className="space-y-2">
                  <Label htmlFor="edit-doctor">Doctor</Label>
                  <Select value={appointmentDoctor} onValueChange={setAppointmentDoctor}>
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
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleCancelAppointment}>
              <X className="h-4 w-4 mr-2" /> Cancel Appointment
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsEditAppointmentOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={handleRescheduleSubmit} 
                className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}
              >
                Update Appointment
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
