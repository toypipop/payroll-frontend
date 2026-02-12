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

/* --- 1. Validation Schema (English Comment) --- */
const salariesSchema = z.object({
    employee_id: z.number(),
    base_salaries: z.preprocess(
        (val) => parseFloat(val),
        z.number().min(0, "Salaries must be a positive number")
    ),
    // Validate that effective_date is a valid string (English Comment)
    effective_date: z.string().min(1, "Effective date is required"),
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
        },
    });

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await api.get("/employees");
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
        setValue("employee_id", emp.ID || emp.id);
        setValue("base_salaries", emp.salaries_structure?.base_salaries || 0);
        
        // If employee has an existing effective date, format it for input type="date" (English Comment)
        const existingDate = emp.salaries_structure?.effective_date 
            ? new Date(emp.salaries_structure.effective_date).toISOString().split("T")[0]
            : today;
            
        setValue("effective_date", existingDate);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmp(null);
        reset({ effective_date: today }); // Reset with default date
    };

    const columns = [
        { label: "Code", key: "employee_code" },
        {
            label: "Full Name",
            render: (row) => `${row.first_name} ${row.last_name}`,
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
                return date ? new Date(date).toLocaleDateString() : "-";
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
            </Modal>
        </>
    );
};

export default SalariesStructurePage;