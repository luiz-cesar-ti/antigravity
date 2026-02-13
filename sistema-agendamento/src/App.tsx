import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { RootRedirect } from './components/RootRedirect';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword').then(module => ({ default: module.UpdatePassword })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));

// Lazy Load Layouts
const TeacherLayout = lazy(() => import('./components/TeacherLayout').then(module => ({ default: module.TeacherLayout })));
const AdminLayout = lazy(() => import('./components/AdminLayout').then(module => ({ default: module.AdminLayout })));

// Lazy Load Teacher Pages
const BookingWizard = lazy(() => import('./pages/BookingWizard').then(module => ({ default: module.BookingWizard })));
const TeacherBookings = lazy(() => import('./pages/TeacherBookings').then(module => ({ default: module.TeacherBookings })));
const TeacherAbout = lazy(() => import('./pages/TeacherAbout').then(module => ({ default: module.TeacherAbout })));
const RoomBookingV2 = lazy(() => import('./pages/RoomBookingV2').then(module => ({ default: module.RoomBookingV2 })));

// Lazy Load Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminEquipment = lazy(() => import('./pages/admin/AdminEquipment').then(module => ({ default: module.AdminEquipment })));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings').then(module => ({ default: module.AdminBookings })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminLoans = lazy(() => import('./pages/admin/AdminLoans').then(module => ({ default: module.AdminLoans })));
const AdminSchedule = lazy(() => import('./pages/admin/AdminSchedule').then(module => ({ default: module.AdminSchedule })));
const AdminHelp = lazy(() => import('./pages/admin/AdminHelp').then(module => ({ default: module.AdminHelp })));
const AdminRooms = lazy(() => import('./pages/admin/AdminRooms').then(module => ({ default: module.AdminRooms })));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications').then(module => ({ default: module.AdminNotifications })));
const AdminManageAdmins = lazy(() => import('./pages/admin/AdminManageAdmins').then(module => ({ default: module.AdminManageAdmins })));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs').then(module => ({ default: module.AdminLogs })));
const AdminClassrooms = lazy(() => import('./pages/admin/AdminClassrooms').then(module => ({ default: module.AdminClassrooms })));

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<LoadingSpinner />}>
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
                  <Route path="classrooms" element={<AdminClassrooms />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="loans" element={<AdminLoans />} />
                  <Route path="schedule" element={<AdminSchedule />} />
                  <Route path="manual" element={<AdminHelp />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="manage-admins" element={<AdminManageAdmins />} />
                  <Route path="logs" element={<AdminLogs />} />
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
