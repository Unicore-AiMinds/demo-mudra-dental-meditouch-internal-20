
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar as CalendarIcon, UserPlus, Search, X } from 'lucide-react';


// Sample registered patients (same as in Appointments.tsx)
const registeredPatients = [
  { id: 'p1', name: 'Aarav Sharma' },
  { id: 'p2', name: 'Priya Patel' },
  { id: 'p3', name: 'Arjun Singh' },
  { id: 'p4', name: 'Neha Singh' },
  { id: 'p5', name: 'Rohan Gupta' },
  { id: 'p6', name: 'Ishaan Desai' },
  { id: 'p7', name: 'Sanjay Patel' },
  { id: 'p8', name: 'Meera Joshi' },
  { id: 'p9', name: 'Ravi Kumar' },
  { id: 'p10', name: 'Vikram Mehta' },
  { id: 'p11', name: 'Neha Kapoor' },
  { id: 'p12', name: 'Aisha Khan' }
];

// Sample booked appointments for the current date
const bookedTimeSlots = {
  dental: {
    '09:00': 2, // Fully booked (2 patients)
    '09:15': 1, // 1 slot available
    '10:30': 2, // Fully booked
    '14:00': 1  // 1 slot available
  },
  meditouch: {
    '09:15': 1, // Fully booked (1 patient for meditouch)
    '10:00': 1, // Fully booked
    '12:45': 1, // Fully booked
    '15:30': 1  // Fully booked
  }
};

const NewAppointment = () => {
  const { activeClinic, isDental, clinicCapacity } = useClinic();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>('');
  const [patient, setPatient] = useState<string>('');

  const [service, setService] = useState<string>('');
  const [doctor, setDoctor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState(registeredPatients);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  // Reset search when component unmounts
  useEffect(() => {
    return () => {
      setPatientSearchTerm('');
      setFilteredPatients(registeredPatients);
    };
  }, []);

  // Handle pre-filled values from appointment grid click
  useEffect(() => {
    if (location.state) {
      // If time is provided in the state, set it
      if (location.state.time) {
        setTime(location.state.time);
      }

      // If date is provided in the state, parse and set it
      if (location.state.date) {
        try {
          const dateObj = new Date(location.state.date);
          if (!isNaN(dateObj.getTime())) {
            setDate(dateObj);
          }
        } catch (error) {
          console.error('Error parsing date from state:', error);
        }
      }

      // If doctor is provided in the state and we're in dental clinic, set it
      if (location.state.doctor && isDental) {
        setDoctor(location.state.doctor);
      }

      // If patient is provided (for rescheduling)
      if (location.state.patient) {
        setPatient(location.state.patient);
      }

      // If service is provided (for rescheduling)
      if (location.state.service) {
        setService(location.state.service);
      }
    }
  }, [location.state, isDental]);

  const clinicName = isDental ? 'Dental Metrix' : 'Meditouch';
  const services = isDental
    ? ['Dental Checkup', 'Teeth Cleaning', 'Root Canal', 'Crown Fitting', 'Dental Filling', 'Denture Adjustment']
    : ['Skin Consultation', 'Hair Treatment', 'Facial', 'Massage Therapy', 'Cosmetic Procedure'];

  const doctors = isDental
    ? ['Dr. Khanna', 'Dr. Sharma', 'Dr. Patel']
    : [];

  // Generate available time slots in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    const clinicType = isDental ? 'dental' : 'meditouch';
    const maxPatientsPerSlot = clinicCapacity;

    // Start from 9 AM
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Skip lunch break (1 PM to 2 PM)
        if (hour === 13) continue;

        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const timeString = `${formattedHour}:${formattedMinute}`;

        // Check if slot is available based on booking status
        const bookedCount = bookedTimeSlots[clinicType]?.[timeString] || 0;
        if (bookedCount < maxPatientsPerSlot) {
          slots.push(timeString);
        }
      }
    }

    return slots;
  };

  const handlePatientSearch = (value: string) => {
    // If search term is empty, show all patients
    if (!value || value.trim() === '') {
      setFilteredPatients(registeredPatients);
      return;
    }

    // Filter patients by name
    const searchTerm = value.toLowerCase().trim();
    const filtered = registeredPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm)
    );
    setFilteredPatients(filtered);

    // If no patients match the search term, show a message
    if (filtered.length === 0) {
      console.log('No patients found matching:', searchTerm);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patient || !service || !time) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Additional validation for dental appointments
    if (isDental && !doctor) {
      toast({
        title: "Missing Information",
        description: "Please select a doctor",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Create a new appointment object
    const newAppointment = {
      id: `${isDental ? 'd' : 'm'}${Math.floor(Math.random() * 10000)}`,
      patient,
      service,
      time,
      date: format(date, 'yyyy-MM-dd'),
      status: 'confirmed' as const,
      ...(isDental && { doctor })
    };

    // Store the appointment in localStorage so it persists
    try {
      // Get existing appointments from localStorage
      const storageKey = isDental ? 'dentalAppointments' : 'meditouchAppointments';
      const existingAppointmentsJson = localStorage.getItem(storageKey);
      const existingAppointments = existingAppointmentsJson ? JSON.parse(existingAppointmentsJson) : [];

      // Add the new appointment
      const updatedAppointments = [...existingAppointments, newAppointment];

      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));

      // Show success message
      toast({
        title: "Appointment scheduled",
        description: `${patient}'s appointment has been scheduled for ${format(date, 'PPP')} at ${time}`,
      });

      // Navigate back to appointments page
      navigate('/appointments', { state: { refresh: true } });
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: "There was an error scheduling the appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPatientRegistration = () => {
    // Navigate to the patient registration page
    navigate('/patients');

    // Show a toast notification that this would normally open the registration form
    toast({
      title: "Patient Registration",
      description: "This would take you to the patient registration form",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => navigate('/appointments')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">New Appointment</h1>
          <p className="text-muted-foreground">
            Schedule a new {clinicName} appointment
            ({isDental ? "2 patients" : "1 patient"} per time slot)
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate || new Date());
                        setPopoverOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time (Available Slots)</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select available time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map(timeSlot => (
                      <SelectItem key={timeSlot} value={timeSlot}>{timeSlot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <Label htmlFor="patient">Patient Name</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToPatientRegistration}
                  className="h-8"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  New Registration
                </Button>
              </div>

              <Select
                value={patient}
                onValueChange={(value) => {
                  setPatient(value);
                  // Reset search term when a patient is selected
                  setPatientSearchTerm('');
                  setFilteredPatients(registeredPatients);
                }}
                required
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search patients..."
                        className="h-8 mb-2 pl-8 pr-8"
                        value={patientSearchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPatientSearchTerm(value);
                          handlePatientSearch(value);
                        }}
                      />
                      {patientSearchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-8 px-2"
                          onClick={() => {
                            setPatientSearchTerm('');
                            handlePatientSearch('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {filteredPatients.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">No patient found</div>
                  ) : (
                    filteredPatients.map(p => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select value={service} onValueChange={setService} required>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isDental && (
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select value={doctor} onValueChange={setDoctor} required>
                  <SelectTrigger id="doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or information"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className={`${
                isDental
                  ? 'bg-dental-primary hover:bg-dental-dark'
                  : 'bg-meditouch-primary hover:bg-meditouch-dark'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewAppointment;
