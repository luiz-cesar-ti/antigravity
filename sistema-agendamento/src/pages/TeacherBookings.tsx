import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Monitor, Trash2, AlertTriangle, History } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Booking } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TeacherBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bookingId: string | null }>({
        isOpen: false,
        bookingId: null
    });

    const fetchBookings = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                equipment (name, brand, model)
            `)
            .eq('user_id', user.id)
            .neq('status', 'cancelled_by_user') // Hide excluded ones for the teacher
            .order('booking_date', { ascending: false })
            .order('start_time', { ascending: false });

        if (!error && data) {
            setBookings(data as Booking[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, [user]);

    const handleDelete = async () => {
        if (!deleteModal.bookingId) return;

        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled_by_user' })
            .eq('id', deleteModal.bookingId);

        if (!error) {
            setDeleteModal({ isOpen: false, bookingId: null });
            fetchBookings();
        } else {
            alert('Erro ao excluir agendamento.');
        }
    };

    const getStatusBadge = (booking: Booking) => {
        const now = new Date();
        const bookingEnd = parseISO(`${booking.booking_date}T${booking.end_time}`);

        let isActive = booking.status === 'active';

        if (isActive && bookingEnd < now) {
            isActive = false; // Closed by time
        }

        if (isActive) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 border border-green-200 uppercase tracking-widest">
                    Ativo
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200 uppercase tracking-widest">
                    Encerrado
                </span>
            );
        }
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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Meus Agendamentos</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie suas reservas e visualize termos assinados.</p>
                </div>
            </div>

            {bookings.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <History className="mx-auto h-20 w-20 text-gray-100 mb-6" />
                    <h3 className="text-xl font-black text-gray-900">Nenhum agendamento ativo</h3>
                    <p className="mt-2 text-gray-500 text-sm max-w-xs mx-auto">
                        Parece que você ainda não realizou agendamentos ou todos foram removidos.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {bookings.map((booking) => {
                        const now = new Date();
                        const bookingEnd = parseISO(`${booking.booking_date}T${booking.end_time}`);
                        const isExpired = now > bookingEnd;

                        return (
                            <div key={booking.id} className="group relative bg-white shadow-sm rounded-3xl p-8 border border-gray-100 hover:shadow-2xl hover:shadow-primary-100/30 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center">
                                            <div className="bg-primary-50 p-3 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                                <Monitor className="h-6 w-6 text-primary-600 group-hover:text-white" />
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
                                                    {booking.equipment?.name || 'Equipamento'}
                                                </h3>
                                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-1">
                                                    {booking.equipment?.brand} {booking.equipment?.model}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="inline-block mb-6">
                                        {getStatusBadge(booking)}
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

                                <div className="mt-8 flex gap-3">
                                    {!isExpired && booking.status === 'active' && (
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, bookingId: booking.id })}
                                            className="grow flex items-center justify-center py-4 px-6 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black text-xs rounded-2xl transition-all active:scale-95 group/btn"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                                            Excluir Reserva
                                        </button>
                                    )}
                                    {isExpired && (
                                        <div className="grow py-4 px-6 bg-gray-50 text-gray-400 font-bold text-xs rounded-2xl text-center border border-dashed border-gray-200">
                                            Período Finalizado
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
                                Excluir Reserva?
                            </h3>

                            <p className="text-gray-500 text-center text-sm leading-relaxed mb-10 px-2">
                                Os equipamentos ficarão imediatamente disponíveis para outros professores. Esta ação não pode ser desfeita.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95"
                                >
                                    Confirmar Exclusão
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm rounded-2xl transition-all"
                                >
                                    Manter Reserva
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
