import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
    const navigate = useNavigate();
    const { signIn, isLoading } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                        Excelência no <span className="text-primary-300">Agendamento</span>
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

                {/* Decorative Elements */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-primary-400 font-black text-[8rem] opacity-5 select-none pointer-events-none whitespace-nowrap">
                    OBJETIVO
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
                <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center mb-12">
                        <div className="p-4 bg-primary-600 rounded-3xl shadow-xl shadow-primary-200 mb-4">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Colégio Objetivo</h1>
                    </div>

                    <div className="mb-10 text-center">
                        <h2 className="text-4xl font-black text-gray-900 leading-tight tracking-tight mb-3">
                            Bem-Vindo
                        </h2>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
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
                                <label htmlFor="identifier" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
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
                                        className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                        placeholder="E-mail ou Número de usuário TOTVS"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                                <p className="mt-2 text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded inline-block ml-1">
                                    💡 O Número de usuário TOTVS está no seu crachá
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Sua Senha
                                    </label>
                                    <Link to="/forgot-password" title="Clique para recuperar sua senha" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors">
                                        Esqueci Senha
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-2xl text-sm font-bold placeholder:text-gray-300 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
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
