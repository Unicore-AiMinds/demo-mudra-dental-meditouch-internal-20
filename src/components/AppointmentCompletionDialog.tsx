import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AppointmentType } from '@/types/appointment';

// Props interface
interface AppointmentCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentType;
  onPaymentStatusChange?: (appointmentId: string, status: 'paid' | 'unpaid') => void;
}

const AppointmentCompletionDialog: React.FC<AppointmentCompletionDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  onPaymentStatusChange,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);

  // Default to unpaid if not specified
  const paymentStatus = appointment.paymentStatus || 'unpaid';

  const handleGoToPatientRegistry = () => {
    // Close the dialog
    onClose();

    // Navigate to patient details page with dental charting tab selected
    const patientId = appointment.patientId || `PT00${appointment.patient.charAt(0)}`;

    // Navigate to the patient details page with the dental-charting tab parameter
    navigate(`/patients/${patientId}?tab=dental-charting`);
  };

  const handlePaymentStatusClick = () => {
    setIsPaymentConfirmOpen(true);
  };

  const confirmPaymentStatusChange = () => {
    // Call the parent handler to update the payment status
    if (onPaymentStatusChange) {
      onPaymentStatusChange(appointment.id, paymentStatus === 'paid' ? 'unpaid' : 'paid');
    }

    // Show toast notification
    toast({
      title: "Payment Status Updated",
      description: `The payment status has been updated to ${paymentStatus === 'paid' ? 'Unpaid' : 'Paid'}.`,
    });

    // Close the confirmation dialog
    setIsPaymentConfirmOpen(false);
  };

  // Main dialog with payment status
  return (
    <>
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
              <p className="mb-2">
                Service: <span className="font-semibold">{appointment.service}</span>
              </p>
            )}

            <div className="flex items-center mt-2 mb-4">
              <p className="mr-2">Payment Status:</p>
              <Badge
                variant={paymentStatus === 'paid' ? 'default' : 'outline'}
                className={`cursor-pointer hover:opacity-80 ${paymentStatus === 'paid' ? 'bg-green-500' : ''}`}
                onClick={handlePaymentStatusClick}
              >
                {paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>

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

      {/* Payment Status Confirmation Dialog */}
      <Dialog open={isPaymentConfirmOpen} onOpenChange={setIsPaymentConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the payment status for this appointment?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You are about to mark this appointment as
              <span className="font-semibold">
                {paymentStatus === 'paid' ? ' Unpaid' : ' Paid'}
              </span>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmPaymentStatusChange}
              className={paymentStatus === 'paid'
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-green-600 hover:bg-green-700'}
            >
              {paymentStatus === 'paid'
                ? 'Mark as Unpaid'
                : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentCompletionDialog;
