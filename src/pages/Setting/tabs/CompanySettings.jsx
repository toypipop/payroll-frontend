import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";

/* --- 1. Define Company Schema (English Comment) --- */
const companySchema = z.object({
    name: z.string().min(1, "Company name is required"),
    tax_id: z
        .string()
        .length(13, "Tax ID must be exactly 13 digits")
        .regex(/^\d+$/, "Tax ID must contain only numbers"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    phone: z
        .string()
        .min(9, "Phone number is too short")
        .max(10, "Phone number is too long")
        .regex(/^\d+$/, "Phone must contain only numbers"),
});

const CompanySettings = () => {
    const [company, setCompany] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    /* --- 2. Initialize Hook Form (English Comment) --- */
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(companySchema),
        defaultValues: { name: "", tax_id: "", address: "", phone: "" },
    });

    const fetchCompany = async () => {
        try {
            setLoading(true);
            const response = await api.get("/company");
            setCompany(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompany();
    }, []);

    /* --- 3. Handle Submit with Data from Hook Form (English Comment) --- */
    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/company/${editingId}`, data);
            } else {
                await api.post("/company", data);
            }
            fetchCompany();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.ID || item.id);
        // Use reset to fill the entire form with item data (English Comment)
        reset({
            name: item.name,
            tax_id: item.tax_id,
            address: item.address,
            phone: item.phone,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this company?")) {
            try {
                await api.delete(`/company/${id}`);
                fetchCompany();
            } catch (err) {
                alert(err.response?.data?.error || "Delete Failed");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ name: "", tax_id: "", address: "", phone: "" }); // Reset to default empty values
    };

    const columns = [
        { label: "Company Name", key: "name" },
        { label: "Tax ID", key: "tax_id" },
        { label: "Phone", key: "phone" },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        variant="ghost"
                        onClick={() => handleEdit(row)}
                        style={smallBtn}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row.ID || row.id)}
                        style={smallBtn}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <h3
                    style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1e293b",
                        margin: 0,
                    }}
                >
                    Company Management
                </h3>
                <Button
                    onClick={() => {
                        setEditingId(null); // Ensure it's not in edit mode
                        reset({ name: "", tax_id: "", address: "", phone: "" }); // Clear form
                        setIsModalOpen(true);
                    }}
                    style={{ width: "auto" }}
                >
                    + Add Company
                </Button>
            </div>

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                    Loading...
                </div>
            ) : (
                <Table columns={columns} data={company} />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Company" : "Add New Company"}
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={closeModal}
                            style={{ width: "auto" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            style={{ width: "auto" }}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                {/* 4. Connect Fields with register (English Comment) */}
                <InputField
                    label="Company Name"
                    {...register("name")}
                    error={errors.name?.message}
                />
                <InputField
                    label="Tax ID (13 Digits)"
                    {...register("tax_id")}
                    error={errors.tax_id?.message}
                />
                <InputField
                    label="Address"
                    {...register("address")}
                    error={errors.address?.message}
                />
                <InputField
                    label="Phone Number"
                    {...register("phone")}
                    error={errors.phone?.message}
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default CompanySettings;
