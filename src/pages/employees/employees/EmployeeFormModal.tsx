import FormError from "../../../components/common/FormError";
import { textField, emailField } from "../../../utils/fieldValidation";
import { useCallback, useEffect, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { apiErrorMessage } from "../../../utils/apiError";
import type { Bank, Company, Department, Employee, EmploymentType, Position, Role } from "../../../types/domain";
import type { Resolver } from "react-hook-form";
import type { ApiId } from "../../../types/api";

const employeePasswordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(30, "Password must be at most 30 characters");

// Validation schema for employee
const createEmployeesSchema = (isEditing: boolean, requireCompany: boolean) => z.object({
    employees_code: textField("Employees code", 2, 100),
    first_name: textField("First name", 1),
    last_name: textField("Last name", 1),
    email: emailField,
    dept_id: z.string().min(1, "Please select a department"),
    pos_id: z.string().min(1, "Please select a position"),
    roles_id: z.string().min(1, "Please select a roles"),
    employment_type_id: z.coerce.number().optional().nullable(),
    companies_id: requireCompany
        ? z.string().min(1, "Please select a company")
        : z.string().optional(),
    is_active: z.boolean().default(true),
    password: isEditing
        ? employeePasswordSchema.optional().or(z.literal(""))
        : employeePasswordSchema,
    bank_id: z.string().optional(),
    account_name: textField("Account name", 0, 200).optional(),
    account_no: textField("Account number", 0, 50).optional(),
});

// What the fields hold, which is the schema's *input*: every select carries a string until zod coerces it.
type EmployeeFormValues = z.input<ReturnType<typeof createEmployeesSchema>>;

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
interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: Employee | null;
    homeCompanyId: string;
    masterDepts: Department[];
    masterPos: Position[];
    masterRoles: Role[];
    masterCompanies: Company[];
    masterBanks: Bank[];
    masterEmploymentTypes: EmploymentType[];
}

const EmployeeFormModal = ({ isOpen, onClose, onSaved, editing, homeCompanyId, masterDepts, masterPos, masterRoles, masterCompanies, masterBanks, masterEmploymentTypes }: EmployeeFormModalProps) => {
    // Refs for dynamic resolver
    const editingIdRef = useRef<ApiId | null>(null);
    const requireCompanyRef = useRef(false);

    // The schema depends on whether this is an edit and whether a company must be picked, so it is rebuilt per validation.
    const dynamicResolver: Resolver<EmployeeFormValues> = useCallback(
        (values, ctx, options) =>
            zodResolver(createEmployeesSchema(!!editingIdRef.current, requireCompanyRef.current))(
                values, ctx, options
            ),
        []
    );

    const {
        setError,
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<EmployeeFormValues>({
        resolver: dynamicResolver,
        defaultValues: makeEmptyEmployeeForm(homeCompanyId),
    });

    // Subscribe to the fields rendered or used by the company cascade.
    const [selectedCompaniesId, selectedDepartmentId, selectedPositionId, selectedRoleId, selectedEmploymentTypeId, selectedBankId] = useWatch({
        control,
        name: ["companies_id", "dept_id", "pos_id", "roles_id", "employment_type_id", "bank_id"],
    });

    // Re-seed the form whenever the page opens the modal, so Edit shows the row and Add shows an empty form.
    useEffect(() => {
        if (!isOpen) return;
        editingIdRef.current = editing?.id ?? null;
        if (!editing) {
            reset(makeEmptyEmployeeForm(homeCompanyId));
            return;
        }
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
            is_active: editing.is_active === true,
            bank_id: editing.bank_id ? String(editing.bank_id) : "",
            account_name: editing.account_name || "",
            account_no: editing.account_no || "",
        });
    }, [isOpen, editing, homeCompanyId, reset]);

    // Cascade only on user selection, never on an asynchronous edit reset.
    const companyField = register("companies_id");

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

    const onSubmit = async (data: EmployeeFormValues) => {
        try {
            const payload = {
                ...data,
                dept_id: Number(data.dept_id),
                pos_id: Number(data.pos_id),
                roles_id: Number(data.roles_id),
                companies_id: data.companies_id ? Number(data.companies_id) : undefined,
                employment_type_id: data.employment_type_id ? Number(data.employment_type_id) : null,
                bank_id: data.bank_id ? Number(data.bank_id) : null,
            };

            if (editing) {
                await api.put(`/employees/${editing.id}`, payload);
            } else {
                await api.post("/employees", payload);
            }

            onSaved();
            onClose();
        } catch (err) {
            setError("root", { message: apiErrorMessage(err, "Save Failed") });
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
                        disabled={isSubmitting || hasMissingRequiredMaster}
                    >
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <FormError message={errors.root?.message} />
            {/* Companies — shown only for super-admin; drives cascade filter */}
            {masterCompanies.length > 0 && (
                <SelectField
                    label="Companies"
                    options={masterCompanies}
                    {...companyField}
                    onChange={(event) => {
                        void companyField.onChange(event);
                        if (event.target.value === selectedCompaniesId) return;
                        setValue("dept_id", "", { shouldDirty: true });
                        setValue("pos_id", "", { shouldDirty: true });
                        setValue("roles_id", "", { shouldDirty: true });
                        setValue("employment_type_id", "", { shouldDirty: true });
                    }}
                    value={selectedCompaniesId}
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
                placeholder={editing ? "Leave blank to keep same" : "Required (6-30 chars)"}
                required={!editing}
            />
            <SelectField
                label="Department"
                options={filteredDepts}
                {...register("dept_id")}
                value={selectedDepartmentId}
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
                value={selectedPositionId}
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
                value={selectedRoleId}
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
                    value={selectedEmploymentTypeId}
                    error={errors.employment_type_id?.message}
                    disabled={!selectedCompaniesId}
                />
            )}

            <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                    <CheckboxField
                        label="Employee Active (login and new transactions)"
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
                    value={selectedBankId}
                />
                <InputField
                    label="Account Name"
                    {...register("account_name")}
                    error={errors.account_name?.message}
                />
                <Controller
                    name="account_no"
                    control={control}
                    render={({ field, fieldState }) => (
                        <NumberField
                            {...field}
                            label="Account No."
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            error={fieldState.error?.message}
                        />
                    )}
                />
            </div>
        </Modal>
    );
};

export default EmployeeFormModal;
