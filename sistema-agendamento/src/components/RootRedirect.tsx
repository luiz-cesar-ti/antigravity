import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RootRedirect() {
    const { role, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        if (role === 'admin' || role === 'super_admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/teacher" replace />;
    }

    return <Navigate to="/login" replace />;
}
