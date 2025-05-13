import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isBefore } from 'date-fns';
import { useAppointments } from '@/contexts/AppointmentContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '@/types/appointment';

interface UnresolvedAppointmentsAlertProps {
  patientId?: string; // Optional - if provided, only show unresolved appointments for this patient
}

/**
 * Component that displays an alert for past appointments that haven't been marked as completed or cancelled
 */
export const UnresolvedAppointmentsAlert = ({ patientId }: UnresolvedAppointmentsAlertProps) => {
  const { dentalAppointments, meditouchAppointments, getPatientAppointments } = useAppointments();
  const [unresolvedAppointments, setUnresolvedAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  // Find unresolved past appointments
  useEffect(() => {
    const fetchUnresolvedAppointments = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison

      let allAppointments: Appointment[] = [];

      // If patientId is provided, fetch appointments for that patient only
      if (patientId) {
        try {
          // Get appointments for this specific patient
          const patientAppointments = await getPatientAppointments(patientId, 'both');
          allAppointments = patientAppointments;
        } catch (error) {
          console.error('Error fetching patient appointments:', error);
          allAppointments = [];
        }
      } else {
        // Otherwise, use all appointments
        allAppointments = [...dentalAppointments, ...meditouchAppointments];
      }

      // Filter for past appointments that are not completed, cancelled, or scheduled
      const unresolved = allAppointments.filter(app => {
        const appointmentDate = parseISO(app.date);
        return (
          isBefore(appointmentDate, today) && // Date is in the past
          app.status !== 'completed' &&       // Not marked as completed
          app.status !== 'cancelled' &&       // Not marked as cancelled
          app.status !== 'scheduled'          // Not marked as scheduled
        );
      });

      // Sort by date (oldest first)
      unresolved.sort((a, b) =>
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );

      setUnresolvedAppointments(unresolved);
    };

    fetchUnresolvedAppointments();
  }, [patientId, dentalAppointments, meditouchAppointments, getPatientAppointments]);

  // If no unresolved appointments, don't render anything
  if (unresolvedAppointments.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <div className="flex-1">
        <AlertTitle className="text-amber-800">
          {unresolvedAppointments.length} Past {unresolvedAppointments.length === 1 ? 'Appointment' : 'Appointments'} Need Attention
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          <p className="mb-2">
            The following past {unresolvedAppointments.length === 1 ? 'appointment has' : 'appointments have'} not been marked as completed, cancelled, or rescheduled:
          </p>
          <ul className="space-y-2 mb-3">
            {unresolvedAppointments.slice(0, 3).map((app) => (
              <li key={app.id} className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="font-medium">{format(parseISO(app.date), 'MMM d, yyyy')}</span>
                <span>-</span>
                <span>{app.time}</span>
                <span>-</span>
                <span>{app.patient_name}</span>
                <span>-</span>
                <span>{app.service}</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                  {app.status}
                </Badge>
              </li>
            ))}
            {unresolvedAppointments.length > 3 && (
              <li className="text-amber-600 font-medium">
                +{unresolvedAppointments.length - 3} more unresolved {unresolvedAppointments.length - 3 === 1 ? 'appointment' : 'appointments'}
              </li>
            )}
          </ul>

        </AlertDescription>
      </div>
    </Alert>
  );
};

export default UnresolvedAppointmentsAlert;
