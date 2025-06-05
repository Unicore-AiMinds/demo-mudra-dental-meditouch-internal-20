
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { usePatients } from '@/contexts/PatientContext';
import { useAppointments } from '@/contexts/AppointmentContext';
import { useDoctors } from '@/contexts/DoctorContext';
import { useServices } from '@/contexts/ServiceContext';
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
  const { dentalServices, meditouchServices, isLoading: servicesLoading } = useServices();
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
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [skipOverlapCheck, setSkipOverlapCheck] = useState(false);

  const clinicName = isDental ? 'Dental Metrix' : 'Meditouch';

  // Get services from the ServiceContext
  const services = isDental
    ? dentalServices.map(service => service.name)
    : meditouchServices.map(service => service.name);

  // Use doctors from DoctorContext (already filtered by clinic type)
  const availableDoctors = doctors;

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

  // Get service duration in minutes
  const getServiceDuration = useCallback((serviceName: string) => {
    // Find the service in the services list from the ServiceContext
    const service = isDental
      ? dentalServices.find(s => s.name === serviceName)
      : meditouchServices.find(s => s.name === serviceName);

    // Return the duration or default to 15 minutes if not found
    return service?.duration || 15;
  }, [isDental, dentalServices, meditouchServices]);

  // Calculate how many 15-minute slots a service occupies
  const getSlotsOccupied = useCallback((serviceName: string) => {
    const duration = getServiceDuration(serviceName);
    return Math.ceil(duration / 15);
  }, [getServiceDuration]);

  // Generate time slots array (same as in Appointments.tsx)
  const timeSlots = useMemo(() => {
    const slots = [];
    // Start from 9 AM to 6 PM
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Skip lunch break (1 PM to 2 PM)
        if (hour === 13) continue;

        // Convert to 12-hour format
        const hour12 = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const formattedMinute = minute.toString().padStart(2, '0');
        const timeString = `${hour12}:${formattedMinute} ${ampm}`;
        slots.push(timeString);
      }
    }
    return slots;
  }, []);

  // Effect to calculate booked slots (accounting for multi-slot appointments)
  useEffect(() => {
    if (!appointmentsLoading && date) {
      const formattedDate = format(date, 'yyyy-MM-dd');

      // Get appointments for the selected date
      const dateAppointments = appointments.filter(app =>
        app.date === formattedDate &&
        app.status !== 'cancelled' &&
        app.status !== 'completed'
      );

      // Count booked slots, accounting for multi-slot appointments
      const slots: Record<string, number> = {};

      // Initialize all slots with 0 count
      timeSlots.forEach(slot => {
        slots[slot] = 0;
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
            slots[slot] = (slots[slot] || 0) + 1;
          }
        }
      });

      setBookedSlots(slots);
      setIsLoading(false);
    }
  }, [appointments, appointmentsLoading, date, getSlotsOccupied, timeSlots]);

  // Generate available time slots in 15-minute intervals
  const generateTimeSlots = () => {
    const maxPatientsPerSlot = clinicCapacity;
    const availableSlots = [];

    // Get current date and time for filtering past slots
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isToday = date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

    // Get all appointments for the current date from ALL clinics
    const formattedDate = format(date, 'yyyy-MM-dd');
    const allDateAppointments = appointments.filter(app =>
      app.date === formattedDate &&
      app.status !== 'cancelled' &&
      app.status !== 'completed'
    );

    // Create a map to track which slots are occupied by multi-slot appointments from other clinics
    const slotsOccupiedByOtherClinics = new Set<string>();

    // Check each appointment from the OTHER clinic type
    allDateAppointments
      .filter(app => app.clinic_type !== (isDental ? 'dental' : 'meditouch'))
      .forEach(app => {
        const startSlot = app.time;
        const slotsOccupied = getSlotsOccupied(app.service);

        // Find the starting index of this appointment
        const startIndex = timeSlots.indexOf(startSlot);
        if (startIndex === -1) return;

        // Mark all slots this appointment occupies as unavailable
        for (let i = 0; i < slotsOccupied; i++) {
          const slotIndex = startIndex + i;
          if (slotIndex < timeSlots.length) {
            const slot = timeSlots[slotIndex];
            slotsOccupiedByOtherClinics.add(slot);
          }
        }
      });

    // Filter time slots based on availability and time
    timeSlots.forEach(slot => {
      // Skip slots that are occupied by multi-slot appointments from other clinics
      if (slotsOccupiedByOtherClinics.has(slot)) {
        return;
      }

      // Check if slot is available based on booking status in current clinic
      const bookedCount = bookedSlots[slot] || 0;

      // Skip fully booked slots in current clinic
      if (bookedCount >= maxPatientsPerSlot) {
        return;
      }

      // If it's today, skip past time slots
      if (isToday) {
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
        if (slotTime <= now) {
          return;
        }
      }

      availableSlots.push(slot);
    });

    return availableSlots;
  };

  // Function to check if a doctor is already booked in the other clinic type for a specific time slot
  const isDoctorBookedInOtherClinic = useCallback((doctorName: string, timeSlot: string, serviceToCheck?: string) => {
    // Get all appointments for the current date (not cancelled or completed)
    // We need to check both dental and meditouch appointments, regardless of current clinic type
    const allAppointments = appointments
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
    const newAppointmentService = serviceToCheck || service;
    const newAppointmentSlots = newAppointmentService ? getSlotsOccupied(newAppointmentService) : 1;
    const newAppointmentEndIndex = timeSlotIndex + newAppointmentSlots - 1;

    // Filter appointments to only include those from the other clinic type
    const otherClinicAppointments = allAppointments.filter(app => {
      const isAppDental = app.clinic_type === 'dental';
      return isAppDental !== isDental; // Only include appointments from the other clinic type
    });

    // Check if the doctor is booked in any appointment at this time slot or overlapping slots
    return otherClinicAppointments.some(app => {
      // Get the doctor/therapist name from the appointment
      const appDoctorName = 'doctor' in app ? app.doctor :
                           ('therapist' in app && app.therapist) ? app.therapist : '';

      // If not the same doctor, no conflict
      if (appDoctorName !== doctorName) return false;

      // Get the appointment's time slot index
      const appTimeSlotIndex = timeSlots.indexOf(app.time);
      if (appTimeSlotIndex === -1) return false;

      // Calculate how many slots this appointment occupies
      // Use duration_minutes if available, otherwise calculate from service
      const slotsOccupied = app.duration_minutes
        ? Math.ceil(app.duration_minutes / 15)
        : getSlotsOccupied(app.service);
      const appointmentEndIndex = appTimeSlotIndex + slotsOccupied - 1;

      // Check for overlap between the two appointments
      const overlaps = (
        // Case 1: Existing appointment starts during the new appointment
        (appTimeSlotIndex >= timeSlotIndex && appTimeSlotIndex <= newAppointmentEndIndex) ||
        // Case 2: New appointment starts during the existing appointment
        (timeSlotIndex >= appTimeSlotIndex && timeSlotIndex <= appointmentEndIndex) ||
        // Case 3: Existing appointment completely contains the new appointment
        (appTimeSlotIndex <= timeSlotIndex && appointmentEndIndex >= newAppointmentEndIndex) ||
        // Case 4: New appointment completely contains the existing appointment
        (timeSlotIndex <= appTimeSlotIndex && newAppointmentEndIndex >= appointmentEndIndex)
      );

      if (overlaps) {
        console.log(`OVERLAP DETECTED: Doctor ${doctorName} is already booked at ${app.time} in the ${app.clinic_type} clinic`);
        console.log(`Existing appointment: Starts at index ${appTimeSlotIndex}, ends at index ${appointmentEndIndex}`);
        console.log(`New appointment: Starts at index ${timeSlotIndex}, ends at index ${newAppointmentEndIndex}`);
      }

      return overlaps;
    });
  }, [appointments, date, timeSlots, getSlotsOccupied, service, isDental]);

  // Function to handle doctor double-booking warning
  const handleDoctorDoubleBookingWarning = useCallback((doctorName: string, timeSlot: string) => {
    // Find the overlapping appointment in the other clinic
    const otherClinicAppointments = appointments
      .filter(app =>
        app.date === format(date, 'yyyy-MM-dd') &&
        app.status !== 'cancelled' &&
        app.status !== 'completed' &&
        app.clinic_type !== (isDental ? 'dental' : 'meditouch')
      );

    // Find the doctor's appointments in the other clinic
    const doctorAppointments = otherClinicAppointments.filter(app => {
      const appDoctorName = 'doctor' in app ? app.doctor :
                           ('therapist' in app && app.therapist) ? app.therapist : '';
      return appDoctorName === doctorName;
    });

    // Get the time slot index
    const timeSlotIndex = timeSlots.indexOf(timeSlot);

    // Find the overlapping appointment
    const overlappingAppointment = doctorAppointments.find(app => {
      const appTimeSlotIndex = timeSlots.indexOf(app.time);
      const slotsOccupied = getSlotsOccupied(app.service);
      const appointmentEndIndex = appTimeSlotIndex + slotsOccupied - 1;

      // Check for overlap
      return (
        (appTimeSlotIndex <= timeSlotIndex && appointmentEndIndex >= timeSlotIndex) ||
        (timeSlotIndex <= appTimeSlotIndex && timeSlotIndex + getSlotsOccupied(service || '') - 1 >= appTimeSlotIndex)
      );
    });

    // Create a simple warning message without time details
    const warningMsg = overlappingAppointment
      ? `Doctor ${doctorName} is already booked in the ${isDental ? 'Meditouch' : 'Dental'} clinic for ${overlappingAppointment.service}. You can still proceed with booking, but be aware that the doctor will have appointments in both clinics at overlapping times.`
      : `Doctor ${doctorName} is already booked in the ${isDental ? 'Meditouch' : 'Dental'} clinic during this time. You can still proceed with booking, but be aware that the doctor will have appointments in both clinics at overlapping times.`;

    setWarningMessage(warningMsg);
    setIsWarningDialogOpen(true);
  }, [appointments, date, timeSlots, getSlotsOccupied, service, isDental]);

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

    // Check for doctor overlap if a doctor is selected (unless user chose to skip)
    if (!skipOverlapCheck && doctor && isDental && isDoctorBookedInOtherClinic(doctor, time, service)) {
      handleDoctorDoubleBookingWarning(doctor, time);
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

      // Get the service duration in minutes
      const serviceDuration = getServiceDuration(service);

      // Create appointment object - match database schema exactly
      const appointmentData = isDental
        ? {
            patient_id: selectedPatient.id,
            patient_name: patient, // Will be extracted before sending to DB
            service,
            doctor: doctor || '',
            doctor_id: doctorInfo?.id || '',
            time,
            date: formattedDate,
            status: 'confirmed' as const,
            payment_status: 'unpaid' as const,
            clinic_type: 'dental' as const,
            notes: notes || '',
            duration_minutes: serviceDuration // Include the actual service duration
          }
        : {
            patient_id: selectedPatient.id,
            patient_name: patient, // Will be extracted before sending to DB
            service,
            time,
            date: formattedDate,
            status: 'confirmed' as const,
            payment_status: 'unpaid' as const,
            clinic_type: 'meditouch' as const,
            notes: notes || '',
            duration_minutes: serviceDuration // Include the actual service duration
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
      setSkipOverlapCheck(false); // Reset the skip flag
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
                <Select
                  value={time}
                  onValueChange={(value) => {
                    setTime(value);

                    // If a doctor is already selected, check if they're double-booked
                    if (doctor && service && isDental && isDoctorBookedInOtherClinic(doctor, value, service)) {
                      handleDoctorDoubleBookingWarning(doctor, value);
                    }
                  }}
                >
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
              <div className="flex justify-between items-center">
                <Label htmlFor="service">Service</Label>
                {servicesLoading && (
                  <span className="text-xs text-muted-foreground">Loading services...</span>
                )}
                {!servicesLoading && services.length === 0 && (
                  <span className="text-xs text-amber-600">
                    No services found. Add services in Settings → Services tab.
                  </span>
                )}
              </div>
              <Select
                value={service}
                onValueChange={setService}
                required
                disabled={servicesLoading}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder={servicesLoading ? "Loading services..." : "Select service"} />
                </SelectTrigger>
                <SelectContent>
                  {services.length > 0 ? (
                    services.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No services found. Please add services in the Settings → Services tab.
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {!servicesLoading && services.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  To add appointments, first add services in Settings → Services tab.
                </p>
              )}
            </div>

            {isDental && (
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select
                  value={doctor}
                  onValueChange={(value) => {
                    setDoctor(value);

                    // Check if this doctor is already booked in the other clinic type
                    if (value && time && service && isDoctorBookedInOtherClinic(value, time, service)) {
                      handleDoctorDoubleBookingWarning(value, time);
                    }
                  }}
                  required
                >
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

      {/* Warning Dialog */}
      {isWarningDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Doctor Overlap Warning</h3>
            <p className="text-gray-700 mb-6">{warningMessage}</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsWarningDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsWarningDialogOpen(false);
                  setSkipOverlapCheck(true);
                  // Continue with the appointment booking
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) {
                    form.requestSubmit();
                  }
                }}
                className={`${
                  isDental
                    ? 'bg-dental-primary hover:bg-dental-dark'
                    : 'bg-meditouch-primary hover:bg-meditouch-dark'
                }`}
              >
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAppointment;
