import FormError from "../../../components/common/FormError";
import { textField } from "../../../utils/fieldValidation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Company, WorkLocation } from "../../../types/domain";

const schema = z.object({
    companies_id: z.string().min(1, "Company is required"),
    name: textField("Location name", 1, 200),
});

type WorkLocationFormValues = z.infer<typeof schema>;

// WorkLocationFormModal owns the form and the save call; the page only says which row is being edited.
interface WorkLocationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: WorkLocation | null;
    homeCompanyId: string;
    companyOptions: Company[];
}

const WorkLocationFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companyOptions }: WorkLocationFormModalProps) => {
    const { setError, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, name: "" },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? { companies_id: editing.companies_id ? String(editing.companies_id) : "", name: editing.name }
            : { companies_id: homeCompanyId, name: "" });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data: WorkLocationFormValues) => {
        try {
            const payload = { ...data, companies_id: Number(data.companies_id) };
            if (editing) {
                await api.put(`/master/work-locations/${editing.id}`, payload);
            } else {
                await api.post("/master/work-locations", payload);
            }
            onSaved();
            onClose();
        } catch (err) {
            setError("root", { message: apiErrorMessage(err, "Save Failed") });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Work Location" : "Add Work Location"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{editing ? "Update" : "Save"}</Button>
                </>
            }
        >
            <FormError message={errors.root?.message} />
            <SelectField
                label="Company"
                options={companyOptions}
                {...register("companies_id")}
                error={errors.companies_id?.message}
                required
                disabled={!!editing}
            />
            <InputField label="Location Name (e.g. Office, WFH)" {...register("name")} error={errors.name?.message} required />
        </Modal>
    );
};

export default WorkLocationFormModal;
