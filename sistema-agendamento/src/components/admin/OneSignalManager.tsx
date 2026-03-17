import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import type { Admin } from '../../types';

export function OneSignalManager() {
    const { user, role } = useAuth();
    const adminUser = user as Admin | null;
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only run for admin users
    if (role !== 'admin' && role !== 'super_admin') {
        return null;
    }

    useEffect(() => {
        let mounted = true;

        const initOneSignal = async () => {
            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
            if (!appId) {
                console.error("OneSignal App ID is missing from environment variables.");
                if (mounted) setError("Erro de configuração do sistema (App ID ausente).");
                return;
            }

            try {
                // Check if already initialized to prevent errors on hot reload
                // @ts-ignore - The types provided by react-onesignal might not match the runtime exactly
                if (!window.OneSignal?.initialized && !isInitialized) {
                    await OneSignal.init({
                        appId: appId,
                        allowLocalhostAsSecureOrigin: true, // Useful for testing
                        // @ts-ignore - Suppress type error for incomplete notifyButton object
                        notifyButton: {
                            enable: false, // We will use a custom button instead of their floating bell
                        },
                    });
                }
                
                if (!mounted) return;

                // Set external ID if we have a user
                if (adminUser?.id) {
                    await OneSignal.login(adminUser.id);
                }

                setIsInitialized(true);

                // Check current subscription status
                const subscriptionStatus = await OneSignal.User.PushSubscription.optedIn;
                setIsSubscribed(!!subscriptionStatus);
                
                /*
                // Listen for changes
                OneSignal.User.PushSubscription.addEventListener("change", (e) => {
                    setIsSubscribed(e.current.optedIn);
                });
                */

            } catch (err: any) {
                const errorMessage = err?.message || String(err);
                
                // If it's already initialized (happens in React Strict Mode / Hot Reload), we can just proceed
                if (errorMessage.includes("already initialized") || errorMessage.includes("already-initialized")) {
                    console.log("OneSignal was already initialized. Proceeding...");
                    if (mounted) {
                        setIsInitialized(true);
                        // Still check status
                        const subscriptionStatus = await OneSignal.User.PushSubscription.optedIn;
                        setIsSubscribed(!!subscriptionStatus);
                    }
                    return;
                }
                
                console.error("Error initializing OneSignal:", err);
                if (mounted) setError(`Falha ao inicializar serviço de notificações. Detalhe: ${errorMessage}`);
            }
        };

        initOneSignal();

        return () => {
            mounted = false;
            // Clean up listeners if necessary
        };
    }, [adminUser?.id]);

    const handleTogglePush = async () => {
        if (!isInitialized || isToggling) return;

        setIsToggling(true);
        setError(null);

        try {
            if (isSubscribed) {
                // Opt out
                await OneSignal.User.PushSubscription.optOut();
                setIsSubscribed(false);
            } else {
                // In v16, Notifications API is the recommended way to prompt
                if (OneSignal.Notifications) {
                    await OneSignal.Notifications.requestPermission();
                } else {
                    // Fallback just in case
                    await OneSignal.Slidedown.promptPush();
                }
                
                // We need to re-check status because prompting is async and user might denied
                setTimeout(async () => {
                     const status = await OneSignal.User.PushSubscription.optedIn;
                     setIsSubscribed(!!status);
                     setIsToggling(false); // Only stop loading after the check
                }, 1500);
                return; // Early return to avoid setting isToggling(false) twice
            }
        } catch (err: any) {
            console.error("Error toggling push subscription:", err);
            // Don't show critical UI error for simple cancellation of prompt
            if (err?.message && !err.message.includes("cancelled")) {
                setError("Erro ao " + (isSubscribed ? "desativar" : "ativar") + " notificações: " + err.message);
            }
        } 
        
        setIsToggling(false);
    };

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-center justify-between">
                <div>
                     <p className="text-sm font-semibold">Notificações Push</p>
                     <p className="text-xs mt-0.5">{error}</p>
                </div>
            </div>
        );
    }

    if (!isInitialized) {
        return (
            <div className="bg-slate-800 p-4 rounded-2xl flex items-center justify-between border border-slate-700/50">
                <div>
                    <h3 className="text-white font-medium text-sm flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        Inicializando Notificações...
                    </h3>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 p-4 rounded-2xl flex flex-col gap-3 border border-slate-700/50">
             <div className="flex items-start gap-3">
                 <div className={`p-2.5 rounded-xl shrink-0 border ${isSubscribed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                     {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                 </div>
                 
                 <div>
                     <h3 className="text-white font-bold text-sm">Alertas no Celular (PWA)</h3>
                     <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                         {isSubscribed 
                            ? "Seu dispositivo está registrado para receber notificações de novos eventos." 
                            : "Ative para receber alertas sonoros e banners direto neste dispositivo mesmo com o app fechado."}
                     </p>
                 </div>
             </div>

             <button
                 onClick={handleTogglePush}
                 disabled={isToggling}
                 className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                     isSubscribed 
                         ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600' 
                         : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20'
                 }`}
             >
                 {isToggling ? (
                     <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                 ) : isSubscribed ? (
                     'Desativar Alertas Neste Aparelho'
                 ) : (
                     'Ativar Notificações'
                 )}
             </button>
        </div>
    );
}
