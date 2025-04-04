
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import StockTracker from "@/pages/StockTracker";
import LabWork from "@/pages/LabWork";
import Patients from "@/pages/Patients";
import Reports from "@/pages/Reports";
import AuditLog from "@/pages/AuditLog";
import Settings from "@/pages/Settings";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ClinicProvider>
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
          </ClinicProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
