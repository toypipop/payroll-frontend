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

const earningSchema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a companie")),
    name: z.string().min(1, "Name is required"),
    is_taxable: z.boolean().default(true),
    is_sso: z.boolean().default(true),
});

// EarningTypeFormModal owns the form and the save call; the page only says which row is being edited.
const EarningTypeFormModal = ({ isOpen, onClose, onSaved, editing, defaultCompanieId, companies }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
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
        reset(editing || {
            id: undefined,
            companies_id: defaultCompanieId,
            is_taxable: true,
            is_sso: true,
        });
    }, [isOpen, editing, defaultCompanieId, reset]);

    const onSubmit = async (data) => {
        try {
            if (data.id) {
                await api.put(`/earning-types/${data.id}`, data);
            } else {
                await api.post("/earning-types", data);
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
            title={editing ? "Edit Earning Type" : "Add Earning Type"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))} style={{ width: "auto" }}>
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <SelectField
                    label="Companies"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    options={companies.map(c => ({ id: c.id, name: c.name }))}
                    disabled={!!editing}
                    required
                />
                <InputField label="Earning Name" {...register("name")} error={errors.name?.message} required />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <CheckboxField label="Is Taxable" id="is_taxable" {...register("is_taxable")} />
                    <CheckboxField label="Include in SSO" id="is_sso" {...register("is_sso")} />
                </div>
            </div>
        </Modal>
    );
};

export default EarningTypeFormModal;
