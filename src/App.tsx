
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
                
                {/* Placeholder routes for future implementation */}
                <Route path="/lab" element={<div className="p-8 text-center">Lab Work Tracker - Coming soon</div>} />
                <Route path="/patients" element={<div className="p-8 text-center">Patients Management - Coming soon</div>} />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <div className="p-8 text-center">Reports - Coming soon</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/audit" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <div className="p-8 text-center">Audit Log - Coming soon</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <div className="p-8 text-center">Settings - Coming soon</div>
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
