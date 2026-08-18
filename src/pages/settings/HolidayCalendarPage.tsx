import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import DateField from "../../components/common/DateField";
import CheckboxField from "../../components/common/CheckboxField";
import SelectField from "../../components/common/SelectField";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({
    companies_id: z.string().min(1, "Company is required"),
    date: z.string().min(1, "Date is required"),
    name: z.string().min(1, "Holiday name is required"),
    is_paid: z.boolean().default(true),
});

const makeEmptyForm = (homeCompanyId: string) => ({ companies_id: homeCompanyId, date: "", name: "", is_paid: true });

const HolidayCalendarPage = () => {
    const { homeCompanyId } = useAuth();
    const emptyForm = useMemo(() => makeEmptyForm(homeCompanyId), [homeCompanyId]);
    const [items, setItems] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: emptyForm,
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [res, companiesRes] = await Promise.all([
                api.get("/master/holidays"),
                api.get("/companies/options"),
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
            const payload = { ...data, companies_id: Number(data.companies_id) };
            if (editingId) {
                await api.put(`/master/holidays/${editingId}`, payload);
            } else {
                await api.post("/master/holidays", payload);
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
            date: item.date ? item.date.substring(0, 10) : "",
            name: item.name,
            is_paid: item.is_paid,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset(emptyForm);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this holiday?")) return;
        try {
            await api.delete(`/master/holidays/${id}`);
            fetchData();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
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
                    <Button onClick={() => { setEditingId(null); reset(emptyForm); setIsModalOpen(true); }} style={{ width: "auto" }}>
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
                <SelectField
                    label="Company"
                    options={companyOptions}
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    required
                />
                <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                        <DateField
                            name={field.name}
                            label="Date"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.date?.message}
                            required
                        />
                    )}
                />
                <InputField label="Holiday Name" {...register("name")} error={errors.name?.message} required />
                <CheckboxField label="Paid Holiday" {...register("is_paid")} />
            </Modal>
        </>
    );
};

export default HolidayCalendarPage;
