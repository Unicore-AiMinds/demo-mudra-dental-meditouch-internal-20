import { useState, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isBefore } from 'date-fns';
import { useAppointments } from '@/contexts/AppointmentContext';
import { usePatients } from '@/contexts/PatientContext';
import { useClinic } from '@/contexts/ClinicContext';
import { useDoctors } from '@/contexts/DoctorContext';
import { Phone, Calendar, Download, Filter, CalendarIcon } from 'lucide-react';
import { Appointment } from '@/types/appointment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { formatDateForExport, formatDateForFilename } from '@/utils/dateFormatter';

/**
 * Component that displays all created appointments
 * Entries are removed when appointments are marked as completed or cancelled
 */
type DateFilter = 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'next7Days' | 'thisMonth' | 'customRange';

export const AppointmentList = () => {
  const { dentalAppointments, meditouchAppointments } = useAppointments();
  const { patients } = usePatients();
  const { activeClinic } = useClinic();
  const { doctors } = useDoctors();
  const [appointmentList, setAppointmentList] = useState<(Appointment & { phone?: string })[]>([]);
  const [filteredAppointmentList, setFilteredAppointmentList] = useState<(Appointment & { phone?: string })[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [phoneListOnly, setPhoneListOnly] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');

  // Find all appointments for patients without WhatsApp (excluding completed/cancelled)
  useEffect(() => {
    const fetchAppointmentList = async () => {
      // Combine all appointments based on active clinic
      let allAppointments: Appointment[] = [];
      
      if (activeClinic === 'dental') {
        allAppointments = [...dentalAppointments];
      } else if (activeClinic === 'meditouch') {
        allAppointments = [...meditouchAppointments];
      } else {
        allAppointments = [...dentalAppointments, ...meditouchAppointments];
      }

      // Filter out completed and cancelled appointments
      const activeAppointments = allAppointments.filter(app => 
        app.status !== 'completed' && app.status !== 'cancelled'
      );

      // Include all active appointments (no filtering by WhatsApp)
      const phoneCallAppointments = activeAppointments;

      // Add phone numbers to appointments
      const appointmentsWithPhone = phoneCallAppointments.map(app => {
        const patient = patients.find(p => p.id === app.patient_id);
        return {
          ...app,
          phone: patient?.phone
        };
      });

      // Sort by date first, then by time
      appointmentsWithPhone.sort((a, b) => {
        // First compare by date
        const dateComparison = parseISO(a.date).getTime() - parseISO(b.date).getTime();

        // If dates are the same, compare by time
        if (dateComparison === 0) {
          const getTimeMinutes = (timeStr: string) => {
            const [time, modifier] = timeStr.split(' ');
            let hours = Number(time.split(':')[0]);
            const minutes = Number(time.split(':')[1]);

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            return hours * 60 + minutes;
          };

          return getTimeMinutes(a.time) - getTimeMinutes(b.time);
        }

        return dateComparison;
      });

      setAppointmentList(appointmentsWithPhone);
    };

    fetchAppointmentList();
  }, [dentalAppointments, meditouchAppointments, patients, activeClinic]);

  // Filter appointments by date and phone list
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...appointmentList];
      const today = new Date();

      // Apply date filter
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(app => isToday(parseISO(app.date)));
          break;
        case 'tomorrow':
          filtered = filtered.filter(app => isTomorrow(parseISO(app.date)));
          break;
        case 'thisWeek':
          filtered = filtered.filter(app => isThisWeek(parseISO(app.date)));
          break;
        case 'next7Days':
          const next7Days = addDays(today, 7);
          filtered = filtered.filter(app => {
            const appDate = parseISO(app.date);
            return isWithinInterval(appDate, { start: today, end: next7Days });
          });
          break;
        case 'thisMonth':
          filtered = filtered.filter(app => isThisMonth(parseISO(app.date)));
          break;
        case 'customRange':
          if (customStartDate && customEndDate) {
            filtered = filtered.filter(app => {
              const appDate = parseISO(app.date);
              return isWithinInterval(appDate, { start: customStartDate, end: customEndDate });
            });
          }
          break;
        case 'all':
        default:
          // No date filtering, show all appointments
          break;
      }

      // Apply doctor filter
      if (selectedDoctor !== 'all') {
        filtered = filtered.filter(app => app.doctor === selectedDoctor);
      }

      // Apply phone list filter (only patients without WhatsApp)
      if (phoneListOnly) {
        filtered = filtered.filter(app => {
          const patient = patients.find(p => p.id === app.patient_id);
          return patient && !patient.has_whatsapp;
        });
      }

      setFilteredAppointmentList(filtered);
    };

    applyFilters();
  }, [appointmentList, dateFilter, customStartDate, customEndDate, phoneListOnly, selectedDoctor, patients]);

  // Export appointments to CSV
  const exportToCSV = () => {
    // Create CSV content from the filtered appointment list data
    const headers = ['Date', 'Time', 'Patient', 'Phone Number', 'Service', 'Doctor', 'Clinic Type'];
    
    const csvContent = [
      headers.join(','),
      ...filteredAppointmentList.map(app => {
        return [
          `"${formatDateForExport(app.date)}"`,
          `"${app.time || ''}"`,
          `"${app.patient_name || ''}"`,
          `"${app.phone || ''}"`,
          `"${app.service || ''}"`,
          `"${app.doctor || ''}"`,
          `"${app.clinic_type || ''}"`,
        ].join(',');
      })
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    const filename = `appointments_export_${formatDateForFilename()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${filteredAppointmentList.length} appointment records exported to CSV.`,
    });
  };

  const handleClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <div 
        className="cursor-pointer text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
        onClick={handleClick}
      >
        <Phone className="h-4 w-4" />
        <span>Appointment List ({filteredAppointmentList.length})</span>
      </div>

      {/* Dialog to show appointment list */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Appointment List
            </DialogTitle>
            <DialogDescription>
              All created appointments. Entries will be removed when appointments are marked as completed or cancelled.
            </DialogDescription>
          </DialogHeader>

          {/* Filter Controls */}
          <div className="mb-4 space-y-3">
            {/* Date Filter and Export Button Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filter by Date:</span>
                </div>
                
                <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select date filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Appointments</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="next7Days">Next 7 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="customRange">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.name}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {dateFilter === 'customRange' && (
                <div className="flex items-center gap-2">
                  <Popover open={isCustomRangeOpen} onOpenChange={setIsCustomRangeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate && customEndDate
                          ? `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d, yyyy')}`
                          : 'Select date range'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div>
                              <label className="text-sm font-medium">Start Date</label>
                              <CalendarComponent
                                mode="single"
                                selected={customStartDate}
                                onSelect={setCustomStartDate}
                                className="rounded-md border"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">End Date</label>
                              <CalendarComponent
                                mode="single"
                                selected={customEndDate}
                                onSelect={setCustomEndDate}
                                disabled={(date) => customStartDate ? date < customStartDate : false}
                                className="rounded-md border"
                              />
                            </div>
                          </div>
                          <Button 
                            onClick={() => setIsCustomRangeOpen(false)}
                            className="w-full"
                          >
                            Apply Range
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                )}
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                onClick={exportToCSV}
                title="Export Appointments to CSV"
              >
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>

            {/* Phone List Filter */}
            <div className="flex items-center gap-2">
              <Checkbox 
                id="phoneList"
                checked={phoneListOnly}
                onCheckedChange={(checked) => setPhoneListOnly(checked as boolean)}
              />
              <Label htmlFor="phoneList" className="text-sm font-medium cursor-pointer">
                Phone List (patients without WhatsApp only)
              </Label>
            </div>
          </div>

          <div>
            {filteredAppointmentList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active appointments!</p>
                <p className="text-sm">All appointments have been completed or cancelled.</p>
              </div>
            ) : (
              <>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-50 text-blue-800 border-b border-blue-200">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Time</th>
                      <th className="text-left py-2 px-3">Patient</th>
                      <th className="text-left py-2 px-3">Doctor</th>
                      <th className="text-left py-2 px-3">Service</th>
                      <th className="text-left py-2 px-3">Phone Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointmentList.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3">{format(parseISO(app.date), 'MMM d, yyyy')}</td>
                        <td className="py-2 px-3">{app.time}</td>
                        <td className="py-2 px-3">{app.patient_name}</td>
                        <td className="py-2 px-3">{app.doctor || '-'}</td>
                        <td className="py-2 px-3">{app.service}</td>
                        <td className="py-2 px-3">
                          {app.phone ? (
                            <a
                              href={`tel:${app.phone}`}
                              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                              <Phone className="h-4 w-4" />
                              {app.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400">No phone</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
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
    </>
  );
};

export default AppointmentList;