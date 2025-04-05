
import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, UserPlus, Edit, X, Clock, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

// Sample registered patients
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

// Sample doctors
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

// Available time slots (15-minute intervals)
const timeSlots = [
  '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM', 
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM', 
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM', 
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM', 
  '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM', 
  '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM', 
  '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM', 
  '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM'
];

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
  // Don't display cancelled appointments
  if (status === 'cancelled') {
    return null;
  }
  
  return (
    <div className="border rounded-md p-3 mb-2 card-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={onReschedule} className="h-7 mr-1">
            <Clock className="h-3 w-3 mr-1" />
            Reschedule
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel} className="h-7 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
        <div className="font-medium text-sm flex items-center">
          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
          {time}
        </div>
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

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Appointments = () => {
  const {
    activeClinic,
    isDental
  } = useClinic();
  const navigate = useNavigate();
  const [view, setView] = useState('daily');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  // New appointment form state
  const [appointmentPatient, setAppointmentPatient] = useState("");
  const [appointmentService, setAppointmentService] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDoctor, setAppointmentDoctor] = useState("");

  // Filter state - now actually used
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterDoctor, setFilterDoctor] = useState<string | undefined>(undefined);
  const [filterPatient, setFilterPatient] = useState("");

  // Update the type definition for the appointments
  type DentalAppointment = {
    id: string;
    time: string;
    patient: string;
    service: string;
    doctor: string;
    status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
    secondPatient?: string;
  };
  
  type MeditouchAppointment = {
    id: string;
    time: string;
    patient: string;
    service: string;
    status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  };

  // Mock appointments with proper types and IDs
  const [dentalAppointments, setDentalAppointments] = useState<DentalAppointment[]>([{
    id: 'd1',
    time: '9:00 AM',
    patient: 'Aarav Sharma',
    service: 'Dental Checkup',
    doctor: 'Dr. Khanna',
    status: 'confirmed'
  }, {
    id: 'd2',
    time: '9:15 AM',
    patient: 'Priya Patel',
    service: 'Root Canal',
    doctor: 'Dr. Khanna',
    status: 'confirmed'
  }, {
    id: 'd3',
    time: '10:30 AM',
    patient: 'Arjun Singh',
    service: 'Teeth Cleaning',
    doctor: 'Dr. Khanna',
    status: 'confirmed',
    secondPatient: 'Neha Singh'
  }, {
    id: 'd4',
    time: '11:45 AM',
    patient: 'Rohan Gupta',
    service: 'Crown Fitting',
    doctor: 'Dr. Sharma',
    status: 'arrived'
  }, {
    id: 'd5',
    time: '2:00 PM',
    patient: 'Ishaan Desai',
    service: 'Dental Filling',
    doctor: 'Dr. Sharma',
    status: 'cancelled'
  }, {
    id: 'd6',
    time: '3:30 PM',
    patient: 'Sanjay Patel',
    service: 'Denture Adjustment',
    doctor: 'Dr. Desai',
    status: 'confirmed'
  }]);
  
  const [meditouchAppointments, setMeditouchAppointments] = useState<MeditouchAppointment[]>([{
    id: 'm1',
    time: '9:15 AM',
    patient: 'Meera Joshi',
    service: 'Skin Consultation',
    status: 'confirmed'
  }, {
    id: 'm2',
    time: '10:00 AM',
    patient: 'Ravi Kumar',
    service: 'Hair Treatment',
    status: 'arrived'
  }, {
    id: 'm3',
    time: '12:45 PM',
    patient: 'Vikram Mehta',
    service: 'Hair Treatment',
    status: 'confirmed'
  }, {
    id: 'm4',
    time: '2:30 PM',
    patient: 'Neha Kapoor',
    service: 'Facial',
    status: 'cancelled'
  }, {
    id: 'm5',
    time: '3:30 PM',
    patient: 'Aisha Khan',
    service: 'Facial',
    status: 'confirmed'
  }]);
  
  const appointments = isDental ? dentalAppointments : meditouchAppointments;

  // Filter appointments
  const filteredAppointments = appointments.filter(app => {
    // Filter by search term
    const matchesSearch = !searchTerm || app.patient.toLowerCase().includes(searchTerm.toLowerCase()) || (app as any).secondPatient?.toLowerCase().includes(searchTerm.toLowerCase()) || app.service.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by doctor (dental only)
    const matchesDoctor = !selectedDoctor || isDental && (app as DentalAppointment).doctor === selectedDoctor;

    // Don't show cancelled appointments
    const isNotCancelled = app.status !== 'cancelled';
    return matchesSearch && matchesDoctor && isNotCancelled;
  });

  // Get booked time slots for the selected date
  const getBookedTimeSlots = () => {
    const bookedSlots = appointments.filter(app => app.status !== 'cancelled').map(app => app.time);
    return bookedSlots;
  };

  // Get available time slots
  const getAvailableTimeSlots = () => {
    const bookedSlots = getBookedTimeSlots();
    return timeSlots.filter(time => !bookedSlots.includes(time));
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setAppointmentPatient(appointment.patient);
    setAppointmentService(appointment.service);
    setAppointmentTime(appointment.time);
    if (isDental) {
      setAppointmentDoctor((appointment as DentalAppointment).doctor);
    }
    setIsEditAppointmentOpen(true);
  };

  // Handle reschedule
  const handleReschedule = (appointment: any) => {
    setEditingAppointment(appointment);
    setAppointmentPatient(appointment.patient);
    setAppointmentService(appointment.service);
    setAppointmentTime(appointment.time);
    if (isDental && 'doctor' in appointment) {
      setAppointmentDoctor(appointment.doctor);
    }
    
    // Navigate to the new appointment page with pre-filled data
    navigate('/appointments/new', { 
      state: { 
        reschedule: true,
        appointmentId: appointment.id,
        patient: appointment.patient,
        service: appointment.service,
        time: appointment.time,
        doctor: isDental ? appointment.doctor : undefined
      } 
    });
  };

  // Handle direct reschedule from appointment card
  const handleDirectReschedule = (appointment: any) => {
    handleReschedule(appointment);
  };

  // Handle direct cancel from appointment card
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

  // Handle reschedule
  const handleRescheduleSubmit = () => {
    if (editingAppointment) {
      const updatedAppointments = isDental ? dentalAppointments.map(app => app.id === editingAppointment.id ? {
        ...app,
        time: appointmentTime,
        service: appointmentService,
        doctor: appointmentDoctor
      } : app) : meditouchAppointments.map(app => app.id === editingAppointment.id ? {
        ...app,
        time: appointmentTime,
        service: appointmentService
      } : app);
      
      if (isDental) {
        setDentalAppointments(updatedAppointments as DentalAppointment[]);
      } else {
        setMeditouchAppointments(updatedAppointments as MeditouchAppointment[]);
      }
      
      toast({
        title: "Appointment Rescheduled",
        description: `${editingAppointment.patient}'s appointment has been rescheduled to ${appointmentTime}`
      });
      setIsEditAppointmentOpen(false);
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = () => {
    if (editingAppointment) {
      const updatedAppointments = isDental ? dentalAppointments.map(app => app.id === editingAppointment.id ? {
        ...app,
        status: 'cancelled' as const
      } : app) : meditouchAppointments.map(app => app.id === editingAppointment.id ? {
        ...app,
        status: 'cancelled' as const
      } : app);
      
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

  // Create new appointment
  const handleCreateAppointment = () => {
    // Validate form
    if (!appointmentPatient || !appointmentService || !appointmentTime) {
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
        status: 'confirmed'
      };
      setDentalAppointments([...dentalAppointments, newAppointment]);
    } else {
      const newAppointment: MeditouchAppointment = {
        id: newId,
        time: appointmentTime,
        patient: appointmentPatient,
        service: appointmentService,
        status: 'confirmed'
      };
      setMeditouchAppointments([...meditouchAppointments, newAppointment]);
    }
    
    toast({
      title: "Appointment Created",
      description: `New appointment for ${appointmentPatient} at ${appointmentTime}`
    });
    setIsNewAppointmentOpen(false);
    resetAppointmentForm();
  };

  // Reset appointment form
  const resetAppointmentForm = () => {
    setAppointmentPatient("");
    setAppointmentService("");
    setAppointmentTime("");
    setAppointmentDoctor("");
  };

  // Go to new appointment page
  const goToNewAppointment = () => {
    navigate('/appointments/new');
  };

  // Filter appointments by morning/afternoon
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
        
        <Button
          onClick={goToNewAppointment}
          className={`${
            isDental 
              ? 'bg-dental-primary hover:bg-dental-dark' 
              : 'bg-meditouch-primary hover:bg-meditouch-dark'
          }`}
        >
          <Plus className="h-4 w-4 mr-2" /> New Appointment
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-64 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Date picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={date} onSelect={date => {
                    setDate(date || new Date());
                    setPopoverOpen(false);
                  }} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Doctor filter (only for dental) */}
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
              
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                

                
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  
                  
                </div>
                
                <Tabs defaultValue="daily" value={view} onValueChange={setView} className="w-full">
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="daily" className="m-0 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
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
                      
                  <TabsContent value="weekly" className="m-0">
                    <div className="text-center p-8 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Weekly View</h3>
                      <p className="text-muted-foreground">The weekly calendar view would display here</p>
                    </div>
                  </TabsContent>
                      
                  <TabsContent value="monthly" className="m-0">
                    <div className="text-center p-8 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Monthly View</h3>
                      <p className="text-muted-foreground">The monthly calendar view would display here</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Appointment Dialog */}
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
                    {registeredPatients.map(patient => <SelectItem key={patient.id} value={patient.name}>
                        {patient.name}
                      </SelectItem>)}
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
                    {isDental ? <>
                        <SelectItem value="Dental Checkup">Dental Checkup</SelectItem>
                        <SelectItem value="Root Canal">Root Canal</SelectItem>
                        <SelectItem value="Teeth Cleaning">Teeth Cleaning</SelectItem>
                        <SelectItem value="Crown Fitting">Crown Fitting</SelectItem>
                        <SelectItem value="Dental Filling">Dental Filling</SelectItem>
                      </> : <>
                        <SelectItem value="Skin Consultation">Skin Consultation</SelectItem>
                        <SelectItem value="Hair Treatment">Hair Treatment</SelectItem>
                        <SelectItem value="Facial">Facial</SelectItem>
                      </>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time Slot</Label>
                <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeSlots().map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isDental && <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor</Label>
                  <Select value={appointmentDoctor} onValueChange={setAppointmentDoctor}>
                    <SelectTrigger id="doctor">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doctor => <SelectItem key={doctor.id} value={doctor.name}>
                          {doctor.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAppointment} className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}>
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
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
                    {isDental ? <>
                        <SelectItem value="Dental Checkup">Dental Checkup</SelectItem>
                        <SelectItem value="Root Canal">Root Canal</SelectItem>
                        <SelectItem value="Teeth Cleaning">Teeth Cleaning</SelectItem>
                        <SelectItem value="Crown Fitting">Crown Fitting</SelectItem>
                        <SelectItem value="Dental Filling">Dental Filling</SelectItem>
                      </> : <>
                        <SelectItem value="Skin Consultation">Skin Consultation</SelectItem>
                        <SelectItem value="Hair Treatment">Hair Treatment</SelectItem>
                        <SelectItem value="Facial">Facial</SelectItem>
                      </>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time Slot</Label>
                <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                  <SelectTrigger id="edit-time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Include current time slot and available slots */}
                    <SelectItem value={editingAppointment?.time || ""}>
                      {editingAppointment?.time || "Current Time"} (Current)
                    </SelectItem>
                    {getAvailableTimeSlots().map(time => time !== editingAppointment?.time && <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isDental && <div className="space-y-2">
                  <Label htmlFor="edit-doctor">Doctor</Label>
                  <Select value={appointmentDoctor} onValueChange={setAppointmentDoctor}>
                    <SelectTrigger id="edit-doctor">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doctor => <SelectItem key={doctor.id} value={doctor.name}>
                          {doctor.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>}
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
              <Button onClick={handleRescheduleSubmit} className={isDental ? 'bg-dental-primary hover:bg-dental-dark' : 'bg-meditouch-primary hover:bg-meditouch-dark'}>
                Reschedule
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
