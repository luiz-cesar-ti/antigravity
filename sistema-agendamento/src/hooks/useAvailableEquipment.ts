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

        const fetchAvailability = async () => {
            setLoading(true);
            setError('');

            try {
                // 1. Fetch all equipment for the unit
                const { data: allEquipment, error: equipError } = await supabase
                    .from('equipment')
                    .select('*')
                    .eq('unit', unit);

                if (equipError) throw equipError;

                // 2. Fetch active bookings that overlap with requested time
                // Overlap logic: (StartA < EndB) and (EndA > StartB)
                const { data: bookings, error: bookingError } = await supabase
                    .from('bookings')
                    .select('equipment_id, quantity')
                    .eq('unit', unit)
                    .eq('booking_date', date)
                    .eq('status', 'active')
                    .lt('start_time', endTime)
                    .gt('end_time', startTime);

                if (bookingError) throw bookingError;

                // 3. Calculate availability
                const equipmentMap = new Map<string, AvailableEquipment>();

                // Initialize with total quantity
                allEquipment?.forEach((eq) => {
                    equipmentMap.set(eq.id, { ...eq, available_quantity: eq.total_quantity });
                });

                // Subtract reserved quantities
                bookings?.forEach((booking) => {
                    const eq = equipmentMap.get(booking.equipment_id);
                    if (eq) {
                        eq.available_quantity -= booking.quantity;
                        // Clamp to 0 just in case
                        if (eq.available_quantity < 0) eq.available_quantity = 0;
                        equipmentMap.set(booking.equipment_id, eq);
                    }
                });

                setEquipments(Array.from(equipmentMap.values()));

            } catch (err: any) {
                console.error('Error fetching availability:', err);
                setError('Erro ao carregar disponibilidade de equipamentos.');
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [unit, date, startTime, endTime]);

    return { equipments, loading, error };
}
