import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Settings, Admin } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Clock, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, Settings as SettingsIcon, Shield, Zap } from 'lucide-react';

export function AdminSettings() {
    const { user } = useAuth();
    const adminUser = user as Admin;

    const [settings, setSettings] = useState<Partial<Settings>>({
        min_advance_time_enabled: true,
        min_advance_time_hours: 24,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(passwordData.newPassword)) {
            setPasswordMessage({ type: 'error', text: 'A senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo.' });
            return;
        }

        setChangingPassword(true);

        try {
            // Get session token safely
            let adminToken = '';
            try {
                const session = localStorage.getItem('admin_session');
                if (session) {
                    const admin = JSON.parse(session);
                    adminToken = admin.session_token || '';
                }
            } catch { }

            if (!adminToken) throw new Error('Sessão inválida.');

            const { error } = await supabase.rpc('change_own_password', {
                p_admin_token: adminToken,
                p_current_password: passwordData.currentPassword,
                p_new_password: passwordData.newPassword
            });

            if (error) throw error;

            setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err: any) {
            console.error('Password change error:', err);
            setPasswordMessage({ type: 'error', text: err.message || 'Erro ao alterar senha.' });
        } finally {
            setChangingPassword(false);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            if (!adminUser?.unit) return;

            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('unit', adminUser.unit)
                .single();

            if (data) {
                setSettings(data);
            } else if (error && error.code === 'PGRST116') {
                // No settings found row, use defaults
                console.log('Using default settings');
            }
            setLoading(false);
        };

        fetchSettings();
    }, [adminUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminUser?.unit) return;

        setSaving(true);
        setMessage(null);

        try {
            const payload = {
                unit: adminUser.unit,
                min_advance_time_enabled: settings.min_advance_time_enabled,
                min_advance_time_hours: settings.min_advance_time_hours,
                room_booking_enabled: settings.room_booking_enabled, // Preserve existing value
                updated_at: new Date().toISOString()
            };

            const { data: existing } = await supabase.from('settings').select('id').eq('unit', adminUser.unit).single();

            let error;
            if (existing) {
                const { error: err } = await supabase
                    .from('settings')
                    .update(payload)
                    .eq('id', existing.id);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('settings')
                    .insert([payload]);
                error = err;
            }

            if (error) throw error;

            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setSaving(false);
        }
    };

    if (!adminUser?.unit) {
        return (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                Você é um administrador geral (sem unidade específica) ou existe um erro de perfil.
                A configuração de regras é específica por unidade.
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações</h1>
                <p className="text-gray-500 mt-2 text-lg">Gerencie as preferências da unidade <span className="font-bold text-primary-600">{adminUser.unit}</span>.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
                    <p className="font-medium animate-pulse">Carregando preferências...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                    {/* LEFT COLUMN: Equipment Rules */}
                    <div className="space-y-6">
                        <form onSubmit={handleSave} className="bg-white rounded-2xl lg:rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-gray-100 border border-gray-100 hover:shadow-2xl hover:shadow-primary-900/5 transition-all duration-500 group relative overflow-hidden">
                            {/* Decorative Background Blob */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-transparent rounded-bl-[100%] -mr-16 -mt-16 opacity-50 pointer-events-none" />

                            <div className="relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3.5 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-primary-200 shadow-primary-500/30 group-hover:scale-110 transition-transform duration-500">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">Regras de Antecedência</h2>
                                        <p className="text-sm text-gray-500 font-medium">Controle de agendamento de recursos</p>
                                    </div>
                                </div>

                                {message && (
                                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-red-50 text-red-900 border border-red-100'}`}>
                                        {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
                                        <span className="font-bold text-sm">{message.text}</span>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {/* Custom Toggle Switch */}
                                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 hover:border-primary-100 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 pr-4">
                                                <label htmlFor="min_time_enabled" className={`font-bold text-base mb-1 block cursor-pointer transition-colors ${settings.min_advance_time_enabled ? 'text-primary-700' : 'text-gray-700'}`}>
                                                    Exigir Antecedência Mínima
                                                </label>
                                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                                    Impede que professores façam agendamentos de última hora para equipamentos.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    id="min_time_enabled"
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.min_advance_time_enabled}
                                                    onChange={(e) => setSettings({ ...settings, min_advance_time_enabled: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        {/* Collapsible Content */}
                                        <div className={`grid transition-all duration-300 ease-out ${settings.min_advance_time_enabled ? 'grid-rows-[1fr] opacity-100 mt-5 pt-5 border-t border-gray-200/50' : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-none'}`}>
                                            <div className="overflow-hidden">
                                                <label htmlFor="hours" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                                    Tempo Mínimo (Horas)
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative rounded-xl shadow-sm w-32 group/input">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Clock className="h-4 w-4 text-gray-400 group-focus-within/input:text-primary-500 transition-colors" />
                                                        </div>
                                                        <input
                                                            type="number"
                                                            name="hours"
                                                            id="hours"
                                                            min="1"
                                                            max="720"
                                                            value={settings.min_advance_time_hours}
                                                            onChange={(e) => setSettings({ ...settings, min_advance_time_hours: parseInt(e.target.value) || 0 })}
                                                            className="block w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none font-bold text-gray-900 transition-all sm:text-sm"
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                                                        {settings.min_advance_time_hours === 24 ? '1 dia' : `${settings.min_advance_time_hours} horas`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg shadow-primary-200 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Additional info card or placeholder could go here */}
                        <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20 group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-300" />
                                    Segurança e Política
                                </h3>
                                <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
                                    As alterações feitas nesta página afetam imediatamente todos os professores vinculados à unidade <strong>{adminUser.unit}</strong>. Certifique-se de comunicar mudanças importantes nas regras de antecedência.
                                </p>
                            </div>
                            {/* Bg decoration */}
                            <SettingsIcon className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-700 ease-in-out" />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Password */}
                    <div>
                        <div className="bg-white rounded-2xl lg:rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-gray-100 border border-gray-100 hover:shadow-2xl hover:shadow-primary-900/5 transition-all duration-500 group relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3.5 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-xl text-white shadow-lg shadow-pink-200 shadow-fuchsia-500/30 group-hover:scale-110 transition-transform duration-500">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Segurança da Conta</h2>
                                    <p className="text-sm text-gray-500 font-medium">Atualize suas credenciais de acesso</p>
                                </div>
                            </div>

                            {passwordMessage && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-red-50 text-red-900 border border-red-100'}`}>
                                    {passwordMessage.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
                                    <span className="font-bold text-sm">{passwordMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 ml-1">Senha Atual</label>
                                    <div className="relative group/input">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            required
                                            value={passwordData.currentPassword}
                                            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="block w-full rounded-2xl border-gray-200 bg-gray-50 focus:bg-white text-gray-900 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm p-4 border pr-12 outline-none transition-all placeholder:text-gray-400 font-medium"
                                            placeholder="Digite sua senha atual"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-fuchsia-600 transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 ml-1">Nova Senha</label>
                                        <div className="relative group/input">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                required
                                                value={passwordData.newPassword}
                                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="block w-full rounded-2xl border-gray-200 bg-gray-50 focus:bg-white text-gray-900 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm p-4 border pr-12 outline-none transition-all placeholder:text-gray-400 font-medium"
                                                placeholder="Nova senha"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-fuchsia-600 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 ml-1">Confirmar</label>
                                        <div className="relative group/input">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                required
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="block w-full rounded-2xl border-gray-200 bg-gray-50 focus:bg-white text-gray-900 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 sm:text-sm p-4 border pr-12 outline-none transition-all placeholder:text-gray-400 font-medium"
                                                placeholder="Repita a senha"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-fuchsia-600 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[11px] text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-3">
                                    <Shield className="h-4 w-4 text-fuchsia-500 shrink-0" />
                                    <div>
                                        <span className="font-bold text-gray-700 block mb-1">Requisitos de Segurança:</span>
                                        Mínimo de 8 caracteres contendo Letra Maiúscula, Letra Minúscula, Número e Símbolo (@$!%*?&).
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-lg shadow-fuchsia-200 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                                    >
                                        {changingPassword ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Alterando...
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound className="h-4 w-4 mr-2" />
                                                Alterar Senha de Acesso
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
