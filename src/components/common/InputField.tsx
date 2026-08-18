import React, { forwardRef } from "react";
import type { CSSProperties, InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: unknown;
    style?: CSSProperties;
    containerStyle?: CSSProperties;
    required?: boolean;
}

// Wrap with forwardRef for React Hook Form
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    (
        {
            label,
            type = "text",
            placeholder,
            error,
            style, // Allow external style overrides
            containerStyle, // Allow overriding container-level styles
            required,
            ...props // This includes name, onChange, onBlur from register()
        },
        ref,
    ) => {
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
                ...style, // Merge external styles
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
                        {required && <span style={{ color: "var(--status-danger)" }}> *</span>}
                    </label>
                )}
                <input
                    ref={ref} // Attach the ref here
                    type={type}
                    placeholder={placeholder || `Enter ${label || ""}`}
                    style={styles.input}
                    // Extract handlers or use defaults
                    {...props}
                    onFocus={(e) => {
                        if (!error)
                            e.target.style.borderColor = "var(--control-accent)";
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

// Setting displayName for easier debugging
InputField.displayName = "InputField";

export default InputField;
