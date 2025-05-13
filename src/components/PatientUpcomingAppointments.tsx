import React, { useState, useEffect } from 'react';
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
import { useAppointments, Appointment, DentalAppointment } from '@/contexts/AppointmentContext';
import { Skeleton } from '@/components/ui/skeleton';
import UnresolvedAppointmentsAlert from '@/components/UnresolvedAppointmentsAlert';

// Using Appointment types from AppointmentContext

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
  const { getPatientAppointments, isLoading } = useAppointments();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  // Fetch appointments for this patient
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoadingAppointments(true);

        // Get appointments from Supabase
        const appointments = await getPatientAppointments(
          patientId,
          dentalOnly ? 'dental' : clinic
        );

        // Filter for upcoming appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison

        const upcoming = appointments.filter(app => {
          // Only include confirmed or arrived appointments
          const isActiveStatus = app.status === 'confirmed' || app.status === 'arrived';

          // Check if the appointment date is today or in the future
          const appointmentDate = parseISO(app.date);
          const isTodayOrFuture =
            appointmentDate.getFullYear() > today.getFullYear() ||
            (appointmentDate.getFullYear() === today.getFullYear() &&
             appointmentDate.getMonth() > today.getMonth()) ||
            (appointmentDate.getFullYear() === today.getFullYear() &&
             appointmentDate.getMonth() === today.getMonth() &&
             appointmentDate.getDate() >= today.getDate());

          return isActiveStatus && isTodayOrFuture;
        });

        // Sort by date and time - earliest first
        const sorted = upcoming.sort((a, b) => {
          // First compare by date
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);

          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime(); // Earlier dates first
          }

          // If dates are the same, compare by time
          // Convert times to 24-hour format for proper comparison
          const timeA = convertTo24Hour(a.time);
          const timeB = convertTo24Hour(b.time);
          return timeA.localeCompare(timeB); // Earlier times first
        });

        // Helper function to convert 12-hour time format to 24-hour for sorting
        function convertTo24Hour(time12h: string): string {
          const [time, modifier] = time12h.split(' ');
          let hours = time.split(':')[0]; // hours needs to be mutable
          const minutes = time.split(':')[1]; // minutes is constant

          if (hours === '12') {
            hours = '00';
          }

          if (modifier === 'PM') {
            hours = (parseInt(hours, 10) + 12).toString();
          }

          return `${hours.padStart(2, '0')}:${minutes}`;
        }

        // Limit if requested
        const limited = limit && limit > 0 ? sorted.slice(0, limit) : sorted;

        setUpcomingAppointments(limited);
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load appointments. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [patientId, clinic, limit, dentalOnly, getPatientAppointments, toast]);

  // Navigate to appointments page
  const handleViewAllAppointments = () => {
    toast({
      title: "Navigating to Appointments",
      description: "Opening the appointments page to schedule or view all appointments.",
    });
    navigate('/appointments');
  };

  // Loading state
  if (isLoadingAppointments) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(2).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No appointments
  if (upcomingAppointments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {dentalOnly
              ? "Scheduled dental appointments for this patient"
              : clinic === 'both'
                ? "All scheduled appointments for this patient"
                : `Scheduled ${clinic} appointments for this patient`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              {dentalOnly
                ? "No upcoming dental appointments scheduled."
                : clinic === 'both'
                  ? "No upcoming appointments scheduled."
                  : `No upcoming ${clinic} appointments scheduled.`}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleViewAllAppointments}
            >
              {dentalOnly
                ? "Schedule a Dental Appointment"
                : clinic === 'both'
                  ? "Schedule an Appointment"
                  : `Schedule a ${clinic.charAt(0).toUpperCase() + clinic.slice(1)} Appointment`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Alert for unresolved past appointments - only shown for this specific patient */}
      <UnresolvedAppointmentsAlert patientId={patientId} />

      <Card>
        <CardHeader className={condensed ? "pb-1 pt-3" : "pb-2"}>
          <CardTitle>{title}</CardTitle>
          {!condensed && (
            <CardDescription>
              {dentalOnly
                ? "Scheduled dental appointments for this patient"
                : clinic === 'both'
                  ? "All scheduled appointments for this patient"
                  : `Scheduled ${clinic} appointments for this patient`}
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
                        variant={'doctor' in appointment ? 'outline' : 'secondary'}
                        className={'doctor' in appointment
                          ? 'border-dental-primary text-dental-primary'
                          : 'border-meditouch-primary text-meditouch-primary'
                        }
                      >
                        {'doctor' in appointment ? 'Dental' : 'Meditouch'}
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
                    ? dentalOnly
                      ? "View All Dental Appointments"
                      : clinic === 'both'
                        ? "View All Appointments"
                        : `View All ${clinic.charAt(0).toUpperCase() + clinic.slice(1)} Appointments`
                    : dentalOnly
                      ? "Manage Dental Appointments"
                      : clinic === 'both'
                        ? "Manage Appointments"
                        : `Manage ${clinic.charAt(0).toUpperCase() + clinic.slice(1)} Appointments`}
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
    </>
  );
};

export default PatientUpcomingAppointments;
