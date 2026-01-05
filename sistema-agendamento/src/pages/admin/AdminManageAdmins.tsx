import { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Shield, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import type { Admin } from '../../types';

export function AdminManageAdmins() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [error, setError] = useState('');

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .order('username');

            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            setError('Erro ao carregar lista de administradores.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetAdminPassword = async (adminId: string, currentUsername: string) => {
        // Default password format or prompt? 
        // For security, let's set a standard temporary password or handle it via email if possible.
        // However, the previous requirement was "reset password" which implies a direct action or email.
        // Given the previous context, we'll assume a direct reset to a known temporary password OR a prompt.
        // Let's use a prompt for the new password to be flexible.

        const newPassword = prompt(`Digite a nova senha para o admin ${currentUsername}:`);
        if (!newPassword) return;

        try {
            const hash = await bcrypt.hash(newPassword, 10);

            const { error } = await supabase
                .from('admins')
                .update({ password_hash: hash })
                .eq('id', adminId);

            if (error) throw error;

            setResetSuccess(`Senha do admin ${currentUsername} atualizada com sucesso.`);
            setTimeout(() => setResetSuccess(''), 5000);
        } catch (err) {
            console.error('Error resetting admin password:', err);
            alert('Erro ao resetar senha.');
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
                                                onClick={() => handleResetAdminPassword(admin.id, admin.username)}
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
        </div>
    );
}
