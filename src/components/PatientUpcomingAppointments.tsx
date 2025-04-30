import React, { useMemo } from 'react';
import { format, isAfter, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

// Define the appointment types
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

// Demo data for appointments
const dentalAppointments: DentalAppointment[] = [
  {
    id: 'd1',
    time: '9:00 AM',
    patient: 'Aarav Sharma',
    service: 'Dental Checkup',
    doctor: 'Dr. Khanna',
    date: format(new Date(new Date().setDate(new Date().getDate() + 5)), 'yyyy-MM-dd'),
    status: 'confirmed'
  },
  {
    id: 'd2',
    time: '10:30 AM',
    patient: 'Aarav Sharma',
    service: 'Root Canal',
    doctor: 'Dr. Desai',
    date: format(new Date(new Date().setDate(new Date().getDate() + 12)), 'yyyy-MM-dd'),
    status: 'confirmed'
  },
  {
    id: 'd3',
    time: '2:00 PM',
    patient: 'Priya Patel',
    service: 'Teeth Cleaning',
    doctor: 'Dr. Khanna',
    date: format(new Date(new Date().setDate(new Date().getDate() + 3)), 'yyyy-MM-dd'),
    status: 'confirmed'
  },
  {
    id: 'd4',
    time: '11:45 AM',
    patient: 'Vikram Singh',
    service: 'Crown Fitting',
    doctor: 'Dr. Sharma',
    date: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
    status: 'confirmed'
  }
];

const meditouchAppointments: MeditouchAppointment[] = [
  {
    id: 'm1',
    time: '9:15 AM',
    patient: 'Aarav Sharma',
    service: 'Skin Consultation',
    date: format(new Date(new Date().setDate(new Date().getDate() + 2)), 'yyyy-MM-dd'),
    status: 'confirmed'
  },
  {
    id: 'm2',
    time: '10:00 AM',
    patient: 'Priya Patel',
    service: 'Hair Treatment',
    date: format(new Date(new Date().setDate(new Date().getDate() + 4)), 'yyyy-MM-dd'),
    status: 'confirmed'
  }
];

interface PatientUpcomingAppointmentsProps {
  patientId: string;
  patientName: string;
  clinic: 'dental' | 'meditouch' | 'both';
  limit?: number;
  condensed?: boolean;
  title?: string;
  dentalOnly?: boolean;
}

const PatientUpcomingAppointments: React.FC<PatientUpcomingAppointmentsProps> = ({
  patientId,
  patientName,
  clinic,
  limit,
  condensed = false,
  title = "Upcoming Appointments",
  dentalOnly = false
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get upcoming appointments for this patient
  const upcomingAppointments = useMemo(() => {
    const today = new Date();

    // Filter dental appointments if patient is registered for dental clinic
    const dentalApps = (clinic === 'dental' || clinic === 'both')
      ? dentalAppointments.filter(app =>
          app.patient === patientName &&
          app.status !== 'cancelled' &&
          app.status !== 'completed' &&
          app.date &&
          isAfter(parseISO(app.date), today)
        )
      : [];

    // Filter meditouch appointments if patient is registered for meditouch clinic and dentalOnly is false
    const meditouchApps = (!dentalOnly && (clinic === 'meditouch' || clinic === 'both'))
      ? meditouchAppointments.filter(app =>
          app.patient === patientName &&
          app.status !== 'cancelled' &&
          app.status !== 'completed' &&
          app.date &&
          isAfter(parseISO(app.date), today)
        )
      : [];

    // Combine and sort by date and time
    let appointments = [...dentalApps, ...meditouchApps].sort((a, b) => {
      // First compare by date
      const dateA = a.date ? new Date(a.date) : new Date();
      const dateB = b.date ? new Date(b.date) : new Date();

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }

      // If dates are the same, compare by time
      return a.time.localeCompare(b.time);
    });

    // Limit the number of appointments if requested
    if (limit && limit > 0) {
      appointments = appointments.slice(0, limit);
    }

    return appointments;
  }, [patientName, clinic, limit, dentalOnly]);

  // Navigate to appointments page
  const handleViewAllAppointments = () => {
    toast({
      title: "Navigating to Appointments",
      description: "Opening the appointments page to schedule or view all appointments.",
    });
    navigate('/appointments');
  };

  if (upcomingAppointments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Scheduled appointments for this patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No upcoming appointments scheduled.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleViewAllAppointments}
            >
              Schedule an Appointment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={condensed ? "pb-1 pt-3" : "pb-2"}>
        <CardTitle>{title}</CardTitle>
        {!condensed && (
          <CardDescription>
            Scheduled appointments for this patient
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={condensed ? "pt-2" : ""}>
        <div className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            <>
              <div className="grid gap-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`flex flex-col ${condensed ? 'p-3' : 'p-4'} border rounded-lg hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{appointment.service}</h3>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {appointment.date
                              ? format(parseISO(appointment.date), condensed ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')
                              : 'Date not set'}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{appointment.time}</span>
                        </div>
                        {!condensed && 'doctor' in appointment && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            Doctor: {appointment.doctor}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={appointment.id.startsWith('d') ? 'outline' : 'secondary'}
                        className={appointment.id.startsWith('d')
                          ? 'border-dental-primary text-dental-primary'
                          : 'border-meditouch-primary text-meditouch-primary'
                        }
                      >
                        {appointment.id.startsWith('d') ? 'Dental' : 'Meditouch'}
                      </Badge>
                    </div>
                    {!condensed && (
                      <div className="mt-2 text-sm">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {appointment.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAllAppointments}
                >
                  {limit && upcomingAppointments.length === limit
                    ? dentalOnly ? "View All Dental Appointments" : "View All Appointments"
                    : dentalOnly ? "Manage Dental Appointments" : "Manage Appointments"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                {dentalOnly
                  ? "No upcoming dental appointments scheduled."
                  : "No upcoming appointments scheduled."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleViewAllAppointments}
              >
                {dentalOnly ? "Schedule a Dental Appointment" : "Schedule an Appointment"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientUpcomingAppointments;
