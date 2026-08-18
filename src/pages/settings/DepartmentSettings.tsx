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
import { useAuth } from "../../hooks/useAuth";

// Department schema definition
const departmentSchema = z.object({
    dept_name: z.string().min(1, "Department name is required"),
    companies_id: z.coerce.number().min(1, "Please select a companies"),
    category_id: z.string().min(1, "Please select a category"),
});

const DepartmentSettings = () => {
    const { homeCompanyId } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(departmentSchema),
        defaultValues: { dept_name: "", companies_id: homeCompanyId, category_id: "" },
    });

    const watchedCategoryId = watch("category_id");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, compRes, catRes] = await Promise.all([
                api.get("/departments"),
                api.get("/companies/options"),
                api.get("/department-categories"),
            ]);
            setDepartments(deptRes.data || []);
            setCompanies(compRes.data || []);
            setCategories(catRes.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onSubmit = async (data) => {
        try {
            let categoryId = data.category_id;
            if (categoryId === "__new__") {
                if (!newCategoryName.trim()) {
                    alert("Please enter a name for the new category");
                    return;
                }
                const catRes = await api.post("/department-categories", { name: newCategoryName.trim() });
                categoryId = String(catRes.data.id);
                setCategories((prev) => [...prev, catRes.data]);
            }

            const payload = { ...data, category_id: Number(categoryId) };
            if (editingId) {
                await api.put(`/departments/${editingId}`, payload);
            } else {
                await api.post("/departments", payload);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (item) => {
        // Use id from your backend response (English Comment)
        setEditingId(item.id);
        reset({
            dept_name: item.dept_name,
            companies_id: item.companies_id,
            category_id: String(item.category_id || ""),
        });
        setNewCategoryName("");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setNewCategoryName("");
        reset({ dept_name: "", companies_id: homeCompanyId, category_id: "" });
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this department?")) {
            try {
                await api.delete(`/departments/${id}`);
                fetchData();
            } catch (err) {
                const errData = err.response?.data;
                alert(errData?.reason ? `${errData.error}: ${errData.reason}` : errData?.error || "Delete Failed");
            }
        }
    };

    // Table columns configuration
    const columns = [
        { label: "Department Name", key: "dept_name" },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "N/A"
        },
        {
            label: "Category",
            render: (row) => row.category?.name || "N/A"
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={smallBtn}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} style={smallBtn}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Department Management"
                actionButton={
                    <Button
                        onClick={() => {
                            setEditingId(null);
                            setNewCategoryName("");
                            reset({ dept_name: "", companies_id: homeCompanyId, category_id: "" });
                            setIsModalOpen(true);
                        }}
                        style={{ width: "auto" }}
                    >
                        + Add Department
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={departments} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Department" : "Add New Department"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <SelectField
                    label="Companies"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    // Map data to SelectField format
                    options={companies.map((c) => ({
                        id: c.id,
                        name: c.name
                    }))}
                    disabled={!!editingId}
                    required
                />

                <InputField
                    label="Department Name"
                    {...register("dept_name")}
                    error={errors.dept_name?.message}
                    required
                />

                <SelectField
                    label="Category"
                    {...register("category_id")}
                    error={errors.category_id?.message}
                    options={[
                        ...categories.map((cat) => ({ id: cat.id, name: cat.name })),
                        { id: "__new__", name: "+ Add New Category" },
                    ]}
                    required
                />

                {watchedCategoryId === "__new__" && (
                    <InputField
                        label="New Category Name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                )}
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default DepartmentSettings;
