import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

import { Zap, Send, Loader2, Plus, Trash2, Webhook, LayoutGrid } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface WebhookGroup {
    id: string; // Temporário apenas pro React map key
    name: string;
    urls: string[];
    linkToSend: string;
    isLoading: boolean;
    error: string | null;
    successMsg: string | null;
}

export function AdminAutomation() {
    const { user } = useAuth();
    const adminUser = user as import('../../types').Admin | null;

    const [groups, setGroups] = useState<WebhookGroup[]>([
        { id: crypto.randomUUID(), name: 'Grupo Principal', urls: [''], linkToSend: '', isLoading: false, error: null, successMsg: null }
    ]);
    const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(true);
    const [isSavingWebhooks, setIsSavingWebhooks] = useState(false);
    const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWebhooks = async () => {
            setIsLoadingWebhooks(true);
            const { data, error } = await supabase
                .from('tablet_webhooks')
                .select('url, group_name')
                .order('created_at', { ascending: true });

            if (!error && data && data.length > 0) {
                // Agrupar os webhooks retornado pelo group_name
                const groupedData = data.reduce((acc, curr) => {
                    const gName = curr.group_name || 'Geral';
                    if (!acc[gName]) {
                        acc[gName] = [];
                    }
                    acc[gName].push(curr.url);
                    return acc;
                }, {} as Record<string, string[]>);

                const newGroups: WebhookGroup[] = Object.keys(groupedData).map((name) => ({
                    id: crypto.randomUUID(),
                    name,
                    urls: groupedData[name],
                    linkToSend: '',
                    isLoading: false,
                    error: null,
                    successMsg: null
                }));

                setGroups(newGroups);
            } else {
                setGroups([{ id: crypto.randomUUID(), name: 'Grupo Principal', urls: [''], linkToSend: '', isLoading: false, error: null, successMsg: null }]);
            }
            setIsLoadingWebhooks(false);
        };

        fetchWebhooks();
    }, []);

    const handleSaveWebhooks = async () => {
        setIsSavingWebhooks(true);
        setGlobalError(null);
        setGlobalSuccess(null);
        try {
            // Excluir tudo para resincronizar os grupos (limpeza completa)
            const { error: deleteError } = await supabase.from('tablet_webhooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError) throw deleteError;

            // Achatar os grupos para salvar
            const payload: any[] = [];
            groups.forEach(group => {
                const activeWebhooks = group.urls.map(w => w.trim()).filter(w => w !== '');
                activeWebhooks.forEach(url => {
                    payload.push({ url, group_name: group.name.trim() || 'Geral' });
                });
            });

            if (payload.length > 0) {
                const { error: insertError } = await supabase.from('tablet_webhooks').insert(payload);
                if (insertError) throw insertError;
            }

            setGlobalSuccess('Todos os grupos de dispositivos foram salvos com sucesso!');
            setTimeout(() => setGlobalSuccess(null), 5000);
        } catch (err) {
            console.error('Erro ao salvar grupos no banco:', err);
            setGlobalError('Falha ao salvar a estrutura de grupos no banco de dados.');
        } finally {
            setIsSavingWebhooks(false);
        }
    };

    // Proteção rigorosa no componente
    if (adminUser?.unit !== 'Objetivo São Vicente') {
        return <Navigate to="/admin" replace />;
    }

    const validateUrl = (urlStr: string) => {
        try {
            new URL(urlStr);
            return true;
        } catch (_) {
            return false;
        }
    };

    const addGroup = () => {
        setGroups([...groups, {
            id: crypto.randomUUID(),
            name: `Novo Grupo ${groups.length + 1}`,
            urls: [''],
            linkToSend: '',
            isLoading: false,
            error: null,
            successMsg: null
        }]);
    };

    const removeGroup = (groupId: string) => {
        setGroups(groups.filter(g => g.id !== groupId));
    };

    const updateGroupField = (groupId: string, field: keyof WebhookGroup, value: any) => {
        setGroups(groups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
    };

    const updateWebhookUrl = (groupId: string, index: number, newUrl: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const newUrls = [...g.urls];
                newUrls[index] = newUrl;
                return { ...g, urls: newUrls };
            }
            return g;
        }));
    };

    const addWebhookToGroup = (groupId: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                return { ...g, urls: [...g.urls, ''] };
            }
            return g;
        }));
    };

    const removeWebhookFromGroup = (groupId: string, index: number) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const newUrls = g.urls.filter((_, i) => i !== index);
                return { ...g, urls: newUrls.length ? newUrls : [''] };
            }
            return g;
        }));
    };

    const handleSendForGroup = async (groupId: string, e: React.FormEvent) => {
        e.preventDefault();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        updateGroupField(groupId, 'error', null);
        updateGroupField(groupId, 'successMsg', null);

        if (!group.linkToSend.trim()) {
            updateGroupField(groupId, 'error', 'O link não pode estar vazio.');
            return;
        }

        if (!validateUrl(group.linkToSend)) {
            updateGroupField(groupId, 'error', 'Por favor, insira uma URL válida (ex: https://site.com).');
            return;
        }

        updateGroupField(groupId, 'isLoading', true);

        try {
            const activeWebhooks = group.urls
                .map(w => w.trim())
                .filter(w => w !== '');

            if (activeWebhooks.length === 0) {
                updateGroupField(groupId, 'error', 'Adicione pelo menos um webhook (URL) a este grupo.');
                updateGroupField(groupId, 'isLoading', false);
                return;
            }

            // Dispara requisições em paralelo apenas para este grupo
            const promises = activeWebhooks.map((webhookUrl: string) => {
                const finalUrl = new URL(webhookUrl);
                finalUrl.searchParams.append('url_recebido', group.linkToSend);

                return fetch(finalUrl.toString(), {
                    method: 'GET',
                    mode: 'no-cors' // Ignorar erros CORS
                });
            });

            await Promise.allSettled(promises);

            updateGroupField(groupId, 'successMsg', `Link enviado para os ${activeWebhooks.length} dispositivos do grupo.`);
            updateGroupField(groupId, 'linkToSend', ''); // Limpa após sucesso

            // Apaga mensagem de sucesso apos 5 seg
            setTimeout(() => {
                setGroups((curr) => curr.map(g => g.id === groupId ? { ...g, successMsg: null } : g));
            }, 5000);

        } catch (err) {
            console.error(`Erro ao disparar para os dispositivos do grupo ${group.name}:`, err);
            updateGroupField(groupId, 'error', 'Falha ao enviar link aos dispositivos.');
        } finally {
            updateGroupField(groupId, 'isLoading', false);
        }
    };

    const getTotalActiveDevices = () => {
        let total = 0;
        groups.forEach(g => {
            total += g.urls.filter(w => w.trim() !== '').length;
        });
        return total;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Automação</h2>
                <p className="text-slate-500 mt-1">
                    Gerencie seus dispositivos separando-os por grupos. Envie links individualmente para cada bloco de tablets.
                </p>
            </div>

            {/* Config & Action Top Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200 shrink-0">
                        <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Gerenciador de Tablets</h3>
                        <p className="text-sm text-slate-500">
                            {isLoadingWebhooks ? 'Carregando...' : `${getTotalActiveDevices()} dispositivos configurados em ${groups.length} grupo(s)`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={addGroup}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        disabled={isLoadingWebhooks || isSavingWebhooks}
                    >
                        <Plus className="h-4 w-4" />
                        Novo Grupo
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveWebhooks}
                        disabled={isSavingWebhooks || isLoadingWebhooks}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
                    >
                        {isSavingWebhooks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        {isSavingWebhooks ? 'Salvando...' : 'Salvar Configurações Globais'}
                    </button>
                </div>
            </div>

            {globalSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-sm text-emerald-700 font-medium">{globalSuccess}</p>
                </div>
            )}
            {globalError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700 font-medium">{globalError}</p>
                </div>
            )}

            {/* Groups Render */}
            {isLoadingWebhooks ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
                    <p className="text-slate-500 font-medium">Carregando grupos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {groups.map((group) => (
                        <div key={group.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 hover:border-amber-200/80 overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300 transition-all group/card">
                            {/* Group Header */}
                            <div className="p-5 border-b border-amber-100/50 bg-gradient-to-r from-amber-50/80 to-transparent flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 relative">
                                    <div className="h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(245,158,11,0.25)] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                                        <LayoutGrid className="h-5 w-5 text-white" />
                                    </div>
                                    <input
                                        type="text"
                                        value={group.name}
                                        onChange={(e) => updateGroupField(group.id, 'name', e.target.value)}
                                        placeholder="Nome do Grupo (ex: Totens Andar 1)"
                                        className="flex-1 bg-white/40 hover:bg-white/60 focus:bg-white rounded-lg border border-transparent hover:border-amber-200 focus:border-amber-500 text-base font-bold text-slate-800 focus:outline-none transition-all py-1.5 px-3 -ml-2 placeholder:text-slate-400 placeholder:font-medium shadow-sm focus:shadow-md focus:shadow-amber-500/10"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeGroup(group.id)}
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 bg-white/50 hover:shadow-sm"
                                    title="Excluir Grupo Inteiro"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Group Content */}
                            <div className="p-5 flex-1 flex flex-col bg-slate-50/30">

                                {/* Lista de Webhooks do Grupo */}
                                <div className="space-y-4 mb-6 relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-amber-400 rounded-full"></div>
                                            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest">
                                                Tablets Conectados
                                            </label>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addWebhookToGroup(group.id)}
                                            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 bg-white hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-all border border-amber-200/60 shadow-sm hover:shadow hover:border-amber-300"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Adicionar
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {group.urls.map((url, urlIndex) => (
                                            <div key={urlIndex} className="flex gap-2 items-center group/webhook animate-in slide-in-from-left-2 duration-300">
                                                <div className="flex-1 relative group-focus-within/webhook:scale-[1.01] transition-transform">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                        <div className="h-6 w-6 rounded flex items-center justify-center bg-slate-100 group-focus-within/webhook:bg-amber-100 transition-colors">
                                                            <Webhook className="h-3.5 w-3.5 text-slate-400 group-focus-within/webhook:text-amber-500 transition-colors" />
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={url}
                                                        onChange={(e) => updateWebhookUrl(group.id, urlIndex, e.target.value)}
                                                        placeholder="https://trigger.macrodroid.com/..."
                                                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:border-amber-500 focus:ring-amber-500/10 transition-all text-sm font-medium shadow-sm hover:shadow focus:shadow-md"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeWebhookFromGroup(group.id, urlIndex)}
                                                    className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 bg-white rounded-xl transition-all border border-slate-200 hover:border-red-200 shadow-sm hover:shadow shrink-0 ml-1"
                                                    title="Remover URL"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Form de Disparo Interno do Card */}
                                <div className="mt-auto pt-6 border-t border-slate-200/60 relative">
                                    <div className="absolute -top-[1px] left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-amber-200/50 to-transparent"></div>
                                    <form onSubmit={(e) => handleSendForGroup(group.id, e)} className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div>
                                            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest">
                                                Disparar neste grupo
                                            </label>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="url"
                                                value={group.linkToSend}
                                                onChange={(e) => {
                                                    updateGroupField(group.id, 'linkToSend', e.target.value);
                                                    if (group.error) updateGroupField(group.id, 'error', null);
                                                }}
                                                placeholder="http://site.com"
                                                disabled={group.isLoading || isSavingWebhooks}
                                                className={`
                                                    flex-1 px-4 py-3 bg-white rounded-xl text-slate-900 
                                                    placeholder:text-slate-400 focus:outline-none focus:ring-4 text-sm font-medium
                                                    transition-all shadow-sm focus:shadow-md border-2
                                                    ${group.error
                                                        ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10 hover:border-red-400'
                                                        : 'border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-amber-500/10'
                                                    }
                                                `}
                                            />
                                            <button
                                                type="submit"
                                                disabled={group.isLoading || isSavingWebhooks || !group.linkToSend}
                                                className={`
                                                    flex items-center justify-center gap-2 px-6 py-3 rounded-xl 
                                                    font-bold text-sm transition-all relative overflow-hidden group/btn border
                                                    ${group.isLoading || isSavingWebhooks || !group.linkToSend
                                                        ? 'bg-slate-100/80 text-slate-400 cursor-not-allowed border-slate-200'
                                                        : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 border-transparent'
                                                    }
                                                `}
                                            >
                                                {group.isLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Send className="h-4 w-4" />
                                                )}
                                                Enviar
                                            </button>
                                        </div>

                                        {group.error && (
                                            <p className="text-xs text-red-500 font-medium animate-in fade-in">{group.error}</p>
                                        )}
                                        {group.successMsg && (
                                            <p className="text-xs text-emerald-600 font-medium animate-in fade-in">{group.successMsg}</p>
                                        )}
                                    </form>
                                </div>

                            </div>
                        </div>
                    ))}

                    {/* Botão de Adicionar Fim (Big Card) */}
                    <button
                        onClick={addGroup}
                        className="bg-slate-50/50 hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-amber-300 rounded-2xl flex flex-col items-center justify-center h-full min-h-[250px] transition-all group/new"
                    >
                        <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center group-hover/new:scale-110 group-hover/new:border-amber-300 group-hover/new:bg-amber-50 transition-all duration-300 mb-3">
                            <Plus className="h-5 w-5 text-slate-500 group-hover/new:text-amber-500" />
                        </div>
                        <span className="font-bold text-slate-600 group-hover/new:text-amber-600">Criar Novo Grupo</span>
                        <span className="text-xs text-slate-500 mt-1 max-w-[200px] text-center">Organize dispositivos diferentes em blocos novos</span>
                    </button>
                </div>
            )}
        </div>
    );
}
