import { useCallback, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import NumberField from "../../../components/common/NumberField";
import SelectField from "../../../components/common/SelectField";
import CheckboxField from "../../../components/common/CheckboxField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";

// Validation schema for employee
const createEmployeesSchema = (isEditing, requireCompany) => z.object({
    employees_code: z.string().min(2, "Employees code is required"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    dept_id: z.string().min(1, "Please select a department"),
    pos_id: z.string().min(1, "Please select a position"),
    roles_id: z.string().min(1, "Please select a roles"),
    employment_type_id: z.coerce.number().optional().nullable(),
    companies_id: requireCompany
        ? z.string().min(1, "Please select a company")
        : z.string().optional(),
    is_active: z.boolean().default(true),
    password: isEditing
        ? z.string().optional().or(z.literal(""))
        : z.string().min(6, "Password must be at least 6 characters"),
    bank_id: z.string().optional(),
    account_name: z.string().optional(),
    account_no: z.string().optional(),
});

const makeEmptyEmployeeForm = (homeCompanyId: string) => ({
    employees_code: "",
    first_name: "",
    last_name: "",
    email: "",
    dept_id: "",
    pos_id: "",
    roles_id: "",
    employment_type_id: "",
    companies_id: homeCompanyId,
    is_active: true,
    password: "",
    bank_id: "",
    account_name: "",
    account_no: "",
});

// EmployeeFormModal owns the cascading company to department/position/role form and the save call.
const EmployeeFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, masterDepts, masterPos, masterRoles, masterCompanies, masterBanks, masterEmploymentTypes }) => {
    // Ref to skip cascade-reset during edit initialization
    const isEditLoading = useRef(false);
    // Refs for dynamic resolver
    const editingIdRef = useRef(null);
    const requireCompanyRef = useRef(false);

    const dynamicResolver = useCallback(
        (values, ctx, options) =>
            zodResolver(createEmployeesSchema(!!editingIdRef.current, requireCompanyRef.current))(
                values, ctx, options
            ),
        []
    );

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm({
        resolver: dynamicResolver,
        defaultValues: makeEmptyEmployeeForm(homeCompanyId),
    });

    // Watch selected company to drive cascading filter
    const selectedCompaniesId = watch("companies_id");

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        editingIdRef.current = editing?.id ?? null;
        if (!editing) {
            reset(makeEmptyEmployeeForm(homeCompanyId));
            return;
        }
        isEditLoading.current = true;
        reset({
            employees_code: editing.employees_code || "",
            first_name: editing.first_name || "",
            last_name: editing.last_name || "",
            email: editing.email || "",
            dept_id: editing.dept_id ? String(editing.dept_id) : "",
            pos_id: editing.pos_id ? String(editing.pos_id) : "",
            roles_id: editing.roles_id ? String(editing.roles_id) : "",
            companies_id: editing.companies_id ? String(editing.companies_id) : "",
            employment_type_id: editing.employment_type_id ? String(editing.employment_type_id) : "",
            is_active: editing.is_active === true || editing.is_active === "true",
            bank_id: editing.bank_id ? String(editing.bank_id) : "",
            account_name: editing.account_name || "",
            account_no: editing.account_no || "",
        });
        setTimeout(() => { isEditLoading.current = false; }, 0);
    }, [isOpen, editing, homeCompanyId, reset]);

    // Clear dependent fields on company change
    useEffect(() => {
        if (isEditLoading.current) return;
        if (masterCompanies.length > 0 && selectedCompaniesId) {
            setValue("dept_id", "");
            setValue("pos_id", "");
            setValue("roles_id", "");
            setValue("employment_type_id", "");
        }
    }, [selectedCompaniesId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Apply filters for super-admin only
    const filteredDepts = masterCompanies.length > 0 && selectedCompaniesId
        ? masterDepts.filter((d) => String(d.companies_id) === String(selectedCompaniesId))
        : masterDepts;
    const filteredPos = masterCompanies.length > 0 && selectedCompaniesId
        ? masterPos.filter((p) => String(p.companies_id) === String(selectedCompaniesId))
        : masterPos;
    const filteredRoles = masterCompanies.length > 0 && selectedCompaniesId
        ? masterRoles.filter((r) => String(r.companies_id) === String(selectedCompaniesId))
        : masterRoles;
    const filteredEmploymentTypes = masterCompanies.length > 0 && selectedCompaniesId
        ? masterEmploymentTypes.filter((t) => String(t.companies_id) === String(selectedCompaniesId))
        : masterEmploymentTypes;

    // Warn when the selected company has zero records for a required master type (e.g.
    const showNoDeptWarning = !!selectedCompaniesId && filteredDepts.length === 0;
    const showNoPosWarning = !!selectedCompaniesId && filteredPos.length === 0;
    const showNoRolesWarning = !!selectedCompaniesId && filteredRoles.length === 0;
    const hasMissingRequiredMaster = showNoDeptWarning || showNoPosWarning || showNoRolesWarning;

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                dept_id: parseInt(data.dept_id),
                pos_id: parseInt(data.pos_id),
                roles_id: parseInt(data.roles_id),
                companies_id: data.companies_id ? parseInt(data.companies_id) : undefined,
                employment_type_id: data.employment_type_id ? parseInt(data.employment_type_id) : null,
                bank_id: data.bank_id ? parseInt(data.bank_id) : null,
            };

            if (editing) {
                await api.put(`/employees/${editing.id}`, payload);
            } else {
                await api.post("/employees", payload);
            }

            onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Save Failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Employees" : "Add New Employees"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={hasMissingRequiredMaster}
                    >
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            {/* Companies — shown only for super-admin; drives cascade filter */}
            {masterCompanies.length > 0 && (
                <SelectField
                    label="Companies"
                    options={masterCompanies}
                    {...register("companies_id")}
                    value={watch("companies_id")}
                    error={errors.companies_id?.message}
                    disabled={!!editing}
                    required
                />
            )}

            <InputField
                label="Employees Code"
                {...register("employees_code")}
                error={errors.employees_code?.message}
                required
            />

            <InputField
                label="First Name"
                {...register("first_name")}
                error={errors.first_name?.message}
                required
            />

            <InputField
                label="Last Name"
                {...register("last_name")}
                error={errors.last_name?.message}
                required
            />

            <InputField
                label="Email Address"
                type="email"
                {...register("email")}
                error={errors.email?.message}
                required
            />

            <InputField
                label="Password"
                type="password"
                {...register("password")}
                error={errors.password?.message}
                placeholder={editing ? "Leave blank to keep same" : "Required (min 6 chars)"}
                required={!editing}
            />
            <SelectField
                label="Department"
                options={filteredDepts}
                {...register("dept_id")}
                value={watch("dept_id")}
                error={errors.dept_id?.message}
                disabled={!selectedCompaniesId}
                required
            />
            {showNoDeptWarning && (
                <MasterDataWarning
                    message="This company has no departments yet."
                    routePath="/departments"
                    moduleKey="DepartmentSettings"
                />
            )}

            <SelectField
                label="Position"
                options={filteredPos}
                {...register("pos_id")}
                value={watch("pos_id")}
                error={errors.pos_id?.message}
                disabled={!selectedCompaniesId}
                required
            />
            {showNoPosWarning && (
                <MasterDataWarning
                    message="This company has no positions yet."
                    routePath="/positions"
                    moduleKey="PositionSettings"
                />
            )}

            <SelectField
                label="System Roles"
                options={filteredRoles}
                {...register("roles_id")}
                value={watch("roles_id")}
                error={errors.roles_id?.message}
                disabled={!selectedCompaniesId}
                required
            />
            {showNoRolesWarning && (
                <MasterDataWarning
                    message="This company has no roles yet."
                    routePath="/roles"
                    moduleKey="RolesPage"
                />
            )}

            {masterEmploymentTypes.length > 0 && (
                <SelectField
                    label="Employment Type"
                    options={filteredEmploymentTypes}
                    {...register("employment_type_id")}
                    value={watch("employment_type_id")}
                    error={errors.employment_type_id?.message}
                    disabled={!selectedCompaniesId}
                />
            )}

            <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                    <CheckboxField
                        label="Account Active"
                        id="is_active"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        error={errors.is_active?.message}
                    />
                )}
            />

            {/* Bank Account Section */}
            <div className="border-t border-t-[color:var(--border-color,_var(--border-muted))] mt-[16px] pt-[16px]">
                <div className="text-[13px] font-semibold text-[color:var(--text-muted,_var(--text-muted))] mb-[10px] uppercase tracking-[0.05em]">
                    Bank Account
                </div>
                <SelectField
                    label="Bank"
                    options={masterBanks}
                    {...register("bank_id")}
                    value={watch("bank_id")}
                />
                <InputField
                    label="Account Name"
                    {...register("account_name")}
                />
                <NumberField
                    label="Account No."
                    value={watch("account_no") ?? ""}
                    onChange={(e) => setValue("account_no", e.target.value, { shouldDirty: true })}
                    onBlur={() => {}}
                />
            </div>
        </Modal>
    );
};

export default EmployeeFormModal;
