import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import DecimalField from "../../../components/common/DecimalField";
import DateField from "../../../components/common/DateField";
import CheckboxField from "../../../components/common/CheckboxField";
import {
    getEmployeeId,
    getLatestSalaryStructure,
    getSalaryBaseAmount,
    getSalaryDeletedAt,
    getSalaryEffectiveDate,
    isSoftDeleted,
} from "./salaryShape";

/* --- 1. Validation Schema (English Comment) --- */
const salariesSchema = z.object({
    companies_id: z.preprocess(
        (val) => Number(val),
        z.number().min(1, "Company is required")
    ),
    employees_id: z.preprocess(
        (val) => Number(val),
        z.number().min(1, "Please select an employee")
    ),
    base_salaries: z.preprocess(
        (val) => Number(val),
        z.number().min(0, "Salaries must be a positive number")
    ),
    effective_date: z.string().min(1, "Effective date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    is_active: z.boolean().default(true),
});

const DEFAULT_FORM_VALUES = {
    companies_id: "",
    employees_id: "",
    base_salaries: "",
    effective_date: new Date().toISOString().split("T")[0],
    is_active: true,
};

// SalaryFormModal owns the adjustment form and the save call; the page only says which employee row is being adjusted.
const SalaryFormModal = ({ isOpen, onClose, onSaved, employee }) => {
    const {
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(salariesSchema),
        defaultValues: DEFAULT_FORM_VALUES,
    });

    // Re-seed the form whenever the page opens the modal, defaulting the effective date to today when the row has none.
    useEffect(() => {
        if (!isOpen || !employee) return;
        const ss = employee.__salary || getLatestSalaryStructure(employee) || null;

        const existingDate = getSalaryEffectiveDate(ss, employee);
        let finalDate = new Date().toISOString().split("T")[0];

        if (existingDate && !existingDate.startsWith("0001")) {
            try {
                const d = new Date(existingDate);
                finalDate = d.toISOString().split("T")[0];
            } catch {
                finalDate = new Date().toISOString().split("T")[0];
            }
        }

        reset({
            companies_id: employee.companies_id ? String(employee.companies_id) : "",
            employees_id: String(getEmployeeId(employee)),
            base_salaries: getSalaryBaseAmount(ss, employee) || "",
            effective_date: finalDate,
            is_active: typeof ss?.is_active === "boolean"
                ? ss.is_active
                : !isSoftDeleted(getSalaryDeletedAt(ss, employee)),
        });
    }, [isOpen, employee, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                companies_id: Number(data.companies_id),
                employees_id: Number(data.employees_id),
                base_salaries: Number(data.base_salaries),
                base_salary: Number(data.base_salaries),
                effective_date: data.effective_date,
                is_active: Boolean(data.is_active),
                deleted_at: !data.is_active,
            };

            // Disabling an existing structure is an update of that row, so the id has to travel with it.
            const currentId = (employee?.__salary || getLatestSalaryStructure(employee))?.id || null;
            if (!data.is_active && currentId) {
                payload.id = currentId;
            }

            // Backend uses POST /salaries for both create and update.
            await api.post("/salaries", payload);
            onSaved();
            onClose();
        } catch (err) {
            console.error("Save salary failed:", err.response?.data || err);
            alert(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Save Failed"
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Adjust Salaries: ${employee?.first_name} ${employee?.last_name}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)}>
                        Save Changes
                    </Button>
                </>
            }
        >
            <Controller
                name="base_salaries"
                control={control}
                render={({ field }) => (
                    <DecimalField
                        name={field.name}
                        label="Base Salaries (Monthly)"
                        decimals={2}
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(e) => field.onChange(e?.target?.value ?? e)}
                        error={errors.base_salaries?.message}
                        required
                    />
                )}
            />

            <Controller
                name="effective_date"
                control={control}
                render={({ field }) => (
                    <DateField
                        name={field.name}
                        label="Effective Date"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.effective_date?.message}
                        required
                    />
                )}
            />

            <p className="text-[12px] text-muted mt-[8px]">
                * Adjustments will be applied to payroll calculations from this date onwards.
            </p>
            <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                    <CheckboxField
                        label="Active Salary Structure"
                        id="is_active"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        error={errors.is_active?.message}
                    />
                )}
            />
        </Modal>
    );
};

export default SalaryFormModal;
