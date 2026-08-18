import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import DateField from "../../../components/common/DateField";
import SelectField from "../../../components/common/SelectField";

const cycleSchema = z.object({
    cycle_name: z.string().min(1, "Cycle name is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    companies_id: z.string().min(1, "Company is required"),
}).refine((d) => d.end_date > d.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
});

// CycleFormModal owns the create form and the save call. A cycle is never edited here, only created or closed.
const CycleFormModal = ({ isOpen, onClose, onSaved, homeCompanyId, companies }) => {
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: zodResolver(cycleSchema),
        defaultValues: { companies_id: homeCompanyId, cycle_name: "", start_date: "", end_date: "" },
    });

    // Re-seed the form whenever the page opens the modal, so a cancelled draft never reappears.
    useEffect(() => {
        if (!isOpen) return;
        reset({ companies_id: homeCompanyId, cycle_name: "", start_date: "", end_date: "" });
    }, [isOpen, homeCompanyId, reset]);

    const onSubmit = async (data) => {
        try {
            await api.post("/payroll/cycles", {
                cycle_name: data.cycle_name,
                start_date: data.start_date + "T00:00:00Z",
                end_date: data.end_date + "T00:00:00Z",
                companies_id: Number(data.companies_id),
            });
            onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create cycle");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Payroll Cycle"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>Create Cycle</Button>
                </>
            }
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <Controller
                    name="companies_id"
                    control={control}
                    render={({ field }) => (
                        <SelectField
                            label="Company"
                            options={companies}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            error={errors.companies_id?.message}
                            required
                        />
                    )}
                />
                <InputField
                    label="Cycle Name"
                    error={errors.cycle_name?.message}
                    {...register("cycle_name")}
                    required
                />
                <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                        <DateField
                            label="Start Date"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.start_date?.message}
                            required
                        />
                    )}
                />
                <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                        <DateField
                            label="End Date"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.end_date?.message}
                            required
                        />
                    )}
                />
            </div>
        </Modal>
    );
};

export default CycleFormModal;
