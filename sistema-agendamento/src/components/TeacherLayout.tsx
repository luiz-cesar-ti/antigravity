import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Calendar, Menu, X, BookOpen } from 'lucide-react';

export function TeacherLayout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <header className="bg-primary-700 text-white shadow-lg sticky top-0 z-50">
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
                            <Link to="/teacher/about" className="hover:text-primary-200 px-3 py-2 text-sm font-medium flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Sobre
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-sm text-right">
                                <p className="font-medium">{getDisplayName()}</p>
                                <p className="text-xs text-primary-300 uppercase">{user?.role === 'teacher' ? 'Professor' : 'Admin'}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="hidden md:block p-2 rounded-full hover:bg-primary-600 transition-colors"
                                title="Sair"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-600 focus:outline-none"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-primary-800 border-t border-primary-600">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <div className="px-3 py-2 text-primary-100 border-b border-primary-700 mb-2">
                                <p className="font-medium text-white">{getDisplayName()}</p>
                                <p className="text-xs uppercase mt-0.5">{user?.role === 'teacher' ? 'Professor' : 'Admin'}</p>
                            </div>

                            <Link
                                to="/teacher"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-primary-100 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                            >
                                <Home className="w-5 h-5" /> Início
                            </Link>

                            <Link
                                to="/teacher/bookings"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-primary-100 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                            >
                                <Calendar className="w-5 h-5" /> Agendamentos
                            </Link>

                            <Link
                                to="/teacher/about"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-primary-100 hover:bg-primary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                            >
                                <BookOpen className="w-5 h-5" /> Sobre
                            </Link>

                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleSignOut();
                                }}
                                className="text-primary-100 hover:bg-primary-700 hover:text-white w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                            >
                                <LogOut className="w-5 h-5" /> Sair
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
