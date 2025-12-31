import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { User, Admin } from '../../types';
import { Search, Mail, Building, Pencil, X, ToggleLeft, ToggleRight, AlertCircle, UserMinus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function AdminUsers() {
    const { user, role } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ full_name: '', email: '' });
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        let query = supabase
            .from('users')
            .select('*')
            .eq('role', 'teacher')
            .order('full_name');

        const { data, error } = await query;

        if (!error && data) {
            let filteredData = data as User[];

            // Filter by Admin Unit (Client-side filtering for arrays often easier if dataset small, 
            // but Supabase .contains is better. However, RLS might interfere so let's do client side for safety now 
            // OR use .contains if we trust it).
            // Let's use strict filtering logic here.

            if (role === 'admin' && (user as Admin)?.unit) {
                const adminUnit = (user as Admin).unit;
                filteredData = filteredData.filter(u => u.units && u.units.includes(adminUnit));
            }

            setUsers(filteredData);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchUsers();
    }, [user]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ full_name: user.full_name, email: user.email });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);

        const { error } = await supabase
            .from('users')
            .update({
                full_name: formData.full_name,
                email: formData.email,
            })
            .eq('id', editingUser.id);

        if (!error) {
            await fetchUsers();
            setEditingUser(null);
        } else {
            alert('Erro ao salvar: ' + error.message);
        }
        setSaving(false);
    };

    const handleToggleActive = async (targetUser: User) => {
        const newStatus = !targetUser.active;
        const confirmMessage = newStatus
            ? `Deseja reativar o professor "${targetUser.full_name}"?`
            : `Deseja desativar o professor "${targetUser.full_name}"? Ele não conseguirá fazer login.`;

        if (!confirm(confirmMessage)) return;

        const { error } = await supabase
            .from('users')
            .update({ active: newStatus })
            .eq('id', targetUser.id);

        if (!error) {
            await fetchUsers();
        } else {
            alert('Erro ao atualizar status: ' + error.message);
        }
    };

    const handleRemoveFromUnit = async (targetUser: User) => {
        const adminUnit = (user as Admin)?.unit;
        if (!adminUnit) return;

        if (!confirm(`Tem certeza que deseja remover o professor "${targetUser.full_name}" da unidade ${adminUnit}? Ele não terá mais acesso a esta unidade, mas permanecerá no sistema se tiver outras unidades.`)) return;

        const newUnits = (targetUser.units || []).filter(u => u !== adminUnit);

        const { error } = await supabase
            .from('users')
            .update({ units: newUnits })
            .eq('id', targetUser.id);

        if (!error) {
            // Refresh list (user should disappear)
            fetchUsers();
        } else {
            alert('Erro ao remover professor da unidade: ' + error.message);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.totvs_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const isAdminWithUnit = role === 'admin' && !!(user as Admin)?.unit;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                    <p className="text-gray-500">
                        {isAdminWithUnit
                            ? `Professores da unidade ${(user as Admin).unit}`
                            : 'Lista de professores cadastrados no sistema.'}
                    </p>
                </div>
            </div>

            <div className="flex items-center bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                <Search className="h-5 w-5 text-gray-400 mr-3" />
                <input
                    type="text"
                    placeholder="Buscar por nome, email ou TOTVS..."
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
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
                    <ul className="divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                            <li className="px-6 py-12 text-center text-gray-500">
                                Nenhum professor encontrado nesta unidade.
                            </li>
                        ) : (
                            filteredUsers.map((teacher) => (
                                <li key={teacher.id} className={teacher.active === false ? 'bg-gray-50 opacity-60' : ''}>
                                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${teacher.active === false ? 'bg-gray-200 text-gray-500' : 'bg-primary-100 text-primary-600'}`}>
                                                    {teacher.full_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                        {teacher.full_name}
                                                        {teacher.active === false && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                Inativo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        TOTVS: {teacher.totvs_number}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(teacher)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>

                                                {/* Only allow global deactivate if NOT a specific unit admin OR if we want to allow it? 
                                                    Requirements say: "exclude only on that unit". 
                                                    So unit admin should see "Remove from Unit". 
                                                    Global Deactivate is risky for unit admin. Let's hide it for unit admin OR make it clear.
                                                    Let's show Remove for unit admin, and Toggle for super admin (no unit).
                                                */}

                                                {isAdminWithUnit ? (
                                                    <button
                                                        onClick={() => handleRemoveFromUnit(teacher)}
                                                        className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Remover desta Unidade"
                                                    >
                                                        <UserMinus className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleActive(teacher)}
                                                        className={`p-2 rounded-full transition-colors ${teacher.active === false ? 'text-green-500 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}
                                                        title={teacher.active === false ? 'Ativar' : 'Desativar Globalmente'}
                                                    >
                                                        {teacher.active === false ? (
                                                            <ToggleLeft className="h-5 w-5" />
                                                        ) : (
                                                            <ToggleRight className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex sm:space-x-6">
                                                <p className="flex items-center text-sm text-gray-500 mt-2 sm:mt-0">
                                                    <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    {teacher.email}
                                                </p>
                                                <p className="flex items-center text-sm text-gray-500 mt-2 sm:mt-0">
                                                    <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    {teacher.units && teacher.units.length > 0 ? teacher.units.join(', ') : 'Nenhuma unidade'}
                                                </p>
                                            </div>
                                            <div className="mt-2 sm:mt-0 text-xs text-gray-400">
                                                Cadastrado em {teacher.created_at ? format(parseISO(teacher.created_at), 'dd/MM/yyyy') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Editar Professor</h2>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">
                                    <strong>TOTVS:</strong> {editingUser.totvs_number}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    <strong>Unidades:</strong> {editingUser.units?.join(', ') || 'Nenhuma'}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
