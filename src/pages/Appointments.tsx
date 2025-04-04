
import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

const AppointmentCard = ({ 
  time, 
  patient, 
  service, 
  doctor, 
  status, 
  secondPatient = null,
  isDental = true 
}: { 
  time: string; 
  patient: string; 
  service: string; 
  doctor?: string; 
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled'; 
  secondPatient?: string | null;
  isDental?: boolean;
}) => {
  const statusColors = {
    confirmed: 'bg-blue-100 text-blue-800',
    arrived: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border rounded-md p-3 mb-2 card-shadow">
      <div className="flex justify-between items-center">
        <div className="font-medium text-sm">{time}</div>
        <div className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>
      <div className="mt-1">
        <div className="text-sm font-medium">{patient}</div>
        {secondPatient && (
          <div className="text-sm font-medium">{secondPatient}</div>
        )}
        <div className="text-xs text-muted-foreground">{service}</div>
        {doctor && (
          <div className="text-xs font-medium mt-1 text-dental-primary">{doctor}</div>
        )}
      </div>
    </div>
  );
};

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Appointments = () => {
  const { activeClinic, isDental } = useClinic();
  const navigate = useNavigate();
  const [view, setView] = useState('daily');
  const [date, setDate] = useState<Date>(new Date());
  const [doctor, setDoctor] = useState<string | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Update the type definition for the appointments
  type DentalAppointment = {
    time: string;
    patient: string;
    service: string;
    doctor: string;
    status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
    secondPatient?: string;
  };
  
  type MeditouchAppointment = {
    time: string;
    patient: string;
    service: string;
    status: 'confirmed' | 'arrived' | 'completed' | 'cancelled';
  };

  // Mock appointments with proper types
  const dentalAppointments: DentalAppointment[] = [
    { time: '9:00 AM', patient: 'Aarav Sharma', service: 'Dental Checkup', doctor: 'Dr. Khanna', status: 'confirmed' },
    { time: '9:15 AM', patient: 'Priya Patel', service: 'Root Canal', doctor: 'Dr. Khanna', status: 'confirmed' },
    { time: '10:30 AM', patient: 'Arjun Singh', service: 'Teeth Cleaning', doctor: 'Dr. Khanna', status: 'confirmed', secondPatient: 'Neha Singh' },
    { time: '11:45 AM', patient: 'Rohan Gupta', service: 'Crown Fitting', doctor: 'Dr. Khanna', status: 'arrived' },
    { time: '2:00 PM', patient: 'Ishaan Desai', service: 'Dental Filling', doctor: 'Dr. Khanna', status: 'cancelled' },
    { time: '3:30 PM', patient: 'Sanjay Patel', service: 'Denture Adjustment', doctor: 'Dr. Khanna', status: 'confirmed' },
  ];

  const meditouchAppointments: MeditouchAppointment[] = [
    { time: '9:15 AM', patient: 'Meera Joshi', service: 'Skin Consultation', status: 'confirmed' },
    { time: '10:00 AM', patient: 'Ravi Kumar', service: 'Hair Treatment', status: 'arrived' },
    { time: '12:45 PM', patient: 'Vikram Mehta', service: 'Hair Treatment', status: 'confirmed' },
    { time: '2:30 PM', patient: 'Neha Kapoor', service: 'Facial', status: 'cancelled' },
    { time: '3:30 PM', patient: 'Aisha Khan', service: 'Facial', status: 'confirmed' },
  ];

  const appointments = isDental ? dentalAppointments : meditouchAppointments;

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
          className={`${
            isDental 
              ? 'bg-dental-primary hover:bg-dental-dark' 
              : 'bg-meditouch-primary hover:bg-meditouch-dark'
          }`}
          onClick={() => navigate('/appointments/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
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
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(date) => {
                        setDate(date || new Date());
                        setPopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Doctor filter (only for dental) */}
              {isDental && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Doctor</label>
                  <Select value={doctor} onValueChange={setDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Doctors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      <SelectItem value="dr-khanna">Dr. Khanna</SelectItem>
                      <SelectItem value="dr-sharma">Dr. Sharma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="font-medium">
                    {format(date, 'MMMM d, yyyy')} ({weekDays[date.getDay()]})
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Tabs defaultValue="daily" value={view} onValueChange={setView}>
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <TabsContent value="daily" className="m-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Morning</h3>
                    <div className="space-y-1">
                      {appointments
                        .filter(a => {
                          const hour = parseInt(a.time.split(':')[0]);
                          const isPM = a.time.includes('PM');
                          return (!isPM || hour === 12);
                        })
                        .map((appointment, i) => (
                          <AppointmentCard
                            key={i}
                            time={appointment.time}
                            patient={appointment.patient}
                            service={appointment.service}
                            doctor={appointment.doctor}
                            status={appointment.status}
                            secondPatient={(appointment as any).secondPatient}
                            isDental={isDental}
                          />
                        ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-3">Afternoon</h3>
                    <div className="space-y-1">
                      {appointments
                        .filter(a => {
                          const hour = parseInt(a.time.split(':')[0]);
                          const isPM = a.time.includes('PM');
                          return (isPM && hour !== 12);
                        })
                        .map((appointment, i) => (
                          <AppointmentCard
                            key={i}
                            time={appointment.time}
                            patient={appointment.patient}
                            service={appointment.service}
                            doctor={appointment.doctor}
                            status={appointment.status}
                            secondPatient={(appointment as any).secondPatient}
                            isDental={isDental}
                          />
                        ))}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
