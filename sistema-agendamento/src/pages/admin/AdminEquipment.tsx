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
    ArrowRight,
    Laptop,
    Projector,
    Speaker,
    Camera,
    Mic,
    Smartphone
} from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminEquipment() {
    const { user } = useAuth();
    const adminUser = user as Admin;

    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
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

    useEffect(() => {
        if (adminUser?.unit) {
            setFormData(prev => ({ ...prev, unit: adminUser.unit }));
        }
    }, [adminUser]);

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
        setLoading(false);
    };

    useEffect(() => {
        fetchEquipment();
    }, [user]);

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
                    className="group bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary-200 transition-all active:scale-95 flex items-center"
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
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantidade</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredList.map((item) => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Cadastro/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={handleCloseModal}></div>

                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="p-8 sm:p-10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                                        {editingId ? 'Editar Detalhes' : 'Novo Registro'}
                                    </h3>
                                    <p className="text-sm text-gray-400 font-medium">Preencha as informações do equipamento.</p>
                                </div>
                                <button onClick={handleCloseModal} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form id="equipment-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Item *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <Monitor className="h-5 w-5 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: Notebook, iPad, Projetor..."
                                            className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marca</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Apple, Dell..."
                                            className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Modelo</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: MacBook Air..."
                                            className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade em Estoque *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <Hash className="h-5 w-5 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                            value={formData.total_quantity}
                                            onChange={e => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100 mt-2">
                                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                                            A quantidade total deve refletir o número de itens disponíveis fisicamente para agendamento nesta unidade.
                                        </p>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-10 flex gap-4">
                                <button
                                    onClick={handleCloseModal}
                                    className="grow py-4 px-6 bg-gray-50 hover:bg-gray-100 text-gray-500 font-black text-xs rounded-2xl transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    form="equipment-form"
                                    type="submit"
                                    className="grow flex items-center justify-center py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs rounded-2xl shadow-xl shadow-primary-200 transition-all active:scale-95 group/save"
                                >
                                    {editingId ? 'Atualizar Inventário' : 'Confirmar Cadastro'}
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
