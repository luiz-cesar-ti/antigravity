import { useState, useEffect } from 'react';
import {
    Calendar, Clock, MapPin, Monitor, Trash2, History, AlertTriangle,
    Laptop, Projector, Speaker, Camera, Mic, Smartphone, Share2, Tv, Plug, FileText, Download, X, Repeat, Filter, ChevronDown, Search
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Booking, User } from '../types';
import { format, parseISO } from 'date-fns';
import { TermDocument } from '../components/TermDocument';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export function TeacherBookings() {
    const { user } = useAuth();
    const currentUser = user as User;
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [pdfData, setPdfData] = useState<Booking | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bookingId: string | null; recurringId?: string | null; displayId?: string | null; bookingDate?: string | null }>({
        isOpen: false,
        bookingId: null,
        recurringId: null,
        displayId: null,
        bookingDate: null
    });
    // const [deleting, setDeleting] = useState(false); // Unused

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

    const handlePdfAction = async (action: 'download' | 'share') => {
        const element = document.getElementById('term-doc-inner');
        if (!element || !pdfData) return;

        setIsGeneratingPdf(true);

        const userName = pdfData.term_document?.userName || currentUser?.full_name || 'Professor';
        const safeName = userName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `TERMO_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg' as const, quality: 1.0 },
            html2canvas: {
                scale: 2,
                dpi: 192,
                letterRendering: true,
                useCORS: true,
                onclone: (clonedDoc: any) => {
                    const el = clonedDoc.getElementById('term-doc-inner');
                    if (el) {
                        el.style.width = '210mm';
                        el.style.maxWidth = 'none';
                        el.style.margin = '0';
                    }
                    if (clonedDoc.defaultView) {
                        clonedDoc.defaultView.devicePixelRatio = 1;
                    }
                }
            },
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
            alert('Erro ao processar o arquivo.');
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
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Termo</h3>
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
                    <div className="term-doc-preview mx-auto">
                        {pdfData && pdfData.term_document && (
                            <TermDocument
                                data={{
                                    ...pdfData,
                                    ...pdfData.term_document,
                                    created_at: pdfData.created_at
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const getEquipmentIcon = (name: string = '', className?: string) => {
        const n = name.toLowerCase();
        const baseClass = className || "h-6 w-6 text-primary-600";
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
                created_at,
                equipment (name, brand, model)
            `)
            .eq('user_id', user.id)
            .neq('status', 'cancelled_by_user');

        if (startDate) query = query.gte('booking_date', startDate);
        if (endDate) query = query.lte('booking_date', endDate);
        if (statusFilter !== 'all') query = query.eq('status', statusFilter);

        if (recurringFilter === 'recurring') query = query.eq('is_recurring', true);
        else if (recurringFilter === 'normal') query = query.eq('is_recurring', false);

        if (periodFilter === 'morning') query = query.gte('start_time', '07:00').lte('start_time', '12:00');
        else if (periodFilter === 'afternoon') query = query.gte('start_time', '12:01').lte('start_time', '18:00');
        else if (periodFilter === 'night') query = query.gte('start_time', '18:01').lte('start_time', '23:59');

        const { data, error } = await query
            .order('booking_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (!error && data) {
            setBookings(data as Booking[]);

            // Auto expire locally
            const now = new Date();
            const expiredIds = data
                .filter((b: any) => {
                    if (b.status !== 'active' || !b.booking_date || !b.end_time) return false;
                    const bDate = b.booking_date;
                    const bTime = b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time;
                    try {
                        const expiration = parseISO(`${bDate}T${bTime}`);
                        return !isNaN(expiration.getTime()) && now > expiration;
                    } catch (e) { return false; }
                })
                .map((b: any) => b.id);

            if (expiredIds.length > 0) {
                supabase.from('bookings').update({ status: 'encerrado' }).in('id', expiredIds);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
        const bookingsSub = supabase
            .channel('teacher_bookings_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user?.id}` }, () => fetchBookings())
            .subscribe();
        return () => { bookingsSub.unsubscribe(); };
    }, [user?.id, startDate, endDate, periodFilter, statusFilter, recurringFilter]);

    const handleDelete = async () => {
        if (!deleteModal.bookingId) return;
        // setDeleting(true);

        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled_by_user' })
            .match(
                deleteModal.displayId && deleteModal.bookingDate
                    ? {
                        display_id: deleteModal.displayId,
                        booking_date: deleteModal.bookingDate
                    }
                    : { id: deleteModal.bookingId }
            );

        if (!error) {
            setDeleteModal({ isOpen: false, bookingId: null, displayId: null, bookingDate: null });
            fetchBookings();
        } else {
            console.error('Delete error:', error);
            alert('Erro ao excluir agendamento.');
        }
        // setDeleting(false);
    };

    const filteredList = bookings.filter(b => {
        const searchLower = searchTerm.toLowerCase();
        const equipmentName = b.equipment?.name?.toLowerCase() || '';
        const local = b.local.toLowerCase();
        return equipmentName.includes(searchLower) || local.includes(searchLower);
    });

    const transformLocal = (localCode: string, unit: string) => {
        if (!localCode) return 'Local não definido';
        try {
            const unitMap: Record<string, string> = {
                'S01': 'Sala 01', 'S02': 'Sala 02', 'S03': 'Sala 03', 'S04': 'Sala 04', 'S05': 'Sala 05',
                'S06': 'Sala 06', 'S07': 'Sala 07', 'S08': 'Sala 08', 'S09': 'Sala 09', 'S10': 'Sala 10',
                'S11': 'Sala 11', 'S12': 'Sala 12', 'S13': 'Sala 13', 'S14': 'Sala 14', 'S15': 'Sala 15',
                'S16': 'Sala 16', 'S17': 'Sala 17', 'S18': 'Sala 18', 'S19': 'Sala 19', 'S20': 'Sala 20',
                'LAB01': 'Lab. Informática 01', 'LAB02': 'Lab. Informática 02', 'AUD': 'Auditório',
                'BIB': 'Biblioteca', 'QPD': 'Quadra Poliesportiva', 'PAT': 'Pátio', 'CAN': 'Cantina', 'DIR': 'Diretoria',
                'SEC': 'Secretaria', 'SALPROF': 'Sala dos Professores', 'COORD': 'Coordenação'
            };

            // If it's a known code, return the full name
            if (unitMap[localCode]) return unitMap[localCode];

            // If unit is Matriz and local is just a number, format it
            if (unit === 'Matriz' && /^\d+$/.test(localCode)) {
                return `Sala ${localCode.padStart(2, '0')}`;
            }

            return localCode;
        } catch (e) { return localCode; }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando seu histórico...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                            placeholder="Buscar equipamento ou local..."
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

            {
                showFilters && (
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
                                        <option value="encerrado">Concluídos</option>
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
                                        <option value="recurring">Agendamento Recorrente</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                filteredList.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <History className="mx-auto h-20 w-20 text-gray-100 mb-6" />
                        <h3 className="text-xl font-black text-gray-900">
                            {searchTerm || startDate || endDate || periodFilter !== 'all' || statusFilter !== 'all' || recurringFilter !== 'all'
                                ? 'Nenhum agendamento encontrado'
                                : 'Nenhum agendamento ativo'}
                        </h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
                        {(() => {
                            const grouped: Record<string, Booking[]> = {};
                            const singles: Booking[] = [];

                            filteredList.forEach((b: Booking) => {
                                if (b.display_id) {
                                    const groupKey = `${b.booking_date}_${b.display_id}`;
                                    if (!grouped[groupKey]) grouped[groupKey] = [];
                                    grouped[groupKey].push(b);
                                } else {
                                    singles.push(b);
                                }
                            });

                            const groupKeys = Object.keys(grouped);

                            const renderList = [
                                ...groupKeys.map(key => grouped[key]),
                                ...singles.map(b => [b])
                            ].sort((a, b) => {
                                const dateA = a[0].booking_date + a[0].start_time;
                                const dateB = b[0].booking_date + b[0].start_time;
                                return dateA.localeCompare(dateB);
                            });

                            return renderList.map((group) => {
                                const first = group[0];
                                const isMulti = group.length > 1;
                                const now = new Date();
                                const bDate = first.booking_date || '';
                                const bTime = (first.end_time && first.end_time.length === 5) ? `${first.end_time}:00` : (first.end_time || '00:00:00');
                                let isExpired = false;
                                try {
                                    const bookingEnd = parseISO(`${bDate}T${bTime}`);
                                    isExpired = !isNaN(bookingEnd.getTime()) && now > bookingEnd;
                                } catch (e) { isExpired = false; }
                                const isEffectivelyClosed = first.status === 'encerrado' || (first.status === 'active' && isExpired);

                                const icon = getEquipmentIcon(first.equipment?.name, "h-6 w-6");

                                return (
                                    <div key={first.display_id ? `${first.booking_date}_${first.display_id}` : first.id} className="group relative bg-white shadow-sm rounded-[2rem] p-5 md:p-6 border border-gray-100 hover:shadow-2xl hover:shadow-primary-100/30 transition-all duration-300 flex flex-col">
                                        <div className="flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-gray-100 shadow-sm bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-200`}>
                                                            {icon}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h3 className="font-bold text-gray-900 group-hover:text-primary-900 transition-colors duration-200 truncate leading-tight">
                                                                    {isMulti ? 'Multi-Equipamentos' : first.equipment?.name}
                                                                </h3>

                                                            </div>
                                                            <div className="flex flex-col mt-0.5">
                                                                <p className={`text-[10px] font-bold uppercase truncate text-gray-500`}>
                                                                    {isMulti ? `${group.length} itens no termo` : `${first.equipment?.brand || ''} ${first.equipment?.model || ''}`}
                                                                </p>
                                                                {!isMulti && (
                                                                    <p className="text-[10px] font-black text-blue-600 uppercase mt-0.5">
                                                                        Quantidade: {first.quantity} {first.quantity > 1 ? 'unidades' : 'unidade'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                                                    <div className="flex items-center gap-1.5">
                                                        {first.is_recurring && (
                                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-tight rounded-full border border-amber-100 italic transition-colors group-hover:bg-amber-100">
                                                                <Repeat className="h-2.5 w-2.5" />
                                                                Recorrente
                                                            </div>
                                                        )}
                                                        <span className={`
                                                            px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tighter
                                                            ${first.status === 'active' && !isExpired ? 'bg-green-50 text-green-700 border-green-100' :
                                                                isEffectivelyClosed ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                    'bg-red-50 text-red-700 border-red-100'}
                                                        `}>
                                                            {first.status === 'active' && !isExpired ? 'Reservado' :
                                                                isEffectivelyClosed ? 'Concluído' : 'Cancelado'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isMulti && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                                    {group.map((b: Booking) => (
                                                        <div key={b.id} className="flex items-center gap-3 p-2 bg-gray-50/50 rounded-2xl border border-gray-100 group-hover:border-primary-200 transition-all">
                                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 border-2 border-primary-500 shadow-sm transition-transform group-hover:scale-105">
                                                                {getEquipmentIcon(b.equipment?.name, "h-6 w-6 text-primary-600")}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] font-black text-gray-900 truncate leading-tight tracking-tight">{b.equipment?.name}</p>
                                                                <p className="text-[9px] text-blue-600 truncate font-bold uppercase">Qtd: {b.quantity} {b.quantity > 1 ? 'unidades' : 'unidade'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-3 text-sm text-gray-600 mt-2">
                                                <div className="flex items-center p-2.5 bg-gray-50/50 rounded-2xl border border-gray-50 group-hover:border-primary-100/50 transition-all">
                                                    <div className="p-1.5 bg-white rounded-lg mr-3 shadow-sm shrink-0">
                                                        <MapPin className="h-3.5 w-3.5 text-primary-600" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Localização</span>
                                                        <span className="font-bold text-gray-700 text-xs truncate">
                                                            {transformLocal(first.local, first.unit)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col p-2.5 bg-gray-50/50 rounded-2xl border border-gray-50 shrink-0">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</span>
                                                        <div className="flex items-center font-bold text-gray-700 text-xs">
                                                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
                                                            {format(parseISO(first.booking_date), "dd/MM/yy")}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col p-2.5 bg-gray-50/50 rounded-2xl border border-gray-50 shrink-0">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Horário</span>
                                                        <div className="flex items-center font-bold text-gray-700 text-xs">
                                                            <Clock className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
                                                            {first.start_time.slice(0, 5)}-{first.end_time.slice(0, 5)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Código Hash</span>
                                                    <span className="text-[9px] font-mono font-bold text-gray-400 truncate max-w-[150px]">
                                                        {first.id}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-black text-primary-700 bg-primary-50 px-2 py-1 rounded-md border border-primary-100 scale-90 origin-right whitespace-nowrap">
                                                        ID TERMO: {first.id.split('-')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-2 grid-cols-1 sm:grid-cols-2">
                                            <button
                                                onClick={() => handleOpenTermModal(first)}
                                                className="flex items-center justify-center py-3 px-4 bg-white border border-gray-200 text-gray-700 hover:border-primary-200 hover:text-primary-600 font-bold text-[10px] rounded-xl transition-all active:scale-95 shadow-sm uppercase tracking-wider"
                                            >
                                                <FileText className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
                                                Termo
                                            </button>

                                            <button
                                                onClick={() => setDeleteModal({
                                                    isOpen: true,
                                                    bookingId: first.id,
                                                    recurringId: first.recurring_id,
                                                    displayId: first.display_id,
                                                    bookingDate: first.booking_date
                                                })}
                                                className="flex items-center justify-center py-3 px-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black text-[10px] rounded-xl transition-all active:scale-95 group/btn border border-red-100 uppercase tracking-wider"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()
                        }
                    </div>
                )
            }

            {modalOpen && <TermModal />}

            {
                deleteModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModal({ isOpen: false, bookingId: null })} />
                        <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Excluir Agendamento?</h3>
                            <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed">
                                Tem certeza que deseja excluir esta reserva?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDelete}
                                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 active:scale-95 transition-all text-sm uppercase tracking-wide"
                                >
                                    Confirmar Exclusão
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                                    className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-95 transition-all text-sm uppercase tracking-wide"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
