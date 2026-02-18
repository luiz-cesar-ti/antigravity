import { useState } from 'react';
import { Building, User, Calendar, Clock, AlertCircle, Repeat } from 'lucide-react';
import { MobileTimePicker } from '../MobileTimePicker';
import { MobileDatePicker } from '../MobileDatePicker';
import { MobileRoomSelector } from '../MobileRoomSelector';
import { clsx } from 'clsx';
import type { RoomBookingData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { differenceInHours } from 'date-fns';

interface Step1Props {
    data: RoomBookingData;
    updateData: (data: Partial<RoomBookingData>) => void;
    onNext: () => void;
}

export function Step1RoomBasicInfo({ data, updateData, onNext }: Step1Props) {
    const { user } = useAuth();
    const { settings } = useSettings(data.unit);
    const [error, setError] = useState('');

    // Auto-fill available units from user profile
    const userProfile = user as any;
    const availableUnits = (user && 'units' in userProfile) ? userProfile.units : [];

    // Authorization check for recurring bookings (reuses same auth as equipment for now?)
    // Or maybe we treat room recurring separate? For MVP let's assume same permission or just allow naturally.
    // Let's reuse 'recurring_booking_units' logic for consistency.
    const authorizedRecurringUnits = userProfile?.recurring_booking_units || [];
    const hasRecurringAuth = authorizedRecurringUnits.length > 0 || userProfile?.recurring_booking_enabled;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
        setError(''); // Clear error on change
    };

    const validateStep = () => {
        if (data.isRecurring) {
            if (!data.unit || !data.totvs_number || data.dayOfWeek === undefined || !data.startTime || !data.endTime) {
                setError('Por favor, preencha todos os campos obrigatórios para o agendamento fixo.');
                return false;
            }

            // Strict unit authorization check
            if (!authorizedRecurringUnits.includes(data.unit) && !userProfile?.recurring_booking_enabled) {
                setError(`A unidade ${data.unit} não autorizou agendamentos fixos para seu usuário.`);
                return false;
            }
        } else {
            if (!data.unit || !data.totvs_number || !data.date || !data.startTime || !data.endTime) {
                setError('Por favor, preencha todos os campos obrigatórios.');
                return false;
            }

            // Prevent past dates and times
            const now = new Date();

            // If advance time is disabled, we allow "same minute" bookings
            if (settings && !settings.room_min_advance_time_enabled) {
                now.setSeconds(0, 0);
            }

            // If advance time is disabled, we allow "same minute" bookings
            // by resetting seconds and milliseconds for fairer comparison
            if (settings && !settings.room_min_advance_time_enabled) {
                now.setSeconds(0, 0);
            }

            // Parse date and time components separately to ensure local timezone
            const [year, month, day] = data.date.split('-').map(Number);
            const [startHour, startMinute] = data.startTime.split(':').map(Number);
            const bookingStart = new Date(year, month - 1, day, startHour, startMinute, 0);

            if (bookingStart < now) {
                setError('Não é possível realizar agendamentos para horários que já passaram.');
                return false;
            }
        }

        if (data.endTime <= data.startTime) {
            setError('A hora de término deve ser posterior à hora de início.');
            return false;
        }

        // Minimum advance time validation for ROOMS (not equipment)
        if (settings && settings.room_min_advance_time_enabled) {
            // Strict check with hours difference
            const now = new Date();
            const [year, month, day] = data.date.split('-').map(Number);
            const [startHour, startMinute] = data.startTime.split(':').map(Number);
            const bookingStart = new Date(year, month - 1, day, startHour, startMinute, 0);
            const hoursDiff = differenceInHours(bookingStart, now);

            if (hoursDiff < settings.room_min_advance_time_hours) {
                setError(`É necessário agendar salas com no mínimo ${settings.room_min_advance_time_hours} horas de antecedência. Por favor, escolha outro horário.`);
                return false;
            }
        } else {
            // Basic past time check with "same minute" allowance
            const now = new Date();
            now.setSeconds(0, 0); // Allow same minute

            const [year, month, day] = data.date.split('-').map(Number);
            const [startHour, startMinute] = data.startTime.split(':').map(Number);
            const bookingStart = new Date(year, month - 1, day, startHour, startMinute, 0);

            if (bookingStart < now) {
                setError("Não é possível realizar agendamentos para horários que já passaram.");
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h2 className="text-xl font-semibold text-gray-800">Informações Básicas (Salas)</h2>

                {hasRecurringAuth && (
                    <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto">
                        <button
                            onClick={() => updateData({ isRecurring: false })}
                            className={clsx(
                                "px-4 py-2.5 sm:py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
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
                                "px-4 py-2.5 sm:py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
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
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="totvs_number"
                            value={data.totvs_number}
                            readOnly
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

                {/* Date / Day of Week */}
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
                            <MobileDatePicker
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
                            <MobileTimePicker
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
                            <MobileTimePicker
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
