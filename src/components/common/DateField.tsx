import React, { useState, useEffect, useRef } from "react";
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
        <div ref={containerRef} style={{ position: "relative" }}>
            <div
                onClick={() => setOpen((p) => !p)}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "6px", padding: "4px 10px", borderRadius: "8px",
                    border: `1px solid ${open ? "var(--control-accent)" : "var(--border-muted)"}`,
                    backgroundColor: "var(--surface-subtle)", fontSize: "13px", fontWeight: "500",
                    color: "var(--text-secondary)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                    boxShadow: open ? "0 0 0 3px rgba(98,89,202,0.12)" : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s", minWidth: "60px",
                }}
            >
                <span>{options.find((o) => String(o.value) === String(value))?.label ?? value}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke={open ? "var(--control-accent)" : "var(--text-subtle)"} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0,
                    minWidth: "100%", backgroundColor: "#fff",
                    border: "1px solid var(--border-muted)", borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.07)",
                    zIndex: 9999, maxHeight: "180px", overflowY: "auto", padding: "4px",
                }}>
                    {options.map((opt) => {
                        const isSel = String(opt.value) === String(value);
                        const isHov = hovered === opt.value;
                        return (
                            <div key={opt.value}
                                ref={isSel ? selectedRef : undefined}
                                onMouseEnter={() => setHovered(opt.value)}
                                onMouseLeave={() => setHovered(null)}
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                                style={{
                                    padding: "7px 10px", fontSize: "13px", borderRadius: "7px",
                                    cursor: "pointer", display: "flex", alignItems: "center",
                                    justifyContent: "space-between",
                                    backgroundColor: isSel ? "var(--control-accent-soft)" : isHov ? "#f8f7ff" : "transparent",
                                    color: isSel ? "var(--control-accent)" : "var(--text-strong)",
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

interface DateFieldProps {
    label?: string;
    error?: string;
    value?: string | Date | null;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    id?: string;
    name?: string;
    required?: boolean;
}

const DateField = React.forwardRef<DatePicker, DateFieldProps>(({ label, error, value, onChange, id, required }, ref) => {
    const selectedDate = (() => {
        if (value && typeof value === "string" && value !== "") {
            const date = new Date(value + "T00:00:00");
            return Number.isNaN(date.getTime()) ? null : date;
        }

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        return null;
    })();

    const handleDateChange = (date: Date | null) => {
        if (date && !Number.isNaN(date.getTime())) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            const formatted = `${yyyy}-${mm}-${dd}`;
            if (onChange) onChange(formatted);
        } else if (onChange) {
            onChange("");
        }
    };

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

    return (
        <div style={styles.container}>
            {label && (
                <label htmlFor={id} style={styles.label}>
                    {label}
                    {required && <span style={{ color: "var(--status-danger)" }}> *</span>}
                </label>
            )}

            <DatePicker
                ref={ref}
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                id={id}
                className={`custom-date-input ${error ? 'error' : ''}`}
                placeholderText="Select date"
                autoComplete="off"
                renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px 10px" }}>
                        <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}
                            style={{ background: "none", border: "none", cursor: prevMonthButtonDisabled ? "not-allowed" : "pointer", color: prevMonthButtonDisabled ? "var(--border-input)" : "var(--control-accent)", fontSize: "16px", fontWeight: "bold", padding: "0 4px", lineHeight: 1 }}>
                            {"\u2039"}
                        </button>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
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
                            style={{ background: "none", border: "none", cursor: nextMonthButtonDisabled ? "not-allowed" : "pointer", color: nextMonthButtonDisabled ? "var(--border-input)" : "var(--control-accent)", fontSize: "16px", fontWeight: "bold", padding: "0 4px", lineHeight: 1 }}>
                            {"\u203a"}
                        </button>
                    </div>
                )}
            />

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
                .custom-date-input:focus {
                    border-color: var(--control-accent);
                    box-shadow: 0 0 0 3px rgba(98,89,202,0.12);
                }
                .custom-date-input.error {
                    border-color: var(--status-danger);
                }

                .react-datepicker {
                    font-family: inherit;
                    border-radius: 12px;
                    border: 1px solid var(--border-muted);
                    box-shadow: 0 8px 24px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.07);
                    padding: 4px;
                }
                .react-datepicker__header {
                    background-color: var(--bg-card);
                    border-bottom: 1px solid var(--surface-hover);
                    border-top-left-radius: 12px;
                    border-top-right-radius: 12px;
                    padding-bottom: 10px;
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
                    background-color: #ede9fd !important;
                    border-radius: 6px;
                    color: var(--control-accent);
                }
                .react-datepicker__current-month {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .react-datepicker__navigation-icon::before {
                    border-color: var(--control-accent);
                }
            `}</style>
        </div>
    );
});

DateField.displayName = "DateField";

export default DateField;
