import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../api/axiosInstance";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import SelectField from "../components/common/SelectField";
import CheckboxField from "../components/common/CheckboxField";

/* --- 1. Validation Schema (English Comment) --- */
const employeesSchema = z.object({
    employees_code: z.string().min(2, "Employees code is required"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    dept_id: z.string().min(1, "Please select a department"),
    pos_id: z.string().min(1, "Please select a position"),
    roles_id: z.string().min(1, "Please select a roles"),
    is_active: z.boolean().default(true),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .optional()
        .or(z.literal("")),
});

const EmployeesListPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [masterDepts, setMasterDepts] = useState([]);
    const [masterPos, setMasterPos] = useState([]);
    const [masterRoles, setMasterRoles] = useState([]);

    /* --- 2. Initialize Hook Form (English Comment) --- */
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(employeesSchema),
        defaultValues: {
            employees_code: "",
            first_name: "",
            last_name: "",
            email: "",
            dept_id: "",
            pos_id: "",
            roles_id: "",
            is_active: true,
            password: "",
        },
    });

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [deptRes, posRes, rolesRes] = await Promise.all([
                    api.get("/departments"),
                    api.get("/positions"),
                    api.get("/roles"),
                ]);

                // Ensure the property names (d.dept_name, p.pos_name, r.roles_name)
                // match your Backend JSON response (English Comment)
                setMasterDepts(
                    deptRes.data.map((d) => ({
                        id: d.id,
                        name: d.dept_name || d.name,
                    })),
                );
                setMasterPos(
                    posRes.data.map((p) => ({
                        id: p.id,
                        name: p.pos_name || p.name,
                    })),
                );
                setMasterRoles(
                    rolesRes.data.map((r) => ({
                        id: r.id,
                        name: r.roles_name || r.name,
                    })),
                );
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchEmployees();
    }, []);

    /* --- 3. Refactored Submit Handler (English Comment) --- */
    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                dept_id: parseInt(data.dept_id),
                pos_id: parseInt(data.pos_id),
                roles_id: parseInt(data.roles_id),
            };

            if (editingId) {
                await api.put(`/employees/${editingId}`, payload);
            } else {
                await api.post("/employees", payload);
            }
            fetchEmployees();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (emp) => {
        setEditingId(emp.ID || emp.id);
        // Map values to form (English Comment)
        setValue("employees_code", emp.employees_code);
        setValue("first_name", emp.first_name);
        setValue("last_name", emp.last_name);
        setValue("email", emp.email);
        setValue("dept_id", emp.dept_id?.toString() || "");
        setValue("pos_id", emp.pos_id?.toString() || "");
        setValue("roles_id", emp.roles_id?.toString() || "");
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this employees?")) {
            try {
                await api.delete(`/employees/${id}`);
                fetchEmployees();
            } catch (err) {
                alert(err.response?.data?.error || "Delete Failed");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset(); // Clear form and errors
    };

    const columns = [
        { label: "Code", key: "employees_code" },
        {
            label: "Full Name",
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        { label: "Position", render: (row) => row.position?.pos_name || "N/A" },
        {
            label: "Department",
            render: (row) => row.department?.dept_name || "N/A",
        },
        {
            label: "Status",
            render: (row) => (
                <Badge status={row.is_active}>
                    {row.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            label: "Companies",
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        variant="ghost"
                        onClick={() => handleEdit(row)}
                        style={smallBtn}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row.ID || row.id)}
                        style={smallBtn}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Employees Directory"
                actionButton={
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        style={{ width: "auto" }}
                    >
                        + Add Employees
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={employees} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Employees" : "Add New Employees"}
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={closeModal}
                            style={{ width: "auto" }}
                        >
                            Cancel
                        </Button>
                        {/* 4. Use handleSubmit from Hook Form (English Comment) */}
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            style={{ width: "auto" }}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                {/* 5. Inputs using register (English Comment) */}
                <InputField
                    label="Employees Code"
                    {...register("employees_code")}
                    error={errors.employees_code?.message}
                />

                <InputField
                    label="First Name"
                    {...register("first_name")}
                    error={errors.first_name?.message}
                />

                <InputField
                    label="Last Name"
                    {...register("last_name")}
                    error={errors.last_name?.message}
                />

                <InputField
                    label="Email Address"
                    type="email"
                    {...register("email")}
                    error={errors.email?.message}
                />

                <InputField
                    label="Password"
                    type="password"
                    {...register("password")}
                    error={errors.password?.message}
                    placeholder={
                        editingId
                            ? "Leave blank to keep same"
                            : "Required (min 6 chars)"
                    }
                />
                <SelectField
                    label="Department"
                    options={masterDepts}
                    {...register("dept_id")}
                    error={errors.dept_id?.message}
                />

                <SelectField
                    label="Position"
                    options={masterPos}
                    {...register("pos_id")}
                    error={errors.pos_id?.message}
                />

                <SelectField
                    label="System Roles"
                    options={masterRoles}
                    {...register("roles_id")}
                    error={errors.roles_id?.message}
                />
                <CheckboxField
                    label="Account Active"
                    id="is_active"
                    {...register("is_active")}
                    error={errors.is_active?.message}
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default EmployeesListPage;
