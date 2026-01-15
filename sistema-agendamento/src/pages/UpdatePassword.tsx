import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Info, Eye, EyeOff } from 'lucide-react';

export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Escuta mudanças de estado (especialmente PASSWORD_RECOVERY)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Evento específico de recuperação de senha - Tudo certo
            } else if (event === 'SIGNED_IN') {
                // Usuário logado (link processado com sucesso) - Tudo certo
            } else if (!session) {
                // Se não tiver sessão, verifica se tem hash na URL (ainda processando)
                const hash = window.location.hash;
                if (!hash || !hash.includes('type=recovery')) {
                    navigate('/login');
                }
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&).');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            // Fazer logout para garantir que o usuário precise logar com a nova senha
            await supabase.auth.signOut();

            alert('Senha atualizada com sucesso! Por favor, faça login com sua nova senha.');
            navigate('/login');

        } catch (err: any) {
            console.error('Erro ao atualizar senha:', err);
            setError('Erro ao atualizar a senha. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-primary-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Redefinir Senha
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Crie uma nova senha para sua conta.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Password Security Tip */}
                    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex gap-2 mb-2">
                            <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Senha Segura (Obrigatório)</p>
                        </div>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                            Para sua segurança, a senha deve ter no mínimo <strong>8 caracteres</strong> e conter pelo menos:
                        </p>
                        <ul className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-blue-700 font-medium">
                            <li className="flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-blue-400"></div>
                                Letra Maiúscula
                            </li>
                            <li className="flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-blue-400"></div>
                                Letra Minúscula
                            </li>
                            <li className="flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-blue-400"></div>
                                Um Número
                            </li>
                            <li className="flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-blue-400"></div>
                                Símbolo (@$!%...)
                            </li>
                        </ul>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nova Senha
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmar Nova Senha
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {loading ? 'Atualizando...' : 'Definir Nova Senha'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
