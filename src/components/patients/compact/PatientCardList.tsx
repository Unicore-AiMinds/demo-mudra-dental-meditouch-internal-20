import type { ReactNode } from 'react';
import type { Row } from '@tanstack/react-table';
import { CalendarRange, ChevronDown, Edit, Eye, Phone, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Patient } from '@/contexts/PatientContext';

interface PatientCardListProps {
  rows: Row<Patient>[];
  lastVisitDates: Record<string, string>;
  renderClinicBadge: (clinic: Patient['clinic']) => ReactNode;
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  canEdit: boolean;
  canDelete: boolean;
}

// Patient list for phones/tablets: one card per patient with the same details, fallbacks
// and actions menu as the desktop table row.
const PatientCardList = ({
  rows,
  lastVisitDates,
  renderClinicBadge,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: PatientCardListProps) => {
  if (!rows.length) {
    return <div className="h-24 flex items-center justify-center text-sm">No patients found</div>;
  }

  return (
    <div className="space-y-2">
      {rows.map(row => {
        const patient = row.original;
        const phone = row.getValue('phone') as string;
        const createdAt = row.getValue('created_at') as string;
        const lastVisitDate = lastVisitDates[patient.id] || '';

        return (
          <div
            key={row.id}
            className="cursor-pointer rounded-lg border bg-white p-3 text-sm"
            onClick={() => onView(patient)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium">{row.getValue('name')}</div>
              {renderClinicBadge(row.getValue('clinic') as Patient['clinic'])}
            </div>
            <div className="mt-1 text-muted-foreground">
              <span className="capitalize">{row.getValue('gender')}</span>
              {' · '}{row.getValue('age')}
              {' · '}{(row.getValue('city') as string) || 'Not provided'}
              {' · '}{(row.getValue('blood_group') as string) || 'Not provided'}
            </div>
            <div className="mt-1 flex items-center">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              {phone ? `+91 ${phone}` : 'Not provided'}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-muted-foreground">
              <span className="flex items-center">
                <CalendarRange className="mr-2 h-4 w-4" />
                {lastVisitDate ? new Date(lastVisitDate).toLocaleDateString() : 'No visits'}
              </span>
              <span>Added {createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown'}</span>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(patient)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEdit(patient)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Patient
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(patient)} className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Patient
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PatientCardList;
