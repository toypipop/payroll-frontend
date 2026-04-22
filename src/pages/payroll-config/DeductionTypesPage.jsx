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

const deductionSchema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a companie")),
    name: z.string().min(1, "Name is required"),
    category_id: z.coerce.number().optional().nullable(),
    is_tax_deductible: z.boolean().default(false),
    is_sso_deductible: z.boolean().default(false),
});

const DeductionTypesPage = () => {
    const [deductions, setDeductions] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [deductionCategories, setDeductionCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const defaultCompanieId = userData.companies_id;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(deductionSchema),
        defaultValues: {
            companies_id: defaultCompanieId,
            category_id: "",
            is_tax_deductible: false,
            is_sso_deductible: false,
        },
    });

    const editingId = watch("id");

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [deductionsRes, companiesRes, catRes] = await Promise.all([
                api.get("/deduction-types"),
                api.get("/companies/options"),
                api.get("/master/deduction-categories").catch(() => ({ data: [] })),
            ]);
            setDeductions(deductionsRes.data);
            setCompanies(companiesRes.data);
            setDeductionCategories((catRes.data || []).map((c) => ({ id: c.id, name: c.name })));
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
                await api.put(`/deduction-types/${data.id}`, data);
            } else {
                await api.post("/deduction-types", data);
            }
            const res = await api.get("/deduction-types");
            setDeductions(res.data);
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
        if (!window.confirm("Are you sure you want to delete this deduction type?")) return;
        try {
            await api.delete(`/deduction-types/${id}`);
            const res = await api.get("/deduction-types");
            setDeductions(res.data);
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
            category_id: "",
            is_tax_deductible: false, 
            is_sso_deductible: false 
        });
    };

    const columns = [
        { label: "Deduction Name", key: "name" },
        {
            label: "Category",
            sortKey: "category.name",
            sortValue: (row) => (row.category?.name || "").toLowerCase(),
            searchValue: (row) => row.category?.name || "",
            render: (row) => row.category?.name || "—",
        },
        {
            label: "Tax Deductible",
            sortKey: "is_tax_deductible",
            sortValue: (row) => row.is_tax_deductible ? 1 : 0,
            searchValue: (row) => row.is_tax_deductible ? "yes" : "no",
            render: (row) => <Badge status={row.is_tax_deductible}>{row.is_tax_deductible ? "Yes" : "No"}</Badge>
        },
        {
            label: "SSO Deductible",
            sortKey: "is_sso_deductible",
            sortValue: (row) => row.is_sso_deductible ? 1 : 0,
            searchValue: (row) => row.is_sso_deductible ? "yes" : "no",
            render: (row) => <Badge status={row.is_sso_deductible}>{row.is_sso_deductible ? "Yes" : "No"}</Badge>
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
                title="Deduction Types"
                actionButton={
                    <Button onClick={() => setIsModalOpen(true)} style={{ width: "auto" }}>+ Add Deduction Type</Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : <Table columns={columns} data={deductions} />}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Deduction Type" : "Add Deduction Type"}
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
                    {deductionCategories.length > 0 && (
                        <SelectField
                            label="Category"
                            {...register("category_id")}
                            error={errors.category_id?.message}
                            options={[{ id: "", name: "— Select Category —" }, ...deductionCategories]}
                        />
                    )}
                    <InputField label="Deduction Name" {...register("name")} error={errors.name?.message} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <CheckboxField label="Tax Deductible" id="is_tax_deductible" {...register("is_tax_deductible")} />
                        <CheckboxField label="SSO Deductible" id="is_sso_deductible" {...register("is_sso_deductible")} />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DeductionTypesPage;
