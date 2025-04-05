
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';

const NewAppointment = () => {
  const { activeClinic, isDental } = useClinic();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>('09:00');
  const [patient, setPatient] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [doctor, setDoctor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const clinicName = isDental ? 'Dental Metrix' : 'Meditouch';
  const services = isDental 
    ? ['Dental Checkup', 'Teeth Cleaning', 'Root Canal', 'Crown Fitting', 'Dental Filling', 'Denture Adjustment']
    : ['Skin Consultation', 'Hair Treatment', 'Facial', 'Massage Therapy', 'Cosmetic Procedure'];
    
  const doctors = isDental 
    ? ['Dr. Khanna', 'Dr. Sharma', 'Dr. Patel'] 
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Appointment scheduled",
        description: `${patient}'s appointment has been scheduled for ${format(date, 'PPP')} at ${time}`,
      });
      navigate('/appointments');
    }, 1000);
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                      '12:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient">Patient Name</Label>
              <Input 
                id="patient" 
                placeholder="Enter patient name" 
                value={patient} 
                onChange={(e) => setPatient(e.target.value)} 
                required 
              />
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
