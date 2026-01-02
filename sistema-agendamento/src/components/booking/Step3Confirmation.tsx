import { useState, useEffect } from 'react';
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
    AlertTriangle,
    Share2,
    Download,
    Laptop, Projector, Speaker, Camera, Mic, Smartphone, Tv, Plug
} from 'lucide-react';
import type { BookingData } from '../../pages/BookingWizard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { TermDocument } from '../TermDocument';
import { clsx } from 'clsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Pre-generate ID and Token for the preview
    useEffect(() => {
        if (!data.displayId || !data.verificationToken) {
            updateData({
                displayId: Math.floor(100000 + Math.random() * 900000).toString(),
                verificationToken: crypto.randomUUID()
            });
        }
    }, []);

    const handleConfirm = async () => {
        if (!data.termAccepted) {
            setError('Você precisa aceitar os termos para confirmar o agendamento.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const displayId = data.displayId || Math.floor(100000 + Math.random() * 900000).toString();
            const verificationToken = data.verificationToken || crypto.randomUUID();

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
                userAgent: navigator.userAgent,
                displayId,
                verificationToken
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
                term_document: termDocument,
                display_id: displayId,
                verification_token: verificationToken
            }));

            const { data: createdBookings, error: insertError } = await supabase
                .from('bookings')
                .insert(bookingsToInsert)
                .select();

            if (insertError) throw insertError;

            // Create Audit Log
            if (createdBookings && createdBookings.length > 0) {
                const logsPromises = createdBookings.map(b =>
                    supabase.from('audit_logs').insert({
                        booking_id: b.id,
                        action: 'CREATED',
                        performed_by: user?.id,
                        details: {
                            display_id: displayId,
                            unit: data.unit,
                            equipments: data.equipments.map(e => ({ name: e.name, qty: e.quantity }))
                        }
                    })
                );
                await Promise.all(logsPromises);
            }

            setShowSuccessModal(true);

        } catch (err: any) {
            console.error('Error creating booking:', err);
            setError('Erro ao salvar agendamento. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    const handlePdfAction = async (action: 'download' | 'share') => {
        const element = document.getElementById('term-preview-content');
        if (!element) return;

        setIsGeneratingPdf(true);

        const safeTotvs = (data.totvs_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `TERMO_${safeTotvs}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        try {
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

            if (action === 'share' && navigator.share) {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Termo de Responsabilidade',
                        text: 'Segue em anexo o Termo de Responsabilidade e Uso de Equipamento.'
                    });
                } catch (err) {
                    console.log('User cancelled share or share failed, falling back to download');
                    // Optional: fallback to download? for now just log
                }
            } else {
                // Download behavior (or fallback)
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

        } catch (e) {
            console.error('PDF Error:', e);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const getEquipmentIcon = (name: string = '') => {
        const n = name.toLowerCase();
        const baseClass = "h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors";

        if (n.includes('notebook') || n.includes('laptop') || n.includes('pc') || n.includes('computador')) return <Laptop className={baseClass} />;
        if (n.includes('projetor') || n.includes('datashow')) return <Projector className={baseClass} />;
        if (n.includes('caixa') || n.includes('som') || n.includes('audio')) return <Speaker className={baseClass} />;
        if (n.includes('camera') || n.includes('camara') || n.includes('foto')) return <Camera className={baseClass} />;
        if (n.includes('microfone') || n.includes('mic')) return <Mic className={baseClass} />;
        if (n.includes('tablet') || n.includes('ipad') || n.includes('celular')) return <Smartphone className={baseClass} />;
        if (n.includes('tv') || n.includes('televisao') || n.includes('monitor') || n.includes('tela')) return <Tv className={baseClass} />;
        if (n.includes('cabo') || n.includes('extensao') || n.includes('fio') || n.includes('adaptador')) return <Plug className={baseClass} />;
        return <Monitor className={baseClass} />;
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
            <div className="flex items-center justify-center min-h-screen px-0 pt-0 pb-0 sm:px-4 sm:pt-4 sm:pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setModalOpen(false)}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative z-50 inline-block align-bottom bg-white sm:rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl w-full h-full sm:h-auto flex flex-col max-h-[100vh] sm:max-h-[85vh]">
                    <div className="bg-white px-4 py-4 flex justify-between items-center border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-primary-50 rounded-lg shrink-0">
                                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Termo</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handlePdfAction('share')}
                                disabled={isGeneratingPdf}
                                className="inline-flex items-center px-3 py-2 border border-gray-200 text-xs font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
                            >
                                <Share2 className="h-4 w-4 mr-0 sm:mr-2 text-green-600" />
                                <span className="hidden sm:inline">{isGeneratingPdf ? '...' : 'WhatsApp'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePdfAction('download')}
                                disabled={isGeneratingPdf}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-md transition-all disabled:opacity-50"
                            >
                                <Download className="h-4 w-4 mr-0 sm:mr-2" />
                                <span className="hidden sm:inline">{isGeneratingPdf ? '...' : 'Baixar PDF'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-1"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-100 p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center min-h-0">
                        <div className="bg-white shadow-none sm:shadow-2xl mx-auto" style={{ maxWidth: '210mm' }}>
                            <div id="term-preview-content">
                                <TermDocument data={data} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
                        <button
                            type="button"
                            className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all"
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
                            <div key={eq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                        {getEquipmentIcon(eq.name)}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">{eq.name}</p>
                                        <p className="text-[10px] font-bold text-primary-600 uppercase mt-0.5">{eq.brand} {eq.model}</p>
                                    </div>
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
