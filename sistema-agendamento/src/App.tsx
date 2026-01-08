import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { ProtectedRoute } from './components/ProtectedRoute';

import { TeacherLayout } from './components/TeacherLayout';
import { AdminLayout } from './components/AdminLayout';
import { BookingWizard } from './pages/BookingWizard';
import { TeacherBookings } from './pages/TeacherBookings';
import { TeacherAbout } from './pages/TeacherAbout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEquipment } from './pages/admin/AdminEquipment';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminLoans } from './pages/admin/AdminLoans';
import { AdminSchedule } from './pages/admin/AdminSchedule';
import { AdminHelp } from './pages/admin/AdminHelp';
import { NotFound } from './pages/NotFound';
import { ScrollToTop } from './components/ScrollToTop';
import { RootRedirect } from './components/RootRedirect';

// New Imports
import { AdminRooms } from './pages/admin/AdminRooms';
import { RoomBookingV2 } from './pages/RoomBookingV2';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminManageAdmins } from './pages/admin/AdminManageAdmins';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRole="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="rooms" element={<AdminRooms />} />
                <Route path="equipment" element={<AdminEquipment />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="loans" element={<AdminLoans />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="manual" element={<AdminHelp />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="manage-admins" element={<AdminManageAdmins />} />
              </Route>
            </Route>

            {/* Teacher Routes */}
            <Route element={<ProtectedRoute allowedRole="teacher" />}>
              <Route element={<TeacherLayout />}>
                <Route path="/teacher" element={<Navigate to="/teacher/equipment" replace />} />
                <Route path="/teacher/equipment" element={<BookingWizard />} />
                <Route path="/teacher/rooms-v2" element={<RoomBookingV2 />} />
                <Route path="/teacher/my-bookings" element={<TeacherBookings />} />
                <Route path="/teacher/about" element={<TeacherAbout />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
