import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";
import DateField from "../../../components/common/DateField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";

// Validation schema for leave requests
const leaveSchema = z.object({
    companies_id: z.string().min(1, "Please select a company"),
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

const emptyForm = (homeCompanyId: string) => ({
    companies_id: homeCompanyId,
    employees_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
});

// LeaveRequestFormModal owns the cascading company to employee to leave-type form and the save call.
const LeaveRequestFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, masterCompanies, masterEmployees, masterLeaveTypes, employeeData }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(leaveSchema),
        defaultValues: emptyForm(homeCompanyId),
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Create shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        if (!editing) {
            setSelectedEmployeeId("");
            reset(emptyForm(homeCompanyId));
            return;
        }
        setSelectedEmployeeId(editing.employees_id?.toString() || "");
        reset({
            companies_id: editing.companies_id?.toString() || editing.employees?.companies_id?.toString() || "",
            employees_id: editing.employees_id?.toString() || "",
            leave_type_id: editing.leave_type_id?.toString() || "",
            start_date: editing.start_date ? editing.start_date.split("T")[0] : "",
            end_date: editing.end_date ? editing.end_date.split("T")[0] : "",
            reason: editing.reason || "",
        });
    }, [isOpen, editing, homeCompanyId, reset]);

    const selectedCompanyId = watch("companies_id");
    const filteredEmployees = selectedCompanyId
        ? masterEmployees.filter((emp) => String(emp.companies_id) === String(selectedCompanyId))
        : [];
    const selectedEmployeeCompaniesId = selectedCompanyId || (selectedEmployeeId
        ? employeeData[selectedEmployeeId]?.companies_id
        : null);

    const filteredLeaveTypes = selectedEmployeeCompaniesId
        ? masterLeaveTypes.filter((lt) =>
            !lt.companies_id || String(lt.companies_id) === String(selectedEmployeeCompaniesId)
        )
        : masterLeaveTypes;

    const showNoLeaveTypesWarning = !!selectedEmployeeCompaniesId && filteredLeaveTypes.length === 0;
    const showNoEmployeesWarning = !!selectedCompanyId && filteredEmployees.length === 0;

    const handleEmployeeChange = (e) => {
        const empId = e.target.value;
        setSelectedEmployeeId(empId);
        setValue("employees_id", empId, { shouldValidate: true, shouldDirty: true });
        setValue("leave_type_id", "", { shouldValidate: true, shouldDirty: true });
    };
    const handleLeaveTypeChange = (e) => {
        setValue("leave_type_id", e.target.value, { shouldValidate: true, shouldDirty: true });
    };
    const handleCompanyChange = (e) => {
        setValue("companies_id", e.target.value, { shouldValidate: true, shouldDirty: true });
        setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
        setSelectedEmployeeId("");
        setValue("leave_type_id", "", { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (data) => {
        try {
            const employeeId = Number(data.employees_id);
            const leaveTypeId = Number(data.leave_type_id);
            const companyId = Number(data.companies_id);
            const selectedLeaveType = masterLeaveTypes.find((lt) => String(lt.id) === String(data.leave_type_id));

            if (!Number.isFinite(employeeId) || employeeId <= 0) {
                alert("Please select an employee");
                return;
            }

            if (filteredEmployees.length === 0) {
                alert("This company has no employees. Please add one before saving.");
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
                companies_id: companyId,
                start_date: `${data.start_date}T00:00:00Z`,
                end_date: `${data.end_date}T00:00:00Z`,
            };

            if (editing) {
                await api.put(`/leaves/requests/${editing.id}`, payload);
            } else {
                await api.post("/leaves/requests", payload);
            }
            onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Operation Failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Leave Request" : "New Leave Request"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} style={{ width: "auto" }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        style={{ width: "auto" }}
                        disabled={showNoLeaveTypesWarning || showNoEmployeesWarning}
                    >
                        {editing ? "Update" : "Submit"}
                    </Button>
                </>
            }
        >
            <SelectField
                label="Company"
                options={masterCompanies}
                {...register("companies_id")}
                error={errors.companies_id?.message}
                onChange={handleCompanyChange}
                required
            />

            <SelectField
                label="Employee"
                options={filteredEmployees}
                {...register("employees_id")}
                error={errors.employees_id?.message}
                onChange={handleEmployeeChange}
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

            <SelectField
                label="Leave Type"
                options={filteredLeaveTypes}
                {...register("leave_type_id")}
                error={errors.leave_type_id?.message}
                onChange={handleLeaveTypeChange}
                disabled={!selectedEmployeeId}
                required
            />
            {showNoLeaveTypesWarning && (
                <MasterDataWarning
                    message="This company has no leave types yet."
                    routePath="/leave-types"
                    moduleKey="MasterLeaveTypePage"
                />
            )}

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
                            required
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
                            required
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
    );
};

export default LeaveRequestFormModal;
