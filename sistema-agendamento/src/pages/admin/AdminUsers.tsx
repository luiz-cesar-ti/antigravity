import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SCHOOL_UNITS } from '../../utils/constants';
import type { User, Admin } from '../../types';
import { Search, Mail, Building, Pencil, X, ToggleLeft, ToggleRight, UserMinus, Check, Send, Repeat } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SuccessModal } from '../../components/SuccessModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { clsx } from 'clsx';

export function AdminUsers() {
    const { user, role } = useAuth();
    const adminUser = user as Admin;
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
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        type: 'danger' | 'warning' | 'info' | 'remove';
        action: (() => void) | null;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'danger',
        action: null
    });

    const fetchUsers = async () => {
        setLoading(true);
        const query = supabase
            .from('users')
            .select('*')
            .eq('role', 'teacher')
            .order('full_name');

        const { data, error } = await query;

        if (!error && data) {
            let filteredData = data as User[];

            if (role === 'admin' && (user as Admin)?.unit) {
                const adminUser = user as Admin;
                if (adminUser.role !== 'super_admin') {
                    const adminUnit = adminUser.unit;
                    filteredData = filteredData.filter(u => u.units && u.units.includes(adminUnit));
                }
            }

            setUsers(filteredData);
        }
        setLoading(false);
    };


    useEffect(() => {
        if (user?.id) {
            fetchUsers();
        }
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
                // Email cannot be updated by admin
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

    const triggerResendConfirmation = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Reenviar Convite?',
            message: `Deseja reenviar o email de confirmação de cadastro para ${formData.email}?`,
            confirmText: 'Sim, Reenviar',
            type: 'info',
            action: () => {
                handleResendConfirmation();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }

    const handleToggleActive = async (targetUser: User) => {
        const newStatus = !targetUser.active;

        const { error } = await supabase
            .from('users')
            .update({ active: newStatus })
            .eq('id', targetUser.id);

        if (!error) {
            fetchUsers();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } else {
            alert('Erro ao atualizar status: ' + error.message);
        }
    };

    const triggerToggleActive = (targetUser: User) => {
        const newStatus = !targetUser.active;
        setConfirmModal({
            isOpen: true,
            title: newStatus ? 'Reativar Usuário?' : 'Desativar Usuário?',
            message: newStatus
                ? `Deseja reativar o acesso do professor "${targetUser.full_name}" ao sistema?`
                : `Deseja desativar o professor "${targetUser.full_name}"? Ele não conseguirá mais acessar nenhuma funcionalidade do sistema.`,
            confirmText: newStatus ? 'Reativar Agora' : 'Desativar Globalmente',
            type: newStatus ? 'info' : 'danger',
            action: () => handleToggleActive(targetUser)
        });
    }

    const handleRemoveFromUnit = async (targetUser: User) => {
        const adminUnit = (user as Admin)?.unit;
        if (!adminUnit) return;

        const newUnits = (targetUser.units || []).filter(u => u !== adminUnit);

        const { error } = await supabase
            .from('users')
            .update({ units: newUnits })
            .eq('id', targetUser.id);

        if (!error) {
            fetchUsers();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } else {
            alert('Erro ao remover professor da unidade: ' + error.message);
        }
    };

    const triggerRemoveFromUnit = (targetUser: User) => {
        const adminUnit = (user as Admin)?.unit;
        setConfirmModal({
            isOpen: true,
            title: 'Remover da Unidade?',
            message: `Tem certeza que deseja remover o professor "${targetUser.full_name}" da unidade ${adminUnit}? Ele perderá o acesso a esta unidade específica.`,
            confirmText: 'Confirmar Remoção',
            type: 'remove',
            action: () => handleRemoveFromUnit(targetUser)
        });
    }

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.totvs_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );


    const isAdminWithUnit = role === 'admin' && !!(user as Admin)?.unit && (user as Admin).role !== 'super_admin';

    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Usuários</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        {isAdminWithUnit
                            ? <>Professores vinculados à unidade <span className="font-bold text-primary-600">{adminUser.unit}</span></>
                            : 'Visão geral de todos os professores cadastrados.'}
                    </p>
                </div>
                <div className="w-full md:w-96">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou TOTVS..."
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-gray-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Carregando lista de professores...</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {filteredUsers.length === 0 ? (
                        <div className="px-6 py-16 text-center text-gray-500">
                            <div className="mx-auto h-12 w-12 text-gray-300 mb-3 bg-gray-50 rounded-full flex items-center justify-center">
                                <Search className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Nenhum professor encontrado</h3>
                            <p className="text-sm text-gray-500 mt-1">Tente ajustar seus termos de busca.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredUsers.map((teacher) => (
                                <div key={teacher.id} className={`group p-5 hover:bg-gray-50/80 transition-colors ${teacher.active === false ? 'bg-gray-50/50' : ''}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                        {/* User Info Section */}
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Avatar */}
                                            <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${teacher.active === false
                                                ? 'bg-gray-200 text-gray-500'
                                                : 'bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 border border-primary-200/50'
                                                }`}>
                                                {teacher.full_name?.charAt(0).toUpperCase() || '?'}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className={`text-base font-bold truncate ${teacher.active === false ? 'text-gray-500' : 'text-gray-900'}`}>
                                                        {teacher.full_name}
                                                    </h3>
                                                    {teacher.active === false && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200">
                                                            Inativo
                                                        </span>
                                                    )}
                                                    {teacher.terms_accepted && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100" title={`Termos aceitos em: ${teacher.terms_accepted_at ? format(parseISO(teacher.terms_accepted_at), 'dd/MM/yyyy HH:mm') : 'N/A'}`}>
                                                            LGPD OK
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">
                                                            Número TOTVS: {teacher.totvs_number}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate">{teacher.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        <span className={`truncate max-w-xs ${(!teacher.units || teacher.units.length === 0) && 'italic text-gray-400'}`}>
                                                            {teacher.units && teacher.units.length > 0 ? teacher.units.join(', ') : 'Sem unidade vinculada'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Section */}
                                        <div className="flex items-center gap-2 self-start sm:self-center ml-16 sm:ml-0">
                                            <button
                                                onClick={() => handleEdit(teacher)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-gray-200 transition-all"
                                                title="Editar Informações"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>

                                            {isAdminWithUnit ? (
                                                <button
                                                    onClick={() => triggerRemoveFromUnit(teacher)}
                                                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                                                    title="Remover desta Unidade"
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => triggerToggleActive(teacher)}
                                                    className={`p-2 rounded-lg transition-all border border-transparent ${teacher.active === false
                                                        ? 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100'
                                                        : 'text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100'
                                                        }`}
                                                    title={teacher.active === false ? 'Reativar Cadastro' : 'Desativar Cadastro'}
                                                >
                                                    {teacher.active === false ? <ToggleLeft className="h-5 w-5" /> : <ToggleRight className="h-5 w-5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal - Styled */}
            {editingUser && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Editar Professor</h2>
                                <p className="text-sm text-gray-500">Atualize os dados e permissões</p>
                            </div>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="block w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3.5 border outline-none transition-all font-medium"
                                    />
                                </div>

                                {/* Email and Resend Section */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 ml-1">Email <span className="text-gray-400 font-normal normal-case ml-1">(Identificação)</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled={true}
                                            className="block w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 sm:text-sm p-3.5 border cursor-not-allowed font-mono opacity-75"
                                        />
                                        <button
                                            type="button"
                                            onClick={triggerResendConfirmation}
                                            disabled={resendingEmail}
                                            className="shrink-0 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold uppercase rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:text-primary-600 transition-all shadow-sm flex items-center"
                                            title="Reenviar email de confirmação de cadastro"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            {resendingEmail ? '...' : 'Reenviar'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 ml-1">
                                        Para redefinição de senha, utilize a opção "Esqueci a Senha" na tela de login.
                                    </p>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Unidades de Acesso</label>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{formData.units.length} Selecionadas</span>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 shadow-inner bg-gray-50/30">
                                        {SCHOOL_UNITS.map((unit) => (
                                            <div
                                                key={unit}
                                                onClick={() => handleUnitToggle(unit)}
                                                className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all border ${formData.units.includes(unit)
                                                    ? 'bg-primary-50 border-primary-200 shadow-sm'
                                                    : 'hover:bg-white border-transparent hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className={`h-5 w-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${formData.units.includes(unit)
                                                    ? 'bg-primary-600 border-primary-600 shadow-sm shadow-primary-200'
                                                    : 'border-gray-300 bg-white'
                                                    }`}>
                                                    {formData.units.includes(unit) && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                                                </div>
                                                <span className={`text-sm ${formData.units.includes(unit) ? 'text-primary-900 font-bold' : 'text-gray-600 font-medium'}`}>
                                                    {unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-primary-50 rounded-2xl p-5 border border-indigo-100/50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-indigo-600">
                                            <Repeat className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-indigo-900">Agendamento Recorrente</p>
                                            <p className="text-[10px] text-indigo-600/80 font-bold uppercase tracking-tight">Autorização Especial</p>
                                        </div>
                                    </div>

                                    {(user as Admin)?.unit && (
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
                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                                                formData.recurring_booking_units?.includes((user as Admin).unit!) ? "bg-indigo-600" : "bg-gray-200"
                                            )}
                                        >
                                            <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", formData.recurring_booking_units?.includes((user as Admin).unit!) ? "translate-x-6" : "translate-x-1")} />
                                        </button>
                                    )}
                                </div>

                                {formData.units.length > 0 ? (
                                    <div className="mt-3 space-y-2">
                                        {formData.units.map(unit => {
                                            const isAuthorized = formData.recurring_booking_units?.includes(unit);
                                            const isCurrentAdminUnit = (user as Admin)?.unit === unit;
                                            const canToggle = !(user as Admin)?.unit || isCurrentAdminUnit;

                                            return (
                                                <div key={unit} className={clsx(
                                                    "flex items-center justify-between px-3 py-2 rounded-lg border transition-all",
                                                    isAuthorized ? "bg-white border-indigo-100 shadow-sm" : "bg-white/40 border-transparent hover:bg-white/60"
                                                )}>
                                                    <span className={clsx("text-xs font-medium", isAuthorized ? "text-indigo-900" : "text-gray-500")}>{unit}</span>
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
                                                            "relative inline-flex h-4 w-8 items-center rounded-full transition-colors",
                                                            isAuthorized ? "bg-indigo-500" : "bg-gray-200",
                                                            !canToggle && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <span className={clsx("inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform", isAuthorized ? "translate-x-4" : "translate-x-1")} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-indigo-400 mt-2 text-center bg-white/50 py-2 rounded-lg border border-indigo-100/30">
                                        Nenhuma unidade selecionada.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-lg shadow-primary-200 hover:shadow-primary-300 disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-px"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                                        Salvando...
                                    </span>
                                ) : (
                                    'Salvar Alterações'
                                )}
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => confirmModal.action?.()}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </div>
    );
}
