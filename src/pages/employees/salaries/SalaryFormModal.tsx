import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import DecimalField from "../../../components/common/DecimalField";
import DateField from "../../../components/common/DateField";
import CheckboxField from "../../../components/common/CheckboxField";
import InputField from "../../../components/common/InputField";
import {
    getEmployeeId,
    getLatestSalaryStructure,
    getSalaryBaseAmount,
    getSalaryEffectiveDate,
    salaryActiveDefault,
} from "./salaryShape";
import type { SalaryRow } from "./useSalaries";
import { bangkokDateKey } from "../../../utils/bangkokTime";
import MasterDataWarning from "../../../components/common/MasterDataWarning";
import { closedCycleFor } from "./closedCycles";
import { useClosedCycles } from "./useClosedCycles";
import type { ApiId } from "../../../types/api";
import { apiErrorBody, apiErrorMessage, apiErrorStatus } from "../../../utils/apiError";

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
    // Required, and trimmed before it is measured: a reason of spaces answers nothing the trail is kept for.
    reason: z.string().trim().min(1, "Say why this change is being made"),
});

type SalaryFormValues = z.infer<typeof salariesSchema>;

const DEFAULT_FORM_VALUES = {
    companies_id: "",
    employees_id: "",
    base_salaries: "",
    effective_date: bangkokDateKey(new Date()),
    is_active: true,
    reason: "",
};

interface SalaryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    employee: SalaryRow | null;
}

// SalaryFormModal owns the adjustment form and the save call; the page only says which employee row is being adjusted.
const SalaryFormModal = ({ isOpen, onClose, onSaved, employee }: SalaryFormModalProps) => {
    const {
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(salariesSchema),
        defaultValues: DEFAULT_FORM_VALUES,
    });

    // Saying which closed period a date lands in costs one request, and saves the user a round trip that
    // would only come back as a 409.
    const cycles = useClosedCycles(isOpen);
    const effectiveDate = useWatch({ control, name: "effective_date" });
    const closedCycle = closedCycleFor(effectiveDate, employee?.companies_id, cycles);

    // The version of the record this form was seeded from, sent back on save so a stale screen is refused.
    const seededVersion = Number(
        (employee?.__salary as Record<string, unknown> | null | undefined)?.version
        ?? (getLatestSalaryStructure(employee) as Record<string, unknown> | null)?.version
        ?? 0,
    );

    // Re-seed the form whenever the page opens the modal, defaulting the effective date to today when the row has none.
    useEffect(() => {
        if (!isOpen || !employee) return;
        const ss = employee.__salary || getLatestSalaryStructure(employee) || null;

        const existingDate = getSalaryEffectiveDate(ss, employee);
        // The date this form shows is a business-timezone calendar day, so it is read through
        // bangkokDateKey: toISOString() would hand back yesterday between 00:00 and 07:00 in Bangkok.
        const today = bangkokDateKey(new Date());
        let finalDate = today;

        if (existingDate && !existingDate.startsWith("0001")) {
            finalDate = bangkokDateKey(existingDate) || today;
        }

        reset({
            companies_id: employee.companies_id ? String(employee.companies_id) : "",
            employees_id: String(getEmployeeId(employee)),
            base_salaries: getSalaryBaseAmount(ss, employee) || "",
            effective_date: finalDate,
            is_active: salaryActiveDefault(ss, employee),
            // Never carried over from the last change: a reason describes this edit, not the previous one.
            reason: "",
        });
    }, [isOpen, employee, reset]);

    const onSubmit = async (data: SalaryFormValues) => {
        try {
            // `id` only travels when an existing record is being disabled, so the payload keeps room for it.
            const payload: Record<string, unknown> = {
                ...data,
                // The version the form was seeded from: the server refuses the save if that record has moved since.
                version: seededVersion,
                companies_id: Number(data.companies_id),
                employees_id: Number(data.employees_id),
                base_salaries: Number(data.base_salaries),
                base_salary: Number(data.base_salaries),
                effective_date: data.effective_date,
                reason: data.reason,
                is_active: Boolean(data.is_active),
                deleted_at: !data.is_active,
            };

            // Disabling an existing structure is an update of that row, so the id has to travel with it.
            const current = (employee?.__salary || getLatestSalaryStructure(employee)) as Record<string, unknown> | null;
            const currentId = current?.id ?? null;
            if (!data.is_active && currentId) {
                payload.id = currentId as ApiId;
            }

            // Backend uses POST /salaries for both create and update.
            await api.post("/salaries", payload);
            onSaved();
            onClose();
        } catch (err) {
            console.error("Save salary failed:", apiErrorBody(err) ?? err);
            // 412 means the record moved since this form was seeded: the screen is stale, so reload it.
            // Everything else — including a 409 over the effective date — leaves the form open to be corrected.
            if (apiErrorStatus(err) === 412) {
                alert(`${apiErrorMessage(err, "This record was changed by someone else.")}

Reloading the list.`);
                onSaved();
                onClose();
                return;
            }
            alert(apiErrorMessage(err, "Save Failed"));
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

            <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                    <InputField
                        name={field.name}
                        label="Reason for this change"
                        placeholder="e.g. annual review, promotion, correction"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.reason?.message}
                        required
                    />
                )}
            />

            {closedCycle && (
                <MasterDataWarning
                    message={`That date falls inside "${closedCycle.cycle_name}", a payroll cycle that is already closed. Saving it will be refused — pick a date in an open period.`}
                    routePath="/payroll-cycles"
                    moduleKey="PayrollCyclesPage"
                    linkLabel="View payroll cycles"
                />
            )}

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
