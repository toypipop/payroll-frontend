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
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

const EmploymentTypePage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "", description: "" },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/master/employment-types");
            setItems(res.data || []);
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
        reset({ name: item.name, description: item.description || "" });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ name: "", description: "" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this employment type?")) return;
        try {
            await api.delete(`/master/employment-types/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
        { label: "Name", key: "name" },
        { label: "Description", key: "description" },
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
                    <Button onClick={() => { setEditingId(null); reset({ name: "", description: "" }); setIsModalOpen(true); }} style={{ width: "auto" }}>
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
                <InputField label="Name (e.g. Full-time, Contract)" {...register("name")} error={errors.name?.message} />
                <InputField label="Description" {...register("description")} error={errors.description?.message} />
            </Modal>
        </>
    );
};

export default EmploymentTypePage;
