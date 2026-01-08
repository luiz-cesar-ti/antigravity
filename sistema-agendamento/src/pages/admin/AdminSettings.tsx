import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Settings, Admin } from '../../types'; // Ensure Settings type exists and includes min_advance_time_hours
import { useAuth } from '../../contexts/AuthContext';
import { Save, Clock, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

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
            } catch (e) { }

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
            // Upsert settings for this unit
            // Assuming 'settings' table key is (unit) or we have ID.
            // Ideally we upsert based on unit.

            const payload = {
                unit: adminUser.unit,
                min_advance_time_enabled: settings.min_advance_time_enabled,
                min_advance_time_hours: settings.min_advance_time_hours,
                room_booking_enabled: settings.room_booking_enabled,
                updated_at: new Date().toISOString()
            };

            // Check if exists first to decide update vs insert if no ID (or rely on upsert with constraint)
            // Supabase .upsert() works if we have a primary key or unique constraint on 'unit'.
            // Schema check: settings table PK is id, but maybe unique constraint on unit?
            // If not, we should probably check existence.

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
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações da Unidade</h1>
                <p className="text-gray-500">Defina regras de agendamento para {adminUser.unit}.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 border border-gray-100">

                    <div className="space-y-6">
                        <div className="flex items-start pb-6 border-b border-gray-200">
                            <div className="flex items-center h-5">
                                <input
                                    id="room_booking_enabled"
                                    name="room_booking_enabled"
                                    type="checkbox"
                                    checked={settings.room_booking_enabled || false}
                                    onChange={(e) => setSettings({ ...settings, room_booking_enabled: e.target.checked })}
                                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="room_booking_enabled" className="font-medium text-gray-700">
                                    Habilitar Agendamento de Salas
                                </label>
                                <p className="text-gray-500">
                                    Se habilitado, os professores desta unidade verão a opção "Salas" no menu e poderão realizar agendamentos.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="min_time_enabled"
                                    name="min_time_enabled"
                                    type="checkbox"
                                    checked={settings.min_advance_time_enabled}
                                    onChange={(e) => setSettings({ ...settings, min_advance_time_enabled: e.target.checked })}
                                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="min_time_enabled" className="font-medium text-gray-700">
                                    Exigir Antecedência Mínima
                                </label>
                                <p className="text-gray-500">
                                    Se habilitado, os professores não poderão agendar equipamentos muito próximos do horário de uso.
                                </p>
                            </div>
                        </div>

                        <div className={`ml-7 transition-opacity duration-200 ${settings.min_advance_time_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                                Horas de Antecedência
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm w-32">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    name="hours"
                                    id="hours"
                                    min="1"
                                    max="720"
                                    value={settings.min_advance_time_hours}
                                    onChange={(e) => setSettings({ ...settings, min_advance_time_hours: parseInt(e.target.value) || 0 })}
                                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Ex: 24 horas = 1 dia antes.</p>
                        </div>
                    </div>





                    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Salvando...' : 'Salvar Regras'}
                        </button>
                    </div>
                </form>
            )}

            {/* PASSWORD CHANGE SECTION */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                    <div className="p-2 bg-primary-50 rounded-lg">
                        <KeyRound className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Alterar Minha Senha</h2>
                        <p className="text-sm text-gray-500">Atualize sua credencial de acesso.</p>
                    </div>
                </div>

                {passwordMessage && (
                    <div className={`mb-4 p-4 rounded-md flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {passwordMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <span className="font-medium text-sm">{passwordMessage.text}</span>
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Senha Atual</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                required
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border pr-10"
                                placeholder="Digite sua senha atual"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                            >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border pr-10"
                                    placeholder="Nova senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Confirmar</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={passwordData.confirmPassword}
                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border pr-10"
                                    placeholder="Repita a nova senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                        <span className="font-bold block mb-1">Requisitos:</span>
                        8+ caracteres, Letra Maiúscula, Letra Minúscula, Número e Símbolo (@$!%*?&).
                    </div>

                    <button
                        type="submit"
                        disabled={changingPassword}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
                    >
                        {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
