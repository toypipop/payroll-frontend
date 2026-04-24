import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";

const payrollConfigSchema = z.object({
    companies_id: z.number(),
    sso_rate: z.preprocess((val) => parseFloat(val), z.number().min(0, "Invalid rate")),
    sso_max_amount: z.preprocess((val) => parseFloat(val), z.number().min(0, "Invalid amount")),
    sso_min_salary: z.preprocess((val) => parseFloat(val), z.number().min(0, "Invalid amount")),
    tax_calculation: z.string().min(1, "Tax method is required"),
});

const PayrollGlobalSettingsPage = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompanie, setSelectedCompanie] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(payrollConfigSchema),
        defaultValues: {
            sso_rate: 5.0,
            tax_calculation: "Progressive",
        },
    });

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await api.get("/global");
            setConfigs(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfigs(); }, []);

    const onSubmit = async (data) => {
        try {
            await api.post("/global", data);
            fetchConfigs();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEditConfig = (companie) => {
        setSelectedCompanie(companie);
        setValue("companies_id", companie.ID || companie.id);
        setValue("sso_rate", companie.payroll_config?.sso_rate || 5.0);
        setValue("sso_max_amount", companie.payroll_config?.sso_max_amount || 750);
        setValue("sso_min_salary", companie.payroll_config?.sso_min_salary || 1650);
        setValue("tax_calculation", companie.payroll_config?.tax_calculation || "Progressive");

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCompanie(null);
        reset();
    };

    const columns = [
        { label: "Companies", key: "name" }, // Now 'name' is directly in the row (English Comment)
        {
            label: "SSO Rate",
            render: (row) => row.payroll_config ? `${row.payroll_config.sso_rate}%` : <span style={{ color: '#94a3b8' }}>Not Set</span>
        },
        {
            label: "Tax Method",
            render: (row) => {
                const labels = { Progressive: "Progressive Rate", Fixed: "Fixed Rate", None: "No Tax" };
                const val = row.payroll_config?.tax_calculation;
                return val ? (labels[val] || val) : <span style={{ color: '#94a3b8' }}>Not Set</span>;
            }
        },
        {
            label: "Actions",
            render: (row) => (
                <Button variant="ghost" onClick={() => handleEditConfig(row)} style={{ fontSize: "12px" }}>
                    {row.payroll_config ? "Update Setup" : "Initial Setup"}
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Global Payroll Settings" />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={configs} />
                )}
            </Card>

            <Modal
    isOpen={isModalOpen}
    onClose={closeModal}
    title={`Payroll Setup: ${selectedCompanie?.name}`}
    footer={
        <>
            <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>Save Config</Button>
        </>
    }
>
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <InputField label="SSO Rate (%)" type="number" step="0.1" {...register("sso_rate")} error={errors.sso_rate?.message} />
        <InputField label="Max SSO Amount" type="number" {...register("sso_max_amount")} error={errors.sso_max_amount?.message} />
        <InputField label="Min Salary for SSO" type="number" {...register("sso_min_salary")} error={errors.sso_min_salary?.message} />
        <SelectField 
            label="Tax Calculation" 
            {...register("tax_calculation")} 
            error={errors.tax_calculation?.message}
            options={[
                { id: "Progressive", name: "Progressive Rate" },
                { id: "Fixed", name: "Fixed Rate" },
                { id: "None", name: "No Tax" }
            ]}
        />
    </div>
</Modal>
        </>
    );
};

export default PayrollGlobalSettingsPage;
