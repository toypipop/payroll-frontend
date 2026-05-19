import React, { useState, useRef, useEffect } from "react";
import type { CSSProperties, HTMLAttributes, MouseEvent } from "react";

interface TimeFieldProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onChange"> {
    label?: string;
    value?: string | Date | null;
    onChange: (value: string) => void;
    error?: string;
}

const TimeField = ({ label, value, onChange, error, ...props }: TimeFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const parseTime = (timeStr: string | Date | null | undefined) => {
        if (!timeStr) return { hours: 9, minutes: 0 };
        
        if (typeof timeStr === 'string') {
            if (timeStr.includes('T') || timeStr.includes('-')) {
                const date = new Date(timeStr);
                if (!isNaN(date.getTime())) {
                    return { hours: date.getHours(), minutes: date.getMinutes() };
                }
            }
            const parts = timeStr.split(":");
            if (parts.length >= 2) {
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                return { hours: h || 0, minutes: m || 0 };
            }
        }
        
        if (timeStr instanceof Date && !isNaN(timeStr.getTime())) {
            return { hours: timeStr.getHours(), minutes: timeStr.getMinutes() };
        }
        
        return { hours: 9, minutes: 0 };
    };

    const { hours, minutes } = parseTime(value);

    const to12Hour = (h: number) => {
        if (h === 0) return 12;
        if (h > 12) return h - 12;
        return h;
    };

    const to24Hour = (h: number, p: string) => {
        if (p === "AM") {
            return h === 12 ? 0 : h;
        } else {
            return h === 12 ? 12 : h + 12;
        }
    };

    const displayHours = to12Hour(hours);
    const period = hours >= 12 ? "PM" : "AM";
    const displayValue = value
        ? `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`
        : "";

    const handleHoursChange = (newHours: number) => {
        const h24 = to24Hour(newHours, period);
        const newTime = `${String(h24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        onChange(newTime);
    };

    const handleMinutesChange = (newMinutes: number) => {
        const newTime = `${String(hours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
        onChange(newTime);
    };

    const handlePeriodChange = (newPeriod: string) => {
        const h24 = to24Hour(displayHours, newPeriod);
        const newTime = `${String(h24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        onChange(newTime);
    };

    useEffect(() => {
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const styles: Record<string, CSSProperties> = {
        container: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "20px",
            position: "relative",
            fontFamily: "inherit",
        },
        label: {
            fontSize: "13px",
            fontWeight: 500,
            color: "#64748b",
        },
        trigger: {
            height: "40px",
            padding: "0 14px",
            borderRadius: "8px",
            border: `1px solid ${error ? "#ef4444" : isOpen ? "#6259ca" : "#e2e8f0"}`,
            fontSize: "14px",
            outline: "none",
            fontFamily: "inherit",
            backgroundColor: "#f8fafc",
            color: value ? "#1e293b" : "#94a3b8",
            boxSizing: "border-box",
            width: "100%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "border-color 0.2s, box-shadow 0.2s",
        },
        errorText: {
            fontSize: "12px",
            color: "#ef4444",
            marginTop: "2px",
        },
        dropdown: {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            padding: "12px",
            zIndex: 50,
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            width: "fit-content",
            minWidth: "auto",
        },
        column: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
        },
        columnLabel: {
            fontSize: "11px",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
        },
        scrollArea: {
            height: "160px",
            overflowY: "auto",
            width: "56px",
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 transparent",
        },
        timeOption: {
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            color: "#334155",
            cursor: "pointer",
            borderRadius: "6px",
            transition: "background-color 0.15s",
        },
        timeOptionSelected: {
            backgroundColor: "#6259ca",
            color: "#ffffff",
        },
        periodContainer: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
        },
        periodBtn: {
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            cursor: "pointer",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "#e2e8f0",
            backgroundColor: "#ffffff",
            color: "#64748b",
            transition: "all 0.15s",
        },
        periodBtnActive: {
            backgroundColor: "#6259ca",
            color: "#ffffff",
            borderColor: "#6259ca",
        },
    };

    const hoursList = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
    const minutesList = Array.from({ length: 12 }, (_, i) => i * 5);

    return (
        <div style={styles.container} ref={containerRef}>
            {label && <label style={styles.label}>{label}</label>}
            <button
                type="button"
                style={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                {...props}
            >
                <span>{displayValue || "Select time"}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.column}>
                        <span style={styles.columnLabel}>Hour</span>
                        <div style={styles.scrollArea}>
                            {hoursList.map((h) => (
                                <div
                                    key={h}
                                    style={{
                                        ...styles.timeOption,
                                        ...(displayHours === h ? styles.timeOptionSelected : {}),
                                    }}
                                    onClick={() => handleHoursChange(h)}
                                    onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
                                        if (displayHours !== h) e.currentTarget.style.backgroundColor = "#f1f5f9";
                                    }}
                                    onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
                                        if (displayHours !== h) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    {String(h).padStart(2, "0")}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={styles.column}>
                        <span style={styles.columnLabel}>Min</span>
                        <div style={styles.scrollArea}>
                            {minutesList.map((m) => (
                                <div
                                    key={m}
                                    style={{
                                        ...styles.timeOption,
                                        ...(minutes === m ? styles.timeOptionSelected : {}),
                                    }}
                                    onClick={() => handleMinutesChange(m)}
                                    onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
                                        if (minutes !== m) e.currentTarget.style.backgroundColor = "#f1f5f9";
                                    }}
                                    onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
                                        if (minutes !== m) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    {String(m).padStart(2, "0")}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={styles.column}>
                        <span style={styles.columnLabel}>Period</span>
                        <div style={styles.periodContainer}>
                            {["AM", "PM"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    style={{
                                        ...styles.periodBtn,
                                        ...(period === p ? styles.periodBtnActive : {}),
                                    }}
                                    onClick={() => handlePeriodChange(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {error && <span style={styles.errorText}>{error}</span>}

            <style>{`
                div[style*="scrollArea"]::-webkit-scrollbar {
                    width: 4px;
                }
                div[style*="scrollArea"]::-webkit-scrollbar-track {
                    background: transparent;
                }
                div[style*="scrollArea"]::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
};

export default TimeField;
