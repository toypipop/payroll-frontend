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
import { weekdayOptions } from "./useDayOffs";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Company, DayOff } from "../../../types/domain";

const schema = z.object({
    companies_id: z.string().optional(),
    weekday: z.string().min(1, "Weekday is required"),
    name: z.string().min(1, "Day off name is required"),
    is_paid: z.boolean().default(true),
});

type DayOffFormValues = z.infer<typeof schema>;

// DayOffFormModal owns the form and the save call; the page only says which row is being edited.
interface DayOffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: DayOff | null;
    homeCompanyId: string;
    companyOptions: Company[];
}

const DayOffFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companyOptions }: DayOffFormModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, weekday: "", name: "", is_paid: true },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                companies_id: editing.companies_id ? String(editing.companies_id) : "",
                weekday: String(editing.weekday),
                name: editing.name,
                is_paid: editing.is_paid,
            }
            : { companies_id: homeCompanyId, weekday: "", name: "", is_paid: true });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data: DayOffFormValues) => {
        try {
            const payload = {
                ...data,
                companies_id: data.companies_id ? Number(data.companies_id) : undefined,
                weekday: Number(data.weekday),
            };

            if (editing) {
                await api.put(`/master/day-offs/${editing.id}`, payload);
            } else {
                await api.post("/master/day-offs", payload);
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
            title={editing ? "Edit Day Off" : "Add Day Off"}
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
                disabled={!!editing}
            />
            <SelectField label="Weekday" options={weekdayOptions} {...register("weekday")} error={errors.weekday?.message} required />
            <InputField label="Day Off Name" {...register("name")} error={errors.name?.message} required />
            <CheckboxField label="Paid Day Off" {...register("is_paid")} />
        </Modal>
    );
};

export default DayOffFormModal;
