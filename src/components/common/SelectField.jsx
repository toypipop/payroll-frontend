import React, { forwardRef } from "react";

/* --- Wrap with forwardRef to connect with React Hook Form (English Comment) --- */
const SelectField = forwardRef(
    ({ label, options = [], error, placeholder, style, containerStyle, ...props }, ref) => {
        const styles = {
            container: {
                marginBottom: "20px",
                width: "100%",
            },
            label: {
                display: "block",
                fontSize: "13px",
                fontWeight: "500",
                color: "#64748b",
                marginBottom: "6px",
            },
            selectWrapper: {
                position: "relative",
            },
            select: {
                width: "100%",
                padding: "10px 14px",
                fontSize: "14px",
                borderRadius: "8px",
                border: `1px solid ${error ? "#ef4444" : "#e2e8f0"}`,
                backgroundColor: "#f8fafc",
                color: "#1e293b",
                appearance: "none",
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.2s",
                ...style,
            },
            arrow: {
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: "10px",
                color: error ? "#ef4444" : "#94a3b8",
            },
            errorText: {
                fontSize: "12px",
                color: "#ef4444",
                marginTop: "4px",
            },
        };

        return (
            <div style={{ ...styles.container, ...containerStyle }}>
                {label && <label style={styles.label}>{label}</label>}

                <div style={styles.selectWrapper}>
                    <select
                        ref={ref}
                        style={styles.select}
                        {...props}
                        onFocus={(e) => {
                            if (!error) e.target.style.borderColor = "#3b82f6";
                            if (props.onFocus) props.onFocus(e);
                        }}
                        onBlur={(e) => {
                            if (!error) e.target.style.borderColor = "#e2e8f0";
                            if (props.onBlur) props.onBlur(e);
                        }}
                    >
                        <option value="">
                            {placeholder || `Select ${label}`}
                        </option>
                        {options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name}
                            </option>
                        ))}
                    </select>

                    <div style={styles.arrow}>▼</div>
                </div>

                {/* Error Message Display (English Comment) */}
                {error && <div style={styles.errorText}>{error}</div>}
            </div>
        );
    },
);

SelectField.displayName = "SelectField";

export default SelectField;
