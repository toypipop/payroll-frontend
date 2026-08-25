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
import type { Company, EmploymentType } from "../../../types/domain";

const schema = z.object({
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type EmploymentTypeFormValues = z.infer<typeof schema>;

// EmploymentTypeFormModal owns the form and the save call; the page only says which row is being edited.
interface EmploymentTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: EmploymentType | null;
    defaultCompanieId: string;
    companies: Company[];
}

const EmploymentTypeFormModal = ({ isOpen, onClose, onSaved, editing, defaultCompanieId, companies }: EmploymentTypeFormModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: defaultCompanieId, name: "", description: "" },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? { companies_id: editing.companies_id, name: editing.name, description: editing.description || "" }
            : { companies_id: defaultCompanieId, name: "", description: "" });
    }, [isOpen, editing, defaultCompanieId, reset]);

    const onSubmit = async (data: EmploymentTypeFormValues) => {
        try {
            if (editing) {
                await api.put(`/master/employment-types/${editing.id}`, data);
            } else {
                await api.post("/master/employment-types", data);
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
            title={editing ? "Edit Employment Type" : "Add Employment Type"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)}>{editing ? "Update" : "Save"}</Button>
                </>
            }
        >
            <div className="flex flex-col gap-[16px]">
                <SelectField
                    label="Companies"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    options={companies.map(c => ({ id: c.id, name: c.name }))}
                    required
                    disabled={!!editing}
                />
                <InputField label="Name (e.g. Full-time, Contract)" {...register("name")} error={errors.name?.message} required />
                <InputField label="Description" {...register("description")} error={errors.description?.message} />
            </div>
        </Modal>
    );
};

export default EmploymentTypeFormModal;
