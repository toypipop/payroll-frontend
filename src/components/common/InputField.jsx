import React, { forwardRef } from "react";

/* --- Wrap with forwardRef to allow React Hook Form to control the input (English Comment) --- */
const InputField = forwardRef(
    (
        {
            label,
            type = "text",
            placeholder,
            error,
            style, // Allow external style overrides
            containerStyle, // Allow overriding container-level styles
            ...props // This includes name, onChange, onBlur from register()
        },
        ref,
    ) => {
        const styles = {
            container: {
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "16px",
                width: "100%",
            },
            label: {
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text-main)",
            },
            input: {
                padding: "10px 14px",
                borderRadius: "8px",
                border: `1px solid ${error ? "#ef4444" : "#e2e8f0"}`,
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
                ...style, // Merge external styles
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
                    ref={ref} // Attach the ref here
                    type={type}
                    placeholder={placeholder}
                    style={styles.input}
                    /* --- Extract handlers from props or use default behavior (English Comment) --- */
                    {...props}
                    onFocus={(e) => {
                        if (!error)
                            e.target.style.borderColor = "var(--primary-color)";
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

// Setting displayName for easier debugging
InputField.displayName = "InputField";

export default InputField;
