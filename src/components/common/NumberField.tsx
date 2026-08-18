import React, { forwardRef, useState, useCallback } from "react";
import type { ChangeEvent, CSSProperties, InputHTMLAttributes } from "react";

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    label?: string;
    error?: unknown;
    style?: CSSProperties;
    containerStyle?: CSSProperties;
    value?: string | number;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
    (
        {
            label,
            placeholder,
            error,
            style,
            containerStyle,
            value,
            onChange,
            required,
            ...props
        },
        ref,
    ) => {
        const [internalValue, setInternalValue] = useState(value ?? "");
        const isControlled = value !== undefined;

        const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            const numeric = raw.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1");
            if (!isControlled) {
                setInternalValue(numeric);
            }
            if (onChange) {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, value: numeric },
                    nativeEvent: e.nativeEvent,
                    preventDefault: () => e.preventDefault(),
                    stopPropagation: () => e.stopPropagation(),
                };
                onChange(syntheticEvent);
            }
        }, [isControlled, onChange]);

        const displayValue = isControlled ? String(value ?? "") : internalValue;

        const styles: Record<string, CSSProperties> = {
            container: {
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "20px",
                width: "100%",
            },
            label: {
                fontSize: "13px",
                fontWeight: "500",
                color: "var(--text-muted)",
            },
            input: {
                height: "40px",
                padding: "0 14px",
                borderRadius: "8px",
                border: `1px solid ${error ? "var(--status-danger)" : "var(--border-muted)"}`,
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
                backgroundColor: "var(--surface-subtle)",
                color: "var(--text-strong)",
                boxSizing: "border-box",
                ...style,
            },
            errorText: {
                fontSize: "12px",
                color: "var(--status-danger)",
                marginTop: "2px",
            },
        };

        return (
            <div style={{ ...styles.container, ...containerStyle }}>
                {label && (
                    <label style={styles.label}>
                        {label}
                        {required && <span className="text-danger"> *</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholder || `Enter ${label || ""}`}
                    value={displayValue}
                    onChange={handleChange}
                    style={styles.input}
                    {...props}
                    onFocus={(e) => {
                        if (!error) e.target.style.borderColor = "var(--control-accent)";
                        if (props.onFocus) props.onFocus(e);
                    }}
                    onBlur={(e) => {
                        if (!error) e.target.style.borderColor = "var(--border-muted)";
                        if (props.onBlur) props.onBlur(e);
                    }}
                />
                {error && <span style={styles.errorText}>{String(error)}</span>}
            </div>
        );
    },
);

NumberField.displayName = "NumberField";

export default NumberField;
