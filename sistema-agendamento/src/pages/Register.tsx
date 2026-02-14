import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, Check, Info, FileText, X, Eye, EyeOff, Briefcase, UserPlus, ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { SCHOOL_UNITS, JOB_TITLES } from '../utils/constants';
import { SuccessModal } from '../components/SuccessModal';

export function Register() {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        totvs_number: '',
        full_name: '',
        email: '',
        password: '',
        confirm_password: '',
        units: [] as string[],
        job_title: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termVersion, setTermVersion] = useState('v1.0');
    const [fullTermContent, setFullTermContent] = useState('');
    const [showTermModal, setShowTermModal] = useState(false);
    const [termError, setTermError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const fetchTerms = async () => {
            setTermError(null);
            try {
                const { data, error } = await supabase
                    .from('legal_terms')
                    .select('content, version_tag')
                    .eq('type', 'registration')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setFullTermContent(data.content);
                    setTermVersion(data.version_tag);
                } else {
                    setTermError('Nenhum termo encontrado.');
                }
            } catch (error: any) {
                console.error('Error fetching terms:', error);
                setTermError(error.message || 'Erro de conexão');
            }
        };

        fetchTerms();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validations
        if (!formData.totvs_number || !formData.full_name || !formData.email || !formData.password || !formData.job_title) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (formData.units.length === 0) {
            setError('Selecione pelo menos uma unidade onde você trabalha.');
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setError('As senhas não coincidem.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais (ex: @, #, $, %).');
            return;
        }

        if (!formData.email.toLowerCase().endsWith('@objetivoportal.com.br')) {
            setError('Use apenas seu e-mail institucional @objetivoportal.com.br');
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);

        const { error: signUpError } = await signUp({
            email: formData.email,
            password: formData.password,
            totvs_number: formData.totvs_number,
            full_name: formData.full_name,
            job_title: formData.job_title,
            units: formData.units,
            terms_accepted: acceptedTerms,
            terms_version: termVersion,
        });

        if (signUpError) {
            if (signUpError.includes('already registered') || signUpError.includes('User already registered') || signUpError.includes('duplicate key')) {
                setError('Este e-mail já está cadastrado no sistema.');
            } else {
                setError(signUpError);
            }
            setIsSubmitting(false);
        } else {
            // Success - Show confirmation modal
            setShowSuccessModal(true);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        navigate('/login');
    };

    // Shared input class
    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm";
    const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block";

    return (
        <div className="min-h-screen w-full flex bg-white font-sans text-slate-900 overflow-hidden relative">

            {/* ================================================================================== */}
            {/* MOBILE LAYOUT (< lg) */}
            {/* ================================================================================== */}
            <div className="lg:hidden flex flex-col w-full min-h-screen bg-blue-50/30 overflow-y-auto relative">
                {/* Background Gradient */}
                <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-blue-400/20 blur-[80px] rounded-full pointer-events-none z-0"></div>

                <div className="flex-1 flex flex-col px-5 pt-8 pb-6 relative z-10">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-6 w-full">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg">
                            <UserPlus className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-blue-950 tracking-tight text-center mb-1">
                            Cadastro de Professor
                        </h2>
                        <p className="text-slate-500 font-medium text-center text-xs px-4">
                            Preencha os dados para criar sua conta
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 font-bold">{error}</p>
                            </div>
                        )}

                        {/* TOTVS & Full Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Nº TOTVS *</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="totvs_number"
                                        required
                                        className={inputClass}
                                        value={formData.totvs_number}
                                        onChange={handleInputChange}
                                        placeholder="12345"
                                    />
                                </div>
                                <p className="mt-1.5 text-[8px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block uppercase tracking-wide">
                                    O número TOTVS está no seu crachá
                                </p>
                            </div>
                            <div>
                                <label className={labelClass}>Cargo *</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        name="job_title"
                                        required
                                        className={`${inputClass} appearance-none`}
                                        value={formData.job_title}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Selecione</option>
                                        {JOB_TITLES.map((title) => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className={labelClass}>Nome Completo *</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    className={inputClass}
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    placeholder="Seu nome completo"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelClass}>E-mail Institucional *</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className={inputClass}
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="seu.email@objetivoportal.com.br"
                                />
                            </div>
                        </div>

                        {/* Password Info */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <div className="flex gap-2 items-center mb-2">
                                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                                <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Requisitos de Senha Segura</p>
                            </div>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-1.5 text-[11px] text-blue-700 font-medium">
                                <span>• 8+ caracteres</span>
                                <span>• Letra Maiúscula</span>
                                <span>• Letra Minúscula</span>
                                <span>• Número</span>
                                <span className="col-span-2">• Caracteres especiais (ex: @ # $ % &)</span>
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Senha *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        className={`${inputClass} pr-10`}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Confirmar *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        required
                                        className={`${inputClass} pr-10`}
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Units Selection */}
                        <div>
                            <label className={labelClass}>Unidades onde trabalha *</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                                <div className="space-y-1.5">
                                    {SCHOOL_UNITS.map((unit) => (
                                        <div
                                            key={unit}
                                            onClick={() => handleUnitToggle(unit)}
                                            className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all text-sm ${formData.units.includes(unit)
                                                ? 'bg-amber-50 border border-amber-200'
                                                : 'bg-white border border-transparent hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className={`h-4 w-4 rounded border flex items-center justify-center mr-2.5 ${formData.units.includes(unit)
                                                ? 'bg-amber-500 border-amber-500'
                                                : 'border-slate-300 bg-white'
                                                }`}>
                                                {formData.units.includes(unit) && <Check className="h-2.5 w-2.5 text-white" />}
                                            </div>
                                            <span className={`text-xs ${formData.units.includes(unit) ? 'text-amber-900 font-bold' : 'text-slate-700'}`}>
                                                {unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <input
                                    id="terms-mobile"
                                    type="checkbox"
                                    required
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                                />
                                <div className="text-xs">
                                    <label htmlFor="terms-mobile" className="font-bold text-slate-700 cursor-pointer">
                                        Li e concordo com os{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowTermModal(true)}
                                            className="text-blue-600 underline hover:text-blue-800"
                                        >
                                            Termos de Uso
                                        </button>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !acceptedTerms}
                            className="w-full py-4 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Finalizar Cadastro
                                    <UserPlus className="w-4 h-4 text-amber-400" />
                                </>
                            )}
                        </button>

                        {/* Back to Login */}
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mt-2"
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

            {/* LEFT SIDE: Visual Background - FIXED */}
            <div className="hidden lg:flex lg:w-[45%] fixed left-0 top-0 h-screen bg-slate-900 overflow-hidden items-center justify-center">
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

                {/* Floating Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
                    transition={{
                        opacity: { duration: 0.8 },
                        scale: { duration: 0.8 },
                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute top-[15%] right-[5%] w-20 h-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl"
                >
                    <UserPlus className="w-10 h-10 text-amber-400" />
                </motion.div>

                {/* Center Content */}
                <div className="relative z-20 text-center px-10 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-10"
                    >
                        <img
                            src="/logo-objetivo.png"
                            alt="Objetivo Logo"
                            className="h-24 w-auto object-contain brightness-0 invert"
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-8 uppercase"
                    >
                        Cadastro <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500">
                            de Professor
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="text-blue-100/60 text-base font-medium max-w-sm"
                    >
                        Crie sua conta para acessar o sistema de agendamentos.
                    </motion.p>
                </div>

                {/* Footer Branding */}
                <div className="absolute bottom-6 z-20 flex items-center gap-2 opacity-60">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-500"></div>
                    <span className="text-[10px] text-yellow-500 font-bold tracking-[0.3em] uppercase">Objetivo Baixada</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-500"></div>
                </div>
            </div>

            {/* RIGHT SIDE: Form - SCROLLABLE */}
            <div className="hidden lg:flex lg:w-[55%] lg:ml-[45%] min-h-screen flex-col justify-start bg-white relative z-30 shadow-2xl overflow-y-auto py-8">
                {/* Subtle Dot Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                ></div>

                <div className="w-full max-w-2xl mx-auto px-8 relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-4 mb-8"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                            <UserPlus className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-blue-950 tracking-tight">
                                Criar Nova Conta
                            </h2>
                            <p className="text-slate-500 font-medium text-sm">
                                Preencha os campos abaixo para se cadastrar
                            </p>
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-5">
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

                        {/* Row 1: TOTVS, Full Name, Job Title */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Nº TOTVS *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="totvs_number"
                                        required
                                        className={inputClass}
                                        value={formData.totvs_number}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 12345"
                                    />
                                </div>
                                <p className="mt-1.5 text-[8px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block uppercase tracking-wide">
                                    O número TOTVS está no seu crachá
                                </p>
                            </div>
                            <div>
                                <label className={labelClass}>Nome Completo *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="full_name"
                                        required
                                        className={inputClass}
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Cargo/Função *</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        name="job_title"
                                        required
                                        className={`${inputClass} appearance-none cursor-pointer`}
                                        value={formData.job_title}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Selecione...</option>
                                        {JOB_TITLES.map((title) => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelClass}>E-mail Institucional *</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className={inputClass}
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="seu.email@objetivoportal.com.br"
                                />
                            </div>
                        </div>

                        {/* Password Requirements Info */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <div className="flex gap-2 items-center mb-3">
                                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Requisitos de Senha Segura</p>
                            </div>
                            <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 text-xs text-blue-700 font-medium w-full">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-blue-700 shrink-0" />
                                    <span>8+ caracteres</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-blue-700 shrink-0" />
                                    <span>Letra Maiúscula</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-blue-700 shrink-0" />
                                    <span>Letra Minúscula</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-blue-700 shrink-0" />
                                    <span>Número</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-blue-700 shrink-0" />
                                    <span>Caracteres especiais (ex: @ # $ % &)</span>
                                </div>
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Senha *</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        className={`${inputClass} pr-12`}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Senha forte"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Confirmar Senha *</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        required
                                        className={`${inputClass} pr-12`}
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                        placeholder="Confirme a senha"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Units Selection */}
                        <div>
                            <label className={labelClass}>
                                <Building2 className="inline w-3.5 h-3.5 mr-1" />
                                Unidades do Objetivo (Selecione TODAS onde trabalha) *
                            </label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                    {SCHOOL_UNITS.map((unit) => (
                                        <div
                                            key={unit}
                                            onClick={() => handleUnitToggle(unit)}
                                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${formData.units.includes(unit)
                                                ? 'bg-amber-50 border border-amber-200 shadow-sm'
                                                : 'bg-white border border-transparent hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className={`h-5 w-5 rounded border flex items-center justify-center mr-3 ${formData.units.includes(unit)
                                                ? 'bg-amber-500 border-amber-500'
                                                : 'border-slate-300 bg-white'
                                                }`}>
                                                {formData.units.includes(unit) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className={`text-sm ${formData.units.includes(unit) ? 'text-amber-900 font-bold' : 'text-slate-700'}`}>
                                                {unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Terms Section */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <FileText className="h-4 w-4 text-amber-600" />
                                Termos de Uso e Privacidade
                            </h3>
                            <div className="bg-white p-4 rounded-lg border border-slate-100 mb-4 shadow-sm">
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                                    Para criar sua conta, é necessário aceitar nossos termos de uso, que abrangem política de privacidade (LGPD), responsabilidade sobre equipamentos e segurança da conta.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowTermModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors uppercase tracking-wider"
                                >
                                    <FileText className="h-4 w-4" />
                                    Ler Termos Completos
                                </button>
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    id="terms-desktop"
                                    type="checkbox"
                                    required
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-0.5 h-5 w-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                                />
                                <label htmlFor="terms-desktop" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                    Li e concordo com os termos acima <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !acceptedTerms}
                            className="w-full py-4 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Finalizar Cadastro
                                    <UserPlus className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-slate-100 my-4"></div>

                        {/* Back to Login */}
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 w-full py-3.5 border border-slate-200 bg-white text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Já tem conta? Voltar para o Login
                        </Link>
                    </form>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleCloseSuccess}
                title="Confirme seu E-mail"
                message={`Um e-mail de confirmação foi enviado para ${formData.email}. Verifique sua caixa de entrada (e spam) para ativar sua conta e acessar o sistema.`}
                type="email"
            />

            {/* Term Modal */}
            {showTermModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowTermModal(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-600" />
                                Termos de Uso do Sistema
                            </h3>
                            <button
                                onClick={() => setShowTermModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content - A4 Paper Container Wrapper */}
                        <div className="flex-1 overflow-y-auto bg-gray-100/50 p-4 md:p-8">
                            {/* A4 Paper */}
                            <div className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[200mm] p-[10mm] text-black font-sans relative flex flex-col">
                                {fullTermContent ? (
                                    <>
                                        {/* Header / Logo */}
                                        <div className="text-center mb-6">
                                            <img
                                                src="/logo-objetivo.png"
                                                alt="Colégio Objetivo"
                                                className="h-20 object-contain mx-auto"
                                            />
                                        </div>

                                        <h1 className="text-center font-bold text-lg uppercase mb-6 border-b border-gray-200 pb-4">
                                            Política de Privacidade e Termos de Uso
                                        </h1>

                                        {/* Document Text */}
                                        <div className="whitespace-pre-wrap text-base md:text-lg leading-loose text-justify text-gray-800 font-sans">
                                            {fullTermContent}
                                        </div>

                                        {/* Digital Signature Placeholder (Visual only) */}
                                        <div className="mt-12 pt-6 border-t border-gray-300 flex justify-between items-end text-[9pt] text-gray-500">
                                            <div>
                                                <p className="font-bold text-black uppercase mb-1">Documento Digital</p>
                                                <p>Sistema de Agendamentos Objetivo</p>
                                            </div>
                                            <div className="text-right">
                                                <p>Versão: {termVersion}</p>
                                                <p>Data de Visualização: {new Date().toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center flex-1 h-full py-20 text-gray-400">
                                        {termError ? (
                                            <>
                                                <AlertCircle className="h-10 w-10 text-red-300 mb-3" />
                                                <p className="text-red-900 font-medium">{termError}</p>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center animate-pulse">
                                                <div className="h-20 w-32 bg-gray-200 rounded-lg mb-4"></div>
                                                <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
                                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                                <p className="mt-4 text-xs uppercase tracking-widest">Carregando Documento...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                            <button
                                onClick={() => setShowTermModal(false)}
                                className="px-6 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => {
                                    setAcceptedTerms(true);
                                    setShowTermModal(false);
                                }}
                                className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2"
                            >
                                <Check className="h-4 w-4" />
                                Li e Concordo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
