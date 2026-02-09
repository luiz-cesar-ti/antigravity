import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Step1BasicInfo } from '../components/booking/Step1BasicInfo';
import { Step2Equipment } from '../components/booking/Step2Equipment';
import { Step3Confirmation } from '../components/booking/Step3Confirmation';
import { motion } from 'framer-motion';
import { Check, Monitor, User } from 'lucide-react';

export type BookingData = {
    unit: string;
    totvs_number: string;
    full_name: string;
    job_title?: string;
    local: string;
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
    equipments: { id: string; name: string; quantity: number; model?: string; brand?: string; }[];
    observations?: string;
    termAccepted: boolean;
    displayId?: string;
    isRecurring?: boolean;
    dayOfWeek?: number;
    term_hash?: string;
    version_tag?: string;
    term_document?: any;
};

export function BookingWizard() {
    const { user } = useAuth();
    const teacherUser = user as import('../types').User | null;
    const [currentStep, setCurrentStep] = useState(1);
    const [bookingData, setBookingData] = useState<BookingData>({
        unit: '',
        totvs_number: teacherUser?.totvs_number || '',
        full_name: teacherUser?.full_name || '',
        job_title: teacherUser?.job_title || '',
        local: '',
        date: '',
        startTime: '',
        endTime: '',
        equipments: [],
        termAccepted: false,
        isRecurring: false
    });

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const updateData = (data: Partial<BookingData>) => {
        setBookingData(prev => ({ ...prev, ...data }));
    };

    const steps = [
        { id: 1, label: 'Dados Básicos', icon: User },
        { id: 2, label: 'Equipamentos', icon: Monitor },
        { id: 3, label: 'Confirmação', icon: Check }
    ];

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Animated Header */}
            <div className="mb-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        Novo Agendamento
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Siga os 3 passos abaixo para reservar seus equipamentos com segurança
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <div className="mt-10 relative max-w-3xl mx-auto">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-11 right-11 md:left-8 md:right-8 h-1.5 bg-gray-300 rounded-full -translate-y-1/2 z-0"></div>

                    {/* Active Line - Animated */}
                    <motion.div
                        className="absolute top-1/2 left-11 right-11 md:left-8 md:right-8 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full -translate-y-1/2 z-0 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{
                            scaleX: (currentStep - 1) / 2,
                            backgroundPosition: ["0% 50%", "100% 50%"]
                        }}
                        transition={{
                            scaleX: { duration: 0.5, ease: "easeInOut" },
                            backgroundPosition: { duration: 1.5, repeat: Infinity, ease: "linear" }
                        }}
                        style={{ backgroundSize: "200% 100%" }}
                    />

                    <div className="flex justify-between items-center w-full px-8 md:px-2">
                        {steps.map((step) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;

                            return (
                                <div key={step.id} className="relative flex flex-col items-center group cursor-default z-10">
                                    <motion.div
                                        className={`w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 shadow-lg ${isActive
                                            ? 'bg-amber-500 border-white text-white shadow-amber-200 scale-110'
                                            : isCompleted
                                                ? 'bg-slate-900 border-white text-amber-400 shadow-slate-200 hover:bg-slate-800'
                                                : 'bg-white border-slate-200 text-slate-300 shadow-sm'
                                            }`}
                                        animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                                        whileHover={!isActive && !isCompleted ? { scale: 1.05 } : {}}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-5 h-5 md:w-8 md:h-8" strokeWidth={3} />
                                        ) : (
                                            <step.icon className="w-5 h-5 md:w-7 md:h-7" strokeWidth={isActive ? 2.5 : 2} />
                                        )}

                                        {/* Pulse Effect for Active Step */}
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 rounded-2xl bg-amber-400 -z-10"
                                                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                        )}
                                    </motion.div>

                                    <div className={`absolute top-12 md:top-20 w-24 md:w-32 text-center transition-all duration-300 ${isActive ? 'translate-y-1' : ''}`}>
                                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest block mb-0.5 ${isActive ? 'text-amber-600' : isCompleted ? 'text-slate-600' : 'text-slate-300'
                                            }`}>
                                            Passo {step.id}
                                        </span>
                                        <span className={`text-xs md:text-sm font-bold ${isActive ? 'text-slate-800' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-3xl p-6 sm:p-10 border border-white mt-20"
            >
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
            </motion.div>
        </div>
    );
}
