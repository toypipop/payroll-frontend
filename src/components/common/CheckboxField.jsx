import React from "react";

// Use forwardRef for React Hook Form
const CheckboxField = React.forwardRef(
    ({ label, error, id, checked, onChange, ...props }, ref) => {
        const styles = {
            container: {
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginTop: "12px",
                padding: "0 4px",
            },
            wrapper: {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
            },
            input: {
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: "#10b981",
            },
            label: {
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
                color: "#334155",
            },
            error: {
                color: "#ef4444",
                fontSize: "12px",
                marginTop: "2px",
            },
        };

        return (
            <div style={styles.container}>
                <label style={styles.wrapper}>
                    <input
                        type="checkbox"
                        id={id}
                        ref={ref}
                        checked={checked}
                        onChange={onChange}
                        style={styles.input}
                        {...props}
                    />
                    <span style={styles.label}>{label}</span>
                </label>
                {error && <span style={styles.error}>{error}</span>}
            </div>
        );
    },
);

CheckboxField.displayName = "CheckboxField";

export default CheckboxField;
