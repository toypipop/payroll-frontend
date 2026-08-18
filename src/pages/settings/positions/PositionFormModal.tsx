import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";

const positionSchema = z.object({
    pos_name: z.string().min(1, "Position name is required"),
    companies_id: z.coerce.number().min(1, "Please select a companies"),
});

// PositionFormModal owns the form and the save call; the page only says which row is being edited.
const PositionFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companies }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(positionSchema),
        defaultValues: { pos_name: "", companies_id: homeCompanyId },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? { pos_name: editing.pos_name, companies_id: editing.companies_id }
            : { pos_name: "", companies_id: homeCompanyId });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data) => {
        try {
            if (editing) {
                await api.put(`/positions/${editing.id}`, data);
            } else {
                await api.post("/positions", data);
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
            title={editing ? "Edit Position" : "Add New Position"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <SelectField
                label="Companies"
                {...register("companies_id")}
                error={errors.companies_id?.message}
                options={companies.map((c) => ({ id: c.id, name: c.name }))}
                disabled={!!editing}
                required
            />
            <InputField
                label="Position Name"
                {...register("pos_name")}
                error={errors.pos_name?.message}
                required
            />
        </Modal>
    );
};

export default PositionFormModal;
