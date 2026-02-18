import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import PageHeader from "../../../components/common/PageHeader";
import Card from "../../../components/common/Card";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";

/* --- 1. Validation Schema (English Comment) --- */
const timeLogSchema = z.object({
    employees_id: z.string().min(1, "Please select an employee"),
    work_date: z.string().min(1, "Work date is required"),
    check_in: z.string().optional().or(z.literal("")),
    check_out: z.string().optional().or(z.literal("")),
    status: z.string().min(1, "Status is required"),
    location_in: z.string().optional(),
    remark: z.string().optional(),
});

const TimelogListPage = () => {
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
        formState: { errors },
    } = useForm({
        resolver: zodResolver(timeLogSchema),
        defaultValues: {
            employees_id: "",
            work_date: new Date().toISOString().split("T")[0], // Default to today
            check_in: "",
            check_out: "",
            status: "On-time",
            location_in: "",
            remark: "",
        },
    });

    const fetchTimeLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get("/time-logs");
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
            // Helper to combine Date + Time into ISO String
            const formatDateTime = (dateStr, timeStr) => {
                if (!timeStr) return null;
                return new Date(`${dateStr}T${timeStr}`).toISOString();
            };

            const payload = {
                ...data,
                employees_id: parseInt(data.employees_id), // Convert string to uint for Go
                check_in: formatDateTime(data.work_date, data.check_in),
                check_out: formatDateTime(data.work_date, data.check_out),
            };

            if (editingId) {
                await api.put(`/time-logs/${editingId}`, payload);
            } else {
                await api.post("/time-logs", payload);
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
        
        // Extract YYYY-MM-DD from ISO string
        const wDate = log.work_date ? log.work_date.split("T")[0] : "";
        setValue("work_date", wDate);

        // Extract HH:mm from ISO string for Input type="time"
        // Note: This depends on browser locale, usually manually parsing or using a library like dayjs is safer
        // But for basic usage:
        const getTimeStr = (isoString) => {
            if (!isoString) return "";
            const d = new Date(isoString);
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        setValue("check_in", getTimeStr(log.check_in));
        setValue("check_out", getTimeStr(log.check_out));
        setValue("status", log.status);
        setValue("location_in", log.location_in || "");
        setValue("remark", log.remark || "");
        
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this log?")) {
            try {
                await api.delete(`/time-logs/${id}`);
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
        { label: "Date", render: (row) => row.work_date?.split("T")[0] },
        { 
            label: "Employee", 
            // Assuming your backend API joins employee table, or you map it manually.
            // If backend doesn't join, you might see just ID.
            render: (row) => row.employee_name || `ID: ${row.employees_id}` 
        },
        { 
            label: "Check In", 
            render: (row) => row.check_in ? new Date(row.check_in).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : "-" 
        },
        { 
            label: "Check Out", 
            render: (row) => row.check_out ? new Date(row.check_out).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : "-" 
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

                <InputField
                    label="Work Date"
                    type="date"
                    {...register("work_date")}
                    error={errors.work_date?.message}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <InputField
                        label="Check In"
                        type="time"
                        {...register("check_in")}
                        error={errors.check_in?.message}
                    />
                    <InputField
                        label="Check Out"
                        type="time"
                        {...register("check_out")}
                        error={errors.check_out?.message}
                    />
                </div>

                <SelectField
                    label="Status"
                    options={[
                        { id: "On-time", name: "On-time" },
                        { id: "Late", name: "Late" },
                        { id: "Absent", name: "Absent" },
                        { id: "Leave", name: "Leave" },
                        { id: "Holiday", name: "Holiday" }
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

export default TimelogListPage;