import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Database } from 'lucide-react';

const POLL_INTERVAL = 2_000; // 2 seconds

const BackupOverlay: React.FC = () => {
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/backup/status');
        if (res.ok) {
          const data = await res.json();
          setInProgress(data.inProgress);
        }
      } catch {
        // Server unreachable — don't block UI
      }
    };

    checkStatus();
    timer = setInterval(checkStatus, POLL_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <Dialog open={inProgress} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Database className="h-5 w-5" />
            Backup In Progress
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Your clinic data is being backed up. Please wait while this process completes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg font-medium text-gray-700">Please wait...</p>
          <p className="text-sm text-gray-500 mt-2">
            Do not close the application. This may take a few minutes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupOverlay;
