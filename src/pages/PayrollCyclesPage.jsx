import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../api/axiosInstance";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import DateField from "../components/common/DateField";
import Badge from "../components/common/Badge";

const cycleSchema = z.object({
    cycle_name: z.string().min(1, "Cycle name is required"),
    start_date: z.date({ required_error: "Start date is required" }),
    end_date: z.date({ required_error: "End date is required" }),
}).refine((d) => d.end_date > d.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
});

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const PayrollCyclesPage = () => {
    const navigate = useNavigate();
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: zodResolver(cycleSchema),
    });

    const fetchCycles = async () => {
        try {
            setLoading(true);
            const res = await api.get("/payroll/cycles");
            setCycles(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCycles(); }, []);

    const onSubmit = async (data) => {
        try {
            await api.post("/payroll/cycles", {
                cycle_name: data.cycle_name,
                start_date: data.start_date.toISOString(),
                end_date: data.end_date.toISOString(),
            });
            fetchCycles();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create cycle");
        }
    };

    const handleClose = async (id, name) => {
        if (!window.confirm(`Close cycle "${name}"? This will lock all payroll data for this period.`)) return;
        try {
            await api.patch(`/payroll/cycles/${id}/close`);
            fetchCycles();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to close cycle");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const columns = [
        {
            label: "Cycle Name",
            render: (row) => (
                <span style={{ fontWeight: "600", color: "#1e293b" }}>{row.cycle_name}</span>
            ),
        },
        {
            label: "Period",
            render: (row) => (
                <span style={{ fontSize: "13px", color: "#475569" }}>
                    {formatDate(row.start_date)} — {formatDate(row.end_date)}
                </span>
            ),
        },
        {
            label: "Status",
            render: (row) => (
                <Badge status={row.is_closed ? "rejected" : "active"}>
                    {row.is_closed ? "Closed" : "Open"}
                </Badge>
            ),
        },
        {
            label: "Created",
            render: (row) => (
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{formatDate(row.created_at)}</span>
            ),
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {row.is_closed ? (
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/transactions?cycle_id=${row.id}`)}
                            style={{ fontSize: "12px", padding: "6px 14px" }}
                        >
                            View Transactions
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            onClick={() => handleClose(row.id, row.cycle_name)}
                            style={{ fontSize: "12px", padding: "6px 14px" }}
                        >
                            Close Cycle
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Payroll Cycles"
                actionButton={
                    <Button onClick={() => setIsModalOpen(true)} style={{ width: "auto" }}>
                        + New Cycle
                    </Button>
                }
            />

            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading cycles...</div>
                ) : cycles.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        No payroll cycles yet. Create your first cycle to get started.
                    </div>
                ) : (
                    <Table columns={columns} data={cycles} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Create New Payroll Cycle"
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>Create Cycle</Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <InputField
                        label="Cycle Name"
                        placeholder="e.g. Mar 2026"
                        error={errors.cycle_name?.message}
                        {...register("cycle_name")}
                    />
                    <Controller
                        name="start_date"
                        control={control}
                        render={({ field }) => (
                            <DateField
                                label="Start Date"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.start_date?.message}
                            />
                        )}
                    />
                    <Controller
                        name="end_date"
                        control={control}
                        render={({ field }) => (
                            <DateField
                                label="End Date"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.end_date?.message}
                            />
                        )}
                    />
                </div>
            </Modal>
        </>
    );
};

export default PayrollCyclesPage;
