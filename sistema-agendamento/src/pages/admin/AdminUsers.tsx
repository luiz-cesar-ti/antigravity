import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SCHOOL_UNITS } from '../../utils/constants';
import type { User, Admin } from '../../types';
import { Search, Mail, Building, Pencil, X, ToggleLeft, ToggleRight, AlertCircle, UserMinus, Check, Send, Repeat } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SuccessModal } from '../../components/SuccessModal';
import { clsx } from 'clsx';

export function AdminUsers() {
    const { user, role } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        units: [] as string[],
        recurring_booking_enabled: false,
        recurring_booking_units: [] as string[]
    });
    const [saving, setSaving] = useState(false);
    const [resendingEmail, setResendingEmail] = useState(false);
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

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

            if (role === 'admin' && (user as Admin)?.unit) {
                const adminUnit = (user as Admin).unit;
                filteredData = filteredData.filter(u => u.units && u.units.includes(adminUnit));
            }

            setUsers(filteredData);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user?.id) fetchUsers();
    }, [user?.id]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            email: user.email,
            units: user.units || [],
            recurring_booking_enabled: user.recurring_booking_enabled || false,
            recurring_booking_units: user.recurring_booking_units || []
        });
    };

    const handleUnitToggle = (unit: string) => {
        setFormData(prev => {
            const currentUnits = prev.units;
            if (currentUnits.includes(unit)) {
                return { ...prev, units: currentUnits.filter(u => u !== unit) };
            } else {
                return { ...prev, units: [...currentUnits, unit] };
            }
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);

        const { error } = await supabase
            .from('users')
            .update({
                full_name: formData.full_name,
                email: formData.email,
                units: formData.units,
                recurring_booking_enabled: formData.recurring_booking_enabled,
                recurring_booking_units: formData.recurring_booking_units
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

    const handleResendConfirmation = async () => {
        if (!formData.email) return;
        if (!confirm(`Deseja reenviar o email de confirmação para ${formData.email}?`)) return;

        setResendingEmail(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: formData.email
        });

        if (error) {
            alert('Erro ao reenviar: ' + error.message);
        } else {
            setSuccessModal({
                isOpen: true,
                title: 'Email Reenviado',
                message: `O email de confirmação foi reenviado com sucesso para ${formData.email}.`
            });
        }
        setResendingEmail(false);
    }

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
            fetchUsers();
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
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
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

                            {/* Email and Resend Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleResendConfirmation}
                                        disabled={resendingEmail}
                                        className="shrink-0 px-3 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                                        title="Reenviar email de confirmação de cadastro"
                                    >
                                        <Send className="h-3 w-3 mr-1" />
                                        {resendingEmail ? '...' : 'Reenviar'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Use "Reenviar" apenas se o professor não tiver confirmado o cadastro.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500 mb-2">
                                    <strong>TOTVS:</strong> {editingUser.totvs_number}
                                </p>

                                <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                                    Unidades de Acesso:
                                </label>
                                <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded p-2 space-y-1">
                                    {SCHOOL_UNITS.map((unit) => (
                                        <div
                                            key={unit}
                                            onClick={() => handleUnitToggle(unit)}
                                            className={`flex items-center p-2 rounded cursor-pointer transition-colors ${formData.units.includes(unit)
                                                ? 'bg-primary-50 border-primary-100 border'
                                                : 'hover:bg-gray-50 border border-transparent'
                                                }`}
                                        >
                                            <div className={`h-4 w-4 rounded border flex items-center justify-center mr-2 ${formData.units.includes(unit)
                                                ? 'bg-primary-600 border-primary-600'
                                                : 'border-gray-300 bg-white'
                                                }`}>
                                                {formData.units.includes(unit) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className={`text-sm ${formData.units.includes(unit) ? 'text-primary-900 font-medium' : 'text-gray-700'}`}>
                                                {unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-primary-900">Agendamento Fixo</p>
                                        <p className="text-[10px] text-primary-600 font-bold uppercase tracking-tight">
                                            {(user as Admin)?.unit
                                                ? `Autorizar para Unidade: ${(user as Admin).unit}`
                                                : "Gestão por Unidade"
                                            }
                                        </p>
                                    </div>
                                    {(user as Admin)?.unit ? (
                                        <button
                                            onClick={() => {
                                                const adminUnit = (user as Admin).unit!;
                                                setFormData(prev => {
                                                    const units = prev.recurring_booking_units || [];
                                                    const newUnits = units.includes(adminUnit)
                                                        ? units.filter(u => u !== adminUnit)
                                                        : [...units, adminUnit];
                                                    return { ...prev, recurring_booking_units: newUnits };
                                                });
                                            }}
                                            className={clsx(
                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                                                formData.recurring_booking_units?.includes((user as Admin).unit!) ? "bg-primary-600" : "bg-gray-200"
                                            )}
                                        >
                                            <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", formData.recurring_booking_units?.includes((user as Admin).unit!) ? "translate-x-6" : "translate-x-1")} />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Repeat className="h-4 w-4 text-primary-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Management of units for authorizations */}
                                {formData.units.length > 0 ? (
                                    <div className="mt-2 space-y-2 border-t border-primary-100 pt-2">
                                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-1">
                                            {(user as Admin)?.unit ? "Status de Autorização:" : "Autorizações por Unidade:"}
                                        </p>
                                        {formData.units.map(unit => {
                                            const isAuthorized = formData.recurring_booking_units?.includes(unit);
                                            const isCurrentAdminUnit = (user as Admin)?.unit === unit;
                                            const canToggle = !(user as Admin)?.unit || isCurrentAdminUnit;

                                            return (
                                                <div key={unit} className={clsx(
                                                    "flex items-center justify-between p-2 rounded-lg border transition-all",
                                                    isAuthorized ? "bg-white border-primary-200" : "bg-gray-50/50 border-gray-100"
                                                )}>
                                                    <span className={clsx("text-xs font-medium", isAuthorized ? "text-primary-800" : "text-gray-400")}>{unit}</span>
                                                    <button
                                                        disabled={!canToggle}
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recurring_booking_units: prev.recurring_booking_units?.includes(unit)
                                                                    ? prev.recurring_booking_units.filter(u => u !== unit)
                                                                    : [...(prev.recurring_booking_units || []), unit]
                                                            }));
                                                        }}
                                                        className={clsx(
                                                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                                            isAuthorized ? "bg-primary-500" : "bg-gray-200",
                                                            !canToggle && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <span className={clsx("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", isAuthorized ? "translate-x-5" : "translate-x-1")} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-400 italic text-center py-2">O professor não tem unidades vinculadas para autorização.</p>
                                )}
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
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
                type="email"
            />
        </div>
    );
}
