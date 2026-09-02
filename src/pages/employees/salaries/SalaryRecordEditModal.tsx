import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import DateField from "../../../components/common/DateField";
import DecimalField from "../../../components/common/DecimalField";
import InputField from "../../../components/common/InputField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";
import { apiErrorMessage, apiErrorStatus } from "../../../utils/apiError";
import { closedCycleFor } from "./closedCycles";
import { useClosedCycles } from "./useClosedCycles";
import type { SalaryHistoryRow } from "../../../types/domain";

const schema = z.object({
    effective_date: z.string().min(1, "Effective date is required"),
    base_salaries: z.preprocess((val) => Number(val), z.number().min(0.01, "Base salary must be greater than 0")),
    // Required, and trimmed before it is measured: a reason of spaces answers nothing the trail is kept for.
    reason: z.string().trim().min(1, "Say why this record is being moved"),
});

type SalaryRecordEditValues = z.input<typeof schema>;

interface SalaryRecordEditModalProps {
    // The record being edited, or null when the modal is closed.
    record: SalaryHistoryRow | null;
    onClose: () => void;
    onSaved: () => void;
}

// SalaryRecordEditModal moves one record along the timeline. Editing the date is what this modal is for — the
// main salary form is addressed by date, so it can only ever reach the record already sitting on the date typed
// into it, and correcting a date typed wrong would otherwise mean deleting the record and entering it again.
const SalaryRecordEditModal = ({ record, onClose, onSaved }: SalaryRecordEditModalProps) => {
    const { handleSubmit, reset, control, watch, formState: { errors } } = useForm<SalaryRecordEditValues>({
        resolver: zodResolver(schema),
        defaultValues: { effective_date: "", base_salaries: "", reason: "" },
    });

    // Moving a record into a closed period is one of the three things the server refuses; it is also the only
    // one that can be seen coming, so the form says it before the user spends a save on it.
    const cycles = useClosedCycles(!!record);
    const closedCycle = closedCycleFor(watch("effective_date"), record?.companies_id, cycles);

    useEffect(() => {
        if (!record) return;
        reset({
            effective_date: String(record.effective_date ?? "").slice(0, 10),
            base_salaries: record.base_salaries ?? "",
            // Never carried over from the last change: a reason describes this edit, not the previous one.
            reason: "",
        });
    }, [record, reset]);

    const onSubmit = async (data: SalaryRecordEditValues) => {
        if (!record) return;
        try {
            await api.patch(`/salaries/${record.id}`, {
                effective_date: data.effective_date,
                base_salaries: Number(data.base_salaries),
                reason: data.reason,
                // The version this form was drawn from: the server refuses the edit if the record has moved since.
                version: record.version ?? 0,
            });
            onSaved();
            onClose();
        } catch (err) {
            // 412 means the record changed underneath this form, so the list has to be reloaded before trying
            // again. Everything else — a date another record holds, a period already paid out — is something the
            // user can fix in the form that is still open.
            if (apiErrorStatus(err) === 412) {
                alert(`${apiErrorMessage(err, "This record was changed by someone else.")}\n\nReloading the list.`);
                onSaved();
                onClose();
                return;
            }
            alert(apiErrorMessage(err, "Update failed"));
        }
    };

    return (
        <Modal
            isOpen={!!record}
            onClose={onClose}
            title="Edit Salary Record"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)}>Save</Button>
                </>
            }
        >
            <div className="mb-3 text-[12px] text-muted">
                Moving this record changes what both periods pay — the one it leaves and the one it moves into.
            </div>
            <Controller
                name="effective_date"
                control={control}
                render={({ field }) => (
                    <DateField
                        label="Effective Date"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.effective_date?.message}
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

            <Controller
                name="base_salaries"
                control={control}
                render={({ field }) => (
                    <DecimalField
                        label="Base Salary"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.base_salaries?.message}
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
        </Modal>
    );
};

export default SalaryRecordEditModal;
