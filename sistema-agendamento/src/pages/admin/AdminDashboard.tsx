import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Monitor, Users, Settings, TrendingUp, Trophy, Filter } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

import type { Admin } from '../../types';
import {
    BarChart,
    Bar,
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
    Area
} from 'recharts';

export function AdminDashboard() {
    const { user } = useAuth();
    const adminUser = user as Admin;
    const [period, setPeriod] = useState<'week' | 'month' | 'total'>('month');
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

                const [bookingsRes, equipmentRes, usersRes, allBookings] = await Promise.all([
                    supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'active')
                        .gte('booking_date', today.toISOString().split('T')[0]),

                    supabase
                        .from('equipment')
                        .select('*', { count: 'exact', head: true }),

                    supabase
                        .from('users')
                        .select('*', { count: 'exact', head: true }),

                    supabase
                        .from('bookings')
                        .select(`
                            booking_date, 
                            equipment(name),
                            users(full_name)
                        `)
                        .gte('booking_date', startDate.toISOString().split('T')[0])
                        .eq('unit', adminUser.unit)
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
                const teacherMap: Record<string, number> = {};
                bookings.forEach((b: any) => {
                    const name = (b as any).users?.full_name || 'Desconhecido';
                    teacherMap[name] = (teacherMap[name] || 0) + 1;
                });
                const topTeachers = Object.keys(teacherMap)
                    .map(key => ({ name: key, count: teacherMap[key] }))
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
    }, [period, adminUser.unit]);

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
                                <div key={teacher.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary-100 hover:bg-white transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-black",
                                            index === 0 ? "bg-amber-100 text-amber-600" :
                                                index === 1 ? "bg-gray-200 text-gray-600" :
                                                    index === 2 ? "bg-orange-100 text-orange-600" : "bg-white text-gray-400 border border-gray-100"
                                        )}>
                                            {index + 1}º
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 leading-none">{teacher.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Colégio Objetivo</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-primary-600">{teacher.count}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Uso</p>
                                    </div>
                                </div>
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
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

            {/* Quick Actions - Enhanced */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Gestão Operacional</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ações recomendadas</p>
                    </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link to="/admin/bookings" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-primary-600 hover:text-white transition-all group shadow-sm border border-transparent">
                        <Calendar className="h-8 w-8 text-primary-600 mb-3 group-hover:text-white group-hover:scale-110 transition-all" />
                        <span className="font-bold text-sm tracking-tight text-center">Gestão de Reservas</span>
                    </Link>
                    <Link to="/admin/equipment" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-primary-600 hover:text-white transition-all group shadow-sm border border-transparent">
                        <Monitor className="h-8 w-8 text-primary-600 mb-3 group-hover:text-white group-hover:scale-110 transition-all" />
                        <span className="font-bold text-sm tracking-tight text-center">Mestre de Inventário</span>
                    </Link>
                    <Link to="/admin/users" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-primary-600 hover:text-white transition-all group shadow-sm border border-transparent">
                        <Users className="h-8 w-8 text-primary-600 mb-3 group-hover:text-white group-hover:scale-110 transition-all" />
                        <span className="font-bold text-sm tracking-tight text-center">Docentes Cadastrados</span>
                    </Link>
                    <Link to="/admin/settings" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-primary-600 hover:text-white transition-all group shadow-sm border border-transparent">
                        <Settings className="h-8 w-8 text-primary-600 mb-3 group-hover:text-white group-hover:scale-110 transition-all" />
                        <span className="font-bold text-sm tracking-tight text-center">Configurações Base</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
