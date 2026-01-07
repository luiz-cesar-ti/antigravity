import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Room, RoomBooking, Admin } from '../../types';
import { Plus, Trash2, Calendar, Clock, MapPin, Users, AlertCircle, X, Edit2, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminRooms() {
    const { user } = useAuth();
    const adminUser = user as Admin;

    const [activeTab, setActiveTab] = useState<'rooms' | 'bookings'>('bookings');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<RoomBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        bookingId: string | null;
        roomName?: string;
    }>({
        isOpen: false,
        bookingId: null
    });

    const [successModal, setSuccessModal] = useState<{
        isOpen: boolean;
        message: string;
    }>({
        isOpen: false,
        message: ''
    });

    // Edit Room State
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form State for New/Edit Room
    const initialFormState = {
        name: '',
        unit: 'P1',
        capacity: 40,
        description: '',
        min_time: '07:00',
        max_time: '22:00',
        available_days: [1, 2, 3, 4, 5] // Mon-Fri default
    };
    const [roomForm, setRoomForm] = useState(initialFormState);

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
                const { data: bookingsData } = await supabase
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
            setRoomForm(prev => ({ ...prev, unit: adminUser.unit }));
        }
    }, [adminUser]);

    const openEditModal = (room: Room) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name,
            unit: room.unit,
            capacity: room.capacity || 40,
            description: room.description || '',
            min_time: room.min_time || '07:00',
            max_time: room.max_time || '22:00',
            available_days: room.available_days || [1, 2, 3, 4, 5]
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingRoom(null);
        if (adminUser?.unit) {
            setRoomForm({ ...initialFormState, unit: adminUser.unit });
        } else {
            setRoomForm(initialFormState);
        }
    };

    const handleSaveRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminUser?.unit) return;

        setIsCreating(true);
        try {
            if (!adminUser.session_token) throw new Error("Sessão de administrador inválida. Faça login novamente.");

            if (editingRoom) {
                // UPDATE EXISTING ROOM
                const { data, error } = await supabase.rpc('update_room_secure', {
                    p_room_id: editingRoom.id,
                    p_name: roomForm.name,
                    p_capacity: roomForm.capacity,
                    p_description: roomForm.description,
                    p_min_time: roomForm.min_time,
                    p_max_time: roomForm.max_time,
                    p_available_days: roomForm.available_days,
                    p_session_token: adminUser.session_token
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.message || 'Erro ao atualizar sala');

                setSuccessModal({
                    isOpen: true,
                    message: 'Sala atualizada com sucesso!'
                });
                handleCloseEditModal();
            } else {
                // CREATE NEW ROOM
                const { data, error } = await supabase.rpc('create_room_secure', {
                    p_name: roomForm.name,
                    p_unit: adminUser.unit,
                    p_capacity: roomForm.capacity,
                    p_description: roomForm.description,
                    p_min_time: roomForm.min_time,
                    p_max_time: roomForm.max_time,
                    p_available_days: roomForm.available_days,
                    p_session_token: adminUser.session_token
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.message || 'Erro ao criar sala');

                setRoomForm({ ...initialFormState, unit: adminUser.unit });
                setSuccessModal({
                    isOpen: true,
                    message: 'Sala criada com sucesso!'
                });
            }

            fetchData();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Erro ao salvar sala.');
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

    const handleDeleteBooking = async () => {
        if (!deleteModal.bookingId || !adminUser?.session_token) return;

        try {
            const { data, error } = await supabase.rpc('delete_room_booking_secure', {
                p_booking_id: deleteModal.bookingId,
                p_session_token: adminUser.session_token
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            setDeleteModal({ isOpen: false, bookingId: null });
            fetchData();
        } catch (err: any) {
            console.error(err);
            alert('Erro ao cancelar agendamento: ' + (err.message || 'Erro desconhecido'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Salas</h1>

                {/* Tabs - Mobile Optimized */}
                <div className="flex w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 space-x-3 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200 shadow-sm scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'rooms'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200 scale-100 sm:scale-105'
                            : 'text-gray-500 hover:text-indigo-600 hover:bg-white'
                            }`}
                    >
                        Gerenciar Salas
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'bookings'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 scale-100 sm:scale-105'
                            : 'text-gray-500 hover:text-emerald-600 hover:bg-white'
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

                            <form onSubmit={handleSaveRoom} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Sala</label>
                                    <input
                                        type="text"
                                        required
                                        value={roomForm.name}
                                        onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 transition-all"
                                        placeholder="Ex: Laboratório de Informática 1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição / Equipamentos</label>
                                    <textarea
                                        value={roomForm.description}
                                        onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
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
                                                value={roomForm.min_time}
                                                onChange={e => setRoomForm({ ...roomForm, min_time: e.target.value })}
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
                                                value={roomForm.max_time}
                                                onChange={e => setRoomForm({ ...roomForm, max_time: e.target.value })}
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
                                            const isSelected = roomForm.available_days.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = [...roomForm.available_days];
                                                        if (isSelected) {
                                                            setRoomForm({ ...roomForm, available_days: current.filter(d => d !== idx) });
                                                        } else {
                                                            setRoomForm({ ...roomForm, available_days: [...current, idx].sort() });
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
                                    {isCreating ? 'Salvando...' : 'Cadastrar Sala'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Modern Grid List (Replaces Table) */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                Salas Cadastradas
                                <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    {rooms.length}
                                </span>
                            </h3>
                        </div>

                        {rooms.length === 0 ? (
                            <div className="p-10 text-center bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                                <div className="bg-gray-50 p-4 rounded-full mb-3">
                                    <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-lg font-medium text-gray-600">Nenhuma sala cadastrada</p>
                                <p className="text-sm text-gray-400">Utilize o formulário ao lado para adicionar sua primeira sala.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                                {rooms.map(room => (
                                    <div key={room.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all duration-300 relative overflow-hidden flex flex-col">
                                        <div className={`h-1.5 w-full ${room.unit === 'P1' ? 'bg-blue-500' : 'bg-purple-500'}`} />

                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mb-1.5 ${room.unit === 'P1' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                                        }`}>
                                                        <MapPin className="w-3 h-3" />
                                                        {room.unit}
                                                    </span>
                                                    <h4 className="font-bold text-gray-900 text-lg leading-tight">{room.name}</h4>
                                                </div>
                                            </div>

                                            {room.description && (
                                                <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                    {room.description}
                                                </p>
                                            )}

                                            <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                    </div>
                                                    {room.min_time?.slice(0, 5)} - {room.max_time?.slice(0, 5)}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day, idx) => (
                                                            <span
                                                                key={day}
                                                                className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-sm ${room.available_days?.includes(idx)
                                                                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                                                                    : 'text-gray-300'
                                                                    }`}
                                                            >
                                                                {day.charAt(0)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/50">
                                            <button
                                                onClick={() => openEditModal(room)}
                                                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={handleCloseEditModal}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <Edit2 className="w-5 h-5 text-primary-600" />
                                </div>
                                Editar Sala
                            </h3>
                            <button onClick={handleCloseEditModal} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSaveRoom} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Sala</label>
                                    <input
                                        type="text"
                                        required
                                        value={roomForm.name}
                                        onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 transition-all bg-gray-50 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição / Equipamentos</label>
                                    <textarea
                                        value={roomForm.description}
                                        onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 transition-all bg-gray-50 focus:bg-white"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Abre às</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                required
                                                value={roomForm.min_time}
                                                onChange={e => setRoomForm({ ...roomForm, min_time: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pl-10 py-3 bg-gray-50 focus:bg-white"
                                            />
                                            <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha às</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                required
                                                value={roomForm.max_time}
                                                onChange={e => setRoomForm({ ...roomForm, max_time: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pl-10 py-3 bg-gray-50 focus:bg-white"
                                            />
                                            <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Dias de Funcionamento</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
                                            const isSelected = roomForm.available_days.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = [...roomForm.available_days];
                                                        if (isSelected) {
                                                            setRoomForm({ ...roomForm, available_days: current.filter(d => d !== idx) });
                                                        } else {
                                                            setRoomForm({ ...roomForm, available_days: [...current, idx].sort() });
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isSelected
                                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 transform scale-105'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseEditModal}
                                        className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-wider text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 py-3 px-4 rounded-xl shadow-lg shadow-primary-200 text-xs uppercase tracking-wider font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {isCreating ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


            {/* TAB: BOOKINGS (CARDS) */}
            {
                activeTab === 'bookings' && (
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


                                    return (
                                        <div key={booking.id} className={`group bg-white rounded-xl shadow-md border hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col ${isPast ? 'opacity-75 grayscale-[0.3]' : 'border-gray-200 hover:border-primary-200'}`}>

                                            {/* Colored Header */}
                                            <div className={`p-4 text-white flex justify-between items-start ${isConfirmed
                                                ? (isPast ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600')
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
                                                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-sm ${!isConfirmed ? 'bg-black/20 text-white' :
                                                    isPast ? 'bg-indigo-700/40 text-white' : 'bg-emerald-700/40 text-white'
                                                    }`}>
                                                    {!isConfirmed ? 'Cancelado' : isPast ? 'Concluído' : 'Ativo'}
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
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                                                            <Users className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]" title={booking.users?.full_name}>
                                                                {booking.users?.full_name || 'Desconhecido'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Professor</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setDeleteModal({
                                                            isOpen: true,
                                                            bookingId: booking.id,
                                                            roomName: booking.room?.name
                                                        })}
                                                        className="h-10 w-10 flex items-center justify-center bg-red-50 text-red-500 border border-red-100 rounded-xl shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 active:scale-90 group/btn"
                                                        title="Cancelar Agendamento"
                                                    >
                                                        <Trash2 className="w-5 h-5 transition-transform group-hover/btn:rotate-12" />
                                                    </button>
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

            {/* PROFESSIONAL DELETE MODAL */}
            {
                deleteModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                        />

                        {/* Modal Content */}
                        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Status Bar */}
                            <div className="h-2 w-full bg-red-500" />

                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-red-50 rounded-2xl">
                                        <AlertCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
                                    Cancelar Agendamento?
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                    Você está prestes a cancelar a reserva da sala <span className="font-bold text-gray-800">{deleteModal.roomName}</span>.
                                    Esta ação removerá o agendamento permanentemente e liberará o horário para outros professores.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: false, bookingId: null })}
                                        className="flex-1 px-6 py-4 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95 text-xs uppercase tracking-widest"
                                    >
                                        Manter Reserva
                                    </button>
                                    <button
                                        onClick={handleDeleteBooking}
                                        className="flex-1 px-6 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Confirmar Cancelamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* SUCCESS MODAL */}
            {successModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 border border-green-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Sucesso!</h3>
                        <p className="text-gray-600 mb-6">{successModal.message}</p>
                        <button
                            onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-200 active:scale-95"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
