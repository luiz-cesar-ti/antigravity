import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Equipment, Admin } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    Monitor,
    Package,
    Hash,
    Info,
    Laptop,
    Projector,
    Speaker,
    Camera,
    Mic,
    Smartphone
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminEquipment() {
    const { user } = useAuth();
    const adminUser = user as Admin;

    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [inUseCounts, setInUseCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Helper for dynamic icons
    const getEquipmentIcon = (name: string = '') => {
        const n = name.toLowerCase();
        if (n.includes('notebook') || n.includes('laptop')) return <Laptop className="h-5 w-5 text-primary-600 group-hover/row:text-white" />;
        if (n.includes('projetor') || n.includes('datashow')) return <Projector className="h-5 w-5 text-primary-600 group-hover/row:text-white" />;
        if (n.includes('caixa') || n.includes('som') || n.includes('audio')) return <Speaker className="h-5 w-5 text-primary-600 group-hover/row:text-white" />;
        if (n.includes('camera') || n.includes('camara') || n.includes('foto')) return <Camera className="h-5 w-5 text-primary-600 group-hover/row:text-white" />;
        if (n.includes('microfone')) return <Mic className="h-5 w-5 text-primary-600 group-hover/row:text-white" />;
        if (n.includes('tablet') || n.includes('ipad')) return <Smartphone className="h-5 w-5 text-primary-600 group-hover/row:text-white" />;
        return <Monitor className="h-5 w-5 text-primary-600 group-hover/row:text-white" />;
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: Equipment | null }>({
        isOpen: false,
        item: null
    });

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        model: '',
        total_quantity: 1,
        unit: adminUser?.unit || ''
    });

    // Body scroll lock effect
    useEffect(() => {
        if (isModalOpen || deleteModal.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen, deleteModal.isOpen]);

    useEffect(() => {
        if (adminUser?.unit) {
            setFormData(prev => ({ ...prev, unit: adminUser.unit }));
        }
    }, [adminUser]);

    const fetchActiveCounts = async () => {
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        const currentTime = format(now, 'HH:mm');
        const counts: Record<string, number> = {};

        // 1. Fetch Active Bookings (Time Overlap)
        // Normal and Recurring bookings: Count if IN TIME WINDOW and NOT finished/cancelled
        let bookingsQuery = supabase
            .from('bookings')
            .select('equipment_id, quantity, start_time, end_time, status')
            .eq('booking_date', today)
            .neq('status', 'cancelled')
            .neq('status', 'cancelled_by_user')
            .neq('status', 'encerrado')
            .neq('status', 'concluido'); // Released when completed

        if (adminUser?.unit) {
            bookingsQuery = bookingsQuery.eq('unit', adminUser.unit);
        }

        const { data: bookings } = await bookingsQuery;

        if (bookings) {
            bookings.forEach((b: any) => {
                // Normalize times to HH:mm for comparison (database may store HH:mm:ss)
                const startTime = (b.start_time || '').substring(0, 5);
                const endTime = (b.end_time || '').substring(0, 5);

                // Count if currentTime is >= startTime AND <= endTime (inclusive boundaries)
                if (startTime <= currentTime && endTime >= currentTime) {
                    counts[b.equipment_id] = (counts[b.equipment_id] || 0) + b.quantity;
                }
            });
        }

        // 2. Fetch Active Loans (Time Overlap)
        let loansQuery = supabase
            .from('equipment_loans')
            .select('equipment_id, quantity, start_at, end_at') // Added start_at, end_at
            .eq('status', 'active');

        if (adminUser?.unit) {
            loansQuery = loansQuery.eq('unit', adminUser.unit);
        }

        const { data: loans } = await loansQuery;

        if (loans) {
            const nowTime = now.getTime();
            loans.forEach((l: any) => {
                // Check if loan has STARTED. 
                // We ignore the end time because if it is still 'active' (not returned), 
                // it is still in possession of the user, even if overdue.
                const start = new Date(l.start_at).getTime();

                if (nowTime >= start) {
                    counts[l.equipment_id] = (counts[l.equipment_id] || 0) + l.quantity;
                }
            });
        }

        setInUseCounts(counts);
    };

    const fetchEquipment = async () => {
        setLoading(true);
        let query = supabase
            .from('equipment')
            .select('*')
            .order('name');

        if (adminUser?.unit) {
            query = query.eq('unit', adminUser.unit);
        }

        const { data, error } = await query;
        if (!error && data) {
            setEquipmentList(data as Equipment[]);
        }
        await fetchActiveCounts(); // Fetch counts as well
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchEquipment();

            // Subscribe to changes to update real-time
            const subscription = supabase.channel('equipment_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchActiveCounts())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_loans' }, () => fetchActiveCounts())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => fetchEquipment())
                .subscribe();

            return () => { subscription.unsubscribe(); };
        }
    }, [user, adminUser?.unit]);

    const handleOpenModal = (equipment?: Equipment) => {
        if (equipment) {
            setEditingId(equipment.id);
            setFormData({
                name: equipment.name,
                brand: equipment.brand || '',
                model: equipment.model || '',
                total_quantity: equipment.total_quantity,
                unit: equipment.unit
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                brand: '',
                model: '',
                total_quantity: 1,
                unit: adminUser?.unit || ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || formData.total_quantity < 0) {
            return;
        }

        let error;
        if (editingId) {
            const { error: err } = await supabase
                .from('equipment')
                .update(formData)
                .eq('id', editingId);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('equipment')
                .insert([formData]);
            error = err;
        }

        if (!error) {
            handleCloseModal();
            fetchEquipment();
        } else {
            alert(`Erro ao salvar: ${error.message}`);
        }
    };

    const confirmDelete = (item: Equipment) => {
        setDeleteModal({ isOpen: true, item });
    };

    const handleDelete = async () => {
        if (!deleteModal.item) return;

        const { error } = await supabase
            .from('equipment')
            .delete()
            .eq('id', deleteModal.item.id);

        if (!error) {
            setDeleteModal({ isOpen: false, item: null });
            fetchEquipment();
        } else {
            alert('Não é possível excluir este equipamento pois existem agendamentos vinculados a ele. Recomenda-se apenas zerar a quantidade se o item não estiver mais disponível.');
            setDeleteModal({ isOpen: false, item: null });
        }
    };

    const filteredList = equipmentList.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventário</h1>
                    <div className="inline-flex items-center px-3 py-1 bg-primary-50 border border-primary-100 rounded-xl">
                        <Package className="h-4 w-4 text-primary-600 mr-2" />
                        <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                            {adminUser?.unit || 'Objetivo Geral'}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="group bg-gradient-to-br from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center border border-amber-400/20"
                >
                    <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Cadastrar Item
                </button>
            </div>

            {/* Search/Filters */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, marca ou modelo..."
                        className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-400 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Equipment Grid/Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando inventário...</span>
                </div>
            ) : filteredList.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                    <Monitor className="mx-auto h-16 w-16 text-gray-100 mb-4" />
                    <h3 className="text-xl font-black text-gray-900">Nenhum item encontrado</h3>
                    <p className="text-gray-400 text-sm mt-1">Tente ajustar sua busca ou cadastrar um novo equipamento.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipamento</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Marca & Modelo</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Uso Agora</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantidade Total</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredList.map((item) => {
                                    const inUse = inUseCounts[item.id] || 0;
                                    // const available = item.total_quantity - inUse;

                                    return (
                                        <tr key={item.id} className="hover:bg-primary-50/30 transition-colors group/row">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover/row:bg-primary-600 transition-colors">
                                                        {getEquipmentIcon(item.name)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-black text-gray-900">{item.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Patrimônio Objetivo</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-600">{item.brand || '—'}</div>
                                                <div className="text-xs text-gray-400">{item.model || '—'}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-center">
                                                <span className={clsx(
                                                    "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-inset",
                                                    inUse > 0
                                                        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                        : "bg-gray-50 text-gray-400 ring-gray-400/20"
                                                )}>
                                                    {inUse} em uso
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-center">
                                                <span className={clsx(
                                                    "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-inset",
                                                    item.total_quantity > 0
                                                        ? "bg-green-50 text-green-700 ring-green-600/20"
                                                        : "bg-red-50 text-red-700 ring-red-600/20"
                                                )}>
                                                    {item.total_quantity} unid.
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-3 text-primary-600 hover:bg-primary-600 hover:text-white rounded-xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(item)}
                                                        className="p-3 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Cadastro/Edição - Redesign Padrão "Nova Sala" */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={handleCloseModal}></div>

                    <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-x-hidden transform transition-all animate-in zoom-in-95 duration-300">
                        {/* Header: Dark Style (Inspired by "Nova Sala") */}
                        <div className="bg-[#1e293b] p-6 sm:px-10 sm:py-7 flex justify-between items-center border-b border-gray-800 sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group/icon overflow-hidden relative">
                                    <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500" />
                                    {editingId ? (
                                        <Edit2 className="h-6 w-6 text-orange-400" />
                                    ) : (
                                        <Package className="h-6 w-6 text-orange-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">
                                        {editingId ? 'Editar Registro' : 'Novo Item'}
                                    </h3>
                                    <p className="text-gray-400 text-xs font-bold leading-none mt-1">
                                        {editingId ? 'Atualize as especificações do equipamento.' : 'Cadastre um novo equipamento no inventário.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 sm:p-10">
                            <form id="equipment-form" onSubmit={handleSubmit} className="space-y-8">
                                {/* Section: General Info */}
                                <div className="space-y-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-black text-gray-700 uppercase tracking-[0.1em] ml-1">
                                            Nome do Item <span className="text-orange-600">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <Monitor className="h-5 w-5 text-gray-400 group-focus-within/field:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Notebook, iPad, Projetor..."
                                                className="block w-full pl-14 pr-5 py-4 bg-gray-50/50 border-2 border-gray-100 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none shadow-sm"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-[0.1em] ml-1">Marca</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Apple, Dell..."
                                                className="block w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none shadow-sm"
                                                value={formData.brand}
                                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-[0.1em] ml-1">Modelo</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: MacBook Air..."
                                                className="block w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none shadow-sm"
                                                value={formData.model}
                                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-black text-gray-700 uppercase tracking-[0.1em] ml-1">
                                            Quantidade em Estoque <span className="text-orange-600">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <Hash className="h-5 w-5 text-gray-400 group-focus-within/field:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="block w-full pl-14 pr-5 py-4 bg-gray-50/50 border-2 border-gray-100 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 transition-all outline-none shadow-sm"
                                                value={formData.total_quantity}
                                                onChange={e => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                                            <Info className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                                                A quantidade total deve refletir o número de itens disponíveis fisicamente para agendamento nesta unidade.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-4">
                                <button
                                    onClick={handleCloseModal}
                                    className="w-full sm:grow py-4 px-6 bg-white border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700 font-black text-xs uppercase tracking-widest rounded-2xl transition-all outline-none"
                                >
                                    Cancelar
                                </button>
                                <button
                                    form="equipment-form"
                                    type="submit"
                                    className="w-full sm:grow-default sm:min-w-[200px] flex items-center justify-center py-4 px-8 bg-gradient-to-br from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 group/save outline-none border border-amber-400/20"
                                >
                                    <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                                    {editingId ? 'Salvar Edição' : 'Criar Registro'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null })}
                onConfirm={handleDelete}
                title="Excluir Item?"
                message={`Você está prestes a remover ${deleteModal.item?.name} do inventário. Esta ação removerá o item permanentemente.`}
                confirmText="Sim, Excluir Item"
                cancelText="Manter no Inventário"
                type="danger"
            />
        </div>
    );
}
