import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";

const companiesSchema = z.object({
    name: z.string().min(1, "Companies name is required"),
    tax_id: z
        .string()
        .length(13, "Tax ID must be exactly 13 digits")
        .regex(/^\d+$/, "Tax ID must contain only numbers"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    phone: z
        .string()
        .min(9, "Phone number is too short")
        .max(10, "Phone number is too long")
        .regex(/^\d+$/, "Phone must contain only numbers"),
});

const EMPTY = { name: "", tax_id: "", address: "", phone: "" };

// CompanyFormModal owns the form and the save call; the page only says which row is being edited.
const CompanyFormModal = ({ isOpen, onClose, onSaved, editing }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(companiesSchema),
        defaultValues: EMPTY,
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? { name: editing.name, tax_id: editing.tax_id, address: editing.address, phone: editing.phone }
            : EMPTY);
    }, [isOpen, editing, reset]);

    const onSubmit = async (data) => {
        try {
            if (editing) {
                await api.put(`/companies/${editing.id}`, data);
            } else {
                await api.post("/companies", data);
            }
            onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Companies" : "Add New Companies"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)}>
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
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
        </Modal>
    );
};

export default CompanyFormModal;
