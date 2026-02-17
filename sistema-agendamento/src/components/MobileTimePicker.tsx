import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import './MobileTimePicker.css';

interface MobileTimePickerProps {
    value: string;
    onChange: (e: any) => void;
    name: string;
    className?: string;
    placeholder?: string;
}

function isAndroidMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return /android/i.test(ua) && /mobile/i.test(ua);
}

function isIPhone(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPod/.test(navigator.userAgent);
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2);

function ScrollWheel({
    items,
    selectedIndex,
    onSelect,
}: {
    items: string[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}) {
    const wheelRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const el = wheelRef.current;
        if (!el) return;
        el.scrollTop = selectedIndex * ITEM_HEIGHT;
    }, []);

    const handleScroll = useCallback(() => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        isScrollingRef.current = true;

        scrollTimeoutRef.current = setTimeout(() => {
            const el = wheelRef.current;
            if (!el) return;
            const index = Math.round(el.scrollTop / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
            el.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: 'smooth' });
            onSelect(clampedIndex);
            isScrollingRef.current = false;
        }, 80);
    }, [items.length, onSelect]);

    const handleItemClick = useCallback((index: number) => {
        const el = wheelRef.current;
        if (!el) return;
        el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
        onSelect(index);
    }, [onSelect]);

    const paddingHeight = PADDING_ITEMS * ITEM_HEIGHT;

    return (
        <div className="mtp-wheel" ref={wheelRef} onScroll={handleScroll}>
            <div className="mtp-wheel-inner">
                <div style={{ height: paddingHeight }} />
                {items.map((item, i) => {
                    const isSelected = i === selectedIndex;
                    const isNear = Math.abs(i - selectedIndex) === 1;
                    return (
                        <div
                            key={i}
                            className="mtp-item"
                            data-selected={isSelected}
                            data-near={isNear}
                            onClick={() => handleItemClick(i)}
                        >
                            {item}
                        </div>
                    );
                })}
                <div style={{ height: paddingHeight }} />
            </div>
        </div>
    );
}

export function MobileTimePicker({ value, onChange, name, className, placeholder }: MobileTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hourIndex, setHourIndex] = useState(0);
    const [minuteIndex, setMinuteIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const useCustomPicker = isAndroidMobile();
    const isIos = isIPhone();

    const parseValue = useCallback((val: string) => {
        if (!val) return { h: 0, m: 0 };
        const parts = val.split(':');
        return {
            h: parseInt(parts[0] || '0', 10),
            m: parseInt(parts[1] || '0', 10),
        };
    }, []);

    const handleOpen = useCallback(() => {
        if (!useCustomPicker) return;

        let h, m;
        if (value) {
            const parsed = parseValue(value);
            h = parsed.h;
            m = parsed.m;
        } else {
            const now = new Date();
            h = now.getHours();
            m = now.getMinutes();
        }

        setHourIndex(h);
        setMinuteIndex(m);
        setIsOpen(true);
        document.body.style.overflow = 'hidden';
    }, [useCustomPicker, value, parseValue]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        document.body.style.overflow = '';
    }, []);

    const handleConfirm = useCallback(() => {
        const newValue = `${HOURS[hourIndex]}:${MINUTES[minuteIndex]}`;
        onChange({ target: { name, value: newValue } });
        handleClose();
    }, [hourIndex, minuteIndex, onChange, name, handleClose]);

    const handleReset = useCallback(() => {
        setHourIndex(0);
        setMinuteIndex(0);
    }, []);

    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    }, [handleClose]);

    const displayValue = value || '';

    if (!useCustomPicker) {
        if (isIos) {
            // Extract layout classes to align placeholder
            const layoutClasses = className?.match(/\b(pl|pr|py|px|text|font|sm:pl|sm:pr|sm:text|sm:font)-[^\s]+/g)?.join(' ') || '';

            return (
                <div className="relative w-full">
                    <input
                        ref={inputRef}
                        type="time"
                        name={name}
                        value={value}
                        onChange={onChange}
                        className={clsx(className, !value && 'text-transparent')}
                    />
                    {!value && (
                        <div
                            className={clsx(
                                "absolute inset-0 flex items-center pointer-events-none text-gray-400",
                                layoutClasses
                            )}
                        >
                            {placeholder || "hh/mm"}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <input
                ref={inputRef}
                type="time"
                name={name}
                value={value}
                onChange={onChange}
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
                placeholder="HH:MM"
                className={className}
                style={{ caretColor: 'transparent' }}
            />

            {isOpen && createPortal(
                <div className="mtp-overlay" onClick={handleOverlayClick}>
                    <div className="mtp-container">
                        <div className="mtp-wheels">
                            <div className="mtp-fade-top" />
                            <div className="mtp-fade-bottom" />
                            <div className="mtp-highlight" />

                            <ScrollWheel
                                items={HOURS}
                                selectedIndex={hourIndex}
                                onSelect={setHourIndex}
                            />

                            <span className="mtp-separator">:</span>

                            <ScrollWheel
                                items={MINUTES}
                                selectedIndex={minuteIndex}
                                onSelect={setMinuteIndex}
                            />
                        </div>

                        <div className="mtp-header">
                            <button
                                type="button"
                                className="mtp-btn-reset"
                                onClick={handleReset}
                            >
                                Redefinir
                            </button>
                            <button
                                type="button"
                                className="mtp-btn-confirm"
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
