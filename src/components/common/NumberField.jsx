import React, { forwardRef, useState, useCallback } from "react";

const NumberField = forwardRef(
    (
        {
            label,
            placeholder,
            error,
            style,
            containerStyle,
            value,
            onChange,
            ...props
        },
        ref,
    ) => {
        const [internalValue, setInternalValue] = useState(value ?? "");
        const isControlled = value !== undefined;

        const handleChange = useCallback((e) => {
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

        const styles = {
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
                {label && <label style={styles.label}>{label}</label>}
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
                        if (!error) e.target.style.borderColor = "#6259ca";
                        if (props.onFocus) props.onFocus(e);
                    }}
                    onBlur={(e) => {
                        if (!error) e.target.style.borderColor = "#e2e8f0";
                        if (props.onBlur) props.onBlur(e);
                    }}
                />
                {error && <span style={styles.errorText}>{error}</span>}
            </div>
        );
    },
);

NumberField.displayName = "NumberField";

export default NumberField;
