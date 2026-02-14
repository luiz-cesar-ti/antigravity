import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Lock, User, AlertCircle, ArrowRight, CheckCircle2,
    Calendar, Loader2, Lightbulb, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export function Login() {
    const navigate = useNavigate();
    const { signIn, isLoading } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load remembered credentials
    useEffect(() => {
        const savedIdentifier = localStorage.getItem('remembered_identifier');
        if (savedIdentifier) {
            setIdentifier(savedIdentifier);
            setRememberMe(true);
        }

        const token = localStorage.getItem('sb-mcnkueyuxlyasntmsvke-auth-token') || localStorage.getItem('admin_session');
        if (!isLoading && token) {
            const timer = setTimeout(() => {
                const updatedToken = localStorage.getItem('sb-mcnkueyuxlyasntmsvke-auth-token') || localStorage.getItem('admin_session');
                if (updatedToken) navigate('/');
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
        <div className="min-h-screen w-full flex bg-white font-sans text-slate-900 overflow-hidden relative">

            {/* ================================================================================== */}
            {/* MOBILE LAYOUT (< lg) - Strict adherence to screenshot design */}
            {/* ================================================================================== */}
            <div className="lg:hidden flex flex-col w-full h-screen bg-blue-50/30 overflow-y-auto relative">
                {/* --- Background Gradient Element (Top Right Blue Glow) --- */}
                <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-blue-400/20 blur-[80px] rounded-full pointer-events-none z-0"></div>

                <div className="flex-1 flex flex-col px-6 pt-12 pb-6 relative z-10 text-center">

                    {/* 1. Header & Logo */}
                    <div className="flex flex-col items-center mb-10 w-full">
                        {/* Blue Standard Logo - Increased Size */}
                        <img
                            src="/logo-objetivo.png"
                            alt="Objetivo Logo"
                            className="w-64 h-auto object-contain mb-8"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl font-black text-blue-900 tracking-tighter">OBJETIVO</span>';
                            }}
                        />

                        <h2 className="text-3xl font-black text-blue-950 tracking-tight text-center mb-2">
                            Bem-vindo de volta
                        </h2>
                        <p className="text-slate-500 font-medium text-center text-sm px-4">
                            Acesse o painel de gerenciamento de recursos.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-sm mx-auto text-left">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 font-bold">{error}</p>
                            </div>
                        )}

                        {/* Input 1: Identification */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Identificação
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Usuário TOTVS ou E-mail"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    autoComplete="username"
                                />
                            </div>

                            {/* Yellow Helper Tag - Visual Only as per screenshot */}
                            <div className="bg-amber-50 rounded-lg p-2 flex items-center gap-1.5 border border-amber-100 mt-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wide">
                                    O número TOTVS está no seu crachá
                                </span>
                            </div>
                        </div>

                        {/* Input 2: Password */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Senha
                                </label>
                                <Link to="/forgot-password" className="text-[10px] font-bold text-amber-600 hover:underline uppercase tracking-widest">
                                    Recuperar Acesso
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Checkbox */}
                        <div className="flex items-center gap-3">
                            <div
                                onClick={() => setRememberMe(!rememberMe)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}
                            >
                                {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <label onClick={() => setRememberMe(!rememberMe)} className="text-sm font-semibold text-slate-600 cursor-pointer select-none">
                                Manter conectado
                            </label>
                        </div>

                        {/* Primary Button - Dark with Gold Arrow */}
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="w-full py-4 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar na Plataforma
                                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {/* Spacer */}
                        <div className="h-4"></div>

                        {/* Secondary Action - Outlined Button */}
                        <div className="text-center space-y-3">
                            <p className="text-slate-400 text-xs font-medium">
                                Ainda não tem acesso?
                            </p>
                            <Link
                                to="/register"
                                className="block w-full py-4 border border-slate-200 bg-white text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors uppercase tracking-wider text-center"
                            >
                                Cadastre-se
                            </Link>
                        </div>
                    </form>
                </div>
            </div>


            {/* ================================================================================== */}
            {/* DESKTOP LAYOUT (lg:flex) - Preserved Original "Dynamic Scheduler" Design */}
            {/* ================================================================================== */}

            {/* --- LEFT SIDE: THE SCHEDULING UNIVERSE (65%) - INCREASED WIDTH --- */}
            <div className="hidden lg:flex lg:w-[65%] relative bg-slate-900 overflow-hidden items-center justify-center">

                {/* 1. Deep Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1121] to-[#1e3a8a] z-0"></div>

                {/* 2. Animated Grid Pattern (Perspective Floor) */}
                <motion.div
                    initial={{ opacity: 0, rotateX: 60 }}
                    animate={{ opacity: 0.15, rotateX: 60 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-x-0 bottom-[-100px] h-[150%] z-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        transform: 'perspective(1000px) rotateX(60deg) scale(1.5)'
                    }}
                />

                {/* 3. The Elegant Modern Clock (Background Feature) */}
                <div className="absolute top-[10%] right-[10%] w-[420px] h-[420px] opacity-[0.12] pointer-events-none z-0">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/30 via-transparent to-yellow-400/20 blur-xl" />

                    {/* Main Clock Face */}
                    <div className="relative w-full h-full rounded-full border-2 border-white/40">
                        {/* Inner Decorative Ring */}
                        <div className="absolute inset-4 rounded-full border border-white/20" />
                        <div className="absolute inset-8 rounded-full border border-dashed border-white/10" />

                        {/* Hour Markers - Elegant Design */}
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute left-1/2 top-0 -translate-x-1/2 origin-[50%_210px]"
                                style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}
                            >
                                {/* Main Marker (larger for 12, 3, 6, 9) */}
                                <div className={`mx-auto rounded-full bg-white ${i % 3 === 0 ? 'w-3 h-3' : 'w-1.5 h-1.5'}`}
                                    style={{ marginTop: i % 3 === 0 ? '12px' : '16px' }} />
                            </div>
                        ))}

                        {/* Minute Markers (subtle dots) */}
                        {[...Array(60)].map((_, i) => (
                            i % 5 !== 0 && (
                                <div
                                    key={`min-${i}`}
                                    className="absolute w-0.5 h-0.5 bg-white/50 rounded-full left-1/2 top-0 -translate-x-1/2 origin-[50%_210px]"
                                    style={{ transform: `translateX(-50%) rotate(${i * 6}deg)`, marginTop: '20px' }}
                                />
                            )
                        ))}

                        {/* Hour Hand - Thick & Elegant (Fixed at 11:20 position) */}
                        <div
                            className="absolute top-1/2 left-1/2 w-2 h-[80px] bg-gradient-to-t from-white to-white/60 rounded-full origin-bottom shadow-lg"
                            style={{ marginLeft: '-4px', marginTop: '-80px', transform: 'rotate(340deg)' }}
                        />

                        {/* Minute Hand - Sleek (Fixed at 20 minutes position) */}
                        <div
                            className="absolute top-1/2 left-1/2 w-1.5 h-[110px] bg-gradient-to-t from-white/90 to-white/50 rounded-full origin-bottom"
                            style={{ marginLeft: '-3px', marginTop: '-110px', transform: 'rotate(120deg)' }}
                        />

                        {/* Second Hand - Gold Accent (Animated) */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 w-0.5 h-[130px] bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-full origin-bottom shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                            style={{ marginLeft: '-1px', marginTop: '-130px' }}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
                        />

                        {/* Center Pin - Golden */}
                        <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />
                        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />

                        {/* Inner Decorative Circle */}
                        <div className="absolute top-1/2 left-1/2 w-28 h-28 border border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    </div>
                </div>


                {/* 4. Floating Glass Cards (Foreground Elements - High Z-Index) */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Floating Card 1: Calendar - MOVED TO left-24 bottom-24 */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{
                            opacity: 1,
                            y: [0, -15, 0], // Continuous float: Up 15px then back down
                            rotate: -5
                        }}
                        transition={{
                            opacity: { duration: 1, delay: 0.5 },
                            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }, // Loop
                            rotate: { duration: 1, delay: 0.5 }
                        }}
                        className="absolute bottom-24 left-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-48 transform hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-yellow-400" />
                            <span className="text-[10px] font-bold text-white/80 tracking-wider uppercase">Calendário</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            {/* Calendar Grid with Numbers 1-12 */}
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold font-mono text-white/80 ${i === 5 ? 'bg-yellow-500 text-slate-900' : 'bg-white/5'}`}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Floating Card 2: Server/Resource - MOVED TO right-24 top-36 */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            y: [0, -20, 0], // Continuous float: Up 20px then back down
                            rotate: 5
                        }}
                        transition={{
                            opacity: { duration: 1, delay: 0.7 },
                            x: { duration: 1, delay: 0.7 },
                            y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }, // Loop
                            rotate: { duration: 1, delay: 0.7 }
                        }}
                        className="absolute top-36 right-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-64"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-xs font-mono text-green-300">AGENDAMENTO CONCLUÍDO</span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-1 w-full bg-white/10 rounded overflow-hidden">
                                <motion.div animate={{ width: ["0%", "70%"] }} transition={{ duration: 2 }} className="h-full bg-blue-500"></motion.div>
                            </div>
                            <div className="h-1 w-full bg-white/10 rounded overflow-hidden">
                                <motion.div animate={{ width: ["0%", "45%"] }} transition={{ duration: 2, delay: 0.2 }} className="h-full bg-yellow-500"></motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>


                {/* 5. Center Content: Logo & Headline (HIGHEST Z-INDEX) */}
                <div className="relative z-20 text-center px-10 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        whileHover={{ scale: 1.05 }}
                        className="mb-8 cursor-default"
                    >
                        {/* Logo Container with Golden Drop Shadow + Zoom Effect (No Blur) */}
                        <div className="relative group transition-all duration-300">
                            <div className="relative">
                                {/* Using the correct logo file and forcing white color */}
                                <img
                                    src="/logo-objetivo.png"
                                    alt="Objetivo Logo"
                                    className="h-24 w-auto object-contain brightness-0 invert filter drop-shadow-none group-hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] transition-all duration-300"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        // Fallback text if image fails
                                        const fallback = document.getElementById('logo-fallback');
                                        if (fallback) fallback.style.display = 'block';
                                    }}
                                />
                                <span id="logo-fallback" className="hidden text-5xl font-black text-white tracking-tighter">OBJETIVO</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* UPDATED HEADLINE: SISTEMA DE AGENDAMENTOS */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl lg:text-5xl font-black text-white tracking-tight leading-none mb-6 drop-shadow-lg uppercase"
                    >
                        Sistema de <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500 filter drop-shadow-sm">
                            Agendamentos
                        </span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2"
                    >
                        <p className="text-blue-100/80 text-sm font-medium tracking-wide">
                            Gestão de Salas • Agendamentos • Equipamentos
                        </p>
                    </motion.div>
                </div>

                {/* 6. Footer Branding */}
                <div className="absolute bottom-6 z-20 flex items-center gap-2 opacity-60">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-500"></div>
                    <span className="text-[10px] text-yellow-500 font-bold tracking-[0.3em] uppercase">Objetivo Baixada</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-500"></div>
                </div>
            </div>

            {/* --- RIGHT SIDE: THE LOGIN FORM (35%) - DECREASED WIDTH --- */}
            <div className="hidden lg:flex w-full lg:w-[35%] flex-col justify-center bg-white relative z-30 shadow-2xl">
                {/* Subtle Dot Grid Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                ></div>

                {/* --- CENTERED CONTENT CONTAINER --- */}
                <div className="w-full max-w-sm mx-auto px-6 relative z-10 flex flex-col items-center">

                    {/* 1. Header & Logo (Centered like image) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center mb-10 text-center w-full"
                    >
                        {/* Default Blue Logo - Large */}
                        <img
                            src="/logo-objetivo.png"
                            alt="Objetivo Logo"
                            className="h-16 w-auto object-contain mb-8"
                        />

                        <h2 className="text-3xl font-black text-blue-950 tracking-tight mb-2">
                            Bem-vindo de volta
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Acesse o painel de gerenciamento de recursos.
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="w-full space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-start gap-2"
                            >
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 font-bold">{error}</p>
                            </motion.div>
                        )}

                        {/* Input 1: Identification */}
                        <div className="space-y-1.5 w-full">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Identificação
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                                    placeholder="Usuário TOTVS ou E-mail"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    autoComplete="username"
                                />
                            </div>

                            {/* Yellow Helper Tag */}
                            <div className="bg-amber-50 rounded-lg p-2 flex items-center gap-1.5 border border-amber-100 mt-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wide">
                                    O número TOTVS está no seu crachá
                                </span>
                            </div>
                        </div>

                        {/* Input 2: Password */}
                        <div className="space-y-1.5 w-full">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Senha
                                </label>
                                <Link to="/forgot-password" className="text-[10px] font-bold text-amber-600 hover:underline uppercase tracking-widest">
                                    Recuperar Acesso
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Checkbox */}
                        <div className="flex items-center gap-3">
                            <div
                                onClick={() => setRememberMe(!rememberMe)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}
                            >
                                {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <label onClick={() => setRememberMe(!rememberMe)} className="text-sm font-semibold text-slate-600 cursor-pointer select-none">
                                Manter conectado
                            </label>
                        </div>

                        {/* Primary Button - Dark Navy (Matches Mobile & Image) */}
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="w-full py-4 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar na Plataforma
                                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {/* Divider Line */}
                        <div className="border-t border-slate-100 my-4 w-full"></div>

                        {/* Secondary Action - Outlined Button (Matches Image) */}
                        <div className="text-center space-y-3 w-full">
                            <p className="text-blue-950 text-sm font-bold">
                                Ainda não tem acesso?
                            </p>
                            <Link
                                to="/register"
                                className="inline-block w-auto px-10 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider"
                            >
                                Cadastre-se
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
