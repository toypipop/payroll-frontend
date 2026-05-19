import React from "react";
import type { ReactNode } from "react";

interface ToggleFieldProps {
    label?: ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const ToggleField = ({ label, checked, onChange, disabled = false }: ToggleFieldProps) => {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#475569" }}>{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    width: "40px",
                    height: "22px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    backgroundColor: checked ? "#6259ca" : "#cbd5e1",
                    transition: "background-color 0.2s",
                    flexShrink: 0,
                    padding: 0,
                    outline: "none",
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(98,89,202,0.2)"; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
                <span style={{
                    position: "absolute",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "transform 0.2s",
                    transform: checked ? "translateX(21px)" : "translateX(3px)",
                }} />
            </button>
        </div>
    );
};

export default ToggleField;
