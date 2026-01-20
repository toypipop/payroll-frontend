/* --- Minimalist Select Component (English Comment) --- */
import React from "react";

const SelectField = ({ label, value, options, onChange, placeholder }) => {
    return (
        <div style={{ marginBottom: "20px" }}>
            <label
                style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                    marginBottom: "6px",
                }}
            >
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <select
                    value={value}
                    onChange={onChange}
                    style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "14px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f8fafc",
                        color: "#1e293b",
                        appearance: "none", // Remove default arrow
                        cursor: "pointer",
                        outline: "none",
                        transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                >
                    <option value="">{placeholder || `Select ${label}`}</option>
                    {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.name}
                        </option>
                    ))}
                </select>
                {/* Custom Minimal Arrow */}
                <div
                    style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        fontSize: "10px",
                        color: "#94a3b8",
                    }}
                >
                    ▼
                </div>
            </div>
        </div>
    );
};

export default SelectField;
