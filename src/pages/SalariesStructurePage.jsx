import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../api/axiosInstance";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import CheckboxField from "../components/common/CheckboxField";
import Badge from "../components/common/Badge";

/* --- 1. Validation Schema (English Comment) --- */
const salariesSchema = z.object({
    employees_id: z.number(),
    base_salaries: z.preprocess(
        (val) => parseFloat(val),
        z.number().min(0, "Salaries must be a positive number")
    ),
    // Validate that effective_date is a valid string (English Comment)
    effective_date: z.string().min(1, "Effective date is required"),
    is_enabled: z.boolean().default(true),
});

const SalariesStructurePage = () => {
    const [salariesData, setSalariesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);

    // Get today's date in YYYY-MM-DD format for default value (English Comment)
    const today = new Date().toISOString().split("T")[0];

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(salariesSchema),
        defaultValues: {
            effective_date: today,
            is_enabled: true,
        },
    });

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await api.get("/salaries");
            setSalariesData(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalaries();
    }, []);

    const onSubmit = async (data) => {
        try {
            // Send both salaries and effective date to backend (English Comment)
            await api.post("/salaries", data);
            fetchSalaries();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEditSalaries = (emp) => {
        setSelectedEmp(emp);
        setValue("employees_id", emp.ID || emp.id);
        setValue("base_salaries", emp.salaries_structure?.base_salaries || 0);

        const existingDate = emp.salaries_structure?.effective_date;
        let finalDate = today;

        // Use existing date only if it's not a zero date (English Comment)
        if (existingDate && !existingDate.startsWith("0001")) {
            try {
                finalDate = new Date(existingDate).toISOString().split("T")[0];
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                finalDate = today;
            }
        }
        setValue("effective_date", finalDate);
        setValue("is_enabled", emp.salaries_structure?.is_enabled ?? true);

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmp(null);
        reset({ effective_date: today, is_enabled: true });
    };

    const columns = [
        { label: "Code", key: "employees_code" },
        {
            label: "Full Name",
            render: (row) => `${row.employees?.first_name} ${row.last_name}`,
        },
        { label: "Department", render: (row) => row.department?.dept_name || "N/A" },
        {
            label: "Base Salaries",
            render: (row) => {
                const amount = row.salaries_structure?.base_salaries || 0;
                return amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
            },
        },
        {
            label: "Effective Date",
            render: (row) => {
                const date = row.salaries_structure?.effective_date;
                if (!date || date.startsWith("0001")) return "-";
                try {
                    return new Date(date).toLocaleDateString();
                    // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    return "-";
                }
            },
        },
        {
            label: "Salary Status",
            render: (row) => {
                const isEnabled = row.salaries_structure?.is_enabled ?? false;
                if (!row.salaries_structure) return <span style={{ color: "#9ca3af" }}>-</span>;
                return (
                    <Badge status={isEnabled}>
                        {isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                );
            },
        },
        {
            label: "Actions",
            render: (row) => (
                <Button
                    variant="ghost"
                    onClick={() => handleEditSalaries(row)}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                    Update Salaries
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Salaries Management" />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={salariesData} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={`Adjust Salaries: ${selectedEmp?.first_name} ${selectedEmp?.last_name}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>
                            Save Changes
                        </Button>
                    </>
                }
            >
                <InputField
                    label="Base Salaries (Monthly)"
                    type="number"
                    step="0.01"
                    {...register("base_salaries")}
                    error={errors.base_salaries?.message}
                />

                {/* Added Effective Date Field (English Comment) */}
                <InputField
                    label="Effective Date"
                    type="date"
                    {...register("effective_date")}
                    error={errors.effective_date?.message}
                />

                <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    * Adjustments will be applied to payroll calculations from this date onwards.
                </p>
                <CheckboxField
                    label="Enable Salary Structure"
                    id="is_enabled"
                    {...register("is_enabled")}
                    error={errors.is_enabled?.message}
                />
            </Modal>
        </>
    );
};

export default SalariesStructurePage;