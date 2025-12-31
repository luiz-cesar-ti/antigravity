import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Equipment, Admin } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export function AdminEquipment() {
    const { user } = useAuth();
    const adminUser = user as Admin; // Safe cast inside protected route

    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
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

        // If admin is restricted to a unit, filter by it. 
        // Assuming admins manage their own unit or all if superadmin?
        // Prompt implies "Admin da Unidade". So we filter.
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
        const payload = { ...formData };

        // Validation
        if (!payload.name || payload.total_quantity < 0) {
            alert('Preencha os campos obrigatórios corretamente.');
            return;
        }

        let error;
        if (editingId) {
            const { error: err } = await supabase
                .from('equipment')
                .update(payload)
                .eq('id', editingId);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('equipment')
                .insert([payload]);
            error = err;
        }

        if (!error) {
            handleCloseModal();
            fetchEquipment();
        } else {
            console.error('Erro ao salvar equipamento:', error);
            alert(`Erro ao salvar equipamento: ${error.message || JSON.stringify(error)}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;

        const { error } = await supabase
            .from('equipment')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchEquipment();
        } else {
            alert('Erro ao excluir (verifique se não há agendamentos vinculados).');
        }
    };

    const filteredList = equipmentList.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Equipamentos</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Novo Equipamento
                </button>
            </div>

            <div className="flex items-center bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                <Search className="h-5 w-5 text-gray-400 mr-3" />
                <input
                    type="text"
                    placeholder="Buscar equipamentos..."
                    className="flex-1 border-none focus:ring-0 text-sm p-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredList.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.brand} {item.model}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(item)} className="text-primary-600 hover:text-primary-900 mr-4">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredList.length === 0 && (
                        <div className="text-center py-8 text-gray-500">Nenhum equipamento encontrado.</div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {editingId ? 'Editar Equipamento' : 'Novo Equipamento'}
                                    </h3>
                                    <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <form id="equipment-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nome *</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Marca</label>
                                            <input
                                                type="text"
                                                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                                value={formData.brand}
                                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Modelo</label>
                                            <input
                                                type="text"
                                                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                                value={formData.model}
                                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Quantidade Total *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                            value={formData.total_quantity}
                                            onChange={e => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <input type="hidden" value={formData.unit} />
                                </form>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    form="equipment-form"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Salvar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
