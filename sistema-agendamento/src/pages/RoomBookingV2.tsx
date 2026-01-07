import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Room, User } from '../types';
import { Clock, ChevronRight, AlertCircle, MapPin, Trash2, Info, X, CheckCircle, Calendar } from 'lucide-react';
import { format, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RoomBookingV2() {
    const { user } = useAuth();
    const teacherUser = user as User;
    const [loading, setLoading] = useState(true);

    // State
    const [enabledUnits, setEnabledUnits] = useState<string[]>([]);
    const [unitRooms, setUnitRooms] = useState<Record<string, Room[]>>({});

    // Booking State
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); // If not null, modal is open
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [occupiedSlots, setOccupiedSlots] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Feedback State
    const [feedback, setFeedback] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
        show: false,
        type: 'success',
        message: ''
    });

    const triggerFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ show: true, type, message });
        setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 4000);
    };

    // 1. Initial Load: Filter valid units for this teacher
    useEffect(() => {
        const loadUnitsAndRooms = async () => {
            if (!teacherUser?.units) return;
            setLoading(true);

            try {
                // Fetch settings for all user's units to check which have room booking enabled
                const { data: settingsData } = await supabase
                    .from('settings')
                    .select('unit, room_booking_enabled')
                    .in('unit', teacherUser.units);

                const validUnits = settingsData
                    ?.filter(s => s.room_booking_enabled)
                    .map(s => s.unit) || [];

                setEnabledUnits(validUnits);

                if (validUnits.length > 0) {
                    // Fetch ALL rooms for these units
                    const { data: roomsData } = await supabase
                        .from('rooms')
                        .select('*')
                        .in('unit', validUnits)
                        .eq('is_active', true)
                        .order('name');

                    if (roomsData) {
                        // Group by unit
                        const grouped: Record<string, Room[]> = {};
                        validUnits.forEach(u => grouped[u] = []);
                        roomsData.forEach(r => {
                            if (grouped[r.unit]) grouped[r.unit].push(r);
                        });
                        setUnitRooms(grouped);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadUnitsAndRooms();
    }, [teacherUser]);

    // 1.5 Fetch User's Bookings
    const fetchMyBookings = async () => {
        if (!user) return;
        try {
            // Get start of today to show all today's bookings (even past ones)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('room_bookings')
                .select(`
                    *,
                    room:rooms (
                        name,
                        unit
                    )
                `)
                .eq('user_id', user.id)
                .gte('start_ts', today.toISOString())
                .order('start_ts', { ascending: true });

            if (error) {
                console.error('Error fetching my bookings:', error);
                return;
            }

            if (data) setMyBookings(data);
        } catch (err) {
            console.error('Unexpected error fetching my bookings:', err);
        }
    };

    useEffect(() => {
        fetchMyBookings();
    }, [user]);

    // 2. Fetch Occupancy when Room/Date changes
    useEffect(() => {
        if (selectedRoom && selectedDate) {
            fetchOccupancy();
        }
    }, [selectedRoom, selectedDate]);

    const fetchOccupancy = async () => {
        const dayStart = `${selectedDate}T00:00:00`;
        const dayEnd = `${selectedDate}T23:59:59`;

        const { data } = await supabase
            .from('room_bookings')
            .select('start_ts, end_ts')
            .eq('room_id', selectedRoom?.id)
            .eq('status', 'confirmed')
            .gte('end_ts', dayStart)
            .lte('start_ts', dayEnd);

        if (data) setOccupiedSlots(data);
    };

    const handleRoomClick = (room: Room) => {
        setSelectedRoom(room);
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        setStartTime('');
        setEndTime('');
        setOccupiedSlots([]);
    };

    const handleCloseModal = () => {
        setSelectedRoom(null);
    };

    const handleBook = async () => {
        if (!selectedRoom || !startTime || !endTime || !user) return;

        const startTs = `${selectedDate}T${startTime}:00`;
        const endTs = `${selectedDate}T${endTime}:00`;

        setBookingLoading(true);
        try {
            const { error } = await supabase.from('room_bookings').insert({
                room_id: selectedRoom.id,
                user_id: user.id,
                start_ts: startTs,
                end_ts: endTs,
                status: 'confirmed'
            });

            if (error) {
                if (error.code === '23P01') {
                    triggerFeedback('error', 'Horário indisponível! Alguém acabou de reservar.');
                } else {
                    throw error;
                }
            } else {
                triggerFeedback('success', 'Reserva realizada com sucesso! Confira em "Meus Agendamentos".');
                handleCloseModal();
                fetchMyBookings();
            }
        } catch (err: any) {
            console.error(err);
            triggerFeedback('error', `Erro ao realizar reserva: ${err.message || 'Erro desconhecido'}`);
        } finally {
            setBookingLoading(false);
        }
    };

    // Calculate slots
    const getValidationMessage = () => {
        if (!selectedRoom || !startTime || !endTime) return null;

        if (startTime >= endTime) return "A hora de término deve ser posterior à hora de início.";

        const roomMin = selectedRoom.min_time?.substring(0, 5) || '07:00';
        const roomMax = selectedRoom.max_time?.substring(0, 5) || '22:00';

        if (startTime < roomMin || endTime > roomMax) {
            return `O horário deve estar entre ${roomMin} e ${roomMax}.`;
        }

        // Overlap Check
        const newStart = new Date(`${selectedDate}T${startTime}:00`);
        const newEnd = new Date(`${selectedDate}T${endTime}:00`);

        const hasOverlap = occupiedSlots.some(booking => {
            const bStart = new Date(booking.start_ts);
            const bEnd = new Date(booking.end_ts);
            return (newStart < bEnd && newEnd > bStart);
        });

        if (hasOverlap) return "Este horário já está ocupado por outro agendamento.";

        return null;
    };

    const isDayAvailable = () => {
        if (!selectedRoom) return true;
        const dateObj = parseISO(selectedDate);
        const dayOfWeek = getDay(dateObj); // 0=Sun, 1=Mon...

        // If available_days is defined, check it. Default is Mon-Fri if missing/empty in typical logic, 
        // but here we rely on the DB.
        if (selectedRoom.available_days && selectedRoom.available_days.length > 0) {
            return selectedRoom.available_days.includes(dayOfWeek);
        }
        return true;
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando salas...</div>;
    }

    if (enabledUnits.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Nenhuma unidade com agendamento disponível</h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    O agendamento de salas ainda não foi habilitado para as suas unidades. Entre em contato com a coordenação.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 md:px-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 border-b pb-4">Agendar Sala</h1>

            {enabledUnits.map(unit => (
                <div key={unit} className="animate-fadeIn">
                    <h2 className="text-xl font-bold text-primary-800 mb-4 flex items-center gap-2">
                        <span className="bg-primary-100 p-2 rounded-lg">🏢</span>
                        Unidade {unit}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unitRooms[unit]?.length > 0 ? (
                            unitRooms[unit].map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => handleRoomClick(room)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-0 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                                >
                                    <div className="h-2 w-full bg-gradient-to-r from-primary-500 to-indigo-600" />

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-primary-50 p-3 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                <MapPin className="w-7 h-7 text-primary-600 group-hover:text-white" />
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                                            {room.name}
                                        </h3>

                                        {room.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                                                {room.description}
                                            </p>
                                        )}

                                        <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                                <span>Disponível: {room.available_days && room.available_days.length > 0
                                                    ? room.available_days.map((d: number) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')
                                                    : 'Todos os dias'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                <Clock className="w-3.5 h-3.5 text-primary-500" />
                                                <span>Horário: {room.min_time?.substring(0, 5)} às {room.max_time?.substring(0, 5)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-primary-600 font-bold text-sm">
                                            <span className="group-hover:underline decoration-2 underline-offset-4 uppercase tracking-tight">Reservar Sala</span>
                                            <div className="bg-primary-50 p-1.5 rounded-full group-hover:bg-primary-600 group-hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-gray-500 col-span-3 text-sm italic">Nenhuma sala cadastrada nesta unidade.</p>
                        )}
                    </div>
                </div>
            ))}

            {/* BOOKING MODAL */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-primary-700 p-5 md:p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold line-clamp-1">{selectedRoom.name}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-primary-100 text-xs md:text-sm">
                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" /> Unidade {selectedRoom.unit}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 md:w-4 md:h-4" /> {selectedRoom.min_time?.substring(0, 5)} - {selectedRoom.max_time?.substring(0, 5)}</span>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full hover:bg-white/20">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Description */}
                            {selectedRoom.description && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 text-blue-800 text-sm">
                                    <Info className="w-5 h-5 flex-shrink-0" />
                                    <p>{selectedRoom.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* DATE PICKER */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Selecione a Data</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                    {!isDayAvailable() && (
                                        <p className="text-red-500 text-xs mt-2 font-medium bg-red-50 p-2 rounded border border-red-100">
                                            ⚠️ Esta sala não funciona neste dia da semana.
                                        </p>
                                    )}
                                </div>

                                {/* TIME INPUTS */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Definir Horário</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Início</label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Término</label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Validation Feedback */}
                                    {startTime && endTime && (
                                        <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${getValidationMessage() ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                            {getValidationMessage() ? (
                                                <>
                                                    <AlertCircle className="w-4 h-4" />
                                                    {getValidationMessage()}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Horário disponível
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-end gap-3 mt-auto">
                            <button
                                onClick={handleCloseModal}
                                className="order-2 md:order-1 px-5 py-3 md:py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBook}
                                disabled={!startTime || !endTime || !!getValidationMessage() || bookingLoading}
                                className="order-1 md:order-2 px-8 py-3 md:py-2.5 bg-primary-600 text-white font-bold rounded-lg shadow-lg hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                {bookingLoading ? 'Confirmando...' : 'Confirmar Reserva'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MY BOOKINGS SECTION */}
            <div className="animate-fadeIn pt-10 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="bg-blue-100 p-2 rounded-lg">📅</span>
                    Meus Agendamentos
                </h2>

                {myBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myBookings.map((booking) => {
                            const isPast = new Date(booking.end_ts) < new Date();
                            const status = isPast ? 'Encerrado' : 'Agendado';

                            return (
                                <div key={booking.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-0 hover:shadow-xl transition-all relative overflow-hidden group">
                                    {/* Colored Top Bar */}
                                    <div className={`h-1.5 w-full ${isPast ? 'bg-red-500' : 'bg-blue-600'}`} />

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${isPast
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {status}
                                            </span>
                                            {/* ID Hash removed for simpler teacher view */}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                            {booking.room?.name || 'Sala'}
                                        </h3>

                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <MapPin className="w-3.5 h-3.5" />
                                                Unidade {booking.room?.unit}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                                <div className={`p-2 rounded-lg ${isPast ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 font-semibold uppercase">Data</span>
                                                    <span className="capitalize font-medium text-gray-900">
                                                        {format(parseISO(booking.start_ts), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                                <div className={`p-2 rounded-lg ${isPast ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 font-semibold uppercase">Horário</span>
                                                    <span className="font-medium text-gray-900">
                                                        {format(parseISO(booking.start_ts), 'HH:mm')} - {format(parseISO(booking.end_ts), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isPast && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                                                        try {
                                                            const { error } = await supabase
                                                                .from('room_bookings')
                                                                .delete()
                                                                .eq('id', booking.id);

                                                            if (error) throw error;
                                                            triggerFeedback('success', 'Agendamento cancelado com sucesso.');
                                                            fetchMyBookings();
                                                        } catch (err) {
                                                            console.error('Erro ao cancelar:', err);
                                                            triggerFeedback('error', 'Erro ao cancelar agendamento.');
                                                        }
                                                    }
                                                }}
                                                className="mt-5 w-full py-2.5 text-xs font-bold text-red-600 border border-red-100 bg-red-50 rounded-xl hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                CANCELAR AGENDAMENTO
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">Sem agendamentos</h3>
                        <p className="text-gray-500 text-sm">Você ainda não possui agendamentos futuros.</p>
                    </div>
                )}
            </div>

            {/* PROFESSIONAL FEEDBACK POPUP */}
            {feedback.show && (
                <div className="fixed bottom-6 md:bottom-10 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[100] animate-bounce-subtle">
                    <div className={`flex items-center gap-3 px-5 md:px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-500 scale-100 ${feedback.type === 'success'
                            ? 'bg-green-50/90 border-green-200 text-green-800'
                            : 'bg-red-50/90 border-red-200 text-red-800'
                        }`}>
                        <div className={`p-2 rounded-full flex-shrink-0 ${feedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider truncate">{feedback.type === 'success' ? 'Sucesso!' : 'Algo deu errado'}</span>
                            <span className="text-[10px] md:text-xs font-medium opacity-90 line-clamp-2 md:line-clamp-none">{feedback.message}</span>
                        </div>
                        <button
                            onClick={() => setFeedback(prev => ({ ...prev, show: false }))}
                            className="ml-auto md:ml-4 hover:opacity-100 opacity-50 transition-opacity p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @media (min-width: 768px) {
                    @keyframes bounce-subtle {
                        0%, 100% { transform: translate(-50%, 0); }
                        50% { transform: translate(-50%, -10px); }
                    }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
