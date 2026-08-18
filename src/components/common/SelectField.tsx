import React, { forwardRef, useState, useRef, useEffect, useCallback } from "react";
import type { CSSProperties, Ref, SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

export interface SelectOption {
    id: unknown;
    name: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
    label?: string;
    options?: SelectOption[];
    error?: unknown;
    placeholder?: string;
    style?: CSSProperties;
    containerClassName?: string;
    containerStyle?: CSSProperties;
    value?: unknown;
    onChange?: (
        event: React.ChangeEvent<HTMLSelectElement> | { target: { name?: string; value: string } }
    ) => void;
    searchable?: boolean;
    required?: boolean;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
    ({ label, options = [], error, placeholder, style, containerStyle, containerClassName = "", value, onChange, onBlur, name, disabled, searchable = true, required, ...props }, ref) => {
        const [open, setOpen] = useState(false);
        const [hovered, setHovered] = useState<unknown>(null);
        const [searchTerm, setSearchTerm] = useState("");
        const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
        const [internalValue, setInternalValue] = useState(value ?? "");
        const triggerRef = useRef<HTMLDivElement | null>(null);
        const hiddenRef = useRef<HTMLSelectElement | null>(null);
        const searchInputRef = useRef<HTMLInputElement | null>(null);
        const selectedItemRef = useRef<HTMLDivElement | null>(null);
        const pollIntervalRef = useRef<number | null>(null);

        // Merge RHF ref with our internal ref
        const setRefs = (el: HTMLSelectElement | null) => {
            hiddenRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = el;
        };

        // Update internal state on value change
        useEffect(() => {
            if (value !== undefined) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setInternalValue(String(value));
            }
        }, [value]);

        // Watch hidden ref in uncontrolled mode
        useEffect(() => {
            if (value === undefined && hiddenRef.current) {
                // Initial sync from ref
                const refVal = hiddenRef.current.value;
                window.requestAnimationFrame(() => {
                    setInternalValue(refVal ?? "");
                });

                // Poll for changes from React Hook Form's setValue()
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = setInterval(() => {
                    if (hiddenRef.current) {
                        const currentRefVal = hiddenRef.current.value;
                        const nextValue = currentRefVal ?? "";
                        setInternalValue((prev) => (prev === nextValue ? prev : nextValue));
                    }
                }, 50);

                return () => {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                };
            }
        }, [value]);

        const displayValue = value !== undefined ? value : internalValue;
        const selectedOption = options.find((o) => String(o.id) === String(displayValue));
        const displayText = selectedOption ? selectedOption.name : (placeholder || `Select ${label || ""}`);
        const isEmpty = !selectedOption;
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const filteredOptions = normalizedSearch
            ? options.filter((opt) => String(opt.name ?? "").toLowerCase().includes(normalizedSearch))
            : options;

        // Recalculate dropdown position from trigger rect
        const updatePosition = useCallback(() => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY + 6,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }, []);

        const handleOpen = () => {
            if (disabled) return;
            updatePosition();
            setOpen((p) => {
                const nextOpen = !p;
                if (nextOpen) setSearchTerm("");
                return nextOpen;
            });
        };

        // Close on outside click and reposition on scroll/resize
        useEffect(() => {
            if (!open) return;

            const handleClose = (e: MouseEvent) => {
                if (
                    triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                    !document.getElementById("select-portal-dropdown")?.contains(e.target as Node)
                ) {
                    setOpen(false);
                }
            };
            const handleReposition = () => {
                updatePosition();
            };
            document.addEventListener("mousedown", handleClose);
            window.addEventListener("scroll", handleReposition, true);
            window.addEventListener("resize", handleReposition);
            window.requestAnimationFrame(() => {
                searchInputRef.current?.focus();
                selectedItemRef.current?.scrollIntoView({ block: "center" });
            });
            return () => {
                document.removeEventListener("mousedown", handleClose);
                window.removeEventListener("scroll", handleReposition, true);
                window.removeEventListener("resize", handleReposition);
            };
        }, [open, updatePosition]);

        const handleSelect = (optId: unknown) => {
            const strVal = String(optId);
            setInternalValue(strVal);
            setSearchTerm("");

            // Update hidden native select so RHF can read it via ref
            if (hiddenRef.current) {
                hiddenRef.current.value = strVal;
            }

            if (onChange) {
                const eventTarget = hiddenRef.current ?? { name, value: strVal };
                onChange({
                    target: eventTarget,
                    currentTarget: eventTarget,
                    type: "change",
                } as React.ChangeEvent<HTMLSelectElement>);
            }
            setOpen(false);
        };

        const borderClass = error ? "border-danger" : open ? "border-control" : "border-line-muted";

        const dropdownList = open && createPortal(
            <div
                id="select-portal-dropdown"
                className="absolute z-[99999] max-h-[220px] rounded-[10px] border border-line-muted bg-card p-1 shadow-[0_8px_24px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.07)]"
                // measured from the trigger when the dropdown opens, so it cannot be a class
                style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            >
                {searchable && (
                    <div className="p-[4px_4px_8px]">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    setOpen(false);
                                }
                            }}
                            placeholder={`Search ${label || "options"}`}
                            className="w-full h-[36px] p-[0_12px] text-[13.5px] rounded-[8px] border border-line-muted bg-surface text-strong"
                        />
                    </div>
                )}

                <div className={`overflow-y-auto ${searchable ? "max-h-[168px]" : "max-h-[212px]"}`}>
                    {filteredOptions.length === 0 ? (
                        <div className="p-[10px_12px] text-[13px] text-subtle text-center">
                            {options.length === 0 ? "No options" : "No matches found"}
                        </div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = String(opt.id) === String(displayValue);
                            const isHov = hovered === opt.id;
                            return (
                                <div
                                    key={String(opt.id)}
                                    ref={isSelected ? selectedItemRef : undefined}
                                    onMouseEnter={() => setHovered(opt.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.id); }}
                                    className={twMerge(
                                        "flex cursor-pointer items-center justify-between rounded-[7px] px-3 py-[9px] text-[13.5px] font-normal text-strong transition-colors duration-100",
                                        isHov && "bg-primary-subtle",
                                        isSelected && "bg-control-soft font-semibold text-control",
                                    )}
                                >
                                    <span>{opt.name}</span>
                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="stroke-control" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>,
            document.body
        );

        return (
            <div className={twMerge("mb-5 w-full", containerClassName)} style={containerStyle}>
                {label && (
                    <label className="block text-[13px] font-medium text-muted mb-[6px]">
                        {label}
                        {required && <span className="text-danger"> *</span>}
                    </label>
                )}

                <div className="relative" style={style}>
                    {/* Hidden native select for RHF ref-based control */}
                    <select
                        ref={setRefs}
                        name={name}
                        disabled={disabled}
                        onBlur={onBlur}
                        onChange={() => {}}
                        className="absolute opacity-0 pointer-events-none w-[0px] h-[0px]"
                        tabIndex={-1}
                        {...props}
                    >
                        <option value="" />
                        {options.map((opt) => (
                            <option key={String(opt.id)} value={String(opt.id)}>{opt.name}</option>
                        ))}
                    </select>

                    {/* Custom trigger button */}
                    <div
                        ref={triggerRef}
                        onClick={handleOpen}
                        onKeyDown={(e) => {
                            if (disabled) return;
                            if (["Enter", " ", "ArrowDown"].includes(e.key)) {
                                e.preventDefault();
                                if (!open) {
                                    updatePosition();
                                    setSearchTerm("");
                                    setOpen(true);
                                }
                            }
                            if (e.key === "Escape") {
                                setOpen(false);
                            }
                        }}
                        role="button"
                        tabIndex={disabled ? -1 : 0}
                        aria-expanded={open}
                        aria-haspopup="listbox"
                        className={twMerge(
                            "box-border flex h-10 select-none items-center justify-between rounded-lg border px-3.5 text-sm transition-[border-color,box-shadow] duration-150",
                            borderClass,
                            disabled ? "cursor-not-allowed bg-hover" : "cursor-pointer bg-surface",
                            isEmpty ? "text-subtle" : "text-strong",
                            open && "shadow-[0_0_0_3px_rgba(15,118,110,0.12)]",
                        )}
                    >
                        <span className="overflow-hidden truncate whitespace-nowrap">{displayText}</span>
                        <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke={error ? "var(--status-danger)" : open ? "var(--control-accent)" : "var(--text-subtle)"}
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className={`ml-2 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>

                    {/* Dropdown rendered in portal to escape overflow/stacking context */}
                    {dropdownList}
                </div>

                {error && <div className="text-[12px] text-danger mt-[4px]">{String(error)}</div>}
            </div>
        );
    },
);

SelectField.displayName = "SelectField";

export default SelectField;
