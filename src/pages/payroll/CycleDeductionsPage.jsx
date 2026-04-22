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

const schema = z.object({
    id: z.number().optional(),
    cycle_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a payroll cycle")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    deduction_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a deduction type")),
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

const CycleDeductionsPage = () => {
    const [items, setItems] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [deductionTypes, setDeductionTypes] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { cycle_id: "", employees_id: "", deduction_type_id: "", amount: "" },
    });

    const editingId = watch("id");
    const watchedCycleId = watch("cycle_id");

    const cycleCompanyId = cycles.find((c) => String(c.id) === String(watchedCycleId))?.companies_id;

    const filteredEmployees = cycleCompanyId
        ? employees.filter((e) => String(e.companies_id) === String(cycleCompanyId))
        : [];

    const filteredDeductionTypes = cycleCompanyId
        ? deductionTypes.filter((dt) => String(dt.companies_id) === String(cycleCompanyId))
        : [];

    const cycleField = register("cycle_id");
    const employeeField = register("employees_id");

    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const [cycleRes, empRes, dtRes] = await Promise.all([
                    api.get("/payroll/cycles"),
                    api.get("/employees"),
                    api.get("/deduction-types"),
                ]);
                setCycles(cycleRes.data);
                setEmployees(empRes.data);
                setDeductionTypes(dtRes.data);
            } catch (err) {
                console.error("Master data fetch error:", err);
            }
        };
        fetchMaster();
    }, []);

    useEffect(() => {
        if (!selectedCycleId) {
            setItems([]);
            return;
        }
        const fetchItems = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/cycle-deductions?cycle_id=${selectedCycleId}`);
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
        const res = await api.get(`/cycle-deductions?cycle_id=${selectedCycleId}`);
        setItems(res.data);
    };

    const onSubmit = async (data) => {
        try {
            if (data.id) {
                await api.put(`/cycle-deductions/${data.id}`, data);
            } else {
                await api.post("/cycle-deductions", data);
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
            cycle_id: selectedCycleId ? Number(selectedCycleId) : "",
            employees_id: "",
            deduction_type_id: "",
            amount: "",
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        reset({
            id: item.id,
            cycle_id: item.cycle_id,
            employees_id: item.employees_id,
            deduction_type_id: item.deduction_type_id,
            amount: item.amount,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this variable deduction?")) return;
        try {
            await api.delete(`/cycle-deductions/${id}`);
            setItems((prev) => prev.filter((i) => i.id !== id));
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            alert("Delete failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset({ id: undefined, cycle_id: selectedCycleId ? Number(selectedCycleId) : "", employees_id: "", deduction_type_id: "", amount: "" });
    };

    const selectedCycleLabel = cycles.find((c) => String(c.id) === String(selectedCycleId));

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
            label: "Deduction Type",
            sortKey: "deduction_type_name",
            sortValue: (row) => row.deduction_type?.name?.toLowerCase() || "",
            searchableKeys: ["deduction_type.name"],
            render: (row) => row.deduction_type?.name ?? `ID: ${row.deduction_type_id}`,
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
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={{ fontSize: "12px", padding: "4px 8px" }}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)} style={{ fontSize: "12px", padding: "4px 8px", color: "#ef4444" }}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Cycle Variable Deductions"
                actionButton={
                    <Button onClick={handleAdd} disabled={!selectedCycleId} style={{ width: "auto" }}>
                        + Add Variable Deduction
                    </Button>
                }
            />

            <Card style={{ marginBottom: "16px", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <SelectField
                        label="Payroll Cycle"
                        options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}` }))}
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        containerStyle={{ minWidth: "280px", marginBottom: 0 }}
                    />
                </div>
                {selectedCycleLabel && (                    
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#64748b" }}>
                        Period: {formatDate(selectedCycleLabel.start_date)} - {formatDate(selectedCycleLabel.end_date)}
                    </div>
                )}
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Variable deductions are one-time per cycle and will be subtracted from net pay during payroll calculation.
                </p>
            </Card>

            <Card style={{ padding: "0px" }}>
                {!selectedCycleId ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        Select a payroll cycle to view or add variable deductions.
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
                title={editingId ? "Edit Variable Deduction" : "Add Variable Deduction for Cycle"}
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
                        label="Payroll Cycle"
                        {...cycleField}
                        error={errors.cycle_id?.message}
                        onChange={(e) => {
                            cycleField.onChange(e);
                            setValue("employees_id", "");
                            setValue("deduction_type_id", "");
                        }}
                        options={cycles.map((c) => ({
                            id: c.id,
                            name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}`,
                        }))}
                    />
                    <SelectField
                        label="Employee"
                        {...employeeField}
                        error={errors.employees_id?.message}
                        onChange={(e) => { employeeField.onChange(e); }}
                        options={filteredEmployees.map((e) => ({
                            id: e.id,
                            name: `${e.employees_code} - ${e.first_name} ${e.last_name}`,
                        }))}
                        disabled={!watchedCycleId}
                    />
                    <SelectField
                        label="Deduction Type"
                        {...register("deduction_type_id")}
                        error={errors.deduction_type_id?.message}
                        options={filteredDeductionTypes.map((dt) => ({ id: dt.id, name: dt.name }))}
                        disabled={!watchedCycleId}
                    />
                    <InputField
                        label="Amount (฿)"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("amount")}
                        error={errors.amount?.message}
                    />
                </div>
            </Modal>
        </>
    );
};

export default CycleDeductionsPage;
