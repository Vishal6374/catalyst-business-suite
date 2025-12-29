import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import ContactsPage from "@/pages/ContactsPage";
import CompaniesPage from "@/pages/CompaniesPage";
import DealsPage from "@/pages/DealsPage";
import TasksPage from "@/pages/TasksPage";
import CalendarPage from "@/pages/CalendarPage";
import EmployeesPage from "@/pages/EmployeesPage";
import AttendancePage from "@/pages/AttendancePage";
import PayrollPage from "@/pages/PayrollPage";
import LeaveRequestsPage from "@/pages/LeaveRequestsPage";
import ReportsPage from "@/pages/ReportsPage";
import DepartmentsPage from "@/pages/DepartmentsPage";
import DesignationsPage from "@/pages/DesignationsPage";
import UserRolesPage from "@/pages/UserRolesPage";
import ActivityLogsPage from "@/pages/ActivityLogsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="leave-requests" element={<LeaveRequestsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="designations" element={<DesignationsPage />} />
              <Route path="user-roles" element={<UserRolesPage />} />
              <Route path="activity-logs" element={<ActivityLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
