
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { ClinicInfoProvider } from "@/contexts/ClinicInfoContext";
import { DoctorProvider } from "@/contexts/DoctorContext";
import { DentalHistoryProvider } from "@/contexts/DentalHistoryContext";
import { DentalChartingProvider } from "@/contexts/DentalChartingContext";
import { VitalSignsProvider } from "@/contexts/VitalSignsContext";
import { PrescriptionProvider } from "@/contexts/PrescriptionContext";
import { StockProvider } from "@/contexts/StockContext";
import { StockDefinitionsProvider } from "@/contexts/StockDefinitionsContext";
import { LabWorkProvider } from "@/contexts/LabWorkContext";
import { MedicineProvider } from "@/contexts/MedicineContext";
import { DentalLabsProvider } from "@/contexts/DentalLabsContext";
import { LabWorkTypesProvider } from "@/contexts/LabWorkTypesContext";
import { DealersProvider } from "@/contexts/DealersContext";
import { UnitsProvider } from "@/contexts/UnitsContext";
import { PatientProvider } from "@/contexts/PatientContext";
import { AppointmentProvider } from "@/contexts/AppointmentContext";
import { ServiceProvider } from "@/contexts/ServiceContext";
import { ServiceFollowUpProvider } from "@/contexts/ServiceFollowUpContext";
import { ServiceFollowUpRuleProvider } from "@/contexts/ServiceFollowUpRuleContext";
import { FollowUpProvider } from "@/contexts/FollowUpContext";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import NewAppointment from "@/pages/NewAppointment";
import StockTracker from "@/pages/StockTracker";
import LabWork from "@/pages/LabWork";
import Patients from "@/pages/Patients";
import PatientDetails from "@/pages/PatientDetails";
import Reports from "@/pages/Reports";
import AuditLog from "@/pages/AuditLog";
import Settings from "@/pages/Settings";
import RecallList from "@/pages/RecallList";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SupabaseProvider>
          <AuthProvider>
            <ClinicProvider>
              <ClinicInfoProvider>
                <DoctorProvider>
                  <ServiceProvider>
                    <PatientProvider>
                      <AppointmentProvider>
                        <ServiceFollowUpProvider>
                          <ServiceFollowUpRuleProvider>
                            <FollowUpProvider>
                              <DentalHistoryProvider>
                                <DentalChartingProvider>
                                  <VitalSignsProvider>
                                    <PrescriptionProvider>
                                      {/* Important: DentalLabsProvider must come before LabWorkProvider */}
                                      <DentalLabsProvider>
                                        <LabWorkTypesProvider>
                                          <LabWorkProvider>
                                            <StockDefinitionsProvider>
                                              <UnitsProvider>
                                                <StockProvider>
                                                  <DealersProvider>
                                                    <MedicineProvider>
                                              <Routes>
                                                <Route path="/login" element={<Login />} />
                                                <Route path="/unauthorized" element={<Unauthorized />} />

                                                {/* Protected Routes */}
                                                <Route
                                                  element={
                                                    <ProtectedRoute>
                                                      <AppLayout />
                                                    </ProtectedRoute>
                                                  }
                                                >
                                                  <Route path="/dashboard" element={<Dashboard />} />
                                                  <Route path="/appointments" element={<Appointments />} />
                                                  <Route path="/appointments/new" element={<NewAppointment />} />
                                                  <Route
                                                    path="/stock"
                                                    element={
                                                      <ProtectedRoute allowedRoles={['admin', 'inventory']}>
                                                        <StockTracker />
                                                      </ProtectedRoute>
                                                    }
                                                  />
                                                  <Route
                                                    path="/lab"
                                                    element={
                                                      <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                                                        <LabWork />
                                                      </ProtectedRoute>
                                                    }
                                                  />
                                                  <Route path="/patients" element={<Patients />} />
                                                  <Route path="/patients/:patientId" element={<PatientDetails />} />
                                                  <Route path="/recall-list" element={<RecallList />} />
                                                  <Route
                                                    path="/reports"
                                                    element={
                                                      <ProtectedRoute allowedRoles={['admin']}>
                                                        <Reports />
                                                      </ProtectedRoute>
                                                    }
                                                  />
                                                  <Route
                                                    path="/audit"
                                                    element={
                                                      <ProtectedRoute allowedRoles={['admin']}>
                                                        <AuditLog />
                                                      </ProtectedRoute>
                                                    }
                                                  />
                                                  <Route
                                                    path="/settings"
                                                    element={
                                                      <ProtectedRoute allowedRoles={['admin']}>
                                                        <Settings />
                                                      </ProtectedRoute>
                                                    }
                                                  />
                                                </Route>

                                                {/* Redirect root to dashboard if logged in, otherwise to login */}
                                                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                                                {/* 404 route */}
                                                <Route path="*" element={<NotFound />} />
                                              </Routes>
                                              </MedicineProvider>
                                                  </DealersProvider>
                                                </StockProvider>
                                              </UnitsProvider>
                                            </StockDefinitionsProvider>
                                        </LabWorkProvider>
                                      </LabWorkTypesProvider>
                                    </DentalLabsProvider>
                                    </PrescriptionProvider>
                                  </VitalSignsProvider>
                                </DentalChartingProvider>
                              </DentalHistoryProvider>
                            </FollowUpProvider>
                          </ServiceFollowUpRuleProvider>
                        </ServiceFollowUpProvider>
                      </AppointmentProvider>
                    </PatientProvider>
                  </ServiceProvider>
                </DoctorProvider>
              </ClinicInfoProvider>
            </ClinicProvider>
          </AuthProvider>
        </SupabaseProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
