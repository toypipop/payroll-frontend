import { twMerge } from "tailwind-merge";
import React, { useState, useRef, useEffect } from "react";
import type { HTMLAttributes, MouseEvent } from "react";

interface TimeFieldProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onChange"> {
    label?: string;
    value?: string | Date | null;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
}

const TimeField = ({ label, value, onChange, error, required, ...props }: TimeFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedHourRef = useRef<HTMLDivElement | null>(null);
    const selectedMinuteRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        if (!isOpen) return;
        selectedHourRef.current?.scrollIntoView({ block: "center" });
        selectedMinuteRef.current?.scrollIntoView({ block: "center" });
    }, [isOpen]);

    const hoursList = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
    const minutesList = Array.from({ length: 12 }, (_, i) => i * 5);

    return (
        <div className="relative mb-5 flex flex-col gap-1.5 font-[inherit]" ref={containerRef}>
            {label && (
                <label className="text-[13px] font-medium text-muted">
                    {label}
                    {required && <span className="text-danger"> *</span>}
                </label>
            )}
            <button
                type="button"
                className={twMerge(
                    "flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-surface px-3.5 font-[inherit] text-sm outline-none transition-colors",
                    error ? "border-danger" : isOpen ? "border-control" : "border-line-muted",
                    value ? "text-strong" : "text-subtle",
                )}
                onClick={() => setIsOpen(!isOpen)}
                {...props}
            >
                <span>{displayValue || "Select time"}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute inset-x-0 top-full z-50 mt-1 flex w-fit justify-center gap-3 rounded-xl border border-line-muted bg-card p-3 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                    <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Hour</span>
                        <div className="h-40 w-14 overflow-y-auto [scrollbar-color:var(--border-input)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-line-input [&::-webkit-scrollbar-track]:bg-transparent">
                            {hoursList.map((h) => (
                                <div
                                    key={h}
                                    ref={displayHours === h ? selectedHourRef : undefined}
                                    className={twMerge(
                                        "flex h-8 cursor-pointer items-center justify-center rounded-md text-sm text-secondary transition-colors duration-150 hover:bg-hover",
                                        displayHours === h && "bg-control text-card hover:bg-control",
                                    )}
                                    onClick={() => handleHoursChange(h)}
                                >
                                    {String(h).padStart(2, "0")}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Min</span>
                        <div className="h-40 w-14 overflow-y-auto [scrollbar-color:var(--border-input)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-line-input [&::-webkit-scrollbar-track]:bg-transparent">
                            {minutesList.map((m) => (
                                <div
                                    key={m}
                                    ref={minutes === m ? selectedMinuteRef : undefined}
                                    className={twMerge(
                                        "flex h-8 cursor-pointer items-center justify-center rounded-md text-sm text-secondary transition-colors duration-150 hover:bg-hover",
                                        minutes === m && "bg-control text-card hover:bg-control",
                                    )}
                                    onClick={() => handleMinutesChange(m)}
                                >
                                    {String(m).padStart(2, "0")}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Period</span>
                        <div className="flex flex-col gap-1.5">
                            {["AM", "PM"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={twMerge(
                                        "cursor-pointer rounded-md border border-line-muted bg-card px-3.5 py-2 text-xs font-semibold text-muted transition-all duration-150",
                                        period === p && "border-control bg-control text-card",
                                    )}
                                    onClick={() => handlePeriodChange(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {error && <span className="mt-0.5 text-xs text-danger">{error}</span>}

        </div>
    );
};

export default TimeField;
