
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
    recipient_role: string;
    unit?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, role } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!user || role !== 'admin') return;

        const adminUser = user as { unit: string }; // Custom Admin type has unit
        const adminUnit = adminUser.unit;

        // 1. Initial Fetch (Last 7 days)
        const fetchNotifications = async () => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            let query = supabase
                .from('notifications')
                .select('*')
                .eq('recipient_role', 'admin')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            // Filter by Admin Unit
            if (adminUnit) {
                query = query.eq('unit', adminUnit);
            }

            const { data } = await query;

            if (data) {
                setNotifications(data);
            }
        };

        fetchNotifications();

        // 2. Realtime Subscription
        // Note: 'filter' in postgres_changes is limited to simple equality on columns.
        // We can filter by unit if the column exists.
        // 2. Realtime Subscription
        console.log('Setting up realtime subscription for Admin:', adminUnit);

        const subscription = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: adminUnit ? `unit=eq.${adminUnit}` : "recipient_role=eq.admin"
                },
                (payload) => {
                    console.log('Notification Realtime Event:', payload);

                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new as Notification;

                        // Client-side filtering for Unit
                        if (adminUnit && newNotif.unit && newNotif.unit !== adminUnit) {
                            return;
                        }

                        // Avoid duplicates
                        setNotifications((prev) => {
                            if (prev.some(n => n.id === newNotif.id)) return prev;
                            return [newNotif, ...prev];
                        });

                        // Optional: Play sound
                        // const audio = new Audio('/notification.mp3'); 
                        // audio.play().catch(() => {});
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotif = payload.new as Notification;

                        // Handle updates (like read status changes)
                        setNotifications((prev) => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
                    }
                }
            )
            .subscribe((status) => {
                console.log('Notification Subscription Status:', status);
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [user, role]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        try {
            // Using RPC to bypass potential RLS issues
            const { error } = await supabase.rpc('mark_notification_read', { p_id: id });

            if (error) {
                console.error('Error marking notification as read (RPC):', error);

                // Fallback attempt
                await supabase.from('notifications').update({ read: true }).eq('id', id);
            }
        } catch (err) {
            console.error('Exception marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            // Using RPC to bypass potential RLS issues
            const { error } = await supabase.rpc('mark_all_notifications_read', {
                p_unit: (user as any)?.unit || null
            });

            if (error) {
                console.error('Error marking ALL notifications as read (RPC):', error);
            } else {
                console.log('Successfully marked all notifications as read via RPC');
            }
        } catch (err) {
            console.error('Exception marking ALL notifications as read:', err);
        }
    };

    const removeNotification = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            // Use RPC to delete notification (bypass RLS)
            const { error } = await supabase.rpc('delete_notification', { p_id: id });

            if (error) {
                console.error('Error deleting notification (RPC):', error);
                // Revert optimistic update only if error
                setNotifications(prev => [...prev]); // Trigger re-fetch or handle error
            }
        } catch (err) {
            console.error('Exception deleting notification:', err);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
