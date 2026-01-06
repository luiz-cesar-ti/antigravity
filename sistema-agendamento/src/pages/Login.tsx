import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
    const navigate = useNavigate();
    const { signIn, isLoading } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load remembered credentials and check if already logged in
    useEffect(() => {
        const savedIdentifier = localStorage.getItem('remembered_identifier');
        if (savedIdentifier) {
            setIdentifier(savedIdentifier);
            setRememberMe(true);
        }

        // FAIL-SAFE: If already authenticated, go to root (RootRedirect will handle dashboards)
        const token = localStorage.getItem('sb-mcnkueyuxlyasntmsvke-auth-token') || localStorage.getItem('admin_session');
        if (!isLoading && token) {
            const checkAuth = setTimeout(() => {
                // Settle check
            }, 500);
            return () => clearTimeout(checkAuth);
        }
    }, [isLoading]);

    // Secondary effect for direct redirection when state settles
    useEffect(() => {
        const token = localStorage.getItem('sb-mcnkueyuxlyasntmsvke-auth-token') || localStorage.getItem('admin_session');
        if (!isLoading && token) {
            // Give AuthContext a moment to finalize profile fetch
            const timer = setTimeout(() => {
                const updatedToken = localStorage.getItem('sb-mcnkueyuxlyasntmsvke-auth-token') || localStorage.getItem('admin_session');
                if (updatedToken) {
                    navigate('/');
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) {
            setError('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        setError('');
        setIsSubmitting(true);

        const { error: signInError } = await signIn(identifier, password);

        if (signInError) {
            setError('Credenciais inválidas. Verifique seu login e senha.');
            setIsSubmitting(false);
        } else {
            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('remembered_identifier', identifier);
            } else {
                localStorage.removeItem('remembered_identifier');
            }
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Visual/Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-700 items-center justify-center p-12 overflow-hidden">
                {/* Abstract background shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-800 rounded-full -ml-20 -mb-20 blur-3xl opacity-50"></div>

                <div className="relative z-10 max-w-lg text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 mb-8 shadow-2xl">
                        <ShieldCheck className="h-12 w-12 text-white" />
                    </div>

                    <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
                        Sistema de agendamentos <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 drop-shadow-sm">Objetivo</span>
                    </h1>

                    <p className="text-primary-100 text-lg font-medium leading-relaxed mb-12">
                        Gerencie os recursos tecnológicos do Colégio Objetivo com facilidade e segurança em uma plataforma moderna e intuitiva.
                    </p>

                    <div className="grid grid-cols-2 gap-6 text-left">
                        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
                            <div className="bg-primary-500 h-8 w-8 rounded-xl flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-white font-bold mb-1">Rápido</h4>
                            <p className="text-primary-200 text-xs">Agende equipamentos em menos de 1 minuto.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
                            <div className="bg-primary-500 h-8 w-8 rounded-xl flex items-center justify-center mb-4">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-white font-bold mb-1">Seguro</h4>
                            <p className="text-primary-200 text-xs">Assinatura digital e histórico completo.</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Side: Login Form - Mobile Enhanced Background */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50 lg:bg-none lg:bg-gray-50/50">
                <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <img
                            src="/logo-objetivo.png"
                            alt="Colégio Objetivo"
                            className="h-32 w-auto mb-4 drop-shadow-md object-contain"
                        />
                        <h2 className="text-lg font-bold text-blue-900/80 uppercase tracking-widest text-center">
                            Sistema de<br />
                            <span className="text-primary-700 text-2xl font-black">Agendamentos</span>
                        </h2>
                    </div>

                    <div className="hidden lg:block mb-10 text-center">
                        <h2 className="text-4xl font-black text-gray-900 leading-tight tracking-tight mb-3">
                            Bem-Vindo
                        </h2>
                    </div>

                    {/* Card container with enhanced shadow and glass feel */}
                    <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/10 border border-white/50">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="rounded-2xl bg-red-50 p-4 border border-red-100 animate-in shake duration-300">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs font-bold text-red-700 leading-tight">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="identifier" className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                    Identificação
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                    </div>
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        className="block w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                        placeholder="E-mail ou Número de usuário TOTVS"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                                {/* Refined Tip Box - Blue/Gray Theme */}
                                <div className="mt-3 flex items-start p-3 bg-blue-50/80 rounded-xl border border-blue-100 shadow-sm">
                                    <span className="text-lg mr-2 filter drop-shadow-sm">💡</span>
                                    <p className="text-[11px] font-medium text-blue-900 leading-tight pt-1">
                                        O Número de usuário <span className="font-bold">TOTVS</span> está no seu crachá
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Sua Senha
                                    </label>
                                    <Link to="/forgot-password" title="Clique para recuperar sua senha" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors">
                                        Esqueci a Senha
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-14 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center ml-1">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer transition-all"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer select-none">
                                    Lembrar minhas credenciais
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || isLoading}
                                className="w-full group flex items-center justify-center py-5 px-6 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="mr-2">
                                    {isSubmitting ? 'Validando Acesso...' : 'Entrar no Sistema'}
                                </span>
                                {!isSubmitting && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>

                        <div className="mt-10">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100" />
                                </div>
                                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="px-4 bg-white text-gray-400">
                                        Novo Professor?
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Link
                                    to="/register"
                                    className="w-full flex justify-center py-4 px-6 border-2 border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-600 bg-white hover:bg-gray-50 hover:border-primary-100 hover:text-primary-600 transition-all duration-200 shadow-sm"
                                >
                                    Criar Conta Institucional
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                            Sistema de Agendamento • Colégio Objetivo
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
