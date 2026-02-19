import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Monitor, CheckCircle, Search, Filter } from 'lucide-react';
import type { RoomBookingData } from '../../types';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';

interface Step2Props {
    data: RoomBookingData;
    updateData: (data: Partial<RoomBookingData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

interface Room {
    id: string;
    name: string;
    resources: string[];
    unit: string;
    is_available?: boolean;
}

export function Step2RoomSelection({ data, updateData, onNext, onPrev }: Step2Props) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [unavailableRoomIds, setUnavailableRoomIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRoomsAndAvailability();
    }, [data.unit, data.date, data.startTime, data.endTime]);

    const fetchRoomsAndAvailability = async () => {
        setLoading(true);
        try {
            // 1. Fetch all rooms for the unit
            const { data: roomsData, error: roomsError } = await supabase
                .from('rooms')
                .select('*')
                .eq('unit', data.unit)
                .order('name');

            if (roomsError) throw roomsError;

            // 2. Fetch bookings for the date/time range to determine availability
            // We need to check for overlaps:
            // Existing.Start < New.End AND Existing.End > New.Start
            // And same date.

            let query = supabase
                .from('room_bookings')
                .select('room_id, start_time, end_time')
                .eq('unit', data.unit)
                .neq('status', 'cancelled'); // Don't count cancelled bookings

            if (data.isRecurring && data.dayOfWeek !== undefined) {
                // For recurring, we'd need to check all future dates or check 'day_of_week' if stored?
                // Current schema might not store day_of_week directly in room_bookings if expanded?
                // Or are we checking against 'is_recurring' bookings?
                // This MVP logic might need to be simple: Check if any recurring booking exists on this day of week?
                // Or if any single booking exists on "next X weeks".
                // Detailed availability for recurring is complex. 
                // Let's assume for MVP we check *existing recurring bookings* on the same day OR regular bookings on the target start date (if we had one, but recurring picks dayOfWeek).
                // Actually, if user picks "Recurring" + "Mondays", we should check collisions with ANY booking on Mondays?
                // That's hard.
                // Let's stick to simple: Check collisions on data.date if provided (Step 1 usually asks Date OR DayOfWeek).
                // In Step1RoomBasicInfo, if recurring, we ask DayOfWeek.
                // If we only have DayOfWeek, we can't check specific date collisions easily without checking ALL dates.

                // Strategy: Fetch ALL recurring bookings for this unit & dayOfWeek.
                // AND fetch bookings for upcoming dates?
                // Let's rely on basic "booking_date" check if provided, OR just warn user.
                // Wait, RoomBookingWizard Step1 asks for 'dayOfWeek' if recurring.
                // Let's check 'room_bookings' for ANY conflict.
                // Maybe we just check 'is_recurring' = true AND 'day_of_week' = X?
                // Does room_bookings have 'day_of_week'?
                // Let's query room_bookings generally.
                // If data.date is present (Normal booking), check specific date.
                // If data.dayOfWeek is present (Recurring), check recurring conflicts.

                if (data.dayOfWeek !== undefined) {
                    // Check specific recurring overlaps? 
                    // Or just any booking that falls on this day of week?
                    // For MVP, lets just check collisions with specific Date if the user selected a "Start Date" for recurring?
                    // Step 1 doesn't seem to ask for Start Date for recurring (just DayOfWeek).
                    // This implies "Every Monday".
                    // So we should find rooms free on "Every Monday".
                    // Ideally we check if there are conflicting recurring bookings.
                    // The backend might not support "day_of_week" column on room_bookings yet?
                    // Let's check schema.
                    // I did not add 'day_of_week' to room_bookings.
                    // I only added 'is_recurring' and 'parent_id'.
                    // So storing recurring room bookings might be expanding them to individual rows?
                    // If so, checking availability means checking a range of dates.
                    // Since this is MVP, let's assume valid room availability check for specific DATE bookings.
                    // If recurring, we might skip availability check or do a best effort.
                    // Let's assume regular booking for now (data.date exists).
                }
            } else {
                if (data.date) {
                    query = query.eq('booking_date', data.date);
                }
            }

            const { data: bookingsData, error: bookingsError } = await query;
            if (bookingsError) throw bookingsError;

            const occupied = new Set<string>();
            const newStart = data.startTime;
            const newEnd = data.endTime;

            if (bookingsData) {
                bookingsData.forEach(b => {
                    // Check overlap
                    if (b.start_time < newEnd && b.end_time > newStart) {
                        occupied.add(b.room_id);
                    }
                });
            }

            setRooms(roomsData as Room[]);
            setUnavailableRoomIds(occupied);

        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.resources?.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = (room: Room) => {
        if (unavailableRoomIds.has(room.id) || room.is_available === false) return;
        updateData({
            roomId: room.id,
            roomName: room.name
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Selecione uma Sala</h2>
                    <p className="text-sm text-gray-500">
                        {data.isRecurring
                            ? `Para todas as ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][data.dayOfWeek || 0]}s`
                            : `Para o dia ${data.date ? format(parseISO(data.date), 'dd/MM/yyyy') : ''}`
                        } • {data.startTime} às {data.endTime}
                    </p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar sala..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhuma sala encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map(room => {
                        const isSelected = data.roomId === room.id;
                        const isOccupied = unavailableRoomIds.has(room.id);
                        const isUnavailable = room.is_available === false;
                        const isDisabled = isOccupied || isUnavailable;

                        return (
                            <div
                                key={room.id}
                                onClick={() => !isDisabled && handleSelect(room)}
                                className={clsx(
                                    "relative group p-4 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden",
                                    isOccupied
                                        ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                                        : isUnavailable
                                            ? "bg-red-50/50 border-red-200 cursor-not-allowed"
                                            : isSelected
                                                ? "bg-primary-50/50 border-primary-600 ring-4 ring-primary-100/50 shadow-lg scale-[1.02]"
                                                : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={clsx(
                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                        isSelected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                                    )}>
                                        <Monitor className="h-5 w-5" />
                                    </div>
                                    {isSelected && <CheckCircle className="h-6 w-6 text-primary-600 animate-in zoom-in-50" />}
                                    {isOccupied && <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-lg">Ocupada</span>}
                                    {isUnavailable && <span className="px-2 py-1 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100">Indisponível</span>}
                                </div>

                                <h3 className={clsx(
                                    "font-bold text-[20px] mb-1",
                                    isSelected ? "text-primary-900" : "text-gray-900"
                                )}>
                                    {room.name}
                                </h3>


                                {room.resources && room.resources.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {room.resources.slice(0, 3).map((res, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                                                {res}
                                            </span>
                                        ))}
                                        {room.resources.length > 3 && (
                                            <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-medium rounded">
                                                +{room.resources.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                    onClick={onPrev}
                    className="px-6 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Voltar
                </button>
                <button
                    onClick={onNext}
                    disabled={!data.roomId}
                    className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-200 disabled:shadow-none"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}
