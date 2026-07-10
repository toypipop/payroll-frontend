import React, { useState, useEffect } from "react";
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
import ToggleField from "../../components/common/ToggleField";
import TimeField from "../../components/common/TimeField";

const attendanceConfigSchema = z.object({
    companies_id: z.number(),
    late_rate_per_minute: z.preprocess((val) => parseFloat(String(val)), z.number().min(0, "Invalid rate")),
    absent_rate_per_day: z.preprocess((val) => parseFloat(String(val)), z.number().min(0, "Invalid rate")),
    is_late_deduction_enabled: z.boolean(),
    is_absent_deduction_enabled: z.boolean(),
    work_start_time: z.string().optional(),
    work_end_time: z.string().optional(),
    overtime_rate_per_minute: z.preprocess((val) => val ? parseFloat(String(val)) : null, z.number().nullable()),
    extra_rate_per_day: z.preprocess((val) => val ? parseFloat(String(val)) : null, z.number().nullable()),
    is_overtime_earnings_enabled: z.boolean().default(false),
    is_extra_earnings_enabled: z.boolean().default(false),
});

const AttendanceSettingsPage = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompanie, setSelectedCompanie] = useState(null);

    const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(attendanceConfigSchema),
        defaultValues: {
            late_rate_per_minute: 5.0,
            absent_rate_per_day: 300.0,
            is_late_deduction_enabled: true,
            is_absent_deduction_enabled: true,
            work_start_time: "09:00",
            work_end_time: "18:00",
            overtime_rate_per_minute: null,
            extra_rate_per_day: null,
            is_overtime_earnings_enabled: false,
            is_extra_earnings_enabled: false,
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
        const config = companie.attendance_config;
        
        const formatTime = (timeValue) => {
            if (!timeValue) return "09:00";
            if (typeof timeValue === 'string') {
                if (timeValue.includes(':') && !timeValue.includes('T')) {
                    return timeValue.substring(0, 5);
                }
                const date = new Date(timeValue);
                if (!Number.isNaN(date.getTime())) {
                    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
                }
            }
            return "09:00";
        };

        setSelectedCompanie(companie);
        setValue("companies_id", companie.id);
        setValue("late_rate_per_minute", config?.late_rate_per_minute ?? 5.0);
        setValue("absent_rate_per_day", config?.absent_rate_per_day ?? 300.0);
        setValue("is_late_deduction_enabled", config?.is_late_deduction_enabled ?? true);
        setValue("is_absent_deduction_enabled", config?.is_absent_deduction_enabled ?? true);
        setValue("work_start_time", formatTime(config?.work_start_time));
        setValue("work_end_time", formatTime(config?.work_end_time));
        setValue("overtime_rate_per_minute", config?.overtime_rate_per_minute ?? "");
        setValue("extra_rate_per_day", config?.extra_rate_per_day ?? "");
        setValue("is_overtime_earnings_enabled", config?.is_overtime_earnings_enabled ?? false);
        setValue("is_extra_earnings_enabled", config?.is_extra_earnings_enabled ?? false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCompanie(null);
        reset();
    };

    const formatDisplayTime = (timeValue) => {
        if (!timeValue) return "-";
        if (typeof timeValue === 'string') {
            if (timeValue.includes(':') && !timeValue.includes('T')) {
                const [h, m] = timeValue.split(':');
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                return `${displayHour}:${m} ${ampm}`;
            }
            const date = new Date(timeValue);
            if (!Number.isNaN(date.getTime())) {
                const hours = date.getHours();
                const minutes = date.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
                return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
            }
        }
        return "-";
    };

    const columns = [
        { label: "Companies", key: "name" },
        {
            label: "Work Start",
            render: (row) => {
                const cfg = row.attendance_config;
                if (!cfg) return <span style={{ color: "#94a3b8" }}>-</span>;
                return formatDisplayTime(cfg.work_start_time);
            },
        },
        {
            label: "Work End",
            render: (row) => {
                const cfg = row.attendance_config;
                if (!cfg) return <span style={{ color: "#94a3b8" }}>-</span>;
                return formatDisplayTime(cfg.work_end_time);
            },
        },
        {
            label: "Late Amount",
            render: (row) => {
                const enabled = row.attendance_config?.is_late_deduction_enabled;
                if (enabled === undefined) return <span style={{ color: "#94a3b8" }}>Not Set</span>;
                return enabled ? <span style={{ color: "#16a34a", fontWeight: 600 }}>ON</span> : <span style={{ color: "#ef4444", fontWeight: 600 }}>OFF</span>;
            },
        },
        {
            label: "Absent Amount",
            render: (row) => {
                const enabled = row.attendance_config?.is_absent_deduction_enabled;
                if (enabled === undefined) return <span style={{ color: "#94a3b8" }}>Not Set</span>;
                return enabled ? <span style={{ color: "#16a34a", fontWeight: 600 }}>ON</span> : <span style={{ color: "#ef4444", fontWeight: 600 }}>OFF</span>;
            },
        },
        {
            label: "Overtime",
            render: (row) => {
                const enabled = row.attendance_config?.is_overtime_earnings_enabled;
                if (enabled === undefined) return <span style={{ color: "#94a3b8" }}>Not Set</span>;
                return enabled ? <span style={{ color: "#16a34a", fontWeight: 600 }}>ON</span> : <span style={{ color: "#ef4444", fontWeight: 600 }}>OFF</span>;
            },
        },
        {
            label: "Extra",
            render: (row) => {
                const enabled = row.attendance_config?.is_extra_earnings_enabled;
                if (enabled === undefined) return <span style={{ color: "#94a3b8" }}>Not Set</span>;
                return enabled ? <span style={{ color: "#16a34a", fontWeight: 600 }}>ON</span> : <span style={{ color: "#ef4444", fontWeight: 600 }}>OFF</span>;
            },
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
                    
                    <Controller
                        name="work_start_time"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <TimeField
                                label="Work Start Time"
                                value={value}
                                onChange={onChange}
                                error={errors.work_start_time?.message}
                            />
                        )}
                    />
                    
                    <Controller
                        name="work_end_time"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <TimeField
                                label="Work End Time"
                                value={value}
                                onChange={onChange}
                                error={errors.work_end_time?.message}
                            />
                        )}
                    />
                    
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "8px" }}>
                        <h4 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "600", color: "#334155" }}>Deduction Settings</h4>
                        
                        <Controller
                            name="is_late_deduction_enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <ToggleField
                                    label="Late Deduction Enable"
                                    checked={!!value}
                                    onChange={onChange}
                                />
                            )}
                        />
                        <InputField
                            label="Late Rate per Minute (฿)"
                            type="number"
                            step="0.01"
                            {...register("late_rate_per_minute")}
                            error={errors.late_rate_per_minute?.message}
                            required
                        />
                        
                        <Controller
                            name="is_absent_deduction_enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <ToggleField
                                    label="Absent Deduction Enable"
                                    checked={!!value}
                                    onChange={onChange}
                                />
                            )}
                        />
                        <InputField
                            label="Absent Rate per Day (฿)"
                            type="number"
                            step="0.01"
                            {...register("absent_rate_per_day")}
                            error={errors.absent_rate_per_day?.message}
                            required
                        />
                    </div>
                    
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "8px" }}>
                        <h4 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "600", color: "#334155" }}>Overtime & Extra Earnings</h4>
                        
                        <Controller
                            name="is_overtime_earnings_enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <ToggleField
                                    label="Overtime Earnings Enable"
                                    checked={!!value}
                                    onChange={onChange}
                                />
                            )}
                        />
                        <InputField
                            label="Overtime Rate per Minute (฿)"
                            type="number"
                            step="0.01"
                            {...register("overtime_rate_per_minute")}
                            error={errors.overtime_rate_per_minute?.message}
                        />
                        
                        <Controller
                            name="is_extra_earnings_enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <ToggleField
                                    label="Extra Earnings Enable"
                                    checked={!!value}
                                    onChange={onChange}
                                />
                            )}
                        />
                        <InputField
                            label="Extra Rate per Day (฿)"
                            type="number"
                            step="0.01"
                            {...register("extra_rate_per_day")}
                            error={errors.extra_rate_per_day?.message}
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default AttendanceSettingsPage;
