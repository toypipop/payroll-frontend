import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import MasterDataWarning from "../../components/common/MasterDataWarning";
import { Controller } from "react-hook-form";

// Validation schema for timelog form
const timeLogSchema = z.object({
    companies_id: z.string().min(1, "Please select a company"),
    employees_id: z.string().min(1, "Please select an employee"),
    check_in: z.string().min(1, "Check-in time is required"),
    check_out: z.string().optional().or(z.literal("")),
    work_location_id: z.coerce.number().min(1, "Please select a work location"),
    remark: z.string().optional(),
}).refine((data) => {
    if (data.check_in && data.check_out) {
        return data.check_out > data.check_in;
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

const minutesFromTime = ({ hour, min }) => (hour * 60) + min;

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
    const [masterCompanies, setMasterCompanies] = useState([]);
    const [masterEmployees, setMasterEmployees] = useState([]);
    const [masterWorkLocations, setMasterWorkLocations] = useState([]);
    const [employeeData, setEmployeeData] = useState({});
    const [attendanceConfigs, setAttendanceConfigs] = useState({});
    const [canManageAttendanceSettings, setCanManageAttendanceSettings] = useState(false);

    // Initialize form with hook form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        watch,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(timeLogSchema),
        defaultValues: {
            companies_id: "",
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
                const [empRes, locRes, schedRes, companyRes, modulesRes] = await Promise.all([
                    api.get("/employees"),
                    api.get("/master/work-locations/options").catch(() => ({ data: [] })),
                    api.get("/timelogs/schedule-config").catch(() => ({ data: [] })),
                    api.get("/companies/options"),
                    api.get("/modules").catch(() => ({ data: [] })),
                ]);
                setMasterCompanies((companyRes.data || []).map((c) => ({ id: c.id, name: c.name })));
                setMasterEmployees(
                    empRes.data.map((e) => ({
                        id: e.id,
                        name: `${e.employees_code} - ${e.first_name} ${e.last_name}`,
                        companies_id: e.companies_id,
                    }))
                );
                
                const empDataMap = {};
                empRes.data.forEach((e) => {
                    empDataMap[e.id] = e;
                });
                setEmployeeData(empDataMap);
                
                setMasterWorkLocations((locRes.data || []).map((l) => ({ 
                    id: l.id, 
                    name: l.name,
                    companies_id: l.companies_id 
                })));

                const configMap = {};
                (schedRes.data || []).forEach((c) => {
                    if (c.companies_id) {
                        configMap[c.companies_id] = c;
                    }
                });
                setAttendanceConfigs(configMap);

                const moduleKeys = [];
                const collectKeys = (items) => {
                    (items || []).forEach((m) => {
                        if (m.module_key) moduleKeys.push(m.module_key);
                        if (m.children) collectKeys(m.children);
                    });
                };
                collectKeys(modulesRes.data);
                setCanManageAttendanceSettings(moduleKeys.includes("AttendanceSettingsPage"));
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchTimeLogs();
    }, []);

    // Submit handler with time conversion
    const onSubmit = async (data) => {
        const cfg = data.companies_id ? attendanceConfigs[data.companies_id] : null;
        if (!(cfg && cfg.is_configured)) {
            alert("This company has no Attendance Config. Please set it up before saving.");
            return;
        }
        try {
            const payload = {
                ...data,
                check_in: data.check_in ? new Date(data.check_in).toISOString() : null,
                check_out: data.check_out ? new Date(data.check_out).toISOString() : null,
                employees_id: parseInt(data.employees_id),
                companies_id: parseInt(data.companies_id),
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
        setEditingId(log.id);
        setValue("companies_id", log.companies_id?.toString() || log.employees?.companies_id?.toString() || "");
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

    const selectedCompanyId = watch("companies_id");
    const filteredEmployees = selectedCompanyId
        ? masterEmployees.filter((emp) => String(emp.companies_id) === String(selectedCompanyId))
        : [];
    const selectedEmployeeCompaniesId = selectedCompanyId || (selectedEmployeeId
        ? employeeData[selectedEmployeeId]?.companies_id
        : null);
    
    const filteredWorkLocations = selectedEmployeeCompaniesId
        ? masterWorkLocations.filter((loc) =>
            !loc.companies_id || String(loc.companies_id) === String(selectedEmployeeCompaniesId)
        )
        : masterWorkLocations;

    const selectedCompanyConfig = selectedCompanyId ? attendanceConfigs[selectedCompanyId] : null;
    const showNoConfigWarning = !!selectedCompanyId && !(selectedCompanyConfig && selectedCompanyConfig.is_configured);
    const showNoWorkLocationsWarning = !!selectedEmployeeCompaniesId && filteredWorkLocations.length === 0;

    // Returns the configured schedule for a company, or null when that company
    // has no attendance config (so callers skip auto-filling times).
    const getScheduleConfig = (companiesId) => {
        const cfg = companiesId ? attendanceConfigs[companiesId] : null;
        return cfg && cfg.is_configured ? cfg : null;
    };

    const getScheduleDurationMinutes = (empId) => {
        const emp = employeeData[empId];
        const config = getScheduleConfig(emp?.companies_id);
        if (!config) return null;
        const { hour: startHour, min: startMin } = parseTimeFromConfig(config.work_start_time, 9, 0);
        const { hour: endHour, min: endMin } = parseTimeFromConfig(config.work_end_time, 18, 0);
        const startMinutes = minutesFromTime({ hour: startHour, min: startMin });
        const endMinutes = minutesFromTime({ hour: endHour, min: endMin });
        return endMinutes > startMinutes
            ? endMinutes - startMinutes
            : (24 * 60) - startMinutes + endMinutes;
    };

    const setCheckOutFromCheckIn = (checkInValue, empId = selectedEmployeeId) => {
        if (!checkInValue || !empId) return;

        const duration = getScheduleDurationMinutes(empId);
        if (duration == null) return; // no config → leave check-out as-is

        const checkInDate = new Date(checkInValue);
        if (Number.isNaN(checkInDate.getTime())) return;

        const checkOutDate = new Date(checkInDate);
        checkOutDate.setMinutes(checkOutDate.getMinutes() + duration);
        setValue("check_out", toLocalDateTimeValue(checkOutDate), { shouldValidate: true, shouldDirty: true });
    };

    const fillScheduleTimesForEmployee = (empId) => {
        if (!empId) {
            setValue("check_in", "");
            setValue("check_out", "");
            return;
        }

        const emp = employeeData[empId];
        const config = getScheduleConfig(emp?.companies_id);
        if (!config) {
            // Company has no attendance config → don't prefill times
            setValue("check_in", "");
            setValue("check_out", "");
            return;
        }

        const currentCheckIn = getValues("check_in");
        const selectedDate = currentCheckIn && !Number.isNaN(new Date(currentCheckIn).getTime())
            ? new Date(currentCheckIn)
            : new Date();

        selectedDate.setHours(0, 0, 0, 0);

        const { hour: startHour, min: startMin } = parseTimeFromConfig(config?.work_start_time, 9, 0);
        const { hour: endHour, min: endMin } = parseTimeFromConfig(config?.work_end_time, 18, 0);
        const checkInDate = buildDateWithTime(selectedDate, startHour, startMin);
        const checkOutDate = buildDateWithTime(selectedDate, endHour, endMin);
        const isOvernightShift = minutesFromTime({ hour: endHour, min: endMin }) <= minutesFromTime({ hour: startHour, min: startMin });

        if (isOvernightShift) {
            checkOutDate.setDate(checkOutDate.getDate() + 1);
        }

        setValue("check_in", toLocalDateTimeValue(checkInDate), { shouldValidate: true, shouldDirty: true });
        setValue("check_out", toLocalDateTimeValue(checkOutDate), { shouldValidate: true, shouldDirty: true });
    };

    const handleCheckInChange = (value) => {
        setValue("check_in", value, { shouldValidate: true, shouldDirty: true });
        setCheckOutFromCheckIn(value);
    };

    const handleEmployeeChange = (e) => {
        const empId = e.target.value;
        setSelectedEmployeeId(empId);
        setValue("employees_id", empId, { shouldValidate: true, shouldDirty: true });
        setValue("work_location_id", "", { shouldValidate: true, shouldDirty: true });
        fillScheduleTimesForEmployee(empId);
    };

    const handleCompanyChange = (e) => {
        setValue("companies_id", e.target.value, { shouldValidate: true, shouldDirty: true });
        setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
        setSelectedEmployeeId("");
        setValue("work_location_id", "", { shouldValidate: true, shouldDirty: true });
        setValue("check_in", "", { shouldValidate: true, shouldDirty: true });
        setValue("check_out", "", { shouldValidate: true, shouldDirty: true });
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
                        onClick={() => handleDelete(row.id)}
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
                            disabled={showNoConfigWarning || showNoWorkLocationsWarning}
                        >
                            {editingId ? "Update" : "Save"}
                        </Button>
                    </>
                }
            >
                {/* 5. Inputs for TimeLog (English Comment) */}

                <SelectField
                    label="Company"
                    options={masterCompanies}
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    onChange={(e) => {
                        handleCompanyChange(e);
                    }}
                />

                {showNoConfigWarning && (
                    <div style={warningBox}>
                        This company has no Attendance Config yet, so check-in/out
                        cannot be auto-filled and time logs cannot be saved.
                        {canManageAttendanceSettings && (
                            <>
                                {" "}
                                <Link to="/attendance-settings" style={warningLink}>
                                    Set it up
                                </Link>
                            </>
                        )}
                    </div>
                )}

                <SelectField
                    label="Employee"
                    options={filteredEmployees}
                    {...register("employees_id")}
                    error={errors.employees_id?.message}
                    onChange={(e) => {
                        handleEmployeeChange(e);
                    }}
                    disabled={!selectedCompanyId}
                />

                <Controller
                    control={control}
                    name="check_in"
                    render={({ field }) => (
                        <DateTimeField
                            label="Check In"
                            value={field.value}
                            onChange={handleCheckInChange}
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
                    label="Work Location"
                    options={filteredWorkLocations}
                    {...register("work_location_id")}
                    error={errors.work_location_id?.message}
                    disabled={!selectedEmployeeId}
                />
                {showNoWorkLocationsWarning && (
                    <MasterDataWarning
                        message="This company has no work locations yet."
                        routePath="/work-locations"
                        moduleKey="WorkLocationPage"
                    />
                )}

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

const warningBox = {
    margin: "0 0 16px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    fontSize: "13px",
    lineHeight: 1.5,
};

const warningLink = {
    color: "#92400e",
    fontWeight: 600,
    textDecoration: "underline",
};

export default TimelogsListPage;
