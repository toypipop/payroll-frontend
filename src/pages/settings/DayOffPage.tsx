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
import SelectField from "../../components/common/SelectField";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";

const userData = JSON.parse(localStorage.getItem("user") || "{}");
const homeCompanyId = String(userData.companies_id || "");

const schema = z.object({
    companies_id: z.string().optional(),
    weekday: z.string().min(1, "Weekday is required"),
    name: z.string().min(1, "Day off name is required"),
    is_paid: z.boolean().default(true),
});

const weekdayOptions = [
    { id: "0", name: "Sunday" },
    { id: "1", name: "Monday" },
    { id: "2", name: "Tuesday" },
    { id: "3", name: "Wednesday" },
    { id: "4", name: "Thursday" },
    { id: "5", name: "Friday" },
    { id: "6", name: "Saturday" },
];

const weekdayName = (value) => weekdayOptions.find((o) => String(o.id) === String(value))?.name || "-";

const DayOffPage = () => {
    const [items, setItems] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, weekday: "", name: "", is_paid: true },
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [res, companiesRes] = await Promise.all([
                api.get("/master/day-offs"),
                api.get("/master/day-offs/companies").catch(() => ({ data: [] })),
            ]);
            setItems(res.data || []);
            setCompanyOptions((companiesRes.data || []).map((c) => ({ id: c.id, name: c.name })));
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                companies_id: data.companies_id ? Number(data.companies_id) : undefined,
                weekday: Number(data.weekday),
            };

            if (editingId) {
                await api.put(`/master/day-offs/${editingId}`, payload);
            } else {
                await api.post("/master/day-offs", payload);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        reset({
            companies_id: item.companies_id ? String(item.companies_id) : "",
            weekday: String(item.weekday),
            name: item.name,
            is_paid: item.is_paid,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset({ companies_id: homeCompanyId, weekday: "", name: "", is_paid: true });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this day off?")) return;
        try {
            await api.delete(`/master/day-offs/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    const smallBtn = { padding: "4px 12px", fontSize: "12px", width: "auto" };

    const columns = [
        {
            label: "Weekday",
            sortKey: "weekday",
            sortValue: (row) => Number(row.weekday) || 0,
            render: (row) => weekdayName(row.weekday),
        },
        { label: "Day Off Name", key: "name" },
        { label: "Company", render: (row) => row.companies?.name || "-" },
        { label: "Paid", render: (row) => row.is_paid ? "Yes" : "No" },
        {
            label: "Actions",
            sortable: false,
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
                title="Day Off"
                actionButton={
                    <Button onClick={() => { setEditingId(null); reset({ companies_id: homeCompanyId, weekday: "", name: "", is_paid: true }); setIsModalOpen(true); }} style={{ width: "auto" }}>
                        + Add Day Off
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={items} />}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Day Off" : "Add Day Off"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>{editingId ? "Update" : "Save"}</Button>
                    </>
                }
            >
                <SelectField
                    label="Company"
                    options={companyOptions}
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    disabled={!!editingId}
                />
                <SelectField label="Weekday" options={weekdayOptions} {...register("weekday")} error={errors.weekday?.message} required />
                <InputField label="Day Off Name" {...register("name")} error={errors.name?.message} required />
                <CheckboxField label="Paid Day Off" {...register("is_paid")} />
            </Modal>
        </>
    );
};

export default DayOffPage;
