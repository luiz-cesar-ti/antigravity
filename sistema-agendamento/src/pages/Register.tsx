import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (!formData.totvs_number || !formData.full_name || !formData.email || !formData.password) {
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

        if (formData.password.length < 8) {
            setError('A senha deve ter no mínimo 8 caracteres.');
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
                                        type="password"
                                        name="password"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Mínimo 8 caracteres"
                                    />
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
                                        type="password"
                                        name="confirm_password"
                                        required
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                    />
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
                            <div className="bg-white p-3 rounded-lg border border-gray-100 mb-4 h-32 overflow-y-auto text-xs text-gray-600 leading-relaxed shadow-inner">
                                <p className="mb-2">
                                    Declaro que li e aceito os termos. Estou ciente de que o sistema armazenará meu <strong>Nome</strong>, <strong>E-mail Institucional</strong> e <strong>Unidade</strong> para fins de identificação e acesso.
                                </p>
                                <p className="mb-2">
                                    Concordo que todas as minhas ações de agendamento e empréstimo gerarão <strong>registros digitais (logs)</strong> para segurança e auditoria.
                                </p>
                                <p>
                                    Autorizo também o armazenamento de cópias digitais dos <strong>Termos de Responsabilidade</strong> assinados por mim, para fins de controle de patrimônio da instituição.
                                </p>
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
        </div>
    );
}
