import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../api/axiosInstance";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import CheckboxField from "../components/common/CheckboxField";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";

const schema = z.object({
    date: z.string().min(1, "Date is required"),
    name: z.string().min(1, "Holiday name is required"),
    is_paid: z.boolean().default(true),
});

const HolidayCalendarPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { date: "", name: "", is_paid: true },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/master/holidays");
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
                await api.put(`/master/holidays/${editingId}`, data);
            } else {
                await api.post("/master/holidays", data);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        const dateStr = item.date ? item.date.substring(0, 10) : "";
        reset({ date: dateStr, name: item.name, is_paid: item.is_paid });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ date: "", name: "", is_paid: true });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this holiday?")) return;
        try {
            await api.delete(`/master/holidays/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
        {
            label: "Date",
            render: (row) => row.date ? new Date(row.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        },
        { label: "Holiday Name", key: "name" },
        { label: "Company", render: (row) => row.companies?.name || "—" },
        { label: "Paid", render: (row) => row.is_paid ? "Yes" : "No" },
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
                title="Holiday Calendar"
                actionButton={
                    <Button onClick={() => { setEditingId(null); reset({ date: "", name: "", is_paid: true }); setIsModalOpen(true); }} style={{ width: "auto" }}>
                        + Add Holiday
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Holiday" : "Add Holiday"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>{editingId ? "Update" : "Save"}</Button>
                    </>
                }
            >
                <InputField label="Date" type="date" {...register("date")} error={errors.date?.message} />
                <InputField label="Holiday Name" {...register("name")} error={errors.name?.message} />
                <CheckboxField label="Paid Holiday" {...register("is_paid")} />
            </Modal>
        </>
    );
};

export default HolidayCalendarPage;
