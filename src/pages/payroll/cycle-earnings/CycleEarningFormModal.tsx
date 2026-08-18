import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "../../../api/axiosInstance";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import InputField from "../../../components/common/InputField";
import SelectField from "../../../components/common/SelectField";
import MasterDataWarning from "../../../components/common/MasterDataWarning";

const schema = z.object({
    id: z.number().optional(),
    companies_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a company")),
    cycle_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select a payroll cycle")),
    employees_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an employee")),
    earning_type_id: z.preprocess((val) => Number(val), z.number().min(1, "Please select an earning type")),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
});

// CycleEarningFormModal owns the cascading company to cycle to employee form and the save call.
const CycleEarningFormModal = ({ isOpen, onClose, onSaved, editing, defaultCompanyId, defaultCycleId, companies, cycles, employees, earningTypes }) => {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { companies_id: defaultCompanyId, cycle_id: "", employees_id: "", earning_type_id: "", amount: "" },
    });

    const watchedCompanyId = watch("companies_id");
    const watchedCycleId = watch("cycle_id");

    const filteredCycles = watchedCompanyId
        ? cycles.filter((c) => String(c.companies_id) === String(watchedCompanyId) && !c.is_closed)
        : [];
    const cycleCompanyId = cycles.find((c) => String(c.id) === String(watchedCycleId))?.companies_id || watchedCompanyId;

    const filteredEmployees = cycleCompanyId
        ? employees.filter((e) => String(e.companies_id) === String(cycleCompanyId))
        : [];

    const filteredEarningTypes = cycleCompanyId
        ? earningTypes.filter((et) => String(et.companies_id) === String(cycleCompanyId))
        : [];

    const showNoEarningTypesWarning = !!watchedCycleId && filteredEarningTypes.length === 0;
    const showNoEmployeesWarning = !!watchedCycleId && filteredEmployees.length === 0;

    const cycleField = register("cycle_id");
    const employeeField = register("employees_id");

    // Re-seed the form whenever the page opens the modal; Add inherits the company and cycle the page is filtered to.
    useEffect(() => {
        if (!isOpen) return;
        reset(editing
            ? {
                id: editing.id,
                companies_id: editing.companies_id
                    || editing.employees?.companies_id
                    || cycles.find((c) => String(c.id) === String(editing.cycle_id))?.companies_id
                    || "",
                cycle_id: editing.cycle_id,
                employees_id: editing.employees_id,
                earning_type_id: editing.earning_type_id,
                amount: editing.amount,
            }
            : {
                id: undefined,
                companies_id: defaultCompanyId ? Number(defaultCompanyId) : "",
                cycle_id: defaultCycleId ? Number(defaultCycleId) : "",
                employees_id: "",
                earning_type_id: "",
                amount: "",
            });
    }, [isOpen, editing, defaultCompanyId, defaultCycleId, cycles, reset]);

    const onSubmit = async (data) => {
        try {
            if (filteredEmployees.length === 0) {
                alert("This company has no employees. Please add one before saving.");
                return;
            }
            if (data.id) {
                await api.put(`/cycle-earnings/${data.id}`, data);
            } else {
                await api.post("/cycle-earnings", data);
            }
            await onSaved();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? "Edit Variable Earning" : "Add Variable Earning for Cycle"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit(onSubmit, (err) => console.log("Validation Errors:", err))}
                        className="w-auto"
                        disabled={showNoEarningTypesWarning || showNoEmployeesWarning}
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
                        setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    options={companies.map((c) => ({ id: c.id, name: c.name }))}
                    disabled={!editing}
                    required
                />
                <SelectField
                    label="Payroll Cycle"
                    {...cycleField}
                    error={errors.cycle_id?.message}
                    onChange={(e) => {
                        setValue("cycle_id", e.target.value, { shouldValidate: true, shouldDirty: true });
                        setValue("employees_id", "", { shouldValidate: true, shouldDirty: true });
                        setValue("earning_type_id", "", { shouldValidate: true, shouldDirty: true });
                    }}
                    options={filteredCycles.map((c) => ({
                        id: c.id,
                        name: `${c.cycle_name ?? `Cycle #${c.id}`}${c.companies?.name ? ` (${c.companies.name})` : ""} ${c.is_closed ? "· Closed" : "· Open"}`,
                    }))}
                    disabled={!watchedCompanyId || !editing}
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
                    label="Earning Type"
                    {...register("earning_type_id")}
                    error={errors.earning_type_id?.message}
                    options={filteredEarningTypes.map((et) => ({ id: et.id, name: et.name }))}
                    disabled={!watchedCycleId}
                    required
                />
                {showNoEarningTypesWarning && (
                    <MasterDataWarning
                        message="This company has no earning types yet."
                        routePath="/earning-types"
                        moduleKey="EarningTypesPage"
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

export default CycleEarningFormModal;
