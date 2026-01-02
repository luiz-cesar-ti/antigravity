import { useState, useEffect } from 'react';
import {
    Calendar, Clock, MapPin, Monitor, Trash2, AlertTriangle, History,
    Laptop, Projector, Speaker, Camera, Mic, Smartphone, Share2, Tv, Plug, FileText, Download, X, Repeat, Filter, ChevronDown, Search
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Booking } from '../types';
import { format, parseISO } from 'date-fns';
import { TermDocument } from '../components/TermDocument';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export function TeacherBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [pdfData, setPdfData] = useState<Booking | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bookingId: string | null; recurringId?: string | null }>({
        isOpen: false,
        bookingId: null,
        recurringId: null
    });
    const [deleting, setDeleting] = useState(false);

    // Filters State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [periodFilter, setPeriodFilter] = useState<'morning' | 'afternoon' | 'night' | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'active' | 'encerrado' | 'all'>('all');
    const [recurringFilter, setRecurringFilter] = useState<'recurring' | 'normal' | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const handleOpenTermModal = (booking: Booking) => {
        setPdfData(booking);
        setModalOpen(true);
    };

    // Unified PDF download/share action inside modal
    const handlePdfAction = async (action: 'download' | 'share') => {
        const element = document.getElementById('teacher-term-doc-inner');
        if (!element || !pdfData) return;

        setIsGeneratingPdf(true);

        const safeName = (pdfData.term_document?.userName || 'Professor').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `TERMO_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;

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
                    text: 'Segue em anexo o Termo de Responsabilidade assinado digitalmente.'
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
            alert('Erro ao processar o arquivo. Tente novamente.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const TermModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative z-50 flex flex-col w-full max-w-5xl h-full max-h-screen sm:max-h-[85vh] bg-white sm:rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all">
                <div className="bg-white px-6 py-5 flex justify-between items-center border-b border-gray-100 shrink-0 transition-all">
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
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            <Download className="h-4 w-4" />
                            Baixar PDF
                        </button>

                        {/* Share Mobile */}
                        <button
                            onClick={() => handlePdfAction('share')}
                            disabled={isGeneratingPdf}
                            className="sm:hidden p-2.5 bg-green-50 text-green-600 rounded-xl active:scale-95 transition-all"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>

                        <button
                            onClick={() => setModalOpen(false)}
                            className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-500 rounded-xl transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
                    <div className="bg-white shadow-2xl mx-auto origin-top transition-transform" style={{ maxWidth: '210mm' }}>
                        <div id="teacher-term-doc-inner">
                            {pdfData && pdfData.term_document && <TermDocument data={pdfData.term_document} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const getEquipmentIcon = (name: string = '') => {
        const n = name.toLowerCase();
        const baseClass = "h-6 w-6 text-primary-600";
        if (n.includes('notebook') || n.includes('laptop') || n.includes('pc') || n.includes('computador')) return <Laptop className={baseClass} />;
        if (n.includes('projetor') || n.includes('datashow')) return <Projector className={baseClass} />;
        if (n.includes('caixa') || n.includes('som') || n.includes('audio')) return <Speaker className={baseClass} />;
        if (n.includes('camera') || n.includes('camara') || n.includes('foto')) return <Camera className={baseClass} />;
        if (n.includes('microfone') || n.includes('mic')) return <Mic className={baseClass} />;
        if (n.includes('tablet') || n.includes('ipad') || n.includes('celular')) return <Smartphone className={baseClass} />;
        if (n.includes('tv') || n.includes('televisao') || n.includes('monitor') || n.includes('tela')) return <Tv className={baseClass} />;
        if (n.includes('cabo') || n.includes('extensao') || n.includes('fio') || n.includes('adaptador')) return <Plug className={baseClass} />;
        return <Monitor className={baseClass} />;
    };



    const fetchBookings = async () => {
        if (!user) return;

        setLoading(true);
        let query = supabase
            .from('bookings')
            .select(`
                *,
                equipment (name, brand, model)
            `)
            .eq('user_id', user.id)
            .neq('status', 'cancelled_by_user');

        if (startDate) query = query.gte('booking_date', startDate);
        if (endDate) query = query.lte('booking_date', endDate);

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        if (recurringFilter === 'recurring') {
            query = query.eq('is_recurring', true);
        } else if (recurringFilter === 'normal') {
            query = query.eq('is_recurring', false);
        }

        // Periods logic (approximate)
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
            setBookings(data as Booking[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, [user?.id, startDate, endDate, periodFilter, statusFilter, recurringFilter]);

    const handleDelete = async () => {
        if (!deleteModal.bookingId) return;

        setDeleting(true);
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled_by_user' })
            .eq('id', deleteModal.bookingId);

        if (!error) {
            setDeleteModal({ isOpen: false, bookingId: null });
            fetchBookings();
        } else {
            console.error('Delete error:', error);
            alert('Erro ao excluir agendamento.');
        }
        setDeleting(false);
    };

    const handleDeleteSeries = async () => {
        if (!deleteModal.recurringId) return;

        const confirmAll = window.confirm("Isso irá cancelar TODAS as ocorrências futuras deste agendamento fixo. Deseja continuar?");
        if (!confirmAll) return;

        setDeleting(true);
        try {
            // 1. Deactivate the rule
            const { error: ruleError } = await supabase
                .from('recurring_bookings')
                .update({ is_active: false })
                .eq('id', deleteModal.recurringId);

            if (ruleError) throw ruleError;

            // 2. Cancel all future instances
            const today = new Date().toISOString().split('T')[0];
            const { error: bookingsError } = await supabase
                .from('bookings')
                .update({ status: 'cancelled_by_user' })
                .eq('recurring_id', deleteModal.recurringId)
                .gte('booking_date', today);

            if (bookingsError) throw bookingsError;

            setDeleteModal({ isOpen: false, bookingId: null, recurringId: null });
            fetchBookings();
            alert('Agendamento fixo e todas as ocorrências futuras foram canceladas.');
        } catch (error) {
            console.error('Series delete error:', error);
            alert('Erro ao cancelar a série de agendamentos.');
        } finally {
            setDeleting(false);
        }
    };

    const filteredBookings = bookings.filter(b => {
        const searchLower = searchTerm.toLowerCase();
        const equipmentName = b.equipment?.name?.toLowerCase() || '';
        const local = b.local.toLowerCase();
        return equipmentName.includes(searchLower) || local.includes(searchLower);
    });

    if (loading) {
        return (
            <div className="flex flex-col h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando seu histórico...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Meus Agendamentos</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie suas reservas e visualize termos assinados.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 font-bold" />
                        <input
                            type="text"
                            placeholder="Buscar item ou local..."
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
                        <Filter className="h-4 w-4 font-bold" />
                        Filtros
                        {(startDate || endDate || periodFilter !== 'all' || statusFilter !== 'all' || recurringFilter !== 'all') && (
                            <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
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
                                    <option value="encerrado">Encerrados</option>
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
                                setStatusFilter('all');
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

            {filteredBookings.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <History className="mx-auto h-20 w-20 text-gray-100 mb-6" />
                    <h3 className="text-xl font-black text-gray-900">
                        {searchTerm || startDate || endDate || periodFilter !== 'all' || statusFilter !== 'all' || recurringFilter !== 'all'
                            ? 'Nenhum agendamento encontrado'
                            : 'Nenhum agendamento ativo'}
                    </h3>
                    <p className="mt-2 text-gray-500 text-sm max-w-xs mx-auto">
                        Tente ajustar seus filtros ou busca para encontrar suas reservas.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredBookings.map((booking) => {
                        const now = new Date();
                        const bookingEnd = parseISO(`${booking.booking_date}T${booking.end_time}`);
                        const isExpired = now > bookingEnd;

                        return (
                            <div key={booking.id} className="group relative bg-white shadow-sm rounded-[2.5rem] p-8 border border-gray-100 hover:shadow-2xl hover:shadow-primary-100/30 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-white/20 group-hover:text-white transition-colors duration-200">
                                                {getEquipmentIcon(booking.equipment?.name)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-900 transition-colors duration-200">
                                                    {booking.equipment?.name}
                                                </h3>
                                                <div className="flex flex-col">
                                                    <p className="text-xs text-indigo-600 group-hover:text-indigo-800 font-medium">
                                                        {booking.equipment?.brand} {booking.equipment?.model}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 group-hover:text-indigo-700 font-bold">
                                                        Qtd: {booking.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`
                                                px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${booking.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    booking.status === 'encerrado' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                        'bg-red-50 text-red-700 border-red-100'}
                                            `}>
                                                {booking.status === 'active' ? 'Agendado' :
                                                    booking.status === 'encerrado' ? 'Encerrado' : 'Cancelado'}
                                            </span>
                                            {booking.is_recurring && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-tight rounded-lg border border-amber-100 italic">
                                                    <Repeat className="h-2 w-2" />
                                                    Fixo
                                                </div>
                                            )}
                                            {booking.display_id && (
                                                <span className="text-[10px] font-mono text-gray-400 font-bold tracking-wider">
                                                    #{booking.display_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-sm text-gray-600">
                                        <div className="flex items-center p-3 bg-gray-50 rounded-2xl border border-gray-50 group-hover:border-primary-100 transition-all">
                                            <div className="p-1.5 bg-white rounded-lg mr-4 shadow-sm">
                                                <MapPin className="h-4 w-4 text-primary-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Localização</span>
                                                <span className="font-bold text-gray-700">{booking.local} • {booking.unit}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-50">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</span>
                                                <div className="flex items-center font-bold text-gray-700">
                                                    <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                                                    {format(parseISO(booking.booking_date), "dd/MM/yy")}
                                                </div>
                                            </div>
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-50">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Horário</span>
                                                <div className="flex items-center font-bold text-gray-700">
                                                    <Clock className="h-4 w-4 mr-2 text-primary-600" />
                                                    {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.observations && (
                                        <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                                            <p className="text-[11px] text-amber-800 font-medium italic leading-relaxed line-clamp-2">
                                                "{booking.observations}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleOpenTermModal(booking)}
                                        className="flex items-center justify-center py-4 px-6 bg-white border border-gray-200 text-gray-700 hover:border-primary-200 hover:text-primary-600 font-bold text-xs rounded-2xl transition-all active:scale-95 shadow-sm"
                                    >
                                        <FileText className="h-4 w-4 mr-2 text-primary-600" />
                                        Ver Termo
                                    </button>

                                    {!isExpired && booking.status === 'active' && (
                                        <button
                                            onClick={() => setDeleteModal({
                                                isOpen: true,
                                                bookingId: booking.id,
                                                recurringId: booking.recurring_id
                                            })}
                                            className="flex items-center justify-center py-4 px-6 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black text-xs rounded-2xl transition-all active:scale-95 group/btn"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                                            Excluir
                                        </button>
                                    )}
                                    {isExpired && (
                                        <div className="py-4 px-6 bg-gray-50 text-gray-400 font-bold text-xs rounded-2xl text-center border border-dashed border-gray-200">
                                            Finalizado
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Visualização do Termo */}
            {modalOpen && <TermModal />}

            {/* Teacher Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                    ></div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="p-10">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-orange-50 mb-8">
                                <AlertTriangle className="h-10 w-10 text-orange-600" />
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 text-center mb-3">
                                {bookings.find(b => b.id === deleteModal.bookingId)?.is_recurring
                                    ? 'Excluir Ocorrência Fixa?'
                                    : 'Cancelar Agendamento?'
                                }
                            </h3>

                            <p className="text-gray-500 text-center text-sm leading-relaxed mb-10 px-2">
                                {bookings.find(b => b.id === deleteModal.bookingId)?.is_recurring
                                    ? "Você está excluindo esta data específica do seu agendamento fixo. As outras semanas permanecem ativas."
                                    : "Os equipamentos ficarão imediatamente disponíveis para outros professores. O termo assinado continuará disponível para auditoria da administração."
                                }
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    disabled={deleting}
                                    onClick={handleDelete}
                                    className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {deleting ? 'Processando...' : 'Confirmar Cancelamento'}
                                </button>

                                {deleteModal.recurringId && (
                                    <button
                                        disabled={deleting}
                                        onClick={handleDeleteSeries}
                                        className="w-full px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Repeat className="h-4 w-4" />
                                        Cancelar SÉRIE Agendamento Fixo
                                    </button>
                                )}

                                <button
                                    disabled={deleting}
                                    onClick={() => setDeleteModal({ isOpen: false, bookingId: null, recurringId: null })}
                                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm rounded-2xl transition-all disabled:opacity-50"
                                >
                                    Manter Agendamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
