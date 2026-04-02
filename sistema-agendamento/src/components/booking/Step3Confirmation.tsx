import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Calendar,
    Repeat,
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
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { TermDocument } from '../TermDocument';
import { clsx } from 'clsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { generateHash } from '../../utils/hash';
import { UNIT_LEGAL_NAMES } from '../../utils/constants';

interface Step3Props {
    cart: BookingData[];
    updateCartItem: (index: number, data: Partial<BookingData>) => void;
    onPrev: () => void;
}

export function Step3Confirmation({ cart, updateCartItem, onPrev }: Step3Props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const data = cart[0] || {} as BookingData;

    useEffect(() => {
        const setupCart = async () => {
            const { data: bookingTerm } = await supabase
                .from('legal_terms')
                .select('content, version_tag')
                .eq('type', 'booking')
                .order('created_at', { ascending: false })
                .limit(1).single();

            const { data: recurringTerm } = await supabase
                .from('legal_terms')
                .select('content, version_tag')
                .eq('type', 'recurring')
                .order('created_at', { ascending: false })
                .limit(1).single();

            cart.forEach((item, index) => {
                const isRec = item.isRecurring;
                const termToUse = isRec ? recurringTerm : bookingTerm;
                
                const updates: Partial<BookingData> = {};
                if (!item.displayId) {
                    updates.displayId = Math.floor(100000 + Math.random() * 900000).toString();
                }
                
                if (termToUse && (!item.term_document || item.term_document.version_tag !== termToUse.version_tag)) {
                    updates.version_tag = termToUse.version_tag;
                    updates.term_document = {
                        ...item.term_document,
                        content: termToUse.content,
                        version_tag: termToUse.version_tag
                    };
                }
                
                if (Object.keys(updates).length > 0) {
                    updateCartItem(index, updates);
                }
            });
        };
        setupCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const globalTermAccepted = cart.every(item => item.termAccepted === true);

    const handleToggleAllTerms = (accepted: boolean) => {
        cart.forEach((_, index) => {
            updateCartItem(index, { termAccepted: accepted });
        });
    };

    const handleConfirm = async () => {
        if (!globalTermAccepted) {
            setError('Você precisa aceitar os termos para confirmar todos os agendamentos.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Loop for each cart item
            for (const item of cart) {
                const displayId = item.displayId || Math.floor(100000 + Math.random() * 900000).toString();

                const { data: latestTerm } = await supabase
                    .from('legal_terms')
                    .select('content, version_tag')
                    .eq('type', item.isRecurring ? 'recurring' : 'booking')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                const termFingerprint = latestTerm ? await generateHash(latestTerm.content) : null;
                const versionTag = latestTerm?.version_tag || 'v1.0';

                const termDocument = {
                    userName: item.full_name,
                    userTotvs: item.totvs_number,
                    jobTitle: item.job_title || (user as any)?.job_title || 'Colaborador(a)',
                    legalName: UNIT_LEGAL_NAMES[item.unit] || 'SOCIEDADE INSTRUTIVA JOAQUIM NABUCO LTDA.',
                    unit: item.unit,
                    local: item.local,
                    date: item.isRecurring ? `Toda ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][item.dayOfWeek ?? 0]}` : item.date,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    equipments: item.equipments,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    displayId,
                    isRecurring: item.isRecurring,
                    dayOfWeek: item.dayOfWeek,
                    term_fingerprint: termFingerprint,
                    version_tag: versionTag,
                    content: latestTerm?.content
                };

                if (item.isRecurring) {
                    const { data: recurring, error: recError } = await supabase
                        .from('recurring_bookings')
                        .insert({
                            user_id: user?.id,
                            unit: item.unit,
                            local: item.local,
                            day_of_week: item.dayOfWeek,
                            start_time: item.startTime,
                            end_time: item.endTime,
                            equipments: item.equipments,
                            is_active: true,
                            last_generated_month: new Date().toISOString().substring(0, 7) + '-01'
                        })
                        .select()
                        .single();

                    if (recError) throw recError;

                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth();
                    const lastDay = new Date(year, month + 1, 0).getDate();
                    const bookingsToInsert: any[] = [];

                    for (let day = today.getDate(); day <= lastDay; day++) {
                        const date = new Date(year, month, day);
                        if (date.getDay() === item.dayOfWeek) {
                            const dateStr = date.toISOString().split('T')[0];

                            item.equipments.forEach(eq => {
                                bookingsToInsert.push({
                                    user_id: user?.id,
                                    unit: item.unit,
                                    local: item.local,
                                    booking_date: dateStr,
                                    start_time: item.startTime,
                                    end_time: item.endTime,
                                    equipment_id: eq.id,
                                    quantity: eq.quantity,
                                    observations: item.observations,
                                    status: 'active',
                                    term_signed: true,
                                    term_document: { ...termDocument, date: dateStr },
                                    display_id: displayId,
                                    is_recurring: true,
                                    recurring_id: recurring.id,
                                    term_hash: termFingerprint,
                                    term_version: versionTag
                                });
                            });
                        }
                    }

                    if (bookingsToInsert.length > 0) {
                        const { error: batchError } = await supabase
                            .from('bookings')
                            .insert(bookingsToInsert);

                        if (batchError) throw batchError;
                    }
                } else {
                    const bookingsToInsert = item.equipments.map(eq => ({
                        user_id: user?.id,
                        unit: item.unit,
                        local: item.local,
                        booking_date: item.date,
                        start_time: item.startTime,
                        end_time: item.endTime,
                        equipment_id: eq.id,
                        quantity: eq.quantity,
                        observations: item.observations,
                        status: 'active',
                        term_signed: true,
                        term_document: termDocument,
                        display_id: displayId,
                        term_hash: termFingerprint,
                        term_version: versionTag
                    }));

                    const { error: insertError } = await supabase
                        .from('bookings')
                        .insert(bookingsToInsert);

                    if (insertError) throw insertError;
                }


                // 3. PWA Push Notification (OneSignal API) for Admin Users
                try {
                    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
                    const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;
                    if (appId && apiKey) {
                        const firstName = item.full_name.split(' ')[0];
                        const lastName = item.full_name.split(' ').slice(-1)[0];
                        const professorName = `${firstName} ${lastName}`;
                        const bookingDate = item.isRecurring ? null : item.date;
                        const dateFormatted = item.isRecurring 
                            ? `toda ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][item.dayOfWeek ?? 0]}`
                            : item.date.split('-').reverse().join('/');
                        const equipmentNames = item.equipments.map(eq => eq.name).join(', ');
                        const timeRange = `${item.startTime} - ${item.endTime}`;

                        const headers = {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Authorization': `Basic ${apiKey}`
                        };

                        const unitFilter = [
                            { "field": "tag", "key": "unit", "relation": "=", "value": item.unit }
                        ];
                        
                        const heading = `📋 Novo Agendamento`;
                        const message = `Prof. ${professorName} agendou ${equipmentNames} em ${item.local} para ${dateFormatted} (${timeRange}).`;
                        
                        const targetPayload = {
                            app_id: appId,
                            filters: unitFilter,
                            headings: { "en": heading, "pt": heading },
                            contents: { "en": message, "pt": message },
                            priority: 10,
                        };

                        console.log("[Push] Sending immediate notification:", JSON.stringify(targetPayload));

                        fetch('https://onesignal.com/api/v1/notifications', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(targetPayload)
                        }).then(async (res) => {
                            const txt = await res.text();
                            console.log("[Push] Immediate response:", res.status, txt);
                        }).catch(console.error);

                        if (bookingDate && item.startTime) {
                            const [hours, minutes] = item.startTime.split(':').map(Number);
                            const reminderDate = new Date(`${bookingDate}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`);
                            reminderDate.setMinutes(reminderDate.getMinutes() - 10);

                            const now = new Date();
                            if (reminderDate.getTime() > now.getTime() + 60000) {
                                const sendAfter = reminderDate.toISOString();
                                const reminderHeading = `⏰ Agendamento em 10 min`;
                                const reminderMessage = `Faltam 10 minutos para iniciar o agendamento de ${equipmentNames} na Sala ${item.local}.`;

                                const reminderPayload = {
                                    app_id: appId,
                                    filters: unitFilter,
                                    headings: { "en": reminderHeading, "pt": reminderHeading },
                                    contents: { "en": reminderMessage, "pt": reminderMessage },
                                    send_after: sendAfter,
                                    priority: 10,
                                    android_sound: "alarm",
                                    ios_sound: "alarm.caf",
                                };

                                fetch('https://onesignal.com/api/v1/notifications', {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify(reminderPayload)
                                }).then(async (res) => {
                                    const txt = await res.text();
                                    try {
                                        const result = JSON.parse(txt);
                                        if (result.id) {
                                            await supabase.from('bookings').update({ onesignal_id: result.id }).eq('display_id', displayId);
                                        }
                                    } catch (e) { /* ignore */ }
                                }).catch(console.error);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Push API Error:", e);
                }
            } // Fechar o FOR LOOP aqui!

            setShowSuccessModal(true);

        } catch (err: any) {
            console.error('CRITICAL: Error creating booking:', err);
            const errorMessage = err.message || 'Erro ao salvar agendamento. Tente novamente.';
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    const handlePdfAction = (action: 'download' | 'share') => {
        const element = document.getElementById('term-doc-inner');
        if (!element) return;

        setIsGeneratingPdf(true);

        const safeTotvs = (data.totvs_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `TERMO_${safeTotvs}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
            margin: [5, 0, 5, 0] as [number, number, number, number],
            filename: fileName,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 1.5,
                useCORS: true,
                windowWidth: 800,
            },
            pagebreak: { mode: ['css', 'legacy'] },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        html2pdf()
            .set(opt)
            .from(element)
            .outputPdf('blob')
            .then((pdfBlob: Blob) => {
                if (action === 'share' && navigator.share) {
                    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                    navigator.share({
                        files: [file],
                        title: 'Termo de Responsabilidade',
                        text: 'Segue em anexo o Termo de Responsabilidade e Uso de Equipamento.'
                    }).catch(() => {});
                } else {
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    // Retain URL cleanup for safety
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                }
            })
            .catch((e: Error | any) => {
                console.error('PDF Worker Issue:', e);
                alert("ERRO DETALHADO DO PDF:\n" + (e.stack || e.message || JSON.stringify(e)));
            })
            .finally(() => {
                setIsGeneratingPdf(false);
                // Hard cleanup for html2pdf injected overlays
                setTimeout(() => {
                    document.querySelectorAll('.html2canvas-container, .html2pdf__container').forEach(el => el.remove());
                }, 500);
            });
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



    const SuccessModal = () => {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
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
                            {cart.map((c, idx) => (
                                <div key={idx} className="inline-flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 min-w-[200px] justify-center mb-1 w-full text-left">
                                    {c.isRecurring ? (
                                        <>
                                            <Repeat className="h-4 w-4 text-primary-600 shrink-0" />
                                            <span className="text-xs font-bold text-gray-700">
                                                <span className="text-primary-600">{c.local}</span>: Fixo {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][c.dayOfWeek ?? 0]} • {c.startTime}-{c.endTime}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="h-4 w-4 text-primary-600 shrink-0" />
                                            <span className="text-xs font-bold text-gray-700">
                                                <span className="text-primary-600">{c.local}</span>: {c.date ? c.date.split('-').reverse().join('/') : ''} • {c.startTime}-{c.endTime}
                                            </span>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/teacher/my-bookings')}
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
            </div>,
            document.body
        );
    };

    const TermModal = () => createPortal(
        <div className="fixed inset-0 z-[9999] block sm:flex sm:items-center sm:justify-center p-0 sm:p-4 md:p-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative z-50 flex flex-col w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[85vh] bg-white sm:rounded-[2.5rem] text-left overflow-hidden shadow-2xl transition-all">
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

                <div className="bg-gray-50/50 p-2 sm:p-8 overflow-auto flex-1 min-h-0 w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* The wrapper allows native scrolling while zoom scales it to fit reasonably on mobile screens */}
                    <div className="mx-auto w-full max-sm:[zoom:0.50]">
                        <div id="term-doc-inner" style={{ margin: '0 auto', width: '100%', maxWidth: '56rem', minWidth: '800px' }}>
                            {cart.map((c, idx) => (
                                <div key={idx} style={{ 
                                    pageBreakInside: 'avoid', 
                                    breakInside: 'avoid',
                                    pageBreakBefore: idx > 0 ? 'always' : 'auto',
                                    breakBefore: idx > 0 ? 'page' : 'auto',
                                    paddingTop: idx > 0 ? '5mm' : '0' 
                                }}>
                                    <TermDocument
                                        data={{
                                            ...c,
                                            term_hash: c.term_document?.term_fingerprint || c.term_hash,
                                            version_tag: c.term_document?.version_tag || c.version_tag || 'v2.0'
                                        }}
                                    />
                                </div>
                            ))}
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
        </div>,
        document.body
    );

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Confirme seus Agendamentos</h2>

            <div className="space-y-4">
                {cart.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative">
                        {cart.length > 1 && (
                            <div className="absolute top-4 right-4 bg-primary-100 text-primary-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                Sala {idx + 1} de {cart.length}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Professor Responsável</h3>
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                            <Users className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-none">{item.full_name}</p>
                                            <p className="text-xs text-gray-500 mt-1">TOTVS: {item.totvs_number}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Data da Reserva</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                            {item.isRecurring ? <Repeat className="h-5 w-5 text-primary-600" /> : <Calendar className="h-5 w-5 text-primary-600" />}
                                        </div>
                                        <p className="font-bold text-gray-900">
                                            {item.isRecurring
                                                ? `Toda ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][item.dayOfWeek ?? 0]}`
                                                : (item.date ? item.date.split('-').reverse().join('/') : 'Data não informada')
                                            }
                                        </p>
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
                                            <p className="font-bold text-gray-900 leading-none">{item.local}</p>
                                            <p className="text-xs text-gray-500 mt-1">Unidade: {item.unit}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Horário</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                            <Clock className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <p className="font-bold text-gray-900">{item.startTime} às {item.endTime}</p>
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
                                {item.equipments.map(eq => (
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
                ))}
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1 text-left block">Observações (opcional)</label>
                <textarea
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    placeholder="Adicione observações importantes para a equipe técnica..."
                    value={data.observations || ''}
                    onChange={(e) => {
                        cart.forEach((_, idx) => {
                            updateCartItem(idx, { observations: e.target.value });
                        });
                    }}
                />
            </div>

            <div className={clsx(
                "p-5 rounded-2xl transition-all border",
                globalTermAccepted ? "bg-green-50 border-green-200" : "bg-primary-50 border-primary-100"
            )}>
                <div className="flex items-start text-left">
                    <div className="flex items-center h-6">
                        <input
                            id="term"
                            name="term"
                            type="checkbox"
                            required
                            checked={globalTermAccepted}
                            onChange={(e) => handleToggleAllTerms(e.target.checked)}
                            className="h-5 w-5 text-primary-600 border-gray-300 rounded-lg focus:ring-primary-500 transition-all cursor-pointer"
                        />
                    </div>
                    <div className="ml-4 text-sm">
                        <label htmlFor="term" className="font-bold text-gray-900 cursor-pointer">
                            Aceito os Termos de Responsabilidade para {cart.length > 1 ? `as ${cart.length} salas` : 'a sala selecionada'}
                        </label>
                        <p className="text-gray-500 mt-1 leading-relaxed">
                            Confirmo que as informações estão corretas e assumo a responsabilidade pelo uso do material em cada ambiente.
                            <button
                                type="button"
                                className="text-primary-600 hover:text-primary-700 font-bold ml-1.5 underline decoration-2 underline-offset-2"
                                onClick={() => setModalOpen(true)}
                            >
                                Visualizar {cart.length > 1 ? 'Termos Completos' : 'Termo Completo'}
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
