import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Settings, Admin } from '../../types'; // Ensure Settings type exists and includes min_advance_time_hours
import { useAuth } from '../../contexts/AuthContext';
import { Save, Clock } from 'lucide-react';

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
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
