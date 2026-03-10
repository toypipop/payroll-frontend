import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../api/axiosInstance";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import SelectField from "../components/common/SelectField";

const schema = z.object({
    id: z.number().optional(),
    cycle_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a payroll cycle")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    deduction_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a deduction type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

const CycleDeductionsPage = () => {
    const [items, setItems] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [deductionTypes, setDeductionTypes] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { cycle_id: "", employees_id: "", deduction_type_id: "", amount: "" },
    });

    const editingId = watch("id");

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
            render: (row) =>
                row.employees
                    ? `${row.employees.first_name} ${row.employees.last_name}`
                    : `ID: ${row.employees_id}`,
        },
        {
            label: "Deduction Type",
            render: (row) => row.deduction_type?.name ?? `ID: ${row.deduction_type_id}`,
        },
        {
            label: "Amount (฿)",
            render: (row) => row.amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        },
        {
            label: "Actions",
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
                    <label style={{ fontWeight: "600", fontSize: "14px", color: "#374151", whiteSpace: "nowrap" }}>
                        Payroll Cycle
                    </label>
                    <select
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        style={{
                            padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
                            fontSize: "14px", minWidth: "280px", backgroundColor: "#fff",
                        }}
                    >
                        <option value="">- Select a cycle -</option>
                        {cycles.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.cycle_name ?? `Cycle #${c.id}`} {c.is_closed ? "(Closed)" : "(Open)"}
                            </option>
                        ))}
                    </select>
                    {selectedCycleLabel && (
                        <span style={{ fontSize: "13px", color: "#64748b" }}>
                            {selectedCycleLabel.start_date?.slice(0, 10)} to {selectedCycleLabel.end_date?.slice(0, 10)}
                        </span>
                    )}
                </div>
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
                    <Table columns={columns} data={items} />
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
                        {...register("cycle_id")}
                        error={errors.cycle_id?.message}
                        options={cycles.map((c) => ({
                            id: c.id,
                            name: `${c.cycle_name ?? `Cycle #${c.id}`} ${c.is_closed ? "(Closed)" : "(Open)"}`,
                        }))}
                    />
                    <SelectField
                        label="Employee"
                        {...register("employees_id")}
                        error={errors.employees_id?.message}
                        options={employees.map((e) => ({
                            id: e.id,
                            name: `${e.employees_code} - ${e.first_name} ${e.last_name}`,
                        }))}
                    />
                    <SelectField
                        label="Deduction Type"
                        {...register("deduction_type_id")}
                        error={errors.deduction_type_id?.message}
                        options={deductionTypes.map((dt) => ({ id: dt.id, name: dt.name }))}
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
