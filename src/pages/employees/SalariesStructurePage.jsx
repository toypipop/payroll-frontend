import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import DecimalField from "../../components/common/DecimalField";
import DateField from "../../components/common/DateField";
import CheckboxField from "../../components/common/CheckboxField";
import Badge from "../../components/common/Badge";

/* --- 1. Validation Schema (English Comment) --- */
const salariesSchema = z.object({
    employees_id: z.number(),
    base_salaries: z.preprocess(
        (val) => parseFloat(val),
        z.number().min(0, "Salaries must be a positive number")
    ),
    effective_date: z.string().min(1, "Effective date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    is_active: z.boolean().default(true),
});

const SalariesStructurePage = () => {
    const [salariesData, setSalariesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);

    const {
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(salariesSchema),
        defaultValues: {
            effective_date: new Date().toISOString().split("T")[0],
            deleted_at: true,
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
            await api.post("/salaries", {
                ...data,
                effective_date: data.effective_date,
                deleted_at: data.is_active ? null : true,
            });
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
        let finalDate = new Date().toISOString().split("T")[0];

        if (existingDate && !existingDate.startsWith("0001")) {
            try {
                const d = new Date(existingDate);
                finalDate = d.toISOString().split("T")[0];
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                finalDate = new Date().toISOString().split("T")[0];
            }
        }
        setValue("effective_date", finalDate);
        setValue("is_active", !!emp.salaries_structure?.id);

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmp(null);
        reset({ effective_date: new Date().toISOString().split("T")[0], is_active: true });
    };

    const columns = [
        { label: "Code", key: "employees_code" },
        {
            label: "Full Name",
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        { label: "Department", render: (row) => row.department?.dept_name || "N/A" },
        {
            label: "Base Salaries",
            render: (row) => {
                const amount = row.salaries_structure?.base_salaries || 0;
                return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                const ss = row.salaries_structure;
                if (!ss || !ss.id) return <Badge status={false}>Disabled</Badge>;
                const isDeleted = ss.deleted_at && ss.deleted_at !== 0 && ss.deleted_at !== "0";
                return (
                    <Badge status={!isDeleted}>
                        {!isDeleted ? "Enabled" : "Disabled"}
                    </Badge>
                );
            },
        },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "-",
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
                <Controller
                    name="base_salaries"
                    control={control}
                    render={({ field }) => (
                        <DecimalField
                            label="Base Salaries (Monthly)"
                            decimals={2}
                            placeholder="0.00"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.base_salaries?.message}
                        />
                    )}
                />

                <Controller
                    name="effective_date"
                    control={control}
                    render={({ field }) => (
                        <DateField
                            label="Effective Date"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.effective_date?.message}
                        />
                    )}
                />

                <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    * Adjustments will be applied to payroll calculations from this date onwards.
                </p>
                <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                        <CheckboxField
                            label="Active Salary Structure"
                            id="is_active"
                            checked={field.value}
                            onChange={field.onChange}
                            error={errors.is_active?.message}
                        />
                    )}
                />
            </Modal>
        </>
    );
};

export default SalariesStructurePage;
