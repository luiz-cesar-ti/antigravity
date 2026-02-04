import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, Check, Info, FileText, X, Eye, EyeOff, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { SCHOOL_UNITS } from '../utils/constants';
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

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&).');
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Cadastro de Professor
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Crie sua conta para acessar o sistema
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* TOTVS Number */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Número TOTVS *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="totvs_number"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                                        value={formData.totvs_number}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 12345"
                                    />
                                </div>
                                <p className="mt-2 text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded inline-block">
                                    💡 O número TOTVS está no seu crachá
                                </p>
                            </div>

                            {/* Full Name */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nome Completo *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    {/* Using User icon again or another? */}
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="full_name"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* Job Title */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Cargo/Função *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        name="job_title"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3 bg-white"
                                        value={formData.job_title}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Professor(a)">Professor(a)</option>
                                        <option value="Coordenador(a)">Coordenador(a)</option>
                                        <option value="Diretor(a)">Diretor(a)</option>
                                        <option value="TI">TI</option>
                                    </select>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">
                                    Email Institucional *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Apenas e-mail do objetivoportal.com.br"
                                    />
                                </div>
                            </div>

                            {/* Password Security Tip - Moved Full Width */}
                            <div className="sm:col-span-6 bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <div className="flex gap-2 mb-2">
                                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Senha Segura (Obrigatório)</p>
                                </div>
                                <p className="text-[11px] text-blue-800 leading-relaxed">
                                    Para sua segurança, a senha deve ter no mínimo <strong>8 caracteres</strong> e conter pelo menos:
                                </p>
                                <ul className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1 text-[10px] text-blue-700 font-medium">
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

                            {/* Password */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Senha *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md p-3"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Senha forte"
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

                            {/* Confirm Password */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Confirmar Senha *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md p-3"
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                        placeholder="Confirme a senha"
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

                            {/* Units Selection - Custom Multi-select UI */}
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unidades do Objetivo (Selecione TODAS onde trabalha) *
                                </label>
                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                    <div className="space-y-2">
                                        {SCHOOL_UNITS.map((unit) => (
                                            <div
                                                key={unit}
                                                onClick={() => handleUnitToggle(unit)}
                                                className={`flex items-center p-3 rounded cursor-pointer transition-colors ${formData.units.includes(unit)
                                                    ? 'bg-primary-50 border-primary-200 border'
                                                    : 'bg-white border border-transparent hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className={`h-5 w-5 rounded border flex items-center justify-center mr-3 ${formData.units.includes(unit)
                                                    ? 'bg-primary-600 border-primary-600'
                                                    : 'border-gray-300 bg-white'
                                                    }`}>
                                                    {formData.units.includes(unit) && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <span className={`text-sm ${formData.units.includes(unit) ? 'text-primary-900 font-medium' : 'text-gray-700'
                                                    }`}>
                                                    {unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Selecione pelo menos uma unidade.
                                </p>
                            </div>
                        </div>

                        {/* LGPD Consent */}
                        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-primary-600" />
                                Termos de Uso e Privacidade
                            </h3>
                            <div className="bg-white p-4 rounded-lg border border-gray-100 mb-4 shadow-sm">
                                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                    Para criar sua conta, é necessário aceitar nossos termos de uso, que abrangem política de privacidade (LGPD), responsabilidade sobre equipamentos e segurança da conta.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowTermModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-primary-100 bg-primary-50 text-primary-700 text-xs font-bold rounded-lg hover:bg-primary-100 transition-colors uppercase"
                                >
                                    <FileText className="h-4 w-4" />
                                    Ler Termos Completos
                                </button>
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        required
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded cursor-pointer"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="terms" className="font-medium text-gray-700 cursor-pointer select-none">
                                        Li e concordo com os termos acima <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Você precisa aceitar os termos para criar sua conta.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting || !acceptedTerms}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
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
                                    Já tem conta?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                Voltar para Login
                            </Link>
                        </div>
                    </div>
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
                                <FileText className="h-5 w-5 text-primary-600" />
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
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 transition-all flex items-center gap-2"
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
