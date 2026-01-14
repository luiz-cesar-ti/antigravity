import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Mail, User } from 'lucide-react';

export function ForgotPassword() {
    const [totvs, setTotvs] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Special case for Global Admin
            const isGlobalAdmin = email === 'atendimentotecnico.saovicente@objetivoportal.com.br';

            if (!isGlobalAdmin) {
                // 1. Validar se o par TOTVS + Email existe via RPC segura (bypassing RLS)
                const { data: exists, error: rpcError } = await supabase
                    .rpc('verify_user_for_reset', {
                        p_email: email.trim(),
                        p_totvs: totvs.trim()
                    });

                if (rpcError) {
                    console.error('Erro no RPC:', rpcError);
                    throw rpcError;
                }

                if (!exists) {
                    setError('Dados não conferem. Verifique o Número TOTVS e o Email informados.');
                    setLoading(false);
                    return;
                }
            }

            // 2. Enviar email de recuperação via Supabase Auth
            // Redireciona para a página de atualização de senha
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (resetError) throw resetError;

            setMessage('Se os dados estiverem corretos, você receberá um email com as instruções para redefinir sua senha em instantes.');
            setTotvs('');
            setEmail('');

        } catch (err: any) {
            console.error('Erro ao solicitar reset:', err);
            setError('Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Recuperar Senha
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Insira seus dados para receber o link de redefinição.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {message && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="totvs" className="block text-sm font-medium text-gray-700">
                                Número de Usuário TOTVS
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="totvs"
                                    name="totvs"
                                    type="text"
                                    value={totvs}
                                    onChange={(e) => setTotvs(e.target.value)}
                                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Ex: 123456 (Opcional para Admin)"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                E-mail objetivoportal.com.br
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="professor@objetivo.br"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Lembrou a senha?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                Voltar para o Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
