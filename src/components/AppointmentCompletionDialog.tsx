import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

// Simple props interface
interface AppointmentCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any; // Using any to avoid type issues
}

const AppointmentCompletionDialog: React.FC<AppointmentCompletionDialogProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  console.log("AppointmentCompletionDialog rendered with:", { isOpen, appointment });
  const navigate = useNavigate();

  const handleGoToPatientRegistry = () => {
    // Close the dialog
    onClose();

    // Navigate to patient details page with dental charting tab selected
    const patientId = appointment.patientId || `PT00${appointment.patient.charAt(0)}`;

    // Navigate to the patient details page with the dental-charting tab parameter
    navigate(`/patients/${patientId}?tab=dental-charting`);
  };

  // Simple dialog with minimal content
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Service Completed Successfully</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-2">
            The appointment for <span className="font-semibold">{appointment?.patient || 'Patient'}</span> has been marked as completed.
          </p>

          {appointment?.service && (
            <p className="mb-4">
              Service: <span className="font-semibold">{appointment.service}</span>
            </p>
          )}

          <div className="mt-6 space-y-4">
            <Button
              className="w-full"
              onClick={handleGoToPatientRegistry}
            >
              Go to Patient Registry
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              To view patient details or add additional services
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentCompletionDialog;
