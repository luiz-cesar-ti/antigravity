
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell() {
    const { unreadCount, notifications, markAllAsRead } = useNotifications();
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
        if (!isOpen) {
            // User is opening the bell. Mark everything as read/seen.
            if (unreadCount > 0) {
                markAllAsRead();
            }
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async () => {
        // Already marked as read by opening, but specific logic for link is fine
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className={`relative p-2.5 transition-all rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-95 border-2 ${unreadCount > 0
                    ? 'bg-primary-600 text-white border-primary-400 hover:bg-primary-700 animate-pulse-subtle shadow-primary-200'
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-primary-200'
                    }`}
            >
                <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'fill-current' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white ring-2 ring-white shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
                        <span className="text-sm font-semibold text-gray-700">Notificações</span>
                        {/* Status indicator instead of button since it's auto-read */}
                        <span className="text-[10px] text-gray-400 font-medium">
                            {unreadCount === 0 ? 'Todas lidas' : 'Marcando como lidas...'}
                        </span>
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
                                                    onClick={() => handleNotificationClick()}
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
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Always show View More if there are notifications */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center rounded-b-md">
                            <Link
                                to="/admin/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-primary-600 hover:text-primary-800 font-medium w-full block"
                            >
                                Ver mais
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
