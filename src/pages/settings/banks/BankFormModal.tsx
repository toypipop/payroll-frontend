import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import { apiErrorMessage } from "../../../utils/apiError";
import { bankSchema } from "../../../utils/bankValidation";
import type { Bank } from "../../../types/domain";

type BankFormValues = z.infer<typeof bankSchema>;

const EMPTY = { bank_code: "", bank_name: "", swift_code: "" };

// BankFormModal owns the form and the save call; the page only says which row is being edited.
interface BankFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: Bank | null;
}

const BankFormModal = ({ isOpen, onClose, onSaved, editing }: BankFormModalProps) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(bankSchema),
        defaultValues: EMPTY,
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? { bank_code: editing.bank_code, bank_name: editing.bank_name, swift_code: editing.swift_code || "" }
            : EMPTY);
    }, [isOpen, editing, reset]);

    const onSubmit = async (data: BankFormValues) => {
        try {
            if (editing) {
                await api.put(`/master/banks/${editing.id}`, data);
            } else {
                await api.post("/master/banks", data);
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
            title={editing ? "Edit Bank" : "Add New Bank"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)}>{editing ? "Update" : "Save"}</Button>
                </>
            }
        >
            <InputField label="Bank Code (e.g. BBL, KBANK)" {...register("bank_code")} error={errors.bank_code?.message} required />
            <InputField label="Bank Name" {...register("bank_name")} error={errors.bank_name?.message} required />
            <InputField label="SWIFT Code" {...register("swift_code")} error={errors.swift_code?.message} />
        </Modal>
    );
};

export default BankFormModal;
