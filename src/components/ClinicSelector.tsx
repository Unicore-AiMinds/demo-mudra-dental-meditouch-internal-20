
import { useClinic, ClinicType } from '@/contexts/ClinicContext';
import { DentalMetrixLogo, MeditouchLogo } from '@/assets/logos';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClinicSelectorProps {
  variant?: 'tabs' | 'buttons';
  className?: string;
}

const ClinicSelector = ({ variant = 'tabs', className = '' }: ClinicSelectorProps) => {
  const { activeClinic, setActiveClinic } = useClinic();
  
  const handleClinicChange = (value: string) => {
    setActiveClinic(value as ClinicType);
  };

  if (variant === 'tabs') {
    return (
      <Tabs 
        value={activeClinic} 
        onValueChange={handleClinicChange}
        className={`w-full max-w-md ${className}`}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="dental" 
            className="data-[state=active]:bg-dental-light data-[state=active]:text-dental-primary"
          >
            Dental Metrix
          </TabsTrigger>
          <TabsTrigger 
            value="meditouch" 
            className="data-[state=active]:bg-meditouch-light data-[state=active]:text-meditouch-primary"
          >
            Meditouch
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );
  }

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <Button
        variant={activeClinic === 'dental' ? 'default' : 'outline'}
        onClick={() => setActiveClinic('dental')}
        className={`flex items-center gap-2 ${activeClinic === 'dental' ? 'bg-dental-primary hover:bg-dental-dark' : ''}`}
      >
        <div className="w-5 h-5 bg-dental-primary rounded flex items-center justify-center text-white font-bold text-xs">
          D
        </div>
        <span>Dental Metrix</span>
      </Button>
      <Button
        variant={activeClinic === 'meditouch' ? 'default' : 'outline'}
        onClick={() => setActiveClinic('meditouch')}
        className={`flex items-center gap-2 ${activeClinic === 'meditouch' ? 'bg-meditouch-primary hover:bg-meditouch-dark' : ''}`}
      >
        <div className="w-5 h-5 bg-meditouch-primary rounded flex items-center justify-center text-white font-bold text-xs">
          M
        </div>
        <span>Meditouch</span>
      </Button>
    </div>
  );
};

export default ClinicSelector;
