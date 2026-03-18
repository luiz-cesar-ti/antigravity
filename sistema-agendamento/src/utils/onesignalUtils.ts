/**
 * Utility for managing OneSignal scheduled notification IDs.
 * Stores the notification IDs for scheduled reminders in localStorage
 * so they can be cancelled if the booking is deleted/cancelled.
 */

const STORAGE_KEY = 'onesignal_scheduled_notifications';

type NotificationMap = Record<string, string>; // bookingDisplayId -> onesignalNotificationId

function getNotificationMap(): NotificationMap {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveNotificationMap(map: NotificationMap): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * Store a scheduled notification ID for a booking (identified by display_id or booking ID).
 */
export function storeScheduledNotificationId(bookingKey: string, notificationId: string): void {
    const map = getNotificationMap();
    map[bookingKey] = notificationId;
    saveNotificationMap(map);
    console.log(`[Push] Stored notification ${notificationId} for booking ${bookingKey}`);
}

/**
 * Cancel a scheduled OneSignal notification for a booking.
 * Called when a booking is cancelled/deleted by professor or admin.
 */
export async function cancelScheduledNotification(bookingKey: string): Promise<void> {
    const map = getNotificationMap();
    const notificationId = map[bookingKey];
    
    if (!notificationId) {
        console.log(`[Push] No scheduled notification found for booking ${bookingKey}`);
        return;
    }

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

        // Remove from storage regardless of result
        delete map[bookingKey];
        saveNotificationMap(map);
    } catch (error) {
        console.error('[Push] Failed to cancel notification:', error);
        // Still remove from storage to avoid stale entries
        delete map[bookingKey];
        saveNotificationMap(map);
    }
}

/**
 * Cancel scheduled notifications for multiple booking keys.
 */
export async function cancelScheduledNotifications(bookingKeys: string[]): Promise<void> {
    await Promise.allSettled(bookingKeys.map(key => cancelScheduledNotification(key)));
}
