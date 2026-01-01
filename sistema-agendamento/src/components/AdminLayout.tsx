import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Calendar, Monitor, Users, Settings, LogOut, Menu, X } from 'lucide-react';

export function AdminLayout() {
    const { signOut, user } = useAuth();
    const adminUser = user as import('../types').Admin | null;
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => {
        return location.pathname === path ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-600';
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 bg-primary-700 text-white flex flex-col flex-shrink-0 
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 flex flex-col items-center justify-center border-b border-primary-600/50 relative">
                    <h1 className="font-black text-xl text-center leading-tight tracking-tight">
                        {adminUser?.unit || 'Objetivo Admin'}
                    </h1>
                    <div className="h-1 w-12 bg-primary-400 rounded-full mt-3"></div>

                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute top-4 right-4 md:hidden text-primary-200 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        <li>
                            <Link
                                to="/admin"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/admin')}`}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/bookings"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/admin/bookings')}`}
                            >
                                <Calendar className="w-5 h-5" />
                                <span>Agendamentos</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/equipment"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/admin/equipment')}`}
                            >
                                <Monitor className="w-5 h-5" />
                                <span>Equipamentos</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/users"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/admin/users')}`}
                            >
                                <Users className="w-5 h-5" />
                                <span>Usuários</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin/settings"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/admin/settings')}`}
                            >
                                <Settings className="w-5 h-5" />
                                <span>Configurações</span>
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="p-4 border-t border-primary-600">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-primary-100 hover:text-white hover:bg-primary-600 rounded-md transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto flex flex-col w-full">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 rounded-md hover:bg-gray-100"
                        >
                            <Menu className="h-6 w-6 text-primary-600" />
                        </button>
                        <span className="font-bold text-gray-900">Menu</span>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
