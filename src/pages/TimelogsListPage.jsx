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
import DateField from "../components/common/DateField";
import DateTimeField from "../components/common/DateTimeField";
import SelectField from "../components/common/SelectField";
import { Controller } from "react-hook-form";

/* --- 1. Validation Schema (English Comment) --- */
const timeLogSchema = z.object({
    employees_id: z.string().min(1, "Please select an employee"),
    check_in: z.date({
        required_error: "Check-in time is required",
        invalid_type_error: "That's not a valid date",
    }),
    check_out: z.date().nullable().optional(),
    status: z.string().min(1, "Status is required"),
    location_in: z.string().optional(),
    remark: z.string().optional(),
});

const TimelogsListPage = () => {
    const [timeLogs, setTimeLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Master data for dropdown
    const [masterEmployees, setMasterEmployees] = useState([]);

    /* --- 2. Initialize Hook Form (English Comment) --- */
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(timeLogSchema),
        defaultValues: {
            employees_id: "",
            check_in: new Date(),
            check_out: null,
            status: "on_time",
            location_in: "",
            remark: "",
        },
    });

    const fetchTimeLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get("/timelogs");
            setTimeLogs(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                // Fetch employees to show in dropdown
                const empRes = await api.get("/employees");
                setMasterEmployees(
                    empRes.data.map((e) => ({
                        id: e.id || e.ID,
                        name: `${e.employees_code} - ${e.first_name} ${e.last_name}`,
                    }))
                );
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchTimeLogs();
    }, []);

    /* --- 3. Submit Handler with Time Conversion (English Comment) --- */
    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                check_in: data.check_in ? new Date(data.check_in).toISOString() : null,
                check_out: data.check_out ? new Date(data.check_out).toISOString() : null,
                employees_id: parseInt(data.employees_id),
            };

            if (editingId) {
                await api.put(`/timelogs/${editingId}`, payload);
            } else {
                await api.post("/timelogs", payload);
            }
            fetchTimeLogs();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    const handleEdit = (log) => {
        setEditingId(log.ID || log.id);
        setValue("employees_id", log.employees_id?.toString());

        // Helper to ensure we have a valid Date object or null (English Comment)
        const parseDate = (isoString) => {
            return isoString ? new Date(isoString) : null;
        };

        // Use Date objects instead of time strings (English Comment)
        setValue("check_in", parseDate(log.check_in));
        setValue("check_out", parseDate(log.check_out));

        setValue("status", log.status);
        setValue("location_in", log.location_in || "");
        setValue("remark", log.remark || "");

        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this log?")) {
            try {
                await api.delete(`/timelogs/${id}`);
                fetchTimeLogs();
            } catch (err) {
                alert(err.response?.data?.error || "Delete Failed");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        reset();
    };

    const columns = [
        {
            label: "Employee",
            render: (row) => row.employees?.first_name + ' ' + row.employees?.last_name
        },
        {
            label: "Date",
            render: (row) => row.check_in ? new Date(row.check_in).toLocaleDateString() : "-"
        },
        {
            label: "Time In",
            render: (row) => row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"
        },
        { label: "Status", key: "status" },
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
                title="Attendance Time Logs"
                actionButton={
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        style={{ width: "auto" }}
                    >
                        + Add Manual Log
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        Loading...
                    </div>
                ) : (
                    <Table columns={columns} data={timeLogs} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Time Log" : "Add Manual Time Log"}
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={closeModal}
                            style={{ width: "auto" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            style={{ width: "auto" }}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                {/* 5. Inputs for TimeLog (English Comment) */}

                <SelectField
                    label="Employee"
                    options={masterEmployees}
                    {...register("employees_id")}
                    error={errors.employees_id?.message}
                />

                <Controller
                    control={control}
                    name="check_in"
                    render={({ field }) => (
                        <DateTimeField
                            label="Check In"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.check_in?.message}
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="check_out"
                    render={({ field }) => (
                        <DateTimeField
                            label="Check In"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.check_out?.message}
                        />
                    )}
                />

                <SelectField
                    label="Status"
                    options={[
                        { id: "on_time", name: "On-time" },
                        { id: "late", name: "Late" },
                        { id: "absent", name: "Absent" },
                        { id: "leave", name: "Leave" },
                        { id: "holiday", name: "Holiday" }
                    ]}
                    {...register("status")}
                    error={errors.status?.message}
                />

                <InputField
                    label="Location / Remark"
                    {...register("remark")}
                    error={errors.remark?.message}
                    placeholder="Optional remark"
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default TimelogsListPage;