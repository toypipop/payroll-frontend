import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import DateField from "../../../components/common/DateField";
import DecimalField from "../../../components/common/DecimalField";
import { apiErrorMessage, apiErrorStatus } from "../../../utils/apiError";
import type { SalaryHistoryRow } from "../../../types/domain";

const schema = z.object({
    effective_date: z.string().min(1, "Effective date is required"),
    base_salaries: z.preprocess((val) => Number(val), z.number().min(0.01, "Base salary must be greater than 0")),
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
    const { handleSubmit, reset, control, formState: { errors } } = useForm<SalaryRecordEditValues>({
        resolver: zodResolver(schema),
        defaultValues: { effective_date: "", base_salaries: "" },
    });

    useEffect(() => {
        if (!record) return;
        reset({
            effective_date: String(record.effective_date ?? "").slice(0, 10),
            base_salaries: record.base_salaries ?? "",
        });
    }, [record, reset]);

    const onSubmit = async (data: SalaryRecordEditValues) => {
        if (!record) return;
        try {
            await api.patch(`/salaries/${record.id}`, {
                effective_date: data.effective_date,
                base_salaries: Number(data.base_salaries),
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
        </Modal>
    );
};

export default SalaryRecordEditModal;
