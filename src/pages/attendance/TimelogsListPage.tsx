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
import DateTimeField from "../../components/common/DateTimeField";
import SelectField from "../../components/common/SelectField";
import { Controller } from "react-hook-form";

// Validation schema for timelog form
const timeLogSchema = z.object({
    employees_id: z.string().min(1, "Please select an employee"),
    check_in: z.string().min(1, "Check-in time is required"),
    check_out: z.string().optional().or(z.literal("")),
    work_location_id: z.coerce.number().optional().nullable(),
    remark: z.string().optional(),
}).refine((data) => {
    if (data.check_in && data.check_out) {
        return data.check_out >= data.check_in;
    }
    return true;
}, {
    message: "Check-out must be after check-in",
    path: ["check_out"],
});

const toLocalDateTimeValue = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseToLocalDateTimeValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return toLocalDateTimeValue(date);
};

const parseTimeFromConfig = (timeValue, defaultHour, defaultMin) => {
    if (!timeValue) return { hour: defaultHour, min: defaultMin };

    if (typeof timeValue === "string") {
        if (timeValue.includes(":") && !timeValue.includes("T")) {
            const [hour, min] = timeValue.split(":").map(Number);
            if (Number.isFinite(hour) && Number.isFinite(min)) {
                return { hour, min };
            }
        }

        const date = new Date(timeValue);
        if (!Number.isNaN(date.getTime())) {
            return { hour: date.getHours(), min: date.getMinutes() };
        }
    }

    if (timeValue instanceof Date && !Number.isNaN(timeValue.getTime())) {
        return { hour: timeValue.getHours(), min: timeValue.getMinutes() };
    }

    return { hour: defaultHour, min: defaultMin };
};

const buildDateWithTime = (baseDate, hour, min) => {
    const date = new Date(baseDate);
    date.setHours(hour, min, 0, 0);
    return date;
};

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
        getValues,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(timeLogSchema),
        defaultValues: {
            employees_id: "",
            check_in: "",
            check_out: "",
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
        setValue("check_in", parseToLocalDateTimeValue(log.check_in));
        setValue("check_out", parseToLocalDateTimeValue(log.check_out));

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

    const fillScheduleTimesForEmployee = (empId) => {
        if (!empId) {
            setValue("check_in", "");
            setValue("check_out", "");
            return;
        }

        const emp = employeeData[empId];
        const companiesId = emp?.companies_id;
        const config = companiesId ? attendanceConfigs[companiesId] : null;
        const currentCheckIn = getValues("check_in");
        const selectedDate = currentCheckIn && !Number.isNaN(new Date(currentCheckIn).getTime())
            ? new Date(currentCheckIn)
            : new Date();

        selectedDate.setHours(0, 0, 0, 0);

        const { hour: startHour, min: startMin } = parseTimeFromConfig(config?.work_start_time, 9, 0);
        const { hour: endHour, min: endMin } = parseTimeFromConfig(config?.work_end_time, 18, 0);
        const checkInDate = buildDateWithTime(selectedDate, startHour, startMin);
        const checkOutDate = buildDateWithTime(selectedDate, endHour, endMin);

        if (checkOutDate <= checkInDate) {
            checkOutDate.setDate(checkOutDate.getDate() + 1);
        }

        setValue("check_in", toLocalDateTimeValue(checkInDate), { shouldValidate: true, shouldDirty: true });
        setValue("check_out", toLocalDateTimeValue(checkOutDate), { shouldValidate: true, shouldDirty: true });
    };

    const handleEmployeeChange = (e) => {
        const empId = e.target.value;
        setSelectedEmployeeId(empId);
        setValue("work_location_id", "");
        fillScheduleTimesForEmployee(empId);
    };

    const columns = [
        {
            label: "Employee",
            sortKey: "employee_name",
            sortValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim().toLowerCase(),
            searchValue: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim(),
            render: (row) => `${row.employees?.first_name || ""} ${row.employees?.last_name || ""}`.trim() || "-",
        },
        {
            label: "Date",
            sortKey: "check_in_date",
            sortValue: (row) => (row.check_in ? new Date(row.check_in).getTime() : 0),
            searchValue: (row) => row.check_in ? new Date(row.check_in).toISOString().split("T")[0] : "",
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
            searchValue: (row) => row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
            render: (row) => row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
        },
        {
            label: "Time Out",
            sortKey: "check_out_time",
            sortValue: (row) => {
                if (!row.check_out) return -1;
                const date = new Date(row.check_out);
                return date.getHours() * 60 + date.getMinutes();
            },
            searchValue: (row) => row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
            render: (row) => row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
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
