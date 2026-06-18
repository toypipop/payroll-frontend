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

const schema = z.object({
    companies_id: z.string().min(1, "Company is required"),
    name: z.string().min(1, "Leave type name is required"),
    is_paid: z.boolean().default(true),
    max_days_per_year: z.coerce.number().min(0, "Must be 0 or more").default(0),
});

const userData = JSON.parse(localStorage.getItem("user") || "{}");
const homeCompanyId = String(userData.companies_id || "");

const emptyForm = { companies_id: homeCompanyId, name: "", is_paid: true, max_days_per_year: 0 };

const MasterLeaveTypePage = () => {
    const [items, setItems] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: emptyForm,
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [res, companiesRes] = await Promise.all([
                api.get("/master/leave-types"),
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
                await api.put(`/master/leave-types/${editingId}`, payload);
            } else {
                await api.post("/master/leave-types", payload);
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
            name: item.name,
            is_paid: item.is_paid,
            max_days_per_year: item.max_days_per_year || 0,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset(emptyForm);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this leave type?")) return;
        try {
            await api.delete(`/master/leave-types/${id}`);
            fetchData();
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
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
                    <Button onClick={() => { setEditingId(null); reset(emptyForm); setIsModalOpen(true); }} style={{ width: "auto" }}>
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
                <SelectField
                    label="Company"
                    options={companyOptions}
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                />
                <InputField label="Leave Type Name" {...register("name")} error={errors.name?.message} />
                <InputField label="Max Days Per Year (0 = Unlimited)" type="number" {...register("max_days_per_year")} error={errors.max_days_per_year?.message} />
                <CheckboxField label="Paid Leave" {...register("is_paid")} />
            </Modal>
        </>
    );
};

export default MasterLeaveTypePage;
