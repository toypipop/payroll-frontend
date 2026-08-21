import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import SelectField from "../../../components/common/SelectField";
import CheckboxField from "../../../components/common/CheckboxField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";

const accessSchema = z.object({
    employee_id: z.string().min(1, "Please select an employee"),
    company_id: z.string().min(1, "Please select a company"),
    role_id: z.string().min(1, "Please select a role"),
    is_active: z.boolean().default(true),
});

const EMPTY_FORM = {
    employee_id: "",
    company_id: "",
    role_id: "",
    is_active: true,
};

// AccessFormModal owns the cascading employee to company to role form and the save call; the page only says which row is being edited.
const AccessFormModal = ({ isOpen, onClose, onSaved, editing, employees, companies, roles }) => {
    const {
        control,
        handleSubmit,
        register,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(accessSchema),
        defaultValues: EMPTY_FORM,
    });

    const selectedCompanyId = watch("company_id");
    const selectedEmployeeId = watch("employee_id");
    const selectedRoleId = watch("role_id");

    const filteredRoles = useMemo(() => {
        if (!selectedCompanyId) return [];
        return roles.filter((role) => String(role.companies_id) === String(selectedCompanyId));
    }, [roles, selectedCompanyId]);

    const showNoRolesWarning = !!selectedCompanyId && filteredRoles.length === 0;
    const showNoEmployeesWarning = employees.length === 0;

    const selectedEmployeeName = useMemo(() => {
        const employee = employees.find((item) => String(item.id) === String(selectedEmployeeId));
        return employee?.name || "";
    }, [employees, selectedEmployeeId]);

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                employee_id: editing.employee_id ? String(editing.employee_id) : "",
                company_id: editing.company_id ? String(editing.company_id) : "",
                role_id: editing.role_id ? String(editing.role_id) : "",
                is_active: editing.is_active !== false,
            }
            : EMPTY_FORM);
    }, [isOpen, editing, reset]);

    // A role belongs to one company, so changing the company clears a selection the new company cannot honour.
    useEffect(() => {
        const selectedRoleStillValid = filteredRoles.some((role) => String(role.id) === String(selectedRoleId));
        if (!selectedRoleStillValid) {
            setValue("role_id", "", { shouldValidate: true, shouldDirty: true });
        }
    }, [filteredRoles, selectedRoleId, setValue]);

    const onSubmit = async (data) => {
        try {
            if (employees.length === 0) {
                alert("There are no employees yet. Please add one before saving.");
                return;
            }
            const payload = {
                employee_id: Number(data.employee_id),
                company_id: Number(data.company_id),
                role_id: Number(data.role_id),
                is_active: data.is_active,
            };

            if (editing) {
                await api.put(`/employee-company-access/${editing.id}`, payload);
            } else {
                await api.post("/employee-company-access", payload);
            }

            await onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Save failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Company Access" : "Add Company Access"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={showNoRolesWarning || showNoEmployeesWarning}>
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <SelectField
                label="Employee"
                options={employees}
                {...register("employee_id")}
                value={watch("employee_id")}
                error={errors.employee_id?.message}
                onChange={(e) => {
                    setValue("employee_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                    setValue("company_id", "", { shouldValidate: true, shouldDirty: true });
                    setValue("role_id", "", { shouldValidate: true, shouldDirty: true });
                }}
                disabled={!!editing}
                required
            />
            {showNoEmployeesWarning && (
                <MasterDataWarning
                    message="There are no employees yet."
                    routePath="/employees"
                    moduleKey="EmployeesListPage"
                />
            )}

            <SelectField
                label="Company"
                options={companies}
                {...register("company_id")}
                value={watch("company_id")}
                error={errors.company_id?.message}
                onChange={(e) => {
                    setValue("company_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                    setValue("role_id", "", { shouldValidate: true, shouldDirty: true });
                }}
                disabled={!!editing || !selectedEmployeeId}
                required
            />

            <SelectField
                label="Role"
                options={filteredRoles}
                {...register("role_id")}
                value={watch("role_id")}
                error={errors.role_id?.message}
                onChange={(e) => {
                    setValue("role_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                }}
                disabled={!selectedCompanyId}
                required
            />
            {showNoRolesWarning && (
                <MasterDataWarning
                    message="This company has no roles yet."
                    routePath="/roles"
                    moduleKey="RolesPage"
                />
            )}

            {selectedEmployeeName && (
                <div className="m-[0_0_18px] p-[10px_12px] rounded-[8px] bg-surface text-muted text-[13px] border border-line-muted">
                    {selectedEmployeeName}
                </div>
            )}

            <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                    <CheckboxField
                        label="Access active"
                        id="is_active"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        error={errors.is_active?.message}
                    />
                )}
            />
        </Modal>
    );
};

export default AccessFormModal;
