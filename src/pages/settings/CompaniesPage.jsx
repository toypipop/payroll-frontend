import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import PageHeader from "../../components/common/PageHeader";
import api from "../../api/axiosInstance";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import Card from "../../components/common/Card";

const companiesSchema = z.object({
    name: z.string().min(1, "Companies name is required"),
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

const CompaniesPage = () => {
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
        resolver: zodResolver(companiesSchema),
        defaultValues: { name: "", tax_id: "", address: "", phone: "" },
    });

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await api.get("/companies/all");
            setCompanies(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/companies/${editingId}`, data);
            } else {
                await api.post("/companies", data);
            }
            fetchCompanies();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.ID || item.id);
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
        if (window.confirm("Are you sure you want to delete this companies?")) {
            try {
                await api.delete(`/companies/${id}`);
                fetchCompanies();
            } catch (err) {
                alert(err.response?.data?.error || "Delete Failed");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ name: "", tax_id: "", address: "", phone: "" });
    };

    const columns = [
        { label: "Companies Name", key: "name" },
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

            <PageHeader
                title="Companies Directory"
                actionButton={
                    <Button
                        onClick={() => {
                            setEditingId(null);
                            reset({ name: "", tax_id: "", address: "", phone: "" });
                            setIsModalOpen(true);
                        }}
                        style={{ width: "auto" }}
                    >
                        + Add Companies
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={companies} />
                )}
            </Card>


            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Companies" : "Add New Companies"}
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
                <InputField
                    label="Companies Name"
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

export default CompaniesPage;
