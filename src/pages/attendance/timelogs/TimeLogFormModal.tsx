import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import DateTimeField from "../../../components/common/DateTimeField";
import SelectField from "../../../components/common/SelectField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";
import {
    buildDateWithTime,
    minutesFromTime,
    parseTimeFromConfig,
    parseToLocalDateTimeValue,
    toLocalDateTimeValue,
} from "./scheduleHelpers";
import { warningBox, warningLink } from "./warningStyles";
import { bangkokLocalToISO } from "../../../utils/bangkokTime";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Employee, OptionRow, ScheduleConfig, TimeLog } from "../../../types/domain";
import type { ApiId } from "../../../types/api";



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

type TimeLogFormValues = z.infer<typeof timeLogSchema>;



interface TimeLogFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: TimeLog | null;
    homeCompanyId: string;
    masterCompanies: OptionRow[];
    masterEmployees: OptionRow[];
    masterWorkLocations: OptionRow[];
    // Keyed by employee id and company id, as useTimelogs builds them.
    employeeData: Record<string, Employee>;
    attendanceConfigs: Record<string, ScheduleConfig>;
    dayOffWeekdaysByCompany: Record<string, number[]>;
    canManageAttendanceSettings: boolean;
}

// TimeLogFormModal owns the manual entry form: the cascade, the schedule auto-fill, and the save call.
const TimeLogFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, masterCompanies, masterEmployees, masterWorkLocations, employeeData, attendanceConfigs, dayOffWeekdaysByCompany, canManageAttendanceSettings }: TimeLogFormModalProps) => {
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
            companies_id: homeCompanyId,
            employees_id: "",
            check_in: "",
            check_out: "",
            work_location_id: "",
            remark: "",
        },
    });


    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        if (!editing) {
            reset({ companies_id: homeCompanyId, employees_id: "", check_in: "", check_out: "", work_location_id: "", remark: "" });
            return;
        }
        reset({
            companies_id: editing.companies_id?.toString() || editing.employees?.companies_id?.toString() || "",
            employees_id: editing.employees_id?.toString(),
            check_in: parseToLocalDateTimeValue(editing.check_in),
            check_out: parseToLocalDateTimeValue(editing.check_out),
            work_location_id: editing.work_location_id?.toString() || "",
            remark: editing.remark || "",
        });
    }, [isOpen, editing, homeCompanyId, reset]);

    const selectedCompanyId = useWatch({ control, name: "companies_id" });
    const selectedEmployeeId = useWatch({ control, name: "employees_id" }) ?? "";
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

    const selectedCompanyConfig = selectedCompanyId ? attendanceConfigs[String(selectedCompanyId)] : null;
    const showNoConfigWarning = !!selectedCompanyId && !(selectedCompanyConfig && selectedCompanyConfig.is_configured);
    const showNoWorkLocationsWarning = !!selectedEmployeeCompaniesId && filteredWorkLocations.length === 0;
    const showNoDayOffsWarning = !!selectedCompanyId && (dayOffWeekdaysByCompany[String(selectedCompanyId)] || []).length === 0;
    const showNoEmployeesWarning = !!selectedCompanyId && filteredEmployees.length === 0;

    // Bulk Add derived state


    // Returns the configured schedule for a company, or null when that company has no attendance config (so callers skip auto-filling times).
    const getScheduleConfig = (companiesId?: ApiId | null) => {
        const cfg = companiesId ? attendanceConfigs[String(companiesId)] : null;
        return cfg && cfg.is_configured ? cfg : null;
    };

    const getScheduleDurationMinutes = (empId: string) => {
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

    const setCheckOutFromCheckIn = (checkInValue: string, empId: string = selectedEmployeeId) => {
        if (!checkInValue || !empId) return;

        const duration = getScheduleDurationMinutes(empId);
        if (duration == null) return; // no config → leave check-out as-is

        const checkInDate = new Date(checkInValue);
        if (Number.isNaN(checkInDate.getTime())) return;

        const checkOutDate = new Date(checkInDate);
        checkOutDate.setMinutes(checkOutDate.getMinutes() + duration);
        setValue("check_out", toLocalDateTimeValue(checkOutDate), { shouldValidate: true, shouldDirty: true });
    };

    const fillScheduleTimesForEmployee = (empId: string) => {
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

    const handleCheckInChange = (value: string) => {
        setValue("check_in", value, { shouldValidate: true, shouldDirty: true });
        setCheckOutFromCheckIn(value);
    };

    const handleEmployeeChange = (e: { target: { value: string } }) => {
        const empId = e.target.value;
        setValue("employees_id", empId, { shouldValidate: true, shouldDirty: true });
        setValue("work_location_id", "", { shouldValidate: true, shouldDirty: true });
        fillScheduleTimesForEmployee(empId);
    };

    const handleCompanyChange = (e: { target: { value: string } }) => {
        setValue("companies_id", e.target.value, { shouldValidate: true, shouldDirty: true });
        setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
        setValue("work_location_id", "", { shouldValidate: true, shouldDirty: true });
        setValue("check_in", "", { shouldValidate: true, shouldDirty: true });
        setValue("check_out", "", { shouldValidate: true, shouldDirty: true });
    };


    const onSubmit = async (data: TimeLogFormValues) => {
        const cfg = data.companies_id ? attendanceConfigs[data.companies_id] : null;
        if (!(cfg && cfg.is_configured)) {
            alert("This company has no Attendance Config. Please set it up before saving.");
            return;
        }
        if (data.companies_id && (dayOffWeekdaysByCompany[data.companies_id] || []).length === 0) {
            alert("This company has no day-offs configured. Please set it up before saving.");
            return;
        }
        if (data.companies_id && filteredEmployees.length === 0) {
            alert("This company has no employees. Please add one before saving.");
            return;
        }
        try {
            const payload = {
                ...data,
                check_in: bangkokLocalToISO(data.check_in),
                check_out: bangkokLocalToISO(data.check_out),
                employees_id: Number(data.employees_id),
                companies_id: Number(data.companies_id),
                work_location_id: data.work_location_id ? Number(data.work_location_id) : null,
            };

            if (editing) {
                await api.put(`/timelogs/${editing.id}`, payload);
            } else {
                await api.post("/timelogs", payload);
            }
            onSaved();
            onClose();
        } catch (err) {
            alert(apiErrorMessage(err, "Save Failed"));
        }
    };

    return (
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    title={editing ? "Edit Time Log" : "Add Manual Time Log"}
                    footer={
                        <>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit(onSubmit)}
                                disabled={showNoConfigWarning || showNoWorkLocationsWarning || showNoDayOffsWarning || showNoEmployeesWarning}
                            >
                                {editing ? "Update" : "Save"}
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
                        required
                        disabled={!!editing}
                    />

                    {showNoConfigWarning && (
                        <div className={warningBox}>
                            This company has no Attendance Config yet, so check-in/out
                            cannot be auto-filled and time logs cannot be saved.
                            {canManageAttendanceSettings && (
                                <>
                                    {" "}
                                    <Link to="/attendance-settings" target="_blank" rel="noopener noreferrer" className={warningLink}>
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
                        required
                    />
                    {showNoEmployeesWarning && (
                        <MasterDataWarning
                            message="This company has no employees yet."
                            routePath="/employees"
                            moduleKey="EmployeesListPage"
                        />
                    )}

                    <Controller
                        control={control}
                        name="check_in"
                        render={({ field }) => (
                            <DateTimeField
                                label="Check In"
                                value={field.value}
                                onChange={handleCheckInChange}
                                error={errors.check_in?.message}
                                required
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

                    {showNoDayOffsWarning && (
                        <MasterDataWarning
                            message="This company has no day-offs configured yet."
                            routePath="/day-offs"
                            moduleKey="DayOffPage"
                        />
                    )}

                    <SelectField
                        label="Work Location"
                        options={filteredWorkLocations}
                        {...register("work_location_id")}
                        error={errors.work_location_id?.message}
                        disabled={!selectedEmployeeId}
                        required
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
    );
};

export default TimeLogFormModal;
