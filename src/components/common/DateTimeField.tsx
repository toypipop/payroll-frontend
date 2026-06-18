import React, { useState, useRef, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import DatePicker from "react-datepicker";
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

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => { if (!containerRef.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            <div
                onClick={() => setOpen((p) => !p)}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "6px", padding: "4px 10px", borderRadius: "8px",
                    border: `1px solid ${open ? "#6259ca" : "#e2e8f0"}`,
                    backgroundColor: "#f8fafc", fontSize: "13px", fontWeight: "500",
                    color: "#334155", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                    boxShadow: open ? "0 0 0 3px rgba(98,89,202,0.12)" : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s", minWidth: "60px",
                }}
            >
                <span>{options.find((o) => String(o.value) === String(value))?.label ?? value}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke={open ? "#6259ca" : "#94a3b8"} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0,
                    minWidth: "100%", backgroundColor: "#fff",
                    border: "1px solid #e2e8f0", borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.07)",
                    zIndex: 9999, maxHeight: "180px", overflowY: "auto", padding: "4px",
                }}>
                    {options.map((opt) => {
                        const isSel = String(opt.value) === String(value);
                        const isHov = hovered === opt.value;
                        return (
                            <div key={opt.value}
                                onMouseEnter={() => setHovered(opt.value)}
                                onMouseLeave={() => setHovered(null)}
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                                style={{
                                    padding: "7px 10px", fontSize: "13px", borderRadius: "7px",
                                    cursor: "pointer", display: "flex", alignItems: "center",
                                    justifyContent: "space-between",
                                    backgroundColor: isSel ? "#f0effe" : isHov ? "#f8f7ff" : "transparent",
                                    color: isSel ? "#6259ca" : "#1e293b",
                                    fontWeight: isSel ? "600" : "400",
                                    transition: "background-color 0.1s",
                                }}>
                                <span>{opt.label}</span>
                                {isSel && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6259ca" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
}

const DateTimeField = React.forwardRef<DatePicker, DateTimeFieldProps>(({ label, error, value, onChange, id }, ref) => {
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
            color: "#64748b",
        },
        error: {
            color: "#ef4444",
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
        onChange?.(toLocalISO(date));
    };

    return (
        <div style={styles.container}>
            {label && <label htmlFor={id} style={styles.label}>{label}</label>}
            
            <DatePicker
                ref={ref}
                selected={value && !isNaN(new Date(value).getTime()) ? new Date(value) : null}
                onChange={handleCalendarChange}
                dateFormat="yyyy-MM-dd HH:mm"
                id={id}
                className={`custom-date-input ${error ? 'error' : ''}`}
                placeholderText="Select date and time"
                autoComplete="off"
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
                                style={{ background: "none", border: "none", cursor: prevMonthButtonDisabled ? "not-allowed" : "pointer", color: prevMonthButtonDisabled ? "#cbd5e1" : "#6259ca", fontSize: "16px", fontWeight: "bold", padding: "0 4px", lineHeight: 1 }}>
                                {"\u2039"}
                            </button>
                            <div className="selectors">
                                <CalendarSelect
                                    value={MONTHS[date.getMonth()]}
                                    options={MONTHS.map((m) => ({ value: m, label: m }))}
                                onChange={(m) => changeMonth(MONTHS.indexOf(String(m)))}
                                />
                                <CalendarSelect
                                    value={date.getFullYear()}
                                    options={YEARS.map((y) => ({ value: y, label: String(y) }))}
                                    onChange={(y) => changeYear(Number(y))}
                                />
                            </div>
                            <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}
                                style={{ background: "none", border: "none", cursor: nextMonthButtonDisabled ? "not-allowed" : "pointer", color: nextMonthButtonDisabled ? "#cbd5e1" : "#6259ca", fontSize: "16px", fontWeight: "bold", padding: "0 4px", lineHeight: 1 }}>
                                {"\u203a"}
                            </button>
                        </div>
                        
                        <div className="time-row">
                            <span className="time-label">Time:</span>
                            <CalendarSelect
                                value={timeHour}
                                options={Array.from({ length: 24 }, (_, h) => ({ value: h, label: String(h).padStart(2, "0") }))}
                                onChange={handleHourChange}
                            />
                            <span style={{ color: "#94a3b8", fontWeight: "600" }}>:</span>
                            <CalendarSelect
                                value={timeMinute}
                                options={Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, "0") }))}
                                onChange={handleMinuteChange}
                            />
                        </div>
                    </div>
                )}
            />

            {error && <span style={styles.error}>{error}</span>}

            <style>{`
                .custom-date-input {
                    height: 40px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    font-size: 14px;
                    outline: none;
                    width: 100%;
                    color: #1e293b;
                    background-color: #f8fafc;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .custom-date-input.error {
                    border-color: #ef4444;
                }
                .custom-date-input.error:focus {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
                }
                .custom-header-container {
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: #fff;
                    border-bottom: 1px solid #f1f5f9;
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
                .time-row {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    padding-top: 5px;
                    border-top: 1px dashed #e2e8f0;
                }
                .time-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748b;
                }
                .header-time-input {
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    padding: 2px 4px;
                    font-size: 13px;
                    outline: none;
                    color: #334155;
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
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 8px 24px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.07);
                }
                .react-datepicker__header {
                    background-color: #ffffff;
                    border-bottom: none;
                    padding: 0;
                }
                .react-datepicker__day--selected {
                    background-color: #6259ca !important;
                    border-radius: 6px;
                }
                .react-datepicker__day:hover {
                    background-color: #f0effe !important;
                    border-radius: 6px;
                    color: #6259ca;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: #ede9fd !important;
                    border-radius: 6px;
                    color: #6259ca;
                }
                .react-datepicker__navigation-icon::before {
                    border-color: #6259ca;
                }
            `}</style>
        </div>
    );
});

DateTimeField.displayName = "DateTimeField";

export default DateTimeField;
