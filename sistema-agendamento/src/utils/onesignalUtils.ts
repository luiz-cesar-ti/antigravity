import { supabase } from '../services/supabase';

/**
 * Cancel a scheduled OneSignal notification for a booking.
 * Called when a booking is cancelled/deleted by professor or admin.
 */
export async function cancelScheduledNotification(bookingKey: string): Promise<void> {
    if (!bookingKey) return;
    
    // Fetch onesignal_id from the database
    let query = supabase.from('bookings').select('onesignal_id').not('onesignal_id', 'is', null);
    
    if (bookingKey.length === 36 && bookingKey.includes('-')) {
        query = query.eq('id', bookingKey);
    } else {
        query = query.eq('display_id', bookingKey);
    }

    const { data } = await query.limit(1);
    
    if (!data || data.length === 0 || !data[0].onesignal_id) {
        console.log(`[Push] No scheduled notification found for booking ${bookingKey} in DB`);
        return;
    }

    const notificationId = data[0].onesignal_id;
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
        console.warn('[Push] Missing OneSignal credentials, cannot cancel notification');
        return;
    }

    try {
        const response = await fetch(`https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${appId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${apiKey}`
            }
        });
        const result = await response.text();
        console.log(`[Push] Cancel notification ${notificationId}: ${response.status}`, result);
    } catch (error) {
        console.error('[Push] Failed to cancel notification:', error);
    }
}

/**
 * Cancel scheduled notifications for multiple booking UUIDs.
 */
export async function cancelScheduledNotifications(bookingIds: string[]): Promise<void> {
    if (!bookingIds || bookingIds.length === 0) return;
    
    const { data } = await supabase.from('bookings').select('onesignal_id').in('id', bookingIds).not('onesignal_id', 'is', null);
    
    if (!data || data.length === 0) return;
    
    const onesignalIds = Array.from(new Set(data.map(b => b.onesignal_id).filter(Boolean)));
    
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) return;

    for (const notificationId of onesignalIds) {
        try {
            await fetch(`https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${appId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${apiKey}`
                }
            });
            console.log(`[Push] Cancelled notification ${notificationId}`);
        } catch (error) {
            console.error('[Push] Failed to cancel notification:', error);
        }
    }
}
