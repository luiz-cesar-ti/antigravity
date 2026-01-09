import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

import { Search, Shield, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import type { Admin } from '../../types';

export function AdminManageAdmins() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [error, setError] = useState('');

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            // Get session token safely
            let adminToken = '';
            try {
                const session = localStorage.getItem('admin_session');
                if (session) {
                    const admin = JSON.parse(session);
                    adminToken = admin.session_token || '';
                }
            } catch (e) {
                console.error('Session parse error', e);
            }

            if (!adminToken) {
                throw new Error('Sessão inválida. Faça login novamente.');
            }

            // Call Secure RPC
            const { data, error } = await supabase.rpc('get_all_admins', {
                p_admin_token: adminToken
            });

            if (error) throw error;

            // Map data if necessary or use directly
            setAdmins(data || []);
        } catch (error: any) {
            console.error('Error fetching admins:', error);
            setError(`Erro ao carregar lista: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    // State for Password Reset Modal
    const [resetModal, setResetModal] = useState<{ isOpen: boolean; adminId: string; adminName: string }>({
        isOpen: false,
        adminId: '',
        adminName: ''
    });
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Close Modal Handler
    const handleCloseModal = () => {
        setResetModal({ isOpen: false, adminId: '', adminName: '' });
        setNewPassword('');
        setConfirmPassword('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setError('');
    };

    // Open Modal Handler
    const handleOpenResetModal = (adminId: string, username: string) => {
        setResetModal({ isOpen: true, adminId, adminName: username });
    };

    // Submit Handler
    const handleSubmitReset = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setError('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&).');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsResetting(true);
        setError('');

        try {
            // Get Admin Token Check
            let adminToken = '';
            try {
                const session = localStorage.getItem('admin_session');
                if (session) {
                    const admin = JSON.parse(session);
                    adminToken = admin.session_token || '';
                }
            } catch { }

            if (!adminToken) {
                throw new Error('Sessão inválida.');
            }

            // Send plain text to Secured RPC (hashing happens on DB)
            const { error } = await supabase.rpc('reset_admin_password', {
                p_admin_token: adminToken,
                p_target_admin_id: resetModal.adminId,
                p_new_password: newPassword
            });

            if (error) throw error;

            setResetSuccess(`Senha de ${resetModal.adminName} atualizada!`);
            setTimeout(() => setResetSuccess(''), 5000);
            handleCloseModal();
        } catch (err: any) {
            console.error('Error resetting admin password:', err);
            setError(`Erro ao resetar: ${err.message}`);
        } finally {
            setIsResetting(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const filteredAdmins = admins.filter(admin =>
        admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.unit && admin.unit.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gerenciar Administradores</h1>
                    <p className="text-sm text-gray-500 font-medium">Controle de acesso e segurança do sistema</p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {resetSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-in slide-in-from-top-2">
                    <div className="flex">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="ml-3 text-sm text-green-700 font-bold">{resetSuccess}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in slide-in-from-top-2">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="ml-3 text-sm text-red-700 font-bold">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por email ou unidade..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all sm:text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-black uppercase tracking-widest">
                        <Shield className="h-4 w-4" />
                        <span>Apenas Super Admin</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Administrador
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Unidade
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Função
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Ações</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="animate-spin h-6 w-6 border-b-2 border-primary-600 rounded-full"></div>
                                        </div>
                                        Carregando administradores...
                                    </td>
                                </tr>
                            ) : filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">
                                        Nenhum administrador encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <Shield className="h-5 w-5 text-primary-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{admin.username}</div>
                                                    <div className="text-xs text-gray-500">ID: {admin.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gray-100 text-gray-800">
                                                {admin.unit || 'GLOBAL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {admin.role === 'super_admin' ? (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-black rounded-full bg-purple-100 text-purple-800 uppercase tracking-wide">
                                                    Super Admin
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800">
                                                    Admin Local
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenResetModal(admin.id, admin.username)}
                                                className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 p-2 rounded-lg transition-colors group"
                                                title="Redefinir Senha"
                                            >
                                                <KeyRound className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Password Reset Modal */}
            {resetModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-primary-600 px-6 py-4 flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <KeyRound className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Redefinir Senha</h3>
                                <p className="text-primary-100 text-xs font-bold">Admin: {resetModal.adminName}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitReset} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in slide-in-from-top-2">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                        <p className="ml-3 text-sm text-red-700 font-bold">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">Nova Senha</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold pr-12"
                                        placeholder="Digite a nova senha"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">Confirmar Senha</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold pr-12"
                                        placeholder="Confirme a nova senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-2 text-[10px] space-y-1 text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                <p className="font-bold text-gray-700">Requisitos obrigatórios:</p>
                                <ul className="grid grid-cols-2 gap-x-2 list-disc list-inside">
                                    <li>8+ caracteres</li>
                                    <li>A-Z (Maiúsculo)</li>
                                    <li>a-z (Minúsculo)</li>
                                    <li>0-9 (Número)</li>
                                    <li>Símbolo (@$!%...)</li>
                                </ul>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResetting}
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl shadow-primary-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isResetting ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Confirmar Alteração'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
