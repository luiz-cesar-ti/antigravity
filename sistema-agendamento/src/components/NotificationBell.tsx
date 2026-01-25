
import { useState, useRef, useEffect } from 'react';
import { Bell, CalendarPlus, UserPlus, AlertCircle, XCircle, Home } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getNotificationIcon = (message: string) => {
    const msg = message.toUpperCase();

    // 1. PRIORIDADE MÁXIMA: Cancelamentos/Exclusões (Sempre X Vermelho)
    if (msg.includes('CANCELADO') || msg.includes('EXCLUÍDO') || msg.includes('EXCLUIDO')) {
        return <div className="p-1.5 bg-red-100 rounded-lg shrink-0"><XCircle className="h-3.5 w-3.5 text-red-600" /></div>;
    }

    // 2. Regra SALA (Criação - Dourado/Home)
    if (msg.includes(' DE SALA')) {
        return <div className="p-1.5 bg-amber-50 rounded-lg shrink-0"><Home className="h-3.5 w-3.5 text-amber-500" /></div>;
    }

    // 3. Regra EQUIPAMENTO/RECORRENTE (Criação - Verde/Calendar)
    if (msg.includes('RECORRENTE') || msg.includes('NOVO AGENDAMENTO') || msg.includes('AGENDAMENTO REALIZADO') || msg.includes('EQUIPAMENTO')) {
        return <div className="p-1.5 bg-green-100 rounded-lg shrink-0"><CalendarPlus className="h-3.5 w-3.5 text-green-600" /></div>;
    }

    // 4. Outros modelos
    if (msg.includes('USUÁRIO') || msg.includes('USUARIO') || msg.includes('CADASTRADO')) {
        return <div className="p-1.5 bg-purple-100 rounded-lg shrink-0"><UserPlus className="h-3.5 w-3.5 text-purple-600" /></div>;
    }
    if (msg.includes('ATENÇÃO') || msg.includes('ERRO')) {
        return <div className="p-1.5 bg-amber-100 rounded-lg shrink-0"><AlertCircle className="h-3.5 w-3.5 text-amber-600" /></div>;
    }
    return <div className="p-1.5 bg-gray-100 rounded-lg shrink-0"><Bell className="h-3.5 w-3.5 text-gray-600" /></div>;
};

const getMessageStyle = (message: string) => {
    const msg = message.toUpperCase();

    // 1. Cancelamentos (Red)
    if (msg.includes('CANCELADO') || msg.includes('EXCLUÍDO') || msg.includes('EXCLUIDO')) {
        return 'text-red-700 font-bold';
    }
    // 2. Salas (Amber)
    if (msg.includes(' DE SALA')) {
        return 'text-amber-700 font-bold';
    }
    // 3. Equipamentos/Recorrentes (Green)
    if (msg.includes('RECORRENTE') || msg.includes('NOVO AGENDAMENTO') || msg.includes('AGENDAMENTO REALIZADO') || msg.includes('EQUIPAMENTO')) {
        return 'text-green-700 font-bold';
    }
    return 'text-gray-900';
};

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
                                        <div className="mr-3 mt-0.5">
                                            {getNotificationIcon(notification.message)}
                                        </div>
                                        <div className="flex-1 pr-4">
                                            {notification.link ? (
                                                <Link
                                                    to={notification.link}
                                                    onClick={() => handleNotificationClick()}
                                                    className={`block text-sm font-medium hover:underline ${getMessageStyle(notification.message)}`}
                                                >
                                                    {notification.message}
                                                </Link>
                                            ) : (
                                                <p className={`text-sm font-medium ${getMessageStyle(notification.message)}`}>{notification.message}</p>
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
