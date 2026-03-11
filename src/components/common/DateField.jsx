import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateField = React.forwardRef(({ label, error, value, onChange, id, ...props }, ref) => {
    const styles = {
        container: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "20px",
        },
        label: {
            fontWeight: "500",
            fontSize: "13px",
            color: "#64748b",
        },
        error: {
            color: "#ef4444",
            fontSize: "12px",
            marginTop: "2px",
            fontWeight: "500",
        }
    };

    return (
        <div style={styles.container}>
            {label && <label htmlFor={id} style={styles.label}>{label}</label>}
            
            <DatePicker
                ref={ref}
                selected={value}
                onChange={onChange}
                dateFormat="yyyy-MM-dd"
                id={id}
                className={`custom-date-input ${error ? 'error' : ''}`}
                placeholderText="Select date"
                autoComplete="off"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                {...props}
            />

            {error && <span style={styles.error}>{error}</span>}

            <style>{`
                .custom-date-input {
                    height: 40px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    font-size: 14px;
                    outline: none;
                    width: 100%;
                    color: #1e293b;
                    background-color: #f8fafc;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .custom-date-input:focus {
                    border-color: #6259ca;
                    box-shadow: 0 0 0 3px rgba(98,89,202,0.12);
                }
                .custom-date-input.error {
                    border-color: #ef4444;
                }

                /* Layout for Month/Year Select */
                .react-datepicker__header__dropdown {
                    margin-top: 10px; /* Added margin top to dropdown area */
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                }

                .react-datepicker__month-select,
                .react-datepicker__year-select {
                    padding: 4px 8px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    background-color: #f8fafc;
                    font-size: 13px;
                    color: #475569;
                    cursor: pointer;
                    outline: none;
                }

                .react-datepicker__month-select:hover,
                .react-datepicker__year-select:hover {
                    border-color: #3b82f6;
                }

                /* Calendar Style */
                .react-datepicker {
                    font-family: inherit;
                    border-radius: 12px;
                    border: none;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    padding: 4px;
                }
                .react-datepicker__header {
                    background-color: #ffffff;
                    border-bottom: none;
                    border-top-left-radius: 12px;
                    border-top-right-radius: 12px;
                }
                .react-datepicker__day--selected {
                    background-color: #3b82f6 !important;
                    border-radius: 6px;
                }
            `}</style>
        </div>
    );
});

DateField.displayName = "DateField";

export default DateField;