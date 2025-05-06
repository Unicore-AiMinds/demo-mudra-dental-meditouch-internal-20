import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLabWork } from '@/contexts/LabWorkContext';
import { Calendar, Users, PackageOpen, Microscope, Clock } from 'lucide-react';
import StockAlerts from '@/components/StockAlerts';
import StockAlertsCount from '@/components/StockAlertsCount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { activeClinic, isDental, isMeditouch } = useClinic();
  const { user } = useAuth();
  const { getOverdueCount, getPendingCount, labJobs, isOverdue } = useLabWork();
  const navigate = useNavigate();

  const stats = {
    dental: {
      appointments: 12,
      patients: 120,
      stockAlerts: 3,
      labWorkPending: getPendingCount() + getOverdueCount()
    },
    meditouch: {
      appointments: 8,
      patients: 95,
    }
  };

  const isAdmin = user?.role === 'admin';
  const isClinicUser = user?.role === 'doctor' || user?.role === 'receptionist';

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Appointments
              </CardTitle>
              <Calendar className={`h-4 w-4 ${
                isDental ? 'text-dental-primary' : 'text-meditouch-primary'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isDental ? stats.dental.appointments : stats.meditouch.appointments}
              </div>
              <p className="text-xs text-muted-foreground">
                {isDental ? '+2' : '+1'} since yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className={`h-4 w-4 ${
                isDental ? 'text-dental-primary' : 'text-meditouch-primary'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isDental ? stats.dental.patients : stats.meditouch.patients}
              </div>
              <p className="text-xs text-muted-foreground">
                {isDental ? '+5' : '+3'} new patients this week
              </p>
            </CardContent>
          </Card>

          {isDental && (
            <>
              <Card className="card-shadow card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                  <PackageOpen className="h-4 w-4 text-dental-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {/* Use the StockContext to get the actual count */}
                    <StockAlertsCount />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Including expired items
                  </p>
                </CardContent>
              </Card>

              <Card className="card-shadow card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lab Work Pending</CardTitle>
                  <Microscope className="h-4 w-4 text-dental-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.dental.labWorkPending}</div>
                  <p className="text-xs text-muted-foreground">
                    {getOverdueCount()} items are overdue
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {isMeditouch && (
            <>
              <Card className="card-shadow card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-meditouch-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32</div>
                  <p className="text-xs text-muted-foreground">
                    Appointments scheduled
                  </p>
                </CardContent>
              </Card>

              <Card className="card-shadow card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Wait</CardTitle>
                  <Clock className="h-4 w-4 text-meditouch-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12m</div>
                  <p className="text-xs text-muted-foreground">
                    Down from 15m last week
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full md:col-span-1 card-shadow card-hover">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Upcoming appointments for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              {isDental ? (
                <>
                  <div className="flex justify-between items-center p-2 rounded-md bg-dental-light border border-dental-light">
                    <div>
                      <p className="text-sm font-medium">Aarav Sharma</p>
                      <p className="text-xs text-muted-foreground">10:00 AM - Dental Checkup</p>
                    </div>
                    <div className="text-xs bg-dental-primary text-white px-2 py-1 rounded">
                      Dr. Khanna
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-dental-light border border-dental-light">
                    <div>
                      <p className="text-sm font-medium">Priya Patel</p>
                      <p className="text-xs text-muted-foreground">11:30 AM - Root Canal</p>
                    </div>
                    <div className="text-xs bg-dental-primary text-white px-2 py-1 rounded">
                      Dr. Khanna
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-dental-light border border-dental-light">
                    <div>
                      <p className="text-sm font-medium">Arjun Singh</p>
                      <p className="text-xs text-muted-foreground">2:00 PM - Teeth Cleaning</p>
                    </div>
                    <div className="text-xs bg-dental-primary text-white px-2 py-1 rounded">
                      Dr. Khanna
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-dental-light border border-dental-light">
                    <div>
                      <p className="text-sm font-medium">Neha Kapoor</p>
                      <p className="text-xs text-muted-foreground">3:15 PM - Dental Filling</p>
                    </div>
                    <div className="text-xs bg-dental-primary text-white px-2 py-1 rounded">
                      Dr. Desai
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-dental-light border border-dental-light">
                    <div>
                      <p className="text-sm font-medium">Riya Sharma</p>
                      <p className="text-xs text-muted-foreground">4:30 PM - Pediatric Checkup</p>
                    </div>
                    <div className="text-xs bg-dental-primary text-white px-2 py-1 rounded">
                      Dr. Patel
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center p-2 rounded-md bg-meditouch-light border border-meditouch-light">
                    <div>
                      <p className="text-sm font-medium">Meera Joshi</p>
                      <p className="text-xs text-muted-foreground">9:15 AM - Skin Consultation</p>
                    </div>
                    <div className="text-xs bg-meditouch-primary text-white px-2 py-1 rounded">
                      Meditouch
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-meditouch-light border border-meditouch-light">
                    <div>
                      <p className="text-sm font-medium">Ravi Kumar</p>
                      <p className="text-xs text-muted-foreground">10:30 AM - Hair Treatment</p>
                    </div>
                    <div className="text-xs bg-meditouch-primary text-white px-2 py-1 rounded">
                      Meditouch
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-meditouch-light border border-meditouch-light">
                    <div>
                      <p className="text-sm font-medium">Vikram Mehta</p>
                      <p className="text-xs text-muted-foreground">12:45 PM - Hair Treatment</p>
                    </div>
                    <div className="text-xs bg-meditouch-primary text-white px-2 py-1 rounded">
                      Meditouch
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-meditouch-light border border-meditouch-light">
                    <div>
                      <p className="text-sm font-medium">Aisha Khan</p>
                      <p className="text-xs text-muted-foreground">2:30 PM - Facial</p>
                    </div>
                    <div className="text-xs bg-meditouch-primary text-white px-2 py-1 rounded">
                      Meditouch
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-meditouch-light border border-meditouch-light">
                    <div>
                      <p className="text-sm font-medium">Rajiv Malhotra</p>
                      <p className="text-xs text-muted-foreground">4:00 PM - Hair Consultation</p>
                    </div>
                    <div className="text-xs bg-meditouch-primary text-white px-2 py-1 rounded">
                      Meditouch
                    </div>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate('/appointments')}
            >
              View All Appointments
            </Button>
          </CardContent>
        </Card>

        {isDental && isAdmin && (
          <>
            <StockAlerts />

            <Card className="card-shadow card-hover">
              <CardHeader>
                <CardTitle>Lab Work</CardTitle>
                <CardDescription>Pending lab work items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate('/lab')}
                >
                  Manage Lab Work
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {isMeditouch && (
          <Card className="md:col-span-1 lg:col-span-2 card-shadow card-hover">
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Recently treated patients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium">Aisha Khan</p>
                    <p className="text-xs text-muted-foreground">Hair Treatment - Yesterday</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/patients/123')}>
                    View
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium">Rajiv Malhotra</p>
                    <p className="text-xs text-muted-foreground">Skin Consultation - 2 days ago</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/patients/124')}>
                    View
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium">Priya Sharma</p>
                    <p className="text-xs text-muted-foreground">Facial - 3 days ago</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/patients/125')}>
                    View
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium">Karan Kapoor</p>
                    <p className="text-xs text-muted-foreground">Hair Treatment - 3 days ago</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/patients/126')}>
                    View
                  </Button>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium">Ananya Reddy</p>
                    <p className="text-xs text-muted-foreground">Hair Spa - 4 days ago</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/patients/PT006')}>
                    View
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate('/patients')}
              >
                View All Patients
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
