import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, BellOff, BellRing, Loader2, Smartphone, CheckCircle2 } from 'lucide-react';
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
                        // In some Next/Vite setups on Vercel, explicitly defining the service worker path helps
                        path: "/",
                        serviceWorkerParam: { scope: "/" },
                        serviceWorkerPath: "OneSignalSDKWorker.js"
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
            <div className="space-y-5">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl text-white shadow-lg shadow-red-200">
                        <BellOff className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Notificações Push</h2>
                        <p className="text-sm text-gray-500 font-medium">Alertas no celular</p>
                    </div>
                </div>
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm font-medium">
                    {error}
                </div>
            </div>
        );
    }

    if (!isInitialized) {
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-200">
                        <Bell className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Notificações Push</h2>
                        <p className="text-sm text-gray-500 font-medium">Carregando...</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inicializando serviço de notificações...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-xl text-white shadow-lg transition-all duration-500 ${
                    isSubscribed 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200' 
                        : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200'
                }`}>
                    {isSubscribed ? <BellRing className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900">Notificações Push</h2>
                    <p className="text-sm text-gray-500 font-medium">Alertas no celular via PWA</p>
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-5 rounded-2xl border transition-all duration-500 ${
                isSubscribed 
                    ? 'bg-emerald-50/80 border-emerald-200' 
                    : 'bg-amber-50/80 border-amber-200'
            }`}>
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${isSubscribed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {isSubscribed ? <CheckCircle2 className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    </div>
                    <div>
                        <p className={`font-bold text-sm ${isSubscribed ? 'text-emerald-900' : 'text-amber-900'}`}>
                            {isSubscribed ? 'Notificações ativas neste dispositivo' : 'Notificações desativadas'}
                        </p>
                        <p className={`text-xs mt-1 leading-relaxed ${isSubscribed ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isSubscribed 
                                ? 'Você receberá alertas sonoros e banners quando um professor realizar um novo agendamento, mesmo com o app fechado.' 
                                : 'Ative para receber alertas sonoros e banners direto neste dispositivo quando novos agendamentos forem criados.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={handleTogglePush}
                disabled={isToggling}
                className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] disabled:opacity-60 ${
                    isSubscribed 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 hover:-translate-y-0.5'
                }`}
            >
                {isToggling ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                ) : isSubscribed ? (
                    <><BellOff className="w-4 h-4" /> Desativar Alertas Neste Aparelho</>
                ) : (
                    <><BellRing className="w-4 h-4" /> Ativar Notificações</>
                )}
            </button>
        </div>
    );
}
