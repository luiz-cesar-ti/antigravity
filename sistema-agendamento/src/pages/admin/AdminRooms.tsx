import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Room, RoomBooking, Admin } from '../../types';
import { Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminRooms() {
    const { user } = useAuth();
    const adminUser = user as Admin;

    const [activeTab, setActiveTab] = useState<'rooms' | 'bookings'>('bookings');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<RoomBooking[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State for New Room
    const [newRoom, setNewRoom] = useState({
        name: '',
        unit: 'P1',
        capacity: 40,
        description: '',
        min_time: '07:00',
        max_time: '22:00',
        available_days: [1, 2, 3, 4, 5] // Mon-Fri default
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Realtime subscription for bookings
    useEffect(() => {
        if (!user || activeTab !== 'bookings') return;

        const subscription = supabase
            .channel('admin_room_bookings')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_bookings'
                },
                () => {
                    // Refresh bookings on any change (INSERT, UPDATE, DELETE)
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, activeTab]);

    useEffect(() => {
        fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Rooms
            const { data: roomsData } = await supabase
                .from('rooms')
                .select('*')
                .order('name');
            if (roomsData) setRooms(roomsData);

            // Fetch Bookings with Joins
            if (activeTab === 'bookings') {
                const { data: bookingsData, error } = await supabase
                    .from('room_bookings')
                    .select(`
                        id,
                        start_ts,
                        end_ts,
                        status,
                        created_at,
                        room:rooms(name, unit),
                        users(full_name)
                    `)
                    .order('start_ts', { ascending: false });

                if (bookingsData) {
                    setBookings(bookingsData as any);
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Ensure unit is set from admin user on load
    useEffect(() => {
        if (adminUser?.unit) {
            setNewRoom(prev => ({ ...prev, unit: adminUser.unit }));
        }
    }, [adminUser]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminUser?.unit) return;

        setIsCreating(true);
        try {
            if (!adminUser.session_token) throw new Error("Sessão de administrador inválida. Faça login novamente.");

            const { data, error } = await supabase.rpc('create_room_secure', {
                p_name: newRoom.name,
                p_unit: adminUser.unit,
                p_capacity: newRoom.capacity,
                p_description: newRoom.description,
                p_min_time: newRoom.min_time,
                p_max_time: newRoom.max_time,
                p_available_days: newRoom.available_days,
                p_session_token: adminUser.session_token
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || 'Erro ao criar sala');

            setNewRoom({
                name: '',
                unit: adminUser.unit,
                capacity: 40,
                description: '',
                min_time: '07:00',
                max_time: '22:00',
                available_days: [1, 2, 3, 4, 5]
            });
            alert('Sala criada com sucesso!');
            fetchData();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Erro ao criar sala.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteRoom = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará todos os agendamentos desta sala.')) return;
        try {
            if (!adminUser?.session_token) throw new Error("Sessão de administrador inválida.");

            const { data, error } = await supabase.rpc('delete_room_secure', {
                p_room_id: id,
                p_session_token: adminUser.session_token
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || 'Erro ao deletar sala');

            fetchData();
        } catch (err: any) {
            alert(err.message || 'Erro ao deletar sala.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Salas</h1>

                {/* Tabs */}
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'rooms'
                            ? 'bg-white text-primary-700 shadow'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Gerenciar Salas
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'bookings'
                            ? 'bg-white text-primary-700 shadow'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Ver Agendamentos
                    </button>
                </div>
            </div>

            {/* TAB: ROOMS (CRUD) */}
            {activeTab === 'rooms' && (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Form */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <Plus className="w-5 h-5 text-primary-600" />
                                </div>
                                Nova Sala
                            </h2>

                            <form onSubmit={handleCreateRoom} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Sala</label>
                                    <input
                                        type="text"
                                        required
                                        value={newRoom.name}
                                        onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 transition-all"
                                        placeholder="Ex: Laboratório de Informática 1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição / Equipamentos</label>
                                    <textarea
                                        value={newRoom.description}
                                        onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 transition-all"
                                        rows={3}
                                        placeholder="Ex: Projetor HDMI, Ar condicionado, 30 computadores..."
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Detalhes visíveis para o professor.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Abre às</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                required
                                                value={newRoom.min_time}
                                                onChange={e => setNewRoom({ ...newRoom, min_time: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pl-8 py-2.5"
                                            />
                                            <Clock className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha às</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                required
                                                value={newRoom.max_time}
                                                onChange={e => setNewRoom({ ...newRoom, max_time: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pl-8 py-2.5"
                                            />
                                            <Clock className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Dias de Funcionamento</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
                                            const isSelected = newRoom.available_days.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = [...newRoom.available_days];
                                                        if (isSelected) {
                                                            setNewRoom({ ...newRoom, available_days: current.filter(d => d !== idx) });
                                                        } else {
                                                            setNewRoom({ ...newRoom, available_days: [...current, idx].sort() });
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-primary-600 text-white shadow-md transform scale-105'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-all mt-4"
                                >
                                    {isCreating ? 'Criando...' : 'Cadastrar Sala'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Salas Cadastradas</h3>
                                <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    Total: {rooms.length}
                                </span>
                            </div>

                            {rooms.length === 0 ? (
                                <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                                        <Calendar className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium">Nenhuma sala cadastrada</p>
                                    <p className="text-sm">Utilize o formulário ao lado para adicionar sua primeira sala.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sala</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unidade</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Horário</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {rooms.map(room => (
                                                <tr key={room.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-gray-900">{room.name}</div>
                                                        {room.description && (
                                                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{room.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full border ${room.unit === 'P1'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                            : 'bg-purple-50 text-purple-700 border-purple-100'
                                                            }`}>
                                                            {room.unit}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            {room.min_time?.slice(0, 5)} - {room.max_time?.slice(0, 5)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        <button
                                                            onClick={() => handleDeleteRoom(room.id)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                                            title="Excluir Sala"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: BOOKINGS (CARDS) */}
            {activeTab === 'bookings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                            <p>Carregando agendamentos...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {bookings.map((booking) => {
                                const start = parseISO(booking.start_ts);
                                const end = parseISO(booking.end_ts);
                                const isPast = new Date() > end;
                                const isConfirmed = booking.status === 'confirmed';

                                const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                                return (
                                    <div key={booking.id} className={`group bg-white rounded-xl shadow-md border hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col ${isPast ? 'opacity-75 grayscale-[0.3]' : 'border-gray-200 hover:border-primary-200'}`}>

                                        {/* Colored Header */}
                                        <div className={`p-4 text-white flex justify-between items-start ${isConfirmed
                                            ? 'bg-gradient-to-br from-indigo-600 to-blue-700'
                                            : 'bg-gradient-to-br from-red-500 to-rose-600'
                                            }`}>
                                            <div>
                                                <div className="flex items-center gap-1 opacity-90 text-[10px] uppercase tracking-wider font-semibold mb-1">
                                                    <MapPin className="w-3 h-3" /> Unidade {booking.room?.unit}
                                                </div>
                                                <h3 className="font-bold text-lg leading-tight text-white mb-0.5" title={booking.room?.name}>
                                                    {booking.room?.name}
                                                </h3>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${isConfirmed ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
                                                }`}>
                                                {isConfirmed ? 'Confirmado' : 'Cancelado'}
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-5 flex flex-col flex-1 bg-white">

                                            {/* Date Box */}
                                            <div className="flex items-center gap-4 mb-5">
                                                <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-2 min-w-[3.5rem]">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{format(start, 'MMM', { locale: ptBR })}</span>
                                                    <span className="text-xl font-black text-gray-800">{format(start, 'dd')}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900 capitalize text-left">
                                                        {format(start, 'EEEE', { locale: ptBR })}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                                                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                                                        <span>{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                                        {booking.users?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]" title={booking.users?.full_name}>
                                                            {booking.users?.full_name?.split(' ')[0] || 'Desconhecido'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">Professor</span>
                                                    </div>
                                                </div>

                                                <div className="text-[10px] font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-full" title="Duração">
                                                    ⏱️ {durationHours}h
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!loading && bookings.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Nenhum agendamento encontrado</h3>
                            <p className="text-gray-500 text-sm mt-1">Os agendamentos realizados pelos professores aparecerão aqui.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
