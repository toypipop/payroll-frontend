import React, { forwardRef, useState, useRef, useEffect, useCallback } from "react";
import type { CSSProperties, Ref, SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";

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
    containerStyle?: CSSProperties;
    value?: unknown;
    onChange?: (
        event: React.ChangeEvent<HTMLSelectElement> | { target: { name?: string; value: string } }
    ) => void;
    searchable?: boolean;
    required?: boolean;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
    ({ label, options = [], error, placeholder, style, containerStyle, value, onChange, onBlur, name, disabled, searchable = true, required, ...props }, ref) => {
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

        const borderColor = error ? "var(--status-danger)" : open ? "var(--control-accent)" : "var(--border-muted)";

        const dropdownList = open && createPortal(
            <div
                id="select-portal-dropdown"
                style={{
                    position: "absolute",
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-muted)",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.07)",
                    zIndex: 99999,
                    maxHeight: "220px",
                    padding: "4px",
                }}
            >
                {searchable && (
                    <div style={{ padding: "4px 4px 8px" }}>
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
                            style={{
                                width: "100%",
                                height: "36px",
                                padding: "0 12px",
                                fontSize: "13.5px",
                                borderRadius: "8px",
                                border: "1px solid var(--border-muted)",
                                backgroundColor: "var(--surface-subtle)",
                                color: "var(--text-strong)",
                            }}
                        />
                    </div>
                )}

                <div style={{ maxHeight: searchable ? "168px" : "212px", overflowY: "auto" }}>
                    {filteredOptions.length === 0 ? (
                        <div style={{ padding: "10px 12px", fontSize: "13px", color: "var(--text-subtle)", textAlign: "center" }}>
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
                                    style={{
                                        padding: "9px 12px",
                                        fontSize: "13.5px",
                                        borderRadius: "7px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        backgroundColor: isSelected ? "var(--control-accent-soft)" : isHov ? "#f8f7ff" : "transparent",
                                        color: isSelected ? "var(--control-accent)" : "var(--text-strong)",
                                        fontWeight: isSelected ? "600" : "400",
                                        transition: "background-color 0.1s",
                                    }}
                                >
                                    <span>{opt.name}</span>
                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6259ca" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <div style={{ marginBottom: "20px", width: "100%", ...containerStyle }}>
                {label && (
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "var(--text-muted)", marginBottom: "6px" }}>
                        {label}
                        {required && <span style={{ color: "var(--status-danger)" }}> *</span>}
                    </label>
                )}

                <div style={{ position: "relative", ...style }}>
                    {/* Hidden native select for RHF ref-based control */}
                    <select
                        ref={setRefs}
                        name={name}
                        disabled={disabled}
                        onBlur={onBlur}
                        onChange={() => {}}
                        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
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
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            height: "40px",
                            padding: "0 14px",
                            fontSize: "14px",
                            borderRadius: "8px",
                            border: `1px solid ${borderColor}`,
                            backgroundColor: disabled ? "var(--surface-hover)" : "var(--surface-subtle)",
                            color: isEmpty ? "var(--text-subtle)" : "var(--text-strong)",
                            cursor: disabled ? "not-allowed" : "pointer",
                            userSelect: "none",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                            boxSizing: "border-box",
                            boxShadow: open ? "0 0 0 3px rgba(98,89,202,0.12)" : "none",
                        }}
                    >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayText}</span>
                        <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke={error ? "var(--status-danger)" : open ? "var(--control-accent)" : "var(--text-subtle)"}
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, marginLeft: "8px", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>

                    {/* Dropdown rendered in portal to escape overflow/stacking context */}
                    {dropdownList}
                </div>

                {error && <div style={{ fontSize: "12px", color: "var(--status-danger)", marginTop: "4px" }}>{String(error)}</div>}
            </div>
        );
    },
);

SelectField.displayName = "SelectField";

export default SelectField;
