import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

import { Zap, Send, Loader2, Plus, Trash2, Webhook } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export function AdminAutomation() {
    const { user } = useAuth();
    const adminUser = user as import('../../types').Admin | null;

    const [link, setLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [webhooks, setWebhooks] = useState<string[]>(['']);
    const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(true);
    const [isSavingWebhooks, setIsSavingWebhooks] = useState(false);

    useEffect(() => {
        const fetchWebhooks = async () => {
            setIsLoadingWebhooks(true);
            const { data, error } = await supabase
                .from('tablet_webhooks')
                .select('url')
                .order('created_at', { ascending: true });

            if (!error && data && data.length > 0) {
                setWebhooks(data.map(d => d.url));
            } else {
                setWebhooks(['']);
            }
            setIsLoadingWebhooks(false);
        };

        fetchWebhooks();
    }, []);

    const handleSaveWebhooks = async () => {
        setIsSavingWebhooks(true);
        setError(null);
        setSuccessMsg(null);
        try {
            // Exclui todos existentes para inserir os novos (limpeza)
            const { error: deleteError } = await supabase.from('tablet_webhooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError) throw deleteError;

            const activeWebhooks = webhooks.map(w => w.trim()).filter(w => w !== '');
            if (activeWebhooks.length > 0) {
                const { error: insertError } = await supabase.from('tablet_webhooks').insert(
                    activeWebhooks.map(url => ({ url }))
                );
                if (insertError) throw insertError;
            }

            setSuccessMsg('Dispositivos salvos com sucesso no banco de dados!');
            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err) {
            console.error('Erro ao salvar webhooks no banco:', err);
            setError('Falha ao salvar a lista de dispositivos no banco de dados.');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (!link.trim()) {
            setError('O link não pode estar vazio.');
            return;
        }

        if (!validateUrl(link)) {
            setError('Por favor, insira uma URL válida (ex: https://site.com).');
            return;
        }

        setIsLoading(true);

        try {
            const activeWebhooks = webhooks
                .map(w => w.trim())
                .filter(w => w !== '');

            if (activeWebhooks.length === 0) {
                setError('Adicione pelo menos um webhook na lista de dispositivos antes de enviar.');
                setIsLoading(false);
                return;
            }

            // Dispara requisições em paralelo
            const promises = activeWebhooks.map((webhookUrl: string) => {
                // Passando a URL digitada como parametro (isso varia, dependendo se é GET/POST, 
                // geralmente o macrodroid aceita query params pra passar o valor)
                // Exemplo: ?url_recebido=...
                const finalUrl = new URL(webhookUrl);
                finalUrl.searchParams.append('url_recebido', link);

                // Disparo HTTP GET simples
                return fetch(finalUrl.toString(), {
                    method: 'GET',
                    mode: 'no-cors' // Ignorar erros CORS se o webhook for em outro dominio
                });
            });

            await Promise.allSettled(promises);

            setSuccessMsg('Link enviado para os dispositivos com sucesso.');
            setLink(''); // limpar apos enviar

        } catch (err) {
            console.error('Erro geral ao disparar webhooks:', err);
            setError('Falha ao enviar link aos dispositivos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Automação</h2>
                <p className="text-slate-500 mt-1">
                    Envie rapidamente um link para todos os dispositivos pré-configurados.
                </p>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8">

                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200">
                            <Zap className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Disparo em Lote</h3>
                            <p className="text-sm text-slate-500">
                                {webhooks.filter(w => w.trim() !== '').length} dispositivos configurados na rede
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

                        <div className="space-y-2">
                            <label htmlFor="url-link" className="block text-sm font-semibold text-slate-700">
                                Insira o link
                            </label>

                            <div className="relative">
                                <input
                                    id="url-link"
                                    type="url"
                                    value={link}
                                    onChange={(e) => {
                                        setLink(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="https://exemplo.com/pagina-alvo"
                                    className={`
                                        w-full px-4 py-3 bg-white border rounded-xl text-slate-900 
                                        placeholder:text-slate-400 focus:outline-none focus:ring-2 
                                        transition-shadow
                                        ${error
                                            ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                                            : 'border-slate-300 focus:border-amber-500 focus:ring-amber-500/20'
                                        }
                                    `}
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 font-medium mt-2 animate-in fade-in">
                                    {error}
                                </p>
                            )}
                        </div>

                        {isLoadingWebhooks ? (
                            <div className="flex flex-col items-center justify-center py-6 border-t border-slate-100">
                                <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-2" />
                                <p className="text-sm text-slate-500">Carregando dispositivos salvos...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Dispositivos (Webhooks)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setWebhooks([...webhooks, ''])}
                                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                                        disabled={isLoading || isSavingWebhooks}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Adicionar Tablet
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {webhooks.map((webhook, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <div className="flex-1 relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Webhook className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <input
                                                    type="url"
                                                    value={webhook}
                                                    onChange={(e) => {
                                                        const newWebhooks = [...webhooks];
                                                        newWebhooks[index] = e.target.value;
                                                        setWebhooks(newWebhooks);
                                                    }}
                                                    placeholder="https://trigger.macrodroid.com/..."
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 focus:bg-white transition-all text-sm font-medium"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setWebhooks(webhooks.filter((_, i) => i !== index))}
                                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                title="Remover Tablet"
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {webhooks.length === 0 && (
                                        <div className="text-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                                            <p className="text-sm text-slate-500">Nenhum dispositivo configurado.</p>
                                            <button
                                                type="button"
                                                onClick={() => setWebhooks([''])}
                                                className="mt-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
                                            >
                                                Adicionar um agora
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveWebhooks}
                                        disabled={isSavingWebhooks || isLoadingWebhooks}
                                        className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {isSavingWebhooks && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {isSavingWebhooks ? 'Salvando...' : 'Salvar Dispositivos'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex items-center gap-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={isLoading || !link}
                                className={`
                                    flex items-center justify-center gap-2 px-6 py-3 rounded-xl 
                                    font-bold text-sm shadow-sm transition-all
                                    sm:w-auto w-full
                                    ${isLoading || !link
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent'
                                        : 'bg-amber-400 text-slate-900 hover:bg-amber-500 hover:shadow-md border max-w-[200px]'
                                    }
                                `}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Enviar
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-slate-500 font-medium">
                                A requisição será enviada via HTTP para os webhooks no formato `?url_recebido=...`
                            </p>
                        </div>

                        {successMsg && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in">
                                <p className="text-sm text-emerald-700 font-medium">
                                    {successMsg}
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
