
import { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell() {
    const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleBellClick = () => {
        if (!isOpen && unreadCount > 0) {
            markAllAsRead();
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (id: string) => {
        await markAsRead(id);
        setIsOpen(false);
    };

    return (
        <div className="relative mr-4" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className="relative p-2 text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-all rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-95"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in duration-200">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
                        <span className="text-sm font-semibold text-gray-700">Notificações</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                            >
                                <Check className="h-3 w-3" />
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                Nenhuma notificação recente.
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`relative px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-4">
                                            {notification.link ? (
                                                <Link
                                                    to={notification.link}
                                                    onClick={() => handleNotificationClick(notification.id)}
                                                    className="block text-sm font-medium text-gray-900 hover:underline"
                                                >
                                                    {notification.message}
                                                </Link>
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <span className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {notifications.length > 5 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center rounded-b-md">
                            <Link to="/admin/notifications" className="text-xs text-primary-600 hover:text-primary-800 font-medium">Ver todas</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
