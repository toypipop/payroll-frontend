import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import DateTimeField from "../../components/common/DateTimeField";
import SelectField from "../../components/common/SelectField";
import { Controller } from "react-hook-form";

// Validation schema for timelog form
const timeLogSchema = z.object({
    employees_id: z.string().min(1, "Please select an employee"),
    check_in: z.date({
        required_error: "Check-in time is required",
        invalid_type_error: "That's not a valid date",
    }),
    check_out: z.date().nullable().optional(),
    status: z.string().min(1, "Status is required"),
    work_location_id: z.coerce.number().optional().nullable(),
    remark: z.string().optional(),
}).refine((data) => {
    if (data.check_in && data.check_out) {
        return new Date(data.check_out) >= new Date(data.check_in);
    }
    return true;
}, {
    message: "Check-out must be after check-in",
    path: ["check_out"],
});

const TimelogsListPage = () => {
    const [timeLogs, setTimeLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

    // Master data for dropdown
    const [masterEmployees, setMasterEmployees] = useState([]);
    const [masterWorkLocations, setMasterWorkLocations] = useState([]);
    const [employeeData, setEmployeeData] = useState({});
    const [attendanceConfigs, setAttendanceConfigs] = useState({});

    // Initialize form with hook form
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
            work_location_id: "",
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
                const [empRes, locRes, attConfigRes] = await Promise.all([
                    api.get("/employees"),
                    api.get("/master/work-locations").catch(() => ({ data: [] })),
                    api.get("/attendance/config").catch(() => ({ data: [] })),
                ]);
                setMasterEmployees(
                    empRes.data.map((e) => ({
                        id: e.id || e.ID,
                        name: `${e.employees_code} - ${e.first_name} ${e.last_name}`,
                    }))
                );
                
                const empDataMap = {};
                empRes.data.forEach((e) => {
                    empDataMap[e.id || e.ID] = e;
                });
                setEmployeeData(empDataMap);
                
                setMasterWorkLocations((locRes.data || []).map((l) => ({ 
                    id: l.id, 
                    name: l.name,
                    companies_id: l.companies_id 
                })));

                const configMap = {};
                (attConfigRes.data || []).forEach((c) => {
                    const compId = c.ID || c.id || c.companies_id;
                    if (compId) {
                        configMap[compId] = c.attendance_config || null;
                    }
                });
                setAttendanceConfigs(configMap);
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchTimeLogs();
    }, []);

    // Submit handler with time conversion
    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                check_in: data.check_in ? new Date(data.check_in).toISOString() : null,
                check_out: data.check_out ? new Date(data.check_out).toISOString() : null,
                employees_id: parseInt(data.employees_id),
                work_location_id: data.work_location_id ? parseInt(data.work_location_id) : null,
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
        setSelectedEmployeeId(log.employees_id?.toString());

        // Ensure valid Date object or null
        const parseDate = (isoString) => {
            return isoString ? new Date(isoString) : null;
        };

        // Use Date objects instead of time strings (English Comment)
        setValue("check_in", parseDate(log.check_in));
        setValue("check_out", parseDate(log.check_out));

        setValue("status", log.status);
        setValue("work_location_id", log.work_location_id?.toString() || "");
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
        setSelectedEmployeeId("");
        reset();
    };

    const selectedEmployeeCompaniesId = selectedEmployeeId 
        ? employeeData[selectedEmployeeId]?.companies_id 
        : null;
    
    const filteredWorkLocations = selectedEmployeeCompaniesId
        ? masterWorkLocations.filter((loc) => 
            !loc.companies_id || String(loc.companies_id) === String(selectedEmployeeCompaniesId)
        )
        : masterWorkLocations;

    const parseTimeFromConfig = (timeValue, defaultHour, defaultMin) => {
        if (!timeValue) return { hour: defaultHour, min: defaultMin };
        
        if (typeof timeValue === 'string') {
            if (timeValue.includes(':') && !timeValue.includes('T')) {
                const [h, m] = timeValue.split(':').map(Number);
                return { hour: h, min: m };
            }
            const date = new Date(timeValue);
            if (!isNaN(date.getTime())) {
                return { hour: date.getHours(), min: date.getMinutes() };
            }
        }
        
        if (timeValue instanceof Date && !isNaN(timeValue.getTime())) {
            return { hour: timeValue.getHours(), min: timeValue.getMinutes() };
        }
        
        return { hour: defaultHour, min: defaultMin };
    };

    const handleEmployeeChange = (e) => {
        const empId = e.target.value;
        setSelectedEmployeeId(empId);
        setValue("work_location_id", "");

        if (empId) {
            const emp = employeeData[empId];
            const compId = emp?.companies_id;
            const config = compId ? attendanceConfigs[compId] : null;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (config) {
                const { hour: startHour, min: startMin } = parseTimeFromConfig(config.work_start_time, 9, 0);
                const { hour: endHour, min: endMin } = parseTimeFromConfig(config.work_end_time, 18, 0);
                
                const checkInDate = new Date(today);
                checkInDate.setHours(startHour, startMin, 0, 0);
                
                const checkOutDate = new Date(today);
                checkOutDate.setHours(endHour, endMin, 0, 0);
                
                setValue("check_in", checkInDate);
                setValue("check_out", checkOutDate);
            } else {
                const defaultCheckIn = new Date(today);
                defaultCheckIn.setHours(9, 0, 0, 0);
                const defaultCheckOut = new Date(today);
                defaultCheckOut.setHours(18, 0, 0, 0);
                
                setValue("check_in", defaultCheckIn);
                setValue("check_out", defaultCheckOut);
            }
        } else {
            setValue("check_in", null);
            setValue("check_out", null);
        }
    };

    const columns = [
        {
            label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim().toLowerCase(),
            render: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim() || "-",
        },
        {
            label: "Date",
            sortKey: "check_in_date",
            sortValue: (row) => (row.check_in ? new Date(row.check_in).getTime() : 0),
            render: (row) => row.check_in ? new Date(row.check_in).toISOString().split("T")[0] : "-",
        },
        {
            label: "Time In",
            sortKey: "check_in_time",
            sortValue: (row) => {
                if (!row.check_in) return -1;
                const date = new Date(row.check_in);
                return date.getHours() * 60 + date.getMinutes();
            },
            render: (row) => row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
        },
        { label: "Status", key: "status" },
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
                    onChange={(e) => {
                        register("employees_id").onChange(e);
                        handleEmployeeChange(e);
                    }}
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
                            label="Check Out"
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

                <SelectField
                    label="Work Location (Optional)"
                    options={filteredWorkLocations}
                    {...register("work_location_id")}
                    error={errors.work_location_id?.message}
                    disabled={!selectedEmployeeId}
                />

                <InputField
                    label="Remark"
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
