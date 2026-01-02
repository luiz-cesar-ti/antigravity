import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Step1BasicInfo } from '../components/booking/Step1BasicInfo';
import { Step2Equipment } from '../components/booking/Step2Equipment';
import { Step3Confirmation } from '../components/booking/Step3Confirmation';

export type BookingData = {
    unit: string;
    totvs_number: string;
    full_name: string;
    local: string;
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
    equipments: { id: string; name: string; quantity: number; model?: string; brand?: string; }[];
    observations?: string;
    termAccepted: boolean;
    displayId?: string;
    verificationToken?: string;
};

export function BookingWizard() {
    const { user } = useAuth();
    const teacherUser = user as import('../types').User | null;
    const [currentStep, setCurrentStep] = useState(1);
    const [bookingData, setBookingData] = useState<BookingData>({
        unit: '',
        totvs_number: teacherUser?.totvs_number || '',
        full_name: teacherUser?.full_name || '',
        local: '',
        date: '',
        startTime: '',
        endTime: '',
        equipments: [],
        termAccepted: false
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const updateData = (data: Partial<BookingData>) => {
        setBookingData(prev => ({ ...prev, ...data }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Steps Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Novo Agendamento</h1>
                <p className="text-gray-600">Preencha as informações abaixo para reservar seus equipamentos</p>

                <div className="mt-6 flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />

                    {[1, 2, 3].map(step => (
                        <div key={step} className={`flex flex-col items-center bg-gray-50 px-2`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step <= currentStep ? 'bg-primary-600' : 'bg-gray-300'
                                }`}>
                                {step}
                            </div>
                            <span className={`text-xs mt-1 font-medium ${step <= currentStep ? 'text-primary-700' : 'text-gray-500'
                                }`}>
                                {step === 1 ? 'Dados Básicos' : step === 2 ? 'Equipamentos' : 'Confirmação'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                {currentStep === 1 && (
                    <Step1BasicInfo
                        data={bookingData}
                        updateData={updateData}
                        onNext={nextStep}
                    />
                )}
                {currentStep === 2 && (
                    <Step2Equipment
                        data={bookingData}
                        updateData={updateData}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                )}
                {currentStep === 3 && (
                    <Step3Confirmation
                        data={bookingData}
                        updateData={updateData}
                        onPrev={prevStep}
                    />
                )}
            </div>
        </div>
    );
}
