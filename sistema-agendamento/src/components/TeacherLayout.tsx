import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { LogOut, Home, Calendar, Menu, X, BookOpen, MapPin, User, ChevronDown } from 'lucide-react';

export function TeacherLayout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRoomsEnabled, setIsRoomsEnabled] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    useEffect(() => {
        const checkSettings = async () => {
            if (!user) return;

            const teacher = user as any;
            if (!teacher.units || teacher.units.length === 0) return;

            const { data } = await supabase
                .from('settings')
                .select('room_booking_enabled')
                .in('unit', teacher.units);

            if (data && data.some(s => s.room_booking_enabled)) {
                setIsRoomsEnabled(true);
            } else {
                setIsRoomsEnabled(false);
            }
        };
        checkSettings();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const getDisplayName = () => {
        if (!user) return '';
        if ('full_name' in user) return user.full_name;
        if ('username' in user) return user.username;
        return '';
    };

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/teacher', icon: Home, label: 'Início' },
        { path: '/teacher/my-bookings', icon: Calendar, label: 'Meus Agendamentos' },
        ...(isRoomsEnabled ? [{ path: '/teacher/rooms-v2', icon: MapPin, label: 'Salas' }] : []),
        { path: '/teacher/about', icon: BookOpen, label: 'Sobre' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-lg sticky top-0 z-50 border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo Area */}
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo-objetivo.png"
                                alt="Objetivo"
                                className="h-8 w-auto brightness-0 invert opacity-90"
                            />
                            <div className="hidden md:block h-6 w-px bg-slate-700"></div>
                            <span className="hidden md:block text-sm font-bold tracking-wide">
                                <span className="text-white">Área do</span>{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Professor</span>
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200
                                        ${isActive(item.path)
                                            ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-4 h-4 ${isActive(item.path) ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* User Profile & Mobile Toggle */}
                        <div className="flex items-center gap-4">
                            {/* Desktop Profile */}
                            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-700/50">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Professor</p>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 hover:bg-slate-700 transition-colors"
                                    >
                                        <User className="w-5 h-5" />
                                    </button>

                                    {/* Dropdown */}
                                    {isProfileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-1 ring-1 ring-black ring-opacity-5 origin-top-right transform transition-all animate-in fade-in zoom-in-95 duration-100">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-xs text-gray-500">Logado como</p>
                                                <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName()}</p>
                                            </div>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sair do Sistema
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
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
                    <div className="md:hidden bg-slate-900 border-t border-slate-800 animate-in slide-in-from-top-5 duration-200">
                        <div className="px-4 pt-4 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">{getDisplayName()}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Professor</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        block px-3 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-colors
                                        ${isActive(item.path)
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            ))}

                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleSignOut();
                                }}
                                className="w-full text-left px-3 py-3 rounded-lg text-base font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 flex items-center gap-3 mt-4 border-t border-slate-800/50 pt-4"
                            >
                                <LogOut className="w-5 h-5" /> Sair do Sistema
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
