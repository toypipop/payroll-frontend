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

const deductionSchema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a companie")),
    name: z.string().min(1, "Name is required"),
    is_tax_deductible: z.boolean().default(false),
    is_sso_deductible: z.boolean().default(false),
});

// DeductionTypeFormModal owns the form and the save call; the page only says which row is being edited.
const DeductionTypeFormModal = ({ isOpen, onClose, onSaved, editing, defaultCompanieId, companies }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(deductionSchema),
        defaultValues: {
            companies_id: defaultCompanieId,
            is_tax_deductible: false,
            is_sso_deductible: false,
        },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing || {
            id: undefined,
            companies_id: defaultCompanieId,
            is_tax_deductible: false,
            is_sso_deductible: false,
        });
    }, [isOpen, editing, defaultCompanieId, reset]);

    const onSubmit = async (data) => {
        try {
            if (data.id) {
                await api.put(`/deduction-types/${data.id}`, data);
            } else {
                await api.post("/deduction-types", data);
            }
            await onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Deduction Type" : "Add Deduction Type"}
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
                <InputField label="Deduction Name" {...register("name")} error={errors.name?.message} required />
                <div className="grid grid-cols-2 gap-3">
                    <CheckboxField label="Tax Deductible" id="is_tax_deductible" {...register("is_tax_deductible")} />
                    <CheckboxField label="SSO Deductible" id="is_sso_deductible" {...register("is_sso_deductible")} />
                </div>
            </div>
        </Modal>
    );
};

export default DeductionTypeFormModal;
