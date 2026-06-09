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

const schema = z.object({
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

const EmploymentTypePage = () => {
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const defaultCompanieId = userData.companies_id;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: defaultCompanieId, name: "", description: "" },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [typesRes, companiesRes] = await Promise.all([
                api.get("/master/employment-types"),
                api.get("/companies/options"),
            ]);
            setItems(typesRes.data || []);
            setCompanies(companiesRes.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/master/employment-types/${editingId}`, data);
            } else {
                await api.post("/master/employment-types", data);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        reset({ companies_id: item.companies_id, name: item.name, description: item.description || "" });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ companies_id: defaultCompanieId, name: "", description: "" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this employment type?")) return;
        try {
            await api.delete(`/master/employment-types/${id}`);
            fetchData();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
        }
    };

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
        { label: "Name", key: "name" },
        { label: "Description", key: "description" },
        {
            label: "Companies",
            sortKey: "companies.name",
            sortValue: (row) => (row.companies?.name || "").toLowerCase(),
            searchValue: (row) => row.companies?.name || "",
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} style={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Employment Types"
                actionButton={
                    <Button onClick={() => { setEditingId(null); reset({ companies_id: defaultCompanieId, name: "", description: "" }); setIsModalOpen(true); }} style={{ width: "auto" }}>
                        + Add Employment Type
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Employment Type" : "Add Employment Type"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>{editingId ? "Update" : "Save"}</Button>
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
                    <InputField label="Name (e.g. Full-time, Contract)" {...register("name")} error={errors.name?.message} />
                    <InputField label="Description" {...register("description")} error={errors.description?.message} />
                </div>
            </Modal>
        </>
    );
};

export default EmploymentTypePage;
