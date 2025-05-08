
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { usePatients } from '@/contexts/PatientContext';
import { useAppointments } from '@/contexts/AppointmentContext';
import { useDoctors } from '@/contexts/DoctorContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar as CalendarIcon, Search, UserPlus, Plus, Loader2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import AddPatientDialog from '@/components/AddPatientDialog';
import { Skeleton } from '@/components/ui/skeleton';

// We'll use the PatientContext and AppointmentContext instead of demo data

const NewAppointment = () => {
  const { activeClinic, isDental, clinicCapacity } = useClinic();
  const { patients, isLoading: patientsLoading } = usePatients();
  const { appointments, isLoading: appointmentsLoading, addAppointment } = useAppointments();
  const { doctors: doctorsList, isLoading: doctorsLoading } = useDoctors();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>('');
  const [patient, setPatient] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [service, setService] = useState<string>('');
  const [doctor, setDoctor] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<{id: string, name: string}[]>([]);
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const clinicName = isDental ? 'Dental Metrix' : 'Meditouch';

  // Get services from the appropriate clinic
  const services = isDental
    ? ['Dental Checkup', 'Teeth Cleaning', 'Root Canal', 'Crown Fitting', 'Dental Filling', 'Denture Adjustment']
    : ['Skin Consultation', 'Hair Treatment', 'Facial', 'Massage Therapy', 'Cosmetic Procedure'];

  // Filter doctors based on clinic type
  const availableDoctors = isDental
    ? doctorsList.filter(d => d.clinic === 'dental' || d.clinic === 'both')
    : [];

  // Effect to initialize patients list
  useEffect(() => {
    if (!patientsLoading) {
      // Filter patients based on clinic
      const clinicPatients = patients.filter(p =>
        p.clinic === activeClinic || p.clinic === 'both'
      );

      // Map to the format needed for the dropdown
      setFilteredPatients(clinicPatients.map(p => ({
        id: p.id,
        name: p.name
      })));
    }
  }, [patients, patientsLoading, activeClinic]);

  // Effect to calculate booked slots
  useEffect(() => {
    if (!appointmentsLoading && date) {
      const formattedDate = format(date, 'yyyy-MM-dd');

      // Get appointments for the selected date
      const dateAppointments = appointments.filter(app =>
        app.date === formattedDate &&
        app.status !== 'cancelled' &&
        app.status !== 'completed'
      );

      // Count booked slots
      const slots: Record<string, number> = {};

      dateAppointments.forEach(app => {
        if (!slots[app.time]) {
          slots[app.time] = 1;
        } else {
          slots[app.time]++;
        }
      });

      setBookedSlots(slots);
      setIsLoading(false);
    }
  }, [appointments, appointmentsLoading, date]);

  // Generate available time slots in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
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
        const bookedCount = bookedSlots[timeString] || 0;
        if (bookedCount < maxPatientsPerSlot) {
          // Convert to AM/PM format for display
          const hour12 = hour % 12 || 12;
          const ampm = hour < 12 ? 'AM' : 'PM';
          const displayTime = `${hour12}:${formattedMinute} ${ampm}`;
          slots.push(displayTime);
        }
      }
    }

    return slots;
  };

  const handlePatientSearch = (value: string) => {
    if (!value) {
      // Reset to all patients for this clinic
      const clinicPatients = patients.filter(p =>
        p.clinic === activeClinic || p.clinic === 'both'
      );
      setFilteredPatients(clinicPatients.map(p => ({ id: p.id, name: p.name })));
      return;
    }

    // Filter patients by name
    const filtered = patients.filter(p =>
      (p.clinic === activeClinic || p.clinic === 'both') &&
      p.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredPatients(filtered.map(p => ({ id: p.id, name: p.name })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patient || !service || !time) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the patient ID
      const selectedPatient = filteredPatients.find(p => p.name === patient);
      if (!selectedPatient) {
        throw new Error("Selected patient not found");
      }

      // Find the doctor ID if a doctor is selected
      let doctorInfo = null;
      if (doctor && isDental) {
        doctorInfo = doctorsList.find(d => d.name === doctor);
      }

      // Format date for Supabase
      const formattedDate = format(date, 'yyyy-MM-dd');

      // Create appointment object
      const appointmentData = isDental
        ? {
            patient_id: selectedPatient.id,
            patient_name: patient,
            service,
            doctor: doctor || '',
            doctor_id: doctorInfo?.id || '',
            time,
            date: formattedDate,
            status: 'confirmed' as const,
            notes: notes || ''
          }
        : {
            patient_id: selectedPatient.id,
            patient_name: patient,
            service,
            time,
            date: formattedDate,
            status: 'confirmed' as const,
            notes: notes || ''
          };

      // Add appointment to Supabase
      await addAppointment(appointmentData);

      toast({
        title: "Appointment scheduled",
        description: `${patient}'s appointment has been scheduled for ${format(date, 'PPP')} at ${time}`,
      });

      navigate('/appointments');
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPatientRegistration = () => {
    // Open the add patient dialog
    setIsAddPatientDialogOpen(true);
  };

  // Handle newly added patient
  const handlePatientAdded = (newPatient: { id: string; name: string }) => {
    // Add the new patient to the filtered patients list
    setFilteredPatients(prev => [
      { id: newPatient.id, name: newPatient.name },
      ...prev
    ]);

    // Select the newly added patient
    setPatient(newPatient.name);
    setPatientId(newPatient.id);
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

            <div className="space-y-4 relative">
              <div>
                <Label htmlFor="patient">Patient Name</Label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientSearchOpen}
                      className="w-full justify-between mt-2"
                    >
                      {patient
                        ? filteredPatients.find((p) => p.name === patient)?.name
                        : "Select patient..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search patients..."
                        onValueChange={handlePatientSearch}
                        className="h-9"
                      />
                      <CommandEmpty>No patient found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-auto">
                        {filteredPatients.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setPatient(p.name);
                              setPatientSearchOpen(false);
                            }}
                          >
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                type="button"
                onClick={goToPatientRegistration}
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
                    {availableDoctors.map(d => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
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

      {/* Add Patient Dialog */}
      <AddPatientDialog
        isOpen={isAddPatientDialogOpen}
        onClose={() => setIsAddPatientDialogOpen(false)}
        onPatientAdded={handlePatientAdded}
      />
    </div>
  );
};

export default NewAppointment;
