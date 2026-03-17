import { useEffect, useState, useCallback, useRef } from 'react';
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
    const initAttemptedRef = useRef(false);

    // Only run for admin users
    if (role !== 'admin' && role !== 'super_admin') {
        return null;
    }

    // Helper: check OneSignal subscription status (the REAL source of truth)
    const checkSubscriptionStatus = useCallback(async (): Promise<boolean> => {
        try {
            const optedIn = await OneSignal.User.PushSubscription.optedIn;
            console.log("[OneSignal] optedIn status:", optedIn);
            return !!optedIn;
        } catch (e) {
            console.warn("[OneSignal] Could not check subscription:", e);
            return false;
        }
    }, []);

    // Helper: apply unit tag to current OneSignal user
    const applyUnitTag = useCallback(async () => {
        if (adminUser?.unit) {
            try {
                await OneSignal.User.addTag("unit", adminUser.unit);
                console.log("[OneSignal] Tag applied: unit =", adminUser.unit);
            } catch (e) {
                console.warn("[OneSignal] Failed to apply unit tag:", e);
            }
        }
    }, [adminUser?.unit]);

    useEffect(() => {
        let mounted = true;

        const initOneSignal = async () => {
            if (initAttemptedRef.current) return;
            initAttemptedRef.current = true;

            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
            if (!appId) {
                if (mounted) setError("Erro de configuração do sistema (App ID ausente).");
                return;
            }

            try {
                // @ts-ignore
                if (!window.OneSignal?.initialized) {
                    await OneSignal.init({
                        appId: appId,
                        allowLocalhostAsSecureOrigin: true,
                        // @ts-ignore
                        notifyButton: { enable: false },
                        path: "/",
                        serviceWorkerParam: { scope: "/" },
                        serviceWorkerPath: "OneSignalSDKWorker.js"
                    });
                }
                
                if (!mounted) return;

                if (adminUser?.id) {
                    await OneSignal.login(adminUser.id);
                    await applyUnitTag();
                }

                setIsInitialized(true);

                // Use OneSignal optedIn as source of truth (NOT Notification.permission)
                const status = await checkSubscriptionStatus();
                if (mounted) setIsSubscribed(status);

            } catch (err: any) {
                const errorMessage = err?.message || String(err);
                
                if (errorMessage.includes("already initialized") || errorMessage.includes("already-initialized")) {
                    if (mounted) {
                        setIsInitialized(true);
                        if (adminUser?.id) {
                            try {
                                await OneSignal.login(adminUser.id);
                                await applyUnitTag();
                            } catch (e) {
                                console.warn("[OneSignal] re-init login/tag:", e);
                            }
                        }
                        const status = await checkSubscriptionStatus();
                        setIsSubscribed(status);
                    }
                    return;
                }
                
                console.error("[OneSignal] Init error:", err);
                if (mounted) setError(`Falha ao inicializar notificações. Detalhe: ${errorMessage}`);
            }
        };

        initOneSignal();
        return () => { mounted = false; };
    }, [adminUser?.id]);

    const handleTogglePush = async () => {
        if (!isInitialized || isToggling) return;

        setIsToggling(true);
        setError(null);

        try {
            if (isSubscribed) {
                // ── DESATIVAR ──
                await OneSignal.User.PushSubscription.optOut();
                // Optimistic: set to false immediately (optOut succeeded)
                setIsSubscribed(false);
                console.log("[OneSignal] User opted OUT");
            } else {
                // ── ATIVAR ──
                // Request browser permission first
                if (OneSignal.Notifications) {
                    await OneSignal.Notifications.requestPermission();
                } else {
                    await OneSignal.Slidedown.promptPush();
                }

                // Explicitly opt-in to OneSignal subscription
                try {
                    await OneSignal.User.PushSubscription.optIn();
                    console.log("[OneSignal] User opted IN");
                } catch (e) {
                    console.warn("[OneSignal] optIn() call:", e);
                }

                // Re-login and tag
                if (adminUser?.id) {
                    try { await OneSignal.login(adminUser.id); } catch (e) { /* ignore */ }
                }
                await applyUnitTag();
                
                // Check actual status after a small delay to let SDK sync
                await new Promise(resolve => setTimeout(resolve, 500));
                const actualStatus = await checkSubscriptionStatus();
                setIsSubscribed(actualStatus);
            }
        } catch (err: any) {
            console.error("[OneSignal] Toggle error:", err);
            if (err?.message && !err.message.includes("cancelled")) {
                setError("Erro ao " + (isSubscribed ? "desativar" : "ativar") + " notificações.");
            }
            // On error, recheck actual status
            const actualStatus = await checkSubscriptionStatus();
            setIsSubscribed(actualStatus);
        } finally {
            setIsToggling(false);
        }
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
                                ? `Você receberá alertas sobre agendamentos da unidade ${adminUser?.unit || ''} quando um professor realizar um novo agendamento.` 
                                : 'Ative para receber alertas sonoros e banners direto neste dispositivo quando novos agendamentos forem criados.'}
                        </p>
                    </div>
                </div>
            </div>

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
