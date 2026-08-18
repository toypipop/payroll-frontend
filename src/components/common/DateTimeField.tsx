import React, { useState, useRef, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import DatePicker from "react-datepicker";
import { twMerge } from "tailwind-merge";
import "react-datepicker/dist/react-datepicker.css";

const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface CalendarOption {
    value: string | number;
    label: string;
}

interface CalendarSelectProps {
    value: string | number;
    options: CalendarOption[];
    onChange: (value: string | number) => void;
}

const CalendarSelect = ({ value, options, onChange }: CalendarSelectProps) => {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<string | number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => { if (!containerRef.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler, true);
        return () => document.removeEventListener("mousedown", handler, true);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        selectedRef.current?.scrollIntoView({ block: "center" });
    }, [open]);

    return (
        <div ref={containerRef} className="relative">
            <div
                onClick={() => setOpen((p) => !p)}
                className={twMerge(
                    "flex min-w-[60px] cursor-pointer select-none items-center justify-between gap-1.5 whitespace-nowrap rounded-lg border border-line-muted bg-surface px-2.5 py-1 text-[13px] font-medium text-secondary transition-[border-color,box-shadow] duration-150",
                    open && "border-control shadow-[0_0_0_3px_rgba(15,118,110,0.12)]",
                )}
            >
                <span>{options.find((o) => String(o.value) === String(value))?.label ?? value}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke={open ? "var(--control-accent)" : "var(--text-subtle)"} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {open && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-[9999] max-h-[180px] min-w-full overflow-y-auto rounded-[10px] border border-line-muted bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.07)]">
                    {options.map((opt) => {
                        const isSel = String(opt.value) === String(value);
                        const isHov = hovered === opt.value;
                        return (
                            <div key={opt.value}
                                ref={isSel ? selectedRef : undefined}
                                onMouseEnter={() => setHovered(opt.value)}
                                onMouseLeave={() => setHovered(null)}
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                                className={twMerge(
                                    "flex cursor-pointer items-center justify-between rounded-[7px] px-2.5 py-[7px] text-[13px] font-normal text-strong transition-colors duration-100",
                                    isHov && "bg-primary-subtle",
                                    isSel && "bg-control-soft font-semibold text-control",
                                )}>
                                <span>{opt.label}</span>
                                {isSel && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="stroke-control" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const toLocalISO = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface DateTimeFieldProps {
    label?: string;
    error?: string;
    value?: string | Date | null;
    onChange?: (value: string) => void;
    id?: string;
    required?: boolean;
}

const DateTimeField = React.forwardRef<DatePicker, DateTimeFieldProps>(({ label, error, value, onChange, id, required }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        // Capture phase: runs before our own option buttons (CalendarSelect)
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler, true);
        return () => document.removeEventListener("mousedown", handler, true);
    }, [isOpen]);

    const styles: Record<string, CSSProperties> = {
        container: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "20px",
        },
        label: {
            fontWeight: "500",
            fontSize: "13px",
            color: "var(--text-muted)",
        },
        error: {
            color: "var(--status-danger)",
            fontSize: "12px",
            marginTop: "2px",
            fontWeight: "500",
        }
    };

    const { timeHour, timeMinute } = useMemo(() => {
        if (!value) return { timeHour: 0, timeMinute: 0 };
        const d = new Date(value);
        if (isNaN(d.getTime())) return { timeHour: 0, timeMinute: 0 };
        return { timeHour: d.getHours(), timeMinute: Math.floor(d.getMinutes() / 5) * 5 };
    }, [value]);

    const handleHourChange = (h: string | number) => {
        const base = value && !isNaN(new Date(value).getTime()) ? new Date(value) : new Date();
        base.setHours(Number(h), timeMinute, 0, 0);
        onChange?.(toLocalISO(base));
    };

    const handleMinuteChange = (m: string | number) => {
        const base = value && !isNaN(new Date(value).getTime()) ? new Date(value) : new Date();
        base.setHours(timeHour, Number(m), 0, 0);
        onChange?.(toLocalISO(base));
    };

    const handleCalendarChange = (date: Date | null) => {
        if (!date) { onChange?.(""); return; }
        const merged = new Date(date);
        merged.setHours(timeHour, timeMinute, 0, 0);
        onChange?.(toLocalISO(merged));
    };

    return (
        <div ref={containerRef} style={styles.container}>
            {label && (
                <label htmlFor={id} style={styles.label}>
                    {label}
                    {required && <span className="text-danger"> *</span>}
                </label>
            )}

            <DatePicker
                ref={ref}
                selected={value && !isNaN(new Date(value).getTime()) ? new Date(value) : null}
                onChange={handleCalendarChange}
                dateFormat="yyyy-MM-dd HH:mm"
                id={id}
                className={`custom-date-input ${error ? 'error' : ''}`}
                placeholderText="Select date and time"
                autoComplete="off"
                shouldCloseOnSelect={false}
                open={isOpen}
                onInputClick={() => setIsOpen(true)}
                renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => (
                    <div className="custom-header-container">
                        <div className="nav-row">
                            <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}
                                className={`border-none bg-none px-1 text-base font-bold leading-none ${prevMonthButtonDisabled ? "cursor-not-allowed text-line-input" : "cursor-pointer text-control"}`}>
                                {"\u2039"}
                            </button>
                            <div className="selectors">
                                <CalendarSelect
                                    value={date.getFullYear()}
                                    options={YEARS.map((y) => ({ value: y, label: String(y) }))}
                                    onChange={(y) => changeYear(Number(y))}
                                />
                                <CalendarSelect
                                    value={MONTHS[date.getMonth()]}
                                    options={MONTHS.map((m) => ({ value: m, label: m }))}
                                onChange={(m) => changeMonth(MONTHS.indexOf(String(m)))}
                                />
                            </div>
                            <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}
                                className={`border-none bg-none px-1 text-base font-bold leading-none ${nextMonthButtonDisabled ? "cursor-not-allowed text-line-input" : "cursor-pointer text-control"}`}>
                                {"\u203a"}
                            </button>
                        </div>
                    </div>
                )}
            >
                <div className="time-row">
                    <span className="time-label">Time:</span>
                    <CalendarSelect
                        value={timeHour}
                        options={Array.from({ length: 24 }, (_, h) => ({ value: h, label: String(h).padStart(2, "0") }))}
                        onChange={handleHourChange}
                    />
                    <span className="text-subtle font-semibold">:</span>
                    <CalendarSelect
                        value={timeMinute}
                        options={Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, "0") }))}
                        onChange={handleMinuteChange}
                    />
                </div>
                <button
                    type="button"
                    className="confirm-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsOpen(false)}
                >
                    Done
                </button>
            </DatePicker>

            {error && <span style={styles.error}>{error}</span>}

            <style>{`
                .custom-date-input {
                    height: 40px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid var(--border-muted);
                    font-size: 14px;
                    outline: none;
                    width: 100%;
                    color: var(--text-strong);
                    background-color: var(--surface-subtle);
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .custom-date-input.error {
                    border-color: var(--status-danger);
                }
                .custom-date-input.error:focus {
                    border-color: var(--status-danger);
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
                }
                .custom-header-container {
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: #fff;
                    border-bottom: 1px solid var(--surface-hover);
                }
                .nav-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .selectors {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }
                .nav-btn {
                    display: none;
                }
                .react-datepicker__children-container {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                .time-row {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px 10px;
                    border-top: 1px dashed var(--border-muted);
                }
                .confirm-btn {
                    display: block;
                    width: calc(100% - 20px);
                    margin: 8px 10px 10px;
                    padding: 8px;
                    border: none;
                    border-radius: 8px;
                    background-color: var(--control-accent);
                    color: #fff;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .confirm-btn:hover {
                    background-color: var(--primary-hover);
                }
                .time-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                }
                .header-time-input {
                    border: 1px solid var(--border-input);
                    border-radius: 4px;
                    padding: 2px 4px;
                    font-size: 13px;
                    outline: none;
                    color: var(--text-secondary);
                    text-align: center; 
                    width: 90px; 
                    box-sizing: border-box; 
                }
                .header-time-input::-webkit-calendar-picker-indicator,
                .header-time-input::-webkit-clear-button {
                    display: none !important;
                    -webkit-appearance: none;
                    margin: 0;
                }
                .header-time-input {
                    appearance: none;
                    -moz-appearance: textfield;
                }
                .react-datepicker {
                    font-family: inherit;
                    border-radius: 12px;
                    border: 1px solid var(--border-muted);
                    box-shadow: 0 8px 24px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.07);
                }
                .react-datepicker__header {
                    background-color: var(--bg-card);
                    border-bottom: none;
                    padding: 0;
                }
                .react-datepicker__day--selected {
                    background-color: var(--control-accent) !important;
                    border-radius: 6px;
                }
                .react-datepicker__day:hover {
                    background-color: var(--control-accent-soft) !important;
                    border-radius: 6px;
                    color: var(--control-accent);
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: var(--primary-subtle) !important;
                    border-radius: 6px;
                    color: var(--control-accent);
                }
                .react-datepicker__navigation-icon::before {
                    border-color: var(--control-accent);
                }
            `}</style>
        </div>
    );
});

DateTimeField.displayName = "DateTimeField";

export default DateTimeField;
