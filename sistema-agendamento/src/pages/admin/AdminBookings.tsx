import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Admin } from '../../types';
import { format, parseISO } from 'date-fns';
import {
    Search, Calendar, Users, MapPin, FileText, Trash2, AlertTriangle,
    Monitor, Clock, Filter, Hash, Laptop, Projector, Speaker, Camera, Mic, Smartphone
} from 'lucide-react';
import { clsx } from 'clsx';
import { TermDocument } from '../../components/TermDocument';

export function AdminBookings() {
    const { user, role } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // active, closed, all
    const [searchTerm, setSearchTerm] = useState('');
    const [pdfData, setPdfData] = useState<any>(null);

    // Date range filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

        if (role === 'admin' && (user as Admin).unit) {
            query = query.eq('unit', (user as Admin).unit);
        }

        // Apply date range filter at query level if provided
        if (startDate) {
            query = query.gte('booking_date', startDate);
        }
        if (endDate) {
            query = query.lte('booking_date', endDate);
        }

        query = query.order('booking_date', { ascending: false });
        query = query.order('start_time', { ascending: false });

        const { data, error } = await query;

        if (!error && data) {
            setBookings(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, [user, startDate, endDate]);

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

    const handleDownloadTerm = async (booking: any) => {
        if (!booking.term_document) {
            alert('Termo não disponível para este agendamento.');
            return;
        }

        console.log('Iniciando geração de PDF para:', booking.id);
        setPdfData(booking.term_document);

        setTimeout(async () => {
            const element = document.getElementById('admin-term-doc');
            if (!element) {
                console.error('ERRO: Elemento admin-term-doc não encontrado no DOM');
                setPdfData(null);
                return;
            }

            const rawName = booking.users?.full_name || booking.term_document?.userName || 'usuario';
            const cleanName = rawName
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9]/g, '_')
                .toUpperCase();

            const fileName = `TERMO_${cleanName}_${booking.booking_date}.pdf`;

            try {
                const module = await import('html2pdf.js');
                const html2pdf = (module.default || module) as any;

                const opt = {
                    margin: 10,
                    filename: fileName,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        letterRendering: true
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                const pdfDataUri = await html2pdf().set(opt).from(element).output('datauristring');

                if (!pdfDataUri || pdfDataUri.length < 100) {
                    throw new Error('Falha ao gerar string do PDF');
                }

                const link = document.createElement('a');
                link.href = pdfDataUri;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();

                console.log('PDF gerado e disparo Base64 concluído:', fileName);

                setTimeout(() => {
                    document.body.removeChild(link);
                    setPdfData(null);
                }, 3000);

            } catch (e: any) {
                console.error('ERRO CRÍTICO NA GERAÇÃO:', e);
                alert('Erro ao gerar o arquivo. Por favor, tente novamente em alguns segundos.');
                setPdfData(null);
            }
        }, 1500);
    };

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
        if (filter === 'active') {
            const expired = isBookingExpired(b);
            if (filter === 'active' && (expired || b.status === 'encerrado')) return false;
            if (filter === 'active' && b.status === 'cancelled') return false;
        } else if (filter === 'closed') {
            const expired = isBookingExpired(b);
            if (!expired && b.status !== 'encerrado') return false;
        }

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
        if (n.includes('notebook') || n.includes('laptop')) return <Laptop className="h-6 w-6 text-primary-600" />;
        if (n.includes('projetor') || n.includes('datashow')) return <Projector className="h-6 w-6 text-primary-600" />;
        if (n.includes('caixa') || n.includes('som') || n.includes('audio')) return <Speaker className="h-6 w-6 text-primary-600" />;
        if (n.includes('camera') || n.includes('camara') || n.includes('foto')) return <Camera className="h-6 w-6 text-primary-600" />;
        if (n.includes('microfone')) return <Mic className="h-6 w-6 text-primary-600" />;
        if (n.includes('tablet') || n.includes('ipad')) return <Smartphone className="h-6 w-6 text-primary-600" />;
        return <Monitor className="h-6 w-6 text-primary-600" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Agendamentos</h1>
                    <p className="text-sm text-gray-500 mt-1">Acompanhe e gerencie todas as reservas de equipamentos.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setFilter('active')}
                            className={clsx("px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all", filter === 'active' ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-gray-500 hover:bg-gray-50")}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setFilter('closed')}
                            className={clsx("px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all", filter === 'closed' ? "bg-red-600 text-white shadow-lg shadow-red-200" : "text-gray-500 hover:bg-gray-50")}
                        >
                            Encerrados
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={clsx("px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all", filter === 'all' ? "bg-gray-800 text-white shadow-lg shadow-gray-200" : "text-gray-500 hover:bg-gray-50")}
                        >
                            Todos
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar professor, item ou local..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary-500 transition-all"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <span className="text-gray-400 font-bold">~</span>
                        <div className="flex-1 relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary-500 transition-all"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

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
                                <li key={booking.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all overflow-hidden group">
                                    <div className="px-8 py-6">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-primary-50 rounded-3xl group-hover:bg-primary-100 transition-all duration-300">
                                                    {getEquipmentIcon(booking.equipment?.name)}
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
                                                        {booking.equipment?.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="flex items-center text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 shadow-sm">
                                                            <Hash className="h-3 w-3 mr-1" />
                                                            <span className="text-[10px] font-black uppercase tracking-wider">
                                                                {booking.quantity} {booking.quantity === 1 ? 'Unidade' : 'Unidades'}
                                                            </span>
                                                        </div>
                                                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                            <MapPin className="h-3 w-3" />
                                                            {booking.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 ml-auto">
                                                <div className="hidden md:block">
                                                    {getStatusBadge(booking)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {booking.term_document && (
                                                        <button
                                                            onClick={() => handleDownloadTerm(booking)}
                                                            className="h-10 px-4 bg-white border border-gray-200 text-gray-700 hover:border-primary-200 hover:text-primary-600 font-bold text-xs rounded-xl flex items-center shadow-sm transition-all active:scale-95"
                                                        >
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Documento
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, bookingId: booking.id })}
                                                        className="h-10 px-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs rounded-xl flex items-center transition-all active:scale-95 border border-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">Professor</span>
                                                <div className="flex items-center text-sm text-gray-700 mt-2 font-bold">
                                                    <Users className="flex-shrink-0 mr-2.5 h-4 w-4 text-gray-300" />
                                                    {(booking as any).users?.full_name}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">Especificação</span>
                                                <div className="flex items-center text-sm text-gray-700 mt-2 font-bold">
                                                    <Monitor className="flex-shrink-0 mr-2.5 h-4 w-4 text-gray-300" />
                                                    <span className="truncate">
                                                        {booking.equipment?.brand} {booking.equipment?.model}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">Sala/Local</span>
                                                <div className="flex items-center text-sm text-gray-700 mt-2 font-bold">
                                                    <MapPin className="flex-shrink-0 mr-2.5 h-4 w-4 text-gray-300" />
                                                    {booking.local}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">Agendado para</span>
                                                <div className="flex items-center text-sm text-gray-700 mt-2 font-bold">
                                                    <Clock className="flex-shrink-0 mr-2.5 h-4 w-4 text-gray-300" />
                                                    <span>{format(parseISO(booking.booking_date), "dd/MM/yyyy")} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
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

            {pdfData && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
                    <div id="admin-term-doc" style={{ width: '190mm', margin: '0 auto', background: 'white' }}>
                        <TermDocument data={pdfData} />
                    </div>
                </div>
            )}
        </div>
    );
}
