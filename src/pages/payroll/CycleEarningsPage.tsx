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
import SelectField from "../../components/common/SelectField";
import MasterDataWarning from "../../components/common/MasterDataWarning";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    cycle_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a payroll cycle")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    earning_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an earning type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


const CycleEarningsPage = () => {
    const { homeCompanyId } = useAuth();
    const [items, setItems] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [employees, setEmployees] = useState([]);
    // Only variable (non-permanent) earning types
    const [earningTypes, setEarningTypes] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(homeCompanyId);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: homeCompanyId, cycle_id: "", employees_id: "", earning_type_id: "", amount: "" },
    });

    const editingId = watch("id");
    const watchedCompanyId = watch("companies_id");
    const watchedCycleId = watch("cycle_id");

    const filteredCycles = watchedCompanyId
        ? cycles.filter((c) => String(c.companies_id) === String(watchedCompanyId) && !c.is_closed)
        : [];
    const cycleCompanyId = cycles.find((c) => String(c.id) === String(watchedCycleId))?.companies_id || watchedCompanyId;

    const filteredEmployees = cycleCompanyId
        ? employees.filter((e) => String(e.companies_id) === String(cycleCompanyId))
        : [];

    const filteredEarningTypes = cycleCompanyId
        ? earningTypes.filter((et) => String(et.companies_id) === String(cycleCompanyId))
        : [];

    const showNoEarningTypesWarning = !!watchedCycleId && filteredEarningTypes.length === 0;
    const showNoEmployeesWarning = !!watchedCycleId && filteredEmployees.length === 0;

    const cycleField = register("cycle_id");
    const employeeField = register("employees_id");

    // Fetch master data once
    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const [companyRes, cycleRes, empRes, etRes] = await Promise.all([
                    api.get("/companies/options"),
                    api.get("/payroll/cycles"),
                    api.get("/employees"),
                    api.get("/earning-types/options").catch(() => ({ data: [] })),
                ]);
                setCompanies(companyRes.data);
                setCycles(cycleRes.data);
                setEmployees(empRes.data);
                setEarningTypes(etRes.data);
            } catch (err) {
                console.error("Master data fetch error:", err);
            }
        };
        fetchMaster();
    }, []);

    // Fetch cycle earnings when selected cycle changes
    useEffect(() => {
        if (!selectedCycleId) {
            setItems([]);
            return;
        }
        const fetchItems = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/cycle-earnings?cycle_id=${selectedCycleId}`);
                setItems(res.data);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [selectedCycleId]);

    const refreshItems = async () => {
        if (!selectedCycleId) return;
        const res = await api.get(`/cycle-earnings?cycle_id=${selectedCycleId}`);
        setItems(res.data);
    };

    const onSubmit = async (data) => {
        try {
            if (filteredEmployees.length === 0) {
                alert("This company has no employees. Please add one before saving.");
                return;
            }
            if (data.id) {
                await api.put(`/cycle-earnings/${data.id}`, data);
            } else {
                await api.post("/cycle-earnings", data);
            }
            await refreshItems();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        }
    };

    const handleAdd = () => {
        reset({
            id: undefined,
            companies_id: selectedCompanyId ? Number(selectedCompanyId) : "",
            cycle_id: selectedCycleId ? Number(selectedCycleId) : "",
            employees_id: "",
            earning_type_id: "",
            amount: "",
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        const companyId = item.companies_id || item.employees?.companies_id || cycles.find((c) => String(c.id) === String(item.cycle_id))?.companies_id || "";
        reset({
            id: item.id,
            companies_id: companyId,
            cycle_id: item.cycle_id,
            employees_id: item.employees_id,
            earning_type_id: item.earning_type_id,
            amount: item.amount,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this variable earning?")) return;
        try {
            await api.delete(`/cycle-earnings/${id}`);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            alert("Delete failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset({ id: undefined, companies_id: selectedCompanyId ? Number(selectedCompanyId) : "", cycle_id: selectedCycleId ? Number(selectedCycleId) : "", employees_id: "", earning_type_id: "", amount: "" });
    };

    const pageCycles = selectedCompanyId ? cycles.filter((c) => String(c.companies_id) === String(selectedCompanyId)) : [];
    const selectedCycleLabel = cycles.find((c) => String(c.id) === String(selectedCycleId));
    const selectedCycleClosed = !!selectedCycleLabel?.is_closed;

    const columns = [
        {
            label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.toLowerCase(),
            searchableKeys: ["employees.first_name", "employees.last_name", "employees.employees_code"],
            render: (row) =>
                row.employees
                    ? `${row.employees.first_name} ${row.employees.last_name}`
                    : `ID: ${row.employees_id}`,
        },
        {
            label: "Earning Type",
            sortKey: "earning_type_name",
            sortValue: (row) => row.earning_type?.name?.toLowerCase() || "",
            searchableKeys: ["earning_type.name"],
            render: (row) => row.earning_type?.name ?? `ID: ${row.earning_type_id}`,
        },
        {
            label: "Amount (฿)",
            sortKey: "amount",
            sortValue: (row) => row.amount || 0,
            render: (row) => row.amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        },
        {
            label: "Companies",
            sortKey: "companies_name",
            sortValue: (row) => row.employees?.companies?.name?.toLowerCase() || "",
            searchableKeys: ["employees.companies.name"],
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} disabled={selectedCycleClosed} style={{ fontSize: "12px", padding: "4px 8px" }}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} disabled={selectedCycleClosed} style={{ fontSize: "12px", padding: "4px 8px", color: "#ef4444" }}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Cycle Variable Earnings"
                actionButton={
                    <Button onClick={handleAdd} disabled={!selectedCycleId || selectedCycleClosed} style={{ width: "auto" }}>
                        + Add Variable Earning
                    </Button>
                }
            />

            {/* Cycle selector */}
            <Card style={{ marginBottom: "16px", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <SelectField
                        label="Company"
                        options={companies.map((c) => ({ id: c.id, name: c.name }))}
                        value={selectedCompanyId}
                        onChange={(e) => {
                            setSelectedCompanyId(e.target.value);
                            setSelectedCycleId("");
                        }}
                        containerStyle={{ minWidth: "240px", marginBottom: 0 }}
                    />
                    <SelectField
                        label="Payroll Cycle"
                        options={pageCycles.map((c) => ({ id: c.id, name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}` }))}
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        disabled={!selectedCompanyId}
                        containerStyle={{ minWidth: "280px", marginBottom: 0 }}
                    />
                </div>
                {selectedCycleLabel && (
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#64748b" }}>
                        Period: {formatDate(selectedCycleLabel.start_date)} - {formatDate(selectedCycleLabel.end_date)}
                    </div>
                )}
                {selectedCycleClosed && (
                    <div style={{ marginTop: "8px", fontSize: "13px", color: "#ef4444" }}>
                        This cycle is closed. Variable earnings can no longer be added, edited, or deleted.
                    </div>
                )}
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    One-time earnings per cycle (Bonus, OT, Commission, etc.). Recurring monthly earnings are managed under Employee Earnings.
                </p>
            </Card>

            <Card style={{ padding: "0px" }}>
                {!selectedCycleId ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        Select a payroll cycle to view or add variable earnings.
                    </div>
                ) : loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={items} defaultSort={{ key: "amount", order: "desc" }} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Variable Earning" : "Add Variable Earning for Cycle"}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button
                            onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))}
                            style={{ width: "auto" }}
                            disabled={showNoEarningTypesWarning || showNoEmployeesWarning}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <SelectField
                        label="Company"
                        {...register("companies_id")}
                        error={errors.companies_id?.message}
                        onChange={(e) => {
                            setValue("companies_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                            setValue("cycle_id", "", { shouldValidate: true, shouldDirty: true });
                            setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
                            setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
                        }}
                        options={companies.map((c) => ({ id: c.id, name: c.name }))}
                        disabled={!editingId}
                        required
                    />
                    <SelectField
                        label="Payroll Cycle"
                        {...cycleField}
                        error={errors.cycle_id?.message}
                        onChange={(e) => {
                            setValue("cycle_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                            setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
                            setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
                        }}
                        options={filteredCycles.map((c) => ({
                            id: c.id,
                            name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}`,
                        }))}
                        disabled={!watchedCompanyId || !editingId}
                        required
                    />
                    <SelectField
                        label="Employee"
                        {...employeeField}
                        error={errors.employees_id?.message}
                        onChange={(e) => {
                            setValue("employees_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        }}
                        options={filteredEmployees.map((e) => ({
                            id: e.id,
                            name: `${e.employees_code} — ${e.first_name} ${e.last_name}`,
                        }))}
                        disabled={!watchedCycleId}
                        required
                    />
                    {showNoEmployeesWarning && (
                        <MasterDataWarning
                            message="This company has no employees yet."
                            routePath="/employees"
                            moduleKey="EmployeesListPage"
                        />
                    )}
                    <SelectField
                        label="Earning Type"
                        {...register("earning_type_id")}
                        error={errors.earning_type_id?.message}
                        options={filteredEarningTypes.map((et) => ({ id: et.id, name: et.name }))}
                        disabled={!watchedCycleId}
                        required
                    />
                    {showNoEarningTypesWarning && (
                        <MasterDataWarning
                            message="This company has no earning types yet."
                            routePath="/earning-types"
                            moduleKey="EarningTypesPage"
                        />
                    )}
                    <InputField
                        label="Amount (฿)"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("amount")}
                        error={errors.amount?.message}
                        required
                    />
                </div>
            </Modal>
        </>
    );
};

export default CycleEarningsPage;
