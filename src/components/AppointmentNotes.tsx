import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AppointmentNotesProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export const AppointmentNotes: React.FC<AppointmentNotesProps> = ({
  value,
  onChange,
  id = 'notes',
  placeholder = 'Add any special requirements or information'
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Notes</Label>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </div>
  );
};

export default AppointmentNotes;
