import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Calendar,
    FileCheck,
    ArrowRight,
    Monitor,
    MapPin,
    Clock,
    Users,
    X,
    AlertTriangle
} from 'lucide-react';
import type { BookingData } from '../../pages/BookingWizard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { TermDocument } from '../TermDocument';
import { clsx } from 'clsx';

interface Step3Props {
    data: BookingData;
    updateData: (data: Partial<BookingData>) => void;
    onPrev: () => void;
}

export function Step3Confirmation({ data, updateData, onPrev }: Step3Props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (!data.termAccepted) {
            setError('Você precisa aceitar os termos para confirmar o agendamento.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const termDocument = {
                userName: data.full_name,
                userTotvs: data.totvs_number,
                unit: data.unit,
                local: data.local,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                equipments: data.equipments,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };

            const bookingsToInsert = data.equipments.map(eq => ({
                user_id: user?.id,
                unit: data.unit,
                local: data.local,
                booking_date: data.date,
                start_time: data.startTime,
                end_time: data.endTime,
                equipment_id: eq.id,
                quantity: eq.quantity,
                observations: data.observations,
                status: 'active',
                term_signed: true,
                term_document: termDocument
            }));

            const { error: insertError } = await supabase
                .from('bookings')
                .insert(bookingsToInsert);

            if (insertError) throw insertError;

            setShowSuccessModal(true);

        } catch (err: any) {
            console.error('Error creating booking:', err);
            setError('Erro ao salvar agendamento. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('term-preview-content');
        if (!element) return;

        // Clean filename: remove accents and special characters
        const safeTotvs = (data.totvs_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `TERMO_${safeTotvs}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
            margin: 10,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            const module = await import('html2pdf.js');
            const html2pdf = (module.default || module) as any;

            // RECONSTRUÇÃO: Gerar como DataURL para máxima estabilidade de nome
            const pdfDataUri = await html2pdf().set(opt).from(element).output('datauristring');

            if (!pdfDataUri || pdfDataUri.length < 100) {
                throw new Error('Falha ao gerar string do PDF');
            }

            // Disparo manual via link <a>
            const link = document.createElement('a');
            link.href = pdfDataUri;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            console.log('PDF download (Professor) iniciado via Base64:', fileName);

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
            }, 3000);
        } catch (e) {
            console.error('PDF Error:', e);
            alert('Erro ao gerar PDF. Tente novamente em alguns segundos.');
        }
    };

    const SuccessModal = () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"></div>

            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-50 mb-6 scale-110">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                        Tudo Pronto!
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed mb-8 px-4">
                        Seu agendamento foi realizado com sucesso. O termo de responsabilidade foi assinado digitalmente e está disponível em seu painel.
                    </p>

                    <div className="space-y-3 mb-8 text-center flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 min-w-[200px] justify-center">
                            <Calendar className="h-4 w-4 text-primary-600" />
                            <span className="text-sm font-bold text-gray-700">
                                {data.date.split('-').reverse().join('/')} • {data.startTime} - {data.endTime}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/teacher/bookings')}
                        className="w-full group flex items-center justify-center py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 transition-all active:scale-95"
                    >
                        Ver Meus Agendamentos
                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-[0.2em]">
                        Sistema de Agendamento • Colégio Objetivo
                    </p>
                </div>
            </div>
        </div>
    );

    const TermModal = () => (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setModalOpen(false)}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative z-50 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg">
                                <FileCheck className="h-5 w-5 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Termo de Responsabilidade</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownloadPDF}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-md transition-all"
                            >
                                Baixar PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-100 px-4 py-8 overflow-y-auto h-[70vh] flex justify-center">
                        <div className="bg-white shadow-2xl rounded-sm max-w-[210mm] w-full">
                            <TermDocument data={data} id="term-preview-content" />
                        </div>
                    </div>

                    <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="button"
                            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all"
                            onClick={() => setModalOpen(false)}
                        >
                            Fechar Visualização
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Confirme seu Agendamento</h2>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Professor Responsável</h3>
                            <div className="flex items-center gap-3 text-left">
                                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                    <Users className="h-5 w-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 leading-none">{data.full_name}</p>
                                    <p className="text-xs text-gray-500 mt-1">TOTVS: {data.totvs_number}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Data da Reserva</h3>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                    <Calendar className="h-5 w-5 text-primary-600" />
                                </div>
                                <p className="font-bold text-gray-900">{data.date.split('-').reverse().join('/')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Local e Unidade</h3>
                            <div className="flex items-center gap-3 text-left">
                                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 leading-none">{data.local}</p>
                                    <p className="text-xs text-gray-500 mt-1">Unidade: {data.unit}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Horário</h3>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                    <Clock className="h-5 w-5 text-primary-600" />
                                </div>
                                <p className="font-bold text-gray-900">{data.startTime} às {data.endTime}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                        <Monitor className="h-3 w-3 mr-2" />
                        Equipamentos Selecionados
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.equipments.map(eq => (
                            <div key={eq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">{eq.name}</p>
                                    <p className="text-[10px] font-bold text-primary-600 uppercase mt-0.5">{eq.brand} {eq.model}</p>
                                </div>
                                <span className="bg-white px-2.5 py-1 rounded-lg text-xs font-black text-gray-500 shadow-sm border border-gray-100">
                                    ×{eq.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1 text-left block">Observações (opcional)</label>
                <textarea
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    placeholder="Adicione observações importantes para a equipe técnica..."
                    value={data.observations || ''}
                    onChange={(e) => updateData({ observations: e.target.value })}
                />
            </div>

            <div className={clsx(
                "p-5 rounded-2xl transition-all border",
                data.termAccepted ? "bg-green-50 border-green-200" : "bg-primary-50 border-primary-100"
            )}>
                <div className="flex items-start text-left">
                    <div className="flex items-center h-6">
                        <input
                            id="term"
                            name="term"
                            type="checkbox"
                            required
                            checked={data.termAccepted}
                            onChange={(e) => updateData({ termAccepted: e.target.checked })}
                            className="h-5 w-5 text-primary-600 border-gray-300 rounded-lg focus:ring-primary-500 transition-all cursor-pointer"
                        />
                    </div>
                    <div className="ml-4 text-sm">
                        <label htmlFor="term" className="font-bold text-gray-900 cursor-pointer">
                            Aceito os Termos de Responsabilidade
                        </label>
                        <p className="text-gray-500 mt-1 leading-relaxed">
                            Confirmo que as informações estão corretas e assumo a responsabilidade pelo uso do material.
                            <button
                                type="button"
                                className="text-primary-600 hover:text-primary-700 font-bold ml-1.5 underline decoration-2 underline-offset-2"
                                onClick={() => setModalOpen(true)}
                            >
                                Visualizar Termo Completo
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm font-bold flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-3 shrink-0" />
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                    onClick={onPrev}
                    disabled={isSubmitting}
                    className="order-2 sm:order-1 flex-1 inline-flex items-center justify-center px-6 py-4 border border-gray-200 shadow-sm text-sm font-bold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="order-1 sm:order-2 flex-[2] inline-flex items-center justify-center px-8 py-4 border border-transparent shadow-xl shadow-green-200 text-sm font-black rounded-2xl text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50 active:scale-95"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                            Processando...
                        </>
                    ) : (
                        <>
                            <Check className="h-5 w-5 mr-2" />
                            Finalizar Agendamento
                        </>
                    )}
                </button>
            </div>

            {modalOpen && <TermModal />}
            {showSuccessModal && <SuccessModal />}
        </div>
    );
}
