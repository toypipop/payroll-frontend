import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";

const schema = z.object({
    name: z.string().min(1, "Category name is required"),
});

const EarningCategoryPage = () => {
    const [earningCats, setEarningCats] = useState([]);
    const [deductionCats, setDeductionCats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Separate modal state for earning vs deduction categories
    const [modalType, setModalType] = useState(null); // "earning" | "deduction"
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "" },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ecRes, dcRes] = await Promise.all([
                api.get("/master/earning-categories"),
                api.get("/master/deduction-categories"),
            ]);
            setEarningCats(ecRes.data || []);
            setDeductionCats(dcRes.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onSubmit = async (data) => {
        const base = modalType === "earning" ? "/master/earning-categories" : "/master/deduction-categories";
        try {
            if (editingId) {
                await api.put(`${base}/${editingId}`, data);
            } else {
                await api.post(base, data);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const openCreateModal = (type) => {
        setModalType(type);
        setEditingId(null);
        reset({ name: "" });
    };

    const handleEdit = (item, type) => {
        setModalType(type);
        setEditingId(item.id);
        reset({ name: item.name });
    };

    const closeModal = () => {
        setModalType(null);
        setEditingId(null);
        reset({ name: "" });
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm("Delete this category?")) return;
        const base = type === "earning" ? "/master/earning-categories" : "/master/deduction-categories";
        try {
            await api.delete(`${base}/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const makeColumns = (type) => [
        { label: "Category Name", key: "name" },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row, type)} style={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id, type)} style={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];

    const sectionTitle = { fontWeight: 600, fontSize: "15px", marginBottom: "12px", marginTop: "4px" };

    return (
        <>
            <PageHeader title="Earning & Deduction Categories" />

            <Card style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={sectionTitle}>Earning & Deduction</span>
                    <Button onClick={() => openCreateModal("earning")} style={{ width: "auto" }}>+ Add</Button>
                </div>
                {loading ? <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div> : <Table columns={makeColumns("earning")} data={earningCats} />}
            </Card>

            <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={sectionTitle}>Deduction Categories</span>
                    <Button onClick={() => openCreateModal("deduction")} style={{ width: "auto" }}>+ Add</Button>
                </div>
                {loading ? <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div> : <Table columns={makeColumns("deduction")} data={deductionCats} />}
            </Card>

            <Modal
                isOpen={modalType !== null}
                onClose={closeModal}
                title={`${editingId ? "Edit" : "Add"} ${modalType === "earning" ? "Earning" : "Deduction"} Category`}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>{editingId ? "Update" : "Save"}</Button>
                    </>
                }
            >
                <InputField label="Category Name" {...register("name")} error={errors.name?.message} />
            </Modal>
        </>
    );
};

export default EarningCategoryPage;
