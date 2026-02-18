import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, Check, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import './MobileRoomSelector.styles.css';

export interface Classroom {
    id: string;
    name: string;
    unit: string;
    class_morning?: string;
    class_afternoon?: string;
}

interface MobileRoomSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options: Classroom[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function MobileRoomSelector({
    value,
    onChange,
    options,
    placeholder = "Selecione o local...",
    disabled = false,
    className
}: MobileRoomSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedOption = useMemo(() =>
        options.find(opt => opt.name === value),
        [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.name.toLowerCase().includes(lowerTerm) ||
            opt.class_morning?.toLowerCase().includes(lowerTerm) ||
            opt.class_afternoon?.toLowerCase().includes(lowerTerm)
        );
    }, [options, searchTerm]);

    const handleOpen = () => {
        if (disabled) return;
        setIsOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchTerm(''); // Reset search on close
        document.body.style.overflow = '';
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        handleClose();
    };

    // Helper to format the display text for the input field (compact version)
    const getDisplayValue = () => {
        if (!selectedOption) return '';
        return selectedOption.name;
    };

    return (
        <>
            {/* Fake Input Trigger */}
            <div
                className={clsx(
                    "relative cursor-pointer", // Allow parent to control width/layout via className
                    disabled && "opacity-60 cursor-not-allowed"
                )}
                onClick={handleOpen}
            >
                <input
                    type="text"
                    readOnly
                    value={getDisplayValue()}
                    placeholder={placeholder}
                    className={clsx(className, "pointer-events-none")} // pointer-events-none to let div handle click
                    disabled={disabled}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
            </div>

            {/* Bottom Sheet / Modal Portal */}
            {isOpen && createPortal(
                <div className="mrs-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
                    <div className="mrs-container">
                        {/* Header */}
                        <div className="mrs-header">
                            <div className="mrs-drag-handle" />
                            <div className="flex items-center justify-between w-full mb-3">
                                <h3 className="text-lg font-bold text-gray-900">Selecione o Local</h3>
                                <button onClick={handleClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Buscar sala ou turma..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus // Focus search when opened
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="mrs-list">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => (
                                    <div
                                        key={option.id}
                                        className={clsx(
                                            "mrs-card-item",
                                            // Alternating colors based on index
                                            index % 2 === 0 ? "mrs-card-blue" : "mrs-card-gray",
                                            selectedOption?.id === option.id && "selected"
                                        )}
                                        onClick={() => handleSelect(option.name)}
                                    >
                                        <div className="flex-1">
                                            <div className="mrs-card-header">
                                                <span className="mrs-card-title">{option.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {selectedOption?.id === option.id ? (
                                                        <Check className="h-5 w-5 text-primary-600 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>

                                            {(option.class_morning || option.class_afternoon) && (
                                                <div className="mrs-card-content">
                                                    <div className="mrs-card-details">
                                                        {option.class_morning && (
                                                            <div className="mrs-detail-row">
                                                                <span className="mrs-badge mrs-badge-morning flex-shrink-0">Manhã</span>
                                                                <span className="mrs-value truncate">Turma: <strong>{option.class_morning}</strong></span>
                                                            </div>
                                                        )}
                                                        {option.class_afternoon && (
                                                            <div className="mrs-detail-row">
                                                                <span className="mrs-badge mrs-badge-afternoon flex-shrink-0">Tarde</span>
                                                                <span className="mrs-value truncate">Turma: <strong>{option.class_afternoon}</strong></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    Nenhum local encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
