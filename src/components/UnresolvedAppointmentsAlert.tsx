import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isBefore } from 'date-fns';
import { useAppointments } from '@/contexts/AppointmentContext';
import { useClinic } from '@/contexts/ClinicContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, ArrowRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '@/types/appointment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UnresolvedAppointmentsAlertProps {
  patientId?: string; // Optional - if provided, only show unresolved appointments for this patient
  clinicType?: 'dental' | 'meditouch' | 'both'; // Optional - if provided, only show appointments for this clinic type
}

/**
 * Component that displays an alert for past appointments that haven't been marked as completed or cancelled
 */
export const UnresolvedAppointmentsAlert = ({ patientId, clinicType }: UnresolvedAppointmentsAlertProps) => {
  const { dentalAppointments, meditouchAppointments, getPatientAppointments } = useAppointments();
  const { activeClinic } = useClinic();
  const [unresolvedAppointments, setUnresolvedAppointments] = useState<Appointment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Determine which clinic type to use
  const effectiveClinicType = clinicType || activeClinic || 'both';

  // Find unresolved past appointments
  useEffect(() => {
    const fetchUnresolvedAppointments = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison

      let allAppointments: Appointment[] = [];

      // If patientId is provided, fetch appointments for that patient only
      if (patientId) {
        try {
          // Get appointments for this specific patient with the specified clinic type
          const patientAppointments = await getPatientAppointments(patientId, effectiveClinicType);
          allAppointments = patientAppointments;
        } catch (error) {
          console.error('Error fetching patient appointments:', error);
          allAppointments = [];
        }
      } else {
        // Otherwise, filter appointments based on clinic type
        if (effectiveClinicType === 'dental') {
          allAppointments = [...dentalAppointments];
        } else if (effectiveClinicType === 'meditouch') {
          allAppointments = [...meditouchAppointments];
        } else {
          // 'both'
          allAppointments = [...dentalAppointments, ...meditouchAppointments];
        }
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

      // Sort by date (oldest first), then by time (earliest first)
      unresolved.sort((a, b) => {
        // First compare by date
        const dateComparison = parseISO(a.date).getTime() - parseISO(b.date).getTime();

        // If dates are the same, compare by time
        if (dateComparison === 0) {
          // Convert time strings to comparable values (e.g., "9:00 AM" to minutes since midnight)
          const getTimeMinutes = (timeStr: string) => {
            const [time, modifier] = timeStr.split(' ');
            let hours = Number(time.split(':')[0]);
            const minutes = Number(time.split(':')[1]);

            // Convert to 24-hour format
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            return hours * 60 + minutes;
          };

          return getTimeMinutes(a.time) - getTimeMinutes(b.time);
        }

        return dateComparison;
      });

      setUnresolvedAppointments(unresolved);
    };

    fetchUnresolvedAppointments();
  }, [patientId, dentalAppointments, meditouchAppointments, getPatientAppointments, effectiveClinicType]);

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
              <li className="text-amber-600 font-medium cursor-pointer hover:underline" onClick={() => setIsDialogOpen(true)}>
                +{unresolvedAppointments.length - 3} more unresolved {unresolvedAppointments.length - 3 === 1 ? 'appointment' : 'appointments'}
              </li>
            )}
          </ul>

          {/* No button here as requested */}
        </AlertDescription>
      </div>

      {/* Dialog to show all unresolved appointments */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unresolved Past Appointments</DialogTitle>
            <DialogDescription>
              These appointments need to be marked as completed, cancelled, or rescheduled.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-50 text-amber-800 border-b border-amber-200">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Time</th>
                  <th className="text-left py-2 px-3">Patient</th>
                  <th className="text-left py-2 px-3">Service</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Display appointments sorted by date and time */}
                {[...unresolvedAppointments].map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setIsDialogOpen(false);
                      navigate('/appointments');
                    }}
                  >
                    <td className="py-2 px-3">{format(parseISO(app.date), 'MMM d, yyyy')}</td>
                    <td className="py-2 px-3">{app.time}</td>
                    <td className="py-2 px-3">{app.patient_name}</td>
                    <td className="py-2 px-3">{app.service}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        {app.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Alert>
  );
};

export default UnresolvedAppointmentsAlert;
