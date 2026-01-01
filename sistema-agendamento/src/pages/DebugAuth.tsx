import { useState } from 'react';
import { supabase } from '../services/supabase';

export function DebugAuth() {
    const [logs, setLogs] = useState<any[]>([]);

    const addLog = (title: string, data: any) => {
        setLogs(prev => [...prev, { title, data, time: new Date().toISOString() }]);
    };

    const runDiagnostics = async () => {
        setLogs([]);
        addLog('Iniciando Diagnóstico', { userAgent: navigator.userAgent });

        // 1. Check Admins Table Structure & Data
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .limit(5);

            addLog('Busca Tabela Admins', { success: !error, data, error });
        } catch (e: any) {
            addLog('Erro Crítico Admins', e.message);
        }

        // 2. Check Specific Admin 'admin'
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', 'admin')
                .single();

            addLog('Busca Admin Usuário "admin"', { success: !error, data, error });
        } catch (e: any) {
            addLog('Erro Busca Admin Específico', e.message);
        }

        // 3. Check Users Table Permissions (RLS)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('email, active, totvs_number')
                .limit(5);

            addLog('Busca Tabela Users (Teste RLS)', { success: !error, data, error });
        } catch (e: any) {
            addLog('Erro Crítico Users', e.message);
        }

        // 4. TESTE CRÍTICO: Fluxo Completo de Auth (Registro + Login)
        try {
            const testEmail = `test.debug.${Date.now()}@example.com`;
            const testSamePass = 'Teste123!';

            addLog('>>> INICIANDO TESTE DE FLUXO DE AUTH', { testEmail });

            // A. Registrar
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: testEmail,
                password: testSamePass,
            });

            if (signUpError) {
                addLog('FALHA NO REGISTRO (SignUp)', signUpError);
            } else {
                addLog('Registro (SignUp) OK', {
                    user: signUpData.user?.id,
                    identities: signUpData.user?.identities
                });

                // Verificar se identities está vazio
                if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
                    addLog('ALERTA: User criado mas identities vazio. Email pode já existir ou Auth desabilitado.', {});
                }

                // B. Tentar Login Imediato
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: testEmail,
                    password: testSamePass
                });

                if (signInError) {
                    addLog('FALHA NO LOGIN IMEDIATO', {
                        message: signInError.message,
                        status: signInError.status,
                        name: signInError.name
                    });
                } else {
                    addLog('SUCESSO TOTAL: Login Imediato Funcionou!', {
                        user: signInData.user?.email,
                        session: signInData.session ? 'Sessão Criada' : 'Sem Sessão'
                    });
                }
            }

        } catch (e: any) {
            addLog('Erro Exceção Fluxo Auth', e);
        }
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Diagnóstico de Autenticação</h1>
            <button
                onClick={runDiagnostics}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
            >
                Rodar Testes
            </button>
            <div className="space-y-4">
                {logs.map((log, index) => (
                    <div key={index} className="bg-white p-4 rounded shadow border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">{log.title}</h3>
                            <span className="text-xs text-gray-500">{log.time}</span>
                        </div>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-60 text-xs">
                            {JSON.stringify(log.data, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    );
}
