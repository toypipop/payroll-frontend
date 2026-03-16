import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../api/axiosInstance";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";
import DateTimeField from "../../components/common/DateTimeField";

import { Controller } from "react-hook-form";

/* --- 1. Validation Schema (English Comment) --- */
const leaveSchema = z.object({
    employees_id: z.string().min(1, "Please select an employee"),
    leave_type_id: z.string().min(1, "Please select leave type"),
    // Change from z.string() to z.any() or z.date() to accept Date objects from DateTimeField
    start_date: z.date({
        required_error: "Start date is required",
        invalid_type_error: "Start date is required",
    }),
    end_date: z.date({
        required_error: "End date is required",
        invalid_type_error: "End date is required",
    }),
    reason: z.string().max(500, "Reason must be less than 500 characters").optional().or(z.literal("")),
}).refine((data) => {
    if (data.start_date && data.end_date) {
        // Direct comparison for Date objects
        return data.end_date >= data.start_date;
    }
    return true;
}, {
    message: "End date cannot be earlier than start date",
    path: ["end_date"],
});

const LeaveRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [masterEmployees, setMasterEmployees] = useState([]);
    const [masterLeaveTypes, setMasterLeaveTypes] = useState([]);

    /* --- 2. Initialize Hook Form (English Comment) --- */
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(leaveSchema),
        defaultValues: {
            employees_id: "",
            leave_type_id: "",
            start_date: new Date(),
            end_date: new Date(),
            reason: "",
        },
    });

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get("/leaves/requests");
            setRequests(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [empRes, ltRes] = await Promise.all([
                    api.get("/employees"),
                    api.get("/master/leave-types").catch(() => ({ data: [] })),
                ]);
                setMasterEmployees(
                    empRes.data.map((e) => ({
                        id: e.id || e.ID,
                        name: `${e.first_name} ${e.last_name}`,
                    }))
                );
                setMasterLeaveTypes((ltRes.data || []).map((lt) => ({ id: lt.id, name: lt.name })));
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchRequests();
    }, []);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                employees_id: parseInt(data.employees_id),
                leave_type_id: parseInt(data.leave_type_id),
                companies_id: 1,
                // Ensure dates are converted to ISO string for Go time.Time
                start_date: data.start_date.toISOString(),
                end_date: data.end_date.toISOString(),
            };

            if (editingId) {
                await api.put(`/leaves/requests/${editingId}`, payload);
            } else {
                await api.post("/leaves/requests", payload);
            }
            fetchRequests();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "Operation Failed");
        }
    };
    const handleEdit = (req) => {
        setEditingId(req.id || req.ID);
        setValue("employees_id", req.employees_id?.toString() || "");
        setValue("leave_type_id", req.leave_type_id?.toString() || "");
        // Convert string from API back to Date object for DateTimeField
        setValue("start_date", req.start_date ? new Date(req.start_date) : null);
        setValue("end_date", req.end_date ? new Date(req.end_date) : null);
        setValue("reason", req.reason || "");
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this request?")) {
            try {
                await api.delete(`/leaves/requests/${id}`);
                fetchRequests();
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
        { label: "Employee",
            render: (row) => (
                <div style={{ whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: "600" }}>
                        {row.employees?.first_name} {row.employees?.last_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {row.employees?.employees_code}
                    </div>
                </div>
            )
        },
        { label: "Type", render: (row) => row.leave_type_master?.name || row.leave_type || "—" },
        {
            label: "Duration",
            render: (row) => {
                const formatD = (d) => new Date(d).toLocaleDateString('en-GB', {
                    day: '2-digit', month: '2-digit', year: '2-digit'
                });
                return <div style={{ whiteSpace: "nowrap" }}>{formatD(row.start_date)} - {formatD(row.end_date)}</div>;
            }
        },
        {
            label: "Status",
            render: (row) => <Badge status={row.status}>{row.status}</Badge>,
        },
        {
            label: "Approved By",
            render: (row) => (
                <div style={{ fontSize: "13px", color: "#475569" }}>
                    {row.approver ? (
                        <div style={{ whiteSpace: "nowrap" }}>
                            {row.approver.first_name} {row.approver.last_name}
                        </div>
                    ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>-</span>
                    )}
                </div>
            ),
        },
        {
            label: "Companies",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => handleEdit(row)} style={smallBtn}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id || row.ID)} style={smallBtn}>Delete</Button>
                </div>
            ),
        },
    ];
    
    return (
        <>
            <PageHeader
                title="Leave Requests"
                actionButton={
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        style={{ width: "auto" }}
                    >
                        + Create Request
                    </Button>
                }
            />
            <Card style={{ padding: "0px" }}>
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                ) : (
                    <Table columns={columns} data={requests} />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Edit Leave Request" : "New Leave Request"}
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
                            {editingId ? "Update" : "Submit"}
                        </Button>
                    </>
                }
            >
                <SelectField
                    label="Employee"
                    options={masterEmployees}
                    {...register("employees_id")}
                    error={errors.employees_id?.message}
                />

                <SelectField
                    label="Leave Type"
                    options={[{ id: "", name: "— Select —" }, ...masterLeaveTypes]}
                    {...register("leave_type_id")}
                    error={errors.leave_type_id?.message}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Start Date Controller (English Comment) */}
                    <Controller
                        control={control}
                        name="start_date"
                        render={({ field }) => (
                            <DateTimeField
                                label="Start Date"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.start_date?.message}
                            />
                        )}
                    />

                    {/* End Date Controller (English Comment) */}
                    <Controller
                        control={control}
                        name="end_date"
                        render={({ field }) => (
                            <DateTimeField
                                label="End Date"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.end_date?.message}
                            />
                        )}
                    />
                </div>

                <InputField
                    label="Reason"
                    placeholder="Provide details about your leave..."
                    {...register("reason")}
                    error={errors.reason?.message}
                />
            </Modal>
        </>
    );
};

const smallBtn = { padding: "6px 12px", fontSize: "12px" };

export default LeaveRequestsPage;
