import { textField, companyTaxIDField, companyPhoneField } from "../../../utils/fieldValidation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import { apiErrorMessage, isCompanyInactiveError } from "../../../utils/apiError";
import type { Company } from "../../../types/domain";

const companiesSchema = z.object({
    name: textField("Company name", 1),
    tax_id: companyTaxIDField,
    address: textField("Address", 5),
    phone: companyPhoneField,
});

type CompanyFormValues = z.infer<typeof companiesSchema>;

const EMPTY = { name: "", tax_id: "", address: "", phone: "" };

// CompanyFormModal owns the form and the save call; the page only says which row is being edited.
interface CompanyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: Company | null;
}

const CompanyFormModal = ({ isOpen, onClose, onSaved, editing }: CompanyFormModalProps) => {
    const [saveError, setSaveError] = useState("");
    const [inactive, setInactive] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(companiesSchema),
        defaultValues: EMPTY,
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        // Reset modal feedback together with the selected record.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSaveError("");
        setInactive(editing?.is_active === false);
        reset(editing
            ? { name: editing.name, tax_id: editing.tax_id, address: editing.address, phone: editing.phone }
            : EMPTY);
    }, [isOpen, editing, reset]);

    const onSubmit = async (data: CompanyFormValues) => {
        if (inactive || editing?.is_active === false) return;
        setSaveError("");
        try {
            if (editing) {
                await api.put(`/companies/${editing.id}`, data);
            } else {
                await api.post("/companies", data);
            }
            onSaved();
            onClose();
        } catch (err) {
            setSaveError(apiErrorMessage(err, "Save Failed"));
            if (isCompanyInactiveError(err)) {
                setInactive(true);
                onSaved();
            }
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { if (!isSubmitting) onClose(); }}
            title={editing ? "Edit Companies" : "Add New Companies"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || inactive || editing?.is_active === false}>
                        {isSubmitting ? "Saving..." : editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            {saveError && <p role="alert" className="mb-4 text-sm text-danger">{saveError}</p>}
            <fieldset disabled={isSubmitting || inactive || editing?.is_active === false}>
            <InputField
                label="Companies Name"
                {...register("name")}
                error={errors.name?.message}
                required
            />
            <InputField
                label="Tax ID (13 Digits)"
                {...register("tax_id")}
                error={errors.tax_id?.message}
                required
            />
            <InputField
                label="Address"
                {...register("address")}
                error={errors.address?.message}
                required
            />
            <InputField
                label="Phone Number"
                {...register("phone")}
                error={errors.phone?.message}
                required
            />
            </fieldset>
        </Modal>
    );
};

export default CompanyFormModal;
