import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";

const schema = z.object({
    companies_id: z.string().min(1, "Company is required"),
    name: z.string().min(1, "Location name is required"),
});

// WorkLocationFormModal owns the form and the save call; the page only says which row is being edited.
const WorkLocationFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companyOptions }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
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

    const onSubmit = async (data) => {
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
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Work Location" : "Add Work Location"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>{editing ? "Update" : "Save"}</Button>
                </>
            }
        >
            <SelectField
                label="Company"
                options={companyOptions}
                {...register("companies_id")}
                error={errors.companies_id?.message}
                required
            />
            <InputField label="Location Name (e.g. Office, WFH)" {...register("name")} error={errors.name?.message} required />
        </Modal>
    );
};

export default WorkLocationFormModal;
