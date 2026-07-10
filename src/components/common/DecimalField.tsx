import React, { forwardRef, useState, useCallback } from "react";
import type { ChangeEvent, CSSProperties, FocusEvent, InputHTMLAttributes } from "react";

interface DecimalFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    label?: string;
    error?: unknown;
    style?: CSSProperties;
    containerStyle?: CSSProperties;
    value?: unknown;
    decimals?: number;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const DecimalField = forwardRef<HTMLInputElement, DecimalFieldProps>(
    (
        {
            label,
            placeholder,
            error,
            style,
            containerStyle,
            value,
            onChange,
            decimals = 2,
            required,
            ...props
        },
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState(false);
        const [rawValue, setRawValue] = useState("");

        const formatValue = (val: unknown) => {
            if (val === "" || val == null) return "";
            return parseFloat(String(val)).toFixed(decimals);
        };

        const displayValue = isFocused ? rawValue : formatValue(value ?? rawValue);

        const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            const regex = decimals > 0 ? new RegExp(`^[0-9]*\\.?[0-9]{0,${decimals}}$`) : /^[0-9]*$/;
            if (raw === "" || regex.test(raw)) {
                setRawValue(raw);
                if (onChange) {
                    const syntheticEvent = {
                        ...e,
                        target: { ...e.target, value: raw },
                        nativeEvent: e.nativeEvent,
                        preventDefault: () => e.preventDefault(),
                        stopPropagation: () => e.stopPropagation(),
                    };
                    onChange(syntheticEvent);
                }
            }
        }, [onChange, decimals]);

        const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            setRawValue(value !== undefined && value !== "" ? String(parseFloat(String(value))) : "");
            if (!error) e.target.style.borderColor = "#6259ca";
            if (props.onFocus) props.onFocus(e);
        };

        const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            if (rawValue !== "" && !isNaN(parseFloat(rawValue))) {
                setRawValue(parseFloat(rawValue).toFixed(decimals));
            }
            if (!error) e.target.style.borderColor = "#e2e8f0";
            if (props.onBlur) props.onBlur(e);
        };

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
                color: "#64748b",
            },
            input: {
                height: "40px",
                padding: "0 14px",
                borderRadius: "8px",
                border: `1px solid ${error ? "#ef4444" : "#e2e8f0"}`,
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
                backgroundColor: "#f8fafc",
                color: "#1e293b",
                boxSizing: "border-box",
                ...style,
            },
            errorText: {
                fontSize: "12px",
                color: "#ef4444",
                marginTop: "2px",
            },
        };

        return (
            <div style={{ ...styles.container, ...containerStyle }}>
                {label && (
                    <label style={styles.label}>
                        {label}
                        {required && <span style={{ color: "#ef4444" }}> *</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder || `Enter ${label || ""}`}
                    value={displayValue}
                    onChange={handleChange}
                    style={styles.input}
                    {...props}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                {error && <span style={styles.errorText}>{String(error)}</span>}
            </div>
        );
    },
);

DecimalField.displayName = "DecimalField";

export default DecimalField;
