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
import DateField from "../../components/common/DateField";

import { Controller } from "react-hook-form";

// Validation schema for leave requests
const leaveSchema = z.object({
    employees_id: z.string().min(1, "Please select an employee"),
    leave_type_id: z.string().min(1, "Please select leave type"),
    // Accept YYYY-MM-DD string from DateField
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().max(500, "Reason must be less than 500 characters").optional().or(z.literal("")),
}).refine((data) => {
    if (data.start_date && data.end_date) {
        // Same day is allowed (1 day leave)
        return data.end_date >= data.start_date;
    }
    return true;
}, {
    message: "End date must be on or after start date",
    path: ["end_date"],
});

const LeaveRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [masterEmployees, setMasterEmployees] = useState([]);
    const [masterLeaveTypes, setMasterLeaveTypes] = useState([]);
    const [employeeData, setEmployeeData] = useState({});

    // Initialize form with hook form
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
            start_date: "",
            end_date: "",
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
                        name: `${e.employees_code || "-"} - ${e.first_name} ${e.last_name}`,
                    }))
                );
                
                const empDataMap = {};
                empRes.data.forEach((e) => {
                    empDataMap[e.id || e.ID] = e;
                });
                setEmployeeData(empDataMap);

                setMasterLeaveTypes((ltRes.data || []).map((lt) => ({ 
                    id: lt.id || lt.ID,
                    name: lt.name,
                    companies_id: lt.companies_id 
                })));
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchRequests();
    }, []);

    const onSubmit = async (data) => {
        try {
            const employeeId = Number(data.employees_id);
            const leaveTypeId = Number(data.leave_type_id);
            const companyId = employeeData[data.employees_id]?.companies_id || null;
            const selectedLeaveType = masterLeaveTypes.find((lt) => String(lt.id) === String(data.leave_type_id));

            if (!Number.isFinite(employeeId) || employeeId <= 0) {
                alert("Please select an employee");
                return;
            }

            if (!Number.isFinite(leaveTypeId) || leaveTypeId <= 0) {
                alert("Please select leave type");
                return;
            }

            if (!selectedLeaveType?.name) {
                alert("Please select a valid leave type");
                return;
            }

            const payload = {
                ...data,
                employees_id: employeeId,
                leave_type_id: leaveTypeId,
                leave_type: selectedLeaveType.name,
                companies_id: companyId,
                start_date: `${data.start_date}T00:00:00Z`,
                end_date: `${data.end_date}T00:00:00Z`,
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
        if (req.status !== "Pending") {
            alert("Only pending requests can be edited");
            return;
        }

        setEditingId(req.id || req.ID);
        setValue("employees_id", req.employees_id?.toString() || "");
        setSelectedEmployeeId(req.employees_id?.toString() || "");
        setValue("leave_type_id", req.leave_type_id?.toString() || "");
        setValue("start_date", req.start_date ? req.start_date.split("T")[0] : "");
        setValue("end_date", req.end_date ? req.end_date.split("T")[0] : "");
        setValue("reason", req.reason || "");
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const currentItem = requests.find((r) => (r.id || r.ID) === id);
        if (currentItem && currentItem.status !== "Pending") {
            alert("Only pending requests can be deleted");
            return;
        }

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
        setSelectedEmployeeId("");
        reset();
    };

    const openCreateModal = () => {
        setEditingId(null);
        setSelectedEmployeeId("");
        reset({
            employees_id: "",
            leave_type_id: "",
            start_date: "",
            end_date: "",
            reason: "",
        });
        setIsModalOpen(true);
    };

    const selectedEmployeeCompaniesId = selectedEmployeeId 
        ? employeeData[selectedEmployeeId]?.companies_id 
        : null;
    
    const filteredLeaveTypes = selectedEmployeeCompaniesId
        ? masterLeaveTypes.filter((lt) => 
            !lt.companies_id || String(lt.companies_id) === String(selectedEmployeeCompaniesId)
        )
        : masterLeaveTypes;

    const handleEmployeeChange = (e) => {
        const empId = e.target.value;
        setSelectedEmployeeId(empId);
        setValue("leave_type_id", "");
    };

    const columns = [
        { label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim().toLowerCase(),
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
        {
            label: "Type",
            sortKey: "leave_type_name",
            sortValue: (row) => (row.leave_type_master?.name || row.leave_type || "").toLowerCase(),
            render: (row) => row.leave_type_master?.name || row.leave_type || "—",
        },
        {
            label: "Duration",
            sortKey: "start_date",
            sortValue: (row) => (row.start_date ? new Date(row.start_date).getTime() : 0),
            render: (row) => {
                const formatD = (d) => new Date(d).toLocaleDateString('en-GB', {
                    day: '2-digit', month: '2-digit', year: '2-digit'
                });
                return <div style={{ whiteSpace: "nowrap" }}>{formatD(row.start_date)} - {formatD(row.end_date)}</div>;
            }
        },
        {
            label: "Status",
            sortKey: "status",
            render: (row) => <Badge status={row.status}>{row.status}</Badge>,
        },
        {
            label: "Approved By",
            sortKey: "approver_name",
            sortValue: (row) => `${row.approver?.first_name || ""} ${row.approver?.last_name || ""}`.trim().toLowerCase(),
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
            sortKey: "employees.companies.name",
            render: (row) => row.employees?.companies?.name || "-",
        },
        {
            label: "Actions",
            sortable: false,
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        variant="ghost"
                        onClick={() => handleEdit(row)}
                        style={{
                            ...smallBtn,
                            opacity: row.status === "Pending" ? 1 : 0.45,
                            cursor: row.status === "Pending" ? "pointer" : "not-allowed",
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row.id || row.ID)}
                        style={{
                            ...smallBtn,
                            opacity: row.status === "Pending" ? 1 : 0.45,
                            cursor: row.status === "Pending" ? "pointer" : "not-allowed",
                        }}
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
                title="Leave Requests"
                actionButton={
                    <Button
                        onClick={openCreateModal}
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
                    onChange={(e) => {
                        register("employees_id").onChange(e);
                        handleEmployeeChange(e);
                    }}
                />

                <SelectField
                    label="Leave Type"
                    options={filteredLeaveTypes}
                    {...register("leave_type_id")}
                    error={errors.leave_type_id?.message}
                    disabled={!selectedEmployeeId}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <Controller
                        control={control}
                        name="start_date"
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
                        control={control}
                        name="end_date"
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
