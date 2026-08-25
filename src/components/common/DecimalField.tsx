import { twMerge } from "tailwind-merge";
import React, { forwardRef, useState, useCallback } from "react";
import type { ChangeEvent, CSSProperties, FocusEvent, InputHTMLAttributes } from "react";

interface DecimalFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    label?: string;
    error?: string;
    style?: CSSProperties;
    containerClassName?: string;
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
            containerClassName = "",
            value,
            onChange,
            decimals = 2,
            required,
            className = "",
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
            if (props.onFocus) props.onFocus(e);
        };

        const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            if (rawValue !== "" && !isNaN(parseFloat(rawValue))) {
                setRawValue(parseFloat(rawValue).toFixed(decimals));
            }
            if (props.onBlur) props.onBlur(e);
        };

        return (
            <div className={twMerge("mb-5 flex w-full flex-col gap-1.5", containerClassName)} style={containerStyle}>
                {label && (
                    <label className="text-[13px] font-medium text-muted">
                        {label}
                        {required && <span className="text-danger"> *</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder || `Enter ${label || ""}`}
                    value={displayValue}
                    onChange={handleChange}
                    className={twMerge(
                        "box-border h-10 w-full rounded-lg border bg-surface px-3.5 font-[inherit] text-sm text-strong outline-none transition-colors",
                        error ? "border-danger" : "border-line-muted focus:border-control",
                        className,
                    )}
                    style={style}
                    {...props}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                {error && <span className="mt-0.5 text-xs text-danger">{error}</span>}
            </div>
        );
    },
);

DecimalField.displayName = "DecimalField";

export default DecimalField;
