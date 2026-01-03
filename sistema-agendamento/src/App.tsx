import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RootRedirect } from './components/RootRedirect';
import { DebugAuth } from './pages/DebugAuth';
import { TeacherLayout } from './components/TeacherLayout';
import { AdminLayout } from './components/AdminLayout';
import { BookingWizard } from './pages/BookingWizard';
import { TeacherBookings } from './pages/TeacherBookings';
import { TeacherAbout } from './pages/TeacherAbout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminEquipment } from './pages/admin/AdminEquipment';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminLoans } from './pages/admin/AdminLoans';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminHelp } from './pages/admin/AdminHelp';
import { NotFound } from './pages/NotFound';

import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/debug-auth" element={<DebugAuth />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher" />}>
            <Route element={<TeacherLayout />}>
              <Route index element={<BookingWizard />} />
              <Route path="bookings" element={<TeacherBookings />} />
              <Route path="about" element={<TeacherAbout />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="equipment" element={<AdminEquipment />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="emprestimos" element={<AdminLoans />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="about" element={<AdminHelp />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
