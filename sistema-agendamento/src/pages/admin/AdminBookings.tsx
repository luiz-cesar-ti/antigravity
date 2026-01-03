import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Admin } from '../../types';
import { format, parseISO } from 'date-fns';
import {
    Search, Calendar, Users, MapPin, FileText, Trash2, AlertTriangle,
    Monitor, Clock, Filter, Laptop, Projector, Speaker, Camera, Mic, Smartphone, Tv, Plug, Repeat, ChevronDown, History
} from 'lucide-react';
import { TermDocument } from '../../components/TermDocument';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Download, X, Share2 } from 'lucide-react';

export function AdminBookings() {
    const { user, role } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('active'); // active, closed, all
    const [searchTerm, setSearchTerm] = useState('');
    const [pdfData, setPdfData] = useState<any>(null);

    // Date range filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [periodFilter, setPeriodFilter] = useState<'morning' | 'afternoon' | 'night' | 'all'>('all');
    const [recurringFilter, setRecurringFilter] = useState<'recurring' | 'normal' | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);

    // state for new custom modal
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bookingId: string | null }>({
        isOpen: false,
        bookingId: null
    });

    const fetchBookings = async () => {
        if (!user) return;

        setLoading(true);
        let query = supabase
            .from('bookings')
            .select(`
                *,
                equipment (name, brand, model),
                users (full_name, email) 
            `);

        if (role === 'admin') {
            const unit = (user as Admin).unit;
            if (unit === 'Matriz') {
                // Matriz admin sees all bookings
            } else if (unit) {
                query = query.eq('unit', unit);
            } else {
                query = query.eq('unit', 'RESTRICTED_ACCESS_NO_UNIT');
            }
        }

        if (startDate) query = query.gte('booking_date', startDate);
        if (endDate) query = query.lte('booking_date', endDate);

        // Status filtering moved to local filteredBookings to account for logical expiration (date/time)

        if (recurringFilter === 'recurring') {
            query = query.eq('is_recurring', true);
        } else if (recurringFilter === 'normal') {
            query = query.eq('is_recurring', false);
        }

        if (periodFilter === 'morning') {
            query = query.gte('start_time', '07:00').lte('start_time', '12:00');
        } else if (periodFilter === 'afternoon') {
            query = query.gte('start_time', '12:01').lte('start_time', '18:00');
        } else if (periodFilter === 'night') {
            query = query.gte('start_time', '18:01').lte('start_time', '23:59');
        }

        const { data, error } = await query
            .order('booking_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (!error && data) {
            setBookings(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, [user?.id, (user as Admin)?.unit, startDate, endDate, statusFilter, periodFilter, recurringFilter]);

    const handleDeleteBooking = async () => {
        if (!deleteModal.bookingId) return;

        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', deleteModal.bookingId);

        if (!error) {
            setDeleteModal({ isOpen: false, bookingId: null });
            fetchBookings();
        } else {
            console.error('Delete error:', error);
            alert('Erro ao excluir agendamento.');
        }
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleOpenTermModal = (booking: any) => {
        if (!booking.term_document) {
            alert('Termo não disponível para este agendamento.');
            return;
        }
        setPdfData(booking);
        setModalOpen(true);
    };

    const handlePdfAction = async (action: 'download' | 'share') => {
        const element = document.getElementById('admin-term-doc-inner');
        if (!element || !pdfData) return;

        setIsGeneratingPdf(true);

        const rawName = pdfData.term_document?.userName || 'usuario';
        const cleanName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const fileName = `TERMO_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        try {
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

            if (action === 'share' && navigator.share) {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                await navigator.share({
                    files: [file],
                    title: 'Termo de Responsabilidade',
                    text: `Segue anexo o termo de responsabilidade de ${rawName}.`
                });
            } else {
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error('PDF Error:', e);
            alert('Erro ao processar o arquivo.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const TermModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative z-50 flex flex-col w-full max-w-5xl h-full max-h-screen sm:max-h-[85vh] bg-white sm:rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all">
                <div className="bg-white px-6 py-5 flex justify-between items-center border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-xl">
                            <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Visualizar Termo</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePdfAction('download')}
                            disabled={isGeneratingPdf}
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black rounded-xl shadow-lg transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Baixar PDF
                        </button>
                        <button
                            onClick={() => handlePdfAction('share')}
                            disabled={isGeneratingPdf}
                            className="sm:hidden p-2.5 bg-green-50 text-green-600 rounded-xl transition-all"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setModalOpen(false)}
                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
                    <div className="bg-white shadow-2xl mx-auto" style={{ maxWidth: '210mm' }}>
                        <div id="admin-term-doc-inner">
                            {pdfData && pdfData.term_document && <TermDocument data={pdfData.term_document} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const isBookingExpired = (booking: Booking) => {
        const now = new Date();
        const bookingEnd = parseISO(`${booking.booking_date}T${booking.end_time}`);
        return now > bookingEnd;
    };

    const getStatusBadge = (booking: Booking) => {
        if (booking.status === 'cancelled_by_user') {
            return (
                <span className="px-2 py-0.5 inline-flex text-[10px] items-center leading-4 font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    Excluído pelo Professor
                </span>
            );
        }

        if (booking.status === 'cancelled') {
            return (
                <span className="px-2 py-0.5 inline-flex text-[10px] items-center leading-4 font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    Cancelado
                </span>
            );
        }

        const expired = isBookingExpired(booking);

        if (expired || booking.status === 'encerrado') {
            return (
                <span className="px-2 py-0.5 inline-flex text-[10px] items-center leading-4 font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">
                    Encerrado
                </span>
            );
        }

        return (
            <span className="px-2 py-0.5 inline-flex text-[10px] items-center leading-4 font-bold uppercase tracking-wider rounded-full bg-green-100 text-green-700 border border-green-200">
                Ativo
            </span>
        );
    };

    const filteredBookings = bookings.filter(b => {
        const expired = isBookingExpired(b);
        const isCancelled = b.status === 'cancelled_by_user' || b.status === 'cancelled';

        // 1. Status Logic
        if (statusFilter === 'active') {
            // "Active" means not expired, not encerrado, and not cancelled
            if (expired || b.status === 'encerrado' || isCancelled) return false;
        } else if (statusFilter === 'closed') {
            // "Closed" means explicitly encerrado OR naturally expired (and not cancelled)
            if (!expired && b.status !== 'encerrado') return false;
            if (isCancelled) return false;
        } else if (statusFilter === 'cancelled') {
            // Explicitly show only cancelled/deleted ones
            if (!isCancelled) return false;
        }

        // 2. Search Logic
        const searchLower = searchTerm.toLowerCase();
        const equipmentName = b.equipment?.name?.toLowerCase() || '';
        const userName = (b as any).users?.full_name?.toLowerCase() || '';
        const local = b.local.toLowerCase();

        return equipmentName.includes(searchLower) ||
            userName.includes(searchLower) ||
            local.includes(searchLower);
    });

    const getEquipmentIcon = (name: string = '') => {
        const n = name.toLowerCase();
        if (n.includes('notebook') || n.includes('laptop') || n.includes('pc') || n.includes('computador')) return <Laptop className="h-6 w-6 text-primary-600" />;
        if (n.includes('projetor') || n.includes('datashow')) return <Projector className="h-6 w-6 text-primary-600" />;
        if (n.includes('caixa') || n.includes('som') || n.includes('audio')) return <Speaker className="h-6 w-6 text-primary-600" />;
        if (n.includes('camera') || n.includes('camara') || n.includes('foto')) return <Camera className="h-6 w-6 text-primary-600" />;
        if (n.includes('microfone') || n.includes('mic')) return <Mic className="h-6 w-6 text-primary-600" />;
        if (n.includes('tablet') || n.includes('ipad') || n.includes('celular')) return <Smartphone className="h-6 w-6 text-primary-600" />;
        if (n.includes('tv') || n.includes('televisao') || n.includes('monitor') || n.includes('tela')) return <Tv className="h-6 w-6 text-primary-600" />;
        if (n.includes('cabo') || n.includes('extensao') || n.includes('fio') || n.includes('adaptador')) return <Plug className="h-6 w-6 text-primary-600" />;
        return <Monitor className="h-6 w-6 text-primary-600" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Gerenciar Agendamentos</h1>
                    <p className="text-sm text-gray-500 mt-1">Acompanhe e gerencie todas as reservas de equipamentos.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar professor, item ou local..."
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 shadow-sm outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all border w-full sm:w-auto justify-center ${showFilters
                            ? 'bg-primary-600 text-white border-primary-600 shadow-xl shadow-primary-200'
                            : 'bg-white text-gray-600 border-gray-100 hover:border-primary-200 shadow-sm'
                            }`}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {(startDate || endDate || periodFilter !== 'all' || statusFilter !== 'all' || recurringFilter !== 'all') && (
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Início</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Fim</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Período</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    value={periodFilter}
                                    onChange={(e) => setPeriodFilter(e.target.value as any)}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer outline-none"
                                >
                                    <option value="all">Todos Períodos</option>
                                    <option value="morning">Manhã (07h-12h)</option>
                                    <option value="afternoon">Tarde (12h-18h)</option>
                                    <option value="night">Noite (18h-24h)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                            <div className="relative">
                                <History className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer outline-none"
                                >
                                    <option value="all">Todos Status</option>
                                    <option value="active">Agendados (Ativos)</option>
                                    <option value="closed">Encerrados</option>
                                    <option value="cancelled">Cancelados/Excluídos</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                            <div className="relative">
                                <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    value={recurringFilter}
                                    onChange={(e) => setRecurringFilter(e.target.value as any)}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer outline-none"
                                >
                                    <option value="all">Todos os Tipos</option>
                                    <option value="normal">Agendamento Normal</option>
                                    <option value="recurring">Agendamento Fixo</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setPeriodFilter('all');
                                setStatusFilter('active');
                                setRecurringFilter('all');
                                setSearchTerm('');
                            }}
                            className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Sincronizando agendamentos...</p>
                </div>
            ) : (
                <div className="bg-transparent space-y-4">
                    <ul className="space-y-4">
                        {filteredBookings.length === 0 ? (
                            <li className="px-6 py-24 text-center">
                                <Filter className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                                <p className="text-lg font-bold text-gray-900">Nenhum agendamento encontrado</p>
                                <p className="text-sm text-gray-500 mt-1">Tente ajustar seus filtros ou termos de pesquisa.</p>
                            </li>
                        ) : (
                            filteredBookings.map((booking) => (
                                <li key={booking.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                                    <div className="p-6 md:p-8">
                                        {/* TOP SECTION: Main Info */}
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-gray-50">

                                            {/* Left: Equipment Focus */}
                                            <div className="flex items-start gap-5">
                                                <div className="p-4 bg-gray-50 rounded-2xl shrink-0 group-hover:bg-primary-50 transition-colors duration-300 ring-1 ring-gray-100">
                                                    {getEquipmentIcon(booking.equipment?.name)}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                                                        {booking.equipment?.name}
                                                    </h3>
                                                    <div className="inline-flex items-center px-2.5 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-primary-100">
                                                        # {booking.quantity} {booking.quantity === 1 ? 'UNIDADE' : 'UNIDADES'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Teacher & Status */}
                                            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 px-0 md:px-8 border-l-0 md:border-l border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                                        <Users className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900 truncate">{(booking as any).users?.full_name}</span>
                                                            <div className={booking.status === 'cancelled_by_user' ? 'hidden md:block' : ''}>
                                                                {getStatusBadge(booking)}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                            <span className="truncate">{(booking as any).users?.email}</span>
                                                            {booking.display_id && (
                                                                <span className="text-primary-600">#{booking.display_id}</span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {booking.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Primary Actions */}
                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                {/* Badges */}
                                                <div className="flex flex-col items-end gap-1.5">
                                                    {booking.is_recurring && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-tight rounded-lg border border-amber-100 italic shadow-sm">
                                                            <Repeat className="h-3 w-3" />
                                                            Agendamento Fixo
                                                        </div>
                                                    )}

                                                    {booking.status === 'cancelled_by_user' && (
                                                        <div className="md:hidden">
                                                            {getStatusBadge(booking)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Buttons */}
                                                <div className="flex items-center gap-2">
                                                    {booking.term_document && (
                                                        <button
                                                            onClick={() => handleOpenTermModal(booking)}
                                                            className="flex items-center gap-2 h-11 px-5 bg-white border border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                                                        >
                                                            <FileText className="h-4 w-4 text-primary-500" />
                                                            Termo
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, bookingId: booking.id })}
                                                        className="h-11 w-11 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all active:scale-95 border border-red-100 hover:border-red-600 shadow-sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BOTTOM SECTION: Grid Details */}
                                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">PROFESSOR</span>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                                                    <Users className="h-4 w-4 text-gray-300" />
                                                    {(booking as any).users?.full_name}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ESPECIFICAÇÃO</span>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                                                    <Monitor className="h-4 w-4 text-gray-300" />
                                                    {booking.equipment?.brand} {booking.equipment?.model}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">SALA/LOCAL</span>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                                                    <MapPin className="h-4 w-4 text-gray-300" />
                                                    {booking.local}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">AGENDADO PARA</span>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                                                    <Clock className="h-4 w-4 text-gray-300" />
                                                    {format(parseISO(booking.booking_date), "dd/MM/yyyy")} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                    ></div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6">
                                <AlertTriangle className="h-10 w-10 text-red-600" />
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 text-center mb-2">
                                Excluir Registro?
                            </h3>

                            <p className="text-gray-500 text-center text-sm leading-relaxed mb-8">
                                Esta ação é <span className="text-red-600 font-bold underline decoration-2">definitiva</span>. O termo assinado será removido e o histórico de agendamento deixará de existir.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteBooking}
                                    className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95"
                                >
                                    Confirmar Exclusão Permanente
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm rounded-2xl transition-all"
                                >
                                    Manter Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalOpen && <TermModal />}
        </div>
    );
}
