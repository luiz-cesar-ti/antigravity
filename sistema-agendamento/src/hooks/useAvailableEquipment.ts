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

                // 1. Fetch all equipment for the unit
                const { data: allEquipment, error: equipError } = await supabase
                    .from('equipment')
                    .select('*')
                    .eq('unit', unit)
                    .abortSignal(controller.signal);

                if (equipError) throw equipError;

                // 2. Fetch active bookings that overlap with requested time
                const { data: bookings, error: bookingError } = await supabase
                    .from('bookings')
                    .select('equipment_id, quantity')
                    .eq('unit', unit)
                    .eq('booking_date', date)
                    .eq('status', 'active')
                    .lt('start_time', queryEndTime)
                    .gt('end_time', queryStartTime)
                    .abortSignal(controller.signal);

                if (bookingError) throw bookingError;

                // 3. Calculate availability
                const equipmentMap = new Map<string, AvailableEquipment>();

                allEquipment?.forEach((eq) => {
                    equipmentMap.set(eq.id, { ...eq, available_quantity: eq.total_quantity });
                });

                bookings?.forEach((booking) => {
                    const eq = equipmentMap.get(booking.equipment_id);
                    if (eq) {
                        eq.available_quantity -= booking.quantity;
                        if (eq.available_quantity < 0) eq.available_quantity = 0;
                    }
                });

                if (!controller.signal.aborted) {
                    setEquipments(Array.from(equipmentMap.values()));
                }

            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log('Availability check aborted');
                    setError('Tempo limite excedido. Tente novamente.');
                } else {
                    console.error('Error fetching availability details:', err);
                    setError('Erro ao carregar disponibilidade de equipamentos.');
                }
            } finally {
                // Always set loading false unless component unmounted
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
