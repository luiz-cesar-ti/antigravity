import { useState, useEffect } from 'react';
import { Calendar, Monitor, Users, TrendingUp, Trophy, Filter, X, Building } from 'lucide-react';
import { format, parseISO, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

import type { Admin } from '../../types';
import { SCHOOL_UNITS } from '../../utils/constants';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';

export function AdminDashboard() {
    const isBookingExpired = (b: any) => {
        if (!b.booking_date || !b.end_time) return false;
        const now = new Date();
        try {
            const bookingEnd = parseISO(`${b.booking_date}T${b.end_time}`);
            return !isNaN(bookingEnd.getTime()) && now > bookingEnd;
        } catch { return false; }
    };

    const { user } = useAuth();
    const adminUser = user as Admin;
    const [period, setPeriod] = useState<'week' | 'month' | 'total' | 'custom'>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [donutShift, setDonutShift] = useState<'all' | 'morning' | 'afternoon'>('all');

    // Super Admin - Unit Filter Logic
    const isSuperAdmin = adminUser?.role === 'super_admin';
    const [targetUnit, setTargetUnit] = useState<string>(SCHOOL_UNITS[0]);

    // Sync unit on initial load/session arrival
    useEffect(() => {
        if (adminUser) {
            if (isSuperAdmin) {
                // Keep default SCHOOL_UNITS[0] or current targetUnit
            } else if (adminUser.unit) {
                setTargetUnit(adminUser.unit);
            }
        }
    }, [adminUser?.id, adminUser?.unit, isSuperAdmin]);

    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [teacherBookings, setTeacherBookings] = useState<any[]>([]);
    const [teacherStats, setTeacherStats] = useState<any>({ equipmentUsage: [], weeklyTrend: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({
        activeBookings: 0,
        completedBookings: 0,
        totalEquipment: 0,
        totalTeachers: 0,
    });
    const [chartData, setChartData] = useState({
        bookingsByDay: [] as any[],
        popularEquipment: [] as any[],
        topTeachers: [] as any[],
        bookingStatus: [] as any[],
    });
    const [loading, setLoading] = useState(true);
    const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
    const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
    const [isSearchingTeachers, setIsSearchingTeachers] = useState(false);

    const fetchTeacherAnalytics = async (teacherId: string, teacherName: string) => {
        setLoading(true);
        try {
            setSelectedTeacher({ id: teacherId, name: teacherName });

            let unitFilter: string | null = null;
            if (isSuperAdmin && targetUnit !== 'Matriz') {
                unitFilter = targetUnit;
            } else if (!isSuperAdmin && adminUser.unit && adminUser.unit !== 'Matriz') {
                unitFilter = adminUser.unit;
            }

            const { data, error } = await supabase.rpc('get_admin_bookings', {
                p_unit: unitFilter,
                p_start_date: null, // Fetch all history
                p_end_date: null,
                p_is_recurring: null,
                p_user_id: teacherId
            });

            if (error) throw error;

            if (data) {
                // RPC returns ASC, we want DESC for display usually, strictly speaking analytics doesn't care about order for stats, but if listed somewhere...
                // The current code calculates stats from 'data'.
                // If there is a list of bookings displayed, it's inside the modal?
                // The modal code isn't visible in the view_file given, but assuming consistency.
                const bookingsData = (data as any[]).filter(b => b.status !== 'cancelled_by_user');

                const eqMap: Record<string, number> = {};
                const weekTrend: Record<string, number> = { 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0 };
                const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

                bookingsData.forEach((b: any) => {
                    const ename = b.equipment?.name || 'Vários';
                    eqMap[ename] = (eqMap[ename] || 0) + 1;

                    // Ensure date parsing works with text date from RPC
                    // b.booking_date is YYYY-MM-DD string. new Date() handles it (UTC? Local?)
                    // new Date('2023-10-10') usually treats as UTC.
                    // But getDay() uses local.
                    // This might be slightly off if not careful, but consistent with existing code likely.
                    // Let's use parseISO to be safe if available or simple new Date.
                    // Start of file has import { parseISO } from 'date-fns';
                    const dayName = days[parseISO(b.booking_date).getDay()];
                    if (weekTrend[dayName] !== undefined) {
                        weekTrend[dayName]++;
                    }
                });

                setTeacherBookings(bookingsData);
                setTeacherStats({
                    equipmentUsage: Object.entries(eqMap).map(([name, value]) => ({ name, value })),
                    weeklyTrend: Object.entries(weekTrend).map(([day, count]) => ({ day, count }))
                });
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error('Error fetching teacher analytics:', err);
            alert('Erro ao carregar dados do professor.');
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherSearch = async (query: string) => {
        setTeacherSearchQuery(query);
        if (query.length < 3) {
            setTeacherSearchResults([]);
            return;
        }

        setIsSearchingTeachers(true);
        try {
            // Use RPC to bypass RLS issues and ensure consistent header usage
            const { data, error } = await supabase.rpc('get_admin_users');

            if (error) throw error;

            let results = data || [];

            // Client-side filtering
            results = results.filter((u: any) => {
                // 1. Unit Filter
                let matchesUnit = true;
                if (isSuperAdmin && targetUnit !== 'Matriz') {
                    matchesUnit = u.units?.includes(targetUnit);
                } else if (!isSuperAdmin && adminUser.unit && adminUser.unit !== 'Matriz') {
                    matchesUnit = u.units?.includes(adminUser.unit);
                }
                if (!matchesUnit) return false;

                // 2. Query Filter (Name or TOTVS)
                const q = query.toLowerCase();
                const name = u.full_name?.toLowerCase() || '';
                const totvs = u.totvs_number?.toLowerCase() || '';

                return name.includes(q) || totvs.includes(q);
            });

            setTeacherSearchResults(results.slice(0, 5));
        } catch (err) {
            console.error('Teacher search error:', err);
        } finally {
            setIsSearchingTeachers(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const today = new Date();
                let queryStartDate: string;
                let queryEndDate: string | null = null;

                if (period === 'week') {
                    queryStartDate = startOfWeek(today, { locale: ptBR }).toISOString().split('T')[0];
                } else if (period === 'month') {
                    queryStartDate = startOfMonth(today).toISOString().split('T')[0];
                } else if (period === 'custom') {
                    if (!customStartDate || !customEndDate) {
                        setLoading(false);
                        return;
                    }
                    queryStartDate = customStartDate;
                    queryEndDate = customEndDate;
                } else {
                    queryStartDate = subDays(today, 365).toISOString().split('T')[0];
                }

                // RPC 1: Bookings (Secure)
                // Note: get_admin_bookings handles unit filtering internally based on session token + params
                // But for Super Admin logic in FE, we pass targetUnit.
                let unitFilter: string | null = null;
                if (isSuperAdmin) {
                    if (targetUnit) unitFilter = targetUnit;
                } else if (adminUser.unit && adminUser.unit !== 'Matriz') {
                    unitFilter = adminUser.unit;
                }

                // RPC 2: Users (Secure) - Returns all teachers
                // We'll filter/count client side if needed. 
                // RPC get_admin_users usually filters by role='teacher' inside.

                // RPC 3: Equipment (Direct Select - Public Read should be fine for counts, or use similar logic?)
                // Equipment policy allows authenticated select. OK.
                let totalEquipmentQuery = supabase
                    .from('equipment')
                    .select('*', { count: 'exact', head: true });

                if (unitFilter) {
                    totalEquipmentQuery = totalEquipmentQuery.eq('unit', unitFilter);
                }

                const [bookingsRes, usersRes, equipmentRes] = await Promise.all([
                    supabase.rpc('get_admin_bookings', {
                        p_unit: unitFilter,
                        p_start_date: queryStartDate || null,
                        p_end_date: queryEndDate || null,
                        p_is_recurring: null // All types
                    }),
                    supabase.rpc('get_admin_users'),
                    totalEquipmentQuery
                ]);

                if (bookingsRes.error) throw bookingsRes.error;
                if (usersRes.error) throw usersRes.error;

                const bookings = bookingsRes.data || [];
                const teachers = usersRes.data || [];
                const totalEquipment = equipmentRes.count || 0;

                // Derive Stats from the secure data
                // bookings array already filtered by date/unit from RPC

                // Filter for existing charts (exclude cancelled)
                const validBookings = bookings.filter((b: any) => b.status !== 'cancelled_by_user' && b.status !== 'cancelled');

                // 1. Bookings by Day (AreaChart - Smoother)
                const daysMap: Record<string, number> = {};
                validBookings.forEach((b: any) => {
                    const dateStr = b.booking_date;
                    daysMap[dateStr] = (daysMap[dateStr] || 0) + 1;
                });

                const bookingsByDay = Object.keys(daysMap)
                    .sort()
                    .map(date => ({
                        date: format(parseISO(date), 'dd/MM'),
                        agendamentos: daysMap[date]
                    }));

                // 2. Popular Equipment (Pie/Donut)
                const filteredForDonut = validBookings.filter((b: any) => {
                    if (donutShift === 'all') return true;
                    if (!b.start_time) return false;
                    const hour = parseInt(b.start_time.split(':')[0]);
                    if (donutShift === 'morning') return hour >= 7 && hour < 13;
                    if (donutShift === 'afternoon') return hour >= 13 && hour <= 18;
                    return true;
                });

                const equipmentMap: Record<string, number> = {};
                filteredForDonut.forEach((b: any) => {
                    const name = b.equipment?.name || 'Desconhecido';
                    equipmentMap[name] = (equipmentMap[name] || 0) + 1;
                });
                const totalPopularVal = Object.values(equipmentMap).reduce((a, b) => a + b, 0);
                const popularEquipment = Object.keys(equipmentMap)
                    .map(key => {
                        const val = equipmentMap[key];
                        return {
                            name: key,
                            value: val,
                            percent: totalPopularVal > 0 ? Math.round((val / totalPopularVal) * 100) : 0
                        };
                    })
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // 3. Top Teachers (New Ranking)
                const teacherMap: Record<string, { id: string, name: string, count: number }> = {};
                validBookings.forEach((b: any) => {
                    const userId = b.user_id; // Fixed: user_id comes directly, not from users JSONB
                    const name = (b as any).users?.full_name || 'Desconhecido';
                    if (userId) {
                        if (!teacherMap[userId]) {
                            teacherMap[userId] = { id: userId, name, count: 0 };
                        }
                        teacherMap[userId].count += 1;
                    }
                });
                const topTeachers = Object.values(teacherMap)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                // 4. Booking Status (New Chart)
                // Re-calculating loops simplified:
                const statusCounts = { active: 0, completed: 0, recurring: 0, excluded_by_user: 0, cancelled_by_admin: 0 };
                bookings.forEach((b: any) => {
                    const status = b.status?.toLowerCase();

                    // 1. Cancelled checks (Priority 1)
                    if (status === 'cancelled_by_user') {
                        statusCounts.excluded_by_user++;
                        return;
                    }
                    if (status === 'cancelled') {
                        statusCounts.cancelled_by_admin++;
                        return;
                    }

                    // 2. Completed/Expired (Priority 2)
                    if (status === 'encerrado' || isBookingExpired(b)) {
                        statusCounts.completed++;
                        return;
                    }

                    // 3. Active (Priority 3)
                    if (status === 'active') {
                        if (b.is_recurring) {
                            statusCounts.recurring++;
                        } else {
                            statusCounts.active++;
                        }
                    }
                });

                const totalStatusVal = statusCounts.active + statusCounts.completed + statusCounts.recurring + statusCounts.excluded_by_user + statusCounts.cancelled_by_admin;

                const bookingStatus = [
                    { name: 'Ativo', value: statusCounts.active, color: '#16a34a' },     // Green 600
                    { name: 'Concluído', value: statusCounts.completed, color: '#2563eb' }, // Blue 600
                    { name: 'Recorrente', value: statusCounts.recurring, color: '#ca8a04' }, // Amber 600
                    { name: 'Excluído', value: statusCounts.excluded_by_user, color: '#dc2626' },   // Red 600
                    { name: 'Cancelado', value: statusCounts.cancelled_by_admin, color: '#ef4444' } // Red 500 (Admin Cancel) - Or Gray? User wants to differentiate.
                ]
                    .filter(i => i.value > 0)
                    .map(item => ({
                        ...item,
                        percent: totalStatusVal > 0 ? Math.round((item.value / totalStatusVal) * 100) : 0
                    }));

                setStats({
                    activeBookings: statusCounts.active + statusCounts.recurring, // Summing recurring into Active count
                    completedBookings: statusCounts.completed,
                    totalEquipment: totalEquipment,
                    totalTeachers: unitFilter
                        ? teachers.filter((t: any) => t.units && Array.isArray(t.units) && t.units.includes(unitFilter)).length
                        : teachers.length,
                });
                setChartData({
                    bookingsByDay,
                    popularEquipment,
                    topTeachers,
                    bookingStatus
                });

            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [period, adminUser?.unit, adminUser?.id, customStartDate, customEndDate, donutShift, targetUnit, isSuperAdmin]);

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Atualizando dados estratégicos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with Welcome and Period Selector */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Controle</h1>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-50 to-white border border-primary-100 rounded-2xl shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-primary-500 mr-3 animate-pulse"></div>
                        <p className="text-sm font-bold text-primary-900">
                            Bem-Vindo, <span className="text-primary-600 uppercase tracking-wider">{isSuperAdmin ? 'Administrador Global' : (adminUser?.unit || 'Objetivo Geral')}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 w-full lg:w-auto">
                    {/* Unit Selector for Super Admin */}
                    {isSuperAdmin && (
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Building className="h-4 w-4 text-primary-500" />
                            </div>
                            <select
                                value={targetUnit}
                                onChange={(e) => setTargetUnit(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-white border border-gray-100 text-gray-700 font-bold text-sm rounded-2xl shadow-sm hover:border-primary-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer outline-none min-w-[180px]"
                            >
                                {SCHOOL_UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    )}
                    {/* Teacher Search Section */}
                    <div className="relative w-full lg:w-80">
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar Professor (Nome ou TOTVS)..."
                                className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 shadow-sm outline-none transition-all"
                                value={teacherSearchQuery}
                                onChange={(e) => handleTeacherSearch(e.target.value)}
                            />
                            {isSearchingTeachers && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {teacherSearchResults.length > 0 && teacherSearchQuery.length >= 3 && (
                            <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {teacherSearchResults.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            fetchTeacherAnalytics(t.id, t.full_name);
                                            setTeacherSearchResults([]);
                                            setTeacherSearchQuery('');
                                        }}
                                        className="w-full px-5 py-3 text-left hover:bg-gray-50 flex flex-col gap-0.5 transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <span className="text-sm font-black text-gray-900">{t.full_name}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOTVS: {t.totvs_number}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
                        <Filter className="h-4 w-4 text-gray-400 ml-2 mr-1 shrink-0" />
                        <button
                            onClick={() => setPeriod('week')}
                            className={clsx("whitespace-nowrap px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all", period === 'week' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setPeriod('month')}
                            className={clsx("whitespace-nowrap px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all", period === 'month' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => setPeriod('total')}
                            className={clsx("whitespace-nowrap px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all", period === 'total' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                        >
                            Ano
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>
                        <button
                            onClick={() => setPeriod('custom')}
                            className={clsx("whitespace-nowrap px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all", period === 'custom' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                        >
                            Personalizado
                        </button>
                    </div>

                    {period === 'custom' && (
                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-right-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 rounded-lg border-transparent focus:border-primary-500 focus:bg-white focus:ring-0 transition-all"
                            />
                            <span className="text-gray-400 font-bold text-xs">ATÉ</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 rounded-lg border-transparent focus:border-primary-500 focus:bg-white focus:ring-0 transition-all"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center group hover:border-primary-200 transition-all">
                    <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 mr-5 group-hover:scale-110 transition-transform">
                        <Calendar className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Agendamentos Ativos</p>
                        <p className="text-3xl font-black text-gray-900">{stats.activeBookings}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center group hover:border-indigo-200 transition-all">
                    <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 mr-5 group-hover:scale-110 transition-transform">
                        <Trophy className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Agendamentos Concluídos</p>
                        <p className="text-3xl font-black text-gray-900">{stats.completedBookings}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center group hover:border-green-200 transition-all">
                    <div className="p-4 rounded-2xl bg-green-50 text-green-600 mr-5 group-hover:scale-110 transition-transform">
                        <Monitor className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Itens no Inventário</p>
                        <p className="text-3xl font-black text-gray-900">{stats.totalEquipment}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center group hover:border-purple-200 transition-all">
                    <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 mr-5 group-hover:scale-110 transition-transform">
                        <Users className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Docentes Ativos</p>
                        <p className="text-3xl font-black text-gray-900">{stats.totalTeachers}</p>
                    </div>
                </div>
            </div>

            {/* Strategic Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 1. Demand Over Time (Area Chart) */}
                <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Demanda por Equipamentos</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Volume de agendamentos no período</p>
                        </div>
                        <div className="p-3 bg-primary-50 rounded-2xl text-primary-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.bookingsByDay}>
                                <defs>
                                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#9CA3AF', fontWeight: 'bold' }}
                                />
                                <YAxis
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#9CA3AF', fontWeight: 'bold' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="agendamentos"
                                    stroke="#4F46E5"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorUsage)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Top Teachers (New List View) */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Top Professores</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Líderes de utilização</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                            <Trophy className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-5">
                        {chartData.topTeachers.length === 0 ? (
                            <p className="text-center text-gray-400 py-10 text-sm">Sem dados no período</p>
                        ) : (
                            chartData.topTeachers.map((teacher, index) => (
                                <button
                                    key={teacher.name}
                                    onClick={() => fetchTeacherAnalytics(teacher.id, teacher.name)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary-100 hover:bg-white transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-black",
                                            index === 0 ? "bg-amber-100 text-amber-600" :
                                                index === 1 ? "bg-gray-200 text-gray-600" :
                                                    index === 2 ? "bg-orange-100 text-orange-600" : "bg-white text-gray-400 border border-gray-100"
                                        )}>
                                            {index + 1}º
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-gray-700 leading-none">{teacher.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Ver Detalhes</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-primary-600">{teacher.count}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Uso</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Popular Equipment (Donut/Pie Chart) */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Equipamentos Mais Utilizados</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ranking de equipamentos por demanda</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Donut Shift Selector */}
                    <div className="flex p-1 bg-gray-50 rounded-xl mb-6 self-start">
                        <button
                            onClick={() => setDonutShift('all')}
                            className={clsx(
                                "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                                donutShift === 'all' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setDonutShift('morning')}
                            className={clsx(
                                "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                                donutShift === 'morning' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            07h - 13h
                        </button>
                        <button
                            onClick={() => setDonutShift('afternoon')}
                            className={clsx(
                                "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                                donutShift === 'afternoon' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            13h - 18h
                        </button>
                    </div>

                    {/* Texto Explicativo removido */}

                    <div className="h-72 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.popularEquipment}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.popularEquipment.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                    formatter={(value: any, _: any, props: any) => [`${value} (${props.payload.percent}%)`, 'Quantidade']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {chartData.popularEquipment.length > 0 && (
                            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-3xl font-black text-gray-900 leading-none">
                                    {chartData.popularEquipment.reduce((acc, curr) => acc + curr.value, 0)}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Total</p>
                            </div>
                        )}
                    </div>

                    {/* Custom Legend with Quantities and Percentages */}
                    <div className="mt-6 space-y-3">
                        {chartData.popularEquipment.map((item: any, index: number) => (
                            <div key={item.name} className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-400">
                                        {item.percent}%
                                    </span>
                                    <span className="text-xs font-black text-gray-900 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100 min-w-[40px] text-center">
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Booking Status (Status Donut) */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Status dos Agendamentos</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Distribuição por situação atual</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Filter className="h-5 w-5" />
                        </div>
                    </div>
                    {/* Legenda Explicativa removida */}

                    <div className="h-72 w-full relative mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.bookingStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.bookingStatus.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                    formatter={(value: any, _: any, props: any) => [`${value} (${props.payload.percent}%)`, 'Quantidade']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {chartData.bookingStatus.length > 0 && (
                            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-3xl font-black text-gray-900 leading-none">
                                    {chartData.bookingStatus.reduce((acc: any, curr: any) => acc + curr.value, 0)}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Total</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-3">
                        {chartData.bookingStatus.map((item: any) => (
                            <div key={item.name} className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-400">
                                        {item.percent}%
                                    </span>
                                    <span
                                        className="text-xs font-black px-2 py-1 rounded-lg transition-all text-white shadow-sm min-w-[40px] text-center"
                                        style={{ backgroundColor: item.color }}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>



            {/* Teacher Analytics Modal */}
            {
                isModalOpen && selectedTeacher && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="px-8 py-6 bg-primary-600 text-white flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-200">Analytics por Professor</p>
                                    <h2 className="text-2xl font-black">{selectedTeacher.name}</h2>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Reservas</p>
                                        <p className="text-3xl font-black text-primary-600">{teacherBookings.length}</p>
                                    </div>
                                    <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mix de Equipamentos usados</p>
                                        <div className="flex flex-wrap gap-2">
                                            {teacherStats.equipmentUsage.map((eq: any, idx: number) => (
                                                <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-bold uppercase tracking-tight">
                                                    {eq.name} ({eq.value})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Frequência Semanal</h4>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={teacherStats.weeklyTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                                    <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Histórico Recente</h4>
                                        <div className="space-y-3 overflow-y-auto max-h-48 pr-2">
                                            {teacherBookings.map((booking, idx) => (
                                                <div key={idx} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-transparent hover:border-primary-100 transition-colors">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700">{booking.equipment?.name}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{format(parseISO(booking.booking_date), 'dd/MM/yyyy')} • {booking.start_time}</p>
                                                    </div>
                                                    <span className={clsx(
                                                        "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                                        booking.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Fechar Visualização
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

