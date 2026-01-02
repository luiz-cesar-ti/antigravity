import { Mail, CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'email' | 'success';
}

export function SuccessModal({ isOpen, onClose, title, message, type = 'email' }: SuccessModalProps) {
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

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    {/* Icon Cloud */}
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-6 ${type === 'email' ? 'bg-blue-50' : 'bg-green-50'}`}>
                        {type === 'email' ? (
                            <Mail className="h-12 w-12 text-primary-600" />
                        ) : (
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        )}
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-3">
                        {title}
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${type === 'email'
                                ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-200'
                                : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                            }`}
                    >
                        Entendido
                    </button>
                </div>

                {/* Decorative Bottom Bar */}
                <div className={`h-2 w-full ${type === 'email' ? 'bg-primary-600' : 'bg-green-600'}`}></div>
            </div>
        </div>
    );
}
