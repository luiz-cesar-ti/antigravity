import { useState } from 'react';
import { Building, User, MapPin, Calendar, Clock, AlertCircle, Repeat } from 'lucide-react';
import { clsx } from 'clsx';
import type { BookingData } from '../../pages/BookingWizard';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { differenceInHours, parseISO } from 'date-fns';

interface Step1Props {
    data: BookingData;
    updateData: (data: Partial<BookingData>) => void;
    onNext: () => void;
}

export function Step1BasicInfo({ data, updateData, onNext }: Step1Props) {
    const { user } = useAuth();
    const { settings } = useSettings(data.unit);
    const [error, setError] = useState('');

    // Auto-fill available units from user profile
    const userProfile = user as any;
    const availableUnits = (user && 'units' in userProfile) ? userProfile.units : [];

    // Authorization check for recurring bookings
    const authorizedRecurringUnits = userProfile?.recurring_booking_units || [];
    const hasRecurringAuth = authorizedRecurringUnits.length > 0 || userProfile?.recurring_booking_enabled;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
        setError(''); // Clear error on change
    };

    const validateStep = () => {
        if (data.isRecurring) {
            if (!data.unit || !data.totvs_number || !data.local || data.dayOfWeek === undefined || !data.startTime || !data.endTime) {
                setError('Por favor, preencha todos os campos obrigatórios para o agendamento fixo.');
                return false;
            }

            // Strict unit authorization check
            if (!authorizedRecurringUnits.includes(data.unit) && !userProfile?.recurring_booking_enabled) {
                setError(`A unidade ${data.unit} não autorizou agendamentos fixos para seu usuário.`);
                return false;
            }
        } else {
            if (!data.unit || !data.totvs_number || !data.local || !data.date || !data.startTime || !data.endTime) {
                setError('Por favor, preencha todos os campos obrigatórios.');
                return false;
            }

            // Prevent past dates only for normal bookings
            const today = new Date().toISOString().split('T')[0];
            if (data.date < today) {
                setError('Não é possível agendar para datas passadas.');
                return false;
            }
        }

        if (data.endTime <= data.startTime) {
            setError('A hora de término deve ser posterior à hora de início.');
            return false;
        }

        // Minimum advance time validation
        if (settings && settings.min_advance_time_enabled) {
            const now = new Date();
            const bookingStart = parseISO(`${data.date}T${data.startTime}`);
            const hoursDiff = differenceInHours(bookingStart, now);

            if (hoursDiff < settings.min_advance_time_hours) {
                setError(`É necessário agendar com no mínimo ${settings.min_advance_time_hours} horas de antecedência. Por favor, escolha outro horário.`);
                return false;
            }
        }


        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            onNext();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-800">Informações Básicas</h2>

                {hasRecurringAuth && (
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => updateData({ isRecurring: false })}
                            className={clsx(
                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                !data.isRecurring ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Normal
                        </button>
                        <button
                            onClick={() => {
                                // Clear current unit if it's not authorized for recurring
                                const currentUnit = data.unit;
                                const isAuthorized = authorizedRecurringUnits.includes(currentUnit);

                                if (authorizedRecurringUnits.length === 1 && !isAuthorized) {
                                    updateData({ isRecurring: true, unit: authorizedRecurringUnits[0] });
                                } else if (!isAuthorized) {
                                    updateData({ isRecurring: true, unit: '' });
                                } else {
                                    updateData({ isRecurring: true });
                                }
                            }}
                            className={clsx(
                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
                                data.isRecurring ? "bg-primary-600 text-white shadow-lg shadow-primary-100" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Repeat className="h-3 w-3" />
                            Agendamento Fixo
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200 animate-fadeIn">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unit Selection */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Unidade Objetivo *</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            name="unit"
                            value={data.unit}
                            onChange={handleInputChange}
                            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                        >
                            <option value="">Selecione uma unidade...</option>
                            {availableUnits
                                .filter((unit: string) => !data.isRecurring || authorizedRecurringUnits.includes(unit))
                                .map((unit: string) => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* TOTVS Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Usuário TOTVS *</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {/* Using a key icon or similar could be better, but User is fine */}
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="totvs_number"
                            value={data.totvs_number}
                            readOnly // Readonly per prompt requirement after initial input or login? Prompt says "O número de usuário TOTVS está no seu crachá. Obrigatório".
                            // But also "Nome Completo... Preenchimento automático... Somente leitura".
                            // If user is logged in, these are likely locked? 
                            // The prompt implies a booking flow where teacher might input this. 
                            // But since we have Auth, we should pre-fill and lock if possible, or allow edit?
                            // "Quando o professor digitar... busca". Implies input. 
                            // BUT "149. Número de Usuário TOTVS... Obrigatório".
                            // Since we are authenticated, we know who it is. Let's pre-fill and maybe lock or allow confirm?
                            // I'll keep it readonly since it comes from Auth profile.
                            className="bg-gray-100 focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3 cursor-not-allowed text-gray-500"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">O número de usuário TOTVS está no seu crachá</p>
                </div>

                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="full_name"
                            value={data.full_name}
                            readOnly
                            className="bg-gray-100 focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3 cursor-not-allowed text-gray-500"
                        />
                    </div>
                </div>

                {/* Local */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Local *</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="local"
                            value={data.local}
                            onChange={handleInputChange}
                            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                            placeholder="Ex: sala 10, laboratório, auditório"
                        />
                    </div>
                </div>

                {/* Date */}
                {/* Conditional: Date or Day of Week */}
                {data.isRecurring ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dia da Semana *</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                name="dayOfWeek"
                                value={data.dayOfWeek ?? ''}
                                onChange={(e) => updateData({ dayOfWeek: parseInt(e.target.value) })}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                            >
                                <option value="">Escolha o dia...</option>
                                <option value="1">Segunda-feira</option>
                                <option value="2">Terça-feira</option>
                                <option value="3">Quarta-feira</option>
                                <option value="4">Quinta-feira</option>
                                <option value="5">Sexta-feira</option>
                                <option value="6">Sábado</option>
                                <option value="0">Domingo</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data *</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                name="date"
                                value={data.date}
                                onChange={handleInputChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                            />
                        </div>
                    </div>
                )}

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hora Início *</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Clock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="time"
                                name="startTime"
                                value={data.startTime}
                                onChange={handleInputChange}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hora Término *</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Clock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="time"
                                name="endTime"
                                value={data.endTime}
                                onChange={handleInputChange}
                                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3"
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleNext}
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                    Próximo
                </button>
            </div>
        </div>
    );
}
