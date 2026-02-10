import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Equipment } from '../types';

export interface AvailableEquipment extends Equipment {
    available_quantity: number;
}

export function useAvailableEquipment(unit: string, date: string, startTime: string, endTime: string) {
    const [equipments, setEquipments] = useState<AvailableEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!unit || !date || !startTime || !endTime) {
            setEquipments([]);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const fetchAvailability = async () => {
            setLoading(true);
            setError('');

            try {
                // Ensure time has seconds for Postgres compatibility
                const queryStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
                const queryEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

                // Call the secure RPC instead of querying bookings directly
                const { data, error: rpcError } = await supabase
                    .rpc('get_available_equipment', {
                        p_unit: unit,
                        p_date: date,
                        p_start_time: queryStartTime,
                        p_end_time: queryEndTime
                    })
                    .abortSignal(controller.signal);

                if (rpcError) throw rpcError;

                if (!controller.signal.aborted) {
                    // The RPC returns a JSONB array, parse it if needed
                    const parsed = Array.isArray(data) ? data : (data || []);
                    setEquipments(parsed as AvailableEquipment[]);
                }

            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Availability check aborted');
                    return;
                }

                console.warn('Availability Check: chamada ignorada (parâmetros incompletos ou erro de rede)', {
                    message: err?.message || err,
                    params: { unit, date, startTime, endTime }
                });

                if (!controller.signal.aborted) {
                    setError('Erro ao carregar disponibilidade de equipamentos.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
                clearTimeout(timeoutId);
            }
        };

        fetchAvailability();

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [unit, date, startTime, endTime]);

    return { equipments, loading, error };
}
