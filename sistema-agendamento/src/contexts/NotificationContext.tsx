
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
        const subscription = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_role=eq.admin${adminUnit ? `&unit=eq.${adminUnit}` : ''}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new as Notification;
                        setNotifications((prev) => [newNotif, ...prev]);
                        // Optional: Play sound
                        // const audio = new Audio('/notification.mp3'); 
                        // audio.play().catch(() => {});
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotif = payload.new as Notification;
                        setNotifications((prev) => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, role]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // Batch update is efficient
        // We only update the ones that are unread to save DB writes, but logic is simpler this way
        // actually for postgres RLS we might simply update all unread.
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
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
