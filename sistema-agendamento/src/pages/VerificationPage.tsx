import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Calendar, User, Clock, Package } from 'lucide-react';

export function VerificationPage() {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');
    const [bookingData, setBookingData] = useState<any>(null);

    useEffect(() => {
        console.log('Verification started for token:', token);
        if (!token) {
            console.error('No token found in URL params');
            setStatus('invalid');
            return;
        }

        const verifyToken = async () => {
            // Safety timeout: if it takes more than 10 seconds, show error
            const timeoutId = setTimeout(() => {
                if (status === 'loading') {
                    console.error('Verification timeout reached');
                    setStatus('error');
                }
            }, 10000);

            try {
                console.log('Attempting primary fetch (with joins)...');
                // Fetch booking by token
                const { data: list, error } = await supabase
                    .from('bookings')
                    .select(`
                        id,
                        display_id,
                        created_at,
                        booking_date,
                        start_time,
                        end_time,
                        term_document,
                        status,
                        users (
                            full_name,
                            totvs_number
                        )
                    `)
                    .eq('verification_token', token)
                    .limit(1);

                const data = list && list.length > 0 ? list[0] : null;

                let simpleData = null;
                if (error || !data) {
                    console.warn('Primary fetch failed or returned no data. Error:', error);
                    console.log('Attempting fallback fetch (simple select)...');
                    // Try to fetch with a simpler query if joins fail due to RLS
                    const { data: sList, error: sError } = await supabase
                        .from('bookings')
                        .select('*')
                        .eq('verification_token', token)
                        .limit(1);

                    const sData = sList && sList.length > 0 ? sList[0] : null;

                    if (sError || !sData) {
                        console.error('Fallback fetch also failed. Error:', sError);
                        clearTimeout(timeoutId);
                        setStatus('invalid');
                        return;
                    }
                    console.log('Fallback fetch successful!');
                    simpleData = sData;
                    setBookingData(sData);
                } else {
                    console.log('Primary fetch successful!');
                    setBookingData(data);
                }

                clearTimeout(timeoutId);
                setStatus('valid');

                const finalData = data || simpleData;
                if (!finalData) return;

                // Log the verification action (Non-blocking)
                console.log('Logging verification action...');
                supabase.from('audit_logs').insert({
                    booking_id: finalData.id,
                    action: 'VERIFIED_QR',
                    performed_by: 'ANONYMOUS', // Public page
                    details: { user_agent: navigator.userAgent }
                }).then(({ error }) => {
                    if (error) console.error('Audit log error:', error);
                    else console.log('Audit log entry created successfully.');
                });

            } catch (err) {
                console.error('Verification exception:', err);
                clearTimeout(timeoutId);
                setStatus('error');
            }
        };

        verifyToken();

        return () => {
            // No cleanup needed for the timeout since it updates status which is tracked
        };
    }, [token]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Verificando autenticidade do documento...</p>
            </div>
        );
    }

    if (status === 'invalid' || status === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border-t-8 border-red-500">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                        <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Documento Inválido</h1>
                    <p className="text-gray-500 mb-6">
                        Este código QR não corresponde a nenhum termo de responsabilidade ativo em nosso sistema.
                    </p>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start text-left text-sm text-red-700">
                        <AlertTriangle className="h-5 w-5 mr-3 shrink-0" />
                        <div>
                            <p className="font-bold mb-1">Informações de Diagnóstico:</p>
                            <p className="opacity-70 break-all mb-2">Token: {token || 'N/A'}</p>
                            <p>Se você acredita que isso é um erro, tente realizar um novo agendamento e testar o novo código QR.</p>
                        </div>
                    </div>
                </div>
                <p className="mt-8 text-xs text-gray-400 font-bold uppercase tracking-widest text-center">Sistema de Agendamento</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-xs text-primary-600 font-bold hover:underline"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    // Extract consolidated data
    const userName = bookingData.users?.full_name || bookingData.term_document?.userName || 'N/A';
    const userTotvs = bookingData.users?.totvs_number || bookingData.term_document?.userTotvs || 'N/A';
    const equipmentList = bookingData.term_document?.equipments || [];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-green-600 px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 ring-4 ring-white/10">
                            <ShieldCheck className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Documento Autêntico</h1>
                        <p className="text-green-100 text-sm font-medium">Verificado pelo Sistema de Agendamento</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ID DO TERMO</p>
                            <p className="text-3xl font-black text-gray-800 tracking-tight">#{bookingData.display_id || 'N/A'}</p>
                        </div>
                        <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            <span className="text-xs font-bold text-green-700 uppercase flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Vinculado ao Sistema
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start">
                            <div className="p-2.5 bg-gray-50 rounded-xl mr-4 shrink-0">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Responsável</p>
                                <p className="font-bold text-gray-900">{userName}</p>
                                <p className="text-sm text-gray-500">TOTVS: {userTotvs}</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="p-2.5 bg-gray-50 rounded-xl mr-4 shrink-0">
                                <Calendar className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Data de Uso</p>
                                <p className="font-bold text-gray-900">
                                    {bookingData.booking_date?.split('-').reverse().join('/')}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {bookingData.start_time} às {bookingData.end_time}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="p-2.5 bg-gray-50 rounded-xl mr-4 shrink-0">
                                <Package className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="w-full">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Equipamentos</p>
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                                    {equipmentList.map((eq: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700">
                                                {eq.name} <span className="text-gray-400 font-normal">({eq.brand || '-'})</span>
                                            </span>
                                            <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm">x{eq.quantity}</span>
                                        </div>
                                    ))}
                                    {equipmentList.length === 0 && <p className="text-gray-500 text-sm">N/A</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Verificação realizada em {new Date().toLocaleString('pt-BR')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
