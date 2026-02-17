import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import './MobileDatePicker.css';

interface MobileDatePickerProps {
    value: string;
    onChange: (e: any) => void;
    name: string;
    min?: string;
    className?: string;
    required?: boolean;
}

function isAndroidMobile(): boolean {
    return /android/i.test(ua) && /mobile/i.test(ua);
}

export function MobileDatePicker({ value, onChange, name, min, className, required }: MobileDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? parseISO(value) : null);

    // Initial ref as undefined to match strict types
    const inputRef = useRef<HTMLInputElement>(null);

    const useCustomPicker = isAndroidMobile();

    useEffect(() => {
        if (value) {
            const date = parseISO(value);
            setSelectedDate(date);
            // Only update viewDate if menu is closed (to not jump while user navigates)
            if (!isOpen) {
                setViewDate(date);
            }
        }
    }, [value, isOpen]);

    const handleOpen = useCallback(() => {
        if (!useCustomPicker) return;

        // When opening, ensure we show the selected month or current month
        if (selectedDate) {
            setViewDate(selectedDate);
        } else {
            setViewDate(new Date());
        }

        setIsOpen(true);
        document.body.style.overflow = 'hidden';
    }, [useCustomPicker, selectedDate]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        document.body.style.overflow = '';
    }, []);

    const handleConfirm = useCallback(() => {
        if (selectedDate) {
            const newValue = format(selectedDate, 'yyyy-MM-dd');
            onChange({ target: { name, value: newValue } });
        } else if (!required) {
            onChange({ target: { name, value: '' } });
        }
        handleClose();
    }, [selectedDate, onChange, name, required, handleClose]);

    const handleReset = useCallback(() => {
        setSelectedDate(null);
        // Don't close immediately, let user see it's cleared or re-select
    }, []);

    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    }, [handleClose]);

    const nextMonth = () => setViewDate(addMonths(viewDate, 1));
    const prevMonth = () => setViewDate(subMonths(viewDate, 1));

    const displayValue = value ? format(parseISO(value), 'dd/MM/yyyy') : '';

    // Calendar Generation
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const minDate = min ? parseISO(min) : null;

    // Check strict native fallback
    if (!useCustomPicker) {
        return (
            <input
                ref={inputRef}
                type="date"
                name={name}
                value={value}
                onChange={onChange}
                min={min}
                required={required}
                className={className}
            />
        );
    }

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                name={name}
                value={displayValue}
                readOnly
                onClick={handleOpen}
                placeholder="DD/MM/AAAA"
                className={className}
                style={{ caretColor: 'transparent' }}
            />

            {isOpen && createPortal(
                <div className="mdp-overlay" onClick={handleOverlayClick}>
                    <div className="mdp-container">
                        <div className="mdp-header">
                            <button onClick={prevMonth} className="mdp-nav-btn">
                                <ChevronLeft size={24} />
                            </button>
                            <span className="mdp-title">
                                {format(viewDate, "MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                            <button onClick={nextMonth} className="mdp-nav-btn">
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <div className="mdp-weekdays">
                            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                                <div key={day} className="mdp-weekday">{day}</div>
                            ))}
                        </div>

                        <div className="mdp-days">
                            {calendarDays.map((day, idx) => {
                                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                                const isCurrentMonth = isSameMonth(day, monthStart);
                                const isDayToday = isToday(day);

                                let isDisabled = false;
                                if (minDate) {
                                    // Compare start of days to avoid time issues
                                    isDisabled = isBefore(startOfDay(day), startOfDay(minDate));
                                }

                                if (!isCurrentMonth) {
                                    return <div key={idx} className="mdp-day empty"></div>;
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={`mdp-day ${isSelected ? 'selected' : ''} ${isDayToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
                                        onClick={() => !isDisabled && setSelectedDate(day)}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mdp-footer">
                            <button
                                type="button"
                                className="mdp-btn-reset"
                                onClick={handleReset}
                            >
                                Redefinir
                            </button>
                            <button
                                type="button"
                                className="mdp-btn-confirm"
                                onClick={handleConfirm}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
