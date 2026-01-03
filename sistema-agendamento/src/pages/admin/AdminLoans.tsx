import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Equipment, EquipmentLoan, Admin } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus,
    Search,
    Info,
    CheckCircle2,
    History,
    ClipboardCheck,
    Hash,
    ChevronDown,
    Printer,
    FileText,
    Download,
    User,
    Briefcase,
    MapPin,
    PackageSearch,
    X,
    Clock,
    Calendar,
    AlertCircle,
    Eye,
    Trash2
} from 'lucide-react';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { clsx } from 'clsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { Loader2, Upload } from 'lucide-react';

const BUCKET_NAME = 'manual-terms';

// --- Custom Professional Modal Component ---
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: any) => (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <AnimatePresence>
            {isOpen && (
                <Dialog.Portal forceMount>
                    <Dialog.Overlay asChild>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-primary-900/60 backdrop-blur-md z-[100]"
                        />
                    </Dialog.Overlay>
                    <Dialog.Content asChild>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={clsx(
                                "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] bg-white rounded-[2.5rem] shadow-2xl p-8 z-[101] outline-none overflow-hidden",
                                maxWidth
                            )}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <Dialog.Title className="text-xl font-black text-gray-900">{title}</Dialog.Title>
                                <Dialog.Close asChild>
                                    <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <X className="h-5 w-5 text-gray-400" />
                                    </button>
                                </Dialog.Close>
                            </div>
                            {children}
                        </motion.div>
                    </Dialog.Content>
                </Dialog.Portal>
            )}
        </AnimatePresence>
    </Dialog.Root>
);

export function AdminLoans() {
    const { user } = useAuth();
    const adminUser = user as Admin;

    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loans, setLoans] = useState<EquipmentLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingLoanId, setUploadingLoanId] = useState<string | null>(null);

    // Modal States
    const [modalInfo, setModalInfo] = useState<{ type: 'success' | 'error' | 'preview' | 'delete' | 'return', message?: string, loanData?: any } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        user_full_name: '',
        user_role: '',
        location: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        equipment_id: '',
        quantity: 1,
        asset_numbers: [''], // Multiple asset numbers
        cpf: ''
    });

    const fetchLoans = async () => {
        if (!adminUser?.unit) return;
        const { data, error } = await supabase
            .from('equipment_loans')
            .select('*, equipment (*)')
            .eq('unit', adminUser.unit)
            .order('created_at', { ascending: false });
        if (!error && data) setLoans(data as EquipmentLoan[]);
    };

    const fetchEquipment = async () => {
        if (!adminUser?.unit) return;
        const { data, error } = await supabase
            .from('equipment')
            .select('*')
            .eq('unit', adminUser.unit)
            .gt('total_quantity', 0)
            .order('name');
        if (!error && data) setEquipmentList(data as Equipment[]);
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchLoans(), fetchEquipment()]).finally(() => setLoading(false));
    }, [adminUser?.unit]);

    // Handle PDF Preview URL generation
    useEffect(() => {
        if (modalInfo?.type === 'preview' && modalInfo.loanData) {
            const generatePreview = async () => {
                try {
                    const blob = await generatePDF(modalInfo.loanData, false);
                    if (blob instanceof Blob) {
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                    }
                } catch (err) {
                    console.error('Preview error:', err);
                }
            };
            generatePreview();
        } else {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        }
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [modalInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAssetChange = (index: number, value: string) => {
        const newAssets = [...formData.asset_numbers];
        newAssets[index] = value;
        setFormData(prev => ({ ...prev, asset_numbers: newAssets }));
    };

    const addAssetField = () => {
        setFormData(prev => ({ ...prev, asset_numbers: [...prev.asset_numbers, ''] }));
    };

    const removeAssetField = (index: number) => {
        if (formData.asset_numbers.length <= 1) return;
        const newAssets = formData.asset_numbers.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, asset_numbers: newAssets }));
    };


    const validateForm = () => {
        const startStr = `${formData.start_date}T${formData.start_time}`;
        const endStr = `${formData.end_date}T${formData.end_time}`;

        if (!formData.user_full_name || !formData.user_role || !formData.location ||
            !formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time ||
            !formData.equipment_id || formData.asset_numbers.some(a => !a.trim()) || formData.quantity < 1) {
            setModalInfo({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios e todos os números de patrimônio.' });
            return false;
        }

        if (formData.asset_numbers.length < formData.quantity) {
            setModalInfo({ type: 'error', message: `Informe pelo menos ${formData.quantity} números de patrimônio.` });
            return false;
        }

        const start = parseISO(startStr);
        const end = parseISO(endStr);
        const today = startOfToday();

        if (isBefore(start, today)) {
            setModalInfo({ type: 'error', message: 'A data de início não pode ser no passado.' });
            return false;
        }

        if (isBefore(end, start)) {
            setModalInfo({ type: 'error', message: 'A data de término deve ser após a data de início.' });
            return false;
        }

        const selectedEq = equipmentList.find(e => e.id === formData.equipment_id);
        if (selectedEq && formData.quantity > selectedEq.total_quantity) {
            setModalInfo({ type: 'error', message: `Quantidade indisponível. Máximo disponível: ${selectedEq.total_quantity}` });
            return false;
        }

        return true;
    };

    const handleGenerateLoan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Fix: Explicitly append Brasilia offset (UTC-3) to local strings
            const startStr = `${formData.start_date}T${formData.start_time}:00-03:00`;
            const endStr = `${formData.end_date}T${formData.end_time}:00-03:00`;

            const { data: loanData, error: loanError } = await supabase
                .from('equipment_loans')
                .insert([{
                    user_full_name: formData.user_full_name,
                    user_role: formData.user_role,
                    location: formData.location,
                    start_at: startStr,
                    end_at: endStr,
                    equipment_id: formData.equipment_id,
                    quantity: formData.quantity,
                    asset_number: formData.asset_numbers.join(', '),
                    cpf: formData.cpf,
                    unit: adminUser.unit,
                    status: 'active'
                }])
                .select()
                .single();

            if (loanError) throw loanError;

            const selectedEq = equipmentList.find(e => e.id === formData.equipment_id);
            if (!selectedEq) throw new Error('Equipamento não encontrado');

            const { error: updateError } = await supabase
                .from('equipment')
                .update({ total_quantity: selectedEq.total_quantity - formData.quantity })
                .eq('id', selectedEq.id);

            if (updateError) throw updateError;

            await fetchLoans();
            await fetchEquipment();

            setFormData({
                user_full_name: '',
                user_role: '',
                location: '',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                start_time: format(new Date(), 'HH:mm'),
                end_date: format(new Date(), 'yyyy-MM-dd'),
                end_time: format(new Date(), 'HH:mm'),
                equipment_id: '',
                quantity: 1,
                asset_numbers: [''],
                cpf: ''
            });

            // Open Preview Modal
            setModalInfo({ type: 'preview', loanData: { ...loanData, equipment: selectedEq } });

        } catch (error: any) {
            console.error('Loan error:', error);
            setModalInfo({ type: 'error', message: `Erro ao processar empréstimo: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturn = async (loan: EquipmentLoan) => {
        try {
            const { error: loanError } = await supabase
                .from('equipment_loans')
                .update({ status: 'returned', updated_at: new Date().toISOString() })
                .eq('id', loan.id);
            if (loanError) throw loanError;

            const { data: eqData, error: eqFetchError } = await supabase
                .from('equipment')
                .select('total_quantity, id')
                .eq('id', loan.equipment_id)
                .single();
            if (eqFetchError) throw eqFetchError;

            const { error: updateError } = await supabase
                .from('equipment')
                .update({ total_quantity: eqData.total_quantity + loan.quantity })
                .eq('id', eqData.id);
            if (updateError) throw updateError;

            await fetchLoans();
            await fetchEquipment();
            setModalInfo({ type: 'success', message: 'Equipamento devolvido ao inventário com sucesso!' });
        } catch (error: any) {
            setModalInfo({ type: 'error', message: `Erro ao processar devolução: ${error.message}` });
        }
    };

    const handleDeleteLoan = async (loan: EquipmentLoan) => {
        try {
            // 1. Delete file from Storage if exists
            if (loan.manual_term_url) {
                const fileKey = loan.manual_term_url.split('/').pop();
                if (fileKey) {
                    const { error: storageError } = await supabase
                        .storage
                        .from(BUCKET_NAME)
                        .remove([fileKey]);

                    if (storageError) console.error('Error deleting file:', storageError);
                }
            }

            // 2. If loan is active, restore inventory
            if (loan.status === 'active') {
                const { data: eqData, error: eqFetchError } = await supabase
                    .from('equipment')
                    .select('total_quantity, id')
                    .eq('id', loan.equipment_id)
                    .single();

                if (!eqFetchError && eqData) {
                    await supabase
                        .from('equipment')
                        .update({ total_quantity: (eqData.total_quantity || 0) + loan.quantity })
                        .eq('id', eqData.id);
                }
            }

            // 3. Delete from DB
            const { error } = await supabase
                .from('equipment_loans')
                .delete()
                .eq('id', loan.id);

            if (error) throw error;

            await fetchLoans();
            await fetchEquipment();
            setModalInfo({ type: 'success', message: 'Registro excluído permanentemente.' });
        } catch (error: any) {
            setModalInfo({ type: 'error', message: `Erro ao excluir: ${error.message}` });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, loanId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // USER ORDER: Only images (png, jpg, jpeg)
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            alert('Apenas imagens (PNG, JPG, JPEG) são permitidas.');
            return;
        }

        setUploadingLoanId(loanId);

        try {
            // 1. Compress image (Max 1MB as per USER ORDER)
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: file.type as any
            };
            const compressedFile = await imageCompression(file, options);

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `loan-term-${loanId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 3. Update Database
            const { error: updateError } = await supabase
                .from('equipment_loans')
                .update({ manual_term_url: fileName })
                .eq('id', loanId);

            if (updateError) throw updateError;

            fetchLoans();
            alert('Termo assinado enviado com sucesso!');
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Erro ao realizar upload: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setUploadingLoanId(null);
        }
    };

    const handleViewManualTerm = async (fileKey: string) => {
        // Open window immediately to avoid popup blockers, especially on mobile
        const newWindow = window.open('', '_blank');

        // Optional: specific visual feedback in the new tab while loading
        if (newWindow) {
            newWindow.document.write(`
                <html>
                    <head><title>Carregando...</title></head>
                    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f9fafb;">
                        <div style="text-align: center;">
                            <div style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top: 3px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                            <p style="color: #6b7280;">Carregando documento seguro...</p>
                            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                        </div>
                    </body>
                </html>
            `);
        }

        try {
            // Extract filename if it's a full path, though we store filename
            const cleanKey = fileKey.split('/').pop() || fileKey;

            const { data, error } = await supabase
                .storage
                .from(BUCKET_NAME)
                .createSignedUrl(cleanKey, 3600); // 1 hour

            if (error) throw error;
            if (data?.signedUrl) {
                if (newWindow) {
                    newWindow.location.href = data.signedUrl;
                } else {
                    // Fallback if window failed to open
                    window.location.href = data.signedUrl;
                }
            } else {
                throw new Error('URL assinada não retornada.');
            }
        } catch (error: any) {
            console.error('Error generating signed URL:', error);
            newWindow?.close();
            setModalInfo({ type: 'error', message: 'Erro ao abrir o termo. Tente novamente.' });
        }
    };

    const generatePDF = (loan: EquipmentLoan, download = true) => {
        const element = document.createElement('div');
        element.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; line-height: 1.3; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 12px;">
                    <img src="${window.location.origin}/logo-objetivo.jpg" style="max-height: 85px; width: auto; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none'" />
                    <h1 style="color: #3D52A0; margin: 0; font-size: 18px; text-transform: uppercase;">TERMO DE EMPRÉSTIMO E RESPONSABILIDADE</h1>
                </div>

                <div style="margin-bottom: 10px; background: #fdfdfd; padding: 10px 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h3 style="margin-top: 0; margin-bottom: 6px; color: #3D52A0; font-size: 14.5px; display: inline-block;">DADOS DO EMPRÉSTIMO</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr><td style="padding: 0.5px 0; width: 35%;"><strong>Unidade:</strong></td><td>${loan.unit}</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Solicitante:</strong></td><td>${loan.user_full_name}</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Cargo:</strong></td><td>${loan.user_role}</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Equipamento:</strong></td><td>${loan.equipment?.name || 'N/A'}</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Quantidade:</strong></td><td>${loan.quantity} unidade(s)</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Nº Patrimônio:</strong></td><td>${loan.asset_number}</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Local de Uso:</strong></td><td>${loan.location}</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Início:</strong></td><td>${format(parseISO(loan.start_at), "dd/MM/yyyy 'às' HH:mm")}</td></tr>
                        <tr><td style="padding: 0.5px 0;"><strong>Previsão de Término:</strong></td><td>${format(parseISO(loan.end_at), "dd/MM/yyyy 'às' HH:mm")}</td></tr>
                    </table>
                </div>

                <div style="margin-bottom: 12px;">
                    <h3 style="color: #3D52A0; font-size: 17px; margin-bottom: 4px; padding-bottom: 2px;">TERMO DE RESPONSABILIDADE</h3>
                    <p style="font-size: 15px; text-align: justify; margin: 0 0 6px 0;">
                        Pelo presente Termo de Responsabilidade, o solicitante acima identificado declara ter recebido da Instituição de Ensino (Objetivo - Unidade ${loan.unit}) os equipamentos acima descritos em perfeito estado de conservação e funcionamento.
                    </p>
                    <p style="font-size: 15px; text-align: justify; margin: 0 0 8px 0;">
                        O solicitante assume total responsabilidade pela guarda, conservação e correta utilização dos mesmos, comprometendo-se a:
                    </p>
                    <div style="font-size: 14px; line-height: 1.5;">
                        1. Zelar pela integridade física do equipamento;<br/>
                        2. Utilizá-lo exclusivamente para fins pedagógicos/institucionais no local indicado;<br/>
                        3. Efetuar a devolução rigorosamente no prazo estipulado;<br/>
                        4. Comunicar imediatamente à administração qualquer avaria, perda ou extravio;<br/>
                        5. Arcar com os custos de reparo ou reposição em caso de danos decorrentes de mau uso, negligência ou imperícia.
                    </div>
                </div>

                <div style="margin-top: 70px; display: flex; justify-content: space-between; gap: 50px;">
                    <div style="width: 45%; text-align: center;">
                        <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 12.5px;">
                            <strong>${loan.user_full_name}</strong><br/>
                            <span>Solicitante</span>
                        </div>
                    </div>
                    <div style="width: 45%; text-align: center;">
                        <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 12.5px;">
                            <strong>EDUCAÇÃO DIGITAL</strong><br/>
                            <span>Entrega</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 35px; text-align: left; font-size: 13.5px; margin-left: 20px;">
                    CPF: ___________________________
                    <br/><span style="font-size: 10.5px; color: #888;">(Preencher à mão)</span>
                </div>

                <div style="margin-top: 25px; text-align: center; font-size: 9px; color: #999; border-top: 1px dashed #eee; padding-top: 5px;">
                    Documento emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                </div>
            </div>
        `;

        const opt = {
            margin: 10,
            filename: `TERMO_EMPRESTIMO_${loan.user_full_name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (download) {
            // @ts-ignore
            html2pdf().set(opt).from(element).save();
        } else {
            // @ts-ignore
            return html2pdf().set(opt).from(element).outputPdf('blob');
        }
    };

    const filteredLoans = loans.filter(l =>
        l.user_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.asset_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Empréstimos</h1>
                    <div className="inline-flex items-center px-3 py-1 bg-amber-50 border border-amber-100 rounded-xl">
                        <ClipboardCheck className="h-4 w-4 text-amber-600 mr-2" />
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Gestão de Equipe & Terceiros</span>
                    </div>
                </div>
            </div>

            {/* Warning Message */}
            <div className="bg-white rounded-[2rem] p-8 border border-amber-100 shadow-sm shadow-amber-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <FileText className="h-32 w-32" />
                </div>
                <div className="flex gap-4 items-start relative z-10">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                        <Info className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Orientações de Empréstimo</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Ao registrar um empréstimo, o sistema gerará automaticamente um <span className="text-gray-900 font-bold">Termo de Responsabilidade</span> personalizado para impressão.
                            <br /><br />
                            Você poderá <span className="text-gray-900 font-bold">anexar o termo assinado</span> pelo usuário diretamente no card do empréstimo.
                            <br /><br />
                            <span className="text-amber-700 font-bold underline">Atenção:</span> A quantidade de itens emprestados será <span className="font-bold">removida temporariamente</span> do inventário geral. Ao excluir um registro de empréstimo, o termo assinado anexado também será <span className="text-red-600 font-bold">excluído permanentemente</span>.
                            <br /><br />
                            <span className="text-gray-900 font-bold">Formatos aceitos:</span> JPG e PNG. <span className="text-gray-600 italic">Prefira fotos claras e legíveis.</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Form Section */}
                <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                        <Plus className="h-5 w-5 mr-2 text-primary-600" />
                        Novo Empréstimo
                    </h3>

                    <form onSubmit={handleGenerateLoan} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidade</label>
                            <input
                                type="text"
                                disabled
                                value={adminUser?.unit || ''}
                                className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo *</label>
                            <input
                                type="text"
                                name="user_full_name"
                                required
                                value={formData.user_full_name}
                                onChange={handleInputChange}
                                className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                placeholder="Nome do solicitante"
                            />
                        </div>

                        <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo *</label>
                                <input
                                    type="text"
                                    name="user_role"
                                    required
                                    value={formData.user_role}
                                    onChange={handleInputChange}
                                    className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    placeholder="Cargo"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Local de Uso *</label>
                                <input
                                    type="text"
                                    name="location"
                                    required
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                    placeholder="Local"
                                />
                            </div>
                        </div>

                        {/* Split Date and Time - Start */}
                        <div className="bg-gray-50/50 p-4 rounded-[2rem] border border-gray-100 space-y-3">
                            <label className="text-[10px] font-black text-primary-600 uppercase tracking-widest ml-1 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" /> Início do Empréstimo
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        className="block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-primary-100 focus:bg-white rounded-xl text-[12px] font-bold outline-none transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type="time"
                                        name="start_time"
                                        value={formData.start_time}
                                        onChange={handleInputChange}
                                        className="block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-primary-100 focus:bg-white rounded-xl text-[12px] font-bold outline-none transition-all"
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Split Date and Time - End */}
                        <div className="bg-gray-50/50 p-4 rounded-[2rem] border border-gray-100 space-y-3">
                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1 flex items-center">
                                <Clock className="h-3 w-3 mr-1" /> Previsão de Devolução
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        className="block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-primary-100 focus:bg-white rounded-xl text-[12px] font-bold outline-none transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type="time"
                                        name="end_time"
                                        value={formData.end_time}
                                        onChange={handleInputChange}
                                        className="block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-primary-100 focus:bg-white rounded-xl text-[12px] font-bold outline-none transition-all"
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Equipamento *</label>
                            <div className="relative">
                                <select
                                    name="equipment_id"
                                    required
                                    value={formData.equipment_id}
                                    onChange={handleInputChange}
                                    className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none appearance-none"
                                >
                                    <option value="">Selecione um item...</option>
                                    {equipmentList.map(eq => (
                                        <option key={eq.id} value={eq.id}>
                                            {eq.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade *</label>
                            <input
                                type="number"
                                name="quantity"
                                required
                                min="1"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                            />
                        </div>

                        {/* Dynamic Asset Numbers */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Números de Patrimônio *</label>
                                <button
                                    type="button"
                                    onClick={addAssetField}
                                    className="text-[9px] font-black text-primary-600 uppercase hover:underline"
                                >
                                    + Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.asset_numbers.map((asset, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                required
                                                value={asset}
                                                onChange={(e) => handleAssetChange(index, e.target.value)}
                                                className="block w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-xl text-sm font-bold transition-all outline-none"
                                                placeholder={`Patrimônio ${index + 1} `}
                                            />
                                            <Hash className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-200" />
                                        </div>
                                        {formData.asset_numbers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeAssetField(index)}
                                                className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {formData.asset_numbers.length < formData.quantity && (
                                <p className="text-[9px] text-amber-600 font-bold">
                                    Atenção: Informe pelo menos {formData.quantity} patrimônios.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF (Opcional)</label>
                            <input
                                type="text"
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleInputChange}
                                className="block w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                placeholder="Vazio ou opcional"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 transition-all active:scale-95 disabled:opacity-50 mt-4"
                        >
                            <Printer className="h-5 w-5 mr-3" />
                            {isSubmitting ? 'Gerando...' : 'Gerar Termo de Empréstimo'}
                        </button>
                    </form>
                </div>

                {/* History Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center p-4 gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar por nome ou patrimônio..."
                                className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-100 lg:text-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 rounded-2xl">
                            <History className="h-4 w-4 text-primary-600" />
                            <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">Histórico de Empréstimos</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando registros...</span>
                            </div>
                        ) : filteredLoans.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                                <PackageSearch className="mx-auto h-16 w-16 text-gray-100 mb-4" />
                                <h3 className="text-lg font-black text-gray-900">Nenhum empréstimo ativo</h3>
                                <p className="text-gray-400 text-sm">Os registros aparecerão aqui conforme forem gerados.</p>
                            </div>
                        ) : (
                            filteredLoans.map(loan => (
                                <div key={loan.id} className={clsx(
                                    "group bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300",
                                    loan.status === 'active' ? "p-7" : "p-5 opacity-90 hover:opacity-100" // Compact padding for inactive
                                )}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={clsx(
                                                "p-4 rounded-2xl shrink-0 transition-colors",
                                                loan.status === 'active' ? "bg-amber-50 group-hover:bg-amber-600" : "bg-green-50 group-hover:bg-green-600"
                                            )}>
                                                <User className={clsx(
                                                    "h-6 w-6 transition-colors",
                                                    loan.status === 'active' ? "text-amber-600 group-hover:text-white" : "text-green-600 group-hover:text-white"
                                                )} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors">{loan.user_full_name}</h4>
                                                    <span className={clsx(
                                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                        loan.status === 'active' ? "text-amber-600 bg-amber-50 border-amber-100" : "text-green-600 bg-green-50 border-green-100"
                                                    )}>
                                                        {loan.status === 'active' ? 'Em Aberto' : 'Devolvido'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-bold">
                                                    <span className="flex items-center">
                                                        <Briefcase className="h-3 w-3 mr-1" /> {loan.user_role}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <MapPin className="h-3 w-3 mr-1" /> {loan.location}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-2">
                                                    <span className="flex items-center">
                                                        <Hash className="h-3 w-3 mr-1" /> PAT: {loan.asset_number}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <FileText className="h-3 w-3 mr-1" /> {loan.equipment?.name || 'Item Removido'} ({loan.quantity} unid.)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={clsx(
                                            "flex flex-col gap-4 shrink-0 transition-all duration-300",
                                            loan.status === 'active' ? "min-w-[320px] md:min-w-[400px]" : "min-w-[200px] md:min-w-[250px]"
                                        )}>
                                            <div className="flex gap-2 text-[11px] font-black bg-gray-50 rounded-xl p-3 border border-gray-100 justify-between">
                                                <div className="flex flex-col border-r border-gray-200 pr-4">
                                                    <span className="text-gray-400 uppercase tracking-widest text-[8px] mb-1">Início</span>
                                                    <span>{format(parseISO(loan.start_at), "dd/MM/yy HH:mm")}</span>
                                                </div>
                                                <div className="flex flex-col pl-1">
                                                    <span className="text-gray-400 uppercase tracking-widest text-[8px] mb-1">Término</span>
                                                    <span>{format(parseISO(loan.end_at), "dd/MM/yy HH:mm")}</span>
                                                </div>
                                            </div>

                                            {/* Smart Action Layout: Grid for Active, Flex/Compact for Inactive */}
                                            <div className={clsx(
                                                "gap-3 transition-all",
                                                loan.status === 'active' ? "grid grid-cols-2" : "flex flex-col"
                                            )}>
                                                {/* Group 1: Documents */}
                                                <div className={clsx("flex gap-2", loan.status !== 'active' && "flex-row")}>
                                                    <button
                                                        onClick={() => setModalInfo({ type: 'preview', loanData: loan })}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-white border border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                                                        title="Ver Termo para Impressão"
                                                    >
                                                        <FileText className="h-4 w-4" /> {loan.status !== 'active' && "Termo"}
                                                    </button>

                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            id={`upload-${loan.id}`}
                                                            className="hidden"
                                                            accept="image/png, image/jpeg, image/jpg"
                                                            onChange={(e) => handleFileUpload(e, loan.id)}
                                                            disabled={uploadingLoanId === loan.id}
                                                        />
                                                        <label
                                                            htmlFor={`upload-${loan.id}`}
                                                            className={clsx(
                                                                "h-full py-3 px-3 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer",
                                                                uploadingLoanId === loan.id && 'opacity-50 cursor-not-allowed',
                                                                loan.status !== 'active' && "aspect-square w-12" // Force square shape for icon-only button
                                                            )}
                                                            title="Anexar Imagem do Termo Assinado"
                                                        >
                                                            {uploadingLoanId === loan.id ? (
                                                                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary-500" />
                                                            ) : (
                                                                <Upload className="h-4 w-4 md:h-5 md:w-5 text-primary-500" />
                                                            )}
                                                            {/* Show text only if active */}
                                                            {loan.status === 'active' && (uploadingLoanId === loan.id ? 'Subindo...' : loan.manual_term_url ? 'Substituir' : 'Anexar')}
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Viewing Signed Term */}
                                                {loan.manual_term_url && (
                                                    <button
                                                        onClick={() => handleViewManualTerm(loan.manual_term_url!)}
                                                        className={clsx(
                                                            "flex items-center justify-center gap-2 py-3 px-3 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95",
                                                            loan.status === 'active' ? "col-span-2" : "w-full"
                                                        )}
                                                        title="Ver Termo Assinado Manualmente"
                                                    >
                                                        <Eye className="h-4 w-4" /> Ver termo assinado
                                                    </button>
                                                )}

                                                {/* Group 2: Lifecycle Actions */}
                                                {loan.status === 'active' && (
                                                    <button
                                                        onClick={() => setModalInfo({ type: 'return', loanData: loan })}
                                                        className="flex items-center justify-center gap-2 py-3 px-3 bg-green-600 text-white hover:bg-green-700 font-black text-xs rounded-xl shadow-lg shadow-green-100 transition-all active:scale-95"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" /> Devolver
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setModalInfo({ type: 'delete', loanData: loan })}
                                                    className={clsx(
                                                        "flex items-center justify-center p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all active:scale-95 border border-red-100 hover:border-red-600",
                                                        loan.status !== 'active' && "w-full"
                                                    )}
                                                    title="Excluir Registro"
                                                >
                                                    {loan.status !== 'active' && <span className="mr-2 text-xs font-bold">Excluir Registro</span>}
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Professional Modals */}
            <Modal
                isOpen={modalInfo?.type === 'success' || modalInfo?.type === 'error'}
                onClose={() => setModalInfo(null)}
                title={modalInfo?.type === 'success' ? 'Sucesso!' : 'Atenção'}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={clsx(
                        "p-4 rounded-3xl",
                        modalInfo?.type === 'success' ? "bg-green-50" : "bg-red-50"
                    )}>
                        {modalInfo?.type === 'success' ? (
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        ) : (
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        )}
                    </div>
                    <p className="text-gray-600 font-medium leading-relaxed">
                        {modalInfo?.message}
                    </p>
                    <button
                        onClick={() => setModalInfo(null)}
                        className={clsx(
                            "w-full py-3.5 rounded-2xl font-black transition-all active:scale-95",
                            modalInfo?.type === 'success' ? "bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700" : "bg-red-600 text-white shadow-lg shadow-red-100 hover:bg-red-700"
                        )}
                    >
                        Entendido
                    </button>
                </div>
            </Modal>

            {/* PDF Preview Modal */}
            <Modal
                isOpen={modalInfo?.type === 'preview'}
                onClose={() => setModalInfo(null)}
                title="Visualizar Termo de Responsabilidade"
                maxWidth="max-w-4xl"
            >
                <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4 overflow-hidden shadow-inner h-[60vh] flex items-center justify-center">
                        {previewUrl ? (
                            <iframe
                                title="Termo Empréstimo"
                                src={previewUrl}
                                className="w-full h-full rounded-2xl border-none"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preparando visualização...</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setModalInfo(null)}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Fechar
                        </button>
                        <button
                            onClick={() => {
                                if (modalInfo?.loanData) generatePDF(modalInfo.loanData, true);
                                setModalInfo(null);
                            }}
                            className="flex-[2] py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download className="h-5 w-5" />
                            Baixar Termo em PDF
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Deletion Confirmation Modal */}
            <Modal
                isOpen={modalInfo?.type === 'delete'}
                onClose={() => setModalInfo(null)}
                title="Excluir Registro"
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-red-50 rounded-3xl">
                        <Trash2 className="h-10 w-10 text-red-600" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-gray-900 font-black">Tem certeza que deseja excluir?</p>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Esta ação é permanente e removerá o histórico deste empréstimo do sistema.
                            {modalInfo?.loanData?.status === 'active' && (
                                <span className="block mt-2 text-amber-600 font-bold">
                                    Nota: O estoque do equipamento será restaurado automaticamente.
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-4 w-full pt-2">
                        <button
                            onClick={() => setModalInfo(null)}
                            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                if (modalInfo?.loanData) handleDeleteLoan(modalInfo.loanData);
                                setModalInfo(null);
                            }}
                            className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Return Confirmation Modal */}
            <Modal
                isOpen={modalInfo?.type === 'return'}
                onClose={() => setModalInfo(null)}
                title="Confirmar Devolução"
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-green-50 rounded-3xl">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-gray-900 font-black">Confirmar recebimento do equipamento?</p>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Ao confirmar, o equipamento <strong>{modalInfo?.loanData?.equipment?.name}</strong> será restaurado ao inventário e o status do empréstimo será atualizado para devolvido.
                        </p>
                    </div>
                    <div className="flex gap-4 w-full pt-2">
                        <button
                            onClick={() => setModalInfo(null)}
                            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                if (modalInfo?.loanData) handleReturn(modalInfo.loanData);
                                setModalInfo(null);
                            }}
                            className="flex-1 py-3.5 bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
