import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import DateField from "../../../components/common/DateField";
import CheckboxField from "../../../components/common/CheckboxField";
import SelectField from "../../../components/common/SelectField";

const schema = z.object({
    companies_id: z.string().min(1, "Company is required"),
    date: z.string().min(1, "Date is required"),
    name: z.string().min(1, "Holiday name is required"),
    is_paid: z.boolean().default(true),
});

// HolidayFormModal owns the form and the save call; the page only says which row is being edited.
const HolidayFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, companyOptions }) => {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, date: "", name: "", is_paid: true },
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                companies_id: editing.companies_id ? String(editing.companies_id) : "",
                date: editing.date ? editing.date.substring(0, 10) : "",
                name: editing.name,
                is_paid: editing.is_paid,
            }
            : { companies_id: homeCompanyId, date: "", name: "", is_paid: true });
    }, [isOpen, editing, homeCompanyId, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = { ...data, companies_id: Number(data.companies_id) };
            if (editing) {
                await api.put(`/master/holidays/${editing.id}`, payload);
            } else {
                await api.post("/master/holidays", payload);
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
            title={editing ? "Edit Holiday" : "Add Holiday"}
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
            <Controller
                name="date"
                control={control}
                render={({ field }) => (
                    <DateField
                        name={field.name}
                        label="Date"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.date?.message}
                        required
                    />
                )}
            />
            <InputField label="Holiday Name" {...register("name")} error={errors.name?.message} required />
            <CheckboxField label="Paid Holiday" {...register("is_paid")} />
        </Modal>
    );
};

export default HolidayFormModal;
