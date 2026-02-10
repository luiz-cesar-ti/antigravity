import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Mail, User, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="min-h-screen w-full flex bg-white font-sans text-slate-900 overflow-hidden relative">

            {/* ================================================================================== */}
            {/* MOBILE LAYOUT (< lg) */}
            {/* ================================================================================== */}
            <div className="lg:hidden flex flex-col w-full min-h-screen bg-blue-50/30 overflow-y-auto relative">
                {/* Background Gradient */}
                <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-blue-400/20 blur-[80px] rounded-full pointer-events-none z-0"></div>

                <div className="flex-1 flex flex-col px-6 pt-12 pb-6 relative z-10">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8 w-full">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg">
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-blue-950 tracking-tight text-center mb-2">
                            Recuperar Senha
                        </h2>
                        <p className="text-slate-500 font-medium text-center text-sm px-4">
                            Insira seus dados para receber o link de redefinição.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm mx-auto">
                        {message && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-green-700 font-bold">{message}</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 font-bold">{error}</p>
                            </div>
                        )}

                        {/* TOTVS Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Número TOTVS
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Ex: 123456"
                                    value={totvs}
                                    onChange={(e) => setTotvs(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                E-mail Institucional
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="seu.email@objetivoportal.com.br"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Enviar Link de Recuperação
                                    <Mail className="w-4 h-4 text-amber-400" />
                                </>
                            )}
                        </button>

                        {/* Back to Login */}
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mt-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o Login
                        </Link>
                    </form>
                </div>
            </div>

            {/* ================================================================================== */}
            {/* DESKTOP LAYOUT (lg:flex) */}
            {/* ================================================================================== */}

            {/* LEFT SIDE: Visual Background */}
            <div className="hidden lg:flex lg:w-[55%] relative bg-slate-900 overflow-hidden items-center justify-center">
                {/* Deep Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1121] to-[#1e3a8a] z-0"></div>

                {/* Animated Grid Pattern */}
                <motion.div
                    initial={{ opacity: 0, rotateX: 60 }}
                    animate={{ opacity: 0.12, rotateX: 60 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-x-0 bottom-[-100px] h-[150%] z-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        transform: 'perspective(1000px) rotateX(60deg) scale(1.5)'
                    }}
                />

                {/* Floating Key Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -20, 0] }}
                    transition={{
                        opacity: { duration: 0.8 },
                        scale: { duration: 0.8 },
                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute top-[25%] right-[20%] w-32 h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl"
                >
                    <KeyRound className="w-16 h-16 text-amber-400" />
                </motion.div>

                {/* Center Content */}
                <div className="relative z-20 text-center px-10 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-8"
                    >
                        <img
                            src="/logo-objetivo.png"
                            alt="Objetivo Logo"
                            className="h-20 w-auto object-contain brightness-0 invert"
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-6 uppercase"
                    >
                        Recuperação <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500">
                            de Acesso
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="text-blue-100/60 text-sm font-medium max-w-xs"
                    >
                        Você receberá um email com instruções para criar uma nova senha.
                    </motion.p>
                </div>

                {/* Footer Branding */}
                <div className="absolute bottom-6 z-20 flex items-center gap-2 opacity-60">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-500"></div>
                    <span className="text-[10px] text-yellow-500 font-bold tracking-[0.3em] uppercase">Objetivo Baixada</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-500"></div>
                </div>
            </div>

            {/* RIGHT SIDE: Form */}
            <div className="hidden lg:flex w-full lg:w-[45%] flex-col justify-center bg-white relative z-30 shadow-2xl">
                {/* Subtle Dot Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                ></div>

                <div className="w-full max-w-md mx-auto px-8 relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center mb-10 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg">
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-blue-950 tracking-tight mb-2">
                            Esqueceu sua senha?
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Não se preocupe! Vamos ajudá-lo a recuperar o acesso.
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-start gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-green-700 font-medium">{message}</p>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </motion.div>
                        )}

                        {/* TOTVS Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Número TOTVS
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Ex: 123456"
                                    value={totvs}
                                    onChange={(e) => setTotvs(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                E-mail Institucional
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="seu.email@objetivoportal.com.br"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Enviar Link de Recuperação
                                    <Mail className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-slate-100 my-6"></div>

                        {/* Back to Login */}
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 w-full py-4 border border-slate-200 bg-white text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o Login
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}
