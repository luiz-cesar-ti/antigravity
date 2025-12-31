import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Calendar } from 'lucide-react';

export function TeacherLayout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Helper function to get display name from user
    const getDisplayName = () => {
        if (!user) return '';
        if ('full_name' in user) return user.full_name;
        if ('username' in user) return user.username;
        return '';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-primary-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <span className="font-bold text-xl tracking-tight">Colégio Objetivo</span>
                        </div>

                        <nav className="hidden md:flex space-x-8">
                            <Link to="/teacher" className="hover:text-primary-200 px-3 py-2 text-sm font-medium flex items-center gap-2">
                                <Home className="w-4 h-4" /> Início
                            </Link>
                            <Link to="/teacher/bookings" className="hover:text-primary-200 px-3 py-2 text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Agendamentos
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-sm text-right">
                                <p className="font-medium">{getDisplayName()}</p>
                                <p className="text-xs text-primary-300 uppercase">{user?.role === 'teacher' ? 'Professor' : 'Admin'}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-full hover:bg-primary-600 transition-colors"
                                title="Sair"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
