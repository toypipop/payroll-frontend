import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";
import { apiErrorMessage } from "../../../utils/apiError";
import type { Company, CycleDeduction, DeductionType, Employee } from "../../../types/domain";
import type { PayrollCycle } from "../../../types/api";

const schema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    cycle_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a payroll cycle")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    deduction_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a deduction type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

type CycleDeductionFormValues = z.infer<typeof schema>;

// CycleDeductionFormModal owns the cascading company to cycle to employee form and the save call.
interface CycleDeductionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editing: CycleDeduction | null;
    defaultCompanyId: string;
    defaultCycleId: string;
    companies: Company[];
    cycles: PayrollCycle[];
    employees: Employee[];
    deductionTypes: DeductionType[];
}

const CycleDeductionFormModal = ({ isOpen, onClose, onSaved, editing, defaultCompanyId, defaultCycleId, companies, cycles, employees, deductionTypes }: CycleDeductionFormModalProps) => {
    const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: defaultCompanyId, cycle_id: "", employees_id: "", deduction_type_id: "", amount: "" },
    });

    const watchedCompanyId = useWatch({ control, name: "companies_id" });
    const watchedCycleId = useWatch({ control, name: "cycle_id" });

    const filteredCycles = watchedCompanyId
        ? cycles.filter((c) => String(c.companies_id) === String(watchedCompanyId) && !c.is_closed)
        : [];
    const cycleCompanyId = cycles.find((c) => String(c.id) === String(watchedCycleId))?.companies_id || watchedCompanyId;

    const filteredEmployees = cycleCompanyId
        ? employees.filter((e) => String(e.companies_id) === String(cycleCompanyId))
        : [];

    const filteredDeductionTypes = cycleCompanyId
        ? deductionTypes.filter((dt) => String(dt.companies_id) === String(cycleCompanyId))
        : [];

    const showNoDeductionTypesWarning = !!watchedCycleId && filteredDeductionTypes.length === 0;
    const showNoEmployeesWarning = !!watchedCycleId && filteredEmployees.length === 0;

    const cycleField = register("cycle_id");
    const employeeField = register("employees_id");

    // Re-seed the form whenever the page opens the modal; Add inherits the company and cycle the page is filtered to.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                id: editing.id == null ? undefined : Number(editing.id),
                companies_id: editing.companies_id
                    || editing.employees?.companies_id
                    || cycles.find((c) => String(c.id) === String(editing.cycle_id))?.companies_id
                    || "",
                cycle_id: editing.cycle_id,
                employees_id: editing.employees_id,
                deduction_type_id: editing.deduction_type_id,
                amount: editing.amount,
            }
            : {
                id: undefined,
                companies_id: defaultCompanyId ? Number(defaultCompanyId) : "",
                cycle_id: defaultCycleId ? Number(defaultCycleId) : "",
                employees_id: "",
                deduction_type_id: "",
                amount: "",
            });
    }, [isOpen, editing, defaultCompanyId, defaultCycleId, cycles, reset]);

    const onSubmit = async (data: CycleDeductionFormValues) => {
        try {
            if (filteredEmployees.length === 0) {
                alert("This company has no employees. Please add one before saving.");
                return;
            }
            if (data.id) {
                await api.put(`/cycle-deductions/${data.id}`, data);
            } else {
                await api.post("/cycle-deductions", data);
            }
            await onSaved();
            onClose();
        } catch (err) {
            alert(apiErrorMessage(err, "Operation failed"));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Variable Deduction" : "Add Variable Deduction for Cycle"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))}
                        className="w-auto"
                        disabled={showNoDeductionTypesWarning || showNoEmployeesWarning}
                    >
                        {editing ? "Update" : "Save"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-[16px]">
                <SelectField
                    label="Company"
                    {...register("companies_id")}
                    error={errors.companies_id?.message}
                    onChange={(e) => {
                        setValue("companies_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("cycle_id", "", { shouldValidate: true, shouldDirty: true });
                        setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
                        setValue("deduction_type_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    options={companies.map((c) => ({ id: c.id, name: c.name }))}
                    disabled
                    required
                />
                <SelectField
                    label="Payroll Cycle"
                    {...cycleField}
                    error={errors.cycle_id?.message}
                    onChange={(e) => {
                        setValue("cycle_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
                        setValue("deduction_type_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    options={filteredCycles.map((c) => ({
                        id: c.id,
                        name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}`,
                    }))}
                    disabled={!!editing || !watchedCompanyId}
                    required
                />
                <SelectField
                    label="Employee"
                    {...employeeField}
                    error={errors.employees_id?.message}
                    onChange={(e) => {
                        setValue("employees_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                    }}
                    options={filteredEmployees.map((e) => ({
                        id: e.id,
                        name: `${e.employees_code} — ${e.first_name} ${e.last_name}`,
                    }))}
                    disabled={!watchedCycleId}
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
                    label="Deduction Type"
                    {...register("deduction_type_id")}
                    error={errors.deduction_type_id?.message}
                    options={filteredDeductionTypes.map((dt) => ({ id: dt.id, name: dt.name }))}
                    disabled={!watchedCycleId}
                    required
                />
                {showNoDeductionTypesWarning && (
                    <MasterDataWarning
                        message="This company has no deduction types yet."
                        routePath="/deduction-types"
                        moduleKey="DeductionTypesPage"
                    />
                )}
                <InputField
                    label="Amount (฿)"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("amount")}
                    error={errors.amount?.message}
                    required
                />
            </div>
        </Modal>
    );
};

export default CycleDeductionFormModal;
