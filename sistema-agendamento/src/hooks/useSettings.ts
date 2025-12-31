import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Settings } from '../types';

export function useSettings(unit: string) {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!unit) {
            setSettings(null);
            return;
        }

        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('unit', unit)
                .single();

            if (!error && data) {
                setSettings(data as Settings);
            } else {
                setSettings(null); // No settings found or error
            }
            setLoading(false);
        };

        fetchSettings();
    }, [unit]);

    return { settings, loading };
}
