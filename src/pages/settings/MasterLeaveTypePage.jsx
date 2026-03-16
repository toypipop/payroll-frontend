import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import CheckboxField from "../../components/common/CheckboxField";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";

const schema = z.object({
    name: z.string().min(1, "Leave type name is required"),
    is_paid: z.boolean().default(true),
    max_days_per_year: z.coerce.number().min(0, "Must be 0 or more").default(0),
});

const MasterLeaveTypePage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "", is_paid: true, max_days_per_year: 0 },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/master/leave-types");
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
                await api.put(`/master/leave-types/${editingId}`, data);
            } else {
                await api.post("/master/leave-types", data);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        reset({ name: item.name, is_paid: item.is_paid, max_days_per_year: item.max_days_per_year || 0 });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ name: "", is_paid: true, max_days_per_year: 0 });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this leave type?")) return;
        try {
            await api.delete(`/master/leave-types/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
        { label: "Leave Type", key: "name" },
        { label: "Company", render: (row) => row.companies?.name || "—" },
        { label: "Paid", render: (row) => row.is_paid ? "Yes" : "No" },
        { label: "Max Days/Year", render: (row) => row.max_days_per_year > 0 ? row.max_days_per_year : "Unlimited" },
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
                title="Leave Types"
                actionButton={
                    <Button onClick={() => { setEditingId(null); reset({ name: "", is_paid: true, max_days_per_year: 0 }); setIsModalOpen(true); }} style={{ width: "auto" }}>
                        + Add Leave Type
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Leave Type" : "Add Leave Type"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>{editingId ? "Update" : "Save"}</Button>
                    </>
                }
            >
                <InputField label="Leave Type Name" {...register("name")} error={errors.name?.message} />
                <InputField label="Max Days Per Year (0 = Unlimited)" type="number" {...register("max_days_per_year")} error={errors.max_days_per_year?.message} />
                <CheckboxField label="Paid Leave" {...register("is_paid")} />
            </Modal>
        </>
    );
};

export default MasterLeaveTypePage;
