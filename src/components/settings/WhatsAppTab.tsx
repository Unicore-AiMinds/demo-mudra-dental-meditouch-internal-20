import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, RefreshCw, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { useAuth } from '@/contexts/AuthContext';

interface WhatsAppStatus {
  status: 'disconnected' | 'qr_needed' | 'connected';
  qr?: string; // data URL for QR image
}

const WhatsAppTab = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({ status: 'disconnected' });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { user } = useAuth();

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data: WhatsAppStatus = await res.json();
      setStatus(data);
    } catch {
      setStatus({ status: 'disconnected' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/whatsapp/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      toast({ title: 'WhatsApp disconnected', description: 'Session has been removed.' });

      // Log to audit
      try {
        await logAction({
          action_category: 'settings',
          action_type: 'Disconnect WhatsApp',
          target_entity: 'WhatsApp',
          details: `WhatsApp session disconnected by ${user?.name || 'Unknown user'}`,
          clinic_type: 'dental',
        });
      } catch (auditError) {
        console.error('Failed to log WhatsApp disconnect audit:', auditError);
      }

      fetchStatus();
    } catch {
      toast({ title: 'Error', description: 'Failed to disconnect WhatsApp.', variant: 'destructive' });
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              WhatsApp
            </CardTitle>
            <CardDescription className="mt-1">
              Link your WhatsApp account to send appointment reminders and follow-up messages.
            </CardDescription>
          </div>
          <Badge variant={status.status === 'connected' ? 'default' : 'secondary'}
                 className={status.status === 'connected' ? 'bg-green-600 hover:bg-green-700' : ''}>
            {status.status === 'connected' ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {status.status === 'connected' ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="rounded-full bg-green-100 p-4">
              <Smartphone className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">WhatsApp is connected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Messages will be sent through the linked WhatsApp account.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loggingOut}>
                  {loggingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                  Disconnect WhatsApp
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect WhatsApp?</AlertDialogTitle>
                  <AlertDialogDescription className="flex flex-col gap-4">
                    <span>This will disconnect the linked WhatsApp account.</span>
                    <span>Appointment reminders and follow-up messages will not be sent.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : status.qr ? (
          <div className="flex flex-col items-center gap-6 py-4">
            <img src={status.qr} alt="WhatsApp QR Code" className="w-64 h-64 rounded-lg border" />
            <div className="text-center">
              <p className="text-sm font-medium">Scan this QR code with WhatsApp</p>
              <p className="text-xs text-muted-foreground mt-1">
                Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Link a Device
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh QR
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Waiting for QR code...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure the backend server is running. The QR code will appear automatically.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppTab;
