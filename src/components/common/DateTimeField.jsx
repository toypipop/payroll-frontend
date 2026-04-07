import React, { useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DateTimeField = React.forwardRef(({ label, error, value, onChange, id, ...props }, ref) => {
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

    const timeValue = useMemo(() => {
        if (!value) return "00:00";
        const d = new Date(value);
        if (isNaN(d.getTime())) return "00:00";
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }, [value]);

    const handleTimeChange = (e) => {
        const [hours, minutes] = e.target.value.split(":");
        if (!value || isNaN(new Date(value).getTime())) {
            const newDate = new Date();
            newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            onChange(newDate);
        } else {
            const newDate = new Date(value);
            newDate.setHours(parseInt(hours, 10));
            newDate.setMinutes(parseInt(minutes, 10));
            onChange(newDate);
        }
    };

    return (
        <div style={styles.container}>
            {label && <label htmlFor={id} style={styles.label}>{label}</label>}
            
            <DatePicker
                ref={ref}
                selected={value && !isNaN(new Date(value).getTime()) ? new Date(value) : null}
                onChange={onChange}
                dateFormat="yyyy-MM-dd HH:mm"
                id={id}
                className={`custom-date-input ${error ? 'error' : ''}`}
                placeholderText="Select date and time"
                autoComplete="off"
                renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => (
                    <div className="custom-header-container">
                        <div className="nav-row">
                            <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="nav-btn">{"<"}</button>
                            <div className="selectors">
                                <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(Number(value))}>
                                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select value={MONTHS[date.getMonth()]} onChange={({ target: { value } }) => changeMonth(MONTHS.indexOf(value))}>
                                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="nav-btn">{">"}</button>
                        </div>
                        
                        <div className="time-row">
                            <span className="time-label">Time:</span>
                            <input
                                type="time"
                                value={timeValue}
                                onChange={handleTimeChange}
                                className="header-time-input"
                            />
                        </div>
                    </div>
                )}
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
                .custom-header-container {
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: #fff;
                    border-bottom: 1px solid #f1f5f9;
                }
                .nav-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .selectors {
                    display: flex;
                    gap: 5px;
                }
                .selectors select {
                    padding: 4px;
                    border-radius: 4px;
                    border: 1px solid #e2e8f0;
                    font-size: 13px;
                }
                .nav-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-weight: bold;
                    color: #64748b;
                    padding: 0 8px;
                }
                .time-row {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    padding-top: 5px;
                    border-top: 1px dashed #e2e8f0;
                }
                .time-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748b;
                }
                .header-time-input {
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    padding: 2px 4px;
                    font-size: 13px;
                    outline: none;
                    color: #334155;
                    text-align: center; 
                    width: 90px; 
                    box-sizing: border-box; 
                }
                .header-time-input::-webkit-calendar-picker-indicator,
                .header-time-input::-webkit-clear-button {
                    display: none !important;
                    -webkit-appearance: none;
                    margin: 0;
                }
                .header-time-input {
                    appearance: none;
                    -moz-appearance: textfield;
                }
                .react-datepicker {
                    border-radius: 12px;
                    border: none;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .react-datepicker__header {
                    background-color: #ffffff;
                    border-bottom: none;
                    padding: 0;
                }
                .react-datepicker__day--selected {
                    background-color: #3b82f6 !important;
                    border-radius: 6px;
                }
            `}</style>
        </div>
    );
});

DateTimeField.displayName = "DateTimeField";

export default DateTimeField;