import { useState, useEffect } from 'react';
import { Calendar, Monitor, Users, TrendingUp, Trophy, Filter, X } from 'lucide-react';
import { format, parseISO, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

import type { Admin } from '../../types';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';

export function AdminDashboard() {
    const { user } = useAuth();
    const adminUser = user as Admin;
    const [period, setPeriod] = useState<'week' | 'month' | 'total'>('month');
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [teacherBookings, setTeacherBookings] = useState<any[]>([]);
    const [teacherStats, setTeacherStats] = useState<any>({ equipmentUsage: [], weeklyTrend: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({
        activeBookings: 0,
        totalEquipment: 0,
        totalTeachers: 0,
    });
    const [chartData, setChartData] = useState({
        bookingsByDay: [] as any[],
        popularEquipment: [] as any[],
        topTeachers: [] as any[],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const today = new Date();
                let startDate: Date;

                if (period === 'week') {
                    startDate = startOfWeek(today, { locale: ptBR });
                } else if (period === 'month') {
                    startDate = startOfMonth(today);
                } else {
                    startDate = subDays(today, 365); // Last year for "total"
                }

                // Prepare base queries
                let activeBookingsQuery = supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active')
                    .gte('booking_date', today.toISOString().split('T')[0]);

                let totalEquipmentQuery = supabase
                    .from('equipment')
                    .select('*', { count: 'exact', head: true });

                let totalTeachersQuery = supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });

                let chartsQuery = supabase
                    .from('bookings')
                    .select(`
                        booking_date, 
                        equipment(name),
                        users(id, full_name)
                    `)
                    .neq('status', 'cancelled_by_user')
                    .gte('booking_date', startDate.toISOString().split('T')[0]);

                // Apply Strict Filtering Logic
                const unit = adminUser.unit;
                const isMatriz = unit === 'Matriz';

                if (!isMatriz) {
                    if (unit) {
                        // Nomal Unit Admin: Filter by their unit
                        activeBookingsQuery = activeBookingsQuery.eq('unit', unit);
                        totalEquipmentQuery = totalEquipmentQuery.eq('unit', unit);
                        totalTeachersQuery = totalTeachersQuery.contains('units', [unit]);
                        chartsQuery = chartsQuery.eq('unit', unit);
                    } else {
                        // Safety fallback: Admin without unit sees nothing (prevents leak)
                        console.warn('Security Warning: Admin user detected without assigned unit. Access blocked.');
                        activeBookingsQuery = activeBookingsQuery.eq('unit', 'RESTRICTED_ACCESS_NO_UNIT');
                        totalEquipmentQuery = totalEquipmentQuery.eq('unit', 'RESTRICTED_ACCESS_NO_UNIT');
                        totalTeachersQuery = totalTeachersQuery.eq('id', '00000000-0000-0000-0000-000000000000');
                        chartsQuery = chartsQuery.eq('unit', 'RESTRICTED_ACCESS_NO_UNIT');
                    }
                }

                const [bookingsRes, equipmentRes, usersRes, allBookings] = await Promise.all([
                    activeBookingsQuery,
                    totalEquipmentQuery,
                    totalTeachersQuery,
                    chartsQuery
                ]);


                const bookings = allBookings.data || [];

                // 1. Bookings by Day (AreaChart - Smoother)
                const daysMap: Record<string, number> = {};
                bookings.forEach((b: any) => {
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
                const equipmentMap: Record<string, number> = {};
                bookings.forEach((b: any) => {
                    const name = b.equipment?.name || 'Desconhecido';
                    equipmentMap[name] = (equipmentMap[name] || 0) + 1;
                });
                const popularEquipment = Object.keys(equipmentMap)
                    .map(key => ({ name: key, value: equipmentMap[key] }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // 3. Top Teachers (New Ranking)
                const teacherMap: Record<string, { id: string, name: string, count: number }> = {};
                bookings.forEach((b: any) => {
                    const userId = (b as any).users?.id;
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

                setStats({
                    activeBookings: bookingsRes.count || 0,
                    totalEquipment: equipmentRes.count || 0,
                    totalTeachers: usersRes.count || 0,
                });
                setChartData({ bookingsByDay, popularEquipment, topTeachers });

            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [period, adminUser?.unit, adminUser?.id]);

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
                            Bem-Vindo, <span className="text-primary-600 uppercase tracking-wider">{adminUser?.unit || 'Objetivo Geral'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                    <Filter className="h-4 w-4 text-gray-400 ml-2 mr-1" />
                    <button
                        onClick={() => setPeriod('week')}
                        className={clsx("px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all", period === 'week' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={clsx("px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all", period === 'month' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                    >
                        Mês
                    </button>
                    <button
                        onClick={() => setPeriod('total')}
                        className={clsx("px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all", period === 'total' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                    >
                        Ano
                    </button>
                </div>
            </div>

            {/* Stats Cards - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center group hover:border-primary-200 transition-all">
                    <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 mr-5 group-hover:scale-110 transition-transform">
                        <Calendar className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Agendamentos Futuros</p>
                        <p className="text-3xl font-black text-gray-900">{stats.activeBookings}</p>
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
                                    onClick={async () => {
                                        setSelectedTeacher(teacher);
                                        let detailQuery = supabase
                                            .from('bookings')
                                            .select('*, equipment(name)')
                                            .eq('user_id', teacher.id)
                                            .neq('status', 'cancelled_by_user');

                                        // Apply unit filter for teacher details
                                        if (adminUser.unit && adminUser.unit !== 'Matriz') {
                                            detailQuery = detailQuery.eq('unit', adminUser.unit);
                                        }

                                        const { data } = await detailQuery.order('booking_date', { ascending: false });

                                        if (data) {
                                            const eqMap: Record<string, number> = {};
                                            const weekTrend: Record<string, number> = { 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0 };
                                            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

                                            data.forEach((b: any) => {
                                                const ename = b.equipment?.name || 'Vários';
                                                eqMap[ename] = (eqMap[ename] || 0) + 1;

                                                const dayName = days[new Date(b.booking_date).getDay()];
                                                if (weekTrend[dayName] !== undefined) {
                                                    weekTrend[dayName]++;
                                                }
                                            });

                                            setTeacherBookings(data);
                                            setTeacherStats({
                                                equipmentUsage: Object.entries(eqMap).map(([name, value]) => ({ name, value })),
                                                weeklyTrend: Object.entries(weekTrend).map(([day, count]) => ({ day, count }))
                                            });
                                            setIsModalOpen(true);
                                        }
                                    }}
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
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Mix de Itens</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Itens mais requisitados</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.popularEquipment}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.popularEquipment.map((_, index) => (
                                        <Cell key={`cell - ${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Teacher Analytics Modal */}
            {isModalOpen && selectedTeacher && (
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
                                Fechar Relatório
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
