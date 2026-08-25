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
import type { Company, Role } from "../../../types/domain";

const roleSchema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a companie")),
    roles_name: z.string().min(1, "Role name is required"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// RoleFormModal owns the form and the save call; the page only says which row is being edited.
interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: Role | null;
    defaultCompanieId: string;
    companies: Company[];
}

const RoleFormModal = ({ isOpen, onClose, onSaved, editing, defaultCompanieId, companies }: RoleFormModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            companies_id: defaultCompanieId,
            roles_name: "",
        },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? { id: editing.id == null ? undefined : Number(editing.id), companies_id: editing.companies_id, roles_name: editing.roles_name ?? "" }
            : { id: undefined, companies_id: defaultCompanieId, roles_name: "" });
    }, [isOpen, editing, defaultCompanieId, reset]);

    const onSubmit = async (data: RoleFormValues) => {
        try {
            if (data.id) {
                await api.put(`/roles/${data.id}`, data);
            } else {
                await api.post("/roles", data);
            }
            await onSaved();
            onClose();
        } catch (err) {
            alert(apiErrorMessage(err, "Operation failed"));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Role" : "Add Role"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))}
                        className="w-auto"
                    >
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-[16px]">
                <SelectField
                    label="Companies"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    options={companies.map(c => ({ id: c.id, name: c.name }))}
                    disabled={!!editing}
                    required
                />
                <InputField
                    label="Role Name"
                    {...register("roles_name")}
                    error={errors.roles_name?.message}
                    required
                />
            </div>
        </Modal>
    );
};

export default RoleFormModal;
