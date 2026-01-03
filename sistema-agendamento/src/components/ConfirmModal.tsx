import { AlertTriangle, X, HelpCircle, Trash2, UserMinus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'remove';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger',
    loading = false
}: ConfirmModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <Trash2 className="h-10 w-10 text-red-600" />;
            case 'remove':
                return <UserMinus className="h-10 w-10 text-orange-600" />;
            case 'warning':
                return <AlertTriangle className="h-10 w-10 text-amber-600" />;
            default:
                return <HelpCircle className="h-10 w-10 text-blue-600" />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'danger': return 'bg-red-50';
            case 'remove': return 'bg-orange-50';
            case 'warning': return 'bg-amber-50';
            default: return 'bg-blue-50';
        }
    };

    const getConfirmBtnClass = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-200';
            case 'remove': return 'bg-orange-600 hover:bg-orange-700 shadow-orange-200';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-200';
            default: return 'bg-primary-600 hover:bg-primary-700 shadow-primary-200';
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className={`relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 p-2 hover:bg-gray-50 rounded-xl"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-8 pt-10 flex flex-col items-center text-center">
                    {/* Icon Cloud */}
                    <div className={`h-20 w-20 rounded-3xl flex items-center justify-center mb-6 ${getIconBg()}`}>
                        {getIcon()}
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                        {title}
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed mb-8 px-2 font-medium">
                        {message}
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`w-full py-4 px-6 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 ${getConfirmBtnClass()}`}
                        >
                            {loading ? 'Processando...' : confirmText}
                        </button>

                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>

                {/* Decorative Accents */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
            </div>
        </div>
    );
}
