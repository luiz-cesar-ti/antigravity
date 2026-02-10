import { X, Clock, Monitor, Database, User, ShieldAlert, Lightbulb } from 'lucide-react';
import { generateChangeTip } from '../utils/changeTipGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


interface LogDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: any;
}

export function LogDetailsModal({ isOpen, onClose, log }: LogDetailsModalProps) {
    if (!isOpen || !log) return null;

    const LOG_FIELD_ORDER = [
        'professor_nome',
        'professor_email',
        'professor_id',
        'data_uso',
        'hora_inicio',
        'hora_fim',
        'localizacao',
        'tipo_registro',
        'termo_versao',
        'termo_hash',
        'display_id',
        'status_anterior',
        'equipamento_nome',
        'equipamento_marca',
        'equipamento_modelo',
        'quantidade'
    ];

    const sortObjectKeys = (obj: any) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

        const sortedObj: any = {};
        // First add keys from our prescribed order
        LOG_FIELD_ORDER.forEach(key => {
            if (key in obj) {
                sortedObj[key] = obj[key];
            }
        });
        // Then add any other keys that weren't in the prescribed order
        Object.keys(obj).forEach(key => {
            if (!LOG_FIELD_ORDER.includes(key)) {
                sortedObj[key] = obj[key];
            }
        });
        return sortedObj;
    };

    const formatData = (data: any) => {
        if (!data) return <span className="text-gray-400 italic">Nenhum dado registrado</span>;

        try {
            let content = typeof data === 'string' ? JSON.parse(data) : data;

            // Apply custom sorting to objects or arrays of objects
            if (Array.isArray(content)) {
                content = content.map(item => sortObjectKeys(item));
            } else {
                content = sortObjectKeys(content);
            }

            return (
                <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-gray-700">
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                        {JSON.stringify(content, null, 2)}
                    </pre>
                </div>
            );
        } catch (e) {
            return <div className="text-red-500">Erro ao formatar dados: {String(data)}</div>;
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-200';
        if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-800 border-amber-200';
        if (action.includes('create') || action.includes('INSERT')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border shadow-sm ${getActionColor(log.action_type)}`}>
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Detalhes de Auditoria</h2>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">ID: {log.id.slice(0, 8)}...</span>
                                <span>•</span>
                                <span className="uppercase tracking-wider text-xs font-bold">{log.action_type}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <User className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Responsável</span>
                            </div>
                            <p className="font-bold text-gray-900 text-sm">{log.admin?.username || 'Sistema'}</p>
                            <p className="text-xs text-gray-500 mt-1">{log.admin?.unit || '-'}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Data e Hora</span>
                            </div>
                            <p className="font-bold text-gray-900 text-sm">
                                {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Database className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Alvo</span>
                            </div>
                            <p className="font-bold text-gray-900 text-sm font-mono">{log.table_name}</p>
                            <p className="text-xs text-gray-500 mt-1 truncate" title={log.record_id}>ID: {log.record_id}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Monitor className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Origem</span>
                            </div>
                            <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${log.ip_address !== 'unknown' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                                {log.ip_address !== 'unknown' ? log.ip_address : 'Desconhecido'}
                            </p>
                        </div>
                    </div>




                    {/* Change Tip Section */}
                    {(() => {
                        const tip = generateChangeTip(log);
                        if (tip) {
                            return (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 shadow-sm">
                                    <div className="bg-yellow-100 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-black text-yellow-800 uppercase tracking-wide mb-1">Alterações Identificadas</h3>
                                        <p className="text-sm font-medium text-yellow-900 leading-relaxed">
                                            {tip}
                                        </p>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Diff Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                                    Dados Anteriores (OLD)
                                </h3>
                                {log.old_data && <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">JSON Object</span>}
                            </div>
                            {formatData(log.old_data)}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                    Novos Dados (NEW)
                                </h3>
                                {log.new_data && <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">JSON Object</span>}
                            </div>
                            {formatData(log.new_data)}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm text-sm"
                    >
                        Fechar Visualização
                    </button>
                </div>
            </div>
        </div>
    );
}
