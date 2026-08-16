import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import NumberField from "../../components/common/NumberField";
import SelectField from "../../components/common/SelectField";
import CheckboxField from "../../components/common/CheckboxField";
import HelpIcon from "../../components/common/HelpIcon";
import MasterDataWarning from "../../components/common/MasterDataWarning";

const userData = JSON.parse(localStorage.getItem("user") || "{}");
const homeCompanyId = String(userData.companies_id || "");

// Validation schema for employee
const createEmployeesSchema = (isEditing, requireCompany) => z.object({
    employees_code: z.string().min(2, "Employees code is required"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    dept_id: z.string().min(1, "Please select a department"),
    pos_id: z.string().min(1, "Please select a position"),
    roles_id: z.string().min(1, "Please select a roles"),
    employment_type_id: z.coerce.number().optional().nullable(),
    companies_id: requireCompany
        ? z.string().min(1, "Please select a company")
        : z.string().optional(),
    is_active: z.boolean().default(true),
    password: isEditing
        ? z.string().optional().or(z.literal(""))
        : z.string().min(6, "Password must be at least 6 characters"),
    bank_id: z.string().optional(),
    account_name: z.string().optional(),
    account_no: z.string().optional(),
});

const EMPTY_EMPLOYEE_FORM = {
    employees_code: "",
    first_name: "",
    last_name: "",
    email: "",
    dept_id: "",
    pos_id: "",
    roles_id: "",
    employment_type_id: "",
    companies_id: homeCompanyId,
    is_active: true,
    password: "",
    bank_id: "",
    account_name: "",
    account_no: "",
};

const EmployeesListPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [masterDepts, setMasterDepts] = useState([]);
    const [masterPos, setMasterPos] = useState([]);
    const [masterRoles, setMasterRoles] = useState([]);
    const [masterCompanies, setMasterCompanies] = useState([]);
    const [masterBanks, setMasterBanks] = useState([]);
    const [masterEmploymentTypes, setMasterEmploymentTypes] = useState([]);

    // Ref to skip cascade-reset during edit initialization
    const isEditLoading = useRef(false);
    // Refs for dynamic resolver
    const editingIdRef = useRef(null);
    const requireCompanyRef = useRef(false);

    const dynamicResolver = useCallback(
        (values, ctx, options) =>
            zodResolver(createEmployeesSchema(!!editingIdRef.current, requireCompanyRef.current))(
                values, ctx, options
            ),
        []
    );

    // Initialize form with hook form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm({
        resolver: dynamicResolver,
        defaultValues: EMPTY_EMPLOYEE_FORM,
    });

    // Watch selected company to drive cascading filter
    const selectedCompaniesId = watch("companies_id");

    // Clear dependent fields on company change
    useEffect(() => {
        if (isEditLoading.current) return;
        if (masterCompanies.length > 0 && selectedCompaniesId) {
            setValue("dept_id", "");
            setValue("pos_id", "");
            setValue("roles_id", "");
            setValue("employment_type_id", "");
        }
    }, [selectedCompaniesId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Apply filters for super-admin only
    const filteredDepts = masterCompanies.length > 0 && selectedCompaniesId
        ? masterDepts.filter((d) => String(d.companies_id) === String(selectedCompaniesId))
        : masterDepts;
    const filteredPos = masterCompanies.length > 0 && selectedCompaniesId
        ? masterPos.filter((p) => String(p.companies_id) === String(selectedCompaniesId))
        : masterPos;
    const filteredRoles = masterCompanies.length > 0 && selectedCompaniesId
        ? masterRoles.filter((r) => String(r.companies_id) === String(selectedCompaniesId))
        : masterRoles;
    const filteredEmploymentTypes = masterCompanies.length > 0 && selectedCompaniesId
        ? masterEmploymentTypes.filter((t) => String(t.companies_id) === String(selectedCompaniesId))
        : masterEmploymentTypes;

    // Warn when the selected company has zero records for a required master type (e.g.
    const showNoDeptWarning = !!selectedCompaniesId && filteredDepts.length === 0;
    const showNoPosWarning = !!selectedCompaniesId && filteredPos.length === 0;
    const showNoRolesWarning = !!selectedCompaniesId && filteredRoles.length === 0;
    const hasMissingRequiredMaster = showNoDeptWarning || showNoPosWarning || showNoRolesWarning;

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await api.get("/employees");
            console.log("Employees API response:", response.data);
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
                const [deptRes, posRes, rolesRes, empTypesRes, banksRes, compRes] = await Promise.all([
                    api.get("/departments/options").catch(() => ({ data: [] })),
                    api.get("/positions/options").catch(() => ({ data: [] })),
                    api.get("/roles/options").catch(() => ({ data: [] })),
                    api.get("/master/employment-types/options").catch(() => ({ data: [] })),
                    api.get("/master/banks/options").catch(() => ({ data: [] })),
                    api.get("/companies/options").catch(() => ({ data: [] })),
                ]);
                setMasterBanks((banksRes.data || []).map((b) => ({ id: b.id, name: `${b.bank_code} — ${b.bank_name}` })));
                setMasterEmploymentTypes(
                    (empTypesRes.data || []).map((t) => ({
                        id: t.id,
                        name: t.name,
                        companies_id: t.companies_id,
                    })),
                );
                setMasterCompanies((compRes.data || []).map((c) => ({ id: c.id, name: c.name })));

                // Check property names from API match your Backend JSON response (English Comment)
                setMasterDepts(
                    deptRes.data.map((d) => ({
                        id: d.id,
                        name: d.dept_name || d.name,
                        companies_id: d.companies_id,
                    })),
                );
                setMasterPos(
                    posRes.data.map((p) => ({
                        id: p.id,
                        name: p.pos_name || p.name,
                        companies_id: p.companies_id,
                    })),
                );
                setMasterRoles(
                    rolesRes.data.map((r) => ({
                        id: r.id,
                        name: r.roles_name || r.name,
                        companies_id: r.companies_id,
                    })),
                );
            } catch (err) {
                console.error("Master data fetch error:", err);
            }
        };
        fetchMasterData();
        fetchEmployees();
    }, []);

    // Submit handler for form
    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                dept_id: parseInt(data.dept_id),
                pos_id: parseInt(data.pos_id),
                roles_id: parseInt(data.roles_id),
                companies_id: data.companies_id ? parseInt(data.companies_id) : undefined,
                employment_type_id: data.employment_type_id ? parseInt(data.employment_type_id) : null,
                bank_id: data.bank_id ? parseInt(data.bank_id) : null,
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
        console.log("emp keys:", Object.keys(emp));
        console.log("emp bank_id:", emp.bank_id, typeof emp.bank_id);
        console.log("emp.account_name:", emp.account_name);
        
        const empId = emp.id;
        setEditingId(empId);
        editingIdRef.current = empId;
        isEditLoading.current = true;
        
        // Reset form first
        reset({
            employees_code: emp.employees_code || "",
            first_name: emp.first_name || "",
            last_name: emp.last_name || "",
            email: emp.email || "",
            dept_id: emp.dept_id ? String(emp.dept_id) : "",
            pos_id: emp.pos_id ? String(emp.pos_id) : "",
            roles_id: emp.roles_id ? String(emp.roles_id) : "",
            companies_id: emp.companies_id ? String(emp.companies_id) : "",
            employment_type_id: emp.employment_type_id ? String(emp.employment_type_id) : "",
            is_active: emp.is_active === true || emp.is_active === "true",
            bank_id: emp.bank_id ? String(emp.bank_id) : "",
            account_name: emp.account_name || "",
            account_no: emp.account_no || "",
        });
        
        setTimeout(() => { isEditLoading.current = false; }, 0);
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
        editingIdRef.current = null;
        reset(EMPTY_EMPLOYEE_FORM); // Clear form and errors
    };

    const openCreateModal = () => {
        setEditingId(null);
        editingIdRef.current = null;
        reset(EMPTY_EMPLOYEE_FORM);
        setIsModalOpen(true);
    };

    const columns = [
        { label: "Code", key: "employees_code", searchableKeys: ['employees_code'] },
        {
            label: "Full Name",
            sortKey: "first_name",
            searchableKeys: ['first_name', 'last_name'],
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        { 
            label: "Position", 
            sortKey: "position.pos_name", 
            searchableKeys: ['position.pos_name'],
            render: (row) => row.position?.pos_name || "N/A" 
        },
        {
            label: "Department",
            sortKey: "department.dept_name",
            searchableKeys: ['department.dept_name'],
            render: (row) => row.department?.dept_name || "N/A",
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
            label: "Companies",
            sortKey: "companies.name",
            searchableKeys: ['companies.name'],
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
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
                        onClick={() => handleDelete(row.id)}
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
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Employees Directory<HelpIcon articleId="employee-list" /></span>}
                actionButton={
                    <Button
                        onClick={openCreateModal}
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
                            disabled={hasMissingRequiredMaster}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                {/* Companies — shown only for super-admin; drives cascade filter */}
                {masterCompanies.length > 0 && (
                    <SelectField
                        label="Companies"
                        options={masterCompanies}
                        {...register("companies_id")}
                        value={watch("companies_id")}
                        error={errors.companies_id?.message}
                        disabled={!!editingId}
                        required
                    />
                )}

                <InputField
                    label="Employees Code"
                    {...register("employees_code")}
                    error={errors.employees_code?.message}
                    required
                />

                <InputField
                    label="First Name"
                    {...register("first_name")}
                    error={errors.first_name?.message}
                    required
                />

                <InputField
                    label="Last Name"
                    {...register("last_name")}
                    error={errors.last_name?.message}
                    required
                />

                <InputField
                    label="Email Address"
                    type="email"
                    {...register("email")}
                    error={errors.email?.message}
                    required
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
                    required={!editingId}
                />
                <SelectField
                    label="Department"
                    options={filteredDepts}
                    {...register("dept_id")}
                    value={watch("dept_id")}
                    error={errors.dept_id?.message}
                    disabled={!selectedCompaniesId}
                    required
                />
                {showNoDeptWarning && (
                    <MasterDataWarning
                        message="This company has no departments yet."
                        routePath="/departments"
                        moduleKey="DepartmentSettings"
                    />
                )}

                <SelectField
                    label="Position"
                    options={filteredPos}
                    {...register("pos_id")}
                    value={watch("pos_id")}
                    error={errors.pos_id?.message}
                    disabled={!selectedCompaniesId}
                    required
                />
                {showNoPosWarning && (
                    <MasterDataWarning
                        message="This company has no positions yet."
                        routePath="/positions"
                        moduleKey="PositionSettings"
                    />
                )}

                <SelectField
                    label="System Roles"
                    options={filteredRoles}
                    {...register("roles_id")}
                    value={watch("roles_id")}
                    error={errors.roles_id?.message}
                    disabled={!selectedCompaniesId}
                    required
                />
                {showNoRolesWarning && (
                    <MasterDataWarning
                        message="This company has no roles yet."
                        routePath="/roles"
                        moduleKey="RolesPage"
                    />
                )}

                {masterEmploymentTypes.length > 0 && (
                    <SelectField
                        label="Employment Type"
                        options={filteredEmploymentTypes}
                        {...register("employment_type_id")}
                        value={watch("employment_type_id")}
                        error={errors.employment_type_id?.message}
                        disabled={!selectedCompaniesId}
                    />
                )}

                <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                        <CheckboxField
                            label="Account Active"
                            id="is_active"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            error={errors.is_active?.message}
                        />
                    )}
                />

                 {/* Bank Account Section */}
                 <div style={{ borderTop: "1px solid var(--border-color, #e2e8f0)", marginTop: "16px", paddingTop: "16px" }}>
                     <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted, #64748b)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                         Bank Account
                     </div>
                     <SelectField
                         label="Bank"
                         options={masterBanks}
                         {...register("bank_id")}
                         value={watch("bank_id")}
                     />
                     <InputField
                         label="Account Name"
                         {...register("account_name")}
                     />
                     <NumberField
                         label="Account No."
                         value={watch("account_no") ?? ""}
                         onChange={(e) => setValue("account_no", e.target.value, { shouldDirty: true })}
                         onBlur={() => {}}
                     />
                 </div>
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default EmployeesListPage;
