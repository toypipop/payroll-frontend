import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";

// Department schema definition
const departmentSchema = z.object({
    dept_name: z.string().min(1, "Department name is required"),
    companies_id: z.coerce.number().min(1, "Please select a companies"),
});

const DepartmentSettings = () => {
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(departmentSchema),
        defaultValues: { dept_name: "", companies_id: "" },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, compRes] = await Promise.all([
                api.get("/departments"),
                api.get("/companies/options"),
            ]);
            setDepartments(deptRes.data || []);
            setCompanies(compRes.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/departments/${editingId}`, data);
            } else {
                await api.post("/departments", data);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        // Use id from your backend response (English Comment)
        setEditingId(item.id || item.ID);
        reset({
            dept_name: item.dept_name,
            companies_id: item.companies_id,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ dept_name: "", companies_id: "" });
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this department?")) {
            try {
                await api.delete(`/departments/${id}`);
                fetchData();
            } catch (err) {
                alert(err.response?.data?.error || "Delete Failed");
            }
        }
    };

    // Table columns configuration
    const columns = [
        { label: "Department Name", key: "dept_name" },
        { 
            label: "Companies", 
            render: (row) => row.companies?.name || "N/A" 
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={smallBtn}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id || row.ID)} style={smallBtn}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Department Management"
                actionButton={
                    <Button
                        onClick={() => {
                            setEditingId(null);
                            reset({ dept_name: "", companies_id: "" });
                            setIsModalOpen(true);
                        }}
                        style={{ width: "auto" }}
                    >
                        + Add Department
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={departments} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Department" : "Add New Department"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                // Form fields with SelectField
                <SelectField
                    label="Companies"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    // Map data to SelectField format
                    options={companies.map((c) => ({
                        id: c.id || c.ID,
                        name: c.name
                    }))}
                />

                <InputField
                    label="Department Name"
                    {...register("dept_name")}
                    error={errors.dept_name?.message}
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default DepartmentSettings;
