import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import DateField from "../../components/common/DateField";
import SelectField from "../../components/common/SelectField";
import Badge from "../../components/common/Badge";

const cycleSchema = z.object({
    cycle_name: z.string().min(1, "Cycle name is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    companies_id: z.string().min(1, "Company is required"),
}).refine((d) => d.end_date > d.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
});

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const PayrollCyclesPage = () => {
    const navigate = useNavigate();
    const [cycles, setCycles] = useState([]);
    const [companies, setCompanies] = useState([]);
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

    const fetchCompanies = async () => {
        try {
            const res = await api.get("/companies/options");
            setCompanies(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCycles();
        fetchCompanies();
    }, []);

    const onSubmit = async (data) => {
        try {
            await api.post("/payroll/cycles", {
                cycle_name: data.cycle_name,
                start_date: data.start_date + "T00:00:00Z",
                end_date: data.end_date + "T00:00:00Z",
                companies_id: Number(data.companies_id),
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
            sortKey: "cycle_name",
            searchableKeys: ["cycle_name"],
            render: (row) => (
                <span style={{ fontWeight: "600", color: "#1e293b" }}>{row.cycle_name}</span>
            ),
        },
        {
            label: "Period",
            sortKey: "start_date",
            sortValue: (row) => new Date(row.start_date).getTime(),
            searchableKeys: ["start_date", "end_date"],
            render: (row) => (
                <span style={{ fontSize: "13px", color: "#475569" }}>
                    {formatDate(row.start_date)} — {formatDate(row.end_date)}
                </span>
            ),
        },
        {
            label: "Status",
            sortKey: "is_closed",
            sortValue: (row) => (row.is_closed ? 1 : 0),
            searchValue: (row) => (row.is_closed ? "closed" : "open"),
            render: (row) => (
                <Badge status={row.is_closed ? "rejected" : "active"}>
                    {row.is_closed ? "Closed" : "Open"}
                </Badge>
            ),
        },
        {
            label: "Created",
            sortKey: "created_at",
            sortValue: (row) => new Date(row.created_at).getTime(),
            render: (row) => (
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{formatDate(row.created_at)}</span>
            ),
        },
        {
            label: "Companies",
            sortKey: "companies.name",
            searchableKeys: ["companies.name"],
            render: (row) => row.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
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
                    <Table columns={columns} data={cycles} defaultSort={{ key: "created_at", order: "desc" }} />
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
                        error={errors.cycle_name?.message}
                        {...register("cycle_name")}
                    />
                    <Controller
                        name="companies_id"
                        control={control}
                        render={({ field }) => (
                            <SelectField
                                label="Company"
                                options={companies}
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                error={errors.companies_id?.message}
                            />
                        )}
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
