import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Room, User, Settings } from '../types';
import { Clock, ChevronRight, AlertCircle, MapPin, Trash2, Info, X, CheckCircle, Calendar } from 'lucide-react';
import { format, parseISO, getDay, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

export function RoomBookingV2() {
    const { user } = useAuth();
    const teacherUser = user as User;
    const [loading, setLoading] = useState(true);

    // State
    const [enabledUnits, setEnabledUnits] = useState<string[]>([]);
    const [unitRooms, setUnitRooms] = useState<Record<string, Room[]>>({});
    const [unitSettings, setUnitSettings] = useState<Record<string, Settings>>({});

    // Booking State
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); // If not null, modal is open
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [occupiedSlots, setOccupiedSlots] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Settings for room advance time validation
    const [settings, setSettings] = useState<Settings | null>(null);

    // Feedback State
    // Feedback State
    const [feedback, setFeedback] = useState<{ show: boolean; type: 'success' | 'error'; title?: string; message: string }>({
        show: false,
        type: 'success',
        message: ''
    });

    const triggerFeedback = (type: 'success' | 'error', message: string, title?: string) => {
        setFeedback({ show: true, type, message, title });
        setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 4000);
    };

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; bookingId: string | null; isPast: boolean }>({
        isOpen: false,
        bookingId: null,
        isPast: false
    });

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.bookingId) return;

        try {
            if (deleteConfirmation.isPast) {
                // Agendamento PASSADO: Soft delete (remove do histórico do professor)
                const { error } = await supabase
                    .from('room_bookings')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', deleteConfirmation.bookingId);
                if (error) throw error;
            } else {
                // Agendamento ATIVO/FUTURO: Alterar status para "cancelled_by_teacher"
                // Isso libera o horário para novos agendamentos E mostra como cancelado para o admin
                const { error } = await supabase
                    .from('room_bookings')
                    .update({ status: 'cancelled_by_teacher' })
                    .eq('id', deleteConfirmation.bookingId);
                if (error) throw error;
            }

            triggerFeedback(
                'success',
                deleteConfirmation.isPast ? 'Agendamento removido do seu histórico.' : 'Reserva cancelada com sucesso. O horário foi liberado.',
                deleteConfirmation.isPast ? 'Agendamento Excluído' : 'Cancelamento Confirmado'
            );
            fetchMyBookings();
            setDeleteConfirmation({ isOpen: false, bookingId: null, isPast: false });
        } catch (err) {
            console.error('Erro ao cancelar:', err);
            triggerFeedback('error', 'Erro ao processar solicitação.');
        }
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
                    .select('*')
                    .in('unit', teacherUser.units);

                const validUnits: string[] = [];
                const settingsMap: Record<string, Settings> = {};

                if (settingsData) {
                    settingsData.forEach(s => {
                        settingsMap[s.unit] = s;
                        if (s.room_booking_enabled) {
                            validUnits.push(s.unit);
                        }
                    });
                    setUnitSettings(settingsMap);
                }

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
                .is('deleted_at', null) // Filtra agendamentos excluídos pelo admin
                .neq('status', 'cancelled_by_teacher'); // Filtra agendamentos cancelados pelo professor

            if (error) {
                console.error('Error fetching my bookings:', error);
                return;
            }

            if (data) {
                const now = new Date();
                // Sorting: Future (Agendado) first, then Past (Encerrado)
                // Within Future: Ascending date (nearest first)
                // Within Past: Descending date (most recent past first)
                const sorted = data.sort((a, b) => {
                    const dateA = new Date(a.end_ts);
                    const dateB = new Date(b.end_ts);
                    const isPastA = dateA < now;
                    const isPastB = dateB < now;

                    if (isPastA !== isPastB) {
                        return isPastA ? 1 : -1; // Future before Past
                    }

                    if (!isPastA) {
                        // Both Future: Ascending
                        return new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime();
                    } else {
                        // Both Past: Descending
                        return new Date(b.start_ts).getTime() - new Date(a.start_ts).getTime();
                    }
                });
                setMyBookings(sorted);
            }
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

    // Fetch Settings for room advance time validation
    useEffect(() => {
        const fetchSettings = async () => {
            if (!selectedRoom) return;

            // Force fresh data by adding timestamp to bypass cache
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('unit', selectedRoom.unit)
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                return;
            }

            if (data) {
                console.log('Settings loaded:', data); // Debug log
                setSettings(data);
            }
        };
        fetchSettings();
    }, [selectedRoom]);

    const fetchOccupancy = async () => {
        const dayStart = `${selectedDate}T00:00:00`;
        const dayEnd = `${selectedDate}T23:59:59`;

        // Buscar apenas agendamentos ATIVOS (confirmed) e NÃO EXCLUÍDOS
        const { data } = await supabase
            .from('room_bookings')
            .select('start_ts, end_ts')
            .eq('room_id', selectedRoom?.id)
            .eq('status', 'confirmed')
            .is('deleted_at', null) // Ignorar agendamentos excluídos
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

        // Create Date objects in local timezone to ensure correct UTC conversion
        // We must parse explicitly to avoid browser inconsistencies
        const [year, month, day] = selectedDate.split('-').map(Number);
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startDate = new Date(year, month - 1, day, startHour, startMinute, 0);
        const endDate = new Date(year, month - 1, day, endHour, endMinute, 0);

        // Convert to ISO string (UTC) for Supabase
        // consistently handling the timezone offset 
        const formattedStart = startDate.toISOString();
        const formattedEnd = endDate.toISOString();

        setBookingLoading(true);
        try {
            const { error } = await supabase.from('room_bookings').insert({
                room_id: selectedRoom.id,
                user_id: user.id,
                start_ts: formattedStart,
                end_ts: formattedEnd,
                status: 'confirmed'
            });

            if (error) {
                if (error.code === '23P01') {
                    triggerFeedback('error', 'Horário indisponível! Alguém acabou de reservar.');
                } else {
                    throw error;
                }
            } else {
                triggerFeedback('success', 'Reserva realizada com sucesso! Confira em "Meus Agendamentos".', 'Agendamento Confirmado');
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

        // Parse date and time components separately to ensure local timezone
        const [year, month, day] = selectedDate.split('-').map(Number);
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        // Create Date objects in local timezone
        const newStart = new Date(year, month - 1, day, startHour, startMinute, 0);
        const newEnd = new Date(year, month - 1, day, endHour, endMinute, 0);

        const hasOverlap = occupiedSlots.some(booking => {
            const bStart = new Date(booking.start_ts);
            const bEnd = new Date(booking.end_ts);
            return (newStart < bEnd && newEnd > bStart);
        });

        if (hasOverlap) return "Este horário já está ocupado por outro agendamento.";

        // Past time check - now both dates are in local timezone
        const now = new Date();

        // If advance time is disabled, we allow "same minute" bookings
        if (!settings?.room_min_advance_time_enabled) {
            now.setSeconds(0, 0);
        }

        if (newStart < now) return "Não é possível realizar agendamentos para horários que já passaram.";

        // Minimum advance time check for rooms


        if (settings?.room_min_advance_time_enabled) {
            const hoursDiff = differenceInHours(newStart, now);

            if (hoursDiff < settings.room_min_advance_time_hours) {
                return `É necessário agendar salas com no mínimo ${settings.room_min_advance_time_hours} horas de antecedência.`;
            }
        }

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
                                    onClick={() => room.is_available !== false && handleRoomClick(room)}
                                    disabled={room.is_available === false}
                                    className={clsx(
                                        "rounded-xl shadow-sm border p-0 text-left transition-all duration-300 group relative overflow-hidden",
                                        room.is_available !== false
                                            ? "bg-white border-gray-200 hover:shadow-xl hover:-translate-y-1"
                                            : "bg-red-50/50 border-red-200 cursor-not-allowed"
                                    )}
                                >
                                    <div className={clsx(
                                        "h-2 w-full",
                                        room.is_available !== false ? "bg-gradient-to-r from-primary-500 to-indigo-600" : "bg-red-600"
                                    )} />

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={clsx(
                                                "p-3 rounded-xl transition-all duration-300 shadow-sm",
                                                room.is_available !== false ? "bg-primary-50 group-hover:bg-primary-600" : "bg-red-50"
                                            )}>
                                                <MapPin className={clsx(
                                                    "w-7 h-7 transition-colors",
                                                    room.is_available !== false ? "text-primary-600 group-hover:text-white" : "text-red-600"
                                                )} />
                                            </div>
                                            <span className={clsx(
                                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                room.is_available !== false
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-red-50 text-red-700 border-red-100"
                                            )}>
                                                {room.is_available !== false ? 'Disponível' : 'Indisponível'}
                                            </span>
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
                                            {unitSettings[room.unit]?.room_min_advance_time_enabled && unitSettings[room.unit]?.room_min_advance_time_hours > 0 && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 -mx-3 -mb-3 mt-2 px-3 py-2 rounded-b-xl border-t border-blue-100">
                                                    <Info className="w-3.5 h-3.5" />
                                                    <span>Realize agendamentos com no minimo {unitSettings[room.unit].room_min_advance_time_hours} horas de antecedência.</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between font-bold text-sm">
                                            <span className={clsx(
                                                "uppercase tracking-tight",
                                                room.is_available !== false ? "text-primary-600 group-hover:underline decoration-2 underline-offset-4" : "text-red-600"
                                            )}>
                                                {room.is_available !== false ? 'Reservar Sala' : 'Indisponível no momento'}
                                            </span>
                                            <div className={clsx(
                                                "p-1.5 rounded-full transition-all",
                                                room.is_available !== false ? "bg-primary-50 group-hover:bg-primary-600 group-hover:text-white" : "bg-red-50 text-red-400"
                                            )}>
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

                            <div className="flex flex-col gap-6">
                                {/* DATE PICKER */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-700 md:ml-1 text-primary-900/40 uppercase tracking-widest text-[10px]">Agendamento para</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block border-r border-gray-200 pr-2 mr-1">Data</span>
                                        </div>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            min={format(new Date(), 'yyyy-MM-dd')}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full pl-12 md:pl-28 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all font-bold text-gray-700"
                                        />
                                        <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-300 uppercase tracking-tighter pointer-events-none">
                                            Data
                                        </div>
                                    </div>
                                    {!isDayAvailable() && (
                                        <p className="text-red-500 text-[10px] mt-2 font-bold bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                                            <AlertCircle className="w-3 h-3" />
                                            Esta sala não funciona neste dia.
                                        </p>
                                    )}
                                </div>

                                {/* TIME INPUTS */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 md:ml-1 text-primary-900/40 uppercase tracking-widest text-[10px]">Período</label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* INICIO */}
                                        <div className="relative flex-1 group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest border-r border-gray-200 pr-2 mr-1">Horário</span>
                                                <span className="text-[9px] font-bold text-gray-300 italic">Início</span>
                                            </div>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full pl-40 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all font-bold text-gray-700"
                                            />
                                        </div>

                                        {/* TERMINO */}
                                        <div className="relative flex-1 group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest border-r border-gray-200 pr-2 mr-1">Horário</span>
                                                <span className="text-[9px] font-bold text-gray-300 italic">Fim</span>
                                            </div>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="w-full pl-40 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all font-bold text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    {/* Validation Feedback */}
                                    {startTime && endTime && (
                                        <div className={`mt-4 p-3 rounded-2xl text-[10px] font-bold flex items-center gap-2 border transition-all duration-300 uppercase tracking-tight ${getValidationMessage() ? 'bg-red-50 text-red-700 border-red-100 shadow-sm' : 'bg-green-50 text-green-700 border-green-100 shadow-sm'}`}>
                                            {getValidationMessage() ? (
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            ) : (
                                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                            {getValidationMessage() || 'Período disponível para reserva'}
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
                            // Ensure strict UTC parsing
                            const endDate = parseISO(booking.end_ts.endsWith('Z') ? booking.end_ts : booking.end_ts + 'Z');
                            const isPast = new Date() > endDate;
                            const status = isPast ? 'Concluído' : 'Agendado';

                            // Determine colors based on status
                            // Agendado (Future) -> Green Theme
                            // Concluído (Past) -> Blue Theme
                            const headerGradient = isPast
                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600';

                            const badgeStyle = isPast
                                ? 'bg-indigo-700/40 text-white'
                                : 'bg-emerald-700/40 text-white';

                            const hoverBorder = isPast
                                ? 'hover:border-blue-200'
                                : 'hover:border-emerald-200';

                            return (
                                <div key={booking.id} className={`group bg-white rounded-xl shadow-md border hover:shadow-xl relative overflow-hidden flex flex-col ${isPast ? 'opacity-85 grayscale-[0.1] border-gray-200' : `border-gray-200 ${hoverBorder}`}`}>

                                    {/* Header with Status-based Color */}
                                    <div className={`p-4 flex justify-between items-start ${headerGradient}`}>
                                        <div>
                                            <div className="flex items-center gap-1 opacity-90 text-[10px] uppercase tracking-wider font-semibold mb-1 text-white/90">
                                                <MapPin className="w-3 h-3" /> Unidade {booking.room?.unit}
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight text-white mb-0.5 shadow-sm" title={booking.room?.name}>
                                                {booking.room?.name}
                                            </h3>
                                        </div>
                                        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-sm ${badgeStyle}`}>
                                            {status}
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1 bg-white">
                                        {/* Date Box */}
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-2 min-w-[3.5rem]">
                                                <span className="text-xs font-bold text-gray-400 uppercase">{format(parseISO(booking.start_ts.endsWith('Z') ? booking.start_ts : booking.start_ts + 'Z'), 'MMM', { locale: ptBR })}</span>
                                                <span className="text-xl font-black text-gray-800">{format(parseISO(booking.start_ts.endsWith('Z') ? booking.start_ts : booking.start_ts + 'Z'), 'dd')}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900 capitalize text-left">
                                                    {format(parseISO(booking.start_ts.endsWith('Z') ? booking.start_ts : booking.start_ts + 'Z'), 'EEEE', { locale: ptBR })}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                                                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                                                    <span>
                                                        {format(parseISO(booking.start_ts.endsWith('Z') ? booking.start_ts : booking.start_ts + 'Z'), 'HH:mm')} - {format(parseISO(booking.end_ts.endsWith('Z') ? booking.end_ts : booking.end_ts + 'Z'), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const isPastBooking = new Date(booking.end_ts) < new Date();
                                                setDeleteConfirmation({
                                                    isOpen: true,
                                                    bookingId: booking.id,
                                                    isPast: isPastBooking
                                                });
                                            }}
                                            className="mt-auto w-full py-2.5 text-xs font-bold text-red-600 border border-red-100 bg-red-50 rounded-xl hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {isPast ? 'EXCLUIR AGENDAMENTO' : 'CANCELAR AGENDAMENTO'}
                                        </button>
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

            {/* DELETE CONFIRMATION MODAL */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setDeleteConfirmation({ isOpen: false, bookingId: null, isPast: false })}
                    />
                    <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 text-center mb-2">
                            {deleteConfirmation.isPast ? 'Excluir do Histórico?' : 'Cancelar Reserva?'}
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed">
                            {deleteConfirmation.isPast
                                ? 'Isso removerá este registro do seu histórico. Esta ação não pode ser desfeita.'
                                : 'Tem certeza que deseja cancelar esta reserva? O horário ficará disponível para outros professores.'}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleConfirmDelete}
                                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 active:scale-95 transition-all text-sm uppercase tracking-wide"
                            >
                                {deleteConfirmation.isPast ? 'Confirmar Exclusão' : 'Confirmar Cancelamento'}
                            </button>
                            <button
                                onClick={() => setDeleteConfirmation({ isOpen: false, bookingId: null, isPast: false })}
                                className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-95 transition-all text-sm uppercase tracking-wide"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {feedback.show && (
                <div className="fixed bottom-6 md:bottom-10 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[100] animate-bounce-subtle">
                    <div className={`flex items-center gap-4 px-6 py-5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-500 scale-100 ${feedback.type === 'success'
                        ? 'bg-white border-green-100 text-green-800'
                        : 'bg-white border-red-100 text-red-800'
                        }`}>
                        <div className={`p-3 rounded-full flex-shrink-0 shadow-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {feedback.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex flex-col min-w-0 mr-4">
                            <span className="text-sm md:text-base font-black uppercase tracking-wide text-gray-800 mb-0.5">
                                {feedback.title || (feedback.type === 'success' ? 'Sucesso!' : 'Algo deu errado')}
                            </span>
                            <span className="text-xs md:text-sm font-medium text-gray-500 leading-snug">{feedback.message}</span>
                        </div>
                        <button
                            onClick={() => setFeedback(prev => ({ ...prev, show: false }))}
                            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
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
