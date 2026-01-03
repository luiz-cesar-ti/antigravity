import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
    id: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
    recipient_role: string;
}

export function AdminNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = async () => {
        setLoading(true);
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('recipient_role', 'admin')
            .order('created_at', { ascending: false })
            .limit(50); // Limit to last 50 for performance

        if (filter === 'unread') {
            query = query.eq('read', false);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching notifications:', error);
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

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

        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .in('id', unreadIds);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
                    <p className="text-gray-500">Histórico de alertas do sistema</p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Marcar todas como lidas
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${filter === 'all' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${filter === 'unread' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Não Lidas
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p>Nenhuma notificação encontrada.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {notifications.map((notification) => (
                            <li
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/40' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />

                                        <div className="flex-1 min-w-0">
                                            {notification.link ? (
                                                <Link
                                                    to={notification.link}
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline block mb-1"
                                                >
                                                    {notification.message}
                                                </Link>
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900 mb-1">{notification.message}</p>
                                            )}

                                            <div className="flex items-center text-xs text-gray-500">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {format(new Date(notification.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                            </div>
                                        </div>
                                    </div>

                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="ml-4 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors"
                                        >
                                            Marcar como lida
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
