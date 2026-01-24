import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Eye, EyeOff, Lightbulb } from 'lucide-react';
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
            setError(signInError || 'Credenciais inválidas. Verifique seu login e senha.');
            setIsSubmitting(false);
        } else {
            if (rememberMe) {
                localStorage.setItem('remembered_identifier', identifier);
            } else {
                localStorage.removeItem('remembered_identifier');
            }
            navigate('/', { replace: true });
        }
    }


    return (
        <div className="h-screen w-full flex flex-row-reverse bg-white font-sans text-slate-900 overflow-hidden">
            {/* LOGIN FORM (Right on Desktop, Full on Mobile) */}
            <div className="w-full lg:w-[35%] flex flex-col justify-center items-center p-6 bg-white relative z-20 shadow-2xl lg:shadow-none h-full">

                {/* Mobile Background Elements (visible only on mobile) */}
                <div className="lg:hidden absolute inset-0 bg-blue-50 -z-10"></div>
                <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>

                <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header Section */}
                    <div className="text-center lg:text-left mb-10">
                        {/* Logo visible on both mobile and desktop (smaller on desktop) */}
                        <img
                            src="/logo-objetivo.png"
                            alt="Colégio Objetivo"
                            className="h-20 lg:h-16 mx-auto lg:mx-0 mb-6 object-contain"
                        />

                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Bem-vindo de volta
                        </h1>
                        <p className="mt-3 text-slate-500 font-medium text-sm lg:text-base leading-relaxed">
                            Acesse o painel de gerenciamento de recursos.
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-500 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-bold text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="identifier" className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                Identificação
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-yellow-500 transition-colors duration-300" />
                                </div>
                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 font-semibold rounded-xl focus:ring-0 focus:border-yellow-500 focus:bg-white transition-all outline-none placeholder:text-slate-300 sm:text-sm"
                                    placeholder="Usuário TOTVS ou E-mail"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-2 bg-yellow-50 border border-yellow-100 p-2 rounded-lg max-w-fit">
                                <Lightbulb className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                                <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">
                                    O número TOTVS está no seu crachá
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center pl-1">
                                <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Senha
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-bold text-yellow-600 hover:text-yellow-700 uppercase tracking-widest transition-colors"
                                >
                                    Recuperar acesso
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-yellow-500 transition-colors duration-300" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 font-semibold rounded-xl focus:ring-0 focus:border-yellow-500 focus:bg-white transition-all outline-none placeholder:text-slate-300 sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center pl-1">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-5 w-5 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded cursor-pointer transition-all"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm font-semibold text-slate-600 cursor-pointer select-none">
                                Manter conectado
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="w-full relative group flex items-center justify-center py-4 px-6 bg-slate-900 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            <span className="mr-2">
                                {isSubmitting ? 'Acessando...' : 'Entrar na Plataforma'}
                            </span>
                            {!isSubmitting && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform text-yellow-500" />}
                        </button>
                    </form>

                    {/* Footer / Links */}
                    <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center lg:items-start gap-4">
                        <p className="text-slate-500 text-sm font-medium">
                            Ainda não tem acesso?
                        </p>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-transparent hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all duration-300 w-full lg:w-auto"
                        >
                            CADASTRE-SE
                        </Link>
                    </div>
                </div>
            </div>

            {/* BRANDING (Left on Desktop, Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-[65%] relative bg-slate-900 overflow-hidden items-center justify-center">

                {/* CSS Geometric Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[linear-gradient(30deg,#fbbf24_1px,transparent_1px),linear-gradient(150deg,#fbbf24_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0f172a_100%)]"></div>
                </div>

                {/* Dynamic Lighting Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 mix-blend-screen animate-pulse duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] -ml-20 -mb-20 mix-blend-screen"></div>

                {/* Central Content */}
                <div className="relative z-10 max-w-2xl px-12 text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="h-24 w-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl shadow-yellow-500/20">
                            <ShieldCheck className="h-12 w-12 text-yellow-500" />
                        </div>
                    </div>

                    <h2 className="text-5xl font-black text-white tracking-tight leading-tight mb-6">
                        Excelência em <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                            Gestão Educacional
                        </span>
                    </h2>

                    <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
                        Sistema integrado para agendamento de recursos, salas e laboratórios.
                        Segurança, rapidez e controle total na palma da sua mão.
                    </p>

                    {/* Stats / Badges */}
                    <div className="mt-12 grid grid-cols-2 gap-6 max-w-md mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur border border-white/5 rounded-2xl p-6 text-left hover:bg-slate-800/80 transition-colors group">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status do Sistema</span>
                            </div>
                            <p className="text-white font-bold text-xl group-hover:text-yellow-400 transition-colors">100% Operacional</p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur border border-white/5 rounded-2xl p-6 text-left hover:bg-slate-800/80 transition-colors group">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agilidade</span>
                            </div>
                            <p className="text-white font-bold text-xl group-hover:text-yellow-400 transition-colors">Reserva Instantânea</p>
                        </div>
                    </div>
                </div>

                {/* Footer Caption */}
                <div className="absolute bottom-12 text-center w-full">
                    <p className="text-slate-600 text-xs font-medium uppercase tracking-[0.3em]">
                        OBJETIVO BAIXADA
                    </p>
                </div>
            </div>
        </div>
    );
}
