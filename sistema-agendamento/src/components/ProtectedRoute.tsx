import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    allowedRole?: 'teacher' | 'admin';
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
    const { user, role, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        // Redirect to correct dashboard based on actual role
        if (role === 'admin') return <Navigate to="/admin" replace />;
        if (role === 'teacher') return <Navigate to="/teacher" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
