import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLabWork } from '@/contexts/LabWorkContext';
import { useAppointments } from '@/contexts/AppointmentContext';
import { usePatients } from '@/contexts/PatientContext';
import { Calendar, Users, PackageOpen, Microscope, Clock } from 'lucide-react';
import StockAlerts from '@/components/StockAlerts';
import StockAlertsCount from '@/components/StockAlertsCount';
import StockAlertsAnalytics from '@/components/StockAlertsAnalytics';
import PatientsAnalytics from '@/components/PatientsAnalytics';
import LabWorkAnalytics from '@/components/LabWorkAnalytics';
import PopularServicesCount from '@/components/PopularServicesCount';
import PopularServicesAnalytics from '@/components/PopularServicesAnalytics';
import ServicesCompletedCount from '@/components/ServicesCompletedCount';
import ServicesCompletedAnalytics from '@/components/ServicesCompletedAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import UnresolvedAppointmentsAlert from '@/components/UnresolvedAppointmentsAlert';
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

const Dashboard = () => {
  const { activeClinic, isDental, isMeditouch } = useClinic();
  const { user } = useAuth();
  const { getOverdueCount, getPendingCount, labJobs, isOverdue } = useLabWork();
  const { dentalAppointments, meditouchAppointments, getAppointmentsByDate } = useAppointments();
  const { patients } = usePatients();
  const navigate = useNavigate();

  // State for real-time data
  const [todayAppointments, setTodayAppointments] = useState<{dental: number, meditouch: number}>({
    dental: 0,
    meditouch: 0
  });
  const [weekAppointments, setWeekAppointments] = useState<{dental: number, meditouch: number}>({
    dental: 0,
    meditouch: 0
  });
  const [monthAppointments, setMonthAppointments] = useState<{dental: number, meditouch: number}>({
    dental: 0,
    meditouch: 0
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [appointmentView, setAppointmentView] = useState<'today' | 'week' | 'month'>('today');

  // Get today's date
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  // Calculate real stats
  const stats = {
    dental: {
      appointments: todayAppointments.dental,
      patients: patients.filter(p => p.clinic === 'dental' || p.clinic === 'both').length,
      stockAlerts: 0, // This will be handled by StockAlertsCount component
      labWorkPending: getPendingCount() + getOverdueCount()
    },
    meditouch: {
      appointments: todayAppointments.meditouch,
      patients: patients.filter(p => p.clinic === 'meditouch' || p.clinic === 'both').length,
    }
  };

  const isAdmin = user?.role === 'admin';
  const isClinicUser = user?.role === 'doctor' || user?.role === 'receptionist';

  // Fetch appointments for today, week, and month
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Calculate date ranges
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        // Get all days in week and month
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Fetch today's appointments
        const [dentalToday, meditouchToday] = await Promise.all([
          getAppointmentsByDate(today, 'dental'),
          getAppointmentsByDate(today, 'meditouch')
        ]);

        // Fetch week appointments
        const weekAppointmentPromises = weekDays.flatMap(day => [
          getAppointmentsByDate(day, 'dental'),
          getAppointmentsByDate(day, 'meditouch')
        ]);
        const weekAppointmentResults = await Promise.all(weekAppointmentPromises);

        // Fetch month appointments
        const monthAppointmentPromises = monthDays.flatMap(day => [
          getAppointmentsByDate(day, 'dental'),
          getAppointmentsByDate(day, 'meditouch')
        ]);
        const monthAppointmentResults = await Promise.all(monthAppointmentPromises);

        // Process today's appointments
        const activeDentalToday = dentalToday.filter(apt =>
          apt.status !== 'cancelled' && apt.status !== 'completed'
        );
        const activeMeditouchToday = meditouchToday.filter(apt =>
          apt.status !== 'cancelled' && apt.status !== 'completed'
        );

        setTodayAppointments({
          dental: activeDentalToday.length,
          meditouch: activeMeditouchToday.length
        });

        // Process week appointments
        const weekDentalAppts = weekAppointmentResults.filter((_, index) => index % 2 === 0).flat();
        const weekMeditouchAppts = weekAppointmentResults.filter((_, index) => index % 2 === 1).flat();

        const activeWeekDental = weekDentalAppts.filter(apt =>
          apt.status !== 'cancelled' && apt.status !== 'completed'
        );
        const activeWeekMeditouch = weekMeditouchAppts.filter(apt =>
          apt.status !== 'cancelled' && apt.status !== 'completed'
        );

        setWeekAppointments({
          dental: activeWeekDental.length,
          meditouch: activeWeekMeditouch.length
        });

        // Process month appointments
        const monthDentalAppts = monthAppointmentResults.filter((_, index) => index % 2 === 0).flat();
        const monthMeditouchAppts = monthAppointmentResults.filter((_, index) => index % 2 === 1).flat();

        const activeMonthDental = monthDentalAppts.filter(apt =>
          apt.status !== 'cancelled' && apt.status !== 'completed'
        );
        const activeMonthMeditouch = monthMeditouchAppts.filter(apt =>
          apt.status !== 'cancelled' && apt.status !== 'completed'
        );

        setMonthAppointments({
          dental: activeMonthDental.length,
          meditouch: activeMonthMeditouch.length
        });

        // Set today's schedule for the current clinic and resolve patient names
        const currentClinicAppointments = isDental ? activeDentalToday : activeMeditouchToday;

        // Map patient names to appointments
        const appointmentsWithPatientNames = currentClinicAppointments.map(appointment => {
          const patient = patients.find(p => p.id === appointment.patient_id);
          return {
            ...appointment,
            patient_name: patient ? patient.name : 'Unknown Patient'
          };
        });

        // Sort by time and take first 5
        const sortedAppointments = appointmentsWithPatientNames
          .sort((a, b) => a.time.localeCompare(b.time))
          .slice(0, 5);

        setTodaySchedule(sortedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, [today, todayString, getAppointmentsByDate, isDental, patients]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's an overview of {isDental ? 'Dental Metrix' : 'Meditouch'} Clinic.
        </p>
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-shadow card-hover">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-medium">
                {appointmentView === 'today' ? "Today's Appointments" :
                 appointmentView === 'week' ? "This Week's Appointments" :
                 "This Month's Appointments"}
              </CardTitle>
              <Calendar className={`h-4 w-4 mx-auto mt-1 ${
                isDental ? 'text-dental-primary' : 'text-meditouch-primary'
              }`} />
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Main Count Display */}
              <div className="text-center cursor-pointer" onClick={() => navigate('/appointments')}>
                <div className="text-2xl font-bold">
                  {appointmentView === 'today' ?
                    (isDental ? stats.dental.appointments : stats.meditouch.appointments) :
                   appointmentView === 'week' ?
                    (isDental ? weekAppointments.dental : weekAppointments.meditouch) :
                    (isDental ? monthAppointments.dental : monthAppointments.meditouch)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {appointmentView === 'today' ? 'Today' :
                   appointmentView === 'week' ? 'This Week' :
                   'This Month'}
                </p>
              </div>

              {/* Filter Toggle Buttons */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    appointmentView === 'today'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setAppointmentView('today')}
                >
                  Today
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    appointmentView === 'week'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setAppointmentView('week')}
                >
                  Week
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    appointmentView === 'month'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setAppointmentView('month')}
                >
                  Month
                </button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="card-shadow card-hover cursor-pointer transition-all hover:scale-105"
            onClick={() => navigate('/patients')}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className={`h-4 w-4 mx-auto mt-1 ${
                isDental ? 'text-dental-primary' : 'text-meditouch-primary'
              }`} />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-24">
              <div className="text-2xl font-bold text-center">
                {isDental ? stats.dental.patients : stats.meditouch.patients}
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-base text-muted-foreground font-semibold text-center">
                  <PatientsAnalytics />
                </p>
              </div>
            </CardContent>
          </Card>

          {isDental && (
            <>
              <Card
                className="card-shadow card-hover cursor-pointer transition-all hover:scale-105"
                onClick={() => navigate('/stock')}
              >
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <PackageOpen className="h-4 w-4 mx-auto mt-1 text-dental-primary" />
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-24">
                  <div className="text-2xl font-bold text-center">
                    {/* Use the StockContext to get the actual count */}
                    <StockAlertsCount />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-base text-muted-foreground font-semibold text-center">
                      <StockAlertsAnalytics />
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="card-shadow card-hover cursor-pointer transition-all hover:scale-105"
                onClick={() => navigate('/lab')}
              >
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm font-medium">Lab Work Pending</CardTitle>
                  <Microscope className="h-4 w-4 mx-auto mt-1 text-dental-primary" />
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-24">
                  <div className="text-2xl font-bold text-center">{stats.dental.labWorkPending}</div>
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-base text-muted-foreground font-semibold text-center">
                      <LabWorkAnalytics />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isMeditouch && (
            <>
              <Card
                className="card-shadow card-hover cursor-pointer transition-all hover:scale-105"
                onClick={() => navigate('/appointments')}
              >
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm font-medium">Popular Services</CardTitle>
                  <Calendar className="h-4 w-4 mx-auto mt-1 text-meditouch-primary" />
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-24">
                  <div className="text-2xl font-bold text-center">
                    <PopularServicesCount />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-base text-muted-foreground font-semibold text-center">
                      <PopularServicesAnalytics />
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="card-shadow card-hover cursor-pointer transition-all hover:scale-105"
                onClick={() => navigate('/appointments')}
              >
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
                  <Clock className="h-4 w-4 mx-auto mt-1 text-meditouch-primary" />
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-24">
                  <div className="text-2xl font-bold text-center">
                    <ServicesCompletedCount />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-base text-muted-foreground font-semibold text-center">
                      <ServicesCompletedAnalytics />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full md:col-span-1 card-shadow card-hover flex flex-col">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Upcoming appointments for today</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-3 min-h-0">
              {todaySchedule.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {todaySchedule.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`flex justify-between items-center p-2 rounded-md ${
                        isDental
                          ? 'bg-dental-light border border-dental-light'
                          : 'bg-meditouch-light border border-meditouch-light'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {appointment.patient_name || 'Patient Name'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.time} - {appointment.service}
                        </p>
                      </div>
                      <div className={`text-xs ${
                        isDental ? 'bg-dental-primary' : 'bg-meditouch-primary'
                      } text-white px-2 py-1 rounded`}>
                        {isDental ? (appointment.doctor || 'Doctor') : 'Meditouch'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No appointments scheduled for today</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate('/appointments')}
                    >
                      Schedule Appointment
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/appointments')}
              >
                View All Appointments
              </Button>
            </div>
          </CardContent>
        </Card>

        {isDental && isAdmin && (
          <>
            <StockAlerts />

            <Card className="card-shadow card-hover flex flex-col">
              <CardHeader>
                <CardTitle>Lab Work</CardTitle>
                <CardDescription>Pending lab work items</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-3 min-h-0">
                  {labJobs
                    .filter(job => job.status !== 'completed')
                    .sort((a, b) => {
                      // Sort by overdue first, then by expected delivery date
                      if (isOverdue(a) && !isOverdue(b)) return -1;
                      if (!isOverdue(a) && isOverdue(b)) return 1;

                      const dateA = new Date(a.expectedDelivery).getTime();
                      const dateB = new Date(b.expectedDelivery).getTime();
                      return dateA - dateB;
                    })
                    .slice(0, 5).length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {labJobs
                        .filter(job => job.status !== 'completed')
                        .sort((a, b) => {
                          // Sort by overdue first, then by expected delivery date
                          if (isOverdue(a) && !isOverdue(b)) return -1;
                          if (!isOverdue(a) && isOverdue(b)) return 1;

                          const dateA = new Date(a.expectedDelivery).getTime();
                          const dateB = new Date(b.expectedDelivery).getTime();
                          return dateA - dateB;
                        })
                        .slice(0, 5)
                        .map(job => {
                          const isJobOverdue = isOverdue(job);
                          const isReady = job.status === 'ready';

                          // Format the due date text
                          let dueText = '';
                          const today = new Date();
                          const dueDate = new Date(job.expectedDelivery);
                          const diffTime = dueDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                          if (isJobOverdue) {
                            dueText = diffDays === -1
                              ? 'Due: Yesterday'
                              : `Due: ${Math.abs(diffDays)} days ago`;
                          } else if (diffDays === 0) {
                            dueText = 'Due: Today';
                          } else if (diffDays === 1) {
                            dueText = 'Due: Tomorrow';
                          } else {
                            dueText = `Due: In ${diffDays} days`;
                          }

                          if (isReady) {
                            dueText = 'Ready for pickup';
                          }

                          return (
                            <div
                              key={job.id}
                              className={`flex justify-between items-center p-2 rounded-md ${
                                isJobOverdue
                                  ? 'bg-red-50 border border-red-100'
                                  : isReady
                                    ? 'bg-green-50 border border-green-100'
                                    : 'bg-blue-50 border border-blue-100'
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium">{job.labWorkType} for {job.patient}</p>
                                <p className="text-xs text-muted-foreground">{dueText}</p>
                              </div>
                              <div
                                className={`text-xs ${
                                  isJobOverdue
                                    ? 'bg-red-500'
                                    : isReady
                                      ? 'bg-green-500'
                                      : 'bg-blue-500'
                                } text-white px-2 py-1 rounded`}
                              >
                                {isJobOverdue
                                  ? 'Overdue'
                                  : isReady
                                    ? 'Ready'
                                    : 'Pending'
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Microscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending lab work</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => navigate('/lab')}
                        >
                          Create Lab Entry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/lab')}
                  >
                    Manage Lab Work
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {isMeditouch && (
          <Card className="md:col-span-1 lg:col-span-2 card-shadow card-hover flex flex-col">
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Recently registered patients</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-3 min-h-0">
                {patients
                  .filter(p => p.clinic === 'meditouch' || p.clinic === 'both')
                  .sort((a, b) => {
                    // Sort by creation date, most recent first
                    const dateA = new Date(a.created_at || '').getTime();
                    const dateB = new Date(b.created_at || '').getTime();
                    return dateB - dateA;
                  })
                  .slice(0, 5).length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {patients
                      .filter(p => p.clinic === 'meditouch' || p.clinic === 'both')
                      .sort((a, b) => {
                        // Sort by creation date, most recent first
                        const dateA = new Date(a.created_at || '').getTime();
                        const dateB = new Date(b.created_at || '').getTime();
                        return dateB - dateA;
                      })
                      .slice(0, 5)
                      .map((patient) => {
                        // Calculate days since registration
                        const createdDate = new Date(patient.created_at || '');
                        const today = new Date();
                        const diffTime = today.getTime() - createdDate.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        let timeText = '';
                        if (diffDays === 0) {
                          timeText = 'Registered today';
                        } else if (diffDays === 1) {
                          timeText = 'Registered yesterday';
                        } else if (diffDays <= 7) {
                          timeText = `Registered ${diffDays} days ago`;
                        } else {
                          timeText = `Registered ${createdDate.toLocaleDateString()}`;
                        }

                        return (
                          <div
                            key={patient.id}
                            className="flex justify-between items-center p-2 rounded-md bg-meditouch-light border border-meditouch-light"
                          >
                            <div>
                              <p className="text-sm font-medium">{patient.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {timeText} • {patient.phone || 'No phone'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/patients/${patient.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        );
                      })
                    }
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No patients registered yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => navigate('/patients')}
                      >
                        Add First Patient
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/patients')}
                >
                  View All Patients
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
