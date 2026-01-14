
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    ShieldAlert,
    Search,
    ChevronDown,
    ChevronUp,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { LogDetailsModal } from '../../components/LogDetailsModal';
import { generateFriendlySummary } from '../../utils/auditLogFormatter';
import { generateChangeTip } from '../../utils/changeTipGenerator';
import { Lightbulb } from 'lucide-react';

interface AuditLog {
    id: string;
    admin_id: string;
    action_type: string;
    table_name: string;
    record_id: string;
    old_data: any;
    new_data: any;
    ip_address: string;
    created_at: string;
    admin?: {
        username: string;
        unit: string;
    };
}

export function AdminLogs() {
    const { user } = useAuth();
    const adminUser = user as any;
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [viewMode, setViewMode] = useState<'technical' | 'friendly'>('technical');

    // Only Super Admin should see this, but RLS protects it anyway.
    // We fetch logs and also join with admins table to get usernames if possible.
    // Since we are using RLS, we can just do a standard select.
    // However, joining 'admins' might be tricky via standard client if RLS blocks reading valid admins.
    // Let's assume we can fetch admins separately or just show ID for now if join fails.
    // Actually, 'admins' table is blocked for read by 'anon', but our admin token allows reading via RPC or if we had RLS policy for it.
    // The previous analysis showed 'admins' table likely has restrictions.
    // Let's rely on the text 'action_type' and 'admin_id' for now.

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // First fetch the logs
            const { data: logData, error: logError } = await supabase
                .from('admin_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (logError) throw logError;

            // Now, let's try to fetch admin names for these IDs. 
            // We can use the secure RPC 'get_all_admins' we created/analyzed before, or just try to SELECT if allowed.
            // But 'get_all_admins' returns everything. Let's filter client side for display simple names.
            // Or better: valid admins can usually see the admins list via get_all_admins RPC.

            let enrichedLogs = logData as AuditLog[];

            try {
                const { data: adminsData, error: adminError } = await supabase.rpc('get_all_admins', { p_admin_token: (localStorage.getItem('admin_session') ? JSON.parse(localStorage.getItem('admin_session')!).session_token : '') });

                if (!adminError && adminsData) {
                    const adminMap = new Map(adminsData.map((a: any) => [a.id, a]));
                    enrichedLogs = logData.map((log: any) => ({
                        ...log,
                        admin: adminMap.get(log.admin_id) || { username: 'Desconhecido/Deletado', unit: '-' }
                    }));
                }
            } catch (err) {
                console.warn('Failed to fetch admin details', err);
            }

            setLogs(enrichedLogs);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);


    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
        if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-800';
        if (action.includes('RESET')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };


    const filteredLogs = logs.filter(log => {
        const friendlySummary = generateFriendlySummary(log);
        const searchLower = searchTerm.toLowerCase();

        if (viewMode === 'friendly') {
            return (
                friendlySummary.action.toLowerCase().includes(searchLower) ||
                friendlySummary.details.toLowerCase().includes(searchLower) ||
                friendlySummary.target.toLowerCase().includes(searchLower) ||
                log.admin?.username.toLowerCase().includes(searchLower)
            );
        } else { // technical view
            return (
                log.action_type.toLowerCase().includes(searchLower) ||
                log.table_name.toLowerCase().includes(searchLower) ||
                log.record_id?.toLowerCase().includes(searchLower) ||
                log.admin?.username.toLowerCase().includes(searchLower)
            );
        }
    });

    if (adminUser?.role !== 'super_admin') {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <ShieldAlert className="w-16 h-16 mb-4 text-red-500" />
                <h2 className="text-xl font-bold text-gray-700">Acesso Restrito</h2>
                <p>Apenas Super Administradores podem visualizar os logs de auditoria.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-primary-600" />
                        Auditoria de Sistema
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Monitore todas as ações críticas executadas por administradores.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('friendly')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'friendly'
                                ? 'bg-white text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Visão Amigável
                        </button>
                        <button
                            onClick={() => setViewMode('technical')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'technical'
                                ? 'bg-white text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Visão Técnica
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLogs}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                            title="Atualizar"
                        >
                            <Clock className="w-5 h-5" />
                        </button>
                        <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                            {logs.length} Registros
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={viewMode === 'friendly' ? "Buscar por ação, administrador ou detalhes..." : "Buscar por ID, tabela, ação ou admin..."}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Future: Date Range Picker could go here */}
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {viewMode === 'friendly' ? (
                                    <>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">O que aconteceu?</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alvo</th>
                                    </>
                                ) : (
                                    <>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alvo (Tabela:ID)</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                    </>
                                )}
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Ações</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={viewMode === 'friendly' ? 5 : 6} className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="animate-spin h-6 w-6 border-b-2 border-primary-600 rounded-full"></div>
                                        </div>
                                        Carregando logs de auditoria...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={viewMode === 'friendly' ? 5 : 6} className="px-6 py-10 text-center text-gray-500">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const friendly = viewMode === 'friendly' ? generateFriendlySummary(log) : null;

                                    return (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors group"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="font-medium text-gray-900">
                                                    {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                                </div>
                                                <div className="text-xs">
                                                    {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs uppercase">
                                                        {log.admin?.username.substring(0, 2) || 'AD'}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.admin?.username || 'Admin Desconhecido'}
                                                        </div>
                                                        {log.admin?.unit && (
                                                            <div className="text-xs text-gray-500">
                                                                Unidade: {log.admin.unit}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {viewMode === 'friendly' && friendly ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${friendly.icon === 'delete' ? 'bg-red-100 text-red-800' :
                                                            friendly.icon === 'create' ? 'bg-green-100 text-green-800' :
                                                                friendly.icon === 'update' ? 'bg-amber-100 text-amber-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {friendly.action}
                                                        </span>
                                                        <p className="text-sm text-gray-900 mt-1 font-medium truncate max-w-xs" title={friendly.details}>
                                                            {friendly.details}
                                                        </p>
                                                    </td>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-semibold">
                                                        {friendly.target}
                                                    </span>
                                                    {(() => {
                                                        const tip = generateChangeTip(log);
                                                        if (tip && log.action_type.includes('UPDATE')) {
                                                            return (
                                                                <div className="mt-2 flex items-start gap-1.5 p-2 bg-yellow-50 border border-yellow-100 rounded-lg max-w-xs">
                                                                    <Lightbulb className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
                                                                    <span className="text-[10px] text-yellow-800 font-medium leading-tight">
                                                                        <span className="font-bold uppercase tracking-wider text-yellow-900 border-b border-yellow-200 mr-1">Dica:</span>
                                                                        {tip}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </td>
                                        </>
                                    ) : (
                            <>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action_type)}`}>
                                        {log.action_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                                    <div className="truncate max-w-[150px]" title={log.record_id}>
                                        {log.table_name}:{log.record_id?.split('-')[0]}...
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                                    {log.ip_address !== 'unknown' ? log.ip_address : '-'}
                                </td>
                            </>
                                    )}

                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Ver Detalhes"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                        );
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>

            {/* Modal de Detalhes */ }
    <LogDetailsModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
    />
        </div >
    );
}
