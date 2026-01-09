import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Admin } from '../../types';
import { format, parseISO } from 'date-fns';
import {
    Search, Calendar, Users, MapPin, FileText, Trash2, AlertCircle,
    Monitor, Clock, Filter, Laptop, Projector, Speaker, Camera, Mic, Smartphone, Tv, Plug, Repeat, ChevronDown, History,
    Download, X, Share2, Building
} from 'lucide-react';
import { TermDocument } from '../../components/TermDocument';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { SCHOOL_UNITS } from '../../utils/constants';

export function AdminBookings() {
    const { user, role } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [targetUnit, setTargetUnit] = useState<string>(SCHOOL_UNITS[0]);
    const [pdfData, setPdfData] = useState<any>(null);

    const isSuperAdmin = (user as Admin)?.role === 'super_admin';
    const adminUnit = (user as Admin)?.unit;

    useEffect(() => {
        if (user) {
            if (isSuperAdmin) {
                const userUnit = (user as Admin)?.unit;
                if (userUnit && SCHOOL_UNITS.includes(userUnit)) {
                    setTargetUnit(userUnit);
                }
            } else if (adminUnit) {
                setTargetUnit(adminUnit);
            }
        }
    }, [user?.id, adminUnit, isSuperAdmin]);

    // Date range filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [periodFilter, setPeriodFilter] = useState<'morning' | 'afternoon' | 'night' | 'all'>('all');
    const [recurringFilter, setRecurringFilter] = useState<'recurring' | 'normal' | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bookingIds: string[] }>({
        isOpen: false,
        bookingIds: []
    });

    const fetchBookings = async () => {
        if (!user) return;
        setLoading(true);

        // 1. Determine Unit Filter for RPC
        let unitFilter: string | null = null;
        if (role === 'admin' || role === 'super_admin') {
            if (isSuperAdmin) {
                // Super Admin: uses dropdown selection (targetUnit)
                if (targetUnit) unitFilter = targetUnit;
            } else {
                // Normal Admin: locked to their own unit
                const unit = (user as Admin).unit;
                if (unit && unit !== 'Matriz') unitFilter = unit;
                else if (!unit) unitFilter = 'RESTRICTED_ACCESS_NO_UNIT';
            }
        }

        // 2. Determine Recurring Filter for RPC
        let recurringBool: boolean | null = null;
        if (recurringFilter === 'recurring') recurringBool = true;
        if (recurringFilter === 'normal') recurringBool = false;

        // 3. Call Secure RPC
        const { data, error } = await supabase.rpc('get_admin_bookings', {
            p_unit: unitFilter,
            p_start_date: startDate || null,
            p_end_date: endDate || null,
            p_is_recurring: recurringBool
        });

        if (!error && data) {
            let fetchedBookings = data as any[];

            // 4. Apply Period Filter Client-Side (since RPC only filters by Date)
            if (periodFilter === 'morning') {
                fetchedBookings = fetchedBookings.filter(b => b.start_time >= '07:00' && b.start_time <= '12:00');
            } else if (periodFilter === 'afternoon') {
                fetchedBookings = fetchedBookings.filter(b => b.start_time >= '12:01' && b.start_time <= '18:00');
            } else if (periodFilter === 'night') {
                fetchedBookings = fetchedBookings.filter(b => b.start_time >= '18:01' && b.start_time <= '23:59');
            }

            setBookings(fetchedBookings);
        } else if (error) {
            console.error('Error fetching admin bookings:', error);
            alert(`Erro Crítico ao buscar agendamentos: ${error.message}\nCódigo: ${error.code || 'N/A'}\nPor favor, envie este erro ao suporte.`);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
        const subscription = supabase.channel('admin_bookings_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchBookings())
            .subscribe();
        return () => { subscription.unsubscribe(); };
    }, [user?.id, startDate, endDate, statusFilter, periodFilter, recurringFilter, targetUnit]);

    const handleDeleteBooking = async () => {
        if (deleteModal.bookingIds.length === 0) return;

        const { error } = await supabase.rpc('delete_admin_bookings', {
            p_booking_ids: deleteModal.bookingIds
        });

        if (!error) {
            setDeleteModal({ isOpen: false, bookingIds: [] });
            fetchBookings();
        } else {
            console.error('Delete error:', error);
            alert('Erro ao excluir agendamento(s).');
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
        const element = document.getElementById('term-doc-inner');
        if (!element || !pdfData) return;

        setIsGeneratingPdf(true);

        const rawName = pdfData.term_document?.userName || 'usuario';
        const cleanName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const fileName = `TERMO_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;

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
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Termo</h3>
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
                    <div className="term-doc-preview mx-auto">
                        <div id="term-doc-inner-ghost" style={{ display: 'none' }}></div> {/* for selector safety if needed */}
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

    const isBookingExpired = (booking: Booking) => {
        if (!booking.booking_date || !booking.end_time) return false;
        const now = new Date();
        try {
            const bookingEnd = parseISO(`${booking.booking_date}T${booking.end_time}`);
            return !isNaN(bookingEnd.getTime()) && now > bookingEnd;
        } catch {
            return false;
        }
    };

    const getStatusBadge = (booking: Booking) => {
        if (booking.status === 'cancelled_by_user') {
            return (
                <span className="px-2 py-0.5 inline-flex text-[8px] items-center leading-3 font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">
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
                <span className="px-2 py-0.5 inline-flex text-[10px] items-center leading-4 font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Concluído
                </span>
            );
        }

        if (booking.is_recurring) {
            return (
                <div className="flex gap-1">
                    <span className="px-2 py-0.5 inline-flex text-[10px] items-center leading-4 font-bold uppercase tracking-wider rounded-full bg-green-100 text-green-700 border border-green-200">
                        Ativo
                    </span>
                    <span className="px-2 py-0.5 inline-flex text-[10px] items-center leading-4 font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Recorrente
                    </span>
                </div>
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
        } else if (statusFilter === 'all') {
            // "All" keeps everything visible
            return true;
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

    return (
        <div className="space-y-6">
            {/* Super Admin Unit Selector */}
            {isSuperAdmin && (
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <Building className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Visão Global</h2>
                            <p className="text-xs text-gray-500 font-bold">Selecione uma unidade para gerenciar</p>
                        </div>
                    </div>
                    <select
                        value={targetUnit}
                        onChange={(e) => setTargetUnit(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {SCHOOL_UNITS.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Information Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-2 bg-amber-100 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-amber-800 leading-relaxed">
                    Aviso: Os termos gerados em cada agendamento só devem ter o download realizado em caso de necessidade.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Gerenciar Agendamentos <span className="text-primary-600 text-xs font-bold">(v2.2)</span></h1>
                    <p className="text-sm text-gray-500 mt-1">Acompanhe e gerencie todas as reservas de equipamentos (Sincronização Ativa).</p>
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
                                    <option value="closed">Concluídos</option>
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
                                    <option value="recurring">Agendamento Recorrente</option>
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
                    {/* EQUIPMENT LIST */}
                    <ul className="space-y-4">
                        {filteredBookings.length === 0 ? (
                            <li className="px-6 py-24 text-center">
                                <Filter className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                                <p className="text-lg font-bold text-gray-900">Nenhum agendamento encontrado</p>
                                <p className="text-sm text-gray-500 mt-1">Tente ajustar seus filtros ou termos de pesquisa.</p>
                            </li>
                        ) : (
                            (() => {
                                const grouped: Record<string, Booking[]> = {};
                                const singleBookings: Booking[] = [];

                                filteredBookings.forEach(b => {
                                    if (b.display_id) {
                                        const groupKey = `${b.booking_date}_${b.display_id}`;
                                        if (!grouped[groupKey]) grouped[groupKey] = [];
                                        grouped[groupKey].push(b);
                                    } else {
                                        singleBookings.push(b);
                                    }
                                });

                                const groupKeys = Array.from(new Set(
                                    filteredBookings
                                        .filter(b => !!b.display_id)
                                        .map(b => `${b.booking_date}_${b.display_id}`)
                                ));

                                return [...groupKeys.map(key => grouped[key]), ...singleBookings.map(b => [b])].map((group) => {
                                    const first = group[0];
                                    const isMulti = group.length > 1;

                                    return (
                                        <li key={first.display_id ? `${first.booking_date}_${first.display_id}` : first.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                                            <div className="p-4 md:p-6 lg:p-7">
                                                {/* --- DESKTOP LAYOUT --- */}
                                                <div className="hidden lg:block">
                                                    {!isMulti ? (
                                                        // Single Item Layout
                                                        <div className="flex flex-col gap-6">
                                                            {/* TOP ROW: Combined Equipment & User Info */}
                                                            <div className="flex flex-row items-center justify-between gap-6 pb-6 border-b border-gray-50/80">
                                                                <div className="flex items-center">
                                                                    {/* LEFT: Equipment Block */}
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm group-hover:border-indigo-100 transition-colors duration-300">
                                                                            {getEquipmentIcon(first.equipment?.name, "h-7 w-7 text-primary-600")}
                                                                        </div>

                                                                        <div className="flex flex-col gap-1.5">
                                                                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                                                                                {first.equipment?.name}
                                                                            </h3>
                                                                            <div className="inline-flex self-start items-center px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded border border-indigo-100 italic">
                                                                                # {first.quantity} {first.quantity === 1 ? 'UNIDADE' : 'UNIDADES'}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Vertical Separator */}
                                                                    <div className="h-10 w-px bg-gray-200 mx-8 shrink-0"></div>

                                                                    {/* RIGHT: User & IDs Block */}
                                                                    <div className="flex items-center gap-4">
                                                                        {/* Larger Professor Icon */}
                                                                        <div className="h-11 w-11 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                                                            <Users className="h-5 w-5 text-indigo-600" />
                                                                        </div>

                                                                        <div className="flex flex-col gap-1">
                                                                            {/* Name + Status + ID/Hash Row */}
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-lg font-black text-gray-900 tracking-tight">
                                                                                    {(first as any).users?.full_name}
                                                                                </span>
                                                                                {getStatusBadge(first)}

                                                                                {first.display_id && (
                                                                                    <>
                                                                                        <span className="text-gray-300 font-bold">•</span>
                                                                                        <span className="text-[10px] font-black text-indigo-600 uppercase italic tracking-wider">
                                                                                            ID TERMO #{first.display_id}
                                                                                        </span>
                                                                                        {first.term_hash && (
                                                                                            <>
                                                                                                <span className="text-gray-300 mx-1">-</span>
                                                                                                <span className="text-[10px] font-bold text-gray-400 italic">
                                                                                                    HASH: {first.term_hash.substring(0, 8)}...
                                                                                                </span>
                                                                                            </>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            {/* Email below name (Full display) */}
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                                {(first as any).users?.email}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* RIGHT: Actions */}
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    {first.term_document && (
                                                                        <button
                                                                            onClick={() => handleOpenTermModal(first)}
                                                                            className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 font-bold text-[10px] rounded-xl shadow-sm transition-all active:scale-95 uppercase tracking-wider"
                                                                        >
                                                                            <FileText className="h-4 w-4 text-primary-500" />
                                                                            Termo
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setDeleteModal({ isOpen: true, bookingIds: [first.id] })}
                                                                        className="h-10 w-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all active:scale-95 border border-red-100 shadow-sm"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* BOTTOM ROW: Info Grid */}
                                                            <div className="grid grid-cols-4 gap-4">
                                                                {/* PROFESSOR */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Professor</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-full bg-gray-50 border border-gray-100">
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-600 truncate">{(first as any).users?.full_name}</span>
                                                                    </div>
                                                                </div>

                                                                {/* ESPECIFICAÇÃO */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Especificação</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-full bg-gray-50 border border-gray-100">
                                                                            <Monitor className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-700 truncate">
                                                                            {first.equipment?.brand ? `${first.equipment.brand} ${first.equipment.model || ''}` : 'Não especificado'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* SALA/LOCAL */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Sala/Local</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-full bg-gray-50 border border-gray-100">
                                                                            <MapPin className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-600 truncate">{first.local}</span>
                                                                    </div>
                                                                </div>

                                                                {/* AGENDADO PARA */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Agendado Para</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-full bg-gray-50 border border-gray-100">
                                                                            <Clock className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-600">
                                                                            {format(parseISO(first.booking_date), "dd/MM/yy")} • {first.start_time.slice(0, 5)} - {first.end_time.slice(0, 5)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Multi Item Layout (Redesigned to match Single Item Structure)
                                                        <div className="flex flex-col gap-3">
                                                            {/* TOP ROW: User Info Header (Primary for Multi) */}
                                                            <div className="flex flex-row items-center justify-between gap-6 pb-3 border-b border-gray-50/80">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-11 w-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                                                                        <Users className="h-5 w-5 text-indigo-600" />
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="text-base font-black text-gray-900 tracking-tight leading-tight">
                                                                                {(first as any).users?.full_name}
                                                                            </h3>
                                                                            {getStatusBadge(first)}
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                            <span className="truncate max-w-[200px]">{(first as any).users?.email}</span>

                                                                            {first.display_id && (
                                                                                <>
                                                                                    <span className="text-gray-300">•</span>
                                                                                    <span className="text-indigo-600 font-black italic">ID TERMO #{first.display_id}</span>
                                                                                    {first.term_hash && (
                                                                                        <>
                                                                                            <span className="text-gray-300 ml-1">-</span>
                                                                                            <span className="text-gray-400 font-bold italic ml-1">HASH: {first.term_hash.substring(0, 8)}...</span>
                                                                                        </>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    {first.term_document && (
                                                                        <button
                                                                            onClick={() => handleOpenTermModal(first)}
                                                                            className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 font-bold text-[10px] rounded-xl shadow-sm transition-all active:scale-95 uppercase tracking-wider"
                                                                        >
                                                                            <FileText className="h-4 w-4 text-primary-500" />
                                                                            Termo
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setDeleteModal({ isOpen: true, bookingIds: group.map(b => b.id) })}
                                                                        className="h-10 w-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all active:scale-95 border border-red-100 shadow-sm"
                                                                        title="Excluir agendamento completo"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Middle: Equipment Badges */}
                                                            <div className="flex flex-wrap gap-4">
                                                                {group.map((b) => (
                                                                    <div key={b.id} className="flex items-center gap-4 p-3 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-all">
                                                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                                                                            {getEquipmentIcon(b.equipment?.name, "h-5 w-5 text-gray-700")}
                                                                        </div>
                                                                        <div className="flex flex-col gap-1 min-w-0">
                                                                            <span className="text-xs font-black text-gray-900 leading-none truncate">{b.equipment?.name}</span>
                                                                            <span className="inline-flex self-start items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase rounded border border-indigo-100 tracking-wider italic">
                                                                                # {b.quantity} {b.quantity === 1 ? 'UNIDADE' : 'UNIDADES'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* BOTTOM ROW: Info Grid */}
                                                            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-50/80">
                                                                {/* PROFESSOR */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Professor</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-full bg-gray-50 border border-gray-100">
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-600 truncate">{(first as any).users?.full_name}</span>
                                                                    </div>
                                                                </div>

                                                                {/* ESPECIFICAÇÃO */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Especificação</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-indigo-600 truncate">
                                                                            Múltiplos Itens
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* SALA/LOCAL */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Sala/Local</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-full bg-gray-50 border border-gray-100">
                                                                            <MapPin className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-600 truncate">{first.local}</span>
                                                                    </div>
                                                                </div>

                                                                {/* AGENDADO PARA */}
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.05em]">Agendado Para</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-full bg-gray-50 border border-gray-100">
                                                                            <Clock className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-600">
                                                                            {format(parseISO(first.booking_date), "dd/MM/yy")} • {first.start_time.slice(0, 5)} - {first.end_time.slice(0, 5)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* --- MOBILE LAYOUT (Redesigned per new ScreenShot) --- */}
                                                <div className="lg:hidden flex flex-col gap-4">
                                                    {/* 1. Header: User Info & Status */}
                                                    <div className="flex gap-4">
                                                        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 mt-1">
                                                            <Users className="h-6 w-6 text-indigo-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-base font-black text-gray-900 leading-tight mb-0.5">
                                                                {(first as any).users?.full_name}
                                                            </h3>

                                                            <div className="flex flex-col gap-0.5">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                                                    {(first as any).users?.email}
                                                                </p>

                                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                    {first.display_id && (
                                                                        <span className="text-[10px] font-black text-indigo-600 italic tracking-wider">
                                                                            ID TERMO #{first.display_id}
                                                                        </span>
                                                                    )}
                                                                    {getStatusBadge(first)}
                                                                </div>

                                                                {first.term_hash && (
                                                                    <p className="text-[9px] font-bold text-gray-400 italic mt-0.5">
                                                                        HASH: {first.term_hash.substring(0, 8)}...
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 2. Items Grid */}
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        {(isMulti ? group : [first]).map((b) => (
                                                            <div key={b.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                                                <div className="h-9 w-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                                                                    {getEquipmentIcon(b.equipment?.name, "h-5 w-5 text-primary-600")}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-900 truncate leading-tight mb-1">
                                                                        {b.equipment?.name}
                                                                    </p>
                                                                    <span className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase rounded border border-indigo-100 italic">
                                                                        # {b.quantity} UNIDADE{b.quantity > 1 ? 'S' : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* 3. Actions Row (Wide Buttons) */}
                                                    <div className="flex gap-2">
                                                        {first.term_document && (
                                                            <button
                                                                onClick={() => handleOpenTermModal(first)}
                                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-gray-700 font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-all"
                                                            >
                                                                <FileText className="h-4 w-4 text-primary-600" />
                                                                Termo
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDeleteModal({ isOpen: true, bookingIds: isMulti ? group.map(b => b.id) : [first.id] })}
                                                            className="flex items-center justify-center h-12 w-12 bg-red-50 text-red-500 border border-red-100 rounded-xl shadow-sm active:scale-95 transition-all"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>

                                                    {/* 4. Footer Info Grid */}
                                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-gray-50">
                                                        {/* Professor */}
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Professor</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="h-3 w-3 text-gray-300" />
                                                                <span className="text-xs font-medium text-gray-600 truncate">
                                                                    {(first as any).users?.full_name}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Especificação */}
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Especificação</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <Monitor className="h-3 w-3 text-gray-300" />
                                                                <span className="text-xs font-bold text-indigo-600 truncate">
                                                                    {isMulti ? 'Múltiplos Itens' : `${first.equipment?.brand || ''} ${first.equipment?.model || ''}`.trim() || 'Padrão'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Sala/Local */}
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Sala/Local</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="h-3 w-3 text-gray-300" />
                                                                <span className="text-xs font-medium text-gray-600 truncate">
                                                                    {first.local}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Agendado Para */}
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Agendado Para</p>
                                                            <div className="w-full text-right sm:text-left">
                                                                <span className="text-xs font-bold text-gray-600">
                                                                    {format(parseISO(first.booking_date), "dd/MM/yy")} • {first.start_time.slice(0, 5)} - {first.end_time.slice(0, 5)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                });
                            })()
                        )}
                    </ul>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModal({ isOpen: false, bookingIds: [] })} />
                    <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 text-center mb-2">Confirmar Exclusão?</h3>
                        <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed">
                            Esta ação não pode ser desfeita. O agendamento será permanentemente removido.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDeleteBooking}
                                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 active:scale-95 transition-all text-sm uppercase tracking-wide"
                            >
                                Sim, Excluir
                            </button>
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, bookingIds: [] })}
                                className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-95 transition-all text-sm uppercase tracking-wide"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalOpen && <TermModal />}
        </div>
    );
}
