import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Room, RoomBooking, Admin } from '../../types';
import { Plus, Trash2, Calendar, Clock, MapPin, Users, AlertCircle, AlertTriangle, X, Edit2, CheckCircle2, Settings2, Save, Power } from 'lucide-react';
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
        type: 'booking' | 'room' | null;
        id: string | null;
        roomName?: string;
    }>({
        isOpen: false,
        type: null,
        id: null
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
        description: '',
        min_time: '07:00',
        max_time: '22:00',
        available_days: [1, 2, 3, 4, 5] // Mon-Fri default
    };
    const [roomForm, setRoomForm] = useState(initialFormState);

    const [isCreating, setIsCreating] = useState(false);

    // Room Advance Time Settings State
    const [roomMinAdvanceEnabled, setRoomMinAdvanceEnabled] = useState(false);
    const [roomMinAdvanceHours, setRoomMinAdvanceHours] = useState(0);
    const [roomBookingEnabled, setRoomBookingEnabled] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

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
            const isSuperAdmin = adminUser?.role === 'super_admin';
            const unit = adminUser?.unit;

            // Fetch Rooms
            let roomsQuery = supabase
                .from('rooms')
                .select('*')
                .order('name');

            if (!isSuperAdmin && unit) {
                roomsQuery = roomsQuery.eq('unit', unit);
            }

            const { data: roomsData } = await roomsQuery;
            if (roomsData) setRooms(roomsData);

            // Fetch Bookings with Joins
            if (activeTab === 'bookings') {
                let bookingsQuery = supabase
                    .from('room_bookings')
                    .select(`
                        id,
                        start_ts,
                        end_ts,
                        status,
                        created_at,
                        room:rooms!inner(name, unit),
                        users(full_name)
                    `);

                if (!isSuperAdmin && unit) {
                    bookingsQuery = bookingsQuery.eq('room.unit', unit);
                }

                const { data: bookingsData } = await bookingsQuery.order('start_ts', { ascending: false });

                if (bookingsData) {
                    setBookings(bookingsData as any);
                }
            }

            // Fetch Settings for room advance time configuration
            if (unit) {
                const { data } = await supabase
                    .from('settings')
                    .select('*')
                    .eq('unit', unit)
                    .single();

                if (data) {
                    setRoomMinAdvanceEnabled(data.room_min_advance_time_enabled);
                    setRoomMinAdvanceHours(data.room_min_advance_time_hours);
                    setRoomBookingEnabled(data.room_booking_enabled);
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

    const handleDeleteRoom = (room: Room) => {
        setDeleteModal({
            isOpen: true,
            type: 'room',
            id: room.id,
            roomName: room.name
        });
    };

    const confirmDeleteRoom = async () => {
        if (!deleteModal.id || !adminUser?.session_token) return;

        try {
            const { data, error } = await supabase.rpc('delete_room_secure', {
                p_room_id: deleteModal.id,
                p_session_token: adminUser.session_token
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || 'Erro ao deletar sala');

            setDeleteModal({ isOpen: false, type: null, id: null });
            setSuccessModal({
                isOpen: true,
                message: 'Sala removida com sucesso!'
            });
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Erro ao deletar sala.');
        }
    };

    const handleToggleAvailability = async (roomId: string) => {
        try {
            if (!adminUser?.session_token) throw new Error("Sessão inválida.");

            const { data, error } = await supabase.rpc('toggle_room_availability_secure', {
                p_room_id: roomId,
                p_session_token: adminUser.session_token
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            fetchData();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Erro ao alternar disponibilidade.');
        }
    };

    const handleSaveSettings = async () => {
        if (!adminUser?.unit) return;
        setSavingSettings(true);

        try {
            // Check if settings row exists for this unit
            const { data: existing } = await supabase
                .from('settings')
                .select('id')
                .eq('unit', adminUser.unit)
                .single();

            const payload = {
                unit: adminUser.unit,
                room_min_advance_time_enabled: roomMinAdvanceEnabled,
                room_min_advance_time_hours: roomMinAdvanceHours,
                room_booking_enabled: roomBookingEnabled,
                updated_at: new Date().toISOString()
            };

            let error;
            if (existing) {
                const { error: err } = await supabase
                    .from('settings')
                    .update(payload)
                    .eq('id', existing.id);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('settings')
                    .insert([payload]);
                error = err;
            }

            if (error) throw error;
            setSuccessModal({
                isOpen: true,
                message: 'Configurações salvas com sucesso!'
            });
        } catch (error: any) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setSavingSettings(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!deleteModal.id || !adminUser?.session_token) return;

        try {
            const { data, error } = await supabase.rpc('delete_room_booking_secure', {
                p_booking_id: deleteModal.id,
                p_session_token: adminUser.session_token
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            setDeleteModal({ isOpen: false, type: null, id: null });
            setSuccessModal({
                isOpen: true,
                message: 'Agendamento cancelado com sucesso!'
            });
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
                <div className="space-y-6">
                    {/* Room Settings Section - Redesigned */}
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden relative">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Settings2 className="w-64 h-64 text-gray-900 -rotate-12" />
                        </div>

                        <div className="p-8 relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200">
                                    <Settings2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Configurações de Agendamentos</h3>
                                    <p className="text-sm text-gray-500 font-medium">Gerencie as regras globais para reservas de salas</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Card 1: Global System Toggle */}
                                <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${roomBookingEnabled
                                    ? 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200 shadow-lg shadow-indigo-100/50'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100">
                                                <Power className={`w-6 h-6 ${roomBookingEnabled ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={roomBookingEnabled}
                                                    onChange={(e) => setRoomBookingEnabled(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-bold mb-1 ${roomBookingEnabled ? 'text-indigo-900' : 'text-gray-500'}`}>
                                                Sistema de Reservas
                                            </h4>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                {roomBookingEnabled
                                                    ? 'O sistema está ativo. Professores podem realizar agendamentos de sala normalmente.'
                                                    : 'O sistema está desativado. Ninguem pode realizar agendamentos de sala.'}
                                            </p>
                                        </div>
                                    </div>
                                    {roomBookingEnabled && (
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                                    )}
                                </div>

                                {/* Card 2: Advance Time Rules */}
                                <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${roomMinAdvanceEnabled
                                    ? 'bg-gradient-to-br from-violet-50 to-white border-violet-200 shadow-lg shadow-violet-100/50'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100">
                                                <Clock className={`w-6 h-6 ${roomMinAdvanceEnabled ? 'text-violet-600' : 'text-gray-400'}`} />
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={roomMinAdvanceEnabled}
                                                    onChange={(e) => setRoomMinAdvanceEnabled(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                            </label>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className={`text-lg font-bold mb-1 ${roomMinAdvanceEnabled ? 'text-violet-900' : 'text-gray-500'}`}>
                                                Regra de Antecedência
                                            </h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                                {roomMinAdvanceEnabled
                                                    ? 'Exigir tempo mínimo antes do início da reserva.'
                                                    : 'Função desativada, os professores podem realizar agendamentos para qualquer horário.'}
                                            </p>
                                        </div>

                                        {roomMinAdvanceEnabled && (
                                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={roomMinAdvanceHours}
                                                    onChange={(e) => setRoomMinAdvanceHours(Number(e.target.value))}
                                                    className="w-20 pl-3 pr-2 py-1.5 text-center font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-200 focus:border-violet-300 outline-none transition-all"
                                                />
                                                <span className="text-sm font-semibold text-violet-700">Horas de antecedência</span>
                                            </div>
                                        )}
                                    </div>
                                    {roomMinAdvanceEnabled && (
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                    className="relative overflow-hidden group px-8 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative flex items-center gap-2">
                                        {savingSettings ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Salvar Configurações
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Existing Form and Room List */}
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
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${room.unit === 'P1' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                                                }`}>
                                                                <MapPin className="w-3 h-3" />
                                                                {room.unit}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${room.is_available !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                                }`}>
                                                                {room.is_available !== false ? 'Disponível' : 'Indisponível'}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-gray-900 text-lg leading-tight">{room.name}</h4>
                                                    </div>

                                                    <button
                                                        onClick={() => handleToggleAvailability(room.id)}
                                                        className={`p-2 rounded-lg transition-all shadow-sm border ${room.is_available !== false
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                                                            : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white'
                                                            }`}
                                                        title={room.is_available !== false ? 'Tornar Indisponível' : 'Tornar Disponível'}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
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
                                                    onClick={() => handleDeleteRoom(room)}
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
                                    // FORCE UTC: append Z to ensure it's parsed as UTC
                                    // Supabase returns "2024-01-01T10:00:00" for UTC times, we need "2024-01-01T10:00:00Z"
                                    const start = parseISO(booking.start_ts.endsWith('Z') ? booking.start_ts : booking.start_ts + 'Z');
                                    const end = parseISO(booking.end_ts.endsWith('Z') ? booking.end_ts : booking.end_ts + 'Z');

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
                                                            type: 'booking',
                                                            id: booking.id,
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

            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Status Bar */}
                        <div className="h-2 w-full bg-red-500" />

                        <div className="p-8 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-6 gap-4">
                                <div className="p-4 bg-red-50 rounded-2xl">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors hidden sm:block"
                                >
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
                                {deleteModal.type === 'room' ? 'Excluir Sala Permanentemente?' : 'Cancelar Agendamento?'}
                            </h3>

                            <div className="text-gray-500 text-sm leading-relaxed mb-8 space-y-4">
                                {deleteModal.type === 'room' ? (
                                    <>
                                        <p>
                                            Você está prestes a excluir a sala <span className="font-bold text-gray-800">{deleteModal.roomName}</span>.
                                        </p>
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 text-xs font-medium flex gap-3 italic">
                                            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                                            <p>
                                                <strong>AVISO CRÍTICO:</strong> Esta ação é irreversível e removerá automaticamente <strong>todos os agendamentos</strong> vinculados a este espaço físico.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p>
                                        Você está prestes a cancelar a reserva da sala <span className="font-bold text-gray-800">{deleteModal.roomName}</span>.
                                        Esta ação removerá o agendamento permanentemente e liberará o horário para outros professores.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                                    className="flex-1 px-6 py-4 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                                >
                                    {deleteModal.type === 'room' ? 'Manter Sala' : 'Manter Reserva'}
                                </button>
                                <button
                                    onClick={deleteModal.type === 'room' ? confirmDeleteRoom : handleDeleteBooking}
                                    className="flex-1 px-6 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Confirmar {deleteModal.type === 'room' ? 'Exclusão' : 'Cancelamento'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
