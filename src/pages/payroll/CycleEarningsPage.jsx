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
    const [items, setItems] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [employees, setEmployees] = useState([]);
    // Only variable (non-permanent) earning types
    const [earningTypes, setEarningTypes] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { cycle_id: "", employees_id: "", earning_type_id: "", amount: "" },
    });

    const editingId = watch("id");

    // Fetch master data once
    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const [cycleRes, empRes, etRes] = await Promise.all([
                    api.get("/payroll/cycles"),
                    api.get("/employees"),
                    api.get("/earning-types"),
                ]);
                setCycles(cycleRes.data);
                setEmployees(empRes.data);
                // Only show Variable (non-permanent) types in this page
                setEarningTypes(etRes.data.filter((et) => !et.is_permanent));
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
            cycle_id: selectedCycleId ? Number(selectedCycleId) : "",
            employees_id: "",
            earning_type_id: "",
            amount: "",
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        reset({
            id: item.id,
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
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            alert("Delete failed");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset({ id: undefined, cycle_id: selectedCycleId ? Number(selectedCycleId) : "", employees_id: "", earning_type_id: "", amount: "" });
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
            label: "Earning Type (Variable)",
            render: (row) => row.earning_type?.name ?? `ID: ${row.earning_type_id}`,
        },
        {
            label: "Amount (฿)",
            render: (row) => row.amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        },
        {
            label: "Companies",
            render: (row) => row.employees?.companies?.name || "-",
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
                title="Cycle Variable Earnings"
                actionButton={
                    <Button onClick={handleAdd} disabled={!selectedCycleId} style={{ width: "auto" }}>
                        + Add Variable Earning
                    </Button>
                }
            />

            {/* Cycle selector */}
            <Card style={{ marginBottom: "16px", padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <SelectField
                        label="Payroll Cycle"
                        options={cycles.map((c) => ({ id: c.id, name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}` }))}
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        placeholder="— Select a cycle —"
                        containerStyle={{ minWidth: "280px", marginBottom: 0 }}
                    />
                </div>
                {selectedCycleLabel && (                    
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#64748b" }}>
                        Period: {formatDate(selectedCycleLabel.start_date)} - {formatDate(selectedCycleLabel.end_date)}
                    </div>
                )}
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Variable earnings (Bonus, Commission, etc.) are one-time per cycle. Fixed earnings (Position Allowance, etc.) are managed under Employee Earnings.
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
                    <Table columns={columns} data={items} />
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
                            name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}`,
                        }))}
                    />
                    <SelectField
                        label="Employee"
                        {...register("employees_id")}
                        error={errors.employees_id?.message}
                        options={employees.map((e) => ({
                            id: e.id,
                            name: `${e.employees_code} — ${e.first_name} ${e.last_name}`,
                        }))}
                    />
                    <SelectField
                        label="Earning Type (Variable only)"
                        {...register("earning_type_id")}
                        error={errors.earning_type_id?.message}
                        options={earningTypes.map((et) => ({ id: et.id, name: et.name }))}
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

export default CycleEarningsPage;
