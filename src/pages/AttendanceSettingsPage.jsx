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

const attendanceConfigSchema = z.object({
    companies_id: z.number(),
    late_rate_per_minute: z.preprocess((val) => parseFloat(val), z.number().min(0, "Invalid rate")),
    absent_rate_per_day: z.preprocess((val) => parseFloat(val), z.number().min(0, "Invalid rate")),
    work_start_hour: z.preprocess((val) => parseInt(val), z.number().min(0).max(23, "Must be 0-23")),
    work_start_min: z.preprocess((val) => parseInt(val), z.number().min(0).max(59, "Must be 0-59")),
});

const AttendanceSettingsPage = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompanie, setSelectedCompanie] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(attendanceConfigSchema),
        defaultValues: {
            late_rate_per_minute: 5.0,
            absent_rate_per_day: 300.0,
            work_start_hour: 9,
            work_start_min: 0,
        },
    });

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const res = await api.get("/attendance/config");
            setConfigs(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfigs(); }, []);

    const onSubmit = async (data) => {
        try {
            await api.post("/attendance/config", data);
            fetchConfigs();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (companie) => {
        setSelectedCompanie(companie);
        setValue("companies_id", companie.ID || companie.id);
        setValue("late_rate_per_minute", companie.attendance_config?.late_rate_per_minute ?? 5.0);
        setValue("absent_rate_per_day", companie.attendance_config?.absent_rate_per_day ?? 300.0);
        setValue("work_start_hour", companie.attendance_config?.work_start_hour ?? 9);
        setValue("work_start_min", companie.attendance_config?.work_start_min ?? 0);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCompanie(null);
        reset();
    };

    const columns = [
        { label: "Company Name", key: "name" },
        {
            label: "Work Start",
            render: (row) => {
                const cfg = row.attendance_config;
                if (!cfg) return <span style={{ color: "#94a3b8" }}>Not Set</span>;
                const h = String(cfg.work_start_hour).padStart(2, "0");
                const m = String(cfg.work_start_min).padStart(2, "0");
                return `${h}:${m}`;
            },
        },
        {
            label: "Late Rate (/ min)",
            render: (row) =>
                row.attendance_config
                    ? `฿${row.attendance_config.late_rate_per_minute}`
                    : <span style={{ color: "#94a3b8" }}>Not Set</span>,
        },
        {
            label: "Absent Rate (/ day)",
            render: (row) =>
                row.attendance_config
                    ? `฿${row.attendance_config.absent_rate_per_day}`
                    : <span style={{ color: "#94a3b8" }}>Not Set</span>,
        },
        {
            label: "Actions",
            render: (row) => (
                <Button variant="ghost" onClick={() => handleEdit(row)} style={{ fontSize: "12px" }}>
                    {row.attendance_config ? "Update" : "Setup"}
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Attendance Settings" />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={configs} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={`Attendance Config: ${selectedCompanie?.name}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal} style={{ width: "auto" }}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} style={{ width: "auto" }}>Save</Button>
                    </>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <input type="hidden" {...register("companies_id", { valueAsNumber: true })} />
                    <InputField
                        label="Work Start Hour (0–23)"
                        type="number"
                        min="0"
                        max="23"
                        {...register("work_start_hour")}
                        error={errors.work_start_hour?.message}
                    />
                    <InputField
                        label="Work Start Minute (0–59)"
                        type="number"
                        min="0"
                        max="59"
                        {...register("work_start_min")}
                        error={errors.work_start_min?.message}
                    />
                    <InputField
                        label="Late Rate per Minute (฿)"
                        type="number"
                        step="0.01"
                        {...register("late_rate_per_minute")}
                        error={errors.late_rate_per_minute?.message}
                    />
                    <InputField
                        label="Absent Rate per Day (฿)"
                        type="number"
                        step="0.01"
                        {...register("absent_rate_per_day")}
                        error={errors.absent_rate_per_day?.message}
                    />
                </div>
            </Modal>
        </>
    );
};

export default AttendanceSettingsPage;
