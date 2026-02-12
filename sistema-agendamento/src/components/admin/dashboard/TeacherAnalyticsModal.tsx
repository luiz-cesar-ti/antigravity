import React from 'react';
import { X, Trophy, AlertCircle, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
    Tooltip
} from 'recharts';

// --- Interfaces ---

interface Teacher {
    id: string;
    name: string;
    email: string;
    // add other fields if necessary
}

interface Booking {
    id: string;
    equipment?: { name: string };
    quantity: number;
    booking_date: string;
    start_time: string;
    status: string;
}

interface TeacherStats {
    equipmentUsage: { name: string; count: number }[];
    weeklyTrend: { day: string; count: number }[];
}

interface TeacherAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher | null;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    period: 'all' | 'morning' | 'afternoon';
    setPeriod: (period: 'all' | 'morning' | 'afternoon') => void;
    stats: TeacherStats;
    bookings: Booking[];
}

// --- Sub-components ---

const PeriodFilter = ({
    period,
    setPeriod
}: {
    period: 'all' | 'morning' | 'afternoon';
    setPeriod: (p: 'all' | 'morning' | 'afternoon') => void;
}) => (
    <div className="flex bg-blue-900/50 rounded-lg p-1 border border-blue-700/50">
        {(['all', 'morning', 'afternoon'] as const).map((p) => (
            <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all whitespace-nowrap",
                    period === p
                        ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-sm"
                        : "text-blue-200 hover:text-white"
                )}
            >
                {p === 'all' ? 'Todos' : p === 'morning' ? 'Manhã' : 'Tarde'}
            </button>
        ))}
    </div>
);

const DateInputs = ({
    startDate,
    setStartDate,
    endDate,
    setEndDate
}: {
    startDate: string;
    setStartDate: (d: string) => void;
    endDate: string;
    setEndDate: (d: string) => void;
}) => (
    <div className="flex items-center gap-2">
        <div className="relative group">
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-3 pr-2 py-1.5 bg-blue-900/50 border border-blue-700/50 rounded-lg text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
            />
        </div>
        <span className="text-blue-400 font-bold">-</span>
        <div className="relative group">
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-3 pr-2 py-1.5 bg-blue-900/50 border border-blue-700/50 rounded-lg text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase"
            />
        </div>
    </div>
);

// --- Constants ---

const dayMapping: Record<string, string> = {
    'Dom': 'Domingo',
    'Seg': 'Segunda-feira',
    'Ter': 'Terça-feira',
    'Qua': 'Quarta-feira',
    'Qui': 'Quinta-feira',
    'Sex': 'Sexta-feira',
    'Sáb': 'Sábado'
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const fullDay = dayMapping[label] || label;
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                <p className="font-bold text-slate-800 text-sm mb-1">{fullDay}</p>
                <p className="text-xs text-blue-600 font-bold">
                    {payload[0].value} {payload[0].value === 1 ? 'reserva' : 'reservas'}
                </p>
            </div>
        );
    }
    return null;
};

// --- Desktop Implementation ---

const DesktopAnalytics: React.FC<TeacherAnalyticsModalProps> = ({
    teacher,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    period,
    setPeriod,
    stats,
    bookings,
    onClose
}) => {
    return (
        <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shadow-lg relative overflow-hidden">


                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Analytics por Professor</p>
                    <h2 className="text-3xl font-black text-white tracking-tight">{teacher?.name}</h2>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                        <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider ml-2">Período:</span>
                        <DateInputs startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
                        <div className="h-6 w-px bg-slate-700 mx-1"></div>
                        <PeriodFilter period={period} setPeriod={setPeriod} />
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left Column (KPIs) - 4 cols */}
                    <div className="col-span-4 space-y-6">
                        {/* KPI Card */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Trophy className="h-24 w-24 text-blue-900" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total de Reservas</p>
                            <p className="text-5xl font-black text-slate-900">{bookings.length}</p>
                        </div>

                        {/* Top Equipments */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Equipamentos Mais Utilizados</p>
                            <div className="space-y-3">
                                {stats.equipmentUsage.map((eq, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm",
                                                idx === 0 ? "bg-gradient-to-br from-amber-300 to-yellow-500 text-white" :
                                                    idx === 1 ? "bg-gray-200 text-gray-600" :
                                                        "bg-amber-700/80 text-white"
                                            )}>
                                                {idx + 1}º
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 uppercase group-hover:text-slate-900 transition-colors">{eq.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">{eq.count}</span>
                                    </div>
                                ))}
                                {stats.equipmentUsage.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-4">Nenhum dado disponível</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Charts & History) - 8 cols */}
                    <div className="col-span-8 space-y-6">
                        {/* Weekly Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Frequência Semanal</h4>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.weeklyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontWeight: 600 }} />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#9CA3AF', fontWeight: 600 }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                                        <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40}>
                                            {stats.weeklyTrend.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#4F46E5' : '#E5E7EB'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent History Table */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[300px]">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Histórico Recente</h4>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                {bookings.map((booking, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50/50 rounded-xl flex items-center justify-between border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {booking.equipment?.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                        {format(parseISO(booking.booking_date), 'dd/MM/yyyy')} • {booking.start_time}
                                                    </p>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <p className="text-[10px] text-gray-500 font-medium">
                                                        {booking.quantity} un.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <span className={clsx(
                                            "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm",
                                            booking.status === 'completed' || booking.status === 'encerrado'
                                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                : "bg-blue-100 text-blue-700 border border-blue-200"
                                        )}>
                                            {booking.status === 'encerrado' ? 'CONCLUÍDO' : booking.status}
                                        </span>
                                    </div>
                                ))}
                                {bookings.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                        <AlertCircle className="h-6 w-6 opacity-20" />
                                        <p className="text-xs font-medium">Nenhum registro encontrado</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end">
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-gray-200 hover:border-gray-300"
                >
                    Fechar Visualização
                </button>
            </div>
        </div>
    );
};

// --- Mobile Implementation ---

const MobileAnalytics: React.FC<TeacherAnalyticsModalProps> = ({
    teacher,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    period,
    setPeriod,
    stats,
    bookings,
    onClose
}) => {
    return (
        <div className="bg-gray-50 w-full h-full sm:h-auto sm:max-h-[85vh] sm:rounded-3xl shadow-none sm:shadow-2xl overflow-hidden flex flex-col">
            {/* Header Mobile */}
            <div className="px-6 py-6 bg-slate-900 text-white flex flex-col gap-6 relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Analytics</p>
                        <h2 className="text-2xl font-black text-white leading-tight">{teacher?.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-3 relative z-10">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider">Período de Análise:</span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-800/50 px-2 py-0.5 rounded w-fit">DD/MM/AAAA</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                        {(['all', 'morning', 'afternoon'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={clsx(
                                    "py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-transparent",
                                    period === p
                                        ? "bg-amber-500 text-slate-900 shadow-md transform scale-[1.02]"
                                        : "bg-slate-800 text-blue-200 border-slate-700"
                                )}
                            >
                                {p === 'all' ? 'Todos' : p === 'morning' ? 'Manhã' : 'Tarde'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Mobile */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* KPI */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Reservas</p>
                        <p className="text-4xl font-black text-slate-900">{bookings.length}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-2xl">
                        <Trophy className="h-6 w-6 text-amber-600" />
                    </div>
                </div>

                {/* Top Equipments */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Equipamentos (+ Usados)</p>
                    <div className="space-y-3">
                        {stats.equipmentUsage.slice(0, 3).map((eq, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]",
                                        idx === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 uppercase">{eq.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-900">{eq.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart Mobile */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Frequência</h4>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.weeklyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" fontSize={8} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontWeight: 600 }} />
                                <YAxis fontSize={8} axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#9CA3AF', fontWeight: 600 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]}>
                                    {stats.weeklyTrend.map((entry, index) => (
                                        <Cell key={`cell-mobile-${index}`} fill={entry.count > 0 ? '#3B82F6' : '#E5E7EB'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* History Mobile */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Últimos Agendamentos</h4>
                    <div className="space-y-3">
                        {bookings.slice(0, 5).map((booking, idx) => (
                            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="bg-blue-50 p-2 rounded-lg shrink-0 mt-0.5">
                                    <Calendar className="h-3 w-3 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-slate-900 truncate pr-2">{booking.equipment?.name}</p>
                                        <span className={clsx(
                                            "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter whitespace-nowrap",
                                            booking.status === 'completed' || booking.status === 'encerrado'
                                                ? "bg-green-50 text-green-700"
                                                : "bg-blue-50 text-blue-700"
                                        )}>
                                            {booking.status === 'encerrado' ? 'OK' : booking.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                        {format(parseISO(booking.booking_date), 'dd/MM')} • {booking.start_time} • {booking.quantity} un.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-20">
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gray-100 active:bg-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};

// --- Main Wrapper ---

export const TeacherAnalyticsModal: React.FC<TeacherAnalyticsModalProps> = (props) => {
    if (!props.isOpen || !props.teacher) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Desktop View */}
            <div className="hidden md:flex w-full h-full items-center justify-center">
                <DesktopAnalytics {...props} />
            </div>

            {/* Mobile View */}
            <div className="flex md:hidden w-full h-full">
                <MobileAnalytics {...props} />
            </div>
        </div>
    );
};
