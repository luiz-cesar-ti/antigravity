import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Monitor,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    ClipboardCheck,
    BookOpen,
    Clock,
    UserCog,
    MapPin,
    ShieldAlert,
    ChevronRight,
    Shield
} from 'lucide-react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { NotificationBell } from './NotificationBell';

export function AdminLayout() {
    const { signOut, user } = useAuth();
    const adminUser = user as import('../types').Admin | null;
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    // Navigation items configuration
    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', always: true },
        { path: '/admin/bookings', icon: Calendar, label: 'Agendamentos', always: true },
        { path: '/admin/rooms', icon: MapPin, label: 'Gestão de Salas', always: true },
        { path: '/admin/equipment', icon: Monitor, label: 'Equipamentos', hideSuperAdmin: true },
        { path: '/admin/classrooms', icon: MapPin, label: 'Salas de Aula', hideSuperAdmin: true },
        { path: '/admin/users', icon: Users, label: 'Usuários', always: true },
        { path: '/admin/loans', icon: ClipboardCheck, label: 'Empréstimos', hideSuperAdmin: true },
        { path: '/admin/schedule', icon: Clock, label: 'Horário de Aulas', hideSuperAdmin: true },
        { path: '/admin/manual', icon: BookOpen, label: 'Manual do Admin', hideSuperAdmin: true },
    ];

    const superAdminItems = [
        { path: '/admin/manage-admins', icon: UserCog, label: 'Administradores' },
        { path: '/admin/logs', icon: ShieldAlert, label: 'Logs de Auditoria' },
    ];

    const shouldShowItem = (item: typeof navItems[0]) => {
        if (item.always) return true;
        if (item.hideSuperAdmin && adminUser?.role === 'super_admin') return false;
        return true;
    };

    return (
        <NotificationProvider>
            <div className="flex h-screen bg-slate-100 overflow-hidden">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm md:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed md:static inset-y-0 left-0 z-50
                    w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
                    text-white flex flex-col flex-shrink-0 
                    transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    shadow-2xl shadow-slate-900/50
                `}>
                    {/* Header with Logo */}
                    <div className="p-5 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-lg">
                                <Shield className="h-6 w-6 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="font-bold text-base text-white truncate">
                                    {adminUser?.unit || 'Objetivo Admin'}
                                </h1>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    Painel Administrativo
                                </p>
                            </div>
                            {/* Close button for mobile */}
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="space-y-1">
                            {navItems.filter(shouldShowItem).map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                        ${isActive(item.path)
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive(item.path) ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                                    <span className="font-medium text-sm">{item.label}</span>
                                    {isActive(item.path) && (
                                        <ChevronRight className="w-4 h-4 ml-auto text-amber-400" />
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* Super Admin Section */}
                        {adminUser?.role === 'super_admin' && (
                            <div className="mt-6 pt-6 border-t border-slate-700/50">
                                <div className="px-4 mb-3">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded-md">
                                        <ShieldAlert className="w-3 h-3" />
                                        Super Admin
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {superAdminItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                                ${isActive(item.path)
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                                                }
                                            `}
                                        >
                                            <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive(item.path) ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                                            <span className="font-medium text-sm">{item.label}</span>
                                            {isActive(item.path) && (
                                                <ChevronRight className="w-4 h-4 ml-auto text-amber-400" />
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Settings - Only for non super_admin */}
                        {adminUser?.role !== 'super_admin' && (
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                                <Link
                                    to="/admin/settings"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                        ${isActive('/admin/settings')
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                                        }
                                    `}
                                >
                                    <Settings className={`w-5 h-5 shrink-0 transition-colors ${isActive('/admin/settings') ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                                    <span className="font-medium text-sm">Configurações</span>
                                    {isActive('/admin/settings') && (
                                        <ChevronRight className="w-4 h-4 ml-auto text-amber-400" />
                                    )}
                                </Link>
                            </div>
                        )}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-slate-700/50">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 rounded-xl transition-all duration-200 group"
                        >
                            <LogOut className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
                            <span className="font-medium text-sm">Sair do Sistema</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main id="admin-main-content" className="flex-1 overflow-auto flex flex-col w-full relative bg-slate-50">
                    {/* Header */}
                    <header className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 sticky top-0 z-30 px-4 lg:px-6 py-3 flex items-center justify-between shadow-lg border-b border-slate-700/50">
                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-1 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Desktop Left Spacer */}
                        <div className="hidden md:block w-10"></div>

                        {/* Centered Logo - Desktop */}
                        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-3">
                            <img
                                src="/logo-objetivo.png"
                                alt="Objetivo"
                                className="h-8 w-auto brightness-0 invert opacity-90"
                            />
                            <div className="h-6 w-px bg-slate-600"></div>
                            <span className="text-sm font-bold tracking-wide">
                                <span className="text-white">Sistema de</span>{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Agendamentos</span>
                            </span>
                        </div>

                        {/* Centered Logo - Mobile */}
                        <div className="md:hidden flex-1 flex justify-center">
                            <span className="text-xs font-bold tracking-wide">
                                <span className="text-white">Sistema de</span>{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Agendamentos</span>
                            </span>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 mr-2">
                            <NotificationBell />
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </NotificationProvider>
    );
}
