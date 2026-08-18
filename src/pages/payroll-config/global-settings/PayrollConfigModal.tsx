import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";

const payrollConfigSchema = z.object({
    companies_id: z.number(),
    sso_rate: z.preprocess((val) => parseFloat(String(val)), z.number().min(0, "Invalid rate")),
    sso_max_amount: z.preprocess((val) => parseFloat(String(val)), z.number().min(0, "Invalid amount")),
    sso_min_salary: z.preprocess((val) => parseFloat(String(val)), z.number().min(0, "Invalid amount")),
    tax_calculation: z.string().min(1, "Tax method is required"),
});

// PayrollConfigModal owns the config form and the save call; the page only says which company is being configured.
const PayrollConfigModal = ({ isOpen, onClose, onSaved, company }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(payrollConfigSchema),
        defaultValues: {
            companies_id: 0,
            sso_rate: 5.0,
            sso_max_amount: 750,
            sso_min_salary: 1650,
            tax_calculation: "Progressive",
        },
    });

    // Re-seed the form whenever the page opens the modal, falling back to the statutory defaults for a company with no config yet.
    useEffect(() => {
        if (!isOpen || !company) return;
        reset({
            companies_id: company.id,
            sso_rate: company.payroll_config?.sso_rate || 5.0,
            sso_max_amount: company.payroll_config?.sso_max_amount || 750,
            sso_min_salary: company.payroll_config?.sso_min_salary || 1650,
            tax_calculation: company.payroll_config?.tax_calculation || "Progressive",
        });
    }, [isOpen, company, reset]);

    const onSubmit = async (data) => {
        try {
            await api.post("/global", data);
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
            title={`Payroll Setup: ${company?.name}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>Save Config</Button>
                </>
            }
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <InputField label="SSO Rate (%)" type="number" step="0.1" {...register("sso_rate")} error={errors.sso_rate?.message} required />
                <InputField label="Max SSO Amount" type="number" {...register("sso_max_amount")} error={errors.sso_max_amount?.message} required />
                <InputField label="Min Salary for SSO" type="number" {...register("sso_min_salary")} error={errors.sso_min_salary?.message} required />
                <SelectField
                    label="Tax Calculation"
                    {...register("tax_calculation")}
                    error={errors.tax_calculation?.message}
                    options={[
                        { id: "Progressive", name: "Thai Progressive Rate" },
                        { id: "None", name: "No Tax" }
                    ]}
                    required
                />
            </div>
        </Modal>
    );
};

export default PayrollConfigModal;
