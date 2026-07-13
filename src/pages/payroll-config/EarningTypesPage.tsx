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
import CheckboxField from "../../components/common/CheckboxField";
import SelectField from "../../components/common/SelectField";
import Badge from "../../components/common/Badge";

const earningSchema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a companie")),
    name: z.string().min(1, "Name is required"),
    is_taxable: z.boolean().default(true),
    is_sso: z.boolean().default(true),
});

const EarningTypesPage = () => {
    const [earnings, setEarnings] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const defaultCompanieId = userData.companies_id;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(earningSchema),
        defaultValues: {
            companies_id: defaultCompanieId,
            is_taxable: true,
            is_sso: true,
        },
    });

    const editingId = watch("id");

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [earningsRes, companiesRes] = await Promise.all([
                api.get("/earning-types"),
                api.get("/companies/options"),
            ]);
            setEarnings(earningsRes.data);
            setCompanies(companiesRes.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    const onSubmit = async (data) => {
        try {
            if (data.id) {
                await api.put(`/earning-types/${data.id}`, data);
            } else {
                await api.post("/earning-types", data);
            }
            const res = await api.get("/earning-types");
            setEarnings(res.data);
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        }
    };

    const handleEdit = (item) => {
        reset(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/earning-types/${id}`);
            const res = await api.get("/earning-types");
            setEarnings(res.data);
        } catch (err) {
            const errData = err.response?.data;
            alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset({
            id: undefined,
            companies_id: defaultCompanieId,
            is_taxable: true,
            is_sso: true,
        });
    };

    const columns = [
        { label: "Name", key: "name" },
        {
            label: "Taxable",
            sortKey: "is_taxable",
            sortValue: (row) => row.is_taxable ? 1 : 0,
            searchValue: (row) => row.is_taxable ? "yes" : "no",
            render: (row) => <Badge status={row.is_taxable}>{row.is_taxable ? "Yes" : "No"}</Badge>
        },
        {
            label: "SSO",
            sortKey: "is_sso",
            sortValue: (row) => row.is_sso ? 1 : 0,
            searchValue: (row) => row.is_sso ? "yes" : "no",
            render: (row) => <Badge status={row.is_sso}>{row.is_sso ? "Yes" : "No"}</Badge>
        },
        {
            label: "Companies",
            sortKey: "companies.name",
            sortValue: (row) => (row.companies?.name || "").toLowerCase(),
            searchValue: (row) => row.companies?.name || "",
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={{ fontSize: "12px", padding: "4px 8px" }}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} style={{ fontSize: "12px", padding: "4px 8px", color: "#ef4444" }}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Earning Types"
                actionButton={
                    <Button onClick={() => setIsModalOpen(true)} style={{ width: "auto" }}>+ Add Earning Type</Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={earnings} />}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Earning Type" : "Add Earning Type"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))} style={{ width: "auto" }}>
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
                        disabled={!!editingId}
                        required
                    />
                    <InputField label="Earning Name" {...register("name")} error={errors.name?.message} required />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <CheckboxField label="Is Taxable" id="is_taxable" {...register("is_taxable")} />
                        <CheckboxField label="Include in SSO" id="is_sso" {...register("is_sso")} />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default EarningTypesPage;
