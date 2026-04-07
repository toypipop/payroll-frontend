import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
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
});

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
    // Bank account state separate from form
    const [bankData, setBankData] = useState({ bank_id: "", account_name: "", account_no: "" });
    const [bankLoading, setBankLoading] = useState(false);
    const [bankErrors, setBankErrors] = useState({ bank_id: "", account_name: "", account_no: "" });

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
        formState: { errors },
    } = useForm({
        resolver: dynamicResolver,
        defaultValues: {
            employees_code: "",
            first_name: "",
            last_name: "",
            email: "",
            dept_id: "",
            pos_id: "",
            roles_id: "",
            employment_type_id: "",
            companies_id: "",
            is_active: true,
            password: "",
        },
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
                const [deptRes, posRes, rolesRes, empTypesRes, banksRes] = await Promise.all([
                    api.get("/departments"),
                    api.get("/positions"),
                    api.get("/roles"),
                    api.get("/master/employment-types").catch(() => ({ data: [] })),
                    api.get("/master/banks").catch(() => ({ data: [] })),
                ]);
                setMasterBanks((banksRes.data || []).map((b) => ({ id: b.id, name: `${b.bank_code} — ${b.bank_name}` })));
                setMasterEmploymentTypes((empTypesRes.data || []).map((t) => ({ id: t.id, name: t.name })));

                // Check property names from API
                // match your Backend JSON response (English Comment)
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
                console.error("Master Data Load Error", err);
            }
            // Load companies list for super-admin companies selection
            try {
                const companiesRes = await api.get("/companies/options");
                const companiesData = companiesRes.data.map((c) => ({ id: c.id, name: c.name }));
                setMasterCompanies(companiesData);
                requireCompanyRef.current = companiesData.length > 0;
            } catch {
                // Non-admins handled gracefully
            }
        };
        fetchMasterData();
        fetchEmployees();
    }, []);

    // Submit handler for form
    const validateBank = () => {
        const { bank_id, account_name, account_no } = bankData;
        const errs = {
            bank_id: bank_id ? "" : "Bank is required",
            account_name: account_name ? "" : "Account name is required",
            account_no: account_no ? "" : "Account number is required",
        };
        const hasError = Object.values(errs).some(Boolean);
        setBankErrors(errs);
        return !hasError;
    };

    const onSubmit = async (data) => {
        if (!validateBank()) return;
        try {
            const payload = {
                ...data,
                dept_id: parseInt(data.dept_id),
                pos_id: parseInt(data.pos_id),
                roles_id: parseInt(data.roles_id),
                companies_id: data.companies_id ? parseInt(data.companies_id) : undefined,
                employment_type_id: data.employment_type_id ? parseInt(data.employment_type_id) : null,
            };

            let savedId = editingId;
            if (editingId) {
                await api.put(`/employees/${editingId}`, payload);
            } else {
                const res = await api.post("/employees", payload);
                savedId = res.data?.id || res.data?.ID;
            }

            // Save bank account if any field is filled
            if (savedId && (bankData.bank_id || bankData.account_name || bankData.account_no)) {
                const bankPayload = {
                    bank_id: bankData.bank_id ? parseInt(bankData.bank_id) : null,
                    account_name: bankData.account_name,
                    account_no: bankData.account_no,
                };
                await api.put(`/employees/${savedId}/bank-account`, bankPayload).catch(() => {});
            }

            fetchEmployees();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (emp) => {
        const empId = emp.ID || emp.id;
        setEditingId(empId);
        editingIdRef.current = empId;
        // Guard cascade reset during initialization
        isEditLoading.current = true;
        // Map values to form (English Comment)
        setValue("employees_code", emp.employees_code);
        setValue("first_name", emp.first_name);
        setValue("last_name", emp.last_name);
        setValue("email", emp.email);
        setValue("dept_id", emp.dept_id?.toString() || "");
        setValue("pos_id", emp.pos_id?.toString() || "");
        setValue("roles_id", emp.roles_id?.toString() || "");
        setValue("companies_id", emp.companies_id?.toString() || "");
        setValue("employment_type_id", emp.employment_type_id?.toString() || "");
        // Allow cascade to run after all values set
        setTimeout(() => { isEditLoading.current = false; }, 0);
        // Load existing bank account
        setBankLoading(true);
        setBankData({ bank_id: "", account_name: "", account_no: "" });
        api.get(`/employees/${empId}/bank-account`)
            .then((res) => {
                setBankData({
                    bank_id: res.data.bank_id?.toString() || "",
                    account_name: res.data.account_name || "",
                    account_no: res.data.account_no || "",
                });
            })
            .catch(() => {})
            .finally(() => setBankLoading(false));
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
        setBankData({ bank_id: "", account_name: "", account_no: "" });
        setBankErrors({ bank_id: "", account_name: "", account_no: "" });
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
                            onClick={() => { validateBank(); handleSubmit(onSubmit)(); }}
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
                {/* Companies — shown only for super-admin; drives cascade filter */}
                {masterCompanies.length > 0 && (
                    <SelectField
                        label="Companies"
                        options={masterCompanies}
                        {...register("companies_id")}
                        value={watch("companies_id")}
                        error={errors.companies_id?.message}
                    />
                )}
                <SelectField
                    label="Department"
                    options={filteredDepts}
                    {...register("dept_id")}
                    value={watch("dept_id")}
                    error={errors.dept_id?.message}
                    disabled={!selectedCompaniesId}
                />

                <SelectField
                    label="Position"
                    options={filteredPos}
                    {...register("pos_id")}
                    value={watch("pos_id")}
                    error={errors.pos_id?.message}
                    disabled={!selectedCompaniesId}
                />

                <SelectField
                    label="System Roles"
                    options={filteredRoles}
                    {...register("roles_id")}
                    value={watch("roles_id")}
                    error={errors.roles_id?.message}
                    disabled={!selectedCompaniesId}
                />

                {masterEmploymentTypes.length > 0 && (
                    <SelectField
                        label="Employment Type"
                        options={masterEmploymentTypes}
                        {...register("employment_type_id")}
                        value={watch("employment_type_id")}
                        error={errors.employment_type_id?.message}
                    />
                )}

                <CheckboxField
                    label="Account Active"
                    id="is_active"
                    {...register("is_active")}
                    error={errors.is_active?.message}
                />

                 {/* Bank Account Section */}
                 <div style={{ borderTop: "1px solid var(--border-color, #e2e8f0)", marginTop: "16px", paddingTop: "16px" }}>
                     <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted, #64748b)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                         Bank Account
                     </div>
                     {bankLoading ? (
                         <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading bank data...</div>
                     ) : (
                         <>
                            <SelectField
                                label="Bank"
                                value={bankData.bank_id}
                                onChange={(e) => {
                                    setBankData((p) => ({ ...p, bank_id: e.target.value }));
                                    if (bankErrors.bank_id) setBankErrors((p) => ({ ...p, bank_id: "" }));
                                }}
                                options={masterBanks}
                                error={bankErrors.bank_id}
                            />
                             <InputField
                                 label="Account Name"
                                 value={bankData.account_name}
                                 onChange={(e) => {
                                     setBankData((p) => ({ ...p, account_name: e.target.value }));
                                     if (bankErrors.account_name) setBankErrors((p) => ({ ...p, account_name: "" }));
                                 }}
                                 error={bankErrors.account_name}
                             />
                             <NumberField
                                 label="Account No."
                                 value={bankData.account_no}
                                 onChange={(e) => {
                                     setBankData((p) => ({ ...p, account_no: e.target.value }));
                                     if (bankErrors.account_no) setBankErrors((p) => ({ ...p, account_no: "" }));
                                 }}
                                 error={bankErrors.account_no}
                             />
                         </>
                     )}
                 </div>
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default EmployeesListPage;
