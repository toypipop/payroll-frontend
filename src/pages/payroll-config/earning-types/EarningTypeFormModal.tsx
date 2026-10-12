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
import CheckboxField from "../../../components/common/CheckboxField";
import SelectField from "../../../components/common/SelectField";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Company, EarningType } from "../../../types/domain";

const earningSchema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a companie")),
    name: textField("Name", 1, 200),
    is_taxable: z.boolean().default(true),
    is_sso: z.boolean().default(true),
});

type EarningTypeFormValues = z.infer<typeof earningSchema>;

// EarningTypeFormModal owns the form and the save call; the page only says which row is being edited.
interface EarningTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: EarningType | null;
    defaultCompanieId: string;
    companies: Company[];
}

const EarningTypeFormModal = ({ isOpen, onClose, onSaved, editing, defaultCompanieId, companies }: EarningTypeFormModalProps) => {
    const { setError, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(earningSchema),
        defaultValues: {
            companies_id: defaultCompanieId,
            is_taxable: true,
            is_sso: true,
        },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                id: editing.id == null ? undefined : Number(editing.id),
                companies_id: editing.companies_id,
                name: editing.name ?? "",
                is_taxable: editing.is_taxable,
                is_sso: editing.is_sso,
            }
            : {
            id: undefined,
            companies_id: defaultCompanieId,
            is_taxable: true,
            is_sso: true,
            });
    }, [isOpen, editing, defaultCompanieId, reset]);

    const onSubmit = async (data: EarningTypeFormValues) => {
        try {
            if (data.id) {
                await api.put(`/earning-types/${data.id}`, data);
            } else {
                await api.post("/earning-types", data);
            }
            await onSaved();
            onClose();
        } catch (err) {
            setError("root", { message: apiErrorMessage(err, "Operation failed") });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Earning Type" : "Add Earning Type"}
            footer={
                <>
                    <Button variant="ghost" disabled={isSubmitting} onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-auto">
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <FormError message={errors.root?.message} />
            <div className="flex flex-col gap-[16px]">
                <SelectField
                    label="Companies"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    options={companies.map(c => ({ id: c.id, name: c.name }))}
                    disabled={!!editing}
                    required
                />
                <InputField label="Earning Name" {...register("name")} error={errors.name?.message} required />
                <div className="grid grid-cols-2 gap-3">
                    <CheckboxField label="Is Taxable" id="is_taxable" {...register("is_taxable")} />
                    <CheckboxField label="Include in SSO" id="is_sso" {...register("is_sso")} />
                </div>
            </div>
        </Modal>
    );
};

export default EarningTypeFormModal;
