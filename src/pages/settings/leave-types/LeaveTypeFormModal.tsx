import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import CheckboxField from "../../../components/common/CheckboxField";
import SelectField from "../../../components/common/SelectField";
import { apiErrorMessage } from "../../../utils/apiError";
import { leaveDaysPerYearSchema, leaveTypeNameSchema, MAX_LEAVE_DAYS_PER_YEAR } from "../../../utils/leaveTypeValidation";
import type { Company, LeaveTypeSetting } from "../../../types/domain";

const schema = z.object({
    companies_id: z.string().min(1, "Company is required"),
    name: leaveTypeNameSchema,
    is_paid: z.boolean().default(true),
    max_days_per_year: leaveDaysPerYearSchema,
});

type LeaveTypeFormValues = z.infer<typeof schema>;

// LeaveTypeFormModal owns the form and the save call; the page only says which row is being edited.
interface LeaveTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: LeaveTypeSetting | null;
    homeCompanyId: string;
    companyOptions: Company[];
}

const LeaveTypeFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companyOptions }: LeaveTypeFormModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, name: "", is_paid: true, max_days_per_year: 0 },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                companies_id: editing.companies_id ? String(editing.companies_id) : "",
                name: editing.name,
                is_paid: editing.is_paid,
                max_days_per_year: editing.max_days_per_year ?? 0,
            }
            : { companies_id: homeCompanyId, name: "", is_paid: true, max_days_per_year: 0 });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data: LeaveTypeFormValues) => {
        try {
            const payload = { ...data, companies_id: Number(data.companies_id) };
            if (editing) {
                await api.put(`/master/leave-types/${editing.id}`, payload);
            } else {
                await api.post("/master/leave-types", payload);
            }
            onSaved();
            onClose();
        } catch (err) {
            alert(apiErrorMessage(err, "Save Failed"));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Leave Type" : "Add Leave Type"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)}>{editing ? "Update" : "Save"}</Button>
                </>
            }
        >
            <SelectField
                label="Company"
                options={companyOptions}
                {...register("companies_id")}
                error={errors.companies_id?.message}
                required
                disabled={!!editing}
            />
            <InputField label="Leave Type Name" {...register("name")} error={errors.name?.message} required />
            <InputField label="Max Days Per Year (0 = Unlimited)" type="number" min={0} max={MAX_LEAVE_DAYS_PER_YEAR} step="0.01" {...register("max_days_per_year")} error={errors.max_days_per_year?.message} />
            <CheckboxField label="Paid Leave" {...register("is_paid")} />
        </Modal>
    );
};

export default LeaveTypeFormModal;
