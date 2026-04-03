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

const roleSchema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a companie")),
    roles_name: z.string().min(1, "Role name is required"),
});

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const defaultCompanieId = userData.companies_id;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            companies_id: defaultCompanieId,
            roles_name: "",
        },
    });

    const editingId = watch("id");

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [rolesRes, companiesRes] = await Promise.all([
                api.get("/roles"),
                api.get("/companies/options")
            ]);
            setRoles(rolesRes.data);
            setCompanies(companiesRes.data);
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            console.error("Initial load failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    const onSubmit = async (data) => {
        try {
            if (data.id) {
                await api.put(`/roles/${data.id}`, data);
            } else {
                await api.post("/roles", data);
            }
            const res = await api.get("/roles");
            setRoles(res.data);
            closeModal();
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        }
    };

    const handleEdit = (item) => {
        reset({
            id: item.id,
            companies_id: item.companies_id,
            roles_name: item.roles_name,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await api.delete(`/roles/${id}`);
            const res = await api.get("/roles");
            setRoles(res.data);
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            alert("Delete failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset({ 
            id: undefined, 
            companies_id: defaultCompanieId, 
            roles_name: "" 
        });
    };

    const columns = [
        { label: "Role Name", key: "roles_name" },
        { 
            label: "Companies", 
            render: (row) => row.companies?.name || "N/A"
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button 
                        variant="ghost" 
                        onClick={() => handleEdit(row)} 
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                    >
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} style={{ fontSize: "12px", padding: "4px 8px", color: "#ef4444" }}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Roles Management"
                actionButton={
                    <Button onClick={() => setIsModalOpen(true)} style={{ width: "auto" }}>
                        + Add Role
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={roles} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Role" : "Add Role"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button 
                            onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))} 
                            style={{ width: "auto" }}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <SelectField 
                        label="Companies"
                        {...register("companies_id")}
                        error={errors.companies_id?.message}
                        options={companies.map(c => ({ id: c.id, name: c.name }))}
                    />
                    <InputField 
                        label="Role Name" 
                        {...register("roles_name")} 
                        error={errors.roles_name?.message} 
                    />
                </div>
            </Modal>
        </>
    );
};

export default RolesPage;
