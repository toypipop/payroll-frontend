import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import SelectField from "../../components/common/SelectField";
import CheckboxField from "../../components/common/CheckboxField";
import Badge from "../../components/common/Badge";
import MasterDataWarning from "../../components/common/MasterDataWarning";

const accessSchema = z.object({
    employee_id: z.string().min(1, "Please select an employee"),
    company_id: z.string().min(1, "Please select a company"),
    role_id: z.string().min(1, "Please select a role"),
    is_active: z.boolean().default(true),
});

const EMPTY_FORM = {
    employee_id: "",
    company_id: "",
    role_id: "",
    is_active: true,
};

const EmployeeCompanyAccessPage = () => {
    const [accessRows, setAccessRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const {
        control,
        handleSubmit,
        register,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(accessSchema),
        defaultValues: EMPTY_FORM,
    });

    const selectedCompanyId = watch("company_id");
    const selectedEmployeeId = watch("employee_id");
    const selectedRoleId = watch("role_id");

    const filteredRoles = useMemo(() => {
        if (!selectedCompanyId) return [];
        return roles.filter((role) => String(role.companies_id) === String(selectedCompanyId));
    }, [roles, selectedCompanyId]);

    const showNoRolesWarning = !!selectedCompanyId && filteredRoles.length === 0;

    const selectedEmployeeName = useMemo(() => {
        const employee = employees.find((item) => String(item.id) === String(selectedEmployeeId));
        return employee?.name || "";
    }, [employees, selectedEmployeeId]);

    const fetchAccessRows = async () => {
        const res = await api.get("/employee-company-access");
        setAccessRows(res.data || []);
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [accessRes, employeesRes, companiesRes, rolesRes] = await Promise.all([
                api.get("/employee-company-access"),
                api.get("/employees"),
                api.get("/companies/options"),
                api.get("/roles/options").catch(() => ({ data: [] })),
            ]);

            setAccessRows(accessRes.data || []);
            setEmployees((employeesRes.data || []).map((employee) => ({
                id: employee.id,
                name: `${employee.employees_code || "EMP"} - ${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
                companies_id: employee.companies_id,
            })));
            setCompanies((companiesRes.data || []).map((company) => ({
                id: company.id,
                name: company.name,
            })));
            setRoles((rolesRes.data || []).map((role) => ({
                id: role.id,
                name: role.name,
                companies_id: role.companies_id,
            })));
        } catch (err) {
            console.error("Employee company access load failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const selectedRoleStillValid = filteredRoles.some((role) => String(role.id) === String(selectedRoleId));
        if (!selectedRoleStillValid) {
            setValue("role_id", "", { shouldValidate: true, shouldDirty: true });
        }
    }, [filteredRoles, selectedRoleId, setValue]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                employee_id: Number(data.employee_id),
                company_id: Number(data.company_id),
                role_id: Number(data.role_id),
                is_active: data.is_active,
            };

            if (editingId) {
                await api.put(`/employee-company-access/${editingId}`, payload);
            } else {
                await api.post("/employee-company-access", payload);
            }

            await fetchAccessRows();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save failed");
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        reset(EMPTY_FORM);
        setIsModalOpen(true);
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        reset({
            employee_id: row.employee_id ? String(row.employee_id) : "",
            company_id: row.company_id ? String(row.company_id) : "",
            role_id: row.role_id ? String(row.role_id) : "",
            is_active: row.is_active !== false,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this employee company access?")) return;
        try {
            await api.delete(`/employee-company-access/${id}`);
            await fetchAccessRows();
        } catch (err) {
            alert(err.response?.data?.error || "Delete failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset(EMPTY_FORM);
    };

    const columns = [
        {
            label: "Employee",
            sortKey: "employee_name",
            searchValue: (row) => `${row.employee?.employees_code || ""} ${row.employee?.first_name || ""} ${row.employee?.last_name || ""}`.trim(),
            render: (row) => {
                const employee = row.employee;
                if (!employee) return "-";
                return `${employee.employees_code || "EMP"} - ${employee.first_name || ""} ${employee.last_name || ""}`.trim();
            },
        },
        {
            label: "Company",
            sortKey: "company.name",
            searchableKeys: ["company.name"],
            render: (row) => row.company?.name || "-",
        },
        {
            label: "Role",
            sortKey: "role.roles_name",
            searchableKeys: ["role.roles_name"],
            render: (row) => row.role?.roles_name || "-",
        },
        {
            label: "Status",
            sortKey: "is_active",
            searchValue: (row) => row.is_active ? "Active" : "Inactive",
            render: (row) => (
                <Badge status={row.is_active}>
                    {row.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            label: "Actions",
            sortable: false,
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
                title="Employee Company Access"
                actionButton={
                    <Button onClick={openCreateModal} style={{ width: "auto" }}>
                        + Add Access
                    </Button>
                }
            />

            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={accessRows} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Company Access" : "Add Company Access"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }} disabled={showNoRolesWarning}>
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <SelectField
                    label="Employee"
                    options={employees}
                    {...register("employee_id")}
                    value={watch("employee_id")}
                    error={errors.employee_id?.message}
                    onChange={(e) => {
                        setValue("employee_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("company_id", "", { shouldValidate: true, shouldDirty: true });
                        setValue("role_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    required
                />

                <SelectField
                    label="Company"
                    options={companies}
                    {...register("company_id")}
                    value={watch("company_id")}
                    error={errors.company_id?.message}
                    onChange={(e) => {
                        setValue("company_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("role_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    disabled={!selectedEmployeeId}
                    required
                />

                <SelectField
                    label="Role"
                    options={filteredRoles}
                    {...register("role_id")}
                    value={watch("role_id")}
                    error={errors.role_id?.message}
                    onChange={(e) => {
                        setValue("role_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                    }}
                    disabled={!selectedCompanyId}
                    required
                />
                {showNoRolesWarning && (
                    <MasterDataWarning
                        message="This company has no roles yet."
                        routePath="/roles"
                        moduleKey="RolesPage"
                    />
                )}

                {selectedEmployeeName && (
                    <div style={{
                        margin: "0 0 18px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        color: "#64748b",
                        fontSize: "13px",
                        border: "1px solid #e2e8f0",
                    }}>
                        {selectedEmployeeName}
                    </div>
                )}

                <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                        <CheckboxField
                            label="Access active"
                            id="is_active"
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                            error={errors.is_active?.message}
                        />
                    )}
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default EmployeeCompanyAccessPage;
